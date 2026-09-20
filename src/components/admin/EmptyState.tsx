import React from 'react';
import { SearchX, Filter, RotateCcw } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'No Results Found',
  description = 'We couldn\'t find any items matching your current query or filters. Try adjusting your search criteria.',
  icon: Icon = SearchX,
  actionLabel = 'Reset Filters',
  onAction,
  className = ''
}) => {
  return (
    <div className={`flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-900/40 border border-dashed border-slate-200 dark:border-slate-800 ${className}`}>
      <div className="relative mb-4">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 dark:from-blue-500/20 dark:to-indigo-500/20 border border-blue-500/20 dark:border-blue-400/30 flex items-center justify-center text-blue-600 dark:text-blue-400 shadow-xs">
          <Icon className="w-8 h-8" />
        </div>
        <div className="absolute -bottom-1 -right-1 p-1 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 text-slate-400">
          <Filter className="w-3 h-3" />
        </div>
      </div>

      <h3 className="text-sm font-bold text-slate-900 dark:text-white max-w-sm">
        {title}
      </h3>

      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-md leading-relaxed">
        {description}
      </p>

      {onAction && (
        <button
          onClick={onAction}
          className="mt-5 px-4 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700/70 transition-colors flex items-center space-x-2 shadow-2xs"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-500" />
          <span>{actionLabel}</span>
        </button>
      )}
    </div>
  );
};
