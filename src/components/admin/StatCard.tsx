import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  isPositive?: boolean;
  icon: LucideIcon;
  gradient?: string;
  badgeText?: string;
  onClick?: () => void;
  subtext?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  icon: Icon,
  gradient = "from-blue-600 to-indigo-700",
  badgeText,
  onClick,
  subtext
}) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 350, damping: 25 }}
      onClick={onClick}
      className={`bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800/80 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden group ${
        onClick ? 'cursor-pointer' : ''
      }`}
    >
      {/* Decorative top gradient accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />

      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase">
            {title}
          </p>
          <h3 className="text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>
        </div>

        <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${gradient} text-white shadow-md shadow-blue-500/10 group-hover:scale-105 transition-transform`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs">
        {change && (
          <div className="flex items-center space-x-1.5">
            <span
              className={`inline-flex items-center px-2 py-0.5 rounded-md font-semibold ${
                isPositive
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400'
                  : 'bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400'
              }`}
            >
              {isPositive ? '↑' : '↓'} {change}
            </span>
            <span className="text-slate-400 dark:text-slate-500 font-normal">vs last period</span>
          </div>
        )}

        {badgeText && (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
            {badgeText}
          </span>
        )}

        {subtext && !change && !badgeText && (
          <span className="text-slate-400 dark:text-slate-500">{subtext}</span>
        )}
      </div>
    </motion.div>
  );
};
