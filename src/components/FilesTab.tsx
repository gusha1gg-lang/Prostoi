import { useRef } from 'react';
import { useApp } from '../store/AppContext';
import { Upload, Trash2, Download, FileText, Image } from 'lucide-react';

export default function FilesTab({ downtimeId }: { downtimeId: string }) {
  const { files, addFile, deleteFile } = useApp();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const downtimeFiles = files.filter((f) => f.downtimeId === downtimeId);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList) return;
    for (let i = 0; i < fileList.length; i++) {
      await addFile(downtimeId, fileList[i]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDownload = (file: { fileName: string; data: string }) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.fileName;
    link.click();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
  };

  const isImage = (mime: string) => mime.startsWith('image/');
  const isPdf = (mime: string) => mime === 'application/pdf';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <h3 className="font-semibold text-gray-900 dark:text-white">Прикреплённые файлы</h3>
        <button
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg flex items-center gap-2"
        >
          <Upload className="w-4 h-4" /> Загрузить файл
        </button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      <div className="p-4">
        {downtimeFiles.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Нет прикреплённых файлов</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {downtimeFiles.map((file) => (
              <div key={file.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                    {isImage(file.mimeType) ? (
                      <Image className="w-5 h-5 text-blue-500" />
                    ) : (
                      <FileText className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{file.fileName}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatSize(file.fileSize)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {new Date(file.uploadedAt).toLocaleString('ru-RU')}
                    </p>
                  </div>
                </div>

                {/* Preview */}
                {isImage(file.mimeType) && (
                  <div className="mt-2">
                    <img src={file.data} alt={file.fileName} className="w-full h-32 object-cover rounded border border-gray-200 dark:border-gray-700" />
                  </div>
                )}

                <div className="flex items-center gap-2 mt-2">
                  <button
                    onClick={() => handleDownload(file)}
                    className="flex-1 px-2 py-1.5 text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-100 dark:hover:bg-blue-900/40 flex items-center justify-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" /> Скачать
                  </button>
                  <button
                    onClick={() => { if (confirm('Удалить файл?')) deleteFile(file.id); }}
                    className="px-2 py-1.5 text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded hover:bg-red-100 dark:hover:bg-red-900/40 flex items-center justify-center gap-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
