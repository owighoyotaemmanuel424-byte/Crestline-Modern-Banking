import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'status' | 'tier' | 'risk' | 'type';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, type = 'status' }) => {
  const normalized = status.toLowerCase();

  let style = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";

  if (type === 'status') {
    if (normalized === 'active' || normalized === 'completed') {
      style = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50";
    } else if (normalized === 'pending') {
      style = "bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/50 animate-pulse";
    } else if (normalized === 'suspended' || normalized === 'rejected' || normalized === 'frozen') {
      style = "bg-rose-50 text-rose-700 dark:bg-rose-950/50 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/50";
    }
  } else if (type === 'risk') {
    if (normalized === 'high') {
      style = "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-semibold";
    } else if (normalized === 'medium') {
      style = "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300";
    } else {
      style = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  } else if (type === 'tier') {
    if (normalized === 'vip') {
      style = "bg-gradient-to-r from-amber-500 to-amber-700 text-white font-medium shadow-xs";
    } else if (normalized === 'business') {
      style = "bg-blue-600 text-white font-medium";
    } else if (normalized === 'premium') {
      style = "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300 font-medium";
    } else {
      style = "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  } else if (type === 'type') {
    if (normalized.includes('credit')) {
      style = "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400";
    } else if (normalized.includes('debit')) {
      style = "bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400";
    } else if (normalized.includes('wire')) {
      style = "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400";
    } else {
      style = "bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400";
    }
  }

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium tracking-tight ${style}`}>
      <span className="w-1.5 h-1.5 rounded-full mr-1.5 bg-current opacity-70"></span>
      {status}
    </span>
  );
};
