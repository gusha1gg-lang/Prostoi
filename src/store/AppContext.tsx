import React, { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type {
  User, ConsolidatedDowntime, IncidentInvestigation, ChatMessage,
  Notification, AuditLog, AttachedFile, DowntimeFilters, GroupingMode,
  DowntimeStatus, DowntimeRecord,
} from '../types';
import { createDataSource, groupRecords } from '../services/dataSource';
import { MOCK_USERS, generateMockInvestigation, generateMockMessages } from '../data/mockData';
import { v4 as uuid } from 'uuid';

// === Theme ===
type Theme = 'light' | 'dark';

// === Context ===
interface AppState {
  // Auth
  currentUser: User | null;
  login: (login: string, password: string) => boolean;
  logout: () => void;

  // Theme
  theme: Theme;
  toggleTheme: () => void;

  // Downtimes
  consolidatedDowntimes: ConsolidatedDowntime[];
  isLoading: boolean;
  loadDowntimes: (filters: DowntimeFilters, mode: GroupingMode) => Promise<void>;
  updateDowntimeStatus: (id: string, status: DowntimeStatus) => void;
  updateDowntimeTitle: (id: string, title: string) => void;
  deleteDowntime: (id: string) => void;
  mergeDowntimes: (ids: string[]) => void;
  updateRecord: (downtimeId: string, recordId: string, updates: Partial<DowntimeRecord>) => void;
  deleteRecord: (downtimeId: string, recordId: string) => void;

  // Investigation
  investigations: Record<string, IncidentInvestigation>;
  getInvestigation: (downtimeId: string) => IncidentInvestigation;
  saveInvestigation: (inv: IncidentInvestigation) => void;

  // Chat
  messages: Record<string, ChatMessage[]>;
  addMessage: (downtimeId: string, text: string) => void;

  // Notifications
  notifications: Notification[];
  unreadCount: number;
  markAllRead: () => void;
  addNotification: (userId: string, downtimeId: string, type: Notification['type'], message: string) => void;

  // Files
  files: AttachedFile[];
  addFile: (downtimeId: string, file: File) => Promise<void>;
  deleteFile: (id: string) => void;

  // Audit
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditLog['action'], details: string, downtimeId?: string) => void;

  // Users
  users: User[];
}

const AppContext = createContext<AppState | null>(null);

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// === Provider ===

const STORAGE_KEY = 'omk-downtime-portal';

interface PersistedState {
  theme: Theme;
  consolidatedDowntimes: ConsolidatedDowntime[];
  investigations: Record<string, IncidentInvestigation>;
  messages: Record<string, ChatMessage[]>;
  notifications: Notification[];
  files: AttachedFile[];
  auditLogs: AuditLog[];
  currentUserId: string | null;
}

function loadPersisted(): PersistedState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch { /* ignore */ }
  return null;
}

function savePersisted(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch { /* ignore */ }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const persisted = loadPersisted();

  const [theme, setTheme] = useState<Theme>(persisted?.theme || 'light');
  const [currentUser, setCurrentUser] = useState<User | null>(
    persisted?.currentUserId ? MOCK_USERS.find((u) => u.id === persisted.currentUserId) || null : null
  );
  const [consolidatedDowntimes, setConsolidatedDowntimes] = useState<ConsolidatedDowntime[]>(
    persisted?.consolidatedDowntimes || []
  );
  const [investigations, setInvestigations] = useState<Record<string, IncidentInvestigation>>(
    persisted?.investigations || {}
  );
  const [messages, setMessages] = useState<Record<string, ChatMessage[]>>(
    persisted?.messages || {}
  );
  const [notifications, setNotifications] = useState<Notification[]>(
    persisted?.notifications || []
  );
  const [files, setFiles] = useState<AttachedFile[]>(persisted?.files || []);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(persisted?.auditLogs || []);
  const [isLoading, setIsLoading] = useState(false);

  // Persist on changes
  useEffect(() => {
    savePersisted({
      theme,
      consolidatedDowntimes,
      investigations,
      messages,
      notifications,
      files,
      auditLogs,
      currentUserId: currentUser?.id || null,
    });
  }, [theme, consolidatedDowntimes, investigations, messages, notifications, files, auditLogs, currentUser]);

  // Apply theme to HTML
  useEffect(() => {
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.classList.add(theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((t) => (t === 'light' ? 'dark' : 'light'));
  }, []);

  // === Auth ===
  const login = useCallback((loginStr: string, password: string): boolean => {
    const user = MOCK_USERS.find((u) => u.login === loginStr && u.passwordHash === password);
    if (user) {
      setCurrentUser(user);
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: user.id, action: 'login',
        details: `Вход в систему`, createdAt: new Date().toISOString(),
      }]);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    if (currentUser) {
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: currentUser.id, action: 'logout',
        details: `Выход из системы`, createdAt: new Date().toISOString(),
      }]);
    }
    setCurrentUser(null);
  }, [currentUser]);

  // === Downtimes ===
  const dataSource = React.useMemo(() => createDataSource(), []);

  const loadDowntimes = useCallback(async (filters: DowntimeFilters, mode: GroupingMode) => {
    setIsLoading(true);
    try {
      const from = new Date(filters.dateFrom);
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      const records = await dataSource.getDowntimeRecords(from, to, filters.shop);
      let grouped = groupRecords(records, mode);

      // Apply filters
      if (filters.section) {
        grouped = grouped.filter((g) => g.section === filters.section);
      }
      if (filters.status) {
        grouped = grouped.filter((g) => g.status === filters.status);
      }

      setConsolidatedDowntimes(grouped);
    } finally {
      setIsLoading(false);
    }
  }, [dataSource]);

  const updateDowntimeStatus = useCallback((id: string, status: DowntimeStatus) => {
    setConsolidatedDowntimes((prev) =>
      prev.map((d) => d.id === id ? { ...d, status, updatedAt: new Date().toISOString() } : d)
    );
    if (currentUser) {
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: currentUser.id, action: 'status_change',
        details: `Статус изменён на "${status}"`, downtimeId: id, createdAt: new Date().toISOString(),
      }]);
    }
  }, [currentUser]);

  const updateDowntimeTitle = useCallback((id: string, title: string) => {
    setConsolidatedDowntimes((prev) =>
      prev.map((d) => d.id === id ? { ...d, title, updatedAt: new Date().toISOString() } : d)
    );
  }, []);

  const deleteDowntime = useCallback((id: string) => {
    setConsolidatedDowntimes((prev) => prev.filter((d) => d.id !== id));
    if (currentUser) {
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: currentUser.id, action: 'record_delete',
        details: `Удалён сводный простой`, downtimeId: id, createdAt: new Date().toISOString(),
      }]);
    }
  }, [currentUser]);

  const mergeDowntimes = useCallback((ids: string[]) => {
    if (ids.length < 2) return;
    setConsolidatedDowntimes((prev) => {
      const toMerge = prev.filter((d) => ids.includes(d.id));
      const rest = prev.filter((d) => !ids.includes(d.id));
      const allRecords = toMerge.flatMap((d) => d.records);
      const merged: ConsolidatedDowntime = {
        id: uuid(),
        title: 'Объединённый простой',
        date: toMerge[0]?.date || new Date().toISOString().split('T')[0],
        shop: toMerge[0]?.shop || '',
        section: toMerge[0]?.section || '',
        records: allRecords,
        totalDuration: allRecords.reduce((s, r) => s + r.duration, 0),
        status: 'new',
        participants: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      return [...rest, merged];
    });
    if (currentUser) {
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: currentUser.id, action: 'merge',
        details: `Объединено простоев: ${ids.length}`, createdAt: new Date().toISOString(),
      }]);
    }
  }, [currentUser]);

  const updateRecord = useCallback((downtimeId: string, recordId: string, updates: Partial<DowntimeRecord>) => {
    setConsolidatedDowntimes((prev) =>
      prev.map((d) => {
        if (d.id !== downtimeId) return d;
        const newRecords = d.records.map((r) => r.id === recordId ? { ...r, ...updates } : r);
        const totalDuration = newRecords.reduce((s, r) => s + r.duration, 0);
        return { ...d, records: newRecords, totalDuration, updatedAt: new Date().toISOString() };
      })
    );
  }, []);

  const deleteRecord = useCallback((downtimeId: string, recordId: string) => {
    setConsolidatedDowntimes((prev) =>
      prev.map((d) => {
        if (d.id !== downtimeId) return d;
        const newRecords = d.records.filter((r) => r.id !== recordId);
        const totalDuration = newRecords.reduce((s, r) => s + r.duration, 0);
        return { ...d, records: newRecords, totalDuration, updatedAt: new Date().toISOString() };
      })
    );
    if (currentUser) {
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: currentUser.id, action: 'record_delete',
        details: `Удалена детальная запись`, downtimeId, createdAt: new Date().toISOString(),
      }]);
    }
  }, [currentUser]);

  // === Investigation ===
  const getInvestigation = useCallback((downtimeId: string): IncidentInvestigation => {
    if (investigations[downtimeId]) return investigations[downtimeId];
    const inv = generateMockInvestigation(downtimeId);
    setInvestigations((prev) => ({ ...prev, [downtimeId]: inv }));
    return inv;
  }, [investigations]);

  const saveInvestigation = useCallback((inv: IncidentInvestigation) => {
    setInvestigations((prev) => ({ ...prev, [inv.downtimeId]: inv }));
    if (currentUser) {
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: currentUser.id, action: 'investigation_save',
        details: `Сохранён разбор инцидента ${inv.investigationNumber}`,
        downtimeId: inv.downtimeId, createdAt: new Date().toISOString(),
      }]);
    }
  }, [currentUser]);

  // === Chat ===
  const addMessage = useCallback((downtimeId: string, text: string) => {
    if (!currentUser) return;
    const msg: ChatMessage = {
      id: uuid(), downtimeId, userId: currentUser.id,
      text, createdAt: new Date().toISOString(),
    };
    setMessages((prev) => ({
      ...prev,
      [downtimeId]: [...(prev[downtimeId] || []), msg],
    }));
    if (currentUser) {
      setAuditLogs((prev) => [...prev, {
        id: uuid(), userId: currentUser.id, action: 'comment_add',
        details: `Добавлен комментарий`, downtimeId, createdAt: new Date().toISOString(),
      }]);
    }
  }, [currentUser]);

  // === Notifications ===
  const unreadCount = notifications.filter((n) => !n.isRead && n.userId === currentUser?.id).length;

  const markAllRead = useCallback(() => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => n.userId === currentUser.id ? { ...n, isRead: true } : n)
    );
  }, [currentUser]);

  const addNotification = useCallback((userId: string, downtimeId: string, type: Notification['type'], message: string) => {
    const n: Notification = {
      id: uuid(), userId, downtimeId, type, message,
      isRead: false, createdAt: new Date().toISOString(),
    };
    setNotifications((prev) => [...prev, n]);
  }, []);

  // === Files ===
  const addFile = useCallback(async (downtimeId: string, file: File) => {
    if (!currentUser) return;
    const data = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
    const f: AttachedFile = {
      id: uuid(), downtimeId, fileName: file.name, fileSize: file.size,
      mimeType: file.type, uploadedBy: currentUser.id,
      uploadedAt: new Date().toISOString(), data,
    };
    setFiles((prev) => [...prev, f]);
    setAuditLogs((prev) => [...prev, {
      id: uuid(), userId: currentUser.id, action: 'file_upload',
      details: `Загружен файл: ${file.name}`, downtimeId, createdAt: new Date().toISOString(),
    }]);
  }, [currentUser]);

  const deleteFile = useCallback((id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  }, []);

  // === Audit ===
  const addAuditLog = useCallback((action: AuditLog['action'], details: string, downtimeId?: string) => {
    if (!currentUser) return;
    setAuditLogs((prev) => [...prev, {
      id: uuid(), userId: currentUser.id, action, details,
      downtimeId, createdAt: new Date().toISOString(),
    }]);
  }, [currentUser]);

  // Initialize messages for existing downtimes
  useEffect(() => {
    for (const d of consolidatedDowntimes) {
      if (!messages[d.id]) {
        setMessages((prev) => ({ ...prev, [d.id]: generateMockMessages(d.id) }));
      }
    }
  }, [consolidatedDowntimes.length]);

  const value: AppState = {
    currentUser, login, logout,
    theme, toggleTheme,
    consolidatedDowntimes, isLoading, loadDowntimes,
    updateDowntimeStatus, updateDowntimeTitle, deleteDowntime, mergeDowntimes,
    updateRecord, deleteRecord,
    investigations, getInvestigation, saveInvestigation,
    messages, addMessage,
    notifications, unreadCount, markAllRead, addNotification,
    files, addFile, deleteFile,
    auditLogs, addAuditLog,
    users: MOCK_USERS,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}
