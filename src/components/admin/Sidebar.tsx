import React, { useState } from 'react';
import { useAdminStore } from '../../store/useAdminStore';
import { useBankStore } from '../../store/useBankStore';
import { ActiveTab } from '../../types/admin';
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  UserCheck,
  CheckSquare,
  Share2,
  FileSpreadsheet,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  Sliders,
  Coins,
  DollarSign,
  Award,
  FileText,
  Crown,
  TrendingUp,
  Bitcoin,
  Radio,
  Server,
  Copy,
  GraduationCap,
  Inbox,
  LifeBuoy,
  MessageSquare,
  Megaphone,
  Bot,
  Star,
  Palette,
  Brush,
  Folder,
  FileCode,
  HelpCircle,
  ClipboardList,
  Settings,
  Shield,
  X,
  ChevronDown,
  ChevronRight,
  Building2,
  Globe,
  LogOut
} from 'lucide-react';

interface SidebarProps {
  isOpenMobile?: boolean;
  onCloseMobile?: () => void;
}

interface NavSection {
  title: string;
  items: { id: ActiveTab; label: string; icon: React.ElementType; badge?: number }[];
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpenMobile = false,
  onCloseMobile,
}) => {
  const {
    activeTab,
    setActiveTab,
    setSelectedUserId,
    transactions,
    adminLogout,
  } = useAdminStore();
  const { setPortalMode } = useBankStore();

  const pendingCount = transactions.filter((t) => t.status === 'Pending').length;

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  const navSections: NavSection[] = [
    {
      title: 'Overview & People',
      items: [
        { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
        { id: 'users', label: 'Users', icon: Users },
        { id: 'kyc', label: 'KYC', icon: ShieldCheck },
        { id: 'leads', label: 'Leads', icon: UserCheck },
        { id: 'tasks', label: 'Tasks', icon: CheckSquare },
        { id: 'referrals', label: 'Referrals', icon: Share2 },
        { id: 'import', label: 'Import', icon: FileSpreadsheet },
      ]
    },
    {
      title: 'Money',
      items: [
        { id: 'deposits', label: 'Deposits', icon: ArrowDownLeft },
        { id: 'withdrawals', label: 'Withdrawals', icon: ArrowUpRight },
        { id: 'transfers', label: 'Transfers', icon: ArrowLeftRight, badge: pendingCount },
        { id: 'payment-methods', label: 'Payment Methods', icon: DollarSign },
        { id: 'cards', label: 'Cards', icon: CreditCard },
        { id: 'card-setup', label: 'Card Setup', icon: Sliders },
        { id: 'currencies', label: 'Currencies', icon: Coins },
        { id: 'loans', label: 'Loans', icon: FileText },
        { id: 'grants', label: 'Grants', icon: Award },
        { id: 'irs', label: 'IRS', icon: FileText },
        { id: 'membership', label: 'Membership', icon: Crown },
      ]
    },
    {
      title: 'Trading',
      items: [
        { id: 'plans', label: 'Plans', icon: TrendingUp },
        { id: 'crypto', label: 'Crypto', icon: Bitcoin },
        { id: 'signals', label: 'Signals', icon: Radio },
        { id: 'providers', label: 'Providers', icon: Server },
        { id: 'copy-trading', label: 'Copy Trading', icon: Copy },
        { id: 'courses', label: 'Courses', icon: GraduationCap },
      ]
    },
    {
      title: 'Engage',
      items: [
        { id: 'inbox', label: 'Inbox', icon: Inbox },
        { id: 'tickets', label: 'Support Tickets', icon: LifeBuoy },
        { id: 'contact-chat', label: 'Contact & Live Chat', icon: MessageSquare },
        { id: 'broadcast', label: 'Broadcast', icon: Megaphone },
        { id: 'live-chat', label: 'Live Chat', icon: MessageSquare },
        { id: 'agents', label: 'Agents', icon: Bot },
        { id: 'testimonials', label: 'Testimonials', icon: Star },
      ]
    },
    {
      title: 'Site & System',
      items: [
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'themes', label: 'Themes', icon: Brush },
        { id: 'assets', label: 'Assets', icon: Folder },
        { id: 'content', label: 'Content', icon: FileCode },
        { id: 'faq', label: 'FAQ', icon: HelpCircle },
        { id: 'audit-log', label: 'Audit Log', icon: ClipboardList },
        { id: 'settings', label: 'Settings', icon: Settings },
      ]
    }
  ];

  const sidebarContent = (
    <div className="h-full flex flex-col justify-between p-4 lg:p-4 overflow-y-auto custom-scrollbar">
      {/* Top Crestline Branding */}
      <div>
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => { setActiveTab('dashboard'); setSelectedUserId(null); }}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="font-bold text-sm tracking-tight text-slate-900 dark:text-white leading-tight">
                Crestline
              </h1>
              <span className="text-[10px] font-bold tracking-wider text-blue-600 dark:text-blue-400 uppercase">
                Capital Admin
              </span>
            </div>
          </div>

          {/* Close button for mobile drawer */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-xl text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Multi-Section Navigation Links */}
        <div className="space-y-4">
          {navSections.map((section) => {
            const isCollapsed = collapsedSections[section.title];

            return (
              <div key={section.title} className="space-y-1">
                <button
                  onClick={() => toggleSection(section.title)}
                  className="w-full flex items-center justify-between px-2 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
                >
                  <span>{section.title}</span>
                  {isCollapsed ? (
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-3 h-3 text-slate-400" />
                  )}
                </button>

                {!isCollapsed && (
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const Icon = item.icon;
                      const isActive = activeTab === item.id;

                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setActiveTab(item.id);
                            setSelectedUserId(null); // Return to view mode
                            if (onCloseMobile) onCloseMobile();
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all group ${
                            isActive
                              ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white shadow-md shadow-blue-500/20'
                              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <Icon
                              className={`w-3.5 h-3.5 shrink-0 transition-transform group-hover:scale-110 ${
                                isActive
                                  ? 'text-white'
                                  : 'text-slate-400 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-blue-400'
                              }`}
                            />
                            <span className="truncate">{item.label}</span>
                          </div>

                          {item.badge !== undefined && item.badge > 0 && (
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                                isActive
                                  ? 'bg-white/20 text-white'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 animate-pulse'
                              }`}
                            >
                              {item.badge}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Footer & Operational Pill */}
      <div className="pt-4 mt-6 border-t border-slate-100 dark:border-slate-800 space-y-2">
        <button
          onClick={() => {
            setPortalMode('customer');
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold transition shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5" />
            <span>Open Online Banking</span>
          </div>
          <span className="text-[10px]">&rarr;</span>
        </button>

        <button
          onClick={() => {
            setPortalMode('landing');
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-bold transition shadow-xs"
        >
          <div className="flex items-center gap-2">
            <Globe className="w-3.5 h-3.5 text-blue-500" />
            <span>Public Landing Page</span>
          </div>
          <span className="text-[10px]">&rarr;</span>
        </button>

        <button
          onClick={() => {
            adminLogout();
            if (onCloseMobile) onCloseMobile();
          }}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/50 dark:border-red-900/40 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/60 text-xs font-bold transition shadow-xs cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <LogOut className="w-3.5 h-3.5 text-red-500" />
            <span>Lock & Sign Out</span>
          </div>
          <span className="text-[10px]">&times;</span>
        </button>

        <div className="px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/50 dark:border-emerald-800/40 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span className="font-semibold text-emerald-800 dark:text-emerald-300 text-[10px]">
              System Operational
            </span>
          </div>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block w-64 bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 shrink-0 h-screen sticky top-0 z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            onClick={onCloseMobile}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />
          <div className="fixed top-0 bottom-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-2xl z-10 overflow-y-auto">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};
