import React, { useState, useRef, useEffect } from 'react';
import { useBankStore, CustomerView } from '../../store/useBankStore';
import { 
  Building2, 
  Bell, 
  ShieldCheck, 
  User, 
  LogOut, 
  ArrowRightLeft, 
  ArrowDownLeft, 
  ArrowUpRight, 
  History, 
  FileText, 
  ShieldAlert, 
  ChevronDown, 
  ExternalLink,
  Layers,
  Check,
  Menu,
  X,
  CreditCard,
  Globe
} from 'lucide-react';

export const CustomerHeader: React.FC = () => {
  const { 
    user, 
    accounts, 
    activeView, 
    setActiveView, 
    setPortalMode, 
    notifications, 
    unreadCount, 
    markNotificationRead, 
    markAllNotificationsRead, 
    logout, 
    setAuthModalOpen,
    quickDemoLogin
  } = useBankStore();

  const [notifsOpen, setNotifsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [demoOpen, setDemoOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const notifsRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target as Node)) {
        setNotifsOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (demoRef.current && !demoRef.current.contains(e.target as Node)) {
        setDemoOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const navItems: { id: CustomerView; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Overview', icon: Building2 },
    { id: 'cards', label: 'Cards', icon: CreditCard },
    { id: 'transfer', label: 'Send Money', icon: ArrowRightLeft },
    { id: 'deposit', label: 'Deposit', icon: ArrowDownLeft },
    { id: 'withdraw', label: 'Withdraw', icon: ArrowUpRight },
    { id: 'transactions', label: 'Activity', icon: History },
    { id: 'statements', label: 'Statements', icon: FileText },
    { id: 'security', label: 'Security', icon: ShieldCheck }
  ];

  const isAdminRole = user && ['Super Administrator', 'Administrator', 'Compliance Officer'].includes(user.role);

  return (
    <header className="sticky top-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur border-b border-slate-200/80 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('dashboard')}
              className="flex items-center gap-2.5 text-left group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white font-bold text-base shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                C
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 dark:text-white tracking-tight text-base">
                    Crestline Capital
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/50">
                    BANKING
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium tracking-wide uppercase">Member FDIC • Routing: 021000089</p>
              </div>
            </button>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100/70 dark:hover:bg-slate-800/50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Right Action Cluster */}
          <div className="flex items-center gap-2">
            {/* Quick Demo Switcher Dropdown - Only available in development */}
            {!import.meta.env.PROD && (
              <div className="relative" ref={demoRef}>
                <button
                  onClick={() => setDemoOpen(!demoOpen)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                  title="Switch demo account"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span className="hidden sm:inline">Demo Switcher</span>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {demoOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Switch Active Identity</p>
                    </div>
                    <button
                      onClick={() => {
                        quickDemoLogin('sarah.jenkins@crestline.bank');
                        setDemoOpen(false);
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">Sarah Jenkins</p>
                        <p className="text-[10px] text-slate-400">Customer • $93k Balance</p>
                      </div>
                      {user?.email === 'sarah.jenkins@crestline.bank' && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>

                    <button
                      onClick={() => {
                        quickDemoLogin('david.nguyen@crestline.bank');
                        setDemoOpen(false);
                      }}
                      className="w-full p-2 rounded-xl text-left hover:bg-slate-50 dark:hover:bg-slate-800/60 transition flex items-center justify-between"
                    >
                      <div>
                        <p className="text-xs font-bold text-slate-900 dark:text-white">David Nguyen</p>
                        <p className="text-[10px] text-slate-400">Customer • $14k Balance</p>
                      </div>
                      {user?.email === 'david.nguyen@crestline.bank' && (
                        <Check className="w-4 h-4 text-blue-600" />
                      )}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Notifications Dropdown */}
            {user && (
              <div className="relative" ref={notifsRef}>
                <button
                  onClick={() => setNotifsOpen(!notifsOpen)}
                  className="relative p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                  aria-label="Notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                  )}
                </button>

                {notifsOpen && (
                  <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-3 z-50 animate-in fade-in zoom-in-95">
                    <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">Notifications</span>
                        {unreadCount > 0 && (
                          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950 text-red-600 dark:text-red-400">
                            {unreadCount} new
                          </span>
                        )}
                      </div>
                      {unreadCount > 0 && (
                        <button
                          onClick={() => markAllNotificationsRead()}
                          className="text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>

                    <div className="max-h-72 overflow-y-auto space-y-1.5">
                      {notifications.length === 0 ? (
                        <div className="py-8 text-center text-xs text-slate-400">
                          No notifications yet
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n.id}
                            onClick={() => {
                              if (!n.read) markNotificationRead(n.id);
                              if (n.link) setActiveView('transactions');
                              setNotifsOpen(false);
                            }}
                            className={`p-2.5 rounded-xl cursor-pointer transition ${
                              n.read
                                ? 'bg-transparent hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-600 dark:text-slate-400'
                                : 'bg-blue-50/50 dark:bg-blue-950/30 hover:bg-blue-50 dark:hover:bg-blue-950/50 text-slate-900 dark:text-white border-l-2 border-blue-600'
                            }`}
                          >
                            <p className="text-xs font-semibold">{n.title}</p>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">{n.message}</p>
                            <p className="text-[9px] text-slate-400 mt-1">
                              {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile Dropdown / Login Button */}
            {user ? (
              <div className="relative" ref={profileRef}>
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-xs">
                    {user.firstName[0]}
                    {user.lastName[0]}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {user.firstName}
                    </p>
                    <p className="text-[10px] text-slate-400 leading-tight">{user.role}</p>
                  </div>
                  <ChevronDown className="w-3 h-3 text-slate-400" />
                </button>

                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95">
                    <div className="p-3 border-b border-slate-100 dark:border-slate-800 mb-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {user.firstName} {user.lastName}
                      </p>
                      <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
                      <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                        <ShieldCheck className="w-3 h-3" />
                        KYC Verified Customer
                      </div>
                    </div>

                    {/* Switcher for Staff/Executives */}
                    {isAdminRole && (
                      <button
                        onClick={() => {
                          setPortalMode('admin');
                          setProfileOpen(false);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 transition mb-1"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>Switch to Management Console</span>
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setPortalMode('landing');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <Globe className="w-3.5 h-3.5 text-blue-500" />
                      <span>Public Landing Page</span>
                    </button>

                    <button
                      onClick={() => {
                        setActiveView('security');
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Security & Devices</span>
                    </button>

                    <button
                      onClick={() => {
                        logout();
                        setProfileOpen(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModalOpen(true, 'login')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setAuthModalOpen(true, 'register')}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-700 transition shadow-sm"
                >
                  Open Account
                </button>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileNavOpen(!mobileNavOpen)}
              className="md:hidden p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {mobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileNavOpen && (
          <div className="md:hidden py-3 border-t border-slate-200 dark:border-slate-800 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveView(item.id);
                    setMobileNavOpen(false);
                  }}
                  className={`w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
            {isAdminRole && (
              <button
                onClick={() => {
                  setPortalMode('admin');
                  setMobileNavOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40"
              >
                <Building2 className="w-4 h-4" />
                <span>Management Console</span>
              </button>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
