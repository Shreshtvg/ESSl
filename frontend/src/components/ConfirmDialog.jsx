import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle } from 'lucide-react';

export default function ConfirmDialog({
  isOpen,
  title = 'Are you sure?',
  message,
  onConfirm,
  onCancel,
  confirmLabel = 'Delete',
  danger = true,
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18 }}
            className="relative bg-white w-full max-w-sm rounded-xl shadow-xl border border-slate-100 z-10 p-6 mx-2"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${danger ? 'bg-rose-50' : 'bg-amber-50'}`}>
                <AlertTriangle className={`h-6 w-6 ${danger ? 'text-rose-500' : 'text-amber-500'}`} />
              </div>
              <div className="space-y-1">
                <h3 className="font-semibold text-slate-800 text-sm">{title}</h3>
                {message && <p className="text-slate-500 text-xs leading-relaxed">{message}</p>}
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={onCancel}
                  className="flex-1 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={onConfirm}
                  className={`flex-1 px-3 py-2 text-xs font-semibold rounded-lg text-white transition-colors cursor-pointer ${
                    danger ? 'bg-rose-500 hover:bg-rose-600' : 'bg-amber-500 hover:bg-amber-600'
                  }`}
                >
                  {confirmLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
