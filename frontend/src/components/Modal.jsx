import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

export default function Modal({ id, isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div id={id || 'modal-overlay'} className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white w-full max-w-lg rounded-xl shadow-xl overflow-hidden border border-slate-100 z-10 mx-2 sm:mx-0"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/70">
              <h2 className="font-display font-semibold text-slate-800 tracking-tight text-sm">
                {title}
              </h2>
              <button
                onClick={onClose}
                className="p-1 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content body */}
            <div className="p-4 overflow-y-auto max-h-[85vh]">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
