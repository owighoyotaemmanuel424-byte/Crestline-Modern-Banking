import React from 'react';

export const SkeletonLine: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 dark:bg-slate-800/80 rounded-md animate-pulse ${className}`} />
);

export const SkeletonCircle: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`bg-slate-200 dark:bg-slate-800/80 rounded-full animate-pulse ${className}`} />
);

export const DashboardSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* 1. Welcome Section Banner Skeleton */}
      <div className="bg-slate-900/90 rounded-3xl p-6 sm:p-8 border border-slate-800/80 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-xl">
            <div className="flex items-center space-x-2">
              <SkeletonLine className="h-6 w-36 rounded-full" />
              <SkeletonLine className="h-5 w-28 rounded-full" />
            </div>
            <SkeletonLine className="h-8 w-72 sm:w-96 rounded-xl" />
            <SkeletonLine className="h-4 w-full max-w-md rounded-md" />
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SkeletonLine className="h-10 w-32 rounded-xl" />
            <SkeletonLine className="h-10 w-32 rounded-xl" />
            <SkeletonLine className="h-10 w-32 rounded-xl" />
          </div>
        </div>
      </div>

      {/* 2. Financial Metrics Cards Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <SkeletonCircle className="w-10 h-10 rounded-xl" />
              <SkeletonLine className="h-5 w-16 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonLine className="h-3.5 w-24" />
              <SkeletonLine className="h-7 w-36" />
            </div>
            <SkeletonLine className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Auxiliary Metrics Grid Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center justify-between">
              <SkeletonCircle className="w-10 h-10 rounded-xl" />
              <SkeletonLine className="h-5 w-14 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonLine className="h-3.5 w-20" />
              <SkeletonLine className="h-7 w-28" />
            </div>
            <SkeletonLine className="h-3 w-28" />
          </div>
        ))}
      </div>

      {/* 3. Recent Users Table Skeleton */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-lg p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
          <div className="space-y-2">
            <SkeletonLine className="h-5 w-32" />
            <SkeletonLine className="h-3.5 w-56" />
          </div>
          <SkeletonLine className="h-6 w-20 rounded-lg" />
        </div>

        <div className="space-y-3.5">
          {[1, 2, 3, 4, 5].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-3 rounded-xl bg-slate-800/30 border border-slate-800/50"
            >
              <div className="flex items-center space-x-3">
                <SkeletonCircle className="w-9 h-9" />
                <div className="space-y-1.5">
                  <SkeletonLine className="h-4 w-36" />
                  <SkeletonLine className="h-3 w-24" />
                </div>
              </div>
              <SkeletonLine className="h-5 w-20 rounded-full" />
              <SkeletonLine className="h-5 w-20 rounded-full" />
              <SkeletonLine className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Analytics Charts Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1.5">
              <SkeletonLine className="h-5 w-48" />
              <SkeletonLine className="h-3.5 w-32" />
            </div>
            <SkeletonLine className="h-6 w-20 rounded-full" />
          </div>
          <div className="h-64 w-full bg-slate-800/40 rounded-xl flex items-end justify-between p-6 gap-3">
            {[40, 65, 30, 85, 50, 95, 70, 60, 80, 45, 90, 75].map((h, idx) => (
              <div
                key={idx}
                className="w-full bg-slate-700/50 rounded-t-lg animate-pulse"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>

        <div className="bg-slate-900/90 rounded-2xl p-6 border border-slate-800/80 shadow-lg space-y-4">
          <div className="space-y-1.5">
            <SkeletonLine className="h-5 w-40" />
            <SkeletonLine className="h-3.5 w-28" />
          </div>
          <div className="h-64 w-full bg-slate-800/40 rounded-xl flex items-end justify-between p-6 gap-3">
            {[30, 50, 75, 40, 90, 60].map((h, idx) => (
              <div
                key={idx}
                className="w-full bg-blue-600/30 rounded-t-lg animate-pulse"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const UsersSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header & Metrics Skeleton */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <SkeletonLine className="h-7 w-64" />
          <SkeletonLine className="h-4 w-80" />
        </div>
        <SkeletonLine className="h-10 w-40 rounded-xl" />
      </div>

      {/* Mini Metrics Bar Skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800/80 shadow-2xs space-y-2"
          >
            <SkeletonLine className="h-3.5 w-24" />
            <SkeletonLine className="h-6 w-16" />
          </div>
        ))}
      </div>

      {/* Search & Filters Bar Skeleton */}
      <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-800/80 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3">
        <SkeletonLine className="h-10 w-full md:w-80 rounded-xl" />
        <div className="flex items-center space-x-3 w-full md:w-auto">
          <SkeletonLine className="h-10 w-36 rounded-xl" />
          <SkeletonLine className="h-10 w-36 rounded-xl" />
        </div>
      </div>

      {/* Table Skeleton */}
      <div className="bg-slate-900/90 rounded-2xl border border-slate-800/80 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-800/80 bg-slate-800/40 flex items-center justify-between">
          <SkeletonLine className="h-4 w-32" />
          <SkeletonLine className="h-4 w-24" />
        </div>

        <div className="p-4 space-y-3">
          {[1, 2, 3, 4, 5, 6].map((row) => (
            <div
              key={row}
              className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/30 border border-slate-800/50"
            >
              <div className="flex items-center space-x-3 w-48">
                <SkeletonCircle className="w-9 h-9" />
                <div className="space-y-1.5 flex-1">
                  <SkeletonLine className="h-4 w-28" />
                  <SkeletonLine className="h-3 w-20" />
                </div>
              </div>

              <SkeletonLine className="h-4 w-36 hidden md:block" />
              <SkeletonLine className="h-4 w-24 font-mono hidden sm:block" />
              <SkeletonLine className="h-5 w-16 rounded-full" />
              <SkeletonLine className="h-5 w-20 rounded-md" />
              <SkeletonLine className="h-5 w-16 rounded-full" />

              <div className="flex items-center space-x-1.5">
                <SkeletonLine className="h-7 w-16 rounded-lg" />
                <SkeletonCircle className="w-7 h-7" />
                <SkeletonCircle className="w-7 h-7" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
