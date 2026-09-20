import React, { useState } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { 
  ArrowRightLeft, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Printer, 
  RotateCcw,
  Sparkles,
  Lock,
  Mail,
  KeyRound,
  ShieldAlert
} from 'lucide-react';

export const CustomerTransferView: React.FC = () => {
  const { 
    user, 
    accounts, 
    token, 
    fetchAccounts, 
    fetchTransactions, 
    showToast, 
    viewReceipt,
    setSelectedReceipt,
    requestOtp 
  } = useBankStore();

  const [sourceAccountId, setSourceAccountId] = useState(accounts[0]?.id || '');
  const [recipientAccount, setRecipientAccount] = useState('CHK-91823471'); // Pre-filled with David Nguyen for easy testing
  const [amountStr, setAmountStr] = useState('250.00');
  const [description, setDescription] = useState('Consulting Services Settlement');

  // Verification state
  const [verifiedRecipient, setVerifiedRecipient] = useState<{
    name: string;
    accountNumber: string;
    accountType: string;
    isOwnAccount: boolean;
  } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Review & Confirmation step
  const [isReviewing, setIsReviewing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // OTP Verification modal state
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpSentNotice, setOtpSentNotice] = useState<string | null>(null);
  const [otpRequesting, setOtpRequesting] = useState(false);

  // Completed State
  const [completedTransfer, setCompletedTransfer] = useState<any | null>(null);

  const selectedSourceAccount = accounts.find((a) => a.id === sourceAccountId) || accounts[0];
  const amountCents = Math.round(parseFloat(amountStr || '0') * 100);

  const isTransferBlocked = Boolean(user?.transferBlocked);

  const handleLookup = async () => {
    if (!recipientAccount.trim()) return;
    setLookingUp(true);
    setLookupError(null);
    setVerifiedRecipient(null);

    try {
      const res = await fetch('/api/transfers/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ accountNumber: recipientAccount.trim() })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setLookupError(data.error || 'Recipient account not found.');
      } else {
        setVerifiedRecipient(data.recipient);
      }
    } catch (_) {
      setLookupError('Failed to lookup recipient account');
    }
    setLookingUp(false);
  };

  const handleQuickAmount = (amt: number) => {
    setAmountStr(amt.toFixed(2));
  };

  const handleProceedToReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (isTransferBlocked) {
      showToast(user?.blockMessage || 'Transfers are restricted on this account.', 'error');
      return;
    }
    if (amountCents <= 0) {
      showToast('Please enter a valid transfer amount', 'error');
      return;
    }
    if (!selectedSourceAccount || selectedSourceAccount.available_balance < amountCents) {
      showToast('Insufficient funds in selected source account', 'error');
      return;
    }
    if (!verifiedRecipient) {
      showToast('Please verify recipient account before continuing', 'error');
      return;
    }

    setIsReviewing(true);
  };

  const handleInitiateAuthorization = async () => {
    if (isTransferBlocked) {
      showToast(user?.blockMessage || 'Transfers are blocked.', 'error');
      return;
    }

    setOtpRequesting(true);
    const result = await requestOtp('TRANSFER', {
      amount: amountCents,
      recipient: recipientAccount
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
      const idempotencyKey = `idemp_${Date.now()}_${Math.random().toString(36).substring(7)}`;

      const res = await fetch('/api/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'Idempotency-Key': idempotencyKey
        },
        body: JSON.stringify({
          sourceAccountId: selectedSourceAccount.id,
          recipientAccountNumber: recipientAccount.trim(),
          amountCents,
          description,
          securityCode: otpCode.trim()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || 'Transfer failed to complete', 'error');
      } else {
        showToast(`Successfully transferred ${data.formattedAmount}!`, 'success');
        setCompletedTransfer(data);
        setIsReviewing(false);
        setIsOtpModalOpen(false);
        fetchAccounts();
        fetchTransactions();
      }
    } catch (err: any) {
      showToast('Network error during transfer processing', 'error');
    }
    setSubmitting(false);
  };

  const resetForm = () => {
    setCompletedTransfer(null);
    setIsReviewing(false);
    setIsOtpModalOpen(false);
    setAmountStr('100.00');
    setVerifiedRecipient(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Send Money & Wire Transfers
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Instant internal book transfers across Crestline Capital accounts backed by real-time atomic ledger entries and email OTP authorization.
        </p>
      </div>

      {/* Operations Block Alert Notice */}
      {isTransferBlocked && (
        <div className="p-5 rounded-3xl bg-rose-50 dark:bg-rose-950/50 border-2 border-rose-300 dark:border-rose-900 text-rose-900 dark:text-rose-200 flex items-start gap-4 shadow-sm animate-in fade-in">
          <ShieldAlert className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="text-sm font-extrabold text-rose-800 dark:text-rose-300">
              Outgoing Transfers Restricted by Operations Desk
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 leading-relaxed font-medium">
              {user?.blockMessage || 'Outgoing transfers are temporarily restricted on this account. Please contact Crestline Capital compliance desk.'}
            </p>
          </div>
        </div>
      )}

      {completedTransfer ? (
        /* Success Screen */
        <div className="bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-900/60 rounded-3xl p-8 shadow-sm text-center space-y-6 animate-in fade-in">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div>
            <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
              Transfer Settled & Verified
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono mt-1">
              {completedTransfer.formattedAmount}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Funds immediately credited to {completedTransfer.recipientName} ({completedTransfer.recipientAccount})
            </p>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 max-w-md mx-auto text-left text-xs space-y-2 border border-slate-100 dark:border-slate-800 font-mono">
            <div className="flex justify-between">
              <span className="text-slate-500">Transaction Ref:</span>
              <span className="font-bold text-slate-900 dark:text-white">{completedTransfer.transactionReference}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Source Account:</span>
              <span className="font-bold text-slate-900 dark:text-white">{completedTransfer.sourceAccount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Settlement Time:</span>
              <span className="font-bold text-slate-900 dark:text-white">{new Date().toLocaleString()}</span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => {
                if (completedTransfer.debitTransactionId) {
                  viewReceipt(completedTransfer.debitTransactionId);
                }
              }}
              className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition flex items-center gap-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>View Official Receipt</span>
            </button>

            <button
              onClick={resetForm}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Send Another Payment</span>
            </button>
          </div>
        </div>
      ) : isReviewing ? (
        /* Review Screen */
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Review Transfer Details
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Confirm recipient information and authorize transaction via 6-digit email code.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/60 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">Transfer Amount</span>
                <span className="text-2xl font-mono font-extrabold text-blue-900 dark:text-white">
                  ${parseFloat(amountStr).toFixed(2)} USD
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-blue-200/80 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                Fee: $0.00
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Debit Account</span>
                <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                  {selectedSourceAccount.account_name}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {selectedSourceAccount.account_number}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Credit Recipient</span>
                <span className="font-bold text-slate-900 dark:text-white block mt-0.5">
                  {verifiedRecipient?.name}
                </span>
                <span className="font-mono text-slate-500 text-[11px]">
                  {verifiedRecipient?.accountNumber} ({verifiedRecipient?.accountType})
                </span>
              </div>
            </div>

            {description && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 text-xs">
                <strong>Memo / Note:</strong> {description}
              </div>
            )}
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/50 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2.5">
            <Mail className="w-4 h-4 text-amber-600 shrink-0" />
            <span>To authorize this transfer, a 6-digit verification code will be sent to your email.</span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsReviewing(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition"
            >
              Modify Details
            </button>

            <button
              type="button"
              onClick={handleInitiateAuthorization}
              disabled={isTransferBlocked || otpRequesting}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center gap-1.5 disabled:opacity-50"
            >
              <KeyRound className="w-4 h-4" />
              <span>{otpRequesting ? 'Sending Code...' : 'Request Code & Authorize'}</span>
            </button>
          </div>
        </div>
      ) : (
        /* Transfer Initiation Form */
        <form onSubmit={handleProceedToReview} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          {/* Source Account */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Pay From Account
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {accounts.map((acc) => (
                <div
                  key={acc.id}
                  onClick={() => setSourceAccountId(acc.id)}
                  className={`p-4 rounded-2xl border cursor-pointer transition ${
                    sourceAccountId === acc.id
                      ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-2 ring-blue-600/20'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {acc.account_name}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      {acc.account_number}
                    </span>
                  </div>
                  <div className="mt-2 text-sm font-extrabold text-slate-900 dark:text-white font-mono">
                    ${(acc.available_balance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recipient Account Lookup */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Recipient Account Number
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="e.g. CHK-91823471 or SAV-..."
                  value={recipientAccount}
                  onChange={(e) => {
                    setRecipientAccount(e.target.value);
                    setVerifiedRecipient(null);
                  }}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-mono font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="button"
                onClick={handleLookup}
                disabled={lookingUp || !recipientAccount.trim()}
                className="px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 dark:hover:bg-slate-100 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                <Search className="w-3.5 h-3.5" />
                <span>{lookingUp ? 'Verifying...' : 'Verify'}</span>
              </button>
            </div>

            {/* Recipient Feedback */}
            {verifiedRecipient && (
              <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <strong>Verified Recipient:</strong> {verifiedRecipient.name} ({verifiedRecipient.accountType})
                  {verifiedRecipient.isOwnAccount && (
                    <span className="ml-1.5 text-[10px] px-2 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-900 font-bold">
                      Internal Transfer
                    </span>
                  )}
                </div>
              </div>
            )}

            {lookupError && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                <span>{lookupError}</span>
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Transfer Amount ($ USD)
              </label>
              <div className="flex gap-1.5">
                {[50, 250, 500, 1000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleQuickAmount(amt)}
                    className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  >
                    ${amt}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 text-base font-bold font-mono">
                $
              </span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-8 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-lg font-mono font-extrabold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Payment Reference / Memo
            </label>
            <input
              type="text"
              placeholder="e.g. Invoice settlement, consulting fee"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isTransferBlocked}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span>{isTransferBlocked ? 'Transfers Restricted' : 'Proceed to Authorization'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      )}

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
                  onClick={handleInitiateAuthorization}
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
                  {submitting ? 'Verifying & Settling...' : 'Authorize Transfer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
