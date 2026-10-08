import { useState } from 'react';
import { useApp } from '../store/AppContext';
import { Send } from 'lucide-react';

export default function ChatTab({ downtimeId }: { downtimeId: string }) {
  const { messages, addMessage, currentUser, users } = useApp();
  const [text, setText] = useState('');
  const chatMessages = messages[downtimeId] || [];

  const handleSend = () => {
    if (!text.trim()) return;
    addMessage(downtimeId, text.trim());
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const getUserName = (userId: string) => {
    return users.find((u) => u.id === userId)?.fullName || 'Неизвестный';
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col h-[500px]">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">Обсуждение простоя</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {chatMessages.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Нет сообщений. Начните обсуждение.</p>
        ) : (
          chatMessages.map((msg) => {
            const isOwn = msg.userId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] rounded-lg p-3 ${isOwn ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'}`}>
                  {!isOwn && (
                    <p className="text-xs font-medium mb-1 opacity-70">{getUserName(msg.userId)}</p>
                  )}
                  <p className="text-sm whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-xs mt-1 ${isOwn ? 'text-blue-200' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите сообщение..."
            rows={1}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim()}
            className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
