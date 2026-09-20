import React, { useState, useEffect } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { 
  ArrowUpRight, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  ShieldCheck, 
  AlertCircle, 
  Search, 
  Filter, 
  RotateCw,
  Building2,
  ExternalLink
} from 'lucide-react';

export const WithdrawalsApprovalView: React.FC = () => {
  const { token, showToast } = useBankStore();
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Approval / Rejection modal state
  const [actionItem, setActionItem] = useState<{ item: any; action: 'approve' | 'reject' } | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchWithdrawals = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/withdrawals', {
        headers: {
          Authorization: token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        setWithdrawals(data.withdrawals || []);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => {
    fetchWithdrawals();
  }, [token]);

  const handleConfirmAction = async () => {
    if (!actionItem) return;
    setProcessing(true);
    try {
      const endpoint = `/api/admin/withdrawals/${actionItem.item.id}/${actionItem.action}`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ adminNote })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        showToast(data.error || `Failed to ${actionItem.action} withdrawal`, 'error');
      } else {
        showToast(
          `Withdrawal ${actionItem.item.reference || actionItem.item.id} ${actionItem.action}d successfully.`,
          'success'
        );
        setActionItem(null);
        setAdminNote('');
        fetchWithdrawals();
      }
    } catch (_) {
      showToast('Action failed to complete', 'error');
    }
    setProcessing(false);
  };

  const filtered = withdrawals.filter((w) => {
    if (statusFilter !== 'ALL' && w.status !== statusFilter) return false;
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase();
      const matchRef = w.reference?.toLowerCase().includes(query);
      const matchDetails = w.destination_details?.toLowerCase().includes(query);
      const matchName = `${w.first_name} ${w.last_name}`.toLowerCase().includes(query);
      const matchEmail = w.email?.toLowerCase().includes(query);
      if (!matchRef && !matchDetails && !matchName && !matchEmail) return false;
    }
    return true;
  });

  const pendingCount = withdrawals.filter((w) => w.status === 'PENDING').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">
              Institutional Withdrawal Approvals
            </h1>
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse">
                {pendingCount} Pending Review
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Review, authorize, or reject outgoing wires and customer withdrawal requests. Backed by atomic SQLite ledger.
          </p>
        </div>

        <button
          onClick={fetchWithdrawals}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition w-fit"
        >
          <RotateCw className="w-3.5 h-3.5" />
          Refresh Queue
        </button>
      </div>

      {/* Filter and Search */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by reference, user name, email, or destination..."
            className="w-full pl-9 pr-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                statusFilter === s
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-xs text-slate-400">Loading withdrawal queue...</div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400">
            No withdrawal requests matching filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Account Holder</th>
                  <th className="py-3 px-4">Destination Coordinates</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4 text-right">Amount (USD)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Compliance Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filtered.map((w) => {
                  const amt = ((w.amount || 0) / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  });

                  return (
                    <tr key={w.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        {new Date(w.created_at).toLocaleDateString()}
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(w.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white">
                          {w.first_name ? `${w.first_name} ${w.last_name}` : w.user_id}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {w.account_number} • {w.email}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 max-w-xs">
                        <p className="text-slate-800 dark:text-slate-200 truncate">{w.destination_details}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-semibold">{w.destination_method}</p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {w.reference}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-slate-900 dark:text-white whitespace-nowrap">
                        {amt}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            w.status === 'APPROVED' || w.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : w.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {w.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        {w.status === 'PENDING' ? (
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setActionItem({ item: w, action: 'approve' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setActionItem({ item: w, action: 'reject' })}
                              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-red-600 hover:bg-red-500 text-white transition shadow-xs"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">
                            Settled ({w.status})
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Action Modal */}
      {actionItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white ${
                  actionItem.action === 'approve' ? 'bg-emerald-600' : 'bg-red-600'
                }`}
              >
                {actionItem.action === 'approve' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
              </div>
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm capitalize">
                  {actionItem.action} Withdrawal Request
                </h3>
                <p className="text-xs text-slate-500">
                  Ref: <span className="font-mono">{actionItem.item.reference}</span>
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              {actionItem.action === 'approve'
                ? `Confirm authorization of $${(actionItem.item.amount / 100).toFixed(2)} USD payout. This will permanently debit the account ledger balance.`
                : `Confirm rejection of $${(actionItem.item.amount / 100).toFixed(2)} USD payout. Held funds will be immediately released back to the user.`}
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Administrative / Compliance Note (Optional)
              </label>
              <input
                type="text"
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                placeholder="e.g. Approved per OFAC screening clearance"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setActionItem(null)}
                disabled={processing}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={processing}
                className={`px-5 py-2 rounded-xl text-xs font-bold text-white transition shadow-sm ${
                  actionItem.action === 'approve'
                    ? 'bg-emerald-600 hover:bg-emerald-500'
                    : 'bg-red-600 hover:bg-red-500'
                }`}
              >
                {processing ? 'Processing...' : `Confirm ${actionItem.action}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
