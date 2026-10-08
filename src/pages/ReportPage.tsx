import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { Plus, Trash2, FileText, Eye, Calendar, Building2, Factory } from 'lucide-react';
import { SHOPS, getShopShortName } from '../data/shops';
import { formatDuration } from '../services/dataSource';
import { STATUS_LABELS, STATUS_COLORS, type DowntimeFilters, type GroupingMode, type Report } from '../types';
import { exportReportToExcel } from '../services/exportExcel';

export default function ReportPage() {
  const { reports, isLoading, createReport, deleteReport, updateReportName, currentUser } = useApp();
  const navigate = useNavigate();

  // Форма формирования нового отчёта
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [filters, setFilters] = useState<DowntimeFilters>({
    dateFrom: monthAgo,
    dateTo: today,
  });
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('by-shop-period');
  const [reportName, setReportName] = useState('');
  const [editingName, setEditingName] = useState<string | null>(null);
  const [nameValue, setNameValue] = useState('');

  const handleCreate = async () => {
    if (!filters.dateFrom || !filters.dateTo) {
      alert('Укажите диапазон дат');
      return;
    }
    const name = reportName.trim() || `Отчёт от ${new Date().toLocaleDateString('ru-RU')}`;
    await createReport(filters, groupingMode, name);
    setReportName('');
  };

  const handleDelete = (id: string) => {
    if (confirm('Удалить отчёт?')) {
      deleteReport(id);
    }
  };

  const startEditName = (report: Report) => {
    setEditingName(report.id);
    setNameValue(report.name);
  };

  const saveName = () => {
    if (editingName) {
      updateReportName(editingName, nameValue);
      setEditingName(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Отчёты по простоям</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Формирование и управление отчётами • Служба ДИТ
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-blue-600 dark:text-blue-400 font-medium">Служба:</span>
          <span className="text-blue-800 dark:text-blue-200 font-bold text-lg">ДИТ</span>
        </div>
      </div>

      {/* Форма формирования отчёта */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center gap-2 mb-4">
          <Plus className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Сформировать новый отчёт</h3>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Выберите параметры и нажмите «Сформировать». Отчёт сохранится и будет доступен для редактирования.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />Дата от *
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <Calendar className="w-3 h-3 inline mr-1" />Дата до *
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <Building2 className="w-3 h-3 inline mr-1" />Цех
            </label>
            <select
              value={filters.shop || ''}
              onChange={(e) => setFilters({ ...filters, shop: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Все цеха</option>
              {SHOPS.map((s) => (
                <option key={s.fullName} value={s.fullName}>{s.shortName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              <Factory className="w-3 h-3 inline mr-1" />Участок
            </label>
            <input
              type="text"
              value={filters.section || ''}
              onChange={(e) => setFilters({ ...filters, section: e.target.value || undefined })}
              placeholder="Например: Участок А"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Группировка</label>
            <select
              value={groupingMode}
              onChange={(e) => setGroupingMode(e.target.value as GroupingMode)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="by-shop-period">По цехам за период</option>
              <option value="all-in-one">Все в один простой</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex-1">
            <input
              type="text"
              value={reportName}
              onChange={(e) => setReportName(e.target.value)}
              placeholder="Название отчёта (необязательно)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <button
            onClick={handleCreate}
            disabled={isLoading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Формирование...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" /> Сформировать отчёт
              </>
            )}
          </button>
        </div>
      </div>

      {/* Список отчётов */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            Сформированные отчёты ({reports.length})
          </h3>
        </div>

        {reports.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Нет сформированных отчётов</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
              Заполните форму выше и нажмите «Сформировать отчёт»
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Название</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Период</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Цех</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Участок</th>
                  <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">Простоев</th>
                  <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">Общая длительность</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Создан</th>
                  <th className="p-3 text-center font-semibold text-gray-600 dark:text-gray-300">Действия</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((r) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-3">
                      {editingName === r.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            value={nameValue}
                            onChange={(e) => setNameValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && saveName()}
                            className="px-2 py-1 border border-blue-300 rounded text-sm bg-white dark:bg-gray-700 dark:border-gray-600"
                            autoFocus
                          />
                          <button onClick={saveName} className="text-green-600 text-xs">✓</button>
                          <button onClick={() => setEditingName(null)} className="text-gray-400 text-xs">✕</button>
                        </div>
                      ) : (
                        <span
                          className="font-medium text-gray-900 dark:text-white cursor-pointer hover:text-blue-600"
                          onDoubleClick={() => startEditName(r)}
                          title="Двойной клик для редактирования"
                        >
                          {r.name}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300 text-xs">
                      {new Date(r.dateFrom).toLocaleDateString('ru-RU')} — {new Date(r.dateTo).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">
                      {r.shop ? getShopShortName(r.shop) : <span className="text-gray-400">Все</span>}
                    </td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">
                      {r.section || <span className="text-gray-400">Все</span>}
                    </td>
                    <td className="p-3 text-right text-gray-700 dark:text-gray-300 font-medium">{r.downtimes.length}</td>
                    <td className="p-3 text-right text-gray-900 dark:text-white font-medium">{formatDuration(r.totalDuration)}</td>
                    <td className="p-3 text-gray-500 dark:text-gray-400 text-xs">
                      {new Date(r.createdAt).toLocaleString('ru-RU')}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/report/${r.id}`)}
                          className="px-2.5 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1"
                          title="Открыть отчёт"
                        >
                          <Eye className="w-3.5 h-3.5" /> Открыть
                        </button>
                        <button
                          onClick={() => exportReportToExcel(r)}
                          className="px-2.5 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center gap-1"
                          title="Экспорт в Excel"
                        >
                          <FileText className="w-3.5 h-3.5" /> Excel
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => handleDelete(r.id)}
                            className="px-2.5 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-medium rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center gap-1"
                            title="Удалить отчёт"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
