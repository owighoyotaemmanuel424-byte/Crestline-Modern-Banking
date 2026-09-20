import React, { useState } from 'react';
import {
  REVENUE_DATA,
  TRANSACTIONS_OVER_TIME,
  USER_GROWTH_DATA,
  CATEGORY_BREAKDOWN
} from '../../../data/mockData';
import { useAdminStore } from '../../../store/useAdminStore';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend
} from 'recharts';
import {
  BarChart3,
  Download,
  TrendingUp,
  DollarSign,
  PieChart as PieIcon,
  Users
} from 'lucide-react';

export const AnalyticsView: React.FC = () => {
  const { setToast } = useAdminStore();
  const [timeframe, setTimeframe] = useState<'30d' | '90d' | 'YTD'>('30d');

  const handleExportCSV = () => {
    const csvHeader = "Month,Interchange Fees ($),Wire Fees ($),Wealth Mgmt ($)\n";
    const csvRows = REVENUE_DATA.map(r => `${r.month},${r.interchangeFees},${r.wireFees},${r.wealthMgmt}`).join('\n');
    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Crestline_Financial_Report_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setToast('Financial CSV report generated and downloaded!', 'success');
  };

  const totalRevenueThisMonth = REVENUE_DATA[REVENUE_DATA.length - 1].interchangeFees +
    REVENUE_DATA[REVENUE_DATA.length - 1].wireFees +
    REVENUE_DATA[REVENUE_DATA.length - 1].wealthMgmt;

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Platform Financial Analytics & Liquidity Insights
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Comprehensive revenue streams, transaction categories, and customer growth trends
          </p>
        </div>

        <div className="flex items-center space-x-3 self-start sm:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 text-xs font-semibold">
            {(['30d', '90d', 'YTD'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTimeframe(t)}
                className={`px-3 py-1.5 rounded-lg transition-colors ${
                  timeframe === t
                    ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {t.toUpperCase()}
              </button>
            ))}
          </div>

          <button
            onClick={handleExportCSV}
            className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center space-x-2 shadow-sm"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Metric Quick Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Gross Monthly Revenue</span>
            <DollarSign className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            ${totalRevenueThisMonth.toLocaleString()}
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            ↑ +18.4% vs previous month
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Average Ticket Size</span>
            <TrendingUp className="w-4 h-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            $1,628.50
          </p>
          <span className="text-[11px] font-semibold text-slate-400">
            Stable institutional liquidity
          </span>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span className="font-semibold">Monthly Active Users</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            2,780
          </p>
          <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
            88.5% user engagement rate
          </span>
        </div>
      </div>

      {/* Chart Row 1: Revenue Streams Breakdown & Transaction Volume */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Streams Area Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Revenue Breakdown by Stream
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Interchange, wire fees, and wealth management fees (USD)
            </p>
          </div>

          <div className="h-72 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={REVENUE_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.15} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
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
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, '']}
                />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="wealthMgmt" name="Wealth Management" stackId="1" stroke="#4f46e5" fill="#4f46e5" />
                <Area type="monotone" dataKey="interchangeFees" name="Interchange Fees" stackId="1" stroke="#2563eb" fill="#2563eb" />
                <Area type="monotone" dataKey="wireFees" name="Wire Fees" stackId="1" stroke="#0284c7" fill="#0284c7" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Transactions Category Breakdown Pie Chart */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Transaction Volume by Category
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Distribution across wire, card, and wealth management transfers
            </p>
          </div>

          <div className="h-72 w-full pt-2 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={CATEGORY_BREAKDOWN}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={95}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {CATEGORY_BREAKDOWN.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    borderColor: '#1e293b',
                    borderRadius: '12px',
                    color: '#fff',
                    fontSize: '12px'
                  }}
                  formatter={(value) => [`${value}% of total volume`, 'Share']}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart Row 2: User Onboarding & Active Engagement */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Total Accounts vs Active Users Trend
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Historical view of onboarding velocity and active retention
            </p>
          </div>
        </div>

        <div className="h-72 w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={USER_GROWTH_DATA}>
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
              <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
              <Line type="monotone" dataKey="totalUsers" name="Total Customer Accounts" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="activeUsers" name="Active Monthly Accounts" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
