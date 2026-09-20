import React, { useState } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { 
  Building2, 
  Copy, 
  Check, 
  ShieldCheck, 
  FileText, 
  ArrowDownLeft, 
  Printer, 
  ExternalLink,
  Lock,
  Globe
} from 'lucide-react';

export const CustomerDepositView: React.FC = () => {
  const { user, accounts, showToast } = useBankStore();

  const [selectedAccId, setSelectedAccId] = useState(accounts[0]?.id || '');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const selectedAccount = accounts.find((a) => a.id === selectedAccId) || accounts[0];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${text} to clipboard`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handlePrintInstructions = () => {
    window.print();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Direct Deposit & Inbound Wire Instructions
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Provide these verified banking coordinates to your employer, brokerage, or payer to receive electronic ACH and Fedwire deposits.
          </p>
        </div>

        <button
          onClick={handlePrintInstructions}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-slate-700 dark:text-slate-300 text-xs font-bold transition shadow-sm self-start sm:self-auto"
        >
          <Printer className="w-4 h-4 text-slate-500" />
          <span>Print Wire Sheet</span>
        </button>
      </div>

      {/* Account Selector */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
        <div>
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
            Select Deposit Account
          </label>
          <p className="text-[11px] text-slate-500">Choose which Crestline Capital account to generate instructions for</p>
        </div>
        <select
          value={selectedAccId}
          onChange={(e) => setSelectedAccId(e.target.value)}
          className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        >
          {accounts.map((acc) => (
            <option key={acc.id} value={acc.id}>
              {acc.account_name} ({acc.account_number}) — ${(acc.available_balance / 100).toFixed(2)}
            </option>
          ))}
        </select>
      </div>

      {/* Verified Banking Coordinates Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Wire & Direct Deposit Routing Coordinates
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" />
            FDIC Member #38194
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          {/* Bank Name */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Name</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm">Crestline Capital, N.A.</span>
            </div>
            <button
              onClick={() => copyToClipboard('Crestline Capital, N.A.', 'bank')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
            >
              {copiedKey === 'bank' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Routing Number (ABA / ACH) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Routing Number (ABA / ACH / Wire)</span>
              <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-sm">021000089</span>
            </div>
            <button
              onClick={() => copyToClipboard('021000089', 'routing')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
            >
              {copiedKey === 'routing' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Account Number */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Account Number</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">
                {selectedAccount ? selectedAccount.account_number : 'CHK-48192041'}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(selectedAccount ? selectedAccount.account_number : 'CHK-48192041', 'acct')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
            >
              {copiedKey === 'acct' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Beneficiary Name */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Beneficiary Name</span>
              <span className="font-bold text-slate-900 dark:text-white text-sm uppercase">
                {user ? `${user.firstName} ${user.lastName}` : 'SARAH JENKINS'}
              </span>
            </div>
            <button
              onClick={() => copyToClipboard(user ? `${user.firstName} ${user.lastName}` : 'SARAH JENKINS', 'beneficiary')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
            >
              {copiedKey === 'beneficiary' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* SWIFT / BIC (International) */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">SWIFT / BIC (International Inbound)</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white text-sm">CRESUS33NYC</span>
            </div>
            <button
              onClick={() => copyToClipboard('CRESUS33NYC', 'swift')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
            >
              {copiedKey === 'swift' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          {/* Bank Address */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-slate-400 block">Bank Headquarters Address</span>
              <span className="font-semibold text-slate-700 dark:text-slate-300 text-xs">
                550 Madison Avenue, New York, NY 10022
              </span>
            </div>
            <button
              onClick={() => copyToClipboard('550 Madison Avenue, New York, NY 10022', 'addr')}
              className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition"
            >
              {copiedKey === 'addr' ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Informational Guidance Notice */}
        <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-900 dark:text-blue-200 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Lock className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Direct Deposit Verification & Automated Clearing</span>
          </div>
          <p className="text-[11px] leading-relaxed text-blue-800 dark:text-blue-300">
            For security and regulatory compliance, Crestline Capital accepts incoming funds exclusively through verified ACH, incoming domestic Fedwire, international SWIFT wires, or authorized institutional settlement. Self-funded deposits cannot be manually keyed in. Once initiated by your payroll provider or sender, incoming wires credit automatically within minutes.
          </p>
        </div>
      </div>
    </div>
  );
};
