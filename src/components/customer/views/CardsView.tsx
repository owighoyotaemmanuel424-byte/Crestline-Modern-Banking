import React, { useState, useEffect } from 'react';
import { useBankStore } from '../../../store/useBankStore';
import { BankCard } from '../../../types/banking';
import { 
  CreditCard, 
  ShieldCheck, 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  PlusCircle, 
  Sliders, 
  Globe, 
  Wifi, 
  ShoppingCart, 
  Copy, 
  Check, 
  Sparkles, 
  AlertCircle, 
  ArrowUpRight,
  KeyRound,
  Layers,
  ChevronRight
} from 'lucide-react';

export const CustomerCardsView: React.FC = () => {
  const { 
    user, 
    accounts, 
    cards, 
    fetchCards, 
    toggleCardFreeze, 
    updateCardSettings, 
    issueCard, 
    showToast 
  } = useBankStore();

  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
  const [revealedNumberId, setRevealedNumberId] = useState<string | null>(null);
  const [revealedPinId, setRevealedPinId] = useState<string | null>(null);
  const [revealedPinValue, setRevealedPinValue] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // New card modal form state
  const [newCardAccountId, setNewCardAccountId] = useState(accounts[0]?.id || '');
  const [newCardType, setNewCardType] = useState<'VIRTUAL' | 'DEBIT'>('VIRTUAL');
  const [newCardTier, setNewCardTier] = useState<string>('Obsidian Elite');
  const [isIssuing, setIsIssuing] = useState(false);

  useEffect(() => {
    fetchCards();
  }, []);

  useEffect(() => {
    if (cards.length > 0 && !selectedCardId) {
      setSelectedCardId(cards[0].id);
    }
  }, [cards]);

  const activeCard = cards.find((c) => c.id === selectedCardId) || cards[0];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    showToast(`Copied ${text}`, 'info');
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleRevealPin = async (cardId: string) => {
    if (revealedPinId === cardId) {
      setRevealedPinId(null);
      setRevealedPinValue(null);
      return;
    }

    try {
      const authRaw = localStorage.getItem('crestline_bank_session');
      const token = authRaw ? JSON.parse(authRaw)?.state?.token : null;
      if (token) {
        const res = await fetch(`/api/cards/${cardId}/pin`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) {
          setRevealedPinId(cardId);
          setRevealedPinValue(data.pin);
          showToast('Card PIN revealed securely for 15 seconds.', 'info');
          setTimeout(() => {
            setRevealedPinId(null);
            setRevealedPinValue(null);
          }, 15000);
        }
      }
    } catch (_) {
      showToast('Could not retrieve card PIN', 'error');
    }
  };

  const handleIssueSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCardAccountId) {
      showToast('Please select an account for the new card', 'error');
      return;
    }

    setIsIssuing(true);
    const success = await issueCard(newCardAccountId, newCardType, newCardTier);
    setIsIssuing(false);
    if (success) {
      setIsIssueModalOpen(false);
    }
  };

  const formatCardNumberSpaced = (num: string, reveal: boolean) => {
    if (!num) return '•••• •••• •••• ••••';
    if (reveal) {
      return num.replace(/(\d{4})/g, '$1 ').trim();
    }
    return `•••• •••• •••• ${num.slice(-4)}`;
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Commercial & Obsidian Cards
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your physical metal debit and virtual commercial cards with real-time spend controls and instant freeze.
          </p>
        </div>

        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-lg shadow-blue-600/20 self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Issue New Card</span>
        </button>
      </div>

      {cards.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <CreditCard className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">No active cards found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Issue an instant virtual card or order an Obsidian Elite debit card linked to your Crestline Capital accounts.
          </p>
          <button
            onClick={() => setIsIssueModalOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-xs font-bold hover:bg-blue-500 transition"
          >
            Create Your First Card
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Visual Card Display & Quick Actions */}
          <div className="lg:col-span-6 space-y-5">
            {/* Card Selector Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {cards.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCardId(c.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCardId === c.id
                      ? 'bg-slate-900 text-white border-slate-900 dark:bg-white dark:text-slate-900 dark:border-white shadow-sm'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  {c.cardTier} •••• {c.last4}
                </button>
              ))}
            </div>

            {/* Interactive Card Canvas */}
            {activeCard && (
              <div className="relative overflow-hidden rounded-3xl p-7 text-white shadow-2xl transition-all duration-300 transform select-none bg-gradient-to-tr from-slate-950 via-slate-900 to-zinc-800 border border-slate-700/50 min-h-[230px] flex flex-col justify-between">
                {/* Decorative Metallic Sheen Overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent pointer-events-none" />

                {/* Card Top Row: Brand & Status */}
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center font-extrabold text-sm text-white">
                      C
                    </div>
                    <div>
                      <span className="text-xs font-extrabold tracking-wider uppercase text-slate-200 block">
                        Crestline Capital
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                        {activeCard.cardTier}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeCard.status === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {activeCard.status === 'ACTIVE' ? 'Active' : 'Frozen'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-white/10 text-white/80 border border-white/10">
                      {activeCard.cardType}
                    </span>
                  </div>
                </div>

                {/* EMV Chip & Contactless Symbol */}
                <div className="relative z-10 flex items-center gap-3 my-2">
                  <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 via-amber-300 to-amber-500 border border-amber-400/80 shadow-inner flex items-center justify-center">
                    <div className="w-7 h-5 border border-amber-700/40 rounded-sm grid grid-cols-2 opacity-50" />
                  </div>
                  <Wifi className="w-5 h-5 text-white/60 rotate-90" />
                </div>

                {/* Card Number & Reveal Controls */}
                <div className="relative z-10 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-lg sm:text-xl font-bold tracking-widest text-slate-100">
                      {formatCardNumberSpaced(activeCard.cardNumber, revealedNumberId === activeCard.id)}
                    </span>
                    <button
                      onClick={() =>
                        setRevealedNumberId(revealedNumberId === activeCard.id ? null : activeCard.id)
                      }
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition"
                      title="Reveal / Mask Card Number"
                    >
                      {revealedNumberId === activeCard.id ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Card Bottom Row: Holder & Expiry & CVV */}
                <div className="relative z-10 flex items-end justify-between pt-2 border-t border-white/10 text-xs">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                      Cardholder
                    </span>
                    <span className="font-bold tracking-wide text-white uppercase">
                      {activeCard.cardHolder || `${user?.firstName} ${user?.lastName}`}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                        Expires
                      </span>
                      <span className="font-mono font-bold text-white">
                        {String(activeCard.expiryMonth).padStart(2, '0')}/{String(activeCard.expiryYear).slice(-2)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold block">
                        CVV
                      </span>
                      <span className="font-mono font-bold text-white">
                        {revealedNumberId === activeCard.id ? activeCard.cvv : '•••'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Card Action Buttons */}
            {activeCard && (
              <div className="grid grid-cols-3 gap-2.5">
                <button
                  onClick={() => toggleCardFreeze(activeCard.id)}
                  className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center justify-center gap-1.5 transition ${
                    activeCard.status === 'FROZEN'
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                      : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850'
                  }`}
                >
                  {activeCard.status === 'FROZEN' ? (
                    <Unlock className="w-4 h-4 text-amber-600" />
                  ) : (
                    <Lock className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                  <span>{activeCard.status === 'FROZEN' ? 'Unfreeze' : 'Freeze Card'}</span>
                </button>

                <button
                  onClick={() => handleRevealPin(activeCard.id)}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1.5 transition"
                >
                  <KeyRound className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                  <span>
                    {revealedPinId === activeCard.id && revealedPinValue
                      ? `PIN: ${revealedPinValue}`
                      : 'Show PIN'}
                  </span>
                </button>

                <button
                  onClick={() => copyToClipboard(activeCard.cardNumber, 'card_num')}
                  className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-850 text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col items-center justify-center gap-1.5 transition"
                >
                  {copiedKey === 'card_num' ? (
                    <Check className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-600 dark:text-slate-400" />
                  )}
                  <span>Copy Number</span>
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Card Configuration & Spending Controls */}
          <div className="lg:col-span-6 space-y-5">
            {activeCard && (
              <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Spending Limits & Security Governance
                    </h3>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    Linked to {activeCard.accountName || 'Primary Checking'}
                  </span>
                </div>

                {/* Spending Velocity Limits */}
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">Daily Spend Ceiling</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        ${((activeCard.dailySpendLimitCents || 500000) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="100000"
                      max="2500000"
                      step="50000"
                      value={activeCard.dailySpendLimitCents || 500000}
                      onChange={(e) =>
                        updateCardSettings(activeCard.id, { dailySpendLimitCents: parseInt(e.target.value) })
                      }
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>$1,000.00</span>
                      <span>$25,000.00</span>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center text-xs font-bold mb-1.5">
                      <span className="text-slate-700 dark:text-slate-300">Monthly Spend Ceiling</span>
                      <span className="font-mono text-blue-600 dark:text-blue-400">
                        ${((activeCard.monthlySpendLimitCents || 2500000) / 100).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="500000"
                      max="10000000"
                      step="250000"
                      value={activeCard.monthlySpendLimitCents || 2500000}
                      onChange={(e) =>
                        updateCardSettings(activeCard.id, { monthlySpendLimitCents: parseInt(e.target.value) })
                      }
                      className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-800 rounded-lg"
                    />
                    <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                      <span>$5,000.00</span>
                      <span>$100,000.00</span>
                    </div>
                  </div>
                </div>

                {/* Channel Permissions Toggles */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                    Transaction Channels
                  </h4>

                  {/* Online / E-Commerce */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                        <ShoppingCart className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Online E-Commerce Transactions
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Permit digital web checkouts & SaaS subscriptions
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeCard.onlineEnabled}
                        onChange={(e) =>
                          updateCardSettings(activeCard.id, { onlineEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  {/* International Swipes */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                        <Globe className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          International Swipes & Zero FX
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Cross-border authorization with 0% foreign transaction fees
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeCard.internationalEnabled}
                        onChange={(e) =>
                          updateCardSettings(activeCard.id, { internationalEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>

                  {/* Contactless / NFC */}
                  <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 flex items-center justify-center">
                        <Wifi className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs font-bold text-slate-900 dark:text-white block">
                          Contactless Tap-to-Pay (NFC)
                        </span>
                        <span className="text-[11px] text-slate-500">
                          Apple Pay, Google Pay, and physical terminal wave
                        </span>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeCard.contactlessEnabled}
                        onChange={(e) =>
                          updateCardSettings(activeCard.id, { contactlessEnabled: e.target.checked })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600" />
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Issue New Card */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                Issue a New Crestline Card
              </h3>
              <button
                onClick={() => setIsIssueModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleIssueSubmit} className="space-y-4">
              {/* Linked Account */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Funding Account
                </label>
                <select
                  value={newCardAccountId}
                  onChange={(e) => setNewCardAccountId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.account_name} ({acc.account_number}) — ${(acc.available_balance / 100).toFixed(2)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Card Type */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Card Format
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setNewCardType('VIRTUAL')}
                    className={`p-3 rounded-xl border text-left transition ${
                      newCardType === 'VIRTUAL'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">Instant Virtual</span>
                    <span className="text-[10px] text-slate-500">Ready in 2 seconds</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setNewCardType('DEBIT')}
                    className={`p-3 rounded-xl border text-left transition ${
                      newCardType === 'DEBIT'
                        ? 'border-blue-600 bg-blue-50/50 dark:bg-blue-950/40 text-blue-900 dark:text-blue-200'
                        : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                    }`}
                  >
                    <span className="text-xs font-bold block">Obsidian Debit</span>
                    <span className="text-[10px] text-slate-500">Metal physical card</span>
                  </button>
                </div>
              </div>

              {/* Card Tier */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Card Tier
                </label>
                <select
                  value={newCardTier}
                  onChange={(e) => setNewCardTier(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Obsidian Elite">Obsidian Elite (Concierge & 0% FX)</option>
                  <option value="Platinum Reserve">Platinum Reserve (Commercial Unlimited)</option>
                  <option value="Commercial Black">Commercial Black (Institutional Treasury)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-slate-700 dark:text-slate-300">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Crestline Fraud-Shield Guarantee</span>
                </div>
                <p>Zero fraud liability on all unauthorized card charges with instant freeze controls.</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuing}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition shadow-md shadow-blue-600/30 disabled:opacity-50"
                >
                  {isIssuing ? 'Activating...' : 'Activate Card'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
