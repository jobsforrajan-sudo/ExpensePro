export type PaymentMethod = 
  | 'UPI'
  | 'Credit Card'
  | 'Debit Card'
  | 'Bank Transfer'
  | 'Digital Wallet'
  | 'Cash'
  | 'Cryptocurrency';

export type ExpenseCategory =
  | 'Housing & Rent'
  | 'Groceries & Food'
  | 'Dining & Nightlife'
  | 'Transportation'
  | 'Utilities & Bills'
  | 'Healthcare & Fitness'
  | 'Entertainment & Leisure'
  | 'Shopping & Personal'
  | 'Education & Books'
  | 'Debt & Loan Repayment'
  | 'Investments & Savings'
  | 'Miscellaneous';

export type RecurringFrequency = 'Daily' | 'Weekly' | 'Bi-Weekly' | 'Monthly' | 'Quarterly' | 'Yearly';

export interface ExpenseAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl: string; // base64 or object URL
}

export type AttachmentFile = ExpenseAttachment;

export interface Expense {
  id: string;
  name: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  paymentMethod: PaymentMethod;
  notes?: string;
  isRecurring: boolean;
  recurringFrequency?: RecurringFrequency;
  nextDueDate?: string;
  attachment?: ExpenseAttachment;
  createdAt: number;
  updatedAt: number;
}

export type RiskTolerance = 'Conservative' | 'Moderate' | 'Aggressive';

export interface InvestmentPreference {
  riskTolerance: RiskTolerance;
  horizonYears: number;
  expectedAnnualReturn: number; // percentage, e.g. 12
  preferredAssets: string[];
}

export interface FinancialGoal {
  id: string;
  title: string;
  category: 'Emergency Fund' | 'Real Estate' | 'Vacation' | 'Retirement' | 'Vehicle' | 'Education' | 'Other';
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  icon: string;
  notes?: string;
}

export interface SalaryAllocationRule {
  essentialsPct: number; // default 50%
  savingsPct: number;    // default 20%
  investmentsPct: number;// default 15%
  lifestylePct: number;  // default 15%
}

export interface NetWorthAssets {
  cash: number;           // Cash, Savings Account, Liquid Funds, FDs
  investments: number;    // Stocks, Mutual Funds, Equity, SGB, Crypto
  retirement: number;     // EPF, PPF, NPS, Gratuity
  property: number;       // Real Estate, Housing, Land
  valuables: number;      // Gold/Silver jewelry, Vehicles, other assets
}

export interface NetWorthLiabilities {
  loans: number;          // Home, Vehicle, Education, Personal Loans
  creditCardDebt: number; // Credit card outstanding
  obligations: number;    // Family loans, pending EMIs, other obligations
}

export interface NetWorthData {
  assets: NetWorthAssets;
  liabilities: NetWorthLiabilities;
  monthlySavingsSIP: number;
  expectedAnnualReturnPct: number;
  sipStepUpPct: number;
  inflationRatePct: number;
  lastUpdated: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  currency: string;
  currencySymbol: string;
  monthlySalary: number;
  taxDeductionPct: number;
  budgetAlertThreshold: number; // e.g. 80%
  categoryLimits: Record<string, number>;
  salaryAllocation: SalaryAllocationRule;
  investmentPreferences: InvestmentPreference;
  netWorth?: NetWorthData;
}

export type AppTab = 'dashboard' | 'expenses' | 'salary' | 'goals' | 'recurring' | 'analytics';

export type SyncStatus = 'synced' | 'syncing' | 'offline';
