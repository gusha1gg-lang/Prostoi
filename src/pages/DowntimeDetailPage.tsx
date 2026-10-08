import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useApp } from '../store/AppContext';
import { ArrowLeft, FileText, MessageSquare, Paperclip, History, Table, Edit3, Trash2, Save, X } from 'lucide-react';
import { getShopShortName } from '../data/shops';
import { formatDuration } from '../services/dataSource';
import { STATUS_LABELS, STATUS_COLORS, type DowntimeStatus, type DowntimeRecord } from '../types';
import InvestigationTab from '../components/InvestigationTab';
import ChatTab from '../components/ChatTab';
import FilesTab from '../components/FilesTab';
import AuditTab from '../components/AuditTab';

type Tab = 'details' | 'investigation' | 'chat' | 'files' | 'audit';

export default function DowntimeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { consolidatedDowntimes, updateDowntimeStatus, updateDowntimeTitle, currentUser, updateRecord, deleteRecord } = useApp();
  const [activeTab, setActiveTab] = useState<Tab>('details');
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [editingRecord, setEditingRecord] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<DowntimeRecord>>({});

  const downtime = consolidatedDowntimes.find((d) => d.id === id);
  if (!downtime) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">Простой не найден</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 hover:underline">← Назад к списку</button>
      </div>
    );
  }

  const startEditTitle = () => {
    setTitleValue(downtime.title);
    setEditingTitle(true);
  };

  const saveTitle = () => {
    updateDowntimeTitle(downtime.id, titleValue);
    setEditingTitle(false);
  };

  const startEditRecord = (r: DowntimeRecord) => {
    setEditingRecord(r.id);
    setEditValues({ ...r });
  };

  const saveRecord = () => {
    if (editingRecord && editValues) {
      updateRecord(downtime.id, editingRecord, editValues);
      setEditingRecord(null);
    }
  };

  const tabs: { key: Tab; label: string; icon: typeof Table }[] = [
    { key: 'details', label: 'Детализация', icon: Table },
    { key: 'investigation', label: 'Разбор инцидента', icon: FileText },
    { key: 'chat', label: 'Чат', icon: MessageSquare },
    { key: 'files', label: 'Файлы', icon: Paperclip },
    { key: 'audit', label: 'История', icon: History },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => navigate('/')} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
        <div className="flex-1">
          {editingTitle ? (
            <div className="flex items-center gap-2">
              <input
                value={titleValue}
                onChange={(e) => setTitleValue(e.target.value)}
                className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-lg font-bold"
                autoFocus
              />
              <button onClick={saveTitle} className="p-1.5 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded">
                <Save className="w-4 h-4" />
              </button>
              <button onClick={() => setEditingTitle(false)} className="p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{downtime.title}</h2>
              {currentUser?.role === 'admin' && (
                <button onClick={startEditTitle} className="p-1 text-gray-400 hover:text-blue-600">
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
            </div>
          )}
          <div className="flex items-center gap-4 mt-1 text-sm text-gray-500 dark:text-gray-400">
            <span>Цех: <strong className="text-gray-700 dark:text-gray-300">{getShopShortName(downtime.shop)}</strong></span>
            <span>Участок: <strong className="text-gray-700 dark:text-gray-300">{downtime.section}</strong></span>
            <span>Дата: <strong className="text-gray-700 dark:text-gray-300">{new Date(downtime.date).toLocaleDateString('ru-RU')}</strong></span>
            <span>Длительность: <strong className="text-gray-700 dark:text-gray-300">{formatDuration(downtime.totalDuration)}</strong></span>
            <span>Записей: <strong className="text-gray-700 dark:text-gray-300">{downtime.records.length}</strong></span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${STATUS_COLORS[downtime.status]}`}>
            {STATUS_LABELS[downtime.status]}
          </span>
          {currentUser?.role === 'admin' && (
            <select
              value={downtime.status}
              onChange={(e) => updateDowntimeStatus(downtime.id, e.target.value as DowntimeStatus)}
              className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            >
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'details' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Детальные записи</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Итого: {formatDuration(downtime.totalDuration)}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">№</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Начало</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Конец</th>
                  <th className="p-2 text-right font-medium text-gray-600 dark:text-gray-300">Длит.</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Причина</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Примечание</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Агрегат</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Участок</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Ответственный</th>
                  <th className="p-2 text-left font-medium text-gray-600 dark:text-gray-300">Цех</th>
                  <th className="p-2 text-center font-medium text-gray-600 dark:text-gray-300">Действия</th>
                </tr>
              </thead>
              <tbody>
                {downtime.records.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-2 text-gray-500">{i + 1}</td>
                    {editingRecord === r.id ? (
                      <>
                        <td className="p-1"><input type="datetime-local" value={editValues.startTime?.slice(0, 16) || ''} onChange={(e) => setEditValues({ ...editValues, startTime: new Date(e.target.value).toISOString() })} className="w-full px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1"><input type="datetime-local" value={editValues.endTime?.slice(0, 16) || ''} onChange={(e) => setEditValues({ ...editValues, endTime: new Date(e.target.value).toISOString() })} className="w-full px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1"><input type="number" value={editValues.duration || 0} onChange={(e) => setEditValues({ ...editValues, duration: Number(e.target.value) })} className="w-16 px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1"><input value={editValues.reason || ''} onChange={(e) => setEditValues({ ...editValues, reason: e.target.value })} className="w-full px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1"><input value={editValues.note || ''} onChange={(e) => setEditValues({ ...editValues, note: e.target.value })} className="w-full px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1"><input value={editValues.aggregate || ''} onChange={(e) => setEditValues({ ...editValues, aggregate: e.target.value })} className="w-full px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1"><input value={editValues.section || ''} onChange={(e) => setEditValues({ ...editValues, section: e.target.value })} className="w-full px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1"><input value={editValues.responsible || ''} onChange={(e) => setEditValues({ ...editValues, responsible: e.target.value })} className="w-full px-1 py-0.5 text-xs border rounded dark:bg-gray-700 dark:border-gray-600" /></td>
                        <td className="p-1 text-xs text-gray-600 dark:text-gray-400">{getShopShortName(r.shop)}</td>
                        <td className="p-1">
                          <div className="flex gap-1 justify-center">
                            <button onClick={saveRecord} className="p-1 text-green-600 hover:bg-green-100 dark:hover:bg-green-900/30 rounded"><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingRecord(null)} className="p-1 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-xs">{new Date(r.startTime).toLocaleString('ru-RU')}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-xs">{new Date(r.endTime).toLocaleString('ru-RU')}</td>
                        <td className="p-2 text-right text-gray-700 dark:text-gray-300 font-medium">{r.duration}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-xs max-w-[200px] truncate">{r.reason}</td>
                        <td className="p-2 text-gray-500 dark:text-gray-400 text-xs max-w-[150px] truncate">{r.note || '—'}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-xs">{r.aggregate}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-xs">{r.section}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-xs">{r.responsible}</td>
                        <td className="p-2 text-gray-700 dark:text-gray-300 text-xs">{getShopShortName(r.shop)}</td>
                        <td className="p-2">
                          <div className="flex gap-1 justify-center">
                            {currentUser?.role === 'admin' && (
                              <>
                                <button onClick={() => startEditRecord(r)} className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded"><Edit3 className="w-3.5 h-3.5" /></button>
                                <button onClick={() => { if (confirm('Удалить запись?')) deleteRecord(downtime.id, r.id); }} className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/30 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'investigation' && <InvestigationTab downtimeId={downtime.id} />}
      {activeTab === 'chat' && <ChatTab downtimeId={downtime.id} />}
      {activeTab === 'files' && <FilesTab downtimeId={downtime.id} />}
      {activeTab === 'audit' && <AuditTab downtimeId={downtime.id} />}
    </div>
  );
}
