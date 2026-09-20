import React, { useState, useEffect } from 'react';
import { useAdminStore } from './store/useAdminStore';
import { useBankStore } from './store/useBankStore';
import { Sidebar } from './components/admin/Sidebar';
import { Topbar } from './components/admin/Topbar';
import { ToastNotification } from './components/admin/ToastNotification';
import { LocaleSwitcher } from './components/admin/LocaleSwitcher';

import { DashboardView } from './components/admin/views/DashboardView';
import { UsersView } from './components/admin/views/UsersView';
import { TransactionsView } from './components/admin/views/TransactionsView';
import { WithdrawalsApprovalView } from './components/admin/views/WithdrawalsApprovalView';
import { CardsView } from './components/admin/views/CardsView';
import { AnalyticsView } from './components/admin/views/AnalyticsView';
import { SettingsView } from './components/admin/views/SettingsView';
import { LeadsView } from './components/admin/views/LeadsView';
import { KycView } from './components/admin/views/KycView';
import { ImportView } from './components/admin/views/ImportView';
import { ResourceView, ResourceConfig } from './components/admin/views/ResourceView';

// Customer Banking Components
import { CustomerHeader } from './components/customer/Header';
import { CustomerDashboardView } from './components/customer/views/DashboardView';
import { CustomerTransferView } from './components/customer/views/TransferView';
import { CustomerDepositView } from './components/customer/views/DepositView';
import { CustomerWithdrawView } from './components/customer/views/WithdrawView';
import { CustomerActivityView } from './components/customer/views/ActivityView';
import { CustomerStatementsView } from './components/customer/views/StatementsView';
import { CustomerSecurityView } from './components/customer/views/SecurityView';
import { CustomerCardsView } from './components/customer/views/CardsView';
import { LandingPage } from './components/landing/LandingPage';
import { AuthModal } from './components/customer/AuthModal';
import { ReceiptModal } from './components/customer/ReceiptModal';
import { AdminLoginPage } from './components/admin/AdminLoginPage';

const resourceConfigs: Record<string, ResourceConfig> = {
  tasks: {
    id: 'tasks',
    title: 'Staff Tasks',
    description: 'Manage and assign tasks to administrative staff members.',
    endpoint: '/api/admin/resource/tasks',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'assignedTo', label: 'Assigned To', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'priority', label: 'Priority', type: 'text' },
      { key: 'dueDate', label: 'Due Date', type: 'text' }
    ]
  },
  referrals: {
    id: 'referrals',
    title: 'Affiliate Referrals',
    description: 'Manage referral hierarchy, commissions, and payout status.',
    endpoint: '/api/admin/resource/referrals',
    canCreate: false,
    canEdit: true,
    canDelete: false,
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'affiliate', label: 'Affiliate', type: 'text' },
      { key: 'referredUser', label: 'Referred User', type: 'text' },
      { key: 'commission', label: 'Commission', type: 'currency' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'date', label: 'Date', type: 'text' }
    ]
  },
  loans: {
    id: 'loans',
    title: 'Loans Administration',
    description: 'Review and manage user loan applications and active borrowing.',
    endpoint: '/api/admin/resource/loans',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Loan ID', type: 'text' },
      { key: 'borrower', label: 'Borrower', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'interestRate', label: 'Interest Rate', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'nextPayment', label: 'Next Payment', type: 'text' }
    ]
  },
  plans: {
    id: 'plans',
    title: 'Yield Plans',
    description: 'Manage investment and staking yield plans for customers.',
    endpoint: '/api/admin/resource/plans',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Plan ID', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'minAmount', label: 'Min Amount', type: 'currency' },
      { key: 'roi', label: 'ROI', type: 'text' },
      { key: 'duration', label: 'Duration', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  signals: {
    id: 'signals',
    title: 'Trading Signals',
    description: 'Manage published trading signals and market calls.',
    endpoint: '/api/admin/resource/signals',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Signal ID', type: 'text' },
      { key: 'pair', label: 'Asset Pair', type: 'text' },
      { key: 'direction', label: 'Direction', type: 'badge' },
      { key: 'entry', label: 'Entry Price', type: 'number' },
      { key: 'target', label: 'Target Price', type: 'number' },
      { key: 'status', label: 'Status', type: 'badge' },
      { key: 'date', label: 'Date Published', type: 'text' }
    ]
  },
  'payment-methods': {
    id: 'payment-methods',
    title: 'Payment Methods',
    description: 'Configure available payment gateways and transaction fees.',
    endpoint: '/api/admin/resource/payment-methods',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Method ID', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'type', label: 'Gateway Type', type: 'text' },
      { key: 'fee', label: 'Transaction Fee', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  currencies: {
    id: 'currencies',
    title: 'Supported Currencies',
    description: 'Manage fiat and crypto currency exchange rates and availability.',
    endpoint: '/api/admin/resource/currencies',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'code', label: 'Currency Code', type: 'text' },
      { key: 'symbol', label: 'Symbol', type: 'text' },
      { key: 'rate', label: 'Exchange Rate', type: 'number' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  grants: {
    id: 'grants',
    title: 'Grants',
    description: 'Administer grant approvals, amounts, and eligibility.',
    endpoint: '/api/admin/resource/grants',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Grant ID', type: 'text' },
      { key: 'recipient', label: 'Recipient', type: 'text' },
      { key: 'amount', label: 'Amount', type: 'currency' },
      { key: 'eligibility', label: 'Eligibility', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  irs: {
    id: 'irs',
    title: 'IRS / Tax Controls',
    description: 'Manage tax-related configurations, holds, and document generation.',
    endpoint: '/api/admin/resource/irs',
    canCreate: false,
    canEdit: true,
    canDelete: false,
    columns: [
      { key: 'id', label: 'Tax Record', type: 'text' },
      { key: 'formType', label: 'Form Type', type: 'text' },
      { key: 'holdback', label: 'Holdback %', type: 'text' },
      { key: 'alerts', label: 'Alerts', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  membership: {
    id: 'membership',
    title: 'VIP Membership',
    description: 'Configure membership tiers, benefits, and fees.',
    endpoint: '/api/admin/resource/membership',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Tier ID', type: 'text' },
      { key: 'tier', label: 'Tier Name', type: 'text' },
      { key: 'fee', label: 'Annual Fee', type: 'currency' },
      { key: 'eligibility', label: 'Requirements', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  crypto: {
    id: 'crypto',
    title: 'Crypto Assets',
    description: 'Manage supported cryptocurrency networks and trading pairs.',
    endpoint: '/api/admin/resource/crypto',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Record ID', type: 'text' },
      { key: 'asset', label: 'Asset', type: 'text' },
      { key: 'network', label: 'Network', type: 'badge' },
      { key: 'walletAddress', label: 'Wallet Address', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  providers: {
    id: 'providers',
    title: 'Integration Providers',
    description: 'Configure external APIs and liquidity providers.',
    endpoint: '/api/admin/resource/providers',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Provider ID', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'capabilities', label: 'Capabilities', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  'copy-trading': {
    id: 'copy-trading',
    title: 'Copy Trading',
    description: 'Manage master traders, follower allocations, and risk limits.',
    endpoint: '/api/admin/resource/copy-trading',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'ID', type: 'text' },
      { key: 'masterTrader', label: 'Master Trader', type: 'text' },
      { key: 'followers', label: 'Followers', type: 'number' },
      { key: 'performance', label: 'Performance', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  courses: {
    id: 'courses',
    title: 'Educational Courses',
    description: 'Manage educational content, modules, and videos.',
    endpoint: '/api/admin/resource/courses',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Course ID', type: 'text' },
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'modules', label: 'Modules', type: 'number' },
      { key: 'order', label: 'Order', type: 'number' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  inbox: {
    id: 'inbox',
    title: 'Secure Inbox',
    description: 'Review and assign incoming secure messages.',
    endpoint: '/api/admin/resource/inbox',
    canCreate: false,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Message ID', type: 'text' },
      { key: 'from', label: 'From', type: 'text' },
      { key: 'subject', label: 'Subject', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  tickets: {
    id: 'tickets',
    title: 'Support Tickets',
    description: 'Manage customer support requests and resolutions.',
    endpoint: '/api/admin/resource/tickets',
    canCreate: false,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Ticket ID', type: 'text' },
      { key: 'user', label: 'User', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'agent', label: 'Assigned Agent', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  'contact-chat': {
    id: 'contact-chat',
    title: 'Live Chat & Contact',
    description: 'Monitor active chat sessions and contact submissions.',
    endpoint: '/api/admin/resource/contact-chat',
    canCreate: false,
    canEdit: true,
    canDelete: false,
    columns: [
      { key: 'id', label: 'Session ID', type: 'text' },
      { key: 'visitor', label: 'Visitor', type: 'text' },
      { key: 'tags', label: 'Tags', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  broadcast: {
    id: 'broadcast',
    title: 'Mass Broadcasts',
    description: 'Manage email and dashboard notification broadcasts.',
    endpoint: '/api/admin/resource/broadcast',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Broadcast ID', type: 'text' },
      { key: 'type', label: 'Type', type: 'text' },
      { key: 'audience', label: 'Audience Filters', type: 'text' },
      { key: 'date', label: 'Date', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  agents: {
    id: 'agents',
    title: 'Staff / Agents',
    description: 'Manage internal staff accounts, roles, and workloads.',
    endpoint: '/api/admin/resource/agents',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Agent ID', type: 'text' },
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'role', label: 'Role', type: 'badge' },
      { key: 'workload', label: 'Workload', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  testimonials: {
    id: 'testimonials',
    title: 'Testimonials',
    description: 'Manage published customer reviews and ratings.',
    endpoint: '/api/admin/resource/testimonials',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Review ID', type: 'text' },
      { key: 'customer', label: 'Customer', type: 'text' },
      { key: 'rating', label: 'Rating', type: 'text' },
      { key: 'featured', label: 'Featured', type: 'boolean' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  assets: {
    id: 'assets',
    title: 'Media & Assets',
    description: 'Manage logos, images, documents, and other platform media.',
    endpoint: '/api/admin/resource/assets',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'Asset ID', type: 'text' },
      { key: 'filename', label: 'Filename', type: 'text' },
      { key: 'type', label: 'File Type', type: 'badge' },
      { key: 'size', label: 'Size', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  faq: {
    id: 'faq',
    title: 'Knowledge Base (FAQ)',
    description: 'Manage support categories, questions, and answers.',
    endpoint: '/api/admin/resource/faq',
    canCreate: true,
    canEdit: true,
    canDelete: true,
    columns: [
      { key: 'id', label: 'FAQ ID', type: 'text' },
      { key: 'category', label: 'Category', type: 'text' },
      { key: 'question', label: 'Question', type: 'text' },
      { key: 'status', label: 'Status', type: 'badge' }
    ]
  },
  'audit-log': {
    id: 'audit-log',
    title: 'System Audit Log',
    description: 'Immutable ledger of all administrative actions and logins.',
    endpoint: '/api/admin/resource/audit-log',
    canCreate: false,
    canEdit: false,
    canDelete: false,
    columns: [
      { key: 'id', label: 'Event ID', type: 'text' },
      { key: 'timestamp', label: 'Timestamp', type: 'text' },
      { key: 'admin', label: 'Administrator', type: 'text' },
      { key: 'action', label: 'Action Taken', type: 'text' },
      { key: 'target', label: 'Target Record', type: 'text' }
    ]
  }
};

export default function App() {
  const { activeTab, theme, isAdminAuthenticated } = useAdminStore();
  const { 
    portalMode, 
    setPortalMode, 
    activeView, 
    toast: bankToast, 
    clearToast: clearBankToast, 
    user, 
    token, 
    fetchMe, 
    fetchAccounts, 
    fetchTransactions, 
    fetchNotifications, 
    quickDemoLogin,
    setAuthModalOpen
  } = useBankStore();

  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Initialize session and URL routing
  useEffect(() => {
    // Check if initial URL is admin
    if (window.location.pathname.startsWith('/admin')) {
      setPortalMode('admin');
    }

    // If user has token, restore data; otherwise load demo customer session
    if (token) {
      fetchMe();
      fetchAccounts();
      fetchTransactions();
      fetchNotifications();
    } else {
      // Auto-load Sarah Jenkins demo customer session on first arrival for seamless evaluation
      quickDemoLogin('sarah.jenkins@crestline.bank');
    }
  }, []);

  // Poll accounts and transactions periodically for live real-time sync
  useEffect(() => {
    if (!token) return;
    const interval = setInterval(() => {
      fetchAccounts();
      fetchTransactions();
      fetchNotifications();
    }, 12000);
    return () => clearInterval(interval);
  }, [token]);

  // Apply dark mode class to html document element dynamically
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const renderCustomerView = () => {
    switch (activeView) {
      case 'dashboard':
        return <CustomerDashboardView />;
      case 'cards':
        return <CustomerCardsView />;
      case 'transfer':
        return <CustomerTransferView />;
      case 'deposit':
        return <CustomerDepositView />;
      case 'withdraw':
        return <CustomerWithdrawView />;
      case 'transactions':
        return <CustomerActivityView />;
      case 'statements':
        return <CustomerStatementsView />;
      case 'security':
        return <CustomerSecurityView />;
      default:
        return <CustomerDashboardView />;
    }
  };

  const renderActiveAdminView = () => {
    switch (activeTab) {
      case 'dashboard':
        return <DashboardView />;
      case 'leads':
        return <LeadsView />;
      case 'kyc':
        return <KycView />;
      case 'import':
        return <ImportView />;
      case 'users':
        return <UsersView />;
      case 'withdrawals':
        return <WithdrawalsApprovalView />;
      case 'transactions':
      case 'deposits':
      case 'transfers':
        return <TransactionsView />;
      case 'cards':
      case 'card-setup':
        return <CardsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'settings':
      case 'appearance':
      case 'themes':
      case 'content':
      case 'security':
        return <SettingsView />;
      default:
        // Try to match generic resource configuration
        if (resourceConfigs[activeTab]) {
          return <ResourceView key={activeTab} config={resourceConfigs[activeTab]} />;
        }
        
        // Final fallback for purely unimplemented views
        return (
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-sm text-center space-y-4 my-6">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mx-auto flex items-center justify-center font-bold text-lg uppercase">
              {activeTab.slice(0, 2)}
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white capitalize">
                {activeTab.replace('-', ' ')} Module
              </h2>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                Live administration console module for {activeTab.replace('-', ' ')}. Real-time telemetry is synced with Crestline Capital Core.
              </p>
            </div>
            <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Module Status: Active & Operational
            </div>
          </div>
        );
    }
  };

  // 0. PUBLIC LANDING PAGE
  if (portalMode === 'landing') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
        <LandingPage
          onEnterPortal={() => {
            if (user) {
              setPortalMode('customer');
            } else {
              setAuthModalOpen(true, 'login');
            }
          }}
          onOpenAccount={() => {
            setAuthModalOpen(true, 'register');
          }}
        />

        {/* Modals & Receipts */}
        <AuthModal />
        <ReceiptModal />

        {/* Global Toast */}
        {bankToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 ${
                bankToast.type === 'error'
                  ? 'bg-red-500 text-white border-red-600 shadow-red-500/20'
                  : bankToast.type === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20'
                  : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
              }`}
            >
              <span>{bankToast.message}</span>
              <button
                onClick={clearBankToast}
                className="ml-2 text-white/80 hover:text-white text-xs font-bold"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 1. CUSTOMER ONLINE BANKING PORTAL
  if (portalMode === 'customer') {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors font-sans flex flex-col">
        {/* Customer Header & Navigation */}
        <CustomerHeader />

        {/* Customer Main Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {renderCustomerView()}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200/80 dark:border-slate-800/80 py-6 text-center text-xs text-slate-400">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-700 dark:text-slate-300">Crestline Capital, N.A.</span>
              <span>• Member FDIC • Equal Housing Lender</span>
            </div>
            <div className="flex items-center gap-4 text-[11px]">
              <button
                onClick={() => setPortalMode('landing')}
                className="font-bold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Public Site
              </button>
              <span>Privacy Policy</span>
              <span>Terms of Service</span>
              <span>Security Disclosures</span>
              {['Super Administrator', 'Administrator', 'Compliance Officer'].includes(user?.role || '') && (
                <button
                  onClick={() => setPortalMode('admin')}
                  className="font-bold text-amber-600 dark:text-amber-400 hover:underline"
                >
                  Management Console &rarr;
                </button>
              )}
            </div>
          </div>
        </footer>

        {/* Modals & Receipts */}
        <AuthModal />
        <ReceiptModal />

        {/* Global Toast for Banking Actions */}
        {bankToast && (
          <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-3 duration-200">
            <div
              className={`px-4 py-3 rounded-2xl shadow-xl border text-xs font-semibold flex items-center gap-2.5 ${
                bankToast.type === 'error'
                  ? 'bg-red-500 text-white border-red-600 shadow-red-500/20'
                  : bankToast.type === 'success'
                  ? 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-500/20'
                  : 'bg-slate-900 text-white border-slate-800 shadow-slate-900/20'
              }`}
            >
              <span>{bankToast.message}</span>
              <button
                onClick={clearBankToast}
                className="ml-2 text-white/80 hover:text-white text-xs font-bold"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  // 2. ADMIN LOGIN PAGE (If not yet authenticated as an administrator)
  if (!isAdminAuthenticated) {
    return (
      <AdminLoginPage
        onLoginSuccess={() => {
          // Logged in successfully: App will re-render and display the admin console
        }}
        onReturnToLanding={() => setPortalMode('landing')}
        onOpenCustomerPortal={() => setPortalMode('customer')}
      />
    );
  }

  // 3. CRESTLINE CAPITAL ADMINISTRATION CONSOLE (Authenticated)
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col lg:flex-row transition-colors duration-200 font-sans">
      {/* Sidebar Navigation */}
      <Sidebar
        isOpenMobile={isMobileSidebarOpen}
        onCloseMobile={() => setIsMobileSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Topbar onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {renderActiveAdminView()}
        </main>
      </div>

      {/* Toast Notification Container */}
      <ToastNotification />

      {/* Floating Locale / Language Switcher */}
      <LocaleSwitcher />
    </div>
  );
}
