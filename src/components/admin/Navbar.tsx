import React, { useState, useRef, useEffect } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import {
  Menu,
  Bell,
  Sun,
  Moon,
  Search,
  Check,
  ChevronDown,
  Globe,
  Wallet,
  Shield,
  X,
  UserCheck,
  ArrowLeftRight,
  CreditCard,
  ExternalLink,
  AlertTriangle,
  Info,
  CheckCircle2,
  LogOut
} from 'lucide-react';

export interface NavbarProps {
  onOpenMobileSidebar: () => void;
  balance?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenMobileSidebar,
  balance = 1485200.50
}) => {
  const {
    adminProfile,
    adminLogout,
    notifications,
    markNotificationRead,
    clearNotifications,
    activeTab,
    setActiveTab,
    searchQuery,
    setSearchQuery,
    theme,
    toggleTheme,
    users,
    transactions,
    cards
  } = useAdminStore();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [selectedLang, setSelectedLang] = useState({ code: 'EN', flag: '🇺🇸', label: 'English' });

  const notifRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const languages = [
    { code: 'EN', flag: '🇺🇸', label: 'English' },
    { code: 'ES', flag: '🇪🇸', label: 'Español' },
    { code: 'FR', flag: '🇫🇷', label: 'Français' },
    { code: 'DE', flag: '🇩🇪', label: 'Deutsch' },
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const queryLower = searchQuery.toLowerCase().trim();
  const matchingUsers = queryLower
    ? users.filter(u => u.name.toLowerCase().includes(queryLower) || u.email.toLowerCase().includes(queryLower) || u.accountNumber.toLowerCase().includes(queryLower)).slice(0, 3)
    : [];
  const matchingTxns = queryLower
    ? transactions.filter(t => t.id.toLowerCase().includes(queryLower) || t.userName.toLowerCase().includes(queryLower) || t.merchantOrSender.toLowerCase().includes(queryLower)).slice(0, 3)
    : [];
  const matchingCards = queryLower
    ? cards.filter(c => c.userName.toLowerCase().includes(queryLower) || c.maskedNumber.includes(queryLower)).slice(0, 3)
    : [];

  const hasSearchMatches = matchingUsers.length > 0 || matchingTxns.length > 0 || matchingCards.length > 0;

  return (
    <header className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 sticky top-0 z-20 px-4 sm:px-6 py-3 text-white">
      <div className="flex items-center justify-between gap-3 sm:gap-4">
        {/* Left: Mobile Toggle & Title */}
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={onOpenMobileSidebar}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Toggle Navigation Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="hidden sm:block">
            <h2 className="text-sm sm:text-base font-extrabold text-white capitalize leading-tight">
              {activeTab === 'dashboard' ? 'Control Panel' : activeTab}
            </h2>
            <p className="text-[10px] text-slate-400 font-medium">
              Financial Admin System
            </p>
          </div>
        </div>

        {/* Center/Global Search Input */}
        <div className="relative flex-1 max-w-sm hidden md:block" ref={searchRef}>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              placeholder="Search users, TXN ID, deposits..."
              className="w-full pl-10 pr-9 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Preview Dropdown */}
          {showSearchDropdown && searchQuery.trim() && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-3 z-30 max-h-80 overflow-y-auto">
              {hasSearchMatches ? (
                <div className="space-y-3 text-xs">
                  {matchingUsers.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 px-1">Users</p>
                      {matchingUsers.map(u => (
                        <div
                          key={u.id}
                          onClick={() => {
                            setActiveTab('users');
                            setShowSearchDropdown(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <UserCheck className="w-3.5 h-3.5 text-blue-400" />
                            <span className="font-bold text-slate-200">{u.name}</span>
                          </div>
                          <span className="text-slate-400 font-mono text-[10px]">{u.email}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {matchingTxns.length > 0 && (
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1 px-1">Transactions</p>
                      {matchingTxns.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            setActiveTab('transactions');
                            setShowSearchDropdown(false);
                          }}
                          className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-800 cursor-pointer"
                        >
                          <div className="flex items-center space-x-2">
                            <ArrowLeftRight className="w-3.5 h-3.5 text-emerald-400" />
                            <span className="font-semibold text-slate-200">{t.id} - {t.userName}</span>
                          </div>
                          <span className="font-bold text-white">${t.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">No matching results found.</p>
              )}
            </div>
          )}
        </div>

        {/* Right Section: Balance, Language Selector, Theme & Profile */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* Current Balance Display */}
          <div className="hidden xs:flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 text-xs font-mono">
            <Wallet className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <div className="text-right">
              <span className="text-[9px] uppercase tracking-wider text-slate-400 block -mb-0.5 font-sans font-bold">Treasury Balance</span>
              <span className="font-extrabold text-emerald-400">
                ${balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-[10px] font-semibold text-slate-400">USD</span>
              </span>
            </div>
          </div>

          {/* Language Selector Dropdown (EN) */}
          <div className="relative" ref={langRef}>
            <button
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700/80 hover:bg-slate-700/80 transition-colors text-xs font-bold text-slate-200"
              title="Select Language"
            >
              <span>{selectedLang.flag}</span>
              <span>{selectedLang.code}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </button>

            {showLangDropdown && (
              <div className="absolute right-0 mt-2 w-36 bg-slate-900 border border-slate-800 rounded-xl shadow-xl p-1.5 z-40">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setSelectedLang(lang);
                      setShowLangDropdown(false);
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      selectedLang.code === lang.code
                        ? 'bg-blue-600/20 text-blue-400 font-bold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <span>{lang.flag}</span>
                      <span>{lang.label}</span>
                    </div>
                    {selectedLang.code === lang.code && (
                      <Check className="w-3 h-3 text-blue-400" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Minimal Theme Toggle Icon */}
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4 h-4 text-amber-400" />
            ) : (
              <Moon className="w-4 h-4 text-slate-300" />
            )}
          </button>

          {/* Minimal Notification Icon */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-slate-800/80 border border-slate-700/80 text-slate-300 hover:text-white hover:bg-slate-700/80 transition-colors relative"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-4 z-40">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
                  <div className="flex items-center space-x-2">
                    <h4 className="font-bold text-xs text-white">Admin Notifications</h4>
                    {unreadCount > 0 && (
                      <span className="bg-rose-950 text-rose-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-rose-800/50">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <button
                    onClick={clearNotifications}
                    className="text-[11px] font-medium text-blue-400 hover:text-blue-300"
                  >
                    Mark all read
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => {
                        markNotificationRead(n.id);
                        if (n.linkTab) setActiveTab(n.linkTab);
                        setShowNotifications(false);
                      }}
                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                        n.read
                          ? 'bg-slate-800/30 border-transparent text-slate-400'
                          : 'bg-blue-950/40 border-blue-900/60 text-white font-medium'
                      }`}
                    >
                      <div className="flex items-start space-x-2.5">
                        {n.type === 'alert' || n.type === 'warning' ? (
                          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                        ) : n.type === 'success' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1">
                          <p className="text-xs font-bold leading-snug">{n.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">{n.message}</p>
                          <div className="flex items-center justify-between mt-1.5 text-[10px] text-slate-500">
                            <span>{n.timestamp}</span>
                            {n.linkTab && (
                              <span className="flex items-center text-blue-400 font-semibold">
                                View <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Admin Profile/Avatar Pill */}
          <div
            onClick={() => setActiveTab('settings')}
            className="flex items-center space-x-2 pl-1.5 py-1 pr-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 cursor-pointer hover:bg-slate-700/80 transition-colors"
          >
            <img
              src={adminProfile.avatar}
              alt={adminProfile.name}
              className="w-7 h-7 rounded-full object-cover ring-2 ring-blue-500/40"
            />
            <div className="hidden lg:block text-left">
              <p className="text-xs font-bold text-white leading-tight">
                {adminProfile.name}
              </p>
              <div className="flex items-center space-x-1">
                <Shield className="w-2.5 h-2.5 text-blue-400" />
                <span className="text-[9px] font-semibold text-slate-400">
                  {adminProfile.role || 'Admin'}
                </span>
              </div>
            </div>
          </div>

          {/* Sign Out Action */}
          <button
            onClick={() => adminLogout()}
            title="Lock Console & Sign Out"
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-red-950/60 border border-slate-700/80 hover:border-red-800/60 text-slate-300 hover:text-red-300 transition-colors text-xs font-semibold cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </div>
    </header>
  );
};
