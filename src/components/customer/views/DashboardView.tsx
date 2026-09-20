import React, { useState } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { 
  Building2, 
  ArrowRightLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  Copy, 
  Check, 
  ShieldCheck, 
  PlusCircle, 
  FileText, 
  ChevronRight, 
  CreditCard,
  TrendingUp,
  Wallet,
  ExternalLink
} from 'lucide-react';

export const CustomerDashboardView: React.FC = () => {
  const { 
    user, 
    accounts, 
    transactions, 
    setActiveView, 
    viewReceipt, 
    showToast,
    setAuthModalOpen
  } = useBankStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast(`Copied ${text} to clipboard`, 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalBalanceCents = accounts.reduce((sum, a) => sum + (a.available_balance || 0), 0);
  const formattedTotal = (totalBalanceCents / 100).toLocaleString('en-US', {
    style: 'currency',
    currency: 'USD'
  });

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Top Banner: Total Portfolio & Fast Actions */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                Total Available Liquidity
              </span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-200 border border-blue-400/30">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                FDIC Insured
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight font-mono">
              {formattedTotal}
            </h1>
            <p className="text-xs text-slate-300 mt-2 flex items-center gap-3">
              <span>Account Holder: <strong className="text-white">{user?.firstName} {user?.lastName}</strong></span>
              <span className="text-slate-500">•</span>
              <span>Routing: <strong className="font-mono text-white">021000089</strong></span>
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => setActiveView('transfer')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Send Money</span>
            </button>

            <button
              onClick={() => setActiveView('deposit')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur border border-white/10"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>Deposit</span>
            </button>

            <button
              onClick={() => setActiveView('withdraw')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur border border-white/10"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Withdraw</span>
            </button>

            <button
              onClick={() => setActiveView('statements')}
              className="flex items-center gap-2 px-3 py-2.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition backdrop-blur border border-white/10"
              title="Official Statements"
            >
              <FileText className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Decorative background grid subtle overlay */}
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* Accounts Breakdown Grid */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-wider">
            Your Deposit Accounts
          </h2>
          <span className="text-xs text-slate-500">
            {accounts.length} Active {accounts.length === 1 ? 'Account' : 'Accounts'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((acc) => {
            const isCopied = copiedId === acc.id;
            const bal = (acc.available_balance / 100).toLocaleString('en-US', {
              style: 'currency',
              currency: 'USD'
            });

            return (
              <div
                key={acc.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative group"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold">
                      {acc.account_type === 'SAVINGS' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <CreditCard className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                        {acc.account_name}
                      </h3>
                      <div className="flex items-center gap-1 text-slate-400 text-xs font-mono mt-0.5">
                        <span>{acc.account_number}</span>
                        <button
                          onClick={() => copyToClipboard(acc.account_number, acc.id)}
                          className="hover:text-slate-600 dark:hover:text-slate-200 transition p-0.5"
                          title="Copy account number"
                        >
                          {isCopied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    {acc.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <p className="text-[11px] text-slate-500 font-medium">Available Balance</p>
                  <p className="text-xl font-extrabold text-slate-900 dark:text-white font-mono mt-0.5">
                    {bal}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs pt-2">
                  <button
                    onClick={() => setActiveView('transfer')}
                    className="font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
                  >
                    Transfer Funds <ChevronRight className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => setActiveView('statements')}
                    className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  >
                    Statements
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">Recent Transactions</h2>
            <p className="text-xs text-slate-500">Atomic ledger updates for Crestline deposit accounts</p>
          </div>
          <button
            onClick={() => setActiveView('transactions')}
            className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
          >
            View All Activity <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            No transactions found.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const isCredit = tx.type === 'DEPOSIT' || tx.recipient_name === `${user?.firstName} ${user?.lastName}`;
              const formattedAmt = ((tx.amount || 0) / 100).toLocaleString('en-US', {
                style: 'currency',
                currency: 'USD'
              });

              return (
                <div
                  key={tx.id}
                  onClick={() => viewReceipt(tx.id)}
                  className="py-3.5 flex items-center justify-between hover:bg-slate-50/80 dark:hover:bg-slate-800/40 px-2 rounded-xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isCredit
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {isCredit ? '+' : '–'}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {tx.description}
                      </p>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400 font-mono mt-0.5">
                        <span>{tx.reference}</span>
                        <span>•</span>
                        <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <p
                      className={`text-xs font-extrabold font-mono ${
                        isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                      }`}
                    >
                      {isCredit ? `+${formattedAmt}` : `-${formattedAmt}`}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-bold px-1.5 py-0.2 rounded mt-0.5 ${
                        tx.status === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : tx.status === 'PENDING'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                          : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                      }`}
                    >
                      {tx.status}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Security and Trust Banner */}
      <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/40 border border-blue-200/50 dark:border-slate-800 flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
          <span>
            Deposits are FDIC insured up to <strong>$250,000</strong> through our member bank partnerships. All transfers are backed by double-entry ledger audits.
          </span>
        </div>
        <button
          onClick={() => setActiveView('security')}
          className="font-bold text-blue-600 dark:text-blue-400 hover:underline shrink-0 hidden sm:inline"
        >
          Security Overview &rarr;
        </button>
      </div>
    </div>
  );
};
