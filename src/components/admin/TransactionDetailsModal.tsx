import React from 'react';
import { Transaction } from '../../types/admin';
import { Modal } from './Modal';
import { StatusBadge } from './StatusBadge';
import { useAdminStore } from '../../store/useAdminStore';
import { CheckCircle2, XCircle, ShieldAlert, ArrowUpRight, ArrowDownLeft, Building, UserCheck } from 'lucide-react';

interface TransactionDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
}

export const TransactionDetailsModal: React.FC<TransactionDetailsModalProps> = ({
  isOpen,
  onClose,
  transaction,
}) => {
  const { approveTransaction, rejectTransaction } = useAdminStore();

  if (!transaction) return null;

  const isPending = transaction.status === 'Pending';

  const handleApprove = () => {
    approveTransaction(transaction.id);
    onClose();
  };

  const handleReject = () => {
    rejectTransaction(transaction.id);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Transaction #${transaction.id}`}
      subtitle="Complete financial transaction audit & risk review"
    >
      <div className="space-y-6">
        {/* Top Header Card */}
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-3 rounded-xl ${
              transaction.type === 'Credit'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                : 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
            }`}>
              {transaction.type === 'Credit' ? (
                <ArrowDownLeft className="w-6 h-6" />
              ) : (
                <ArrowUpRight className="w-6 h-6" />
              )}
            </div>
            <div>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Transaction Amount</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
                ${transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h3>
            </div>
          </div>

          <StatusBadge status={transaction.status} />
        </div>

        {/* User Info & Merchant Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center space-x-2 text-slate-500 mb-2">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Customer Details</span>
            </div>
            <div className="flex items-center space-x-2.5 my-1.5">
              <img
                src={transaction.userAvatar}
                alt={transaction.userName}
                className="w-8 h-8 rounded-full object-cover"
              />
              <div>
                <p className="font-bold text-slate-900 dark:text-white">{transaction.userName}</p>
                <p className="text-slate-500 font-mono text-[11px]">{transaction.accountNumber}</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
            <div className="flex items-center space-x-2 text-slate-500 mb-2">
              <Building className="w-4 h-4 text-indigo-600" />
              <span className="font-semibold text-slate-700 dark:text-slate-300">Merchant / Counterparty</span>
            </div>
            <p className="font-bold text-slate-900 dark:text-white text-sm my-1">
              {transaction.merchantOrSender}
            </p>
            <p className="text-slate-500 text-[11px]">Category: {transaction.category}</p>
          </div>
        </div>

        {/* Transaction Meta Details */}
        <div className="space-y-2 border-t border-b border-slate-100 dark:border-slate-800 py-3 text-xs">
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">Reference Code</span>
            <span className="font-mono font-semibold text-slate-900 dark:text-white">{transaction.referenceCode}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">Timestamp</span>
            <span className="font-medium text-slate-900 dark:text-white">{transaction.timestamp}</span>
          </div>
          <div className="flex justify-between py-1">
            <span className="text-slate-500 dark:text-slate-400">Transaction Type</span>
            <span className="font-medium text-slate-900 dark:text-white">{transaction.type}</span>
          </div>
          {transaction.riskScore && (
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-500" /> Compliance Risk Rating
              </span>
              <StatusBadge status={transaction.riskScore} type="risk" />
            </div>
          )}
        </div>

        {/* Action Controls for Pending Transactions */}
        {isPending ? (
          <div className="flex items-center justify-end space-x-3 pt-2">
            <button
              onClick={handleReject}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/50 dark:text-rose-300 transition-colors flex items-center justify-center space-x-1.5"
            >
              <XCircle className="w-4 h-4" />
              <span>Reject Transaction</span>
            </button>
            <button
              onClick={handleApprove}
              className="flex-1 py-2.5 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-md shadow-emerald-500/20 transition-all flex items-center justify-center space-x-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Approve & Settle</span>
            </button>
          </div>
        ) : (
          <div className="text-center text-xs text-slate-500 dark:text-slate-400 pt-2 font-medium">
            This transaction is closed with status: <span className="font-bold uppercase">{transaction.status}</span>
          </div>
        )}
      </div>
    </Modal>
  );
};
