import { useApp } from '../store/AppContext';
import { useNavigate } from 'react-router-dom';
import { FileText, Eye } from 'lucide-react';
import { getShopShortName } from '../data/shops';
import { formatDuration } from '../services/dataSource';

export default function InvestigationsPage() {
  const { consolidatedDowntimes, getInvestigation } = useApp();
  const navigate = useNavigate();

  const withInvestigation = consolidatedDowntimes.filter((d) => d.records.length > 0);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Разборы инцидентов</h2>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        Список сводных простоев с привязанными разборами инцидентов
      </p>

      {withInvestigation.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Нет простоев для отображения. Загрузите данные на странице «Отчёт по простоям».</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Название</th>
                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Цех</th>
                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Дата</th>
                <th className="p-3 text-right font-semibold text-gray-600 dark:text-gray-300">Длительность</th>
                <th className="p-3 text-left font-semibold text-gray-600 dark:text-gray-300">Номер разбора</th>
                <th className="p-3 text-center font-semibold text-gray-600 dark:text-gray-300">Действия</th>
              </tr>
            </thead>
            <tbody>
              {withInvestigation.slice(0, 50).map((d) => {
                const inv = getInvestigation(d.id);
                return (
                  <tr key={d.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                    <td className="p-3 font-medium text-gray-900 dark:text-white">{d.title}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{getShopShortName(d.shop)}</td>
                    <td className="p-3 text-gray-700 dark:text-gray-300">{new Date(d.date).toLocaleDateString('ru-RU')}</td>
                    <td className="p-3 text-right text-gray-700 dark:text-gray-300">{formatDuration(d.totalDuration)}</td>
                    <td className="p-3 text-gray-600 dark:text-gray-400 font-mono text-xs">{inv.investigationNumber}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => navigate(`/downtime/${d.id}`)}
                          className="px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-medium rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" /> Открыть
                        </button>
                        <button
                          onClick={() => navigate(`/downtime/${d.id}`)}
                          className="px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-xs font-medium rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 flex items-center gap-1"
                        >
                          <FileText className="w-3.5 h-3.5" /> Разбор
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
