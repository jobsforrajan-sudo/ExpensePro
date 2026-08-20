import React, { useState, useEffect } from 'react';
import { 
  X, 
  Settings, 
  IndianRupee, 
  ShieldAlert, 
  User, 
  Download, 
  UploadCloud, 
  RefreshCcw, 
  FileSpreadsheet, 
  Check, 
  CheckCircle2, 
  Trash2, 
  ArrowRightLeft, 
  RefreshCw, 
  Globe2, 
  TrendingUp,
  Database,
  Cloud,
  LogIn
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { UserProfile, Expense, FinancialGoal } from '../types';
import { exportExpensesToCSV, exportFullDataBackup } from '../utils/export';
import { 
  SUPPORTED_CURRENCIES, 
  DEFAULT_FALLBACK_RATES, 
  getStoredExchangeRates, 
  fetchLiveExchangeRates, 
  convertCurrency, 
  getConversionRate, 
  formatCurrencyValue,
  ExchangeRatesData 
} from '../utils/currency';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  onUpdateProfile: (profile: UserProfile) => void;
  expenses: Expense[];
  goals: FinancialGoal[];
  onImportBackup: (data: { expenses: Expense[]; goals: FinancialGoal[]; profile: UserProfile }) => void;
  onResetDemoData: () => void;
  exchangeRatesData?: ExchangeRatesData;
  onRefreshRates?: () => Promise<void>;
  currentUser?: FirebaseUser | null;
  onOpenAuth?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onUpdateProfile,
  expenses,
  goals,
  onImportBackup,
  onResetDemoData,
  exchangeRatesData: propExchangeRates,
  onRefreshRates,
  currentUser,
  onOpenAuth,
}) => {
  const [name, setName] = useState(userProfile.name);
  const [email, setEmail] = useState(userProfile.email);
  const [monthlySalary, setMonthlySalary] = useState(String(userProfile.monthlySalary));
  const [currency, setCurrency] = useState(userProfile.currency || 'INR');
  const [alertThreshold, setAlertThreshold] = useState(userProfile.budgetAlertThreshold);
  const [taxDeduction, setTaxDeduction] = useState(String(userProfile.taxDeductionPct || 0));

  // Currency Converter Utility State
  const [ratesData, setRatesData] = useState<ExchangeRatesData>(propExchangeRates || getStoredExchangeRates());
  const [calcAmount, setCalcAmount] = useState<string>('5000');
  const [calcFrom, setCalcFrom] = useState<string>(userProfile.currency || 'INR');
  const [calcTo, setCalcTo] = useState<string>(userProfile.currency === 'USD' ? 'EUR' : 'USD');
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);
  const [autoConvertSalary, setAutoConvertSalary] = useState(true);

  useEffect(() => {
    if (propExchangeRates) {
      setRatesData(propExchangeRates);
    }
  }, [propExchangeRates]);

  if (!isOpen) return null;

  const handleCurrencyChange = (newCode: string) => {
    const prevCode = currency;
    const matched = SUPPORTED_CURRENCIES.find(c => c.code === newCode);
    if (!matched) return;

    if (autoConvertSalary && prevCode !== newCode) {
      const currentSalaryVal = parseFloat(monthlySalary) || 0;
      if (currentSalaryVal > 0) {
        const converted = convertCurrency(currentSalaryVal, prevCode, newCode, ratesData.rates);
        setMonthlySalary(String(Math.round(converted)));
      }
    }

    setCurrency(matched.code);
  };

  const handleRefreshLiveRates = async () => {
    setIsRefreshingRates(true);
    try {
      if (onRefreshRates) {
        await onRefreshRates();
      } else {
        const updated = await fetchLiveExchangeRates();
        setRatesData(updated);
      }
    } finally {
      setIsRefreshingRates(false);
    }
  };

  const handleSwapCalculatorCurrencies = () => {
    const temp = calcFrom;
    setCalcFrom(calcTo);
    setCalcTo(temp);
  };

  const calculatedResult = convertCurrency(
    parseFloat(calcAmount) || 0,
    calcFrom,
    calcTo,
    ratesData.rates
  );
  const currentPairRate = getConversionRate(calcFrom, calcTo, ratesData.rates);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const matched = SUPPORTED_CURRENCIES.find(c => c.code === currency) || SUPPORTED_CURRENCIES[0];

    onUpdateProfile({
      ...userProfile,
      name: name.trim() || 'Alex Morgan',
      email: email.trim() || 'alex.morgan@expensepro.io',
      monthlySalary: Math.max(0, parseFloat(monthlySalary) || 0),
      currency: matched.code,
      currencySymbol: matched.symbol,
      budgetAlertThreshold: alertThreshold,
      taxDeductionPct: parseFloat(taxDeduction) || 0,
    });

    onClose();
  };

  const handleImportJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string);
        if (parsed.expenses && parsed.profile) {
          onImportBackup(parsed);
          alert('Backup data successfully restored!');
          onClose();
        } else {
          alert('Invalid ExpensePro backup JSON format.');
        }
      } catch (err) {
        alert('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in">
      <div 
        id="settings-modal-card"
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Settings & Currency Preferences</h2>
              <p className="text-xs text-slate-500">Configure salary, currency units, live exchange rates, and data backups</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto">
          
          {/* Cloud Database & Authentication Banner */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Database className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                    Firebase Auth & Firestore Database
                  </h3>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {currentUser 
                      ? `Connected: ${currentUser.email}`
                      : 'Local storage mode (Sign in with Google to enable cloud sync)'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAuth?.();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-sm transition"
              >
                {currentUser ? (
                  <>
                    <Database className="w-3.5 h-3.5" />
                    <span>Cloud Sync</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>

            {currentUser && (
              <div className="flex items-center gap-2 text-[11px] text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-lg border border-emerald-200/60 dark:border-emerald-800/60">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>All modifications persist in real-time to Google Cloud Firestore.</span>
              </div>
            )}
          </div>

          {/* User Account Details */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Account Identity</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Salary & Primary Currency */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Financial Baseline & Primary Currency</h3>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-500 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={autoConvertSalary} 
                  onChange={(e) => setAutoConvertSalary(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                Auto-convert salary on currency switch
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Monthly Gross Salary
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">
                    {SUPPORTED_CURRENCIES.find(c => c.code === currency)?.symbol || '₹'}
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={monthlySalary}
                    onChange={(e) => setMonthlySalary(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Primary Base Currency
                </label>
                <select
                  value={currency}
                  onChange={(e) => handleCurrencyChange(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>
                      {c.flag} {c.code} — {c.name} ({c.symbol})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Real-time Currency Converter Utility */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <Globe2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white">Real-Time Currency Converter Utility</h3>
                  <p className="text-[11px] text-slate-500">Live exchange rate calculator & global FX matrix</p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRefreshLiveRates}
                disabled={isRefreshingRates}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 rounded-lg border border-indigo-200 dark:border-indigo-800 transition"
              >
                <RefreshCw className={`w-3 h-3 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                {isRefreshingRates ? 'Fetching...' : 'Sync Live Rates'}
              </button>
            </div>

            {/* Converter Input Controls */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-2">
              <div className="sm:col-span-4">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">Amount</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                  placeholder="1000"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">From</label>
                <select
                  value={calcFrom}
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex justify-center pt-3">
                <button
                  type="button"
                  onClick={handleSwapCalculatorCurrencies}
                  className="p-1.5 rounded-lg bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 transition"
                  title="Swap currencies"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="sm:col-span-4">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1 uppercase">To</label>
                <select
                  value={calcTo}
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Real-Time Conversion Output Card */}
            <div className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between">
              <div>
                <div className="text-[11px] text-slate-500 font-medium">
                  {formatCurrencyValue(parseFloat(calcAmount) || 0, calcFrom, true)} =
                </div>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrencyValue(calculatedResult, calcTo, true)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-slate-400">
                  1 {calcFrom} = {currentPairRate.toFixed(4)} {calcTo}
                </div>
                <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  {ratesData.source === 'live' ? 'Live API Exchange Rate' : 'Synced Exchange Rate'}
                </div>
              </div>
            </div>

            {/* Quick World Currency FX Rate Grid */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Quick Exchange Rate Matrix (1 {currency} = )
              </span>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                {SUPPORTED_CURRENCIES.filter(c => c.code !== currency).slice(0, 6).map(c => {
                  const rate = getConversionRate(currency, c.code, ratesData.rates);
                  return (
                    <div key={c.code} className="p-1.5 bg-white dark:bg-slate-900 border border-slate-200/70 dark:border-slate-700/70 rounded-lg text-center">
                      <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1">
                        <span>{c.flag}</span> <span>{c.code}</span>
                      </div>
                      <div className="text-[11px] font-bold text-slate-900 dark:text-white">
                        {rate >= 100 ? rate.toFixed(1) : rate >= 1 ? rate.toFixed(2) : rate.toFixed(3)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Budget Threshold Alert Slider */}
          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Monthly Budget Alert Threshold Warning
              </label>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                {alertThreshold}% of Salary
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={alertThreshold}
              onChange={(e) => setAlertThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
            <p className="text-[10px] text-slate-400">
              Triggers warning banner on Dashboard when current month spending exceeds this percentage.
            </p>
          </div>

          {/* Data Backup & Restore */}
          <div className="space-y-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Data Management & Export</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => exportExpensesToCSV(expenses, userProfile.currencySymbol)}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" /> Export CSV Statement
              </button>

              <button
                type="button"
                onClick={() => exportFullDataBackup({ expenses, goals, profile: userProfile })}
                className="flex items-center justify-center gap-1.5 p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" /> Backup JSON Snapshot
              </button>
            </div>

            <div className="flex items-center justify-between pt-2">
              <label className="cursor-pointer text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                <UploadCloud className="w-3.5 h-3.5" /> Restore from JSON Backup
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportJSON}
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all expenses and goals back to default demo seeds?')) {
                    onResetDemoData();
                    onClose();
                  }
                }}
                className="text-xs text-rose-600 hover:underline flex items-center gap-1 font-semibold"
              >
                <RefreshCcw className="w-3.5 h-3.5" /> Reset Demo Data
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
            >
              <Check className="w-4 h-4" /> Save Preferences
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

