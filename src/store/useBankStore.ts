import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { BankUser, BankAccount, BankTransaction, BankNotification, TransactionReceipt, BankCard } from '../types/banking';

export type CustomerView = 
  | 'dashboard'
  | 'transfer'
  | 'deposit'
  | 'withdraw'
  | 'cards'
  | 'transactions'
  | 'accounts'
  | 'statements'
  | 'security';

interface BankStore {
  user: BankUser | null;
  token: string | null;
  accounts: BankAccount[];
  activeAccountId: string | null;
  transactions: BankTransaction[];
  notifications: BankNotification[];
  cards: BankCard[];
  unreadCount: number;
  isLoading: boolean;
  activeView: CustomerView;
  portalMode: 'landing' | 'customer' | 'admin';
  authModalOpen: boolean;
  authModalTab: 'login' | 'register' | 'forgot';
  selectedReceipt: TransactionReceipt | null;
  toast: { message: string; type: 'success' | 'error' | 'info' } | null;

  // Actions
  setActiveView: (view: CustomerView) => void;
  setPortalMode: (mode: 'landing' | 'customer' | 'admin') => void;
  setActiveAccountId: (id: string | null) => void;
  setAuthModalOpen: (open: boolean, tab?: 'login' | 'register' | 'forgot') => void;
  setSelectedReceipt: (receipt: TransactionReceipt | null) => void;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;
  clearToast: () => void;

  // API Methods
  login: (email: string, pass: string) => Promise<boolean>;
  register: (data: any) => Promise<boolean>;
  logout: () => Promise<void>;
  quickDemoLogin: (email: string) => Promise<boolean>;
  fetchMe: () => Promise<void>;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (params?: Record<string, any>) => Promise<void>;
  fetchNotifications: () => Promise<void>;
  fetchCards: () => Promise<void>;
  toggleCardFreeze: (id: string) => Promise<boolean>;
  updateCardSettings: (id: string, settings: Partial<BankCard>) => Promise<boolean>;
  issueCard: (accountId: string, cardType?: string, cardTier?: string) => Promise<boolean>;
  requestOtp: (actionType: 'TRANSFER' | 'WITHDRAWAL', payload?: any) => Promise<{ success: boolean; code?: string; maskedEmail?: string; error?: string }>;
  markNotificationRead: (id: string) => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  viewReceipt: (transactionId: string) => Promise<void>;
}

export const useBankStore = create<BankStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      accounts: [],
      activeAccountId: null,
      transactions: [],
      notifications: [],
      cards: [],
      unreadCount: 0,
      isLoading: false,
      activeView: 'dashboard',
      portalMode: 'landing',
      authModalOpen: false,
      authModalTab: 'login',
      selectedReceipt: null,
      toast: null,

      setActiveView: (view) => set({ activeView: view }),
      setPortalMode: (mode) => set({ portalMode: mode }),
      setActiveAccountId: (id) => set({ activeAccountId: id }),
      setAuthModalOpen: (open, tab = 'login') => set({ authModalOpen: open, authModalTab: tab }),
      setSelectedReceipt: (receipt) => set({ selectedReceipt: receipt }),

      showToast: (message, type = 'info') => {
        set({ toast: { message, type } });
        setTimeout(() => {
          const current = get().toast;
          if (current?.message === message) set({ toast: null });
        }, 4000);
      },
      clearToast: () => set({ toast: null }),

      login: async (email, password) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            get().showToast(data.error || 'Failed to sign in', 'error');
            set({ isLoading: false });
            return false;
          }

          const userObj: BankUser = {
            ...data.user,
            transferBlocked: data.user.transfer_blocked === 1 || data.user.transferBlocked,
            withdrawalBlocked: data.user.withdrawal_blocked === 1 || data.user.withdrawalBlocked,
            blockMessage: data.user.block_message || data.user.blockMessage
          };

          set({
            user: userObj,
            token: data.token,
            accounts: data.accounts || [],
            activeAccountId: data.accounts?.[0]?.id || null,
            portalMode: 'customer',
            authModalOpen: false,
            isLoading: false
          });

          // Check if user is an administrator and user intended admin view
          if (['Super Administrator', 'Administrator', 'Compliance Officer'].includes(data.user.role)) {
            if (window.location.pathname.startsWith('/admin')) {
              set({ portalMode: 'admin' });
            }
          }

          get().showToast(`Welcome back, ${data.user.firstName}!`, 'success');
          get().fetchNotifications();
          get().fetchTransactions();
          get().fetchCards();
          return true;
        } catch (err: any) {
          get().showToast(err.message || 'Network connection failed', 'error');
          set({ isLoading: false });
          return false;
        }
      },

      register: async (formData) => {
        set({ isLoading: true });
        try {
          const res = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
          });
          const data = await res.json();
          if (!res.ok || !data.success) {
            get().showToast(data.error || 'Registration failed', 'error');
            set({ isLoading: false });
            return false;
          }

          set({
            user: data.user,
            token: data.token,
            accounts: data.account ? [data.account] : [],
            activeAccountId: data.account?.id || null,
            portalMode: 'customer',
            authModalOpen: false,
            isLoading: false
          });

          get().showToast(`Account created! Welcome to Crestline Capital, ${data.user.firstName}.`, 'success');
          get().fetchNotifications();
          get().fetchCards();
          return true;
        } catch (err: any) {
          get().showToast(err.message || 'Registration failed', 'error');
          set({ isLoading: false });
          return false;
        }
      },

      quickDemoLogin: async (email) => {
        return get().login(email, 'Crestline2026!');
      },

      logout: async () => {
        const { token } = get();
        if (token) {
          try {
            await fetch('/api/auth/logout', {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
          } catch (_) {}
        }
        set({
          user: null,
          token: null,
          accounts: [],
          activeAccountId: null,
          transactions: [],
          notifications: [],
          cards: [],
          unreadCount: 0,
          portalMode: 'landing',
          activeView: 'dashboard'
        });
        get().showToast('You have been signed out securely.', 'info');
      },

      fetchMe: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (res.status === 401) {
            set({ user: null, token: null });
            return;
          }
          const data = await res.json();
          if (data.success && data.user) {
            const userObj: BankUser = {
              ...data.user,
              transferBlocked: data.user.transfer_blocked === 1 || data.user.transferBlocked,
              withdrawalBlocked: data.user.withdrawal_blocked === 1 || data.user.withdrawalBlocked,
              blockMessage: data.user.block_message || data.user.blockMessage
            };

            set({
              user: userObj,
              accounts: data.accounts || [],
              activeAccountId: get().activeAccountId || data.accounts?.[0]?.id || null,
              unreadCount: data.unreadNotificationsCount || 0
            });
          }
        } catch (_) {}
      },

      fetchAccounts: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await fetch('/api/accounts', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            set({
              accounts: data.accounts || [],
              activeAccountId: get().activeAccountId || data.accounts?.[0]?.id || null
            });
          }
        } catch (_) {}
      },

      fetchTransactions: async (params = {}) => {
        const { token } = get();
        if (!token) return;

        try {
          const query = new URLSearchParams(params).toString();
          const res = await fetch(`/api/transactions?${query}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            set({ transactions: data.transactions || [] });
          }
        } catch (_) {}
      },

      fetchCards: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await fetch('/api/cards', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            set({ cards: data.cards || [] });
          }
        } catch (_) {}
      },

      toggleCardFreeze: async (id: string) => {
        const { token } = get();
        if (!token) return false;

        try {
          const res = await fetch(`/api/cards/${id}/toggle-freeze`, {
            method: 'PATCH',
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            set((state) => ({
              cards: state.cards.map((c) => (c.id === id ? { ...c, status: data.status } : c))
            }));
            get().showToast(data.message, 'success');
            return true;
          }
          get().showToast(data.error || 'Failed to update card status', 'error');
          return false;
        } catch (err: any) {
          get().showToast('Network connection failed', 'error');
          return false;
        }
      },

      updateCardSettings: async (id: string, settings: Partial<BankCard>) => {
        const { token } = get();
        if (!token) return false;

        try {
          const res = await fetch(`/api/cards/${id}/settings`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(settings)
          });
          const data = await res.json();
          if (data.success) {
            get().fetchCards();
            get().showToast('Card preferences updated successfully', 'success');
            return true;
          }
          get().showToast(data.error || 'Failed to update card settings', 'error');
          return false;
        } catch (_) {
          return false;
        }
      },

      issueCard: async (accountId: string, cardType = 'VIRTUAL', cardTier = 'Obsidian Elite') => {
        const { token } = get();
        if (!token) return false;

        try {
          const res = await fetch('/api/cards', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ accountId, cardType, cardTier })
          });
          const data = await res.json();
          if (data.success) {
            get().fetchCards();
            get().showToast(`New ${cardTier} ${cardType.toLowerCase()} card issued successfully!`, 'success');
            return true;
          }
          get().showToast(data.error || 'Card issuance failed', 'error');
          return false;
        } catch (err: any) {
          get().showToast(err.message || 'Failed to issue card', 'error');
          return false;
        }
      },

      requestOtp: async (actionType: 'TRANSFER' | 'WITHDRAWAL', payload?: any) => {
        const { token } = get();
        if (!token) return { success: false, error: 'Unauthorized session' };

        try {
          const res = await fetch('/api/security/request-otp', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ actionType, payload })
          });
          const data = await res.json();
          if (data.success) {
            get().fetchNotifications();
            return { success: true, code: data.code, maskedEmail: data.maskedEmail };
          }
          return { success: false, error: data.error || 'Failed to send security code' };
        } catch (err: any) {
          return { success: false, error: 'Network error generating security code' };
        }
      },

      fetchNotifications: async () => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await fetch('/api/notifications', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success) {
            set({
              notifications: data.notifications || [],
              unreadCount: data.unreadCount || 0
            });
          }
        } catch (_) {}
      },

      markNotificationRead: async (id) => {
        const { token } = get();
        if (!token) return;

        try {
          await fetch(`/api/notifications/${id}/read`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          set((state) => ({
            notifications: state.notifications.map((n) => (n.id === id ? { ...n, read: 1 } : n)),
            unreadCount: Math.max(0, state.unreadCount - 1)
          }));
        } catch (_) {}
      },

      markAllNotificationsRead: async () => {
        const { token } = get();
        if (!token) return;

        try {
          await fetch('/api/notifications/read-all', {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, read: 1 })),
            unreadCount: 0
          }));
        } catch (_) {}
      },

      viewReceipt: async (transactionId) => {
        const { token } = get();
        if (!token) return;

        try {
          const res = await fetch(`/api/transactions/${transactionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          const data = await res.json();
          if (data.success && data.receipt) {
            set({ selectedReceipt: data.receipt });
          }
        } catch (err: any) {
          get().showToast('Could not retrieve transaction receipt', 'error');
        }
      }
    }),
    {
      name: 'crestline_bank_session',
      partialize: (state) => ({
        token: state.token,
        portalMode: state.portalMode,
        activeView: state.activeView
      })
    }
  )
);
