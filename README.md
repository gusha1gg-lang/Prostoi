# Портал учёта производственных простоев ОМК-ИТ

## Описание проекта

Веб-портал для автоматизации учёта производственных простоев по вине ОМК-ИТ. Заменяет ручной процесс копирования данных из СААРЦ в Excel, ведения Word-документов с хронологиями и разборами инцидентов, и формирования отчётов для руководства.

## Текущий статус

**Этап 1 (текущий):** Разработка на тестовом Windows-компьютере в WSL2 (Ubuntu). Источник данных — вымышленные данные, генерируемые скриптом. База данных — SQLite.

**Этап 2 (будущий):** Переезд на корпоративный сервер Oracle Linux. Источник данных — реальная БД СААРЦ через SQL-запросы (без парсинга веб-страниц).

## Архитектура

### Фронтенд
- **React 18** + TypeScript
- **Vite** — сборщик
- **Tailwind CSS 4** — стилизация
- **React Router** — маршрутизация
- **Lucide React** — иконки
- **date-fns** — работа с датами
- **framer-motion** — анимации
- **recharts** — графики (при необходимости)
- **uuid** — генерация идентификаторов

### Бэкенд (планируется)
- Node.js / Express или Fastify
- SQLite (этап 1) → PostgreSQL/Oracle (этап 2)
- Абстрактный слой источника данных (Data Provider Pattern)

### Структура данных

#### Запись о простое (детальная строка из источника)
```typescript
interface DowntimeRecord {
  id: string;
  startTime: Date;        // Дата и время начала
  endTime: Date;          // Дата и время окончания
  duration: number;       // Длительность в минутах
  shop: string;           // Цех
  section: string;        // Участок
  aggregate: string;      // Агрегат
  reason: string;         // Причина
  note: string;           // Примечание
  responsible: string;    // Ответственный
  service: string;        // Служба
  sourceId?: string;      // ID в источнике (СААРЦ)
}
```

#### Сводный простой
```typescript
interface ConsolidatedDowntime {
  id: string;
  title: string;
  date: Date;
  shop: string;
  section: string;
  records: DowntimeRecord[];
  totalDuration: number;
  status: 'open' | 'investigating' | 'resolved' | 'closed';
  participants: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

#### Разбор инцидента
```typescript
interface IncidentInvestigation {
  id: string;
  downtimeId: string;
  investigationNumber: string;
  incidentLevel: number;
  date: Date;
  actualDuration: number;
  productionDowntimes: ProductionDowntime[];
  shipmentDowntimes: ShipmentDowntime[];
  immediateCauses: string[];
  rootCauses: string[];
  contributingCauses: string[];
  takenMeasures: string[];
  plannedActions: PlannedAction[];
  specialOpinion: string;
  timeline: TimelineEntry[];
}
```

#### Мероприятие
```typescript
interface PlannedAction {
  id: string;
  text: string;
  responsible: string;
  deadline: Date;
  resultFormat: string;
  status: 'pending' | 'completed' | 'overdue';
}
```

#### Хронология событий
```typescript
interface TimelineEntry {
  id: string;
  type: 'date-separator' | 'event';
  dateLabel?: string;     // Для разделителя: "Среда, 19.11.2025"
  time?: string;          // Для события: "14:30"
  description: string;    // Текст события
}
```

#### Пользователь
```typescript
interface User {
  id: string;
  login: string;
  passwordHash: string;
  fullName: string;
  position: string;
  department: string;
  email: string;
  role: 'user' | 'responsible' | 'admin';
}
```

#### Уведомление
```typescript
interface Notification {
  id: string;
  userId: string;
  downtimeId: string;
  type: 'comment' | 'status_change' | 'added_to_downtime' | 'file_uploaded' | 'investigation_updated';
  message: string;
  isRead: boolean;
  createdAt: Date;
}
```

#### Запись аудита
```typescript
interface AuditLog {
  id: string;
  userId: string;
  action: 'login' | 'logout' | 'status_change' | 'record_delete' | 'comment_add' | 'file_upload' | 'investigation_save' | 'record_edit' | 'merge' | 'action_update';
  details: string;
  downtimeId?: string;
  createdAt: Date;
}
```

## Функциональные модули

### 1. Учёт простоев
- Загрузка записей из источника данных
- Автоматическая группировка по дате/цеху/участку
- Режимы группировки: по дате+цеху+участку ИЛИ по цеху за период

### 2. Список сводных простоев
- Таблица с фильтрами (дата, цех, участок, статус)
- Сортировка по любому столбцу
- Массовые операции: объединение, удаление (только для админа)

### 3. Страница простоя
- Вкладки: Общая информация, Разбор инцидента, Чат, Файлы, История, Детализация
- Детализация: просмотр/редактирование/удаление исходных строк

### 4. Разбор инцидента
- Структурированный документ с полями
- Экспорт в .docx (Times New Roman, шапка, таблицы)

### 5. Мероприятия
- CRUD внутри разбора
- Статусы: выполнено / не выполнено / просрочено

### 6. Хронология событий
- Записи время + событие
- Даты-разделители

### 7. Чат и уведомления
- Внутрисистемный чат
- Колокольчик с счётчиком непрочитанных
- Типы уведомлений: комментарии, статус, добавление, файлы, разбор

### 8. Управление доступом
- 3 роли: пользователь, ответственный, администратор
- Профили пользователей
- Управление участниками (только админ)

### 9. Аутентификация
- Логин/пароль (хэши)
- Будущая интеграция с доменной аутентификацией

### 10. Файлы
- Прикрепление к простою
- Хранение на диске, метаданные в БД
- Предпросмотр изображений и PDF

### 11. Экспорт
- Детализация → Excel
- Разбор → Word (.docx)

### 12. Аудит
- Лог всех значимых действий
- Фильтры: дата, пользователь, тип действия

### 13. Темы
- Светлая и тёмная тема
- Переключатель в шапке

## Абстракция источника данных

```typescript
interface DataSource {
  getDowntimeRecords(from: Date, to: Date): Promise<DowntimeRecord[]>;
  testConnection(): Promise<boolean>;
}

// Реализации:
class MockDataSource implements DataSource { ... }      // Этап 1: вымышленные данные
class SAARCDataSource implements DataSource { ... }     // Этап 2: БД СААРЦ
```

## Структура проекта (планируемая)

```
src/
├── components/          # Переиспользуемые компоненты
│   ├── layout/          # Шапка, сайдбар, футер
│   ├── ui/              # Кнопки, таблицы, модалки
│   └── shared/          # Общие компоненты
├── pages/               # Страницы приложения
│   ├── Dashboard/       # Главная
│   ├── DowntimeList/    # Список простоев
│   ├── DowntimeDetail/  # Страница простоя
│   ├── Investigation/   # Разбор инцидента
│   ├── Audit/           # Аудит
│   ├── Users/           # Управление пользователями
│   └── Auth/            # Вход
├── services/            # Бизнес-логика
│   ├── dataSource/      # Абстракция источника данных
│   ├── auth/            # Аутентификация
│   └── export/          # Экспорт в Excel/Word
├── store/               # Состояние приложения
├── types/               # TypeScript типы
├── utils/               # Утилиты
├── hooks/               # Кастомные хуки
└── data/                # Мок-данные и сиды
```

## Переменные окружения

```env
# Этап 1
VITE_DATA_SOURCE=mock
VITE_DB_PATH=./data/downtime.db

# Этап 2
VITE_DATA_SOURCE=saarc
VITE_DB_HOST=oracle-server.corp.local
VITE_DB_PORT=1521
VITE_DB_NAME=SAARC
VITE_DB_USER=portal_reader
VITE_DB_PASSWORD=***
```

## Команды

```bash
npm run dev      # Запуск dev-сервера
npm run build    # Сборка для продакшена
npm run typecheck # Проверка типов
```

## Примечания по разработке

1. Все тексты интерфейса — на русском языке
2. Корпоративный строгий стиль оформления
3. Код источника данных должен быть абстрагирован для лёгкой замены реализации
4. На этапе 1 все данные — вымышленные, генерируются скриптом seed
5. На этапе 2 — только SQL-запросы к БД СААРЦ, никакого парсинга веб-страниц
