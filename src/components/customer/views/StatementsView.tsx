import React, { useState, useEffect } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { AccountStatement } from '../../../types/banking';
import { Printer, Download, FileText, Calendar, Building2, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const CustomerStatementsView: React.FC = () => {
  const { accounts, token, showToast } = useBankStore();

  const [selectedAccId, setSelectedAccId] = useState(accounts[0]?.id || '');
  const [statementData, setStatementData] = useState<AccountStatement | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStatement = async (accId: string) => {
    if (!token || !accId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/accounts/${accId}/statement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success && data.statement) {
        setStatementData(data.statement);
      }
    } catch (_) {
      showToast('Could not load account statement', 'error');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedAccId) {
      fetchStatement(selectedAccId);
    }
  }, [selectedAccId, token]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 no-print">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Official Account Statements
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Certified periodic financial statements for tax, auditing, and accounting records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedAccId}
            onChange={(e) => setSelectedAccId(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:outline-none"
          >
            {accounts.map((acc) => (
              <option key={acc.id} value={acc.id}>
                {acc.account_name} ({acc.account_number})
              </option>
            ))}
          </select>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print / Save PDF</span>
          </button>
        </div>
      </div>

      {/* Printable Statement Document */}
      {statementData ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-8 sm:p-10 shadow-sm max-w-4xl mx-auto printable-statement">
          {/* Statement Bank Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between pb-8 border-b border-slate-200 dark:border-slate-800 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
                  C
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                  {statementData.institution}
                </h2>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                555 Financial Plaza, Suite 4000<br />
                New York, NY 10005<br />
                Member FDIC • Equal Housing Lender
              </p>
            </div>

            <div className="sm:text-right space-y-1">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">
                Periodic Account Statement
              </span>
              <p className="text-xs text-slate-500">
                Period Ending: <strong className="text-slate-800 dark:text-slate-200">{new Date(statementData.period.end).toLocaleDateString()}</strong>
              </p>
              <p className="text-xs text-slate-500">
                Routing (ABA): <strong className="font-mono text-slate-800 dark:text-slate-200">{statementData.routingNumber}</strong>
              </p>
            </div>
          </div>

          {/* Account Details & Holder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-6 border-b border-slate-100 dark:border-slate-800 text-xs">
            <div>
              <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                Account Holder
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                {statementData.holder.name}
              </p>
              <p className="text-slate-500">{statementData.holder.email}</p>
              {statementData.holder.phone && <p className="text-slate-500">{statementData.holder.phone}</p>}
            </div>

            <div className="sm:text-right">
              <span className="font-semibold text-slate-400 uppercase text-[10px] tracking-wider">
                Account Summary
              </span>
              <p className="font-bold text-sm text-slate-900 dark:text-white mt-1">
                {statementData.accountName}
              </p>
              <p className="font-mono text-slate-500">Account #{statementData.accountNumber}</p>
              <p className="text-slate-500 font-semibold">{statementData.accountType}</p>
            </div>
          </div>

          {/* Balance Matrix */}
          <div className="grid grid-cols-3 gap-4 py-6 border-b border-slate-200 dark:border-slate-800 text-center">
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[11px] font-semibold text-slate-500">Total Credits (+)</p>
              <p className="text-lg font-bold font-mono text-emerald-600 mt-0.5">
                ${(statementData.totalDeposits / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50">
              <p className="text-[11px] font-semibold text-slate-500">Total Debits (–)</p>
              <p className="text-lg font-bold font-mono text-slate-900 dark:text-white mt-0.5">
                ${(statementData.totalDebits / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200/60 dark:border-blue-800/50">
              <p className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Ending Balance</p>
              <p className="text-lg font-bold font-mono text-blue-700 dark:text-blue-300 mt-0.5">
                ${(statementData.currentBalance / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </p>
            </div>
          </div>

          {/* Itemized Activity Schedule */}
          <div className="pt-6">
            <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider mb-4">
              Itemized Transaction Ledger
            </h3>

            {statementData.transactions.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No transactions during this billing cycle.</p>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[10px] font-bold text-slate-400 uppercase">
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5">Reference</th>
                    <th className="py-2.5">Description</th>
                    <th className="py-2.5 text-right">Amount (USD)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {statementData.transactions.map((tx) => {
                    const isCredit = tx.type === 'DEPOSIT' || tx.recipient_name === statementData.holder.name;
                    const amt = ((tx.amount || 0) / 100).toFixed(2);

                    return (
                      <tr key={tx.id} className="py-2">
                        <td className="py-2.5 text-slate-500 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-2.5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                          {tx.reference}
                        </td>
                        <td className="py-2.5 font-medium text-slate-800 dark:text-slate-200">
                          {tx.description}
                        </td>
                        <td
                          className={`py-2.5 text-right font-mono font-bold whitespace-nowrap ${
                            isCredit ? 'text-emerald-600' : 'text-slate-900 dark:text-white'
                          }`}
                        >
                          {isCredit ? `+$${amt}` : `-$${amt}`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Statement Audit Footer */}
          <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>Certified double-entry cryptographic record generated by Crestline Core Engine.</span>
            </div>
            <span>Page 1 of 1</span>
          </div>
        </div>
      ) : (
        <div className="py-12 text-center text-xs text-slate-400">Loading statement...</div>
      )}
    </div>
  );
};
