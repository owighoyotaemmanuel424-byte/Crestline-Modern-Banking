import React from 'react';
import { DashboardCard } from './DashboardCard';
import { ArrowDownLeft, Clock, ArrowUpRight, ShieldCheck } from 'lucide-react';

export interface MetricsGridProps {
  totalDeposits: number;
  pendingDeposits: number;
  totalTransfers: number;
  pendingTransfers: number;
  onNavigate?: (tab: string, path: string) => void;
}

export const MetricsGrid: React.FC<MetricsGridProps> = ({
  totalDeposits,
  pendingDeposits,
  totalTransfers,
  pendingTransfers,
  onNavigate
}) => {
  const formatCurrency = (val: number) =>
    `$${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Total Deposits (USD) */}
      <DashboardCard
        title="Total Deposits (USD)"
        value={formatCurrency(totalDeposits)}
        subtext="Total completed inbound deposits"
        icon={ArrowDownLeft}
        change="+18.4%"
        isPositive={true}
        gradient="from-amber-500 to-amber-700"
        onClick={() => onNavigate && onNavigate('transactions', '/admin/deposits')}
      />

      {/* 2. Pending Deposits (USD) */}
      <DashboardCard
        title="Pending Deposits (USD)"
        value={formatCurrency(pendingDeposits)}
        subtext="Awaiting verification & settlement"
        icon={Clock}
        badgeText={pendingDeposits > 0 ? 'Review Needed' : 'Cleared'}
        gradient="from-cyan-500 to-teal-700"
        onClick={() => onNavigate && onNavigate('transactions', '/admin/deposits')}
      />

      {/* 3. Total Transfers (USD) */}
      <DashboardCard
        title="Total Transfers (USD)"
        value={formatCurrency(totalTransfers)}
        subtext="Settled outbound wire transfers"
        icon={ArrowUpRight}
        change="+12.1%"
        isPositive={true}
        gradient="from-emerald-500 to-green-700"
        onClick={() => onNavigate && onNavigate('transactions', '/admin/transfers')}
      />

      {/* 4. Pending Transfers (USD) */}
      <DashboardCard
        title="Pending Transfers (USD)"
        value={formatCurrency(pendingTransfers)}
        subtext="Requires admin sign-off"
        icon={Clock}
        badgeText={pendingTransfers > 0 ? 'Pending Wire' : 'Zero Queue'}
        gradient="from-cyan-600 to-blue-700"
        onClick={() => onNavigate && onNavigate('transactions', '/admin/transfers')}
      />
    </div>
  );
};
