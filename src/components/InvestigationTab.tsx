import { useState, useEffect } from 'react';
import { useApp } from '../store/AppContext';
import { Save, Download, Plus, Trash2 } from 'lucide-react';
import type { IncidentInvestigation, PlannedAction, TimelineEntry } from '../types';
import { exportInvestigationToDocx } from '../services/exportDocx';

export default function InvestigationTab({ downtimeId }: { downtimeId: string }) {
  const { getInvestigation, saveInvestigation, currentUser } = useApp();
  const [inv, setInv] = useState<IncidentInvestigation | null>(null);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    const investigation = getInvestigation(downtimeId);
    setInv(investigation);
  }, [downtimeId, getInvestigation]);

  if (!inv) return <div className="p-8 text-center text-gray-500">Загрузка...</div>;

  const isAdmin = currentUser?.role === 'admin';

  const update = (updates: Partial<IncidentInvestigation>) => {
    setInv({ ...inv, ...updates });
    setDirty(true);
  };

  const handleSave = () => {
    saveInvestigation(inv);
    setDirty(false);
  };

  const handleExport = () => {
    exportInvestigationToDocx(inv);
  };

  // Planned actions
  const addAction = () => {
    const newAction: PlannedAction = {
      id: crypto.randomUUID(),
      number: inv.plannedActions.length + 1,
      text: '',
      responsible: '',
      deadline: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      resultFormat: '',
      status: 'pending',
    };
    update({ plannedActions: [...inv.plannedActions, newAction] });
  };

  const updateAction = (id: string, updates: Partial<PlannedAction>) => {
    update({
      plannedActions: inv.plannedActions.map((a) => a.id === id ? { ...a, ...updates } : a),
    });
  };

  const removeAction = (id: string) => {
    update({ plannedActions: inv.plannedActions.filter((a) => a.id !== id) });
  };

  // Timeline
  const addDateSeparator = () => {
    const entry: TimelineEntry = {
      id: crypto.randomUUID(),
      type: 'date-separator',
      dateLabel: '',
      description: '',
    };
    update({ timeline: [...inv.timeline, entry] });
  };

  const addEvent = () => {
    const entry: TimelineEntry = {
      id: crypto.randomUUID(),
      type: 'event',
      time: '',
      description: '',
    };
    update({ timeline: [...inv.timeline, entry] });
  };

  const updateTimeline = (id: string, updates: Partial<TimelineEntry>) => {
    update({
      timeline: inv.timeline.map((e) => e.id === id ? { ...e, ...updates } : e),
    });
  };

  const removeTimeline = (id: string) => {
    update({ timeline: inv.timeline.filter((e) => e.id !== id) });
  };

  // Causes
  const addCause = (type: 'immediateCauses' | 'rootCauses' | 'contributingCauses') => {
    update({ [type]: [...inv[type], ''] });
  };

  const updateCause = (type: 'immediateCauses' | 'rootCauses' | 'contributingCauses', index: number, value: string) => {
    const arr = [...inv[type]];
    arr[index] = value;
    update({ [type]: arr });
  };

  const removeCause = (type: 'immediateCauses' | 'rootCauses' | 'contributingCauses', index: number) => {
    update({ [type]: inv[type].filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-6">
      {/* Actions bar */}
      <div className="flex items-center gap-3">
        {isAdmin && (
          <button
            onClick={handleSave}
            disabled={!dirty}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium rounded-lg flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> Сохранить
          </button>
        )}
        <button
          onClick={handleExport}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Download className="w-4 h-4" /> Экспорт в Word
        </button>
        {dirty && <span className="text-sm text-yellow-600 dark:text-yellow-400">● Есть несохранённые изменения</span>}
      </div>

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Разбор инцидента</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Номер разбора</label>
            <input
              value={inv.investigationNumber}
              onChange={(e) => update({ investigationNumber: e.target.value })}
              disabled={!isAdmin}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Уровень инцидента</label>
            <select
              value={inv.incidentLevel}
              onChange={(e) => update({ incidentLevel: Number(e.target.value) })}
              disabled={!isAdmin}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
            >
              {[1, 2, 3, 4].map((l) => <option key={l} value={l}>Уровень {l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Дата</label>
            <input
              type="date"
              value={inv.date.split('T')[0]}
              onChange={(e) => update({ date: new Date(e.target.value).toISOString() })}
              disabled={!isAdmin}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Фактическая продолжительность (мин)</label>
            <input
              type="number"
              value={inv.actualDuration}
              onChange={(e) => update({ actualDuration: Number(e.target.value) })}
              disabled={!isAdmin}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
            />
          </div>
        </div>
        <div className="mt-4">
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Инцидент</label>
          <textarea
            value={inv.incidentDescription}
            onChange={(e) => update({ incidentDescription: e.target.value })}
            disabled={!isAdmin}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
          />
        </div>
      </div>

      {/* Production & Shipment tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Простои производства</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-2 text-left text-gray-600 dark:text-gray-400">Цех</th>
                <th className="p-2 text-right text-gray-600 dark:text-gray-400">Длит. (мин)</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-400">Примечание</th>
              </tr>
            </thead>
            <tbody>
              {inv.productionDowntimes.map((pd, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-2"><input value={pd.shop} onChange={(e) => { const arr = [...inv.productionDowntimes]; arr[i] = { ...arr[i], shop: e.target.value }; update({ productionDowntimes: arr }); }} disabled={!isAdmin} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                  <td className="p-2"><input type="number" value={pd.duration} onChange={(e) => { const arr = [...inv.productionDowntimes]; arr[i] = { ...arr[i], duration: Number(e.target.value) }; update({ productionDowntimes: arr }); }} disabled={!isAdmin} className="w-16 px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                  <td className="p-2"><input value={pd.note} onChange={(e) => { const arr = [...inv.productionDowntimes]; arr[i] = { ...arr[i], note: e.target.value }; update({ productionDowntimes: arr }); }} disabled={!isAdmin} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Простои отгрузки</h4>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="p-2 text-left text-gray-600 dark:text-gray-400">Направление</th>
                <th className="p-2 text-right text-gray-600 dark:text-gray-400">Длит. (мин)</th>
                <th className="p-2 text-left text-gray-600 dark:text-gray-400">Примечание</th>
              </tr>
            </thead>
            <tbody>
              {inv.shipmentDowntimes.map((sd, i) => (
                <tr key={i} className="border-b border-gray-100 dark:border-gray-700">
                  <td className="p-2"><input value={sd.destination} onChange={(e) => { const arr = [...inv.shipmentDowntimes]; arr[i] = { ...arr[i], destination: e.target.value }; update({ shipmentDowntimes: arr }); }} disabled={!isAdmin} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                  <td className="p-2"><input type="number" value={sd.duration} onChange={(e) => { const arr = [...inv.shipmentDowntimes]; arr[i] = { ...arr[i], duration: Number(e.target.value) }; update({ shipmentDowntimes: arr }); }} disabled={!isAdmin} className="w-16 px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                  <td className="p-2"><input value={sd.note} onChange={(e) => { const arr = [...inv.shipmentDowntimes]; arr[i] = { ...arr[i], note: e.target.value }; update({ shipmentDowntimes: arr }); }} disabled={!isAdmin} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Causes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {(['immediateCauses', 'rootCauses', 'contributingCauses'] as const).map((type) => {
          const labels = { immediateCauses: 'Непосредственные причины', rootCauses: 'Корневые причины', contributingCauses: 'Сопутствующие причины' };
          return (
            <div key={type} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-3">{labels[type]}</h4>
              <div className="space-y-2">
                {inv[type].map((c, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      value={c}
                      onChange={(e) => updateCause(type, i, e.target.value)}
                      disabled={!isAdmin}
                      className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
                    />
                    {isAdmin && (
                      <button onClick={() => removeCause(type, i)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              {isAdmin && (
                <button onClick={() => addCause(type)} className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
                  <Plus className="w-3.5 h-3.5" /> Добавить
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* Taken measures */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Принятые меры</h4>
        <div className="space-y-2">
          {inv.takenMeasures.map((m, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-gray-500 text-sm w-6">{i + 1}.</span>
              <input
                value={m}
                onChange={(e) => { const arr = [...inv.takenMeasures]; arr[i] = e.target.value; update({ takenMeasures: arr }); }}
                disabled={!isAdmin}
                className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
              />
              {isAdmin && (
                <button onClick={() => update({ takenMeasures: inv.takenMeasures.filter((_, idx) => idx !== i) })} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
        {isAdmin && (
          <button onClick={() => update({ takenMeasures: [...inv.takenMeasures, ''] })} className="mt-2 text-sm text-blue-600 hover:underline flex items-center gap-1">
            <Plus className="w-3.5 h-3.5" /> Добавить меру
          </button>
        )}
      </div>

      {/* Planned actions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Запланированные мероприятия</h4>
          {isAdmin && (
            <button onClick={addAction} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Добавить
            </button>
          )}
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <th className="p-2 text-left text-gray-600 dark:text-gray-400 w-10">№</th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-400">Мероприятие</th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-400">Ответственный</th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-400">Срок</th>
              <th className="p-2 text-left text-gray-600 dark:text-gray-400">Формат результата</th>
              <th className="p-2 text-center text-gray-600 dark:text-gray-400">Статус</th>
              <th className="p-2 w-10"></th>
            </tr>
          </thead>
          <tbody>
            {inv.plannedActions.map((a) => (
              <tr key={a.id} className="border-b border-gray-100 dark:border-gray-700">
                <td className="p-2 text-gray-500">{a.number}</td>
                <td className="p-2"><input value={a.text} onChange={(e) => updateAction(a.id, { text: e.target.value })} disabled={!isAdmin} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                <td className="p-2"><input value={a.responsible} onChange={(e) => updateAction(a.id, { responsible: e.target.value })} disabled={!isAdmin} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                <td className="p-2"><input type="date" value={a.deadline.split('T')[0]} onChange={(e) => updateAction(a.id, { deadline: e.target.value })} disabled={!isAdmin} className="px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                <td className="p-2"><input value={a.resultFormat} onChange={(e) => updateAction(a.id, { resultFormat: e.target.value })} disabled={!isAdmin} className="w-full px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600" /></td>
                <td className="p-2 text-center">
                  <select
                    value={a.status}
                    onChange={(e) => updateAction(a.id, { status: e.target.value as PlannedAction['status'] })}
                    disabled={!isAdmin}
                    className="px-1 py-0.5 border rounded text-xs dark:bg-gray-700 dark:border-gray-600"
                  >
                    <option value="pending">Не выполнено</option>
                    <option value="completed">Выполнено</option>
                    <option value="overdue">Просрочено</option>
                  </select>
                </td>
                <td className="p-2">
                  {isAdmin && (
                    <button onClick={() => removeAction(a.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Special opinion */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Особое мнение</h4>
        <textarea
          value={inv.specialOpinion}
          onChange={(e) => update({ specialOpinion: e.target.value })}
          disabled={!isAdmin}
          rows={3}
          placeholder="Особое мнение участников разбора..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
        />
      </div>

      {/* Timeline */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-gray-900 dark:text-white">Хронология событий</h4>
          {isAdmin && (
            <div className="flex gap-2">
              <button onClick={addDateSeparator} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Дата-разделитель
              </button>
              <button onClick={addEvent} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Событие
              </button>
            </div>
          )}
        </div>
        <div className="space-y-1">
          {inv.timeline.map((entry) => (
            <div key={entry.id} className={`flex items-center gap-2 ${entry.type === 'date-separator' ? 'mt-3' : ''}`}>
              {entry.type === 'date-separator' ? (
                <>
                  <input
                    value={entry.dateLabel || ''}
                    onChange={(e) => updateTimeline(entry.id, { dateLabel: e.target.value })}
                    disabled={!isAdmin}
                    placeholder="Среда, 19.11.2025"
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-yellow-50 dark:bg-yellow-900/20 text-gray-900 dark:text-white text-sm font-semibold disabled:opacity-60"
                  />
                </>
              ) : (
                <>
                  <input
                    value={entry.time || ''}
                    onChange={(e) => updateTimeline(entry.id, { time: e.target.value })}
                    disabled={!isAdmin}
                    placeholder="14:30"
                    className="w-20 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
                  />
                  <input
                    value={entry.description}
                    onChange={(e) => updateTimeline(entry.id, { description: e.target.value })}
                    disabled={!isAdmin}
                    placeholder="Описание события"
                    className="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm disabled:opacity-60"
                  />
                </>
              )}
              {isAdmin && (
                <button onClick={() => removeTimeline(entry.id)} className="p-1 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 rounded">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
