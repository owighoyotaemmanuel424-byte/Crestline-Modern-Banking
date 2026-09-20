import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

export interface DashboardCardProps {
  title: string;
  value: string;
  subtext?: string;
  icon: LucideIcon;
  change?: string;
  isPositive?: boolean;
  badgeText?: string;
  gradient?: string;
  onClick?: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({
  title,
  value,
  subtext,
  icon: Icon,
  change,
  isPositive,
  badgeText,
  gradient = 'from-blue-600 to-indigo-700',
  onClick
}) => {
  return (
    <motion.div
      whileHover={{ y: -3, scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
      onClick={onClick}
      className={`bg-slate-900/90 dark:bg-slate-900/90 border border-slate-800/80 dark:border-slate-800/80 rounded-2xl p-5 shadow-lg shadow-black/20 backdrop-blur-md transition-all ${
        onClick ? 'cursor-pointer hover:border-slate-700 hover:shadow-blue-500/10' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} text-white shadow-md shadow-black/30`}>
            <Icon className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {title}
            </h3>
            <p className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1 font-mono">
              {value}
            </p>
          </div>
        </div>

        {badgeText && (
          <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            {badgeText}
          </span>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        {subtext ? (
          <span className="text-slate-400 font-medium text-[11px] truncate">
            {subtext}
          </span>
        ) : (
          <span />
        )}

        {change && (
          <div
            className={`flex items-center space-x-1 text-[11px] font-bold px-2 py-0.5 rounded-md ${
              isPositive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}
          >
            {isPositive ? (
              <TrendingUp className="w-3 h-3 text-emerald-400" />
            ) : (
              <TrendingDown className="w-3 h-3 text-rose-400" />
            )}
            <span>{change}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
