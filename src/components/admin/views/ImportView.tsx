import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { UploadCloud, FileSpreadsheet, CheckCircle2, AlertTriangle, File as FileIcon } from 'lucide-react';

export const ImportView: React.FC = () => {
  const { setToast } = useAdminStore();
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importStatus, setImportStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [mappingStep, setMappingStep] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setImportStatus('idle');
      setMappingStep(true);
    }
  };

  const handleImport = () => {
    if (!file) return;
    setIsUploading(true);
    setImportStatus('uploading');
    
    // Simulate upload process
    setTimeout(() => {
      setIsUploading(false);
      setImportStatus('success');
      setMappingStep(false);
      setToast('Records imported successfully!', 'success');
      setFile(null);
    }, 2000);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in max-w-4xl mx-auto">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">
          Secure Data Import
        </h1>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
          Import user records, transactions, or leads via CSV. All imports are validated and audit-logged.
        </p>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 shadow-sm p-8 text-center">
        {!file && (
          <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 transition-colors hover:border-blue-500 dark:hover:border-blue-400 bg-slate-50/50 dark:bg-slate-800/30">
            <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-2">Drag & Drop CSV File Here</h3>
            <p className="text-xs text-slate-500 mb-6 max-w-xs mx-auto">
              Please ensure your CSV uses UTF-8 encoding and headers match our supported schemas.
            </p>
            <label className="px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold cursor-pointer hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors inline-block">
              <span>Browse Files</span>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>
          </div>
        )}

        {file && mappingStep && (
          <div className="space-y-6 text-left">
            <div className="flex items-center space-x-4 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800">
              <div className="p-3 bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300 rounded-lg">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">{file.name}</h4>
                <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(2)} KB • Ready for mapping</p>
              </div>
              <button 
                onClick={() => setFile(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>

            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-4 border border-slate-100 dark:border-slate-700">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white mb-3">Detected Columns</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['email', 'first_name', 'last_name', 'status', 'balance', 'phone'].map((col) => (
                  <div key={col} className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-[11px] font-mono text-slate-600 dark:text-slate-300 flex items-center space-x-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{col}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleImport}
                disabled={isUploading}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2 disabled:opacity-70"
              >
                {isUploading ? (
                  <>
                    <UploadCloud className="w-4 h-4 animate-bounce" />
                    <span>Importing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Import Records</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {importStatus === 'success' && !mappingStep && (
          <div className="py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-500 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Import Successful</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                Records have been securely parsed, validated, and inserted into the database. An audit entry has been generated.
              </p>
            </div>
            <div className="pt-4">
              <button
                onClick={() => setImportStatus('idle')}
                className="px-6 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Import Another File
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
