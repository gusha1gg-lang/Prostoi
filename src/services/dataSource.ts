import type { DowntimeRecord, Shop, ConsolidatedDowntime, GroupingMode, DowntimeStatus } from '../types';
import { v4 as uuid } from 'uuid';
import { SHOPS, getShopShortName } from '../data/shops';
import { generateMockRecords } from '../data/mockData';

// === Абстракция источника данных ===

export interface DataSource {
  getDowntimeRecords(from: Date, to: Date, shop?: string): Promise<DowntimeRecord[]>;
  getShops(): Promise<Shop[]>;
  testConnection(): Promise<boolean>;
}

// === Реализация: вымышленные данные ===

class MockDataSource implements DataSource {
  private cache: DowntimeRecord[] | null = null;

  private ensureCache(): DowntimeRecord[] {
    if (!this.cache) {
      const from = new Date();
      from.setMonth(from.getMonth() - 3);
      const to = new Date();
      this.cache = generateMockRecords(from, to, 200);
    }
    return this.cache;
  }

  async getDowntimeRecords(from: Date, to: Date, shop?: string): Promise<DowntimeRecord[]> {
    // Имитация задержки сети
    await new Promise((r) => setTimeout(r, 300));
    const all = this.ensureCache();
    return all.filter((r) => {
      const d = new Date(r.startTime);
      if (d < from || d > to) return false;
      if (shop && r.shop !== shop) return false;
      return true;
    });
  }

  async getShops(): Promise<Shop[]> {
    await new Promise((r) => setTimeout(r, 100));
    return SHOPS;
  }

  async testConnection(): Promise<boolean> {
    await new Promise((r) => setTimeout(r, 200));
    return true;
  }
}

// === Фабрика источника данных ===

export function createDataSource(): DataSource {
  const mode = import.meta.env.VITE_DATA_SOURCE || 'mock';
  if (mode === 'saarc') {
    // На этапе 2 здесь будет SAARCDataSource
    console.warn('SAARC source not implemented yet, falling back to mock');
    return new MockDataSource();
  }
  return new MockDataSource();
}

// === Группировка записей в сводные простои ===

export function groupRecords(
  records: DowntimeRecord[],
  mode: GroupingMode
): ConsolidatedDowntime[] {
  if (records.length === 0) return [];

  if (mode === 'all-in-one') {
    const allRecords = records;
    const totalDuration = allRecords.reduce((s, r) => s + r.duration, 0);
    const date = allRecords.length > 0 ? allRecords[0].startTime : new Date().toISOString();
    return [
      {
        id: uuid(),
        title: 'Сводный простой',
        date: date.split('T')[0],
        shop: allRecords[0]?.shop || '',
        section: allRecords[0]?.section || '',
        records: allRecords,
        totalDuration,
        status: 'new' as DowntimeStatus,
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  }

  // По цехам: ключ = shop + title
  const groups = new Map<string, DowntimeRecord[]>();
  for (const r of records) {
    const key = `${r.shop}|||${r.title}`;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key)!.push(r);
  }

  return Array.from(groups.entries()).map(([key, recs]) => {
    const [shop, title] = key.split('|||');
    const totalDuration = recs.reduce((s, r) => s + r.duration, 0);
    const date = recs.length > 0 ? recs[0].startTime : new Date().toISOString();
    return {
      id: uuid(),
      title: title || 'Сводный простой',
      date: date.split('T')[0],
      shop,
      section: recs[0]?.section || '',
      records: recs,
      totalDuration,
      status: 'new' as DowntimeStatus,
      participants: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  });
}

// === Утилита форматирования ===

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} мин`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

export function formatShopName(fullName: string): string {
  return getShopShortName(fullName);
}
