import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useAdminStore } from '../../store/useAdminStore';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export const ToastNotification: React.FC = () => {
  const { toastMessage, clearToast } = useAdminStore();

  return (
    <AnimatePresence>
      {toastMessage && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25 }}
          className="fixed bottom-5 right-5 z-50 flex items-center p-4 rounded-2xl shadow-xl max-w-md border border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md"
        >
          <div className="mr-3">
            {toastMessage.type === 'success' && (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
            {toastMessage.type === 'error' && (
              <AlertCircle className="w-5 h-5 text-rose-500" />
            )}
            {toastMessage.type === 'info' && (
              <Info className="w-5 h-5 text-blue-500" />
            )}
          </div>

          <p className="text-xs font-semibold text-slate-900 dark:text-white mr-4">
            {toastMessage.text}
          </p>

          <button
            onClick={clearToast}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
