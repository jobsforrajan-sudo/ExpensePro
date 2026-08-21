import { Expense, FinancialGoal, UserProfile } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  id: 'usr_premium_01',
  name: 'Alex Morgan',
  email: 'alex.morgan@expensepro.io',
  currency: 'INR',
  currencySymbol: '₹',
  monthlySalary: 150000,
  taxDeductionPct: 10,
  budgetAlertThreshold: 80, // Alert when spend exceeds 80% of salary
  categoryLimits: {
    'Housing & Rent': 45000,
    'Groceries & Food': 18000,
    'Dining & Nightlife': 12000,
    'Transportation': 10000,
    'Utilities & Bills': 8000,
    'Healthcare & Fitness': 6000,
    'Entertainment & Leisure': 8000,
    'Shopping & Personal': 10000,
    'Education & Books': 5000,
    'Investments & Savings': 35000,
  },
  salaryAllocation: {
    essentialsPct: 50, // ₹75,000
    savingsPct: 20,    // ₹30,000
    investmentsPct: 15,// ₹22,500
    lifestylePct: 15,  // ₹22,500
  },
  investmentPreferences: {
    riskTolerance: 'Moderate',
    horizonYears: 10,
    expectedAnnualReturn: 12,
    preferredAssets: ['Nifty 50 Index Fund', 'Flexi-Cap Equity Funds', 'Public Provident Fund (PPF)', 'Sovereign Gold Bonds (SGB)'],
  },
  netWorth: {
    assets: {
      cash: 450000,         // Savings Accounts, Liquid Mutual Funds, High-yield FDs
      investments: 1850000, // Equities, Index Funds, Mutual Funds, Gold SGBs
      retirement: 920000,   // EPF, PPF, NPS corpus
      property: 4500000,    // Residential Real Estate market value
      valuables: 650000,    // Physical Gold, Vehicles, Collectibles
    },
    liabilities: {
      loans: 1800000,       // Home Loan / Auto Loan outstanding
      creditCardDebt: 45000,// Current month rolling credit card balances
      obligations: 120000,  // Pending personal commitments / EMIs
    },
    monthlySavingsSIP: 35000,
    expectedAnnualReturnPct: 12,
    sipStepUpPct: 10,
    inflationRatePct: 6,
    lastUpdated: '2026-08-20',
  },
};

export const INITIAL_FINANCIAL_GOALS: FinancialGoal[] = [
  {
    id: 'goal_1',
    title: '6-Month Emergency Buffer',
    category: 'Emergency Fund',
    targetAmount: 600000,
    currentAmount: 420000,
    targetDate: '2026-12-31',
    icon: 'ShieldCheck',
    notes: 'Kept in high-yield liquid mutual funds and fixed deposits.',
  },
  {
    id: 'goal_2',
    title: 'Apartment Down Payment',
    category: 'Real Estate',
    targetAmount: 2500000,
    currentAmount: 1150000,
    targetDate: '2028-06-30',
    icon: 'Home',
    notes: 'Target down payment for 3BHK residential property.',
  },
  {
    id: 'goal_3',
    title: 'Goa & International Vacation',
    category: 'Vacation',
    targetAmount: 200000,
    currentAmount: 145000,
    targetDate: '2026-11-15',
    icon: 'Plane',
    notes: 'Flights, resort bookings, and travel insurance.',
  },
];

// Helper to get dates relative to today
const today = new Date();
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatDate = (daysAgo: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - daysAgo);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Sample receipt SVG thumbnail as data URL for rich attachment demo in INR
const SAMPLE_RECEIPT_DATA_URL = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="550" viewBox="0 0 400 550" fill="none"><rect width="400" height="550" rx="12" fill="%23FFFFFF"/><rect x="24" y="24" width="352" height="502" rx="8" fill="%23F8FAFC" stroke="%23E2E8F0" stroke-width="2" stroke-dasharray="4 4"/><text x="200" y="70" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230F172A" text-anchor="middle">NATURE BASKET SUPERMARKET</text><text x="200" y="95" font-family="sans-serif" font-size="12" fill="%2364748B" text-anchor="middle">Tax Invoice %23NB-IN-89240</text><line x1="48" y1="120" x2="352" y2="120" stroke="%23CBD5E1" stroke-width="1.5"/><text x="48" y="155" font-family="sans-serif" font-size="14" fill="%23334155">Organic Almond Milk (2x)</text><text x="352" y="155" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230F172A" text-anchor="end">₹680.00</text><text x="48" y="190" font-family="sans-serif" font-size="14" fill="%23334155">Fresh Atlantic Salmon (1kg)</text><text x="352" y="190" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230F172A" text-anchor="end">₹1,850.00</text><text x="48" y="225" font-family="sans-serif" font-size="14" fill="%23334155">Organic Blueberries & Fruits</text><text x="352" y="225" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230F172A" text-anchor="end">₹750.00</text><text x="48" y="260" font-family="sans-serif" font-size="14" fill="%23334155">Avocado 4-Pack</text><text x="352" y="260" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230F172A" text-anchor="end">₹420.00</text><text x="48" y="295" font-family="sans-serif" font-size="14" fill="%23334155">Greek Yogurt & Cold-Pressed Olive Oil</text><text x="352" y="295" font-family="sans-serif" font-size="14" font-weight="bold" fill="%230F172A" text-anchor="end">₹1,150.00</text><line x1="48" y1="330" x2="352" y2="330" stroke="%23CBD5E1" stroke-width="1.5"/><text x="48" y="365" font-family="sans-serif" font-size="14" fill="%2364748B">Subtotal</text><text x="352" y="365" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="end">₹4,600.00</text><text x="48" y="395" font-family="sans-serif" font-size="14" fill="%2364748B">GST (5%)</text><text x="352" y="395" font-family="sans-serif" font-size="14" fill="%23334155" text-anchor="end">₹250.00</text><text x="48" y="440" font-family="sans-serif" font-size="18" font-weight="bold" fill="%230F172A">TOTAL PAID (INR)</text><text x="352" y="440" font-family="sans-serif" font-size="18" font-weight="bold" fill="%2310B981" text-anchor="end">₹4,850.00</text><text x="200" y="490" font-family="sans-serif" font-size="12" fill="%2394A3B8" text-anchor="middle">Paid via: UPI / Google Pay (HDFC Bank ****2104)</text><text x="200" y="510" font-family="sans-serif" font-size="11" fill="%2394A3B8" text-anchor="middle">GSTIN: 27AABCN8924M1Z2 • Verified digital tax invoice</text></svg>`;

export const INITIAL_EXPENSES: Expense[] = [
  {
    id: 'exp_1',
    name: 'Apartment Rent & Maintenance',
    amount: 35000,
    date: formatDate(1),
    category: 'Housing & Rent',
    paymentMethod: 'Bank Transfer',
    notes: 'Monthly residential lease and maintenance for Tower B #804',
    isRecurring: true,
    recurringFrequency: 'Monthly',
    nextDueDate: formatDate(-29),
    createdAt: Date.now() - 86400000,
    updatedAt: Date.now() - 86400000,
  },
  {
    id: 'exp_2',
    name: 'Nature Basket Supermarket Grocery Haul',
    amount: 4850,
    date: formatDate(2),
    category: 'Groceries & Food',
    paymentMethod: 'UPI',
    notes: 'Weekly groceries: olive oil, salmon, organic veggies, staples.',
    isRecurring: false,
    attachment: {
      id: 'att_1',
      name: 'nature_basket_invoice_2026.svg',
      size: 1420,
      type: 'image/svg+xml',
      dataUrl: SAMPLE_RECEIPT_DATA_URL,
    },
    createdAt: Date.now() - 172800000,
    updatedAt: Date.now() - 172800000,
  },
  {
    id: 'exp_3',
    name: 'Nifty 50 Index Mutual Fund SIP',
    amount: 20000,
    date: formatDate(3),
    category: 'Investments & Savings',
    paymentMethod: 'Bank Transfer',
    notes: 'Automated direct plan mutual fund SIP auto-debit.',
    isRecurring: true,
    recurringFrequency: 'Monthly',
    nextDueDate: formatDate(-27),
    createdAt: Date.now() - 259200000,
    updatedAt: Date.now() - 259200000,
  },
  {
    id: 'exp_4',
    name: 'Tata Power Electricity & Jio Fiber Bill',
    amount: 3450,
    date: formatDate(4),
    category: 'Utilities & Bills',
    paymentMethod: 'Credit Card',
    notes: '300 Mbps fiber broadband + monthly electricity consumption.',
    isRecurring: true,
    recurringFrequency: 'Monthly',
    nextDueDate: formatDate(-26),
    createdAt: Date.now() - 345600000,
    updatedAt: Date.now() - 345600000,
  },
  {
    id: 'exp_5',
    name: 'Dinner at Bukhara & Social',
    amount: 4600,
    date: formatDate(5),
    category: 'Dining & Nightlife',
    paymentMethod: 'Credit Card',
    notes: 'Family dining and weekend dinner celebration.',
    isRecurring: false,
    createdAt: Date.now() - 432000000,
    updatedAt: Date.now() - 432000000,
  },
  {
    id: 'exp_6',
    name: 'Cult.fit Elite Fitness Pass',
    amount: 3500,
    date: formatDate(7),
    category: 'Healthcare & Fitness',
    paymentMethod: 'Credit Card',
    notes: 'Monthly gym and fitness center membership access.',
    isRecurring: true,
    recurringFrequency: 'Monthly',
    nextDueDate: formatDate(-23),
    createdAt: Date.now() - 604800000,
    updatedAt: Date.now() - 604800000,
  },
  {
    id: 'exp_7',
    name: 'Uber Rides & Metro Card Recharge',
    amount: 2400,
    date: formatDate(8),
    category: 'Transportation',
    paymentMethod: 'UPI',
    notes: 'Metropolitan commute and airport cab rides.',
    isRecurring: false,
    createdAt: Date.now() - 691200000,
    updatedAt: Date.now() - 691200000,
  },
  {
    id: 'exp_8',
    name: 'AWS Cloud Certification & Tech Books',
    amount: 2200,
    date: formatDate(10),
    category: 'Education & Books',
    paymentMethod: 'Debit Card',
    notes: 'System architecture reference books & cloud course modules.',
    isRecurring: true,
    recurringFrequency: 'Monthly',
    nextDueDate: formatDate(-20),
    createdAt: Date.now() - 864000000,
    updatedAt: Date.now() - 864000000,
  },
  {
    id: 'exp_9',
    name: 'PVR IMAX Tickets & OTT Subscriptions',
    amount: 1499,
    date: formatDate(12),
    category: 'Entertainment & Leisure',
    paymentMethod: 'Credit Card',
    notes: 'IMAX movie weekend & Netflix 4K monthly sub.',
    isRecurring: false,
    createdAt: Date.now() - 1036800000,
    updatedAt: Date.now() - 1036800000,
  },
  {
    id: 'exp_10',
    name: 'Myntra Apparel & Footwear Order',
    amount: 4250,
    date: formatDate(14),
    category: 'Shopping & Personal',
    paymentMethod: 'Credit Card',
    notes: 'Formal blazers and running sneakers.',
    isRecurring: false,
    createdAt: Date.now() - 1209600000,
    updatedAt: Date.now() - 1209600000,
  },
];

export const CATEGORY_METADATA: Record<string, { color: string; bgLight: string; icon: string; description: string }> = {
  'Housing & Rent': {
    color: '#3B82F6',
    bgLight: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300',
    icon: 'Home',
    description: 'Mortgage, rent, property tax, maintenance',
  },
  'Groceries & Food': {
    color: '#10B981',
    bgLight: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300',
    icon: 'ShoppingBag',
    description: 'Supermarket, pantry, organic market produce',
  },
  'Dining & Nightlife': {
    color: '#F59E0B',
    bgLight: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300',
    icon: 'Utensils',
    description: 'Restaurants, cafes, takeout, social dining',
  },
  'Transportation': {
    color: '#6366F1',
    bgLight: 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300',
    icon: 'Car',
    description: 'Fuel, transit pass, rideshare, vehicle servicing',
  },
  'Utilities & Bills': {
    color: '#06B6D4',
    bgLight: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300',
    icon: 'Zap',
    description: 'Electricity, water, gas, high-speed fiber internet',
  },
  'Healthcare & Fitness': {
    color: '#EC4899',
    bgLight: 'bg-pink-50 text-pink-700 dark:bg-pink-950/40 dark:text-pink-300',
    icon: 'HeartPulse',
    description: 'Gym, medical copays, dental, pharmacy, supplements',
  },
  'Entertainment & Leisure': {
    color: '#8B5CF6',
    bgLight: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300',
    icon: 'Film',
    description: 'Streaming, movies, gaming, concert tickets',
  },
  'Shopping & Personal': {
    color: '#14B8A6',
    bgLight: 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300',
    icon: 'Tag',
    description: 'Apparel, accessories, tech gadgets, grooming',
  },
  'Education & Books': {
    color: '#F97316',
    bgLight: 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300',
    icon: 'GraduationCap',
    description: 'Courses, textbooks, audiobooks, certifications',
  },
  'Debt & Loan Repayment': {
    color: '#EF4444',
    bgLight: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300',
    icon: 'CreditCard',
    description: 'Student loan, personal loan, credit balance reduction',
  },
  'Investments & Savings': {
    color: '#059669',
    bgLight: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200',
    icon: 'TrendingUp',
    description: 'Index funds, SIP deposits, retirement 401k/IRA, equities',
  },
  'Miscellaneous': {
    color: '#64748B',
    bgLight: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
    icon: 'MoreHorizontal',
    description: 'Ad-hoc expenses, gifts, donations, one-offs',
  },
};
