import { useApp } from '../store/AppContext';
import { Shield, UserCheck, User } from 'lucide-react';

export default function UsersPage() {
  const { users, currentUser } = useApp();

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'admin': return <Shield className="w-4 h-4 text-red-500" />;
      case 'responsible': return <UserCheck className="w-4 h-4 text-blue-500" />;
      default: return <User className="w-4 h-4 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'responsible': return 'Ответственный';
      default: return 'Пользователь';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Пользователи</h2>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
              <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Роль</th>
              <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">ФИО</th>
              <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Логин</th>
              <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Должность</th>
              <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Подразделение</th>
              <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Email</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className={`border-b border-gray-100 dark:border-gray-700 ${u.id === currentUser?.id ? 'bg-blue-50 dark:bg-blue-900/10' : ''}`}>
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    {getRoleIcon(u.role)}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{getRoleLabel(u.role)}</span>
                  </div>
                </td>
                <td className="p-3 text-gray-900 dark:text-white font-medium">{u.fullName}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{u.login}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{u.position}</td>
                <td className="p-3 text-gray-700 dark:text-gray-300">{u.department}</td>
                <td className="p-3 text-gray-600 dark:text-gray-400 text-xs">{u.email}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>Примечание:</strong> На этапе разработки данные пользователей являются вымышленными.
          В боевой системе будет интеграция с доменной аутентификацией.
        </p>
      </div>
    </div>
  );
}
