import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { Transaction, TransactionStatus, TransactionType } from '../../../types/admin';
import { StatusBadge } from '../StatusBadge';
import { TransactionDetailsModal } from '../TransactionDetailsModal';
import { ConfirmAction } from '../ConfirmAction';
import { EmptyState } from '../EmptyState';
import {
  CheckCircle2,
  XCircle,
  Eye,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  Zap,
  Receipt
} from 'lucide-react';

const TransactionRowSkeleton: React.FC = () => (
  <tr className="animate-pulse border-b border-slate-100 dark:border-slate-800 last:border-0">
    <td className="py-4 px-6">
      <div className="h-4 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
    </td>
    <td className="py-4 px-6">
      <div className="flex items-center space-x-2.5">
        <div className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-700/50"></div>
        <div className="space-y-1.5">
          <div className="h-3.5 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
          <div className="h-2.5 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
        </div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="space-y-1.5">
        <div className="h-3.5 w-28 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
        <div className="h-2.5 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
      </div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-full"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-4 w-24 bg-slate-200 dark:bg-slate-700/50 rounded-md"></div>
    </td>
    <td className="py-4 px-6">
      <div className="h-6 w-16 bg-slate-200 dark:bg-slate-700/50 rounded-full"></div>
    </td>
    <td className="py-4 px-6 text-right">
      <div className="flex justify-end space-x-2">
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-xl"></div>
        <div className="h-8 w-20 bg-slate-200 dark:bg-slate-700/50 rounded-xl"></div>
        <div className="h-8 w-8 bg-slate-200 dark:bg-slate-700/50 rounded-lg"></div>
      </div>
    </td>
  </tr>
);

interface TransactionsViewProps {
  mode?: 'all' | 'deposits' | 'transfers';
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({ mode = 'all' }) => {
  const {
    transactions,
    approveTransaction,
    rejectTransaction,
    setToast
  } = useAdminStore();

  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TransactionStatus>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>(
    mode === 'deposits' ? 'Credit' : mode === 'transfers' ? 'Transfer' : 'all'
  );

  const [selectedTxn, setSelectedTxn] = useState<Transaction | null>(null);
  const [txnToApprove, setTxnToApprove] = useState<Transaction | null>(null);
  const [txnToReject, setTxnToReject] = useState<Transaction | null>(null);
  const [showBulkApproveConfirm, setShowBulkApproveConfirm] = useState(false);

  useEffect(() => {
    // Update filter when mode changes
    if (mode === 'deposits') setTypeFilter('Credit');
    else if (mode === 'transfers') setTypeFilter('Transfer');
    else setTypeFilter('all');
  }, [mode]);

  useEffect(() => {
    // Simulate network delay for fetching transactions
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Filter transactions
  const filteredTransactions = transactions.filter((txn) => {
    const matchesSearch =
      txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.merchantOrSender.toLowerCase().includes(searchTerm.toLowerCase()) ||
      txn.referenceCode.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || txn.status === statusFilter;
    const matchesType = typeFilter === 'all' || txn.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const pendingTxns = transactions.filter((t) => t.status === 'Pending');
  const pendingVolume = pendingTxns.reduce((acc, t) => acc + t.amount, 0);

  const handleApproveAllPending = () => {
    if (pendingTxns.length === 0) return;
    pendingTxns.forEach((t) => approveTransaction(t.id));
    setToast(`Approved and settled all ${pendingTxns.length} pending transactions!`, 'success');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Bulk Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            {mode === 'deposits'
              ? 'Deposits & Incoming Wire Queue'
              : mode === 'transfers'
              ? 'Account-to-Account Transfers Ledger'
              : 'Financial Transactions & Risk Approvals'}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {mode === 'deposits'
              ? 'Real-time clearing desk for client deposits, Fedwire credits, and incoming ACH transfers'
              : mode === 'transfers'
              ? 'Audit log and execution controls for intra-institution and inter-bank customer transfers'
              : 'Monitor, approve, or reject incoming wires, card settlements, and debit requests'}
          </p>
        </div>

        {pendingTxns.length > 0 && (
          <button
            onClick={() => setShowBulkApproveConfirm(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
          >
            <Zap className="w-4 h-4 fill-current" />
            <span>Approve All Pending ({pendingTxns.length})</span>
          </button>
        )}
      </div>

      {/* Summary Stat Pills */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-slate-400 font-medium">Total Logged Activity</span>
            <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{transactions.length}</p>
          </div>
          <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600">
            <Filter className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-amber-600 dark:text-amber-400 font-medium">Pending Review Queue</span>
            <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">
              {pendingTxns.length} (${pendingVolume.toLocaleString()})
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950 text-amber-600">
            <ShieldAlert className="w-5 h-5" />
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">Completed Rate</span>
            <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">
              {Math.round((transactions.filter((t) => t.status === 'Completed').length / Math.max(1, transactions.length)) * 100)}%
            </p>
          </div>
          <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search TXN ID, user, merchant, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <div className="flex items-center space-x-1.5 flex-1 md:flex-none">
            <span className="text-slate-500 font-semibold">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Statuses</option>
              <option value="Pending">Pending Only</option>
              <option value="Completed">Completed Only</option>
              <option value="Rejected">Rejected Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 flex-1 md:flex-none">
            <span className="text-slate-500 font-semibold">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Types</option>
              <option value="Credit">Credit</option>
              <option value="Debit">Debit</option>
              <option value="Wire Transfer">Wire Transfer</option>
              <option value="Card Purchase">Card Purchase</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Transaction ID</th>
                <th className="py-3.5 px-6">Customer</th>
                <th className="py-3.5 px-6">Merchant / Counterparty</th>
                <th className="py-3.5 px-6">Type</th>
                <th className="py-3.5 px-6">Amount</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {isLoading ? (
                <>
                  <TransactionRowSkeleton />
                  <TransactionRowSkeleton />
                  <TransactionRowSkeleton />
                  <TransactionRowSkeleton />
                  <TransactionRowSkeleton />
                </>
              ) : filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6 font-mono font-semibold text-slate-900 dark:text-white">
                      {t.id}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-2.5">
                        <img
                          src={t.userAvatar}
                          alt={t.userName}
                          className="w-7 h-7 rounded-full object-cover"
                        />
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">{t.userName}</p>
                          <p className="text-[10px] font-mono text-slate-400">{t.accountNumber}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-700 dark:text-slate-300">
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white">{t.merchantOrSender}</p>
                        <p className="text-[10px] text-slate-400">{t.category}</p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={t.type} type="type" />
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white text-sm">
                      <div className="flex items-center space-x-1">
                        {t.type === 'Credit' || t.type === 'Wire Transfer' ? (
                          <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <ArrowUpRight className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>${t.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={t.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {t.status === 'Pending' && (
                          <>
                            <button
                              onClick={() => setTxnToApprove(t)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-xl transition-colors flex items-center space-x-1"
                              title="Approve"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Approve</span>
                            </button>
                            <button
                              onClick={() => setTxnToReject(t)}
                              className="px-2.5 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/60 dark:text-rose-300 rounded-xl transition-colors flex items-center space-x-1"
                              title="Reject Transaction"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Reject</span>
                            </button>
                          </>
                        )}
                        <button
                          onClick={() => setSelectedTxn(t)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
                          title="View Full Audit Record"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-6">
                    <EmptyState
                      title="No Transactions Found"
                      description={`No financial records or audit entries match your current search "${searchTerm || statusFilter !== 'all' ? searchTerm || statusFilter : typeFilter}".`}
                      icon={Receipt}
                      onAction={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setTypeFilter('all');
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Approving Transaction */}
      <ConfirmAction
        isOpen={!!txnToApprove}
        onClose={() => setTxnToApprove(null)}
        onConfirm={() => {
          if (txnToApprove) {
            approveTransaction(txnToApprove.id);
            setToast(`Transaction #${txnToApprove.id} approved successfully.`, 'success');
            setTxnToApprove(null);
          }
        }}
        title={`Approve Transaction #${txnToApprove?.id}`}
        description={`Are you sure you want to approve this ${txnToApprove?.type} request for $${txnToApprove?.amount.toLocaleString()} from ${txnToApprove?.userName}? This will process the settlement.`}
        confirmText="Approve Transaction"
        cancelText="Cancel"
        variant="info"
        icon={CheckCircle2}
      />

      {/* Confirmation Modal for Rejecting Transaction */}
      <ConfirmAction
        isOpen={!!txnToReject}
        onClose={() => setTxnToReject(null)}
        onConfirm={() => {
          if (txnToReject) {
            rejectTransaction(txnToReject.id);
            setTxnToReject(null);
          }
        }}
        title={`Reject Transaction #${txnToReject?.id}`}
        description={`Are you sure you want to reject this ${txnToReject?.type} request for $${txnToReject?.amount.toLocaleString()} from ${txnToReject?.userName}? This action will halt settlement and notify the customer.`}
        confirmText="Reject Transaction"
        cancelText="Cancel"
        variant="danger"
        icon={XCircle}
      />

      {/* Confirmation Modal for Bulk Approval */}
      <ConfirmAction
        isOpen={showBulkApproveConfirm}
        onClose={() => setShowBulkApproveConfirm(false)}
        onConfirm={() => {
          handleApproveAllPending();
          setShowBulkApproveConfirm(false);
        }}
        title={`Approve All ${pendingTxns.length} Pending Transactions?`}
        description={`You are about to batch approve and settle ${pendingTxns.length} pending transfers totaling $${pendingVolume.toLocaleString()}. Please verify institutional liquidity before confirming.`}
        confirmText={`Approve All $${pendingVolume.toLocaleString()}`}
        cancelText="Review Queue First"
        variant="info"
        icon={Zap}
      />

      <TransactionDetailsModal
        isOpen={!!selectedTxn}
        onClose={() => setSelectedTxn(null)}
        transaction={selectedTxn}
      />
    </div>
  );
};
