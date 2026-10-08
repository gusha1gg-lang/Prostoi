import { useState, useMemo } from 'react';
import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { Search, RotateCcw, Download, Filter, ChevronUp, ChevronDown, Trash2, Merge, Eye } from 'lucide-react';
import { SHOPS, getShopShortName } from '../data/shops';
import { formatDuration } from '../services/dataSource';
import { STATUS_LABELS, STATUS_COLORS, type DowntimeStatus, type DowntimeFilters, type GroupingMode } from '../types';
import { exportToExcel } from '../services/exportExcel';

type SortField = 'title' | 'date' | 'shop' | 'section' | 'records' | 'duration' | 'status';
type SortDir = 'asc' | 'desc';

export default function ReportPage() {
  const { consolidatedDowntimes, isLoading, loadDowntimes, deleteDowntime, mergeDowntimes, currentUser } = useApp();
  const navigate = useNavigate();

  // Filters
  const today = new Date().toISOString().split('T')[0];
  const monthAgo = new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0];
  const [filters, setFilters] = useState<DowntimeFilters>({
    dateFrom: monthAgo,
    dateTo: today,
  });
  const [groupingMode, setGroupingMode] = useState<GroupingMode>('by-shop-period');
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Sort
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  // Sections from data
  const sections = useMemo(() => {
    const s = new Set(consolidatedDowntimes.map((d) => d.section).filter(Boolean));
    return Array.from(s).sort();
  }, [consolidatedDowntimes]);

  const handleApply = () => {
    loadDowntimes(filters, groupingMode);
  };

  const handleReset = () => {
    setFilters({ dateFrom: monthAgo, dateTo: today });
    setGroupingMode('by-shop-period');
  };

  const handleExport = () => {
    exportToExcel(consolidatedDowntimes);
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    const data = [...consolidatedDowntimes];
    data.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case 'title': cmp = a.title.localeCompare(b.title); break;
        case 'date': cmp = a.date.localeCompare(b.date); break;
        case 'shop': cmp = getShopShortName(a.shop).localeCompare(getShopShortName(b.shop)); break;
        case 'section': cmp = a.section.localeCompare(b.section); break;
        case 'records': cmp = a.records.length - b.records.length; break;
        case 'duration': cmp = a.totalDuration - b.totalDuration; break;
        case 'status': cmp = a.status.localeCompare(b.status); break;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return data;
  }, [consolidatedDowntimes, sortField, sortDir]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleMerge = () => {
    if (selected.size < 2) return;
    mergeDowntimes(Array.from(selected));
    setSelected(new Set());
  };

  const handleDeleteSelected = () => {
    if (selected.size === 0) return;
    if (confirm(`Удалить ${selected.size} простоев?`)) {
      selected.forEach((id) => deleteDowntime(id));
      setSelected(new Set());
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Отчёт по простоям</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Служба ДИТ • Сводные простои производства
          </p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-blue-600 dark:text-blue-400 font-medium">Служба:</span>
          <span className="text-blue-800 dark:text-blue-200 font-bold text-lg">ДИТ</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <h3 className="font-semibold text-gray-900 dark:text-white">Фильтры</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Дата от *</label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Дата до *</label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Цех</label>
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
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Участок</label>
            <select
              value={filters.section || ''}
              onChange={(e) => setFilters({ ...filters, section: e.target.value || undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Все участки</option>
              {sections.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Статус</label>
            <select
              value={filters.status || ''}
              onChange={(e) => setFilters({ ...filters, status: (e.target.value || undefined) as DowntimeStatus | undefined })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Все статусы</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-600 dark:text-gray-400">Группировка:</label>
            <select
              value={groupingMode}
              onChange={(e) => setGroupingMode(e.target.value as GroupingMode)}
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            >
              <option value="by-shop-period">По цехам за период</option>
              <option value="all-in-one">Все в один простой</option>
            </select>
          </div>
          <button
            onClick={handleApply}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Search className="w-4 h-4" /> Применить
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" /> Сбросить
          </button>
          <button
            onClick={handleExport}
            disabled={consolidatedDowntimes.length === 0}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-300 dark:disabled:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Экспорт в Excel
          </button>
        </div>
      </div>

      {/* Bulk actions */}
      {currentUser?.role === 'admin' && selected.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm text-blue-700 dark:text-blue-300 font-medium">
            Выбрано: {selected.size}
          </span>
          <button
            onClick={handleMerge}
            disabled={selected.size < 2}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm rounded-lg flex items-center gap-1"
          >
            <Merge className="w-4 h-4" /> Объединить
          </button>
          <button
            onClick={handleDeleteSelected}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Удалить
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Загрузка данных...</p>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500 dark:text-gray-400">Нет данных. Примените фильтры для загрузки.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  {currentUser?.role === 'admin' && <th className="p-3 w-10"></th>}
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">ID</th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('title')}>
                    <span className="flex items-center gap-1">Название <SortIcon field="title" /></span>
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('date')}>
                    <span className="flex items-center gap-1">Дата <SortIcon field="date" /></span>
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('shop')}>
                    <span className="flex items-center gap-1">Цех <SortIcon field="shop" /></span>
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('section')}>
                    <span className="flex items-center gap-1">Участок <SortIcon field="section" /></span>
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('records')}>
                    <span className="flex items-center gap-1 justify-end">Записей <SortIcon field="records" /></span>
                  </th>
                  <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('duration')}>
                    <span className="flex items-center gap-1 justify-end">Длительность <SortIcon field="duration" /></span>
                  </th>
                  <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300 cursor-pointer select-none" onClick={() => toggleSort('status')}>
                    <span className="flex items-center gap-1">Статус <SortIcon field="status" /></span>
                  </th>
                  <th className="p-3 text-center font-semibold text-gray-600 dark:text-gray-300">Действия</th>
                </tr>
              </thead>
              <tbody>
                {sortedData.map((d, i) => (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    {currentUser?.role === 'admin' && (
                      <td className="p-3">
                        <input
                          type="checkbox"
                          checked={selected.has(d.id)}
                          onChange={() => toggleSelect(d.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                    )}
                    <td className="p-3 text-gray-500 dark:text-gray-400 font-mono text-xs">{i + 1}</td>
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{d.title}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{new Date(d.date).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{getShopShortName(d.shop)}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{d.section}</td>
                    <td className="p-3 text-right text-gray-700 dark:text-gray-300">{d.records.length}</td>
                    <td className="p-3 text-right font-medium text-gray-900 dark:text-white">{formatDuration(d.totalDuration)}</td>
                    <td className="p-3">
                      <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[d.status]}`}>
                        {STATUS_LABELS[d.status]}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/downtime/${d.id}`)}
                          className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          title="Открыть"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => { if (confirm('Удалить простой?')) deleteDowntime(d.id); }}
                            className="p-1.5 rounded hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400"
                            title="Удалить"
                          >
                            <Trash2 className="w-4 h-4" />
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

      {/* Summary */}
      {sortedData.length > 0 && (
        <div className="flex items-center gap-6 text-sm text-gray-500 dark:text-gray-400">
          <span>Всего простоев: <strong className="text-gray-900 dark:text-white">{sortedData.length}</strong></span>
          <span>Общая длительность: <strong className="text-gray-900 dark:text-white">{formatDuration(sortedData.reduce((s, d) => s + d.totalDuration, 0))}</strong></span>
          <span>Записей: <strong className="text-gray-900 dark:text-white">{sortedData.reduce((s, d) => s + d.records.length, 0)}</strong></span>
        </div>
      )}
    </div>
  );
}
