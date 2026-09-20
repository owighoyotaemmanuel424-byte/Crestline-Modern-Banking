import React, { useState, useEffect } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { 
  ArrowUpRight, 
  ShieldCheck, 
  AlertCircle, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Building2, 
  HelpCircle,
  ExternalLink,
  ShieldAlert,
  Lock,
  Mail,
  KeyRound
} from 'lucide-react';

export const CustomerWithdrawView: React.FC = () => {
  const { 
    user, 
    accounts, 
    token, 
    fetchAccounts, 
    fetchTransactions, 
    showToast, 
    setPortalMode,
    requestOtp 
  } = useBankStore();

  const [selectedAccId, setSelectedAccId] = useState(accounts[0]?.id || '');
  const [method, setMethod] = useState<'DOMESTIC_WIRE' | 'INTERNATIONAL_SWIFT' | 'CRYPTO_SETTLEMENT'>('DOMESTIC_WIRE');
  const [amountStr, setAmountStr] = useState('500.00');

  // Form details
  const [beneficiaryBank, setBeneficiaryBank] = useState('JPMorgan Chase Bank, N.A.');
  const [routingOrSwift, setRoutingOrSwift] = useState('021000021');
  const [destAccount, setDestAccount] = useState('9812739102');
  const [destName, setDestName] = useState('First American Escrow Services');

  const [submitting, setSubmitting] = useState(false);
  const [myWithdrawals, setMyWithdrawals] = useState<any[]>([]);
  const [loadingList, setLoadingList] = useState(false);

  // OTP State
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);
  const [otpRequesting, setOtpRequesting] = useState(false);

  const selectedAccount = accounts.find((a) => a.id === selectedAccId) || accounts[0];
  const amountCents = Math.round(parseFloat(amountStr || '0') * 100);

  const isWithdrawalBlocked = Boolean(user?.withdrawalBlocked);

  const fetchMyWithdrawals = async () => {
    if (!token) return;
    setLoadingList(true);
    try {
      const res = await fetch('/api/withdrawals', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setMyWithdrawals(data.withdrawals || []);
      }
    } catch (_) {}
    setLoadingList(false);
  };

  useEffect(() => {
    fetchMyWithdrawals();
  }, [token]);

  const handleInitiateWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isWithdrawalBlocked) {
      showToast(user?.blockMessage || 'Withdrawals are restricted on this account.', 'error');
      return;
    }
    if (amountCents <= 0 || !selectedAccount) {
      showToast('Please enter a valid withdrawal amount', 'error');
      return;
    }
    if (selectedAccount.available_balance < amountCents) {
      showToast('Insufficient available funds for this withdrawal', 'error');
      return;
    }

    setOtpRequesting(true);
    const result = await requestOtp('WITHDRAWAL', {
      amount: amountCents,
      method,
      account: destAccount
    });
    setOtpRequesting(false);

    if (result.success) {
      setOtpSentNotice(`Authorization code sent to your registered email (${result.maskedEmail || 'verified address'}).`);
      setIsOtpModalOpen(true);
      setOtpCode('');
    } else {
      showToast(result.error || 'Failed to generate security code.', 'error');
    }
  };

  const handleExecuteWithOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim() || otpCode.trim().length !== 6) {
      showToast('Please enter the 6-digit authorization code', 'error');
      return;
    }

    setSubmitting(true);
    try {
      const destinationDetails = `${destName} • ${beneficiaryBank} (Routing: ${routingOrSwift}, Acct: ${destAccount})`;

      const res = await fetch('/api/withdrawals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          accountId: selectedAccount.id,
          amountCents,
          destinationMethod: method,
          destinationDetails,
          securityCode: otpCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Withdrawal request failed', 'error');
      } else {
        showToast('Withdrawal authorized and submitted for compliance review.', 'success');
        setIsOtpModalOpen(false);
        fetchAccounts();
        fetchTransactions();
        fetchMyWithdrawals();
      }
    } catch (_) {
      showToast('Network error submitting withdrawal', 'error');
    }
    setSubmitting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Outgoing Fedwire & Capital Withdrawals
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Initiate external disbursements via Fedwire, international SWIFT, or institutional settlement with email authorization.
        </p>
      </div>

      {/* Operations Block Alert Notice */}
      {isWithdrawalBlocked && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 flex items-start gap-4 shadow-sm animate-in fade-in">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-rose-800 dark:text-rose-300">
              Withdrawals Restricted by Operations Desk
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
              {user?.blockMessage || 'Outgoing withdrawals are temporarily restricted on this account. Please contact Crestline Capital compliance desk.'}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Withdrawal Form */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <form onSubmit={handleInitiateWithdrawal} className="space-y-4">
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Source Crestline Account
              </label>
              <select
                value={selectedAccId}
                onChange={(e) => setSelectedAccId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.account_name} ({acc.account_number}) — ${(acc.available_balance / 100).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Wire Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Disbursement Rail
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'DOMESTIC_WIRE', label: 'Domestic Fedwire' },
                  { id: 'INTERNATIONAL_SWIFT', label: 'SWIFT Wire' },
                  { id: 'CRYPTO_SETTLEMENT', label: 'Digital Asset OTC' }
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setMethod(m.id as any)}
                    className={`p-2.5 rounded-xl border text-center text-xs font-bold transition ${
                      method === m.id
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Withdrawal Amount ($ USD)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold font-mono">
                  $
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-base font-mono font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Destination Coordinates */}
            <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Beneficiary Receiving Bank Information
              </h4>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Beneficiary Name
                </label>
                <input
                  type="text"
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Beneficiary Bank
                  </label>
                  <input
                    type="text"
                    value={beneficiaryBank}
                    onChange={(e) => setBeneficiaryBank(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Routing / SWIFT Code
                  </label>
                  <input
                    type="text"
                    value={routingOrSwift}
                    onChange={(e) => setRoutingOrSwift(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Destination Account / IBAN
                </label>
                <input
                  type="text"
                  value={destAccount}
                  onChange={(e) => setDestAccount(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isWithdrawalBlocked || otpRequesting}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {isWithdrawalBlocked
                    ? 'Withdrawals Restricted'
                    : otpRequesting
                    ? 'Sending Code...'
                    : 'Request Authorization Code'}
                </span>
              </button>
            </div>
          </form>
        </div>

        {/* Withdrawal Tracking & History Column */}
        <div className="lg:col-span-5 space-y-5">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Withdrawal Request History</span>
            </h3>

            {loadingList ? (
              <p className="text-xs text-slate-400">Loading requests...</p>
            ) : myWithdrawals.length === 0 ? (
              <p className="text-xs text-slate-500">No withdrawal requests on file.</p>
            ) : (
              <div className="space-y-3">
                {myWithdrawals.slice(0, 5).map((w) => (
                  <div
                    key={w.id}
                    className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-xs space-y-1"
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-mono font-bold text-slate-900 dark:text-white">
                        ${(w.amount_cents / 100).toFixed(2)}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          w.status === 'APPROVED'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            : w.status === 'REJECTED'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                        }`}
                      >
                        {w.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">{w.destination_details}</p>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      Ref: {w.reference_code || w.id.slice(0, 8)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* OTP Code Entry Modal */}
      {isOtpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Enter Email Authorization Code
              </h3>
              <p className="text-xs text-slate-500">
                {otpSentNotice || `A 6-digit code has been sent to your registered email (${user?.email || 's***@crestline.bank'}).`}
              </p>
            </div>

            <form onSubmit={handleExecuteWithOtp} className="space-y-4">
              <div>
                <label className="block text-center text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  6-Digit Security Code
                </label>
                <input
                  type="text"
                  maxLength={6}
                  autoFocus
                  placeholder="••••••"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full py-3 text-center text-2xl font-mono font-extrabold tracking-widest rounded-2xl border-2 border-blue-500 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-blue-500/20"
                />
              </div>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleInitiateWithdrawal}
                  disabled={otpRequesting}
                  className="text-[11px] text-blue-600 hover:underline font-semibold"
                >
                  Resend authorization code
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsOtpModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || otpCode.length !== 6}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Authorizing...' : 'Authorize Withdrawal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
