import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ArrowLeft, Eye, Trash2, Merge, ChevronUp, ChevronDown, Edit3, Save, X, Download } from 'lucide-react';
import { getShopShortName } from '../data/shops';
import { formatDuration } from '../services/dataSource';
import { STATUS_LABELS, STATUS_COLORS, type DowntimeStatus } from '../types';
import { exportReportToExcel } from '../services/exportExcel';

type SortField = 'title' | 'date' | 'shop' | 'section' | 'records' | 'duration' | 'status';
type SortDir = 'asc' | 'desc';

export default function ReportViewPage() {
  const { reportId } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { reports, updateDowntimeTitle, deleteDowntime, mergeDowntimes, updateReportName, currentUser } = useApp();

  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState('');

  const report = reports.find((r) => r.id === reportId);

  if (!report) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Отчёт не найден</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">← К списку отчётов</button>
      </div>
    );
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const sortedData = useMemo(() => {
    const data = [...report.downtimes];
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
  }, [report.downtimes, sortField, sortDir]);

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
    mergeDowntimes(report.id, Array.from(selected));
    setSelected(new Set());
  };

  const startEditName = () => {
    setNameValue(report.name);
    setEditingName(true);
  };

  const saveName = () => {
    updateReportName(report.id, nameValue);
    setEditingName(false);
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <ChevronUp className="w-3 h-3 text-gray-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3 h-3 text-blue-600" />
      : <ChevronDown className="w-3 h-3 text-blue-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <button onClick={() => navigate('/')} className="hover:text-blue-600">Отчёты</button>
        <span>/</span>
        <span className="text-gray-900 dark:text-white">{report.name}</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xl font-bold"
                  autoFocus
                />
                <button onClick={saveName} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                  <Save className="w-4 h-4" />
                </button>
                <button onClick={() => setEditingName(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{report.name}</h2>
                <button onClick={startEditName} className="p-1 text-gray-400 hover:text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>
            )}
            <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span>Период: <strong className="text-gray-700 dark:text-gray-300">
                {new Date(report.dateFrom).toLocaleDateString('ru-RU')} — {new Date(report.dateTo).toLocaleDateString('ru-RU')}
              </strong></span>
              <span>Цех: <strong className="text-gray-700 dark:text-gray-300">
                {report.shop ? getShopShortName(report.shop) : 'Все'}
              </strong></span>
              <span>Участок: <strong className="text-gray-700 dark:text-gray-300">{report.section || 'Все'}</strong></span>
              <span>Сформирован: <strong className="text-gray-700 dark:text-gray-300">
                {new Date(report.createdAt).toLocaleString('ru-RU')}
              </strong></span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportReportToExcel(report)}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2"
          >
            <Download className="w-4 h-4" /> Экспорт в Excel
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Сводных простоев</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.downtimes.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Общая длительность</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{formatDuration(report.totalDuration)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Детальных записей</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{report.totalRecords}</p>
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
            onClick={() => {
              if (confirm(`Удалить ${selected.size} простоев?`)) {
                selected.forEach((id) => deleteDowntime(report.id, id));
                setSelected(new Set());
              }
            }}
            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg flex items-center gap-1"
          >
            <Trash2 className="w-4 h-4" /> Удалить
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {sortedData.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            Нет сводных простоев в этом отчёте
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
                          onClick={() => navigate(`/report/${report.id}/downtime/${d.id}`)}
                          className="p-1.5 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                          title="Открыть"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {currentUser?.role === 'admin' && (
                          <button
                            onClick={() => { if (confirm('Удалить простой?')) deleteDowntime(report.id, d.id); }}
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
    </div>
  );
}
