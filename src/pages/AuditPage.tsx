import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { Filter } from 'lucide-react';

const ACTION_LABELS: Record<string, string> = {
  login: 'Вход в систему',
  logout: 'Выход из системы',
  status_change: 'Изменение статуса',
  record_delete: 'Удаление записи',
  record_edit: 'Редактирование записи',
  comment_add: 'Добавление комментария',
  file_upload: 'Загрузка файла',
  file_delete: 'Удаление файла',
  investigation_save: 'Сохранение разбора',
  merge: 'Объединение простоев',
  action_update: 'Обновление мероприятия',
  participant_add: 'Добавление участника',
  participant_remove: 'Удаление участника',
};

export default function AuditPage() {
  const { auditLogs, users } = useApp();
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');

  const filteredLogs = useMemo(() => {
    return auditLogs
      .filter((log) => {
        if (filterUser && log.userId !== filterUser) return false;
        if (filterAction && log.action !== filterAction) return false;
        if (filterDateFrom) {
          const d = new Date(log.createdAt);
          if (d < new Date(filterDateFrom)) return false;
        }
        if (filterDateTo) {
          const d = new Date(log.createdAt);
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59);
          if (d > to) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [auditLogs, filterUser, filterAction, filterDateFrom, filterDateTo]);

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.fullName || userId;
  };

  const uniqueActions = [...new Set(auditLogs.map((l) => l.action))];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Аудит действий</h2>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Фильтры</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Пользователь</label>
            <select
              value={filterUser}
              onChange={(e) => setFilterUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Все</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>{u.fullName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Тип действия</label>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Все</option>
              {uniqueActions.map((a) => (
                <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Дата от</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Дата до</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Нет записей аудита
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Дата/время</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Пользователь</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Действие</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Описание</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-3 text-gray-700 dark:text-gray-300 text-xs whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{getUserName(log.userId)}</td>
                    <td className="p-3">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                        {ACTION_LABELS[log.action] || log.action}
                      </span>
                    </td>
                    <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <p className="text-sm text-gray-500 dark:text-gray-400">
        Всего записей: {filteredLogs.length}
      </p>
    </div>
  );
}
