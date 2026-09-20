import React, { useState, useEffect } from 'react';
import { useAdminStore } from '../../../store/useAdminStore';
import { User, UserStatus, UserTier } from '../../../types/admin';
import { StatusBadge } from '../StatusBadge';
import { UserModal } from '../UserModal';
import { Modal } from '../Modal';
import { ConfirmModal } from '../ConfirmModal';
import { EmptyState } from '../EmptyState';
import { UsersSkeleton } from '../Skeletons';
import { UserDetailView } from './UserDetailView';
import {
  UserPlus,
  Search,
  Eye,
  Edit,
  UserX,
  UserCheck,
  ShieldCheck,
  CreditCard,
  DollarSign,
  Users,
  Settings2
} from 'lucide-react';

export const UsersView: React.FC = () => {
  const {
    users,
    suspendUser,
    activateUser,
    cards,
    selectedUserId,
    setSelectedUserId
  } = useAdminStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | UserStatus>('all');
  const [tierFilter, setTierFilter] = useState<'all' | UserTier>('all');
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<User | null>(null);
  const [userToInspect, setUserToInspect] = useState<User | null>(null);
  const [userToSuspend, setUserToSuspend] = useState<User | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/admin/users')
      .then((res) => (res.ok ? res.json() : null))
      .then(() => {
        if (isMounted) setLoadingUsers(false);
      })
      .catch(() => {
        if (isMounted) setLoadingUsers(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // If a user is selected for detailed management, show UserDetailView
  if (selectedUserId) {
    return (
      <UserDetailView
        userId={selectedUserId}
        onBack={() => setSelectedUserId(null)}
      />
    );
  }

  if (loadingUsers) {
    return <UsersSkeleton />;
  }

  // Filter users
  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.accountNumber.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    const matchesTier = tierFilter === 'all' || user.tier === tierFilter;

    return matchesSearch && matchesStatus && matchesTier;
  });

  const totalActiveUsers = users.filter((u) => u.status === 'active').length;
  const totalSuspendedUsers = users.filter((u) => u.status === 'suspended').length;
  const avgBalance = users.length > 0 ? users.reduce((acc, u) => acc + u.balance, 0) / users.length : 0;

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header & Metrics */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-white">
            Customer Directory & Vault Accounts
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            View, edit, suspend, or upgrade Crestline Capital user accounts
          </p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all flex items-center space-x-2 self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Add New Customer</span>
        </button>
      </div>

      {/* Mini Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-400 font-medium">Total Accounts</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">{users.length}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-emerald-600 dark:text-emerald-400 font-medium">Active Accounts</span>
          <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300 mt-0.5">{totalActiveUsers}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-rose-600 dark:text-rose-400 font-medium">Suspended</span>
          <p className="text-lg font-bold text-rose-700 dark:text-rose-300 mt-0.5">{totalSuspendedUsers}</p>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-2xs">
          <span className="text-slate-400 font-medium">Average Balance</span>
          <p className="text-lg font-bold text-slate-900 dark:text-white mt-0.5">
            ${avgBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}
          </p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-100 dark:border-slate-800 shadow-2xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or account #..."
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
              <option value="active">Active Only</option>
              <option value="suspended">Suspended Only</option>
            </select>
          </div>

          <div className="flex items-center space-x-1.5 flex-1 md:flex-none">
            <span className="text-slate-500 font-semibold">Tier:</span>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white font-medium"
            >
              <option value="all">All Tiers</option>
              <option value="VIP">VIP</option>
              <option value="Business">Business</option>
              <option value="Premium">Premium</option>
              <option value="Standard">Standard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Users DataTable */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 uppercase font-semibold text-[10px] tracking-wider border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="py-3.5 px-6">Customer Name</th>
                <th className="py-3.5 px-6">Email Address</th>
                <th className="py-3.5 px-6">Account #</th>
                <th className="py-3.5 px-6">Tier</th>
                <th className="py-3.5 px-6">Balance (USD)</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-300">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center space-x-3">
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
                        />
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{user.name}</p>
                          <p className="text-[10px] text-slate-400">Joined {user.joinedDate}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 font-medium text-slate-600 dark:text-slate-300">
                      {user.email}
                    </td>
                    <td className="py-4 px-6 font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {user.accountNumber}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={user.tier} type="tier" />
                    </td>
                    <td className="py-4 px-6 font-bold text-slate-900 dark:text-white text-sm">
                      ${user.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="py-4 px-6">
                      <StatusBadge status={user.status} />
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setSelectedUserId(user.id)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-1 shadow-xs"
                          title="Open Full Management Panel"
                        >
                          <Settings2 className="w-3.5 h-3.5" />
                          <span>Manage</span>
                        </button>

                        <button
                          onClick={() => setUserToInspect(user)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="View Quick Dossier"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => setUserToEdit(user)}
                          className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                          title="Edit User & Balance"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {user.status === 'active' ? (
                          <button
                            onClick={() => setUserToSuspend(user)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
                            title="Suspend Account"
                          >
                            <UserX className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => activateUser(user.id)}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50 rounded-lg transition-colors"
                            title="Reactivate Account"
                          >
                            <UserCheck className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 px-6">
                    <EmptyState
                      title="No Customers Found"
                      description={`We couldn't find any customer accounts matching "${searchTerm || statusFilter !== 'all' ? searchTerm || statusFilter : tierFilter}". Try adjusting your query or filter selections.`}
                      icon={Users}
                      onAction={() => {
                        setSearchTerm('');
                        setStatusFilter('all');
                        setTierFilter('all');
                      }}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirmation Modal for Suspending Users */}
      <ConfirmModal
        isOpen={!!userToSuspend}
        onClose={() => setUserToSuspend(null)}
        onConfirm={() => {
          if (userToSuspend) {
            suspendUser(userToSuspend.id);
            setUserToSuspend(null);
          }
        }}
        title={`Suspend Account: ${userToSuspend?.name}`}
        description={`Are you sure you want to suspend account #${userToSuspend?.accountNumber}? This critical operation will immediately block all banking activities, virtual debit cards, and wire transfer capabilities for this customer.`}
        confirmText="Suspend Customer Account"
        cancelText="Keep Active"
        variant="danger"
        icon={UserX}
      />

      {/* User Create / Edit Modal */}
      <UserModal
        isOpen={isCreateModalOpen || !!userToEdit}
        onClose={() => {
          setIsCreateModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
      />

      {/* Detailed User File Modal */}
      <Modal
        isOpen={!!userToInspect}
        onClose={() => setUserToInspect(null)}
        title={userToInspect ? `Customer Dossier: ${userToInspect.name}` : ''}
        subtitle="Full banking portfolio, issued cards, and risk profile"
      >
        {userToInspect && (
          <div className="space-y-6 text-xs">
            <div className="flex items-center space-x-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
              <img
                src={userToInspect.avatar}
                alt={userToInspect.name}
                className="w-14 h-14 rounded-full object-cover ring-2 ring-blue-500/30"
              />
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {userToInspect.name}
                  </h3>
                  <StatusBadge status={userToInspect.tier} type="tier" />
                  <StatusBadge status={userToInspect.status} />
                </div>
                <p className="text-slate-500 font-mono">{userToInspect.email} • {userToInspect.phone}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-400 font-medium">Vault Account #</span>
                <p className="font-mono font-bold text-sm text-slate-900 dark:text-white mt-1">
                  {userToInspect.accountNumber}
                </p>
              </div>
              <div className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
                <span className="text-slate-400 font-medium">Liquid Balance</span>
                <p className="font-bold text-sm text-emerald-600 dark:text-emerald-400 mt-1">
                  ${userToInspect.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* User Cards Section */}
            <div>
              <h4 className="font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-1.5">
                <CreditCard className="w-4 h-4 text-blue-600" /> Associated Virtual Cards
              </h4>
              <div className="space-y-2">
                {cards.filter((c) => c.userId === userToInspect.id).length > 0 ? (
                  cards
                    .filter((c) => c.userId === userToInspect.id)
                    .map((c) => (
                      <div
                        key={c.id}
                        className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40"
                      >
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">{c.cardType}</p>
                          <p className="font-mono text-slate-500 text-[11px]">{c.maskedNumber}</p>
                        </div>
                        <StatusBadge status={c.status} />
                      </div>
                    ))
                ) : (
                  <p className="text-slate-400 italic">No virtual cards issued for this user.</p>
                )}
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end space-x-2">
              <button
                onClick={() => {
                  const u = userToInspect;
                  setUserToInspect(null);
                  setUserToEdit(u);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
              >
                Edit Balance & Profile
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
