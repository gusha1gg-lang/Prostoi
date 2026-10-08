import { useApp } from '../../store/AppContext';
import { Bell, Sun, Moon, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function Header() {
  const { currentUser, theme, toggleTheme, logout, notifications, unreadCount, markAllRead } = useApp();
  const [showNotif, setShowNotif] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const userNotifs = notifications
    .filter((n) => n.userId === currentUser?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 20);

  return (
    <header className="h-14 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center px-4 justify-between shadow-sm">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold text-sm">
          ИТ
        </div>
        <h1 className="text-lg font-semibold text-gray-900 dark:text-white hidden sm:block">
          Портал учёта простоев
        </h1>
        <div className="hidden md:flex items-center gap-1 ml-4 px-3 py-1 bg-blue-50 dark:bg-blue-900/30 rounded text-sm text-blue-700 dark:text-blue-300 font-medium">
          <span>Служба:</span>
          <span className="font-bold">ДИТ</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Notifications */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => { setShowNotif(!showNotif); if (!showNotif) markAllRead(); }}
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
          {showNotif && (
            <div className="absolute right-0 top-12 w-80 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 dark:border-gray-700 font-semibold text-gray-900 dark:text-white">
                Уведомления
              </div>
              {userNotifs.length === 0 ? (
                <div className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">
                  Нет уведомлений
                </div>
              ) : (
                userNotifs.map((n) => (
                  <div key={n.id} className="p-3 border-b border-gray-100 dark:border-gray-700 text-sm">
                    <p className="text-gray-800 dark:text-gray-200">{n.message}</p>
                    <p className="text-gray-400 text-xs mt-1">
                      {new Date(n.createdAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          title={theme === 'light' ? 'Тёмная тема' : 'Светлая тема'}
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-600" />
          ) : (
            <Sun className="w-5 h-5 text-gray-300" />
          )}
        </button>

        {/* User info */}
        <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-200 dark:border-gray-700">
          <div className="w-8 h-8 bg-gray-200 dark:bg-gray-600 rounded-full flex items-center justify-center">
            <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-gray-900 dark:text-white leading-tight">
              {currentUser?.fullName.split(' ').slice(0, 2).join(' ')}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {currentUser?.role === 'admin' ? 'Администратор' : currentUser?.role === 'responsible' ? 'Ответственный' : 'Пользователь'}
            </p>
          </div>
          <button
            onClick={logout}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title="Выйти"
          >
            <LogOut className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>
        </div>
      </div>
    </header>
  );
}
