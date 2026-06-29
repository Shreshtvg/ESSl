import { motion } from 'motion/react';

export default function Card({ id, title, value, type, icon: Icon, description }) {
  const getStyles = () => {
    switch (type) {
      case 'present':
        return {
          bg: 'bg-white border-l-4 border-emerald-500',
          iconBg: 'bg-emerald-50 text-emerald-600 border border-emerald-100',
          textColor: 'text-emerald-700',
        };
      case 'absent':
        return {
          bg: 'bg-white border-l-4 border-red-500',
          iconBg: 'bg-red-50 text-red-600 border border-red-100',
          textColor: 'text-red-700',
        };
      case 'leave':
        return {
          bg: 'bg-white border-l-4 border-amber-500',
          iconBg: 'bg-amber-50 text-amber-600 border border-amber-100',
          textColor: 'text-amber-700',
        };
      case 'pending':
        return {
          bg: 'bg-white border-l-4 border-violet-500',
          iconBg: 'bg-violet-50 text-violet-600 border border-violet-100',
          textColor: 'text-violet-700',
        };
      case 'total':
      default:
        return {
          bg: 'bg-white border-l-4 border-blue-600',
          iconBg: 'bg-blue-50 text-blue-600 border border-blue-100',
          textColor: 'text-blue-700',
        };
    }
  };

  const styles = getStyles();

  return (
    <motion.div
      id={id}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300 ${styles.bg} flex items-center justify-between`}
    >
      <div className="space-y-1">
        <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest block font-display">
          {title}
        </span>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold text-slate-800 tracking-tight font-display">
            {value}
          </span>
        </div>
        {description && (
          <span className="text-[10px] text-slate-400 block font-medium">
            {description}
          </span>
        )}
      </div>
      
      {Icon && (
        <div className={`h-11 w-11 rounded-xl flex items-center justify-center ${styles.iconBg} shadow-inner shrink-0`}>
          <Icon className="h-5.5 w-5.5" />
        </div>
      )}
    </motion.div>
  );
}
