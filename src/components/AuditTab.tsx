import { useApp } from '../store/AppContext';

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

export default function AuditTab({ downtimeId }: { downtimeId: string }) {
  const { auditLogs, users: allUsers } = useApp();
  const downtimeLogs = auditLogs
    .filter((l) => l.downtimeId === downtimeId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getUserName = (userId: string) => {
    return allUsers.find((u) => u.id === userId)?.fullName || 'Неизвестный';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">История действий</h3>
      </div>
      <div className="p-4">
        {downtimeLogs.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Нет записей в истории</p>
        ) : (
          <div className="space-y-3">
            {downtimeLogs.map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium text-gray-600 dark:text-gray-300">
                  {getUserName(log.userId).charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{getUserName(log.userId)}</span>
                    {' — '}
                    <span className="text-gray-600 dark:text-gray-400">{ACTION_LABELS[log.action] || log.action}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{log.details}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {new Date(log.createdAt).toLocaleString('ru-RU')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
