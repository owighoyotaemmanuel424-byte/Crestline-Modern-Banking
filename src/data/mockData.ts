import { User, Transaction, VirtualCard, AdminNotification, AdminProfile } from '../types/admin';

export const INITIAL_ADMIN_PROFILE: AdminProfile = {
  name: "Emmanuel Owighoyota",
  email: "owighoyotaemmanuel424@gmail.com",
  role: "Super Administrator",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
  lastLogin: "Active Now",
  twoFactorEnabled: true,
};

export const INITIAL_USERS: User[] = [
  {
    id: "usr-101",
    name: "Marcus Thorne",
    email: "marcus.thorne@apexventures.io",
    accountNumber: "ACC-88392102",
    balance: 145290.50,
    status: "active",
    accountState: "Active",
    kycStatus: "verified",
    emailVerified: true,
    twoFactorEnabled: true,
    tier: "VIP",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2024-03-12",
    phone: "+1 (555) 234-8901",
    kycVerified: true,
    lastLogin: "2026-08-05 09:12:44 UTC",
    transactionPinSet: true,
    forcePinNextLogin: false,
    customRestrictedMessages: {
      inactive: "Your account is temporarily inactive. Please verify your billing details.",
      onHold: "Account is on hold pending compliance review.",
      suspended: "Suspended due to security protocol trigger.",
      blocked: "Access restricted. Contact compliance@crestlinecapital.com."
    },
    loginHistory: [
      { id: "log-1", when: "2026-08-05 09:12:44", ip: "192.168.1.104", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/127.0.0.0" },
      { id: "log-2", when: "2026-08-04 18:40:12", ip: "192.168.1.104", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X)" },
      { id: "log-3", when: "2026-08-02 11:22:05", ip: "172.56.21.90", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15" }
    ]
  },
  {
    id: "usr-102",
    name: "Elena Rostova",
    email: "elena.rostova@techlumina.com",
    accountNumber: "ACC-99201482",
    balance: 89420.00,
    status: "active",
    accountState: "Active",
    kycStatus: "verified",
    emailVerified: true,
    twoFactorEnabled: true,
    tier: "Business",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2024-05-19",
    phone: "+1 (555) 492-1092",
    kycVerified: true,
    lastLogin: "2026-08-04 14:02:10 UTC",
    transactionPinSet: true,
    forcePinNextLogin: false,
    customRestrictedMessages: {
      inactive: "Account inactive.",
      onHold: "Account on hold.",
      suspended: "Account suspended.",
      blocked: "Blocked by risk engine."
    },
    loginHistory: [
      { id: "log-102-1", when: "2026-08-04 14:02:10", ip: "104.28.192.81", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Edge/126.0" }
    ]
  },
  {
    id: "usr-103",
    name: "Julian Sterling",
    email: "julian.s@sterlingcapital.net",
    accountNumber: "ACC-44109283",
    balance: 512000.75,
    status: "active",
    accountState: "Active",
    kycStatus: "verified",
    emailVerified: true,
    twoFactorEnabled: true,
    tier: "VIP",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2023-11-04",
    phone: "+1 (555) 881-2200",
    kycVerified: true,
    lastLogin: "2026-08-05 08:00:15 UTC",
    transactionPinSet: true,
    forcePinNextLogin: false,
    loginHistory: [
      { id: "log-103-1", when: "2026-08-05 08:00:15", ip: "185.220.101.5", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
    ]
  },
  {
    id: "usr-104",
    name: "Sophia Chen",
    email: "sophia.chen@innovate.co",
    accountNumber: "ACC-12094857",
    balance: 34150.20,
    status: "active",
    accountState: "Active",
    kycStatus: "verified",
    emailVerified: true,
    twoFactorEnabled: false,
    tier: "Premium",
    avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2025-01-15",
    phone: "+1 (555) 302-8819",
    kycVerified: true,
    lastLogin: "2026-08-03 21:18:00 UTC",
    transactionPinSet: true,
    forcePinNextLogin: false,
    loginHistory: [
      { id: "log-104-1", when: "2026-08-03 21:18:00", ip: "73.162.88.10", userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4)" }
    ]
  },
  {
    id: "usr-105",
    name: "Devon Miller",
    email: "devon.m@horizonlabs.org",
    accountNumber: "ACC-77102948",
    balance: 1240.00,
    status: "suspended",
    accountState: "Suspended",
    kycStatus: "unverified",
    emailVerified: false,
    twoFactorEnabled: false,
    tier: "Standard",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2025-06-02",
    phone: "+1 (555) 912-3344",
    kycVerified: false,
    lastLogin: "2026-07-28 10:11:02 UTC",
    transactionPinSet: false,
    forcePinNextLogin: true,
    customRestrictedMessages: {
      suspended: "Your account is currently suspended due to unverified high-risk activity.",
      blocked: "Access denied. Contact compliance officer."
    },
    loginHistory: [
      { id: "log-105-1", when: "2026-07-28 10:11:02", ip: "45.133.1.88", userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64)" }
    ]
  },
  {
    id: "usr-106",
    name: "Amara Okezie",
    email: "amara.o@globaltrade.ng",
    accountNumber: "ACC-66381029",
    balance: 278900.00,
    status: "active",
    accountState: "Active",
    kycStatus: "verified",
    emailVerified: true,
    twoFactorEnabled: true,
    tier: "VIP",
    avatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2024-08-22",
    phone: "+1 (555) 743-9081",
    kycVerified: true,
    lastLogin: "2026-08-04 19:40:00 UTC",
    transactionPinSet: true,
    forcePinNextLogin: false,
    loginHistory: [
      { id: "log-106-1", when: "2026-08-04 19:40:00", ip: "197.210.8.44", userAgent: "Mozilla/5.0 (Android 14; Mobile)" }
    ]
  },
  {
    id: "usr-107",
    name: "Liam O'Connor",
    email: "loconnor@dublintech.ie",
    accountNumber: "ACC-33291048",
    balance: 18650.00,
    status: "active",
    accountState: "On-hold",
    kycStatus: "pending",
    emailVerified: true,
    twoFactorEnabled: false,
    tier: "Standard",
    avatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2025-03-10",
    phone: "+1 (555) 201-9922",
    kycVerified: false,
    lastLogin: "2026-08-01 16:20:11 UTC",
    transactionPinSet: true,
    forcePinNextLogin: true,
    loginHistory: [
      { id: "log-107-1", when: "2026-08-01 16:20:11", ip: "89.100.22.14", userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)" }
    ]
  },
  {
    id: "usr-108",
    name: "Chloe Dubois",
    email: "chloe.dubois@parisluxe.fr",
    accountNumber: "ACC-55401928",
    balance: 95400.30,
    status: "closed",
    accountState: "Suspended",
    kycStatus: "rejected",
    emailVerified: true,
    twoFactorEnabled: true,
    tier: "Premium",
    avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
    joinedDate: "2024-10-01",
    phone: "+1 (555) 603-1122",
    kycVerified: false,
    lastLogin: "2026-07-15 08:12:00 UTC",
    transactionPinSet: false,
    forcePinNextLogin: true,
    loginHistory: [
      { id: "log-108-1", when: "2026-07-15 08:12:00", ip: "213.152.6.10", userAgent: "Mozilla/5.0 (X11; Linux x86_64)" }
    ]
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: "TXN-90201",
    userId: "usr-101",
    userName: "Marcus Thorne",
    userEmail: "marcus.thorne@apexventures.io",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-88392102",
    amount: 25000.00,
    type: "Wire Transfer",
    status: "Pending",
    category: "Corporate Wire",
    timestamp: "2026-07-31 13:42",
    merchantOrSender: "Goldman Sachs International",
    referenceCode: "GS-WIRE-884012",
    riskScore: "Medium"
  },
  {
    id: "TXN-90202",
    userId: "usr-103",
    userName: "Julian Sterling",
    userEmail: "julian.s@sterlingcapital.net",
    userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-44109283",
    amount: 150000.00,
    type: "Credit",
    status: "Completed",
    category: "Dividend Payout",
    timestamp: "2026-07-31 11:20",
    merchantOrSender: "Crestline Wealth Mgmt",
    referenceCode: "DIV-2026-Q3-091",
    riskScore: "Low"
  },
  {
    id: "TXN-90203",
    userId: "usr-102",
    userName: "Elena Rostova",
    userEmail: "elena.rostova@techlumina.com",
    userAvatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-99201482",
    amount: 3450.80,
    type: "Card Purchase",
    status: "Completed",
    category: "Software Subscription",
    timestamp: "2026-07-31 09:15",
    merchantOrSender: "AWS Cloud Services",
    referenceCode: "AWS-INV-9920381",
    riskScore: "Low"
  },
  {
    id: "TXN-90204",
    userId: "usr-105",
    userName: "Devon Miller",
    userEmail: "devon.m@horizonlabs.org",
    userAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-77102948",
    amount: 12500.00,
    type: "Debit",
    status: "Pending",
    category: "International Transfer",
    timestamp: "2026-07-31 08:30",
    merchantOrSender: "Offshore Crypto Exchange",
    referenceCode: "CRYPTO-OUT-1192",
    riskScore: "High"
  },
  {
    id: "TXN-90205",
    userId: "usr-106",
    userName: "Amara Okezie",
    userEmail: "amara.o@globaltrade.ng",
    userAvatar: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-66381029",
    amount: 45000.00,
    type: "Credit",
    status: "Completed",
    category: "Export Settlement",
    timestamp: "2026-07-30 18:45",
    merchantOrSender: "Standard Chartered London",
    referenceCode: "STDC-8840129",
    riskScore: "Low"
  },
  {
    id: "TXN-90206",
    userId: "usr-104",
    userName: "Sophia Chen",
    userEmail: "sophia.chen@innovate.co",
    userAvatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-12094857",
    amount: 8200.00,
    type: "Wire Transfer",
    status: "Pending",
    category: "Vendor Payment",
    timestamp: "2026-07-30 16:10",
    merchantOrSender: "Design Studio GmbH",
    referenceCode: "DSG-INV-4402",
    riskScore: "Low"
  },
  {
    id: "TXN-90207",
    userId: "usr-107",
    userName: "Liam O'Connor",
    userEmail: "loconnor@dublintech.ie",
    userAvatar: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-33291048",
    amount: 1450.00,
    type: "Debit",
    status: "Rejected",
    category: "ATM Cash Withdrawal",
    timestamp: "2026-07-29 22:05",
    merchantOrSender: "ATM Berlin Central",
    referenceCode: "ATM-ERR-9011",
    riskScore: "High"
  },
  {
    id: "TXN-90208",
    userId: "usr-101",
    userName: "Marcus Thorne",
    userEmail: "marcus.thorne@apexventures.io",
    userAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    accountNumber: "ACC-88392102",
    amount: 6200.00,
    type: "Card Purchase",
    status: "Completed",
    category: "Travel & Hospitality",
    timestamp: "2026-07-29 14:12",
    merchantOrSender: "Emirates First Class",
    referenceCode: "EK-FLIGHT-9920",
    riskScore: "Low"
  }
];

export const INITIAL_CARDS: VirtualCard[] = [
  {
    id: "crd-501",
    userId: "usr-101",
    userName: "Marcus Thorne",
    maskedNumber: "4532 •••• •••• 8841",
    cardType: "Crestline Black Metal",
    expiryDate: "09/29",
    cvv: "882",
    status: "Active",
    spendingLimit: 100000,
    currentSpent: 28450,
    colorGradient: "from-slate-900 via-slate-800 to-black",
    createdAt: "2024-04-10"
  },
  {
    id: "crd-502",
    userId: "usr-103",
    userName: "Julian Sterling",
    maskedNumber: "5412 •••• •••• 9920",
    cardType: "Visa Platinum",
    expiryDate: "12/28",
    cvv: "319",
    status: "Active",
    spendingLimit: 250000,
    currentSpent: 64200,
    colorGradient: "from-blue-700 via-indigo-800 to-blue-900",
    createdAt: "2023-11-15"
  },
  {
    id: "crd-503",
    userId: "usr-102",
    userName: "Elena Rostova",
    maskedNumber: "4111 •••• •••• 3491",
    cardType: "Mastercard World",
    expiryDate: "05/27",
    cvv: "442",
    status: "Active",
    spendingLimit: 50000,
    currentSpent: 12890,
    colorGradient: "from-sky-600 via-blue-600 to-indigo-700",
    createdAt: "2024-06-01"
  },
  {
    id: "crd-504",
    userId: "usr-105",
    userName: "Devon Miller",
    maskedNumber: "4000 •••• •••• 1102",
    cardType: "Virtual Express",
    expiryDate: "03/26",
    cvv: "109",
    status: "Frozen",
    spendingLimit: 5000,
    currentSpent: 4890,
    colorGradient: "from-amber-600 via-orange-700 to-rose-800",
    createdAt: "2025-06-05"
  },
  {
    id: "crd-505",
    userId: "usr-106",
    userName: "Amara Okezie",
    maskedNumber: "5520 •••• •••• 7731",
    cardType: "Crestline Black Metal",
    expiryDate: "11/30",
    cvv: "702",
    status: "Active",
    spendingLimit: 150000,
    currentSpent: 41200,
    colorGradient: "from-emerald-800 via-teal-900 to-slate-900",
    createdAt: "2024-09-02"
  }
];

export const INITIAL_NOTIFICATIONS: AdminNotification[] = [
  {
    id: "notif-1",
    title: "High Risk Transaction Flagged",
    message: "Devon Miller requested a $12,500 wire transfer to an unverified offshore crypto exchange.",
    timestamp: "25 mins ago",
    read: false,
    type: "warning",
    linkTab: "transactions"
  },
  {
    id: "notif-2",
    title: "Pending Corporate Approval",
    message: "Marcus Thorne requested $25,000 corporate wire approval.",
    timestamp: "1 hour ago",
    read: false,
    type: "alert",
    linkTab: "transactions"
  },
  {
    id: "notif-3",
    title: "KYC Verification Success",
    message: "Sophia Chen completed tier-2 identity verification.",
    timestamp: "3 hours ago",
    read: true,
    type: "success",
    linkTab: "users"
  }
];

// Analytics Data
export const TRANSACTIONS_OVER_TIME = [
  { date: "Jul 21", volume: 142000, count: 124, pending: 8 },
  { date: "Jul 22", volume: 189000, count: 148, pending: 12 },
  { date: "Jul 23", volume: 210000, count: 162, pending: 15 },
  { date: "Jul 24", volume: 195000, count: 155, pending: 10 },
  { date: "Jul 25", volume: 275000, count: 190, pending: 18 },
  { date: "Jul 26", volume: 320000, count: 210, pending: 22 },
  { date: "Jul 27", volume: 280000, count: 185, pending: 14 },
  { date: "Jul 28", volume: 340000, count: 230, pending: 19 },
  { date: "Jul 29", volume: 410000, count: 260, pending: 25 },
  { date: "Jul 30", volume: 390000, count: 245, pending: 21 },
  { date: "Jul 31", volume: 485000, count: 298, pending: 3 }
];

export const USER_GROWTH_DATA = [
  { month: "Feb", totalUsers: 1200, activeUsers: 980, newUsers: 140 },
  { month: "Mar", totalUsers: 1420, activeUsers: 1150, newUsers: 220 },
  { month: "Apr", totalUsers: 1780, activeUsers: 1420, newUsers: 360 },
  { month: "May", totalUsers: 2150, activeUsers: 1800, newUsers: 370 },
  { month: "Jun", totalUsers: 2600, activeUsers: 2210, newUsers: 450 },
  { month: "Jul", totalUsers: 3140, activeUsers: 2780, newUsers: 540 }
];

export const REVENUE_DATA = [
  { month: "Jan", interchangeFees: 42000, wireFees: 28000, wealthMgmt: 65000 },
  { month: "Feb", interchangeFees: 48000, wireFees: 32000, wealthMgmt: 71000 },
  { month: "Mar", interchangeFees: 55000, wireFees: 39000, wealthMgmt: 82000 },
  { month: "Apr", interchangeFees: 61000, wireFees: 41000, wealthMgmt: 89000 },
  { month: "May", interchangeFees: 73000, wireFees: 49000, wealthMgmt: 104000 },
  { month: "Jun", interchangeFees: 84000, wireFees: 58000, wealthMgmt: 118000 },
  { month: "Jul", interchangeFees: 96000, wireFees: 67000, wealthMgmt: 135000 }
];

export const CATEGORY_BREAKDOWN = [
  { name: "Wire Transfers", value: 45, color: "#2563eb" },
  { name: "Card Purchases", value: 28, color: "#0284c7" },
  { name: "Wealth Mgmt / Investments", value: 18, color: "#4f46e5" },
  { name: "Internal Transfers", value: 9, color: "#0d9488" }
];
