import { v4 as uuid } from 'uuid';
import type { DowntimeRecord, User, ConsolidatedDowntime, IncidentInvestigation, ChatMessage, Notification, AuditLog, AttachedFile } from '../types';
import { SHOPS } from './shops';

// === Генератор вымышленных данных ===

const REASONS = [
  'Сбой сетевого оборудования',
  'Отказ сервера приложений',
  'Обновление ПО с ошибкой',
  'Потеря связи с контроллером',
  'Сбой системы видеонаблюдения',
  'Отказ источника бесперебойного питания',
  'Ошибка конфигурации коммутатора',
  'Перегрузка канала связи',
  'Сбой в работе 1С',
  'Неисправность рабочего места',
  'Проблема с лицензированием ПО',
  'Сбой базы данных',
  'Аварийное отключение электроэнергии',
  'Плановые работы с задержкой',
  'Кибератака / вирусная активность',
];

const SECTIONS = [
  'Участок А', 'Участок Б', 'Участок В', 'Участок Г',
  'Диспетчерская', 'Серверная', 'Центр управления',
  'Участок прокатки', 'Участок термообработки',
];

const AGGREGATES = [
  'Стан-2000', 'Агрегат ГН-3', 'Печь №5', 'Машина непрерывного литья',
  'Прокатный стан', 'Термоагрегат', 'Кислотная линия', 'Стан холодной прокатки',
  'Сервер SRV-01', 'Коммутатор CISCO-3750', 'Контроллер SCADA-3',
];

const RESPONSIBLES = [
  'Иванов И.И.', 'Петров П.П.', 'Сидоров С.С.', 'Козлов К.К.',
  'Новиков Н.Н.', 'Морозов М.М.', 'Волков В.В.', 'Соколов С.А.',
  'Лебедев Л.Л.', 'Кузнецов К.А.',
];

const TITLES = [
  'Сводный простой', 'Инцидент ИТ', 'Сбой инфраструктуры',
  'Отказ оборудования', 'Проблема связи',
];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDateInRange(from: Date, to: Date): Date {
  const diff = to.getTime() - from.getTime();
  return new Date(from.getTime() + Math.random() * diff);
}

export function generateMockRecords(from: Date, to: Date, count: number = 150): DowntimeRecord[] {
  const records: DowntimeRecord[] = [];

  for (let i = 0; i < count; i++) {
    const startTime = randomDateInRange(from, to);
    const duration = randomInt(5, 480); // 5 мин — 8 часов
    const endTime = new Date(startTime.getTime() + duration * 60 * 1000);
    const shop = randomItem(SHOPS);

    records.push({
      id: uuid(),
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration,
      shop: shop.fullName,
      section: randomItem(SECTIONS),
      aggregate: randomItem(AGGREGATES),
      reason: randomItem(REASONS),
      note: Math.random() > 0.5 ? 'Требуется дополнительный анализ' : '',
      responsible: randomItem(RESPONSIBLES),
      service: 'ДИТ',
      title: randomItem(TITLES),
      sourceId: `SAARC-${String(i + 1).padStart(5, '0')}`,
    });
  }

  return records.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
}

// === Мок-пользователи ===

export const MOCK_USERS: User[] = [
  {
    id: 'admin-1',
    login: 'admin',
    passwordHash: 'admin123', // в реальности — хеш
    fullName: 'Администров Администр Администрович',
    position: 'Администратор системы',
    department: 'ОМК-ИТ',
    email: 'admin@omk-it.ru',
    role: 'admin',
  },
  {
    id: 'user-1',
    login: 'ivanov',
    passwordHash: 'ivanov123',
    fullName: 'Иванов Иван Иванович',
    position: 'Инженер',
    department: 'ОМК-ИТ',
    email: 'ivanov@omk-it.ru',
    role: 'responsible',
  },
  {
    id: 'user-2',
    login: 'petrov',
    passwordHash: 'petrov123',
    fullName: 'Петров Пётр Петрович',
    position: 'Специалист',
    department: 'ОМК-ИТ',
    email: 'petrov@omk-it.ru',
    role: 'user',
  },
];

// === Генератор разбора инцидента ===

export function generateMockInvestigation(downtimeId: string): IncidentInvestigation {
  return {
    id: uuid(),
    downtimeId,
    investigationNumber: `ДИТ-${new Date().getFullYear()}-${randomInt(1, 999)}`,
    incidentLevel: randomInt(1, 4),
    date: new Date().toISOString(),
    actualDuration: randomInt(30, 600),
    incidentDescription: 'Сбой в работе сетевого оборудования, повлёкший остановку производственного процесса.',
    productionDowntimes: [
      { shop: 'ТЭСЦ-1', duration: randomInt(30, 120), note: 'Полная остановка линии' },
      { shop: 'ТЭСЦ-2', duration: randomInt(15, 60), note: 'Частичная задержка' },
    ],
    shipmentDowntimes: [
      { destination: 'Склад готовой продукции', duration: randomInt(20, 90), note: 'Задержка отгрузки' },
    ],
    immediateCauses: [
      'Отказ коммутационного оборудования',
      'Некорректная работа резервного канала',
    ],
    rootCauses: [
      'Превышен срок эксплуатации оборудования',
      'Отсутствие регламента замены',
    ],
    contributingCauses: [
      'Недостаточный мониторинг состояния',
      'Отсутствие дублирования каналов',
    ],
    takenMeasures: [
      'Заменено неисправное оборудование',
      'Восстановлена штатная работа сети',
      'Проведена диагностика смежных систем',
    ],
    plannedActions: [
      {
        id: uuid(),
        number: 1,
        text: 'Заменить коммутационное оборудование на всех узлах',
        responsible: 'Иванов И.И.',
        deadline: new Date(Date.now() + 30 * 86400000).toISOString(),
        resultFormat: 'Акт выполненных работ',
        status: 'pending',
      },
      {
        id: uuid(),
        number: 2,
        text: 'Разработать регламент плановой замены оборудования',
        responsible: 'Петров П.П.',
        deadline: new Date(Date.now() + 14 * 86400000).toISOString(),
        resultFormat: 'Утверждённый документ',
        status: 'pending',
      },
    ],
    specialOpinion: '',
    timeline: [
      { id: uuid(), type: 'date-separator', dateLabel: 'Понедельник, 17.11.2025', description: '' },
      { id: uuid(), type: 'event', time: '14:30', description: 'Зафиксирован сбой сетевого оборудования в ТЭСЦ-1' },
      { id: uuid(), type: 'event', time: '14:35', description: 'Начата диагностика проблемы' },
      { id: uuid(), type: 'event', time: '15:00', description: 'Обнаружен отказ коммутатора' },
      { id: uuid(), type: 'event', time: '15:30', description: 'Начаты работы по замене оборудования' },
      { id: uuid(), type: 'event', time: '16:45', description: 'Оборудование заменено, проверка связи' },
      { id: uuid(), type: 'event', time: '17:00', description: 'Восстановлена штатная работа' },
    ],
  };
}

// === Генератор чата ===

export function generateMockMessages(downtimeId: string): ChatMessage[] {
  return [
    {
      id: uuid(),
      downtimeId,
      userId: 'admin-1',
      text: 'Коллеги, зафиксирован инцидент. Начинаем разбор.',
      createdAt: new Date(Date.now() - 3600000).toISOString(),
    },
    {
      id: uuid(),
      downtimeId,
      userId: 'user-1',
      text: 'Принял. Уже занимаюсь диагностикой.',
      createdAt: new Date(Date.now() - 3000000).toISOString(),
    },
    {
      id: uuid(),
      downtimeId,
      userId: 'user-2',
      text: 'Со своей стороны подготовил отчёт по затронутым системам.',
      createdAt: new Date(Date.now() - 1800000).toISOString(),
    },
  ];
}

// === Начальные данные для пустых коллекций ===

export const EMPTY_NOTIFICATIONS: Notification[] = [];
export const EMPTY_AUDIT_LOGS: AuditLog[] = [];
export const EMPTY_FILES: AttachedFile[] = [];
