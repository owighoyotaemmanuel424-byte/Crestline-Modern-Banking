import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Transaction, VirtualCard, AdminNotification, ActiveTab, Lead, LeadStatus } from '../types/admin';
import { INITIAL_USERS, INITIAL_TRANSACTIONS, INITIAL_CARDS, INITIAL_NOTIFICATIONS, INITIAL_ADMIN_PROFILE } from '../data/mockData';

interface AdminStore {
  users: User[];
  transactions: Transaction[];
  cards: VirtualCard[];
  leads: Lead[];
  notifications: AdminNotification[];
  adminProfile: typeof INITIAL_ADMIN_PROFILE;
  activeTab: ActiveTab;
  selectedUserId: string | null;
  theme: 'light' | 'dark';
  searchQuery: string;
  toastMessage: { text: string; type: 'success' | 'info' | 'error' } | null;
  isAdminAuthenticated: boolean;
  adminToken: string | null;

  // Actions
  adminLogin: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  adminGatekeeperLogin: (masterKey: string) => Promise<{ success: boolean; error?: string }>;
  adminLogout: () => Promise<void>;
  setActiveTab: (tab: ActiveTab) => void;
  setSelectedUserId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  toggleTheme: () => void;
  setToast: (text: string, type?: 'success' | 'info' | 'error') => void;
  clearToast: () => void;

  // Lead actions
  addLead: (lead: Omit<Lead, 'id' | 'createdAt'>) => void;
  deleteLead: (id: string) => void;
  updateLeadStatus: (id: string, status: LeadStatus) => void;
  clearLeads: () => void;
  seedSampleLeads: () => void;

  // User actions
  addUser: (user: Omit<User, 'id' | 'joinedDate'>) => void;
  updateUser: (id: string, updatedData: Partial<User>) => void;
  suspendUser: (id: string) => void;
  activateUser: (id: string) => void;
  rotateAccountNumber: (userId: string) => void;
  adjustUserBalance: (userId: string, amount: number, isCredit: boolean, note?: string) => void;
  setUserRestrictions: (userId: string, transferBlocked: boolean, withdrawalBlocked: boolean, blockMessage: string) => Promise<boolean>;
  resetUserPin: (userId: string) => void;
  toggleForcePinCheck: (userId: string) => void;
  updateRestrictedMessages: (userId: string, messages: { inactive?: string; onHold?: string; suspended?: string; blocked?: string }) => void;
  injectManualTransaction: (userId: string, txnData: { direction: 'credit' | 'debit'; amount: number; label: string; date?: string; affectBalance: boolean }) => void;

  // Transaction actions
  approveTransaction: (id: string) => void;
  rejectTransaction: (id: string) => void;
  addTransaction: (transaction: Omit<Transaction, 'id' | 'timestamp'>) => void;

  // Card actions
  toggleCardStatus: (id: string) => void;
  deleteCard: (id: string) => void;
  issueCard: (card: Omit<VirtualCard, 'id' | 'createdAt'>) => void;

  // Notification actions
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;

  // Production data management & reset helpers
  purgeDemoData: () => Promise<{ success: boolean; message?: string; stats?: any; error?: string }>;
  resetToMockData: () => void;
}

const isProduction = import.meta.env.PROD;

export const useAdminStore = create<AdminStore>()(
  persist(
    (set, get) => ({
      users: isProduction ? [] : INITIAL_USERS,
      transactions: isProduction ? [] : INITIAL_TRANSACTIONS,
      cards: isProduction ? [] : INITIAL_CARDS,
      leads: [],
      notifications: isProduction ? [] : INITIAL_NOTIFICATIONS,
      adminProfile: INITIAL_ADMIN_PROFILE,
      activeTab: 'dashboard',
      selectedUserId: null,
      theme: 'dark',
      searchQuery: '',
      toastMessage: null,
      isAdminAuthenticated: false,
      adminToken: null,

      adminLogin: async (email, password) => {
        try {
          const res = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (typeof document !== 'undefined' && data.token) {
              document.cookie = `crestline_session=${data.token}; path=/; SameSite=Lax; max-age=604800`;
            }
            set({
              isAdminAuthenticated: true,
              adminToken: data.token,
              adminProfile: {
                name: data.user.name || `${data.user.firstName} ${data.user.lastName}`,
                email: data.user.email,
                role: data.user.role || 'Super Administrator',
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                lastLogin: "Active Now",
                twoFactorEnabled: true,
              }
            });
            get().setToast(`Clearance Granted: Welcome, ${data.user.name || data.user.firstName}!`, 'success');
            return { success: true };
          } else {
            return { success: false, error: data.error || 'Invalid administrator email or password' };
          }
        } catch (err: any) {
          return { success: false, error: 'Administrative authentication service unavailable.' };
        }
      },

      adminGatekeeperLogin: async (masterKey) => {
        try {
          const res = await fetch('/api/admin/gatekeeper-login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ masterKey })
          });
          const data = await res.json();
          if (res.ok && data.success) {
            if (typeof document !== 'undefined' && data.token) {
              document.cookie = `crestline_session=${data.token}; path=/; SameSite=Lax; max-age=604800`;
            }
            set({
              isAdminAuthenticated: true,
              adminToken: data.token,
              adminProfile: {
                name: data.user.name || `${data.user.firstName} ${data.user.lastName}`,
                email: data.user.email,
                role: data.user.role || 'Super Administrator',
                avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
                lastLogin: "Active Now",
                twoFactorEnabled: true,
              }
            });
            get().setToast('192-bit Master Gatekeeper Verified: Super Administrator Clearance Granted', 'success');
            return { success: true };
          } else {
            return { success: false, error: data.error || 'Master token authorization rejected' };
          }
        } catch (err: any) {
          return { success: false, error: err.message || 'Gatekeeper verification failed' };
        }
      },

      adminLogout: async () => {
        const token = get().adminToken;
        if (typeof document !== 'undefined') {
          document.cookie = 'crestline_session=; path=/; SameSite=Lax; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        }
        if (token) {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` }
            });
          } catch (_) {}
        }
        set({
          isAdminAuthenticated: false,
          adminToken: null
        });
        get().setToast('Administrative console locked safely.', 'info');
      },

      setActiveTab: (tab) => set({ activeTab: tab }),
      setSelectedUserId: (id) => set({ selectedUserId: id }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),

      setToast: (text, type = 'success') => {
        set({ toastMessage: { text, type } });
        setTimeout(() => {
          if (get().toastMessage?.text === text) {
            set({ toastMessage: null });
          }
        }, 4000);
      },
      clearToast: () => set({ toastMessage: null }),

      // LEAD ACTIONS
      addLead: (leadData) => {
        const newLead: Lead = {
          ...leadData,
          id: `lead-${Date.now().toString().slice(-5)}`,
          createdAt: new Date().toISOString().split('T')[0],
        };
        set((state) => ({
          leads: [newLead, ...state.leads],
        }));
        get().setToast(`Lead ${newLead.name} created successfully!`, 'success');
      },

      deleteLead: (id) => {
        const target = get().leads.find((l) => l.id === id);
        set((state) => ({
          leads: state.leads.filter((l) => l.id !== id),
        }));
        if (target) {
          get().setToast(`Lead ${target.name} removed.`, 'info');
        }
      },

      updateLeadStatus: (id, status) => {
        set((state) => ({
          leads: state.leads.map((l) => (l.id === id ? { ...l, status } : l)),
        }));
        get().setToast(`Lead status updated to ${status}.`, 'success');
      },

      clearLeads: () => {
        set({ leads: [] });
        get().setToast('All leads cleared.', 'info');
      },

      seedSampleLeads: () => {
        const samples: Lead[] = [
          {
            id: 'lead-1001',
            name: 'Alexander Wright',
            email: 'a.wright@vortex-capital.com',
            phone: '+1 (555) 234-8901',
            company: 'Vortex Capital Group',
            status: 'Qualified',
            value: 250000,
            source: 'Inbound Web Form',
            createdAt: '2026-08-04',
            notes: 'Interested in VIP tier corporate multi-currency treasury account.'
          },
          {
            id: 'lead-1002',
            name: 'Sophia Martinez',
            email: 'smartinez@lumina-tech.io',
            phone: '+1 (555) 876-5432',
            company: 'Lumina Tech Inc',
            status: 'Proposal',
            value: 120000,
            source: 'Partner Referral',
            createdAt: '2026-08-02',
            notes: 'Requested automated payout API demo and virtual card issuing capabilities.'
          },
          {
            id: 'lead-1003',
            name: 'Marcus Vance',
            email: 'm.vance@apexholdings.org',
            phone: '+44 20 7946 0912',
            company: 'Apex Holdings UK',
            status: 'New',
            value: 500000,
            source: 'LinkedIn Direct',
            createdAt: '2026-08-05',
            notes: 'High net worth investor seeking customized liquidity yield pools.'
          }
        ];
        set({ leads: samples });
        get().setToast('Sample leads populated.', 'success');
      },

      // USER ACTIONS
      addUser: (userData) => {
        const newUser: User = {
          ...userData,
          id: `usr-${Date.now().toString().slice(-4)}`,
          accountState: 'Active',
          kycStatus: userData.kycVerified ? 'verified' : 'unverified',
          emailVerified: true,
          twoFactorEnabled: false,
          joinedDate: new Date().toISOString().split('T')[0],
          lastLogin: 'Just now',
          transactionPinSet: true,
          forcePinNextLogin: false
        };
        set((state) => ({
          users: [newUser, ...state.users],
        }));
        get().setToast(`User ${newUser.name} created successfully!`, 'success');
      },

      updateUser: (id, updatedData) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updatedData } : u)),
        }));
        get().setToast('User profile updated successfully.', 'success');
      },

      suspendUser: (id) => {
        const user = get().users.find((u) => u.id === id);
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, status: 'suspended', accountState: 'Suspended' } : u)),
        }));
        if (user) {
          get().setToast(`Account ${user.name} has been suspended.`, 'info');
        }
      },

      activateUser: (id) => {
        const user = get().users.find((u) => u.id === id);
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, status: 'active', accountState: 'Active' } : u)),
        }));
        if (user) {
          get().setToast(`Account ${user.name} activated.`, 'success');
        }
      },

      rotateAccountNumber: (userId) => {
        const newAccNum = `ACC-${Math.floor(10000000 + Math.random() * 90000000)}`;
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, accountNumber: newAccNum } : u)),
        }));
        get().setToast(`New Account # ${newAccNum} generated successfully!`, 'success');
      },

      adjustUserBalance: (userId, amount, isCredit, note) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user) return;

        const delta = isCredit ? amount : -amount;
        const newBalance = Math.max(0, user.balance + delta);

        const newTxn: Transaction = {
          id: `ADJ-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userAvatar: user.avatar,
          accountNumber: user.accountNumber,
          amount: amount,
          type: isCredit ? 'Credit' : 'Debit',
          status: 'Completed',
          category: 'Manual Admin Adjustment',
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
          merchantOrSender: 'Crestline Admin Desk',
          referenceCode: `MAN-ADJ-${Date.now().toString().slice(-6)}`,
          riskScore: 'Low',
          isDisplayOnly: false,
          note: note || (isCredit ? 'Manual credit adjustment' : 'Manual debit adjustment')
        };

        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, balance: newBalance } : u)),
          transactions: [newTxn, ...state.transactions],
        }));

        // Attempt server-side ledger adjustment if backend account is accessible
        try {
          const adminToken = get().adminToken;
          const authRaw = localStorage.getItem('crestline_bank_session');
          const token = adminToken || (authRaw ? JSON.parse(authRaw)?.state?.token : null);
          if (token) {
            fetch(`/api/admin/accounts/${user.accountNumber}/adjust-balance`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                amountCents: Math.round(amount * 100),
                adjustmentType: isCredit ? 'CREDIT' : 'DEBIT',
                note: note || (isCredit ? 'Administrative balance credit' : 'Administrative balance deduction')
              })
            }).catch(() => {});
          }
        } catch (_) {}

        get().setToast(
          `Balance updated to $${newBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD.`,
          'success'
        );
      },

      setUserRestrictions: async (userId, transferBlocked, withdrawalBlocked, blockMessage) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  transferBlocked,
                  withdrawalBlocked,
                  blockMessage,
                  customRestrictedMessages: {
                    ...u.customRestrictedMessages,
                    blocked: blockMessage
                  }
                }
              : u
          )
        }));

        try {
          const adminToken = get().adminToken;
          const authRaw = localStorage.getItem('crestline_bank_session');
          const token = adminToken || (authRaw ? JSON.parse(authRaw)?.state?.token : null);
          if (token) {
            const res = await fetch(`/api/admin/customers/${userId}/restrictions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
              },
              body: JSON.stringify({
                transferBlocked,
                withdrawalBlocked,
                blockMessage
              })
            });
            const data = await res.json();
            if (data.success) {
              get().setToast(data.message || 'Restrictions saved to banking database.', 'success');
              return true;
            }
          }
        } catch (_) {}

        get().setToast('Transactional restrictions updated.', 'success');
        return true;
      },

      resetUserPin: (userId) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === userId ? { ...u, transactionPinSet: false, forcePinNextLogin: true } : u)),
        }));
        get().setToast('Transaction PIN cleared. Force PIN check enabled for next login.', 'info');
      },

      toggleForcePinCheck: (userId) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId ? { ...u, forcePinNextLogin: !u.forcePinNextLogin } : u
          ),
        }));
        get().setToast('Security PIN check setting toggled.', 'info');
      },

      updateRestrictedMessages: (userId, messages) => {
        set((state) => ({
          users: state.users.map((u) =>
            u.id === userId
              ? {
                  ...u,
                  customRestrictedMessages: {
                    ...u.customRestrictedMessages,
                    ...messages,
                  },
                }
              : u
          ),
        }));
        get().setToast('Restricted state notice messages saved successfully.', 'success');
      },

      injectManualTransaction: (userId, txnData) => {
        const user = get().users.find((u) => u.id === userId);
        if (!user) return;

        const newTxn: Transaction = {
          id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          userAvatar: user.avatar,
          accountNumber: user.accountNumber,
          amount: txnData.amount,
          type: txnData.direction === 'credit' ? 'Credit' : 'Debit',
          status: 'Completed',
          category: 'Manual Ledger Entry',
          timestamp: txnData.date || new Date().toISOString().replace('T', ' ').slice(0, 16),
          merchantOrSender: txnData.label || 'Direct Ledger Entry',
          referenceCode: `INJ-${Date.now().toString().slice(-6)}`,
          riskScore: 'Low',
          isDisplayOnly: !txnData.affectBalance,
          note: txnData.label
        };

        let updatedUsers = get().users;
        if (txnData.affectBalance) {
          const delta = txnData.direction === 'credit' ? txnData.amount : -txnData.amount;
          updatedUsers = updatedUsers.map((u) =>
            u.id === userId ? { ...u, balance: Math.max(0, u.balance + delta) } : u
          );
        }

        set((state) => ({
          users: updatedUsers,
          transactions: [newTxn, ...state.transactions],
        }));

        get().setToast(
          `Transaction entry injected ${txnData.affectBalance ? '(Balance updated)' : '(Display only)'}`,
          'success'
        );
      },

      // TRANSACTION ACTIONS
      approveTransaction: (id) => {
        const txn = get().transactions.find((t) => t.id === id);
        if (!txn) return;

        set((state) => {
          const updatedTxns = state.transactions.map((t) =>
            t.id === id ? { ...t, status: 'Completed' as const } : t
          );

          const updatedUsers = state.users.map((u) => {
            if (u.id === txn.userId) {
              const delta = txn.type === 'Credit' || txn.type === 'Wire Transfer' ? txn.amount : -txn.amount;
              return { ...u, balance: Math.max(0, u.balance + delta) };
            }
            return u;
          });

          return {
            transactions: updatedTxns,
            users: updatedUsers,
          };
        });

        get().setToast(`Transaction ${txn.id} ($${txn.amount.toLocaleString()}) approved!`, 'success');
      },

      rejectTransaction: (id) => {
        const txn = get().transactions.find((t) => t.id === id);
        if (!txn) return;

        set((state) => ({
          transactions: state.transactions.map((t) =>
            t.id === id ? { ...t, status: 'Rejected' as const } : t
          ),
        }));

        get().setToast(`Transaction ${txn.id} rejected.`, 'error');
      },

      addTransaction: (txnData) => {
        const newTxn: Transaction = {
          ...txnData,
          id: `TXN-${Math.floor(10000 + Math.random() * 90000)}`,
          timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
        };

        set((state) => ({
          transactions: [newTxn, ...state.transactions],
        }));

        get().setToast(`New transaction ${newTxn.id} logged.`, 'info');
      },

      // CARD ACTIONS
      toggleCardStatus: (id) => {
        const card = get().cards.find((c) => c.id === id);
        if (!card) return;

        const nextStatus = card.status === 'Active' ? 'Frozen' : 'Active';
        set((state) => ({
          cards: state.cards.map((c) => (c.id === id ? { ...c, status: nextStatus } : c)),
        }));

        get().setToast(`Virtual Card ending in ${card.maskedNumber.slice(-4)} is now ${nextStatus.toLowerCase()}.`, 'info');
      },

      deleteCard: (id) => {
        const card = get().cards.find((c) => c.id === id);
        set((state) => ({
          cards: state.cards.filter((c) => c.id !== id),
        }));
        if (card) {
          get().setToast(`Card ending in ${card.maskedNumber.slice(-4)} permanently deleted.`, 'error');
        }
      },

      issueCard: (cardData) => {
        const newCard: VirtualCard = {
          ...cardData,
          id: `crd-${Date.now().toString().slice(-4)}`,
          createdAt: new Date().toISOString().split('T')[0],
        };

        set((state) => ({
          cards: [newCard, ...state.cards],
        }));

        get().setToast(`New ${newCard.cardType} issued to ${newCard.userName}!`, 'success');
      },

      // NOTIFICATIONS
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        }));
      },

      clearNotifications: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
        get().setToast('All notifications marked as read.', 'info');
      },

      purgeDemoData: async () => {
        try {
          const res = await fetch('/api/admin/purge-demo-data', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: get().adminToken ? `Bearer ${get().adminToken}` : ''
            }
          });
          const data = await res.json();
          if (res.ok && data.success) {
            set({
              users: [],
              transactions: [],
              cards: [],
              leads: [],
              notifications: []
            });
            get().setToast('All demo data permanently purged for production deployment.', 'success');
            return { success: true, message: data.message, stats: data.stats };
          } else {
            const err = data.error || 'Failed to purge demo data';
            get().setToast(err, 'error');
            return { success: false, error: err };
          }
        } catch (err: any) {
          const errMsg = err?.message || 'Network error purging demo data';
          get().setToast(errMsg, 'error');
          return { success: false, error: errMsg };
        }
      },

      resetToMockData: () => {
        if (import.meta.env.PROD) {
          get().setToast('Demo reset is disabled in production environment.', 'info');
          return;
        }
        set({
          users: INITIAL_USERS,
          transactions: INITIAL_TRANSACTIONS,
          cards: INITIAL_CARDS,
          notifications: INITIAL_NOTIFICATIONS,
          adminProfile: INITIAL_ADMIN_PROFILE,
        });
        get().setToast('System state reset to original mock data.', 'info');
      },
    }),
    {
      name: 'crestline-capital-admin-storage',
    }
  )
);
