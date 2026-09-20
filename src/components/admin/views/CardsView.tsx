import React, { useState } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { CreditCardVisual } from '../CreditCardVisual';
import { IssueCardModal } from '../IssueCardModal';
import { StatusBadge } from '../StatusBadge';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../EmptyState';
import { VirtualCard } from '../../../types/admin';
import {
  CreditCard,
  Plus,
  Search,
  LayoutGrid,
  List,
  Lock,
  Trash2,
  Snowflake,
  ShieldAlert
} from 'lucide-react';

export const CardsView: React.FC = () => {
  const { cards, toggleCardStatus, deleteCard } = useAdminStore();

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Frozen'>('all');
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  const [cardToFreeze, setCardToFreeze] = useState<VirtualCard | null>(null);
  const [cardToDelete, setCardToDelete] = useState<VirtualCard | null>(null);

  const filteredCards = cards.filter((c) => {
    const matchesSearch =
      c.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.maskedNumber.includes(searchTerm) ||
      c.cardType.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const totalCardsCount = cards.length;
  const activeCardsCount = cards.filter((c) => c.status === 'Active').length;
  const frozenCardsCount = cards.filter((c) => c.status === 'Frozen').length;
  const totalVolumeSpent = cards.reduce((acc, c) => acc + c.currentSpent, 0);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Issue Card CTA */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Virtual Cards Portfolio & Provisioning
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Issue, freeze, monitor spending limits, or revoke virtual debit and credit cards
          </p>
        </div>

        <button
          onClick={() => setIsIssueModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Issue Virtual Card</span>
        </button>
      </div>

      {/* Metrics Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-400 font-medium">Issued Cards</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{totalCardsCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active Cards</span>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{activeCardsCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-amber-600 dark:text-amber-400 font-medium">Frozen Cards</span>
          <p className="text-lg font-bold text-amber-700 dark:text-amber-300 mt-0.5">{frozenCardsCount}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-400 font-medium">Monthly Active Spend</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            ${totalVolumeSpent.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Controls: Search, Status Filter, Grid/Table Switch */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search cardholder, number, or tier..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-xs focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Active">Active Cards</option>
            <option value="Frozen">Frozen Cards</option>
          </select>

          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="3D Card Visual Grid"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
              title="Compact Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid or Table Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCards.length > 0 ? (
            filteredCards.map((card) => (
              <CreditCardVisual
                key={card.id}
                card={card}
                onToggleStatus={(id) => {
                  if (card.status === 'Active') {
                    setCardToFreeze(card);
                  } else {
                    toggleCardStatus(id);
                  }
                }}
                onDelete={(id) => setCardToDelete(card)}
              />
            ))
          ) : (
            <div className="col-span-full">
              <EmptyState
                title="No Virtual Cards Found"
                description={`No active or frozen virtual cards match your search term "${searchTerm || statusFilter}". Try searching by cardholder name or card number.`}
                icon={CreditCard}
                onAction={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">Masked Card #</th>
                  <th className="py-3.5 px-6">Cardholder</th>
                  <th className="py-3.5 px-6">Card Tier</th>
                  <th className="py-3.5 px-6">Spend / Limit</th>
                  <th className="py-3.5 px-6">Expiry</th>
                  <th className="py-3.5 px-6">Status</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
                {filteredCards.length > 0 ? (
                  filteredCards.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold text-slate-900 dark:text-white">
                        {c.maskedNumber}
                      </td>
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200">
                        {c.userName}
                      </td>
                      <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                        {c.cardType}
                      </td>
                      <td className="py-4 px-6 font-semibold">
                        ${c.currentSpent.toLocaleString()} / ${c.spendingLimit.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-mono text-slate-500">
                        {c.expiryDate}
                      </td>
                      <td className="py-4 px-6">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => {
                              if (c.status === 'Active') {
                                setCardToFreeze(c);
                              } else {
                                toggleCardStatus(c.id);
                              }
                            }}
                            className={`p-1.5 rounded-lg transition-colors ${
                              c.status === 'Active'
                                ? 'text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/50'
                                : 'text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50'
                            }`}
                            title={c.status === 'Active' ? 'Freeze Card' : 'Unfreeze Card'}
                          >
                            {c.status === 'Active' ? <Snowflake className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => setCardToDelete(c)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Revoke / Delete Card"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 px-6">
                      <EmptyState
                        title="No Virtual Cards Found"
                        description={`No active or frozen virtual cards match your search term "${searchTerm || statusFilter}". Try searching by cardholder name or card number.`}
                        icon={CreditCard}
                        onAction={() => {
                          setSearchTerm('');
                          setStatusFilter('all');
                        }}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Freezing Card */}
      <ConfirmModal
        isOpen={!!cardToFreeze}
        onClose={() => setCardToFreeze(null)}
        onConfirm={() => {
          if (cardToFreeze) {
            toggleCardStatus(cardToFreeze.id);
            setCardToFreeze(null);
          }
        }}
        title={`Freeze Virtual Card (${cardToFreeze?.maskedNumber})`}
        description={`Freezing card ending in ${cardToFreeze?.maskedNumber} for ${cardToFreeze?.userName} will temporarily decline all new POS and online purchases until reactivated by an administrator.`}
        confirmText="Freeze Card Now"
        cancelText="Keep Card Active"
        variant="warning"
        icon={Snowflake}
      />

      {/* Confirmation Modal for Revoking/Deleting Card */}
      <ConfirmModal
        isOpen={!!cardToDelete}
        onClose={() => setCardToDelete(null)}
        onConfirm={() => {
          if (cardToDelete) {
            deleteCard(cardToDelete.id);
            setCardToDelete(null);
          }
        }}
        title={`Revoke & Cancel Card (${cardToDelete?.maskedNumber})`}
        description={`Are you sure you want to permanently revoke card ${cardToDelete?.maskedNumber} issued to ${cardToDelete?.userName}? This card will be destroyed immediately and cannot be recovered.`}
        confirmText="Permanently Revoke"
        cancelText="Cancel"
        variant="danger"
        icon={Trash2}
      />

      {/* Issue Card Modal */}
      <IssueCardModal
        isOpen={isIssueModalOpen}
        onClose={() => setIsIssueModalOpen(false)}
      />
    </div>
  );
};
