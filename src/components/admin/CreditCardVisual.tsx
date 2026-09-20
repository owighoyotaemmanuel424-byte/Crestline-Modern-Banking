import React from 'react';
import { motion } from 'motion/react';
import { VirtualCard } from '../../types/admin';
import { Shield, Snowflake, Lock, Trash2, Wifi } from 'lucide-react';

interface CreditCardVisualProps {
  card: VirtualCard;
  onToggleStatus: (id: string) => void;
  onDelete: (id: string) => void;
}

export const CreditCardVisual: React.FC<CreditCardVisualProps> = ({
  card,
  onToggleStatus,
  onDelete,
}) => {
  const isFrozen = card.status === 'Frozen';
  const spendPercent = Math.min(100, Math.round((card.currentSpent / card.spendingLimit) * 100));

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md flex flex-col justify-between"
    >
      {/* Visual Card Face */}
      <div
        className={`relative aspect-[1.58/1] w-full rounded-2xl p-5 text-white bg-gradient-to-br ${
          card.colorGradient || 'from-blue-800 via-indigo-900 to-slate-900'
        } shadow-lg overflow-hidden flex flex-col justify-between border border-white/10`}
      >
        {/* Subtle background glow pattern */}
        <div className="absolute -right-8 -bottom-8 w-40 h-40 bg-white/10 rounded-full blur-2xl pointer-events-none" />

        {/* Frozen Overlay */}
        {isFrozen && (
          <div className="absolute inset-0 bg-slate-950/75 backdrop-blur-xs flex flex-col items-center justify-center text-sky-200 z-10 transition-opacity">
            <Snowflake className="w-8 h-8 animate-spin-slow mb-1.5 text-sky-300" />
            <span className="text-xs font-bold uppercase tracking-wider bg-sky-900/80 px-3 py-1 rounded-full border border-sky-400/30">
              CARD FROZEN
            </span>
          </div>
        )}

        {/* Top Card Header */}
        <div className="flex items-center justify-between z-1">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center font-bold text-xs">
              <Shield className="w-3.5 h-3.5 text-blue-200" />
            </div>
            <span className="font-semibold text-xs tracking-wider opacity-90">
              CRESTLINE CAPITAL
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold tracking-widest bg-white/15 px-2 py-0.5 rounded-md backdrop-blur-xs">
            {card.cardType}
          </span>
        </div>

        {/* Chip & Contactless */}
        <div className="flex items-center space-x-3 my-1 z-1">
          <div className="w-9 h-7 bg-amber-300/80 rounded-md border border-amber-200/50 flex items-center justify-center relative overflow-hidden">
            <div className="w-full h-0.5 bg-amber-600/40 absolute top-2" />
            <div className="w-full h-0.5 bg-amber-600/40 absolute bottom-2" />
            <div className="h-full w-0.5 bg-amber-600/40 absolute left-3" />
          </div>
          <Wifi className="w-5 h-5 opacity-60 rotate-90" />
        </div>

        {/* Card Number */}
        <div className="z-1 font-mono text-base sm:text-lg font-bold tracking-widest text-slate-100 my-1">
          {card.maskedNumber}
        </div>

        {/* Footer info */}
        <div className="flex items-end justify-between z-1 text-xs">
          <div>
            <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Cardholder</p>
            <p className="font-semibold text-white tracking-wide truncate max-w-[150px]">{card.userName}</p>
          </div>
          <div className="text-right">
            <p className="text-[9px] uppercase tracking-wider text-slate-300 font-semibold">Expires</p>
            <p className="font-mono font-semibold text-white">{card.expiryDate}</p>
          </div>
        </div>
      </div>

      {/* Spend Details & Action Controls */}
      <div className="mt-4 space-y-3">
        <div>
          <div className="flex justify-between text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">
            <span>Monthly Spend</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              ${card.currentSpent.toLocaleString()} / ${card.spendingLimit.toLocaleString()}
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                spendPercent > 85 ? 'bg-rose-500' : spendPercent > 60 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${spendPercent}%` }}
            />
          </div>
        </div>

        <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => onToggleStatus(card.id)}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold flex items-center justify-center space-x-1.5 transition-colors ${
              isFrozen
                ? 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/60 dark:text-amber-300'
            }`}
          >
            {isFrozen ? (
              <>
                <Lock className="w-3.5 h-3.5" />
                <span>Unfreeze Card</span>
              </>
            ) : (
              <>
                <Snowflake className="w-3.5 h-3.5" />
                <span>Freeze Card</span>
              </>
            )}
          </button>

          <button
            onClick={() => onDelete(card.id)}
            className="p-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors"
            title="Revoke / Delete Card"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};
