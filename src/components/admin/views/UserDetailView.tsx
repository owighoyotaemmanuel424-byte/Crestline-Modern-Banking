import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { UserStatus, AccountState, KycStatus } from '../../../types/admin';
import { StatusBadge } from '../StatusBadge';
import {
  ArrowLeft,
  RotateCcw,
  ShieldCheck,
  ShieldAlert,
  Lock,
  KeyRound,
  DollarSign,
  PlusCircle,
  MinusCircle,
  CheckCircle2,
  Clock,
  Laptop,
  AlertTriangle,
  FileText,
  Save,
  Send,
  Sparkles,
  ExternalLink,
  Ban,
  Tag
} from 'lucide-react';

interface UserDetailViewProps {
  userId: string;
  onBack: () => void;
}

export const UserDetailView: React.FC<UserDetailViewProps> = ({ userId, onBack }) => {
  const {
    users,
    transactions,
    updateUser,
    rotateAccountNumber,
    adjustUserBalance,
    resetUserPin,
    toggleForcePinCheck,
    updateRestrictedMessages,
    setUserRestrictions,
    injectManualTransaction
  } = useAdminStore();

  const user = users.find((u) => u.id === userId);

  // Panel B: Balance Adjustment state
  const [adjAmount, setAdjAmount] = useState<string>('');
  const [adjNote, setAdjNote] = useState<string>('');

  // Transaction Block Controls
  const [transferBlocked, setTransferBlocked] = useState<boolean>(!!user?.transferBlocked);
  const [withdrawalBlocked, setWithdrawalBlocked] = useState<boolean>(!!user?.withdrawalBlocked);
  const [blockMessage, setBlockMessage] = useState<string>(
    user?.blockMessage || 'Transactional activity has been restricted by Crestline Compliance. Contact customer support.'
  );

  // Panel C: Restricted messages state
  const [msgInactive, setMsgInactive] = useState<string>(
    user?.customRestrictedMessages?.inactive || 'Your account is currently inactive. Please verify billing details.'
  );
  const [msgOnHold, setMsgOnHold] = useState<string>(
    user?.customRestrictedMessages?.onHold || 'Account on hold pending compliance documentation.'
  );
  const [msgSuspended, setMsgSuspended] = useState<string>(
    user?.customRestrictedMessages?.suspended || 'Account suspended due to security protocol triggers.'
  );
  const [msgBlocked, setMsgBlocked] = useState<string>(
    user?.customRestrictedMessages?.blocked || 'Hard-blocked access. Contact compliance officer.'
  );

  // Panel D: Injection state
  const [injDirection, setInjDirection] = useState<'credit' | 'debit'>('credit');
  const [injAmount, setInjAmount] = useState<string>('');
  const [injLabel, setInjLabel] = useState<string>('');
  const [injDate, setInjDate] = useState<string>('');
  const [injAffectBalance, setInjAffectBalance] = useState<boolean>(true);

  if (!user) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-slate-500">User not found or deleted.</p>
        <button
          onClick={onBack}
          className="px-4 py-2 rounded-xl bg-blue-600 text-white text-xs font-bold"
        >
          Back to Customer List
        </button>
      </div>
    );
  }

  // Filter user transactions
  const userTransactions = transactions.filter((t) => t.userId === user.id);

  // Handlers
  const handleBalanceCredit = () => {
    const num = parseFloat(adjAmount);
    if (isNaN(num) || num <= 0) return;
    adjustUserBalance(user.id, num, true, adjNote);
    setAdjAmount('');
    setAdjNote('');
  };

  const handleBalanceDebit = () => {
    const num = parseFloat(adjAmount);
    if (isNaN(num) || num <= 0) return;
    adjustUserBalance(user.id, num, false, adjNote);
    setAdjAmount('');
    setAdjNote('');
  };

  const handleSaveMessages = () => {
    updateRestrictedMessages(user.id, {
      inactive: msgInactive,
      onHold: msgOnHold,
      suspended: msgSuspended,
      blocked: msgBlocked
    });
  };

  const handleInjectTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(injAmount);
    if (isNaN(num) || num <= 0) return;

    injectManualTransaction(user.id, {
      direction: injDirection,
      amount: num,
      label: injLabel || (injDirection === 'credit' ? 'Salary Deposit' : 'Groceries & Supplies'),
      date: injDate || undefined,
      affectBalance: injAffectBalance
    });

    setInjAmount('');
    setInjLabel('');
    setInjDate('');
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Top Header & Breadcrumbs */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex items-center space-x-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Users</span>
          </button>
          <div className="h-4 w-[1px] bg-slate-300 dark:bg-slate-700" />
          <p className="text-xs font-bold text-slate-400">
            Customer Directory / <span className="text-slate-900 dark:text-white font-mono">{user.id}</span>
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-blue-50 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            {user.tier} Tier Customer
          </span>
        </div>
      </div>

      {/* User Hero Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-4">
          <img
            src={user.avatar}
            alt={user.name}
            className="w-16 h-16 rounded-2xl object-cover ring-2 ring-blue-500/30 shadow-md"
          />
          <div className="space-y-1">
            <div className="flex items-center space-x-2 flex-wrap gap-y-1">
              <h1 className="text-xl font-extrabold text-slate-900 dark:text-white">
                {user.name}
              </h1>
              <StatusBadge status={user.status} />
              {user.kycStatus === 'verified' ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  <ShieldCheck className="w-3 h-3 mr-1 text-emerald-600" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  <ShieldAlert className="w-3 h-3 mr-1 text-amber-600" /> {user.kycStatus || 'unverified'}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 font-medium">
              {user.email} • {user.phone} • Joined {user.joinedDate}
            </p>
          </div>
        </div>

        {/* Highlight Balance Box */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white border border-slate-800 shadow-sm min-w-[220px]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
            Formatted Liquid Balance (USD)
          </span>
          <p className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
            ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
          </p>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            4-Decimal Exact Banking Precision
          </span>
        </div>
      </div>

      {/* Grid of Management Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* PANEL A: Account Overview & Status Selectors */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Panel A: Account Overview & Status Selectors
            </h3>
            <span className="text-[10px] font-mono text-slate-400">ID: {user.id}</span>
          </div>

          {/* Info Rows */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Account Number</span>
              <div className="flex items-center justify-between">
                <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                  {user.accountNumber}
                </span>
                <button
                  onClick={() => rotateAccountNumber(user.id)}
                  className="p-1 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 hover:bg-blue-200 transition-colors"
                  title="Rotate to new Account #"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Last Login Timestamp</span>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200">
                {user.lastLogin || '2026-08-05 09:12:44 UTC'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">2FA Security Status</span>
              <p className="font-bold">
                {user.twoFactorEnabled ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Enabled (Authenticator App)
                  </span>
                ) : (
                  <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Disabled
                  </span>
                )}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold">Email Verification</span>
              <p className="font-bold">
                {user.emailVerified ? (
                  <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Email
                  </span>
                ) : (
                  <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending Verification
                  </span>
                )}
              </p>
            </div>
          </div>

          {/* Status Selectors (Dropdowns) */}
          <div className="space-y-3 pt-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
              Status Controls
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Primary Status
                </label>
                <select
                  value={user.status}
                  onChange={(e) => updateUser(user.id, { status: e.target.value as UserStatus })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Account State */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Account State
                </label>
                <select
                  value={user.accountState || 'Active'}
                  onChange={(e) => updateUser(user.id, { accountState: e.target.value as AccountState })}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="On-hold">On-hold</option>
                  <option value="Suspended">Suspended</option>
                </select>
              </div>

              {/* KYC Status */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  KYC Status
                </label>
                <select
                  value={user.kycStatus || 'unverified'}
                  onChange={(e) => {
                    const newKyc = e.target.value as KycStatus;
                    updateUser(user.id, { kycStatus: newKyc, kycVerified: newKyc === 'verified' });
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="unverified">Unverified</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* PANEL B: Balance Adjustment Engine */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Panel B: Balance Adjustment Engine
            </h3>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Live Ledger Sync</span>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex justify-between items-center">
            <div>
              <span className="text-[10px] font-bold uppercase text-emerald-800 dark:text-emerald-300">
                Current USD Liquid Balance
              </span>
              <p className="text-2xl font-mono font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}
              </p>
            </div>
            <Sparkles className="w-6 h-6 text-emerald-500 opacity-60" />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Adjustment Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.0001"
                  placeholder="e.g. 5000.0000"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Audit Note (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Fee adjustment / Credit grant"
                  value={adjNote}
                  onChange={(e) => setAdjNote(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleBalanceCredit}
                className="flex-1 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 flex items-center justify-center space-x-1.5"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add Balance (Credit)</span>
              </button>

              <button
                onClick={handleBalanceDebit}
                className="flex-1 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-md shadow-rose-600/20 flex items-center justify-center space-x-1.5"
              >
                <MinusCircle className="w-4 h-4" />
                <span>Remove Balance (Debit)</span>
              </button>
            </div>
          </div>
        </div>

        {/* PANEL C: Access & Security Settings */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-600" />
              Panel C: Access & Transactional Restrictions
            </h3>
            <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400">Compliance Protocol</span>
          </div>

          <div className="space-y-4">
            {/* Direct Transfer & Withdrawal Blocking Controls */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Ban className="w-4 h-4 text-rose-500" />
                Outgoing Movement Restrictions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Block Transfers */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  transferBlocked
                    ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800'
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Block Transfers
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Disallow internal & external send money
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={transferBlocked}
                    onChange={(e) => setTransferBlocked(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded"
                  />
                </label>

                {/* Block Withdrawals */}
                <label className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                  withdrawalBlocked
                    ? 'border-rose-300 bg-rose-50 dark:bg-rose-950/40 dark:border-rose-800'
                    : 'border-slate-200 dark:border-slate-700'
                }`}>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      Block Withdrawals
                    </span>
                    <span className="text-[10px] text-slate-500">
                      Prevent outbound wire disbursements
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={withdrawalBlocked}
                    onChange={(e) => setWithdrawalBlocked(e.target.checked)}
                    className="w-4 h-4 accent-rose-600 rounded"
                  />
                </label>
              </div>

              {/* Custom Block Message */}
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Custom Block Message (Shown directly to customer when attempting actions)
                </label>
                <textarea
                  rows={2}
                  value={blockMessage}
                  onChange={(e) => setBlockMessage(e.target.value)}
                  placeholder="e.g. Transfers and withdrawals temporarily paused pending identity re-verification. Contact Crestline Support at 1-800-CRESTLINE."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-rose-500"
                />
              </div>

              <button
                type="button"
                onClick={() => setUserRestrictions(user.id, transferBlocked, withdrawalBlocked, blockMessage)}
                className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Transfer & Withdrawal Restrictions</span>
              </button>
            </div>

            {/* PIN Controls */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <KeyRound className="w-4 h-4 text-indigo-500" /> Transaction PIN Governance
                </span>
                <p className="text-[11px] text-slate-500">
                  {user.transactionPinSet ? "PIN is configured for wire approvals." : "No PIN set or PIN cleared."}
                </p>
              </div>

              <button
                onClick={() => resetUserPin(user.id)}
                className="px-3.5 py-2 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 transition-colors text-xs font-bold self-start sm:self-auto"
              >
                Reset / Clear PIN
              </button>
            </div>

            {/* Force PIN Checkbox */}
            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={!!user.forcePinNextLogin}
                onChange={() => toggleForcePinCheck(user.id)}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Force PIN check on next login / transaction
              </span>
            </label>

            {/* Custom Restricted State Messages */}
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Custom Restricted State Messages
              </h4>

              <div className="space-y-2 text-xs">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Inactive Notice
                  </label>
                  <input
                    type="text"
                    value={msgInactive}
                    onChange={(e) => setMsgInactive(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    On Hold Notice
                  </label>
                  <input
                    type="text"
                    value={msgOnHold}
                    onChange={(e) => setMsgOnHold(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Suspended Notice
                  </label>
                  <input
                    type="text"
                    value={msgSuspended}
                    onChange={(e) => setMsgSuspended(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Blocked Notice (hard-blocked at login)
                  </label>
                  <input
                    type="text"
                    value={msgBlocked}
                    onChange={(e) => setMsgBlocked(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveMessages}
                className="w-full py-2.5 rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-black text-white text-xs font-bold transition-colors flex items-center justify-center space-x-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Save Restricted Messages</span>
              </button>
            </div>
          </div>
        </div>

        {/* PANEL D: Manual Transaction Injection (ADD A TRANSACTION) */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-100 dark:border-slate-800 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Send className="w-4 h-4 text-sky-600" />
              Panel D: Manual Transaction Injection (Add Transaction)
            </h3>
          </div>

          <form onSubmit={handleInjectTransaction} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Direction
                </label>
                <select
                  value={injDirection}
                  onChange={(e) => setInjDirection(e.target.value as 'credit' | 'debit')}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                >
                  <option value="credit">Credit (Inbound)</option>
                  <option value="debit">Debit (Outbound)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Amount ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 1250.00"
                  value={injAmount}
                  onChange={(e) => setInjAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Label / Description
              </label>
              <input
                type="text"
                placeholder='e.g. "Salary deposit", "Groceries", "Electricity Bill"'
                value={injLabel}
                onChange={(e) => setInjLabel(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Date & Time (Optional Backdate)
              </label>
              <input
                type="text"
                placeholder="YYYY-MM-DD HH:MM (Leave empty for current time)"
                value={injDate}
                onChange={(e) => setInjDate(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono text-slate-900 dark:text-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
              <input
                type="checkbox"
                checked={injAffectBalance}
                onChange={(e) => setInjAffectBalance(e.target.checked)}
                className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500"
              />
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                  Affect Balance
                </span>
                <span className="text-[10px] text-slate-400">
                  Uncheck to add as a DISPLAY ONLY history record without changing actual balance.
                </span>
              </div>
            </label>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-sky-600 to-blue-700 hover:from-sky-700 hover:to-blue-800 text-white text-xs font-bold transition-all shadow-md shadow-sky-600/20"
            >
              Add Transaction
            </button>
          </form>
        </div>
      </div>

      {/* PANEL E: Ledger & Audit History Tables */}
      <div className="space-y-6 pt-4">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white">
                Panel E: User Transaction Ledger
              </h3>
              <p className="text-xs text-slate-500">
                Complete record of credit, debit, and display-only entries
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-slate-400">
              {userTransactions.length} Entries
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-6">When</th>
                  <th className="py-3 px-6">Activity</th>
                  <th className="py-3 px-6">Merchant / Sender</th>
                  <th className="py-3 px-6">Type</th>
                  <th className="py-3 px-6">Amount</th>
                  <th className="py-3 px-6">Tags</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {userTransactions.length > 0 ? (
                  userTransactions.map((t) => (
                    <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-500">
                        {t.timestamp}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                        {t.category || t.note || t.type}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-300">
                        {t.merchantOrSender}
                      </td>
                      <td className="py-3.5 px-6 font-semibold">
                        {t.type === 'Credit' ? (
                          <span className="text-emerald-600 dark:text-emerald-400">Credit</span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">Debit</span>
                        )}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        ${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-6">
                        {t.isDisplayOnly ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
                            <Tag className="w-2.5 h-2.5 mr-1" /> DISPLAY ONLY
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            Balance Impacted
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      No transaction entries found for this user.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Login Activity Log Table */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-2">
              <Laptop className="w-4 h-4 text-indigo-500" /> Login Activity Log
            </h3>
            <p className="text-xs text-slate-500">
              Audit trail of session logins, IP addresses, and user agents
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-bold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-6">When</th>
                  <th className="py-3 px-6">IP Address</th>
                  <th className="py-3 px-6">User Agent String</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {user.loginHistory && user.loginHistory.length > 0 ? (
                  user.loginHistory.map((lh) => (
                    <tr key={lh.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-6 font-mono text-slate-500">
                        {lh.when}
                      </td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-800 dark:text-slate-200">
                        {lh.ip}
                      </td>
                      <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500 truncate max-w-md">
                        {lh.userAgent}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="py-3.5 px-6 font-mono text-slate-500">
                      {user.lastLogin || '2026-08-05 09:12:44'}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold text-slate-800 dark:text-slate-200">
                      192.168.1.104
                    </td>
                    <td className="py-3.5 px-6 font-mono text-[11px] text-slate-500">
                      Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
