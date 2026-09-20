import React, { useState } from 'react';
import { CardType } from '../../types/admin';
import { Modal } from './Modal';
import { useAdminStore } from '../../store/useAdminStore';

interface IssueCardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const IssueCardModal: React.FC<IssueCardModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { users, issueCard } = useAdminStore();

  const [selectedUserId, setSelectedUserId] = useState(users[0]?.id || '');
  const [cardType, setCardType] = useState<CardType>('Visa Platinum');
  const [spendingLimit, setSpendingLimit] = useState<number>(25000);

  const cardGradients: Record<CardType, string> = {
    'Crestline Black Metal': 'from-slate-900 via-slate-800 to-black',
    'Visa Platinum': 'from-blue-700 via-indigo-800 to-blue-900',
    'Mastercard World': 'from-sky-600 via-blue-600 to-indigo-700',
    'Virtual Express': 'from-indigo-600 via-purple-700 to-slate-900',
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = users.find((u) => u.id === selectedUserId) || users[0];
    if (!user) return;

    const random4 = Math.floor(1000 + Math.random() * 9000);
    const maskedNumber = `4${Math.floor(100 + Math.random() * 900)} •••• •••• ${random4}`;
    const expMonth = Math.floor(1 + Math.random() * 12).toString().padStart(2, '0');

    issueCard({
      userId: user.id,
      userName: user.name,
      maskedNumber,
      cardType,
      expiryDate: `${expMonth}/29`,
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      status: 'Active',
      spendingLimit: Number(spendingLimit),
      currentSpent: 0,
      colorGradient: cardGradients[cardType],
    });

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Issue Virtual Card"
      subtitle="Instantly generate a virtual debit or credit card for a Crestline customer"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Select Customer
          </label>
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.accountNumber}) - {u.tier}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Card Tier & Network
          </label>
          <select
            value={cardType}
            onChange={(e) => setCardType(e.target.value as CardType)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          >
            <option value="Visa Platinum">Visa Platinum</option>
            <option value="Mastercard World">Mastercard World</option>
            <option value="Crestline Black Metal">Crestline Black Metal</option>
            <option value="Virtual Express">Virtual Express</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
            Monthly Spending Limit (USD)
          </label>
          <input
            type="number"
            step="1000"
            required
            value={spendingLimit}
            onChange={(e) => setSpendingLimit(parseFloat(e.target.value) || 0)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-sm font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-hidden"
          />
        </div>

        <div className="pt-4 flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md shadow-blue-500/20 transition-all"
          >
            Issue Virtual Card
          </button>
        </div>
      </form>
    </Modal>
  );
};
