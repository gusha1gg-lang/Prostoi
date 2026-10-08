import { NavLink } from 'react-router-dom';
import { useApp } from '../../store/AppContext';
import { LayoutDashboard, FileText, ClipboardList, Users, History, Settings } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'Отчёт по простоям' },
  { to: '/investigations', icon: ClipboardList, label: 'Разборы инцидентов' },
  { to: '/audit', icon: History, label: 'Аудит' },
  { to: '/users', icon: Users, label: 'Пользователи' },
];

export default function Sidebar() {
  const { currentUser } = useApp();

  return (
    <aside className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <nav className="flex-1 p-3 space-y-1">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
        {currentUser?.role === 'admin' && (
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`
            }
          >
            <Settings className="w-5 h-5" />
            Настройки
          </NavLink>
        )}
      </nav>
      <div className="p-3 border-t border-gray-200 dark:border-gray-700">
        <div className="text-xs text-gray-400 dark:text-gray-500 text-center">
          ОМК-ИТ • v1.0 (mock)
        </div>
      </div>
    </aside>
  );
}
