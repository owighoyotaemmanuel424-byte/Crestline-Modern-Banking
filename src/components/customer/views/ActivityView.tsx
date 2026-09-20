import React, { useState, useMemo } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  ArrowRightLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react';

export const CustomerActivityView: React.FC = () => {
  const { user, accounts, transactions, viewReceipt, showToast } = useBankStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedAccount, setSelectedAccount] = useState<string>('ALL');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      // Type match
      if (selectedType !== 'ALL' && tx.type !== selectedType) return false;

      // Account match
      if (selectedAccount !== 'ALL' && tx.account_id !== selectedAccount) return false;

      // Search match
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchDesc = tx.description?.toLowerCase().includes(query);
        const matchRef = tx.reference?.toLowerCase().includes(query);
        const matchSender = tx.sender_name?.toLowerCase().includes(query);
        const matchRecipient = tx.recipient_name?.toLowerCase().includes(query);
        if (!matchDesc && !matchRef && !matchSender && !matchRecipient) return false;
      }

      return true;
    });
  }, [transactions, selectedType, selectedAccount, searchTerm]);

  const exportCSV = () => {
    if (filteredTransactions.length === 0) {
      showToast('No transactions to export', 'info');
      return;
    }

    const headers = ['Reference', 'Date', 'Type', 'Description', 'Amount (USD)', 'Status', 'Account'];
    const rows = filteredTransactions.map((tx) => [
      tx.reference,
      new Date(tx.created_at).toISOString(),
      tx.type,
      `"${(tx.description || '').replace(/"/g, '""')}"`,
      ((tx.amount || 0) / 100).toFixed(2),
      tx.status,
      tx.account_number || tx.account_id
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `crestline_activity_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Activity statement exported to CSV', 'success');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Account Activity & History
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Complete transaction ledger with immutable audit references and printable receipts.
          </p>
        </div>

        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition shadow-sm w-fit"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV Ledger</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by description, reference, sender, or recipient..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>

        {/* Type Filter */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Types</option>
            <option value="DEPOSIT">Deposits</option>
            <option value="WITHDRAWAL">Withdrawals</option>
            <option value="TRANSFER">Internal Transfers</option>
          </select>

          {/* Account Filter */}
          <select
            value={selectedAccount}
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full md:w-auto px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            <option value="ALL">All Accounts</option>
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name} ({acc.account_number})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden">
        {filteredTransactions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs space-y-2">
            <p>No transactions match your search criteria.</p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedAccount('ALL');
              }}
              className="text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Transaction Details</th>
                  <th className="py-3 px-4">Reference</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Amount (USD)</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredTransactions.map((tx) => {
                  const isCredit = tx.type === 'DEPOSIT' || tx.recipient_name === `${user?.firstName} ${user?.lastName}`;
                  const formattedAmt = ((tx.amount || 0) / 100).toLocaleString('en-US', {
                    style: 'currency',
                    currency: 'USD'
                  });

                  return (
                    <tr
                      key={tx.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition group cursor-pointer"
                      onClick={() => viewReceipt(tx.id)}
                    >
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                        <div>{new Date(tx.created_at).toLocaleDateString()}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <p className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                          {tx.description}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {tx.sender_name && tx.recipient_name ? (
                            <span>{tx.sender_name} &rarr; {tx.recipient_name}</span>
                          ) : (
                            <span>Account: {tx.account_number || tx.account_id}</span>
                          )}
                        </p>
                      </td>

                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {tx.reference}
                      </td>

                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {tx.type}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span
                          className={`font-mono font-extrabold text-xs ${
                            isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isCredit ? `+${formattedAmt}` : `-${formattedAmt}`}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            tx.status === 'COMPLETED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                              : tx.status === 'PENDING'
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                              : 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300'
                          }`}
                        >
                          {tx.status}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            viewReceipt(tx.id);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 transition"
                        >
                          <Printer className="w-3 h-3" />
                          Receipt
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
