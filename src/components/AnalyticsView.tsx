import React, { useState, useEffect, useRef } from 'react';
import { 
  BarChart3, 
  CreditCard, 
  PieChart as PieIcon, 
  TrendingUp, 
  Layers, 
  ArrowUpRight,
  IndianRupee,
  ShieldCheck,
  Globe2,
  RefreshCw,
  ArrowRightLeft,
  Coins,
  Sparkles,
  Info
} from 'lucide-react';
import { Chart, DoughnutController, ArcElement, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
import { Expense, UserProfile } from '../types';
import { formatCurrency } from '../utils/calculations';
import { CATEGORY_METADATA } from '../data/initialData';
import { 
  SUPPORTED_CURRENCIES, 
  convertCurrency, 
  getConversionRate, 
  formatCurrencyValue, 
  ExchangeRatesData, 
  getStoredExchangeRates,
  fetchLiveExchangeRates
} from '../utils/currency';

Chart.register(DoughnutController, ArcElement, BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

interface AnalyticsViewProps {
  expenses: Expense[];
  userProfile: UserProfile;
  exchangeRatesData?: ExchangeRatesData;
  onRefreshRates?: () => Promise<void>;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({
  expenses,
  userProfile,
  exchangeRatesData: propExchangeRates,
  onRefreshRates,
}) => {
  const baseCurrency = userProfile.currency || 'INR';
  const [reportingCurrency, setReportingCurrency] = useState<string>(baseCurrency);
  const [ratesData, setRatesData] = useState<ExchangeRatesData>(propExchangeRates || getStoredExchangeRates());
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  // Quick In-View FX Calculator state
  const [calcAmount, setCalcAmount] = useState<string>('10000');
  const [calcFrom, setCalcFrom] = useState<string>(baseCurrency);
  const [calcTo, setCalcTo] = useState<string>(reportingCurrency === 'USD' ? 'EUR' : 'USD');

  useEffect(() => {
    if (propExchangeRates) {
      setRatesData(propExchangeRates);
    }
  }, [propExchangeRates]);

  const handleRefreshRates = async () => {
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

  const currentReportCurrencyInfo = SUPPORTED_CURRENCIES.find(c => c.code === reportingCurrency) || SUPPORTED_CURRENCIES[0];
  const symbol = currentReportCurrencyInfo.symbol;

  const fxMultiplier = getConversionRate(baseCurrency, reportingCurrency, ratesData.rates);
  const isConverted = reportingCurrency !== baseCurrency;

  const paymentCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const monthlyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const paymentChartInstance = useRef<Chart | null>(null);
  const monthlyChartInstance = useRef<Chart | null>(null);

  // Helper to convert any raw base amount to current reporting currency
  const toReportAmount = (amountInBase: number) => {
    if (!isConverted) return amountInBase;
    return convertCurrency(amountInBase, baseCurrency, reportingCurrency, ratesData.rates);
  };

  // Compute Payment Method aggregates in reporting currency
  const paymentMethodTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const amt = toReportAmount(e.amount);
    paymentMethodTotals[e.paymentMethod] = (paymentMethodTotals[e.paymentMethod] || 0) + amt;
  });

  // Compute Category Aggregates in reporting currency
  const categoryTotals: Record<string, number> = {};
  expenses.forEach(e => {
    const amt = toReportAmount(e.amount);
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amt;
  });

  const totalAllTimeSpent = expenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalReportSpent = toReportAmount(totalAllTimeSpent);
  const convertedSalary = toReportAmount(userProfile.monthlySalary);

  // Payment Method Doughnut Chart
  useEffect(() => {
    if (!paymentCanvasRef.current) return;
    if (paymentChartInstance.current) paymentChartInstance.current.destroy();

    const ctx = paymentCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const labels = Object.keys(paymentMethodTotals);
    const data = Object.values(paymentMethodTotals);
    const bgColors = ['#3B82F6', '#10B981', '#F59E0B', '#6366F1', '#EC4899', '#8B5CF6'];

    paymentChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: data.length > 0 ? data : [1],
            backgroundColor: data.length > 0 ? bgColors : ['#E2E8F0'],
            borderWidth: 0,
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: { position: 'bottom', labels: { boxWidth: 12, font: { size: 11 } } },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.label}: ${formatCurrency(context.raw as number, symbol, true)}`,
            },
          },
        },
      },
    });

    return () => {
      if (paymentChartInstance.current) paymentChartInstance.current.destroy();
    };
  }, [paymentMethodTotals, symbol]);

  // Monthly Comparison Bar Chart (Simulated 6 month historical flow with reporting currency conversion)
  useEffect(() => {
    if (!monthlyCanvasRef.current) return;
    if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();

    const ctx = monthlyCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
    const salaryBase = userProfile.monthlySalary || 150000;
    const baseHistoricalSpend = [
      Math.round(salaryBase * 0.52),
      Math.round(salaryBase * 0.58),
      Math.round(salaryBase * 0.49),
      Math.round(salaryBase * 0.61),
      Math.round(salaryBase * 0.54),
      Math.round(totalAllTimeSpent)
    ];
    const historicalSpend = baseHistoricalSpend.map(amt => Math.round(toReportAmount(amt)));
    const salaryBench = months.map(() => Math.round(convertedSalary));

    monthlyChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: months,
        datasets: [
          {
            label: `Monthly Spend (${reportingCurrency})`,
            data: historicalSpend,
            backgroundColor: '#3B82F6',
            borderRadius: 6,
            barThickness: 20,
          },
          {
            label: `Gross Salary Benchmark (${reportingCurrency})`,
            data: salaryBench,
            backgroundColor: 'rgba(16, 185, 129, 0.2)',
            borderColor: '#10B981',
            borderWidth: 1,
            borderRadius: 6,
            barThickness: 20,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: { grid: { display: false } },
          y: {
            grid: { color: 'rgba(226, 232, 240, 0.4)' },
            ticks: { callback: (val) => `${symbol}${val}` },
          },
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 11, weight: 'bold' } } },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw as number, symbol)}`,
            },
          },
        },
      },
    });

    return () => {
      if (monthlyChartInstance.current) monthlyChartInstance.current.destroy();
    };
  }, [totalAllTimeSpent, convertedSalary, reportingCurrency, symbol, fxMultiplier]);

  const quickCalcResult = convertCurrency(
    parseFloat(calcAmount) || 0,
    calcFrom,
    calcTo,
    ratesData.rates
  );
  const quickCalcRate = getConversionRate(calcFrom, calcTo, ratesData.rates);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header & Reporting Currency Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <BarChart3 className="w-6 h-6 text-blue-600" />
            Financial Intelligence & Cash Flow Analytics
          </h1>
          <p className="text-xs text-slate-500">
            Multi-currency cash flow reporting, payment method distribution, and real-time exchange rates
          </p>
        </div>

        {/* Currency Switcher Pill Group */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-900 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm shrink-0 self-start md:self-auto">
          <div className="flex items-center gap-1 pl-2 pr-1 text-slate-400 text-xs font-semibold">
            <Globe2 className="w-3.5 h-3.5 text-indigo-500" />
            <span className="hidden sm:inline">Report:</span>
          </div>

          <div className="flex items-center gap-1 overflow-x-auto max-w-xs sm:max-w-none py-0.5">
            {SUPPORTED_CURRENCIES.slice(0, 5).map(c => (
              <button
                key={c.code}
                onClick={() => setReportingCurrency(c.code)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 whitespace-nowrap ${
                  reportingCurrency === c.code
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>{c.flag}</span>
                <span>{c.code}</span>
              </button>
            ))}

            <select
              value={SUPPORTED_CURRENCIES.slice(0, 5).some(c => c.code === reportingCurrency) ? '' : reportingCurrency}
              onChange={(e) => {
                if (e.target.value) setReportingCurrency(e.target.value);
              }}
              className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-lg border-0 outline-none cursor-pointer"
            >
              <option value="" disabled>More...</option>
              {SUPPORTED_CURRENCIES.slice(5).map(c => (
                <option key={c.code} value={c.code}>{c.flag} {c.code} ({c.symbol})</option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRefreshRates}
            disabled={isRefreshingRates}
            title="Refresh live exchange rates"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin text-blue-600' : ''}`} />
          </button>
        </div>
      </div>

      {/* Real-time FX Rate Adjustment Notification Banner */}
      {isConverted && (
        <div className="p-3.5 bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/80 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5 text-indigo-900 dark:text-indigo-200">
            <Sparkles className="w-4 h-4 text-indigo-500 shrink-0" />
            <div>
              <span className="font-bold">Real-Time Currency Conversion Active:</span> Viewing all financial metrics converted from <strong>{baseCurrency}</strong> into <strong>{reportingCurrency} ({symbol})</strong> at rate <strong>1 {baseCurrency} = {fxMultiplier.toFixed(4)} {reportingCurrency}</strong>.
            </div>
          </div>
          <button
            onClick={() => setReportingCurrency(baseCurrency)}
            className="px-3 py-1 bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 font-bold rounded-lg border border-indigo-200 dark:border-indigo-800 hover:bg-indigo-50 text-[11px] self-start sm:self-auto shrink-0 transition"
          >
            Reset to Base ({baseCurrency})
          </button>
        </div>
      )}

      {/* Analytics Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Payment Methods Chart */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-500" />
                Payment Method Breakdown
              </h3>
              <span className="text-[11px] font-bold text-slate-400">
                {reportingCurrency}
              </span>
            </div>
            <div className="relative h-60 w-full my-4">
              <canvas ref={paymentCanvasRef} />
            </div>
          </div>

          <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
            {Object.entries(paymentMethodTotals).map(([pm, amt]) => (
              <div key={pm} className="flex justify-between items-center py-0.5">
                <span className="font-medium text-slate-600 dark:text-slate-400">{pm}</span>
                <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(amt, symbol, true)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 6-Month Velocity Bar Chart */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                6-Month Spending vs Income Trajectory
              </h3>
              <span className="text-xs text-slate-400">
                Benchmark: {formatCurrency(convertedSalary, symbol)}/mo
              </span>
            </div>
            <div className="h-64 w-full pt-4">
              <canvas ref={monthlyCanvasRef} />
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl mt-4 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between">
            <span>
              All-time converted expenditures ({reportingCurrency}): <strong className="text-slate-900 dark:text-white">{formatCurrency(totalReportSpent, symbol, true)}</strong>
            </span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Stable Burn Rate</span>
          </div>
        </div>

      </div>

      {/* Global Multi-Currency Exposure Matrix & Quick FX Converter */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Multi-Currency Exposure Table */}
        <div className="lg:col-span-7 p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <Coins className="w-4 h-4 text-amber-500" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Global Multi-Currency Valuation Matrix
              </h3>
            </div>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
              {ratesData.source === 'live' ? '● Live FX Rates' : '● Synced Rates'}
            </span>
          </div>

          <p className="text-xs text-slate-500">
            Instant valuation of your all-time expenditures ({formatCurrencyValue(totalAllTimeSpent, baseCurrency)}) converted across major world currencies:
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {SUPPORTED_CURRENCIES.slice(0, 8).map(c => {
              const convertedVal = convertCurrency(totalAllTimeSpent, baseCurrency, c.code, ratesData.rates);
              const rate = getConversionRate(baseCurrency, c.code, ratesData.rates);
              const isSelected = reportingCurrency === c.code;

              return (
                <div 
                  key={c.code}
                  onClick={() => setReportingCurrency(c.code)}
                  className={`p-3 rounded-xl border transition cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/70 border-blue-300 dark:bg-blue-950/40 dark:border-blue-700' 
                      : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                      <span>{c.flag}</span> <span>{c.code}</span>
                    </span>
                    {isSelected && (
                      <span className="text-[9px] font-bold text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/60 px-1.5 py-0.2 rounded">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-sm font-black text-slate-900 dark:text-white truncate">
                    {formatCurrencyValue(convertedVal, c.code, false)}
                  </div>
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    1 {baseCurrency} = {rate >= 100 ? rate.toFixed(1) : rate >= 1 ? rate.toFixed(2) : rate.toFixed(4)} {c.code}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* In-Analytics Interactive Currency Converter */}
        <div className="lg:col-span-5 p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Globe2 className="w-4 h-4 text-indigo-500" />
                <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                  On-the-Fly FX Converter
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Fast FX Tool</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center pt-3">
              <div className="sm:col-span-5">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">AMOUNT</label>
                <input
                  type="number"
                  value={calcAmount}
                  onChange={(e) => setCalcAmount(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-900 dark:text-white outline-none"
                />
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">FROM</label>
                <select
                  value={calcFrom}
                  onChange={(e) => setCalcFrom(e.target.value)}
                  className="w-full px-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-1 flex justify-center pt-3">
                <button
                  type="button"
                  onClick={() => {
                    const tmp = calcFrom;
                    setCalcFrom(calcTo);
                    setCalcTo(tmp);
                  }}
                  className="p-1 rounded bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-600 dark:text-slate-300"
                >
                  <ArrowRightLeft className="w-3 h-3" />
                </button>
              </div>

              <div className="sm:col-span-3">
                <label className="block text-[10px] font-semibold text-slate-500 mb-1">TO</label>
                <select
                  value={calcTo}
                  onChange={(e) => setCalcTo(e.target.value)}
                  className="w-full px-1.5 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-900 dark:text-white outline-none"
                >
                  {SUPPORTED_CURRENCIES.map(c => (
                    <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700 rounded-xl mt-3 flex items-center justify-between">
              <div>
                <div className="text-[10px] text-slate-500">Converted Output</div>
                <div className="text-base font-black text-indigo-600 dark:text-indigo-400">
                  {formatCurrencyValue(quickCalcResult, calcTo, true)}
                </div>
              </div>
              <div className="text-right text-[10px] text-slate-400">
                1 {calcFrom} = {quickCalcRate.toFixed(4)} {calcTo}
              </div>
            </div>
          </div>

          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Info className="w-3 h-3 text-slate-400" />
            <span>Conversions update automatically using live mid-market rates.</span>
          </div>
        </div>

      </div>

      {/* Category In-Depth Summary Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-indigo-500" />
            Category Spending Intensity ({reportingCurrency})
          </h3>
          <span className="text-xs text-slate-400">
            Units in {reportingCurrency} ({symbol})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(CATEGORY_METADATA).map(([cat, meta]) => {
            const spent = categoryTotals[cat] || 0;
            const baseLimit = userProfile.categoryLimits[cat] || 500;
            const limit = toReportAmount(baseLimit);
            const pct = Math.round((spent / (limit || 1)) * 100);

            return (
              <div key={cat} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/60 dark:border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-bold text-xs text-slate-900 dark:text-white truncate">{cat}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Limit: {formatCurrency(limit, symbol)}</span>
                </div>
                <div className="text-lg font-black text-slate-900 dark:text-white">
                  {formatCurrency(spent, symbol, true)}
                </div>
                <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${pct > 100 ? 'bg-rose-500' : 'bg-blue-600'}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{pct}% utilized</span>
                  <span className={pct > 100 ? 'text-rose-600 font-bold' : 'text-slate-400'}>
                    {pct > 100 ? 'Over limit' : `${formatCurrency(Math.max(0, limit - spent), symbol)} left`}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
};

