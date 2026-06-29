import { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

const ToastContext = createContext(null);

let _nextId = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const add = useCallback((type, message, duration = 4000) => {
    const id = _nextId++;
    setToasts(prev => [...prev, { id, type, message }]);
    if (duration > 0) {
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration);
    }
  }, []);

  const remove = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const toast = {
    success: (msg, d) => add('success', msg, d),
    error:   (msg, d) => add('error',   msg, d),
    info:    (msg, d) => add('info',    msg, d),
  };

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed top-4 right-4 z-[60] flex flex-col gap-2 w-72 pointer-events-none">
        <AnimatePresence>
          {toasts.map(t => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 60, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 60, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className={`pointer-events-auto flex items-start gap-2.5 px-3.5 py-3 rounded-xl shadow-lg border text-xs font-medium backdrop-blur-sm ${
                t.type === 'error'   ? 'bg-rose-50 border-rose-200 text-rose-800' :
                t.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                                       'bg-blue-50 border-blue-200 text-blue-800'
              }`}
            >
              {t.type === 'error'   && <AlertCircle   className="h-4 w-4 shrink-0 mt-0.5 text-rose-500" />}
              {t.type === 'success' && <CheckCircle2  className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />}
              {t.type === 'info'    && <Info          className="h-4 w-4 shrink-0 mt-0.5 text-blue-500" />}
              <span className="flex-1 leading-relaxed">{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="shrink-0 p-0.5 rounded hover:bg-black/10 cursor-pointer transition-colors"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
