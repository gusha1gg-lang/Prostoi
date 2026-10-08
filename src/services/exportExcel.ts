import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import type { ConsolidatedDowntime } from '../types';
import { getShopShortName } from '../data/shops';
import { formatDuration } from './dataSource';

export async function exportToExcel(downtimes: ConsolidatedDowntime[]) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Портал учёта простоев ОМК-ИТ';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Сводные простои');

  // Header row
  sheet.columns = [
    { header: 'ID', key: 'id', width: 6 },
    { header: 'Название', key: 'title', width: 25 },
    { header: 'Дата', key: 'date', width: 12 },
    { header: 'Цех', key: 'shop', width: 20 },
    { header: 'Участок', key: 'section', width: 20 },
    { header: 'Кол-во записей', key: 'records', width: 15 },
    { header: 'Общая длительность', key: 'duration', width: 20 },
    { header: 'Статус', key: 'status', width: 18 },
  ];

  // Style header
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, size: 11 };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF4472C4' },
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

  // Data
  const STATUS_LABELS: Record<string, string> = {
    new: 'Новый',
    in_progress: 'В работе',
    resolved: 'Решён',
    out_of_scope: 'Вне зоны ОМК-ИТ',
  };

  downtimes.forEach((d, i) => {
    sheet.addRow({
      id: i + 1,
      title: d.title,
      date: new Date(d.date).toLocaleDateString('ru-RU'),
      shop: getShopShortName(d.shop),
      section: d.section,
      records: d.records.length,
      duration: formatDuration(d.totalDuration),
      status: STATUS_LABELS[d.status] || d.status,
    });
  });

  // Add detail sheets
  downtimes.forEach((d) => {
    const detailSheet = workbook.addWorksheet(`Детализация - ${getShopShortName(d.shop)}`.substring(0, 31));
    detailSheet.columns = [
      { header: '№', key: 'num', width: 5 },
      { header: 'Начало', key: 'start', width: 18 },
      { header: 'Конец', key: 'end', width: 18 },
      { header: 'Длительность (мин)', key: 'duration', width: 18 },
      { header: 'Причина', key: 'reason', width: 30 },
      { header: 'Примечание', key: 'note', width: 25 },
      { header: 'Агрегат', key: 'aggregate', width: 20 },
      { header: 'Участок', key: 'section', width: 20 },
      { header: 'Ответственный', key: 'responsible', width: 20 },
      { header: 'Цех', key: 'shop', width: 25 },
    ];

    const dHeader = detailSheet.getRow(1);
    dHeader.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    dHeader.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' },
    };

    d.records.forEach((r, i) => {
      detailSheet.addRow({
        num: i + 1,
        start: new Date(r.startTime).toLocaleString('ru-RU'),
        end: new Date(r.endTime).toLocaleString('ru-RU'),
        duration: r.duration,
        reason: r.reason,
        note: r.note,
        aggregate: r.aggregate,
        section: r.section,
        responsible: r.responsible,
        shop: r.shop,
      });
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Простои_ДИТ_${new Date().toISOString().split('T')[0]}.xlsx`);
}
