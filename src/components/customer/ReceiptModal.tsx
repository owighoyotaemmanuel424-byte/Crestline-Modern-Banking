import React from 'react';
import { useBankStore } from '../../store/useBankStore';
import { CheckCircle2, Printer, X, ShieldCheck, ArrowRightLeft, Building2 } from 'lucide-react';

export const ReceiptModal: React.FC = () => {
  const { selectedReceipt, setSelectedReceipt } = useBankStore();

  if (!selectedReceipt) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              C
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Crestline Capital</h3>
              <p className="text-xs text-slate-500">Official Transaction Receipt</p>
            </div>
          </div>
          <button
            onClick={() => setSelectedReceipt(null)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Printable Body */}
        <div className="p-6 overflow-y-auto space-y-6 printable-receipt">
          {/* Status and Amount Banner */}
          <div className="text-center pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200/50 mb-3">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {selectedReceipt.status === 'COMPLETED' ? 'Settled & Verified' : selectedReceipt.status}
            </div>
            <div className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono tracking-tight">
              {selectedReceipt.formattedAmount}
            </div>
            <p className="text-xs text-slate-500 mt-1">{selectedReceipt.description}</p>
          </div>

          {/* Reference Details Grid */}
          <div className="space-y-3 text-sm">
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 text-xs">Reference Number</span>
              <span className="font-mono font-medium text-slate-900 dark:text-white text-xs">{selectedReceipt.reference}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 text-xs">Timestamp</span>
              <span className="font-medium text-slate-900 dark:text-white text-xs">{new Date(selectedReceipt.createdAt).toLocaleString()}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 text-xs">Originator / Account</span>
              <span className="font-medium text-slate-900 dark:text-white text-xs text-right">
                {selectedReceipt.senderName} ({selectedReceipt.senderAccount})
              </span>
            </div>
            {selectedReceipt.recipientName && (
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-500 text-xs">Beneficiary / Account</span>
                <span className="font-medium text-slate-900 dark:text-white text-xs text-right">
                  {selectedReceipt.recipientName} ({selectedReceipt.recipientAccount})
                </span>
              </div>
            )}
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 text-xs">Routing Number</span>
              <span className="font-mono text-slate-900 dark:text-white text-xs">{selectedReceipt.routingNumber}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-500 text-xs">Network Fee</span>
              <span className="font-medium text-slate-900 dark:text-white text-xs">{selectedReceipt.formattedFee}</span>
            </div>
          </div>

          {/* Audit Stamp */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <p className="font-semibold text-slate-900 dark:text-white">Double-Entry Ledger Verified</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                This transaction is permanently settled in Crestline Capital’s immutable ledger database. Authenticated under FDIC Member ID 89201.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-300 transition"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
          <button
            onClick={() => setSelectedReceipt(null)}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
