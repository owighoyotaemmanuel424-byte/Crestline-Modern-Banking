import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { useAdminStore } from '../../../store/useAdminStore';
import { MetricsGrid } from '../MetricsGrid';
import { UsersTable, UserRow } from '../UsersTable';
import { DashboardCard } from '../DashboardCard';
import { TransactionDetailsModal } from '../TransactionDetailsModal';
import { ConfirmModal } from '../ConfirmModal';
import { DashboardSkeleton } from '../Skeletons';
import { Transaction } from '../../../types/admin';
import { TRANSACTIONS_OVER_TIME, USER_GROWTH_DATA } from '../../../data/mockData';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import {
  Users,
  XCircle,
  UserCheck,
  UserX,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownLeft,
  Calendar,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  Megaphone,
  ClipboardList,
  Trash2,
  AlertTriangle
} from 'lucide-react';

interface ApiDashboardStats {
  totalDeposits: number;
  pendingDeposits: number;
  totalTransfers: number;
  pendingTransfers: number;
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  recentUsers: Array<{
    id: string;
    email: string;
    status: string;
    kycStatus: string;
    createdAt: string;
  }>;
}

export const DashboardView: React.FC = () => {
  const {
    users,
    transactions,
    adminProfile,
    setActiveTab,
    rejectTransaction,
    purgeDemoData
  } = useAdminStore();

  const [apiStats, setApiStats] = useState<ApiDashboardStats | null>(null);
  const [apiUsers, setApiUsers] = useState<UserRow[]>([]);
  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [txnToReject, setTxnToReject] = useState<Transaction | null>(null);
  const [isPurgeModalOpen, setIsPurgeModalOpen] = useState(false);
  const [purging, setPurging] = useState(false);
  const [loadingApi, setLoadingApi] = useState<boolean>(true);

  // Fetch real backend data from API routes:
  // /api/admin/dashboard-stats, /api/admin/users, /api/admin/deposits, /api/admin/transfers
  const fetchBackendData = async () => {
    setLoadingApi(true);
    try {
      // 1. Fetch dashboard stats
      const statsRes = await fetch('/api/admin/dashboard-stats');
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setApiStats(statsData);
      }

      // 2. Fetch users
      const usersRes = await fetch('/api/admin/users');
      if (usersRes.ok) {
        const usersData = await usersRes.json();
        setApiUsers(
          usersData.map((u: any) => ({
            id: u.id,
            email: u.email,
            status: u.status === 'suspended' ? 'blocked' : u.status,
            kycStatus: u.kycStatus || (u.kycVerified ? 'verified' : 'pending'),
            createdAt: u.joinedDate || u.createdAt || '2026-03-08T00:00:00.000Z'
          }))
        );
      }
    } catch (err) {
      console.warn('Backend API fetch notice (using live fallback):', err);
    } finally {
      setLoadingApi(false);
    }
  };

  useEffect(() => {
    fetchBackendData();
  }, []);

  // Compute metrics with API stats priority or Zustand store fallback
  const totalDepositsUSD = apiStats ? apiStats.totalDeposits : transactions
    .filter((t) => (t.type === 'Credit' || t.category.toLowerCase().includes('deposit')) && t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingDepositsUSD = apiStats ? apiStats.pendingDeposits : transactions
    .filter((t) => (t.type === 'Credit' || t.category.toLowerCase().includes('deposit')) && t.status === 'Pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalTransfersUSD = apiStats ? apiStats.totalTransfers : transactions
    .filter((t) => (t.type === 'Wire Transfer' || t.type === 'Debit') && t.status === 'Completed')
    .reduce((acc, t) => acc + t.amount, 0);

  const pendingTransfersUSD = apiStats ? apiStats.pendingTransfers : transactions
    .filter((t) => (t.type === 'Wire Transfer' || t.type === 'Debit') && t.status === 'Pending')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalUsersCount = apiStats ? Math.max(apiStats.totalUsers, users.length) : users.length;
  const activeUsersCount = users.filter((u) => u.status === 'active').length;
  const blockedUsersCount = users.filter((u) => u.status === 'suspended').length;

  const formattedToday = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Recent Users List derived from backend API or local store fallback
  const displayUsersTableRows: UserRow[] = apiUsers.length > 0
    ? apiUsers
    : (apiStats?.recentUsers ? apiStats.recentUsers.map((ru) => ({
        id: ru.id,
        email: ru.email,
        status: ru.status,
        kycStatus: ru.kycStatus,
        createdAt: ru.createdAt
      })) : users.map((u) => ({
        id: u.id,
        email: u.email,
        status: u.status === 'suspended' ? 'blocked' : u.status,
        kycStatus: u.kycVerified ? 'verified' : u.kycStatus || 'pending',
        createdAt: u.joinedDate
      })));

  const handleQuickNav = (tab: string, path: string) => {
    if (window.history && window.history.pushState) {
      window.history.pushState({}, '', path);
    }
    setActiveTab(tab);
  };

  const pendingCount = (apiStats?.pendingTransfers || 0) + 
    (apiStats?.pendingDeposits || 0) + 
    transactions.filter(t => t.status === 'Pending').length;

  const handleConfirmPurge = async () => {
    setPurging(true);
    const res = await purgeDemoData();
    setPurging(false);
    setIsPurgeModalOpen(false);
    if (res.success) {
      await fetchBackendData();
    }
  };

  if (loadingApi) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* 1. Welcome Section Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-3xl p-6 sm:p-8 text-white shadow-2xl relative overflow-hidden border border-slate-800">
        <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-white/5 skew-x-12 pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                <Sparkles className="w-3 h-3 mr-1 text-amber-300" /> Financial Control Panel
              </span>
              <span className="inline-flex items-center text-[11px] font-semibold text-slate-300">
                <Calendar className="w-3 h-3 mr-1 text-slate-400" /> {formattedToday}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Welcome back, {adminProfile.name ? adminProfile.name.split(' ')[0] : 'Admin'}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Real-time financial control panel for deposit liquidity, wire transfers, user compliance, and transaction visibility.
            </p>
          </div>

          {/* Quick Action Buttons in Banner */}
          <div className="flex flex-wrap items-center gap-2.5 z-10">
            <button
              id="banner-action-approve-pending"
              onClick={() => handleQuickNav('withdrawals', '/admin/withdrawals')}
              className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-emerald-600/20 active:scale-95 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-200" />
              <span>Approve Pending</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[10px] font-black">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              id="banner-action-broadcast-alert"
              onClick={() => handleQuickNav('broadcast', '/admin/broadcast')}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center space-x-2 shadow-lg shadow-indigo-600/20 active:scale-95 cursor-pointer"
            >
              <Megaphone className="w-4 h-4 text-indigo-200" />
              <span>Broadcast Alert</span>
            </button>

            <button
              id="banner-action-view-audit-log"
              onClick={() => handleQuickNav('audit-log', '/admin/audit-log')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all flex items-center space-x-2 border border-white/15 backdrop-blur-md active:scale-95 cursor-pointer"
            >
              <ClipboardList className="w-4 h-4 text-blue-300" />
              <span>View Audit Log</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Administrative Actions Hub */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Quick Administrative Actions
              </h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Direct access shortcuts to common operational, compliance, and ledger workflows
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-[11px] font-medium text-slate-400">
              System: <span className="font-bold text-emerald-600 dark:text-emerald-400">Operational</span>
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {/* 1. Approve Pending */}
          <button
            id="quick-action-approve-pending"
            onClick={() => handleQuickNav('withdrawals', '/admin/withdrawals')}
            className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500/60 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-emerald-50/40 dark:hover:bg-emerald-950/20 text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 group-hover:scale-110 transition-transform">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              {pendingCount > 0 ? (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-500 text-slate-950 animate-pulse">
                  {pendingCount} Pending
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                  Ready
                </span>
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Approve Pending
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                Review & authorize pending withdrawals, wires, and settlement requests
              </p>
            </div>
          </button>

          {/* 2. Broadcast Alert */}
          <button
            id="quick-action-broadcast-alert"
            onClick={() => handleQuickNav('broadcast', '/admin/broadcast')}
            className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500/60 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-indigo-50/40 dark:hover:bg-indigo-950/20 text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 group-hover:scale-110 transition-transform">
                <Megaphone className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300">
                Notice
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                Broadcast Alert
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                Dispatch urgent platform bulletins & mass notices to client accounts
              </p>
            </div>
          </button>

          {/* 3. View Audit Log */}
          <button
            id="quick-action-view-audit-log"
            onClick={() => handleQuickNav('audit-log', '/admin/audit-log')}
            className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-blue-500/60 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-blue-50/40 dark:hover:bg-blue-950/20 text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 group-hover:scale-110 transition-transform">
                <ClipboardList className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                Immutable
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                View Audit Log
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                Inspect regulatory compliance events, login trials, and ledger records
              </p>
            </div>
          </button>

          {/* 4. Verify KYC */}
          <button
            id="quick-action-verify-kyc"
            onClick={() => handleQuickNav('kyc', '/admin/kyc')}
            className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-amber-500/60 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-amber-50/40 dark:hover:bg-amber-950/20 text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 group-hover:scale-110 transition-transform">
                <UserCheck className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                Identity
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                Verify KYC
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                Review pending customer passports, IDs, and compliance reviews
              </p>
            </div>
          </button>

          {/* 5. Manage Users */}
          <button
            id="quick-action-manage-users"
            onClick={() => handleQuickNav('users', '/admin/users')}
            className="group relative p-4 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-purple-500/60 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-purple-50/40 dark:hover:bg-purple-950/20 text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                Directory
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                Manage Users
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                Adjust client balances, toggle account locks, and inspect profiles
              </p>
            </div>
          </button>

          {/* 6. Purge Demo Data (Production Clean) */}
          <button
            id="quick-action-purge-demo"
            onClick={() => setIsPurgeModalOpen(true)}
            className="group relative p-4 rounded-2xl border border-rose-200/80 dark:border-rose-900/40 hover:border-rose-500/60 bg-rose-50/40 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition-all duration-200 flex flex-col justify-between active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-center justify-between w-full mb-3">
              <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 group-hover:scale-110 transition-transform">
                <Trash2 className="w-5 h-5" />
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                Production
              </span>
            </div>
            <div>
              <h3 className="text-sm font-bold text-rose-700 dark:text-rose-300 group-hover:text-rose-600 transition-colors">
                Purge Demo Data
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                Remove all mock data & customer test profiles for live launch
              </p>
            </div>
          </button>
        </div>
      </div>

      {/* 2. Financial Metrics Cards Grid */}
      <MetricsGrid
        totalDeposits={totalDepositsUSD}
        pendingDeposits={pendingDepositsUSD}
        totalTransfers={totalTransfersUSD}
        pendingTransfers={pendingTransfersUSD}
        onNavigate={handleQuickNav}
      />

      {/* Auxiliary User & System Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <DashboardCard
          title="Total Users"
          value={totalUsersCount.toLocaleString()}
          change="+14.2%"
          isPositive={true}
          icon={Users}
          gradient="from-slate-700 to-slate-900"
          subtext="Registered accounts"
          onClick={() => handleQuickNav('users', '/admin/users')}
        />

        <DashboardCard
          title="Active Users"
          value={activeUsersCount.toLocaleString()}
          isPositive={true}
          icon={UserCheck}
          gradient="from-teal-600 to-emerald-700"
          subtext="Verified active accounts"
          onClick={() => handleQuickNav('users', '/admin/users')}
        />

        <DashboardCard
          title="Blocked Users"
          value={blockedUsersCount.toString()}
          isPositive={false}
          icon={UserX}
          gradient="from-rose-600 to-red-800"
          badgeText={blockedUsersCount > 0 ? 'Blocked' : undefined}
          subtext="Suspended risk accounts"
          onClick={() => handleQuickNav('users', '/admin/users')}
        />

        <motion.div
          whileHover={{ scale: 1.01, y: -2 }}
          className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-5 text-white flex flex-col justify-between shadow-lg backdrop-blur-md"
        >
          <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold mb-1">
            <span>System Data Stream</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-base font-extrabold text-white">Live Backend REST Connected</p>
          <p className="text-[11px] text-slate-400 mt-1">/api/admin/dashboard-stats • 200 OK</p>
          <div className="mt-3 text-[10px] font-mono text-emerald-400 flex items-center space-x-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Synced with Express API</span>
          </div>
        </motion.div>
      </div>

      {/* 3. User Management Section: Recent Users Table */}
      <UsersTable
        users={displayUsersTableRows}
        onViewAll={() => handleQuickNav('users', '/admin/users')}
        onSelectUser={(userId) => handleQuickNav('users', `/admin/users/${userId}`)}
      />

      {/* 4. Financial Settlement & Growth Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white">
                Platform Transfer & Settlement Stream
              </h3>
              <p className="text-xs text-slate-400">
                Daily transaction volume ($ USD)
              </p>
            </div>
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-blue-950/80 text-blue-300 border border-blue-800/50">
              Live Feed
            </span>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={TRANSACTIONS_OVER_TIME}>
                <defs>
                  <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `$${val / 1000}k`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Volume']}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  stroke="#2563eb"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorVolume)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 shadow-lg space-y-4">
          <div>
            <h3 className="text-base font-bold text-white">
              Customer Registration Growth
            </h3>
            <p className="text-xs text-slate-400">
              Monthly onboarding velocity
            </p>
          </div>

          <div className="h-64 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={USER_GROWTH_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="newUsers" name="New Users" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Purge Demo Data Confirmation Modal */}
      <ConfirmModal
        isOpen={isPurgeModalOpen}
        onClose={() => setIsPurgeModalOpen(false)}
        onConfirm={handleConfirmPurge}
        title="Purge All Demo Data for Production"
        description="Are you sure you want to purge all demo customer profiles (Sarah Jenkins, David Nguyen, etc.), simulated transactions, test cards, and dummy KYC submissions? This prepares the bank database for live production operation. The Super Administrator account (Emmanuel Owighoyota) and system configurations will remain fully operational."
        confirmText={purging ? "Purging Demo Data..." : "Purge All Demo Data"}
        cancelText="Keep Demo Data"
        variant="danger"
        icon={Trash2}
      />

      {/* Reject Confirmation Modal */}
      <ConfirmModal
        isOpen={!!txnToReject}
        onClose={() => setTxnToReject(null)}
        onConfirm={() => {
          if (txnToReject) {
            rejectTransaction(txnToReject.id);
            setTxnToReject(null);
          }
        }}
        title={`Reject Transaction #${txnToReject?.id}`}
        description={`Are you sure you want to reject this ${txnToReject?.type} request for $${txnToReject?.amount.toLocaleString()}? This action will halt settlement and notify customer ${txnToReject?.userName}.`}
        confirmText="Reject Transaction"
        cancelText="Cancel"
        variant="danger"
        icon={XCircle}
      />

      {/* Transaction Inspection Modal */}
      <TransactionDetailsModal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        transaction={selectedTxn}
      />
    </div>
  );
};

