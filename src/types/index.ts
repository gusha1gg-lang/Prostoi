// === Основные типы данных ===

export interface DowntimeRecord {
  id: string;
  startTime: string; // ISO date string
  endTime: string;
  duration: number; // в минутах
  shop: string; // полное название цеха
  section: string; // участок
  aggregate: string; // агрегат
  reason: string; // причина
  note: string; // примечание
  responsible: string; // ответственный (ФИО)
  service: string; // служба (всегда "ДИТ")
  title: string; // название для группировки
  sourceId?: string; // ID в источнике
}

export type DowntimeStatus = 'new' | 'in_progress' | 'resolved' | 'out_of_scope';

export const STATUS_LABELS: Record<DowntimeStatus, string> = {
  new: 'Новый',
  in_progress: 'В работе',
  resolved: 'Решён',
  out_of_scope: 'Вне зоны ОМК-ИТ',
};

export const STATUS_COLORS: Record<DowntimeStatus, string> = {
  new: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  in_progress: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  resolved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  out_of_scope: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200',
};

export interface ConsolidatedDowntime {
  id: string;
  title: string;
  date: string; // ISO date string
  shop: string; // полное название
  section: string;
  records: DowntimeRecord[];
  totalDuration: number;
  status: DowntimeStatus;
  participants: string[]; // user IDs
  createdAt: string;
  updatedAt: string;
}

// === Разбор инцидента ===

export interface IncidentInvestigation {
  id: string;
  downtimeId: string;
  investigationNumber: string;
  incidentLevel: number;
  date: string;
  actualDuration: number;
  incidentDescription: string;
  productionDowntimes: { shop: string; duration: number; note: string }[];
  shipmentDowntimes: { destination: string; duration: number; note: string }[];
  immediateCauses: string[];
  rootCauses: string[];
  contributingCauses: string[];
  takenMeasures: string[];
  plannedActions: PlannedAction[];
  specialOpinion: string;
  timeline: TimelineEntry[];
}

export interface PlannedAction {
  id: string;
  number: number;
  text: string;
  responsible: string;
  deadline: string;
  resultFormat: string;
  status: 'pending' | 'completed' | 'overdue';
}

export interface TimelineEntry {
  id: string;
  type: 'date-separator' | 'event';
  dateLabel?: string; // "Среда, 19.11.2025"
  time?: string; // "14:30"
  description: string;
}

// === Пользователи ===

export type UserRole = 'user' | 'responsible' | 'admin';

export interface User {
  id: string;
  login: string;
  passwordHash: string;
  fullName: string;
  position: string;
  department: string;
  email: string;
  role: UserRole;
}

// === Уведомления ===

export type NotificationType =
  | 'comment'
  | 'status_change'
  | 'added_to_downtime'
  | 'file_uploaded'
  | 'investigation_updated';

export interface Notification {
  id: string;
  userId: string;
  downtimeId: string;
  type: NotificationType;
  message: string;
  isRead: boolean;
  createdAt: string;
}

// === Чат ===

export interface ChatMessage {
  id: string;
  downtimeId: string;
  userId: string;
  text: string;
  createdAt: string;
}

// === Файлы ===

export interface AttachedFile {
  id: string;
  downtimeId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  data: string; // base64
}

// === Аудит ===

export type AuditAction =
  | 'login'
  | 'logout'
  | 'status_change'
  | 'record_delete'
  | 'record_edit'
  | 'comment_add'
  | 'file_upload'
  | 'file_delete'
  | 'investigation_save'
  | 'merge'
  | 'action_update'
  | 'participant_add'
  | 'participant_remove';

export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  details: string;
  downtimeId?: string;
  createdAt: string;
}

// === Справочники ===

export interface Shop {
  fullName: string;
  shortName: string;
}

// === Фильтры ===

export interface DowntimeFilters {
  dateFrom: string;
  dateTo: string;
  shop?: string;
  section?: string;
  status?: DowntimeStatus;
}

export type GroupingMode = 'by-shop-period' | 'all-in-one';

// === Отчёт (сформированный документ) ===

export interface Report {
  id: string;
  name: string; // название отчёта (редактируемое)
  createdAt: string;
  createdBy: string; // user ID
  // Параметры формирования
  dateFrom: string;
  dateTo: string;
  shop?: string; // полное название
  section?: string;
  groupingMode: GroupingMode;
  // Сформированные данные
  downtimes: ConsolidatedDowntime[];
  // Метаданные
  totalDuration: number;
  totalRecords: number;
  status: 'draft' | 'final';
}
