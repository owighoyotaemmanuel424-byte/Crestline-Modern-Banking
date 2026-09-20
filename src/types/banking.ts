export interface BankUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  role: 'Customer' | 'Super Administrator' | 'Administrator' | 'Compliance Officer' | 'Support Operator';
  country: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'LOCKED';
  kycStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  transferBlocked?: boolean;
  withdrawalBlocked?: boolean;
  blockMessage?: string;
  createdAt: string;
}

export interface BankCard {
  id: string;
  accountId: string;
  accountNumber?: string;
  accountName?: string;
  availableBalanceCents?: number;
  cardNumber: string;
  last4: string;
  cardHolder: string;
  expiryMonth: number;
  expiryYear: number;
  cvv: string;
  pin?: string;
  cardType: 'DEBIT' | 'CREDIT' | 'VIRTUAL';
  cardTier: string;
  status: 'ACTIVE' | 'FROZEN' | 'BLOCKED';
  dailySpendLimitCents: number;
  monthlySpendLimitCents: number;
  atmLimitCents: number;
  internationalEnabled: boolean;
  onlineEnabled: boolean;
  contactlessEnabled: boolean;
  createdAt: string;
}

export interface BankAccount {
  id: string;
  account_number: string;
  routing_number: string;
  account_name: string;
  account_type: 'CHECKING' | 'SAVINGS' | 'INVESTMENT';
  currency: string;
  available_balance: number; // in cents
  ledger_balance: number;    // in cents
  status: 'ACTIVE' | 'FROZEN' | 'CLOSED';
  created_at: string;
}

export interface BankTransaction {
  id: string;
  reference: string;
  account_id: string;
  account_number?: string;
  account_name?: string;
  user_id?: string;
  amount: number; // in cents
  currency: string;
  type: 'DEPOSIT' | 'WITHDRAWAL' | 'TRANSFER' | 'PAYMENT' | 'FEE' | 'ADJUSTMENT';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REVERSED';
  description: string;
  sender_name?: string;
  sender_account_number?: string;
  recipient_name?: string;
  recipient_account_number?: string;
  fee: number; // in cents
  created_at: string;
  completed_at?: string;
  metadata?: string;
}

export interface LedgerEntry {
  id: string;
  transaction_id: string;
  account_id: string;
  entry_type: 'DEBIT' | 'CREDIT';
  amount: number; // in cents
  running_balance: number; // in cents
  description: string;
  created_at: string;
}

export interface BankNotification {
  id: string;
  type: string;
  title: string;
  message: string;
  read: number;
  link?: string;
  created_at: string;
}

export interface TransactionReceipt {
  institution: string;
  institutionAddress: string;
  routingNumber: string;
  reference: string;
  transactionId: string;
  type: string;
  status: string;
  amountCents: number;
  formattedAmount: string;
  feeCents: number;
  formattedFee: string;
  currency: string;
  description: string;
  senderName: string;
  senderAccount: string;
  recipientName?: string;
  recipientAccount?: string;
  createdAt: string;
  completedAt?: string;
  ledgerVerification: string;
}

export interface AccountStatement {
  institution: string;
  routingNumber: string;
  accountNumber: string;
  accountName: string;
  accountType: string;
  currency: string;
  holder: {
    name: string;
    email: string;
    phone?: string;
  };
  period: {
    start: string;
    end: string;
  };
  currentBalance: number;
  totalDeposits: number;
  totalDebits: number;
  transactionCount: number;
  transactions: BankTransaction[];
}
