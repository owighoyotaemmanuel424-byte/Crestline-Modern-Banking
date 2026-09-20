export type UserStatus = 'active' | 'suspended' | 'closed';
export type AccountState = 'Active' | 'Inactive' | 'On-hold' | 'Suspended';
export type KycStatus = 'unverified' | 'pending' | 'verified' | 'rejected';
export type UserTier = 'Standard' | 'Premium' | 'VIP' | 'Business';

export type LeadStatus = 'New' | 'Contacted' | 'Qualified' | 'Proposal' | 'Negotiation' | 'Won' | 'Lost';

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: LeadStatus;
  value?: number;
  source?: string;
  createdAt: string;
  notes?: string;
  assignedTo?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  accountNumber: string;
  balance: number;
  status: UserStatus;
  accountState?: AccountState;
  kycStatus?: KycStatus;
  emailVerified?: boolean;
  twoFactorEnabled?: boolean;
  tier: UserTier;
  avatar: string;
  joinedDate: string;
  phone: string;
  kycVerified: boolean;
  lastLogin?: string;
  transactionPinSet?: boolean;
  forcePinNextLogin?: boolean;
  transferBlocked?: boolean;
  withdrawalBlocked?: boolean;
  blockMessage?: string;
  customRestrictedMessages?: {
    inactive?: string;
    onHold?: string;
    suspended?: string;
    blocked?: string;
  };
  loginHistory?: Array<{
    id: string;
    when: string;
    ip: string;
    userAgent: string;
  }>;
}

export type TransactionType = 'Credit' | 'Debit' | 'Wire Transfer' | 'Card Purchase';
export type TransactionStatus = 'Pending' | 'Completed' | 'Rejected';

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string;
  accountNumber: string;
  amount: number;
  type: TransactionType;
  status: TransactionStatus;
  category: string;
  timestamp: string;
  merchantOrSender: string;
  referenceCode: string;
  riskScore?: 'Low' | 'Medium' | 'High';
  isDisplayOnly?: boolean;
  note?: string;
}

export type CardStatus = 'Active' | 'Frozen';
export type CardType = 'Visa Platinum' | 'Mastercard World' | 'Crestline Black Metal' | 'Virtual Express';

export interface VirtualCard {
  id: string;
  userId: string;
  userName: string;
  maskedNumber: string;
  cardType: CardType;
  expiryDate: string;
  cvv: string;
  status: CardStatus;
  spendingLimit: number;
  currentSpent: number;
  colorGradient: string;
  createdAt: string;
}

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'info' | 'warning' | 'success' | 'alert';
  linkTab?: 'transactions' | 'users' | 'cards' | string;
}

export interface AdminProfile {
  name: string;
  email: string;
  role: string;
  avatar: string;
  lastLogin: string;
  twoFactorEnabled: boolean;
}

export type ActiveTab =
  // Overview & People
  | 'dashboard' | 'users' | 'kyc' | 'leads' | 'tasks' | 'referrals' | 'import'
  // Money
  | 'deposits' | 'withdrawals' | 'transfers' | 'payment-methods' | 'cards' | 'card-setup' | 'currencies' | 'loans' | 'grants' | 'irs' | 'membership'
  // Trading
  | 'plans' | 'crypto' | 'signals' | 'providers' | 'copy-trading' | 'courses'
  // Engage
  | 'inbox' | 'tickets' | 'contact-chat' | 'broadcast' | 'live-chat' | 'agents' | 'testimonials'
  // Site & System
  | 'appearance' | 'themes' | 'assets' | 'content' | 'faq' | 'audit-log' | 'settings'
  | 'analytics'
  | string;

