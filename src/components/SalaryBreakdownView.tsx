import React, { useState, useEffect, useRef } from 'react';
import { 
  IndianRupee, 
  PieChart as PieIcon, 
  TrendingUp, 
  ShieldCheck, 
  Sliders, 
  Sparkles, 
  Info, 
  Layers, 
  Compass, 
  Calendar,
  Percent,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  BellRing,
  ShieldAlert,
  Zap,
  ArrowUpRight
} from 'lucide-react';
import { Chart, LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler } from 'chart.js';
import { Expense, UserProfile, SalaryAllocationRule, RiskTolerance } from '../types';
import { 
  calculateMonthlySummary, 
  calculateCompoundInterest, 
  calculateSIP, 
  calculateRequiredSIPForGoal,
  formatCurrency 
} from '../utils/calculations';
import { checkBudgetAlert, triggerBudgetAlertToast, BudgetAlertReport } from '../services/budgetAlertService';

// Register Chart.js components
Chart.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Tooltip, Legend, Filler);

interface SalaryBreakdownViewProps {
  expenses: Expense[];
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onToast?: (message: string) => void;
}

export const SalaryBreakdownView: React.FC<SalaryBreakdownViewProps> = ({
  expenses,
  userProfile,
  onUpdateProfile,
  onToast,
}) => {
  const symbol = userProfile.currencySymbol || '₹';
  const summary = calculateMonthlySummary(expenses, userProfile.monthlySalary, userProfile.salaryAllocation);

  // Budget Alert Service State & Evaluation
  const [alertThreshold, setAlertThreshold] = useState<number>(userProfile.budgetAlertThreshold || 90);
  const budgetAlertReport: BudgetAlertReport = checkBudgetAlert(expenses, userProfile, alertThreshold);
  const lastAlertFiredRef = useRef<string>('');

  // Automated Budget Alert Notification Toast Service (triggers if expenses exceed 90% of allocated budget)
  useEffect(() => {
    if (budgetAlertReport.isAlertTriggered && onToast) {
      const signature = `${budgetAlertReport.targetMonth}-${budgetAlertReport.totalSpent}-${budgetAlertReport.budgetLimit}-${alertThreshold}`;
      if (lastAlertFiredRef.current !== signature) {
        lastAlertFiredRef.current = signature;
        onToast(budgetAlertReport.toastMessage);
      }
    }
  }, [budgetAlertReport, onToast, alertThreshold]);

  // Active Tab for Calculators: 'sip' | 'compound' | 'goalPlanner'
  const [calcTab, setCalcTab] = useState<'sip' | 'compound' | 'goalPlanner'>('sip');

  // SIP Calculator State
  const [sipMonthly, setSipMonthly] = useState(
    Math.max(500, Math.round((userProfile.monthlySalary * userProfile.salaryAllocation.investmentsPct) / 100))
  );
  const [sipReturnRate, setSipReturnRate] = useState(userProfile.investmentPreferences.expectedAnnualReturn || 12);
  const [sipYears, setSipYears] = useState(userProfile.investmentPreferences.horizonYears || 10);
  const [sipStepUp, setSipStepUp] = useState(0);

  // Compound Interest State
  const [ciPrincipal, setCiPrincipal] = useState(userProfile.currency === 'USD' ? 10000 : 500000);
  const [ciReturnRate, setCiReturnRate] = useState(8);
  const [ciYears, setCiYears] = useState(10);
  const [ciCompounding, setCiCompounding] = useState(12); // monthly

  // Goal Planner State
  const [goalTargetAmount, setGoalTargetAmount] = useState(userProfile.currency === 'USD' ? 50000 : 2500000);
  const [goalReturnRate, setGoalReturnRate] = useState(12);
  const [goalYears, setGoalYears] = useState(5);

  // Risk Tolerance for suggestions
  const [activeRisk, setActiveRisk] = useState<RiskTolerance>(userProfile.investmentPreferences.riskTolerance);

  // Chart Canvas Reference
  const projectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);

  // Computed results
  const sipResult = calculateSIP(sipMonthly, sipReturnRate, sipYears, sipStepUp);
  const ciResult = calculateCompoundInterest(ciPrincipal, ciReturnRate, ciYears, ciCompounding);
  const goalRequiredSip = calculateRequiredSIPForGoal(goalTargetAmount, goalReturnRate, goalYears);

  // Generic Investment Suggestions by Risk Profile
  const investmentProfiles: Record<RiskTolerance, {
    title: string;
    expectedReturn: string;
    description: string;
    portfolio: { asset: string; pct: number; color: string; desc: string }[];
    recommendation: string;
  }> = {
    Conservative: {
      title: 'Capital Preservation & Steady Yield',
      expectedReturn: '6.5% – 8.5% p.a.',
      description: 'Prioritizes safety, low volatility, and liquid cash buffers with steady yield.',
      portfolio: [
        { asset: 'High-Yield Liquid Cash / Treasuries', pct: 30, color: '#3B82F6', desc: 'Guaranteed liquidity and emergency buffer' },
        { asset: 'Government & Corporate Bonds', pct: 35, color: '#10B981', desc: 'Predictable coupon returns and lower drawdowns' },
        { asset: 'Large-Cap Index Funds (S&P 500)', pct: 20, color: '#6366F1', desc: 'Blue-chip equity dividend exposure' },
        { asset: 'Physical Gold / Sovereign Gold', pct: 10, color: '#F59E0B', desc: 'Inflation hedge and safe haven' },
        { asset: 'Fixed Term Deposits', pct: 5, color: '#64748B', desc: 'Capital locked fixed rate instruments' },
      ],
      recommendation: 'Ideal for emergency funds or investment horizons under 3 years where volatility must be minimized.',
    },
    Moderate: {
      title: 'Balanced Growth & Wealth Accumulation',
      expectedReturn: '10.0% – 13.5% p.a.',
      description: 'Optimal balance of market growth, dividend reinvestment, and defensive hedges.',
      portfolio: [
        { asset: 'Large-Cap Index Funds (S&P 500 / Total Stock)', pct: 45, color: '#3B82F6', desc: 'Core global engine for compounding returns' },
        { asset: 'Mid-Cap & Tech Growth Equities', pct: 15, color: '#8B5CF6', desc: 'High-performing sector upside' },
        { asset: 'High-Grade Corporate Debt / Bonds', pct: 20, color: '#10B981', desc: 'Fixed income ballast during market swings' },
        { asset: 'Real Estate Investment Trusts (REITs)', pct: 10, color: '#06B6D4', desc: 'Commercial real estate cash-flow dividends' },
        { asset: 'Gold & Commodities', pct: 10, color: '#F59E0B', desc: 'Macro hedge against currency debasement' },
      ],
      recommendation: 'Recommended for 5 to 15-year wealth creation goals. Rebalance annually to lock in profits.',
    },
    Aggressive: {
      title: 'Maximum Capital Appreciation & Alpha',
      expectedReturn: '14.0% – 18.5% p.a.',
      description: 'Focuses heavily on equities, disruption themes, and high compounding velocity.',
      portfolio: [
        { asset: 'Broad Market Equity Index (Total Market)', pct: 35, color: '#3B82F6', desc: 'Broad exposure to global corporate profits' },
        { asset: 'Small & Mid-Cap High Growth Equities', pct: 30, color: '#8B5CF6', desc: 'Accelerated revenue leaders and multipliers' },
        { asset: 'Global Technology & Innovation Funds', pct: 15, color: '#EC4899', desc: 'AI, semiconductor, and clean-tech leaders' },
        { asset: 'Real Estate / Growth REITs', pct: 10, color: '#06B6D4', desc: 'Infrastructure and residential yield' },
        { asset: 'Emerging Markets & Digital Assets', pct: 10, color: '#F97316', desc: 'Asymmetric risk-adjusted upside' },
      ],
      recommendation: 'Best for 10+ year horizons where market pullbacks can be dollar-cost-averaged aggressively.',
    },
  };

  // Update Allocation Preset
  const handleApplyPreset = (preset: SalaryAllocationRule) => {
    onUpdateProfile({
      ...userProfile,
      salaryAllocation: preset,
    });
  };

  // Render Projection Chart for SIP or Compound Interest
  useEffect(() => {
    if (!projectionCanvasRef.current) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = projectionCanvasRef.current.getContext('2d');
    if (!ctx) return;

    let labels: string[] = [];
    let investedData: number[] = [];
    let totalData: number[] = [];

    if (calcTab === 'sip') {
      labels = sipResult.yearlyBreakdown.map(b => `Yr ${b.year}`);
      investedData = sipResult.yearlyBreakdown.map(b => b.invested);
      totalData = sipResult.yearlyBreakdown.map(b => b.total);
    } else {
      labels = ciResult.yearlyBreakdown.map(b => `Yr ${b.year}`);
      investedData = ciResult.yearlyBreakdown.map(b => b.invested);
      totalData = ciResult.yearlyBreakdown.map(b => b.total);
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        labels,
        datasets: [
          {
            label: 'Total Accumulated Wealth',
            data: totalData,
            borderColor: '#2563EB',
            backgroundColor: 'rgba(37, 99, 235, 0.12)',
            fill: true,
            tension: 0.35,
            pointBackgroundColor: '#2563EB',
            pointRadius: 4,
          },
          {
            label: 'Total Capital Invested',
            data: investedData,
            borderColor: '#94A3B8',
            borderDash: [5, 5],
            backgroundColor: 'transparent',
            tension: 0.1,
            pointRadius: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 } },
          },
          y: {
            grid: { color: 'rgba(226, 232, 240, 0.4)' },
            ticks: {
              font: { size: 11 },
              callback: (val) => `${symbol}${Number(val).toLocaleString()}`,
            },
          },
        },
        plugins: {
          legend: {
            position: 'top',
            labels: { font: { size: 11, weight: 'bold' } },
          },
          tooltip: {
            callbacks: {
              label: (context) => ` ${context.dataset.label}: ${formatCurrency(context.raw as number, symbol)}`,
            },
          },
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [calcTab, sipResult, ciResult, symbol]);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Section */}
      <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-semibold text-blue-200 mb-3 border border-white/10">
            <PieIcon className="w-3.5 h-3.5" /> Comprehensive Wealth Allocation Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
            Monthly Salary Breakdown & Compounding Engine
          </h1>
          <p className="text-sm text-blue-100 mt-2 leading-relaxed">
            Architect your monthly gross salary of <span className="font-bold text-white underline">{formatCurrency(userProfile.monthlySalary, symbol)}</span> into structured buckets (Essentials, Savings, Investments, Lifestyle), review personalized portfolio suggestions, and simulate compound wealth accumulation.
          </p>
        </div>
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* Budget Alert Service & Limit Sentinel */}
      <div className={`border rounded-2xl p-6 shadow-sm space-y-5 transition-all duration-300 ${
        budgetAlertReport.status === 'exceeded'
          ? 'bg-rose-50/70 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 ring-2 ring-rose-500/20'
          : budgetAlertReport.status === 'critical'
          ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 ring-2 ring-amber-500/20'
          : budgetAlertReport.status === 'caution'
          ? 'bg-amber-50/40 dark:bg-slate-900 border-amber-200 dark:border-slate-800'
          : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
      }`}>
        
        {/* Sentinel Top Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/60 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              budgetAlertReport.status === 'exceeded' || budgetAlertReport.status === 'critical'
                ? 'bg-rose-600 text-white animate-pulse shadow-md shadow-rose-500/30'
                : budgetAlertReport.status === 'caution'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
            }`}>
              {budgetAlertReport.status === 'exceeded' ? (
                <ShieldAlert className="w-5 h-5" />
              ) : budgetAlertReport.status === 'critical' ? (
                <AlertTriangle className="w-5 h-5" />
              ) : (
                <ShieldCheck className="w-5 h-5" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 dark:text-white">
                  Budget Alert Sentinel
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                  budgetAlertReport.status === 'exceeded'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : budgetAlertReport.status === 'critical'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : budgetAlertReport.status === 'caution'
                    ? 'bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200'
                    : 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                }`}>
                  {budgetAlertReport.status === 'exceeded'
                    ? '🚨 100%+ Limit Exceeded'
                    : budgetAlertReport.status === 'critical'
                    ? '⚠️ 90%+ Threshold Alert'
                    : budgetAlertReport.status === 'caution'
                    ? '⚡ Approaching Limit'
                    : '✅ Healthy Spend Limit'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated monthly monitor comparing total expenditures vs. allocated gross budget with 90% threshold triggers
              </p>
            </div>
          </div>

          {/* Action Buttons & Sensitivity Control */}
          <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              <span className="px-2 text-slate-400 text-[10px] uppercase font-bold">Alert At:</span>
              {[90, 85, 80].map((thr) => (
                <button
                  key={thr}
                  onClick={() => {
                    setAlertThreshold(thr);
                    onUpdateProfile({
                      ...userProfile,
                      budgetAlertThreshold: thr,
                    });
                    if (onToast) {
                      onToast(`Budget alert threshold updated to ${thr}% of monthly allocation.`);
                    }
                  }}
                  className={`px-2.5 py-1 rounded-lg transition ${
                    alertThreshold === thr
                      ? 'bg-blue-600 text-white font-bold shadow-xs'
                      : 'hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {thr}%
                </button>
              ))}
            </div>

            <button
              onClick={() => {
                if (onToast) {
                  triggerBudgetAlertToast(expenses, userProfile, onToast, alertThreshold, true);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs font-bold rounded-xl transition shadow-xs"
              title="Run on-demand budget check and send notification toast"
            >
              <BellRing className="w-3.5 h-3.5" />
              <span>Run Budget Check</span>
            </button>
          </div>
        </div>

        {/* Sentinel Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Monthly Spend
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white flex items-baseline gap-1.5">
              <span>{formatCurrency(budgetAlertReport.totalSpent, symbol)}</span>
              <span className="text-xs font-semibold text-slate-400">
                / {formatCurrency(budgetAlertReport.budgetLimit, symbol)}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Across {summary.itemCount} ledger transaction{summary.itemCount === 1 ? '' : 's'} this month
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Budget Utilization
            </span>
            <div className={`text-lg font-black flex items-baseline gap-1.5 ${
              budgetAlertReport.status === 'exceeded'
                ? 'text-rose-600 dark:text-rose-400'
                : budgetAlertReport.status === 'critical'
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-emerald-600 dark:text-emerald-400'
            }`}>
              <span>{budgetAlertReport.utilizationPct}%</span>
              <span className="text-xs font-semibold text-slate-400">
                (Alert limit: {budgetAlertReport.thresholdPct}%)
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              {budgetAlertReport.utilizationPct >= budgetAlertReport.thresholdPct
                ? `Exceeded alert ceiling by +${(budgetAlertReport.utilizationPct - budgetAlertReport.thresholdPct).toFixed(1)}%`
                : `${(budgetAlertReport.thresholdPct - budgetAlertReport.utilizationPct).toFixed(1)}% safety buffer remaining`}
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700/60 space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Safe Remaining Headroom
            </span>
            <div className="text-lg font-black text-slate-900 dark:text-white">
              {formatCurrency(budgetAlertReport.remainingSafeBudget, symbol)}
            </div>
            <p className="text-[11px] text-slate-500">
              {budgetAlertReport.remainingSafeBudget > 0
                ? 'Remaining before 100% budget exhaustion'
                : 'Zero headroom remaining this month'}
            </p>
          </div>
        </div>

        {/* Visual Utilization Track with 90% Marker Notch */}
        <div className="space-y-1.5 pt-1">
          <div className="flex justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
            <span>0%</span>
            <span className="text-amber-600 dark:text-amber-400 flex items-center gap-1 font-bold">
              <Zap className="w-3 h-3" /> {budgetAlertReport.thresholdPct}% Alert Threshold
            </span>
            <span>100% Max Budget</span>
          </div>

          <div className="relative w-full h-4 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden p-0.5">
            {/* 90% Alert Threshold Line */}
            <div 
              className="absolute top-0 bottom-0 w-0.5 bg-rose-500 dark:bg-rose-400 z-20"
              style={{ left: `${budgetAlertReport.thresholdPct}%` }}
              title={`${budgetAlertReport.thresholdPct}% Alert Threshold Marker`}
            />

            {/* Filled Bar */}
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetAlertReport.status === 'exceeded'
                  ? 'bg-rose-600'
                  : budgetAlertReport.status === 'critical'
                  ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                  : budgetAlertReport.status === 'caution'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, budgetAlertReport.utilizationPct)}%` }}
            />
          </div>
        </div>

        {/* Status Callout Footer */}
        <div className={`p-3 rounded-xl flex items-start gap-2.5 text-xs ${
          budgetAlertReport.status === 'exceeded'
            ? 'bg-rose-100/80 dark:bg-rose-950/60 text-rose-900 dark:text-rose-200 border border-rose-200 dark:border-rose-900'
            : budgetAlertReport.status === 'critical'
            ? 'bg-amber-100/80 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-900'
            : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border border-emerald-200/80 dark:border-emerald-900/60'
        }`}>
          {budgetAlertReport.status === 'exceeded' || budgetAlertReport.status === 'critical' ? (
            <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <strong>{budgetAlertReport.headline}</strong>
            <p className="mt-0.5 opacity-90">
              {budgetAlertReport.status === 'exceeded'
                ? `You have spent ${formatCurrency(budgetAlertReport.totalSpent, symbol)}, which is ${budgetAlertReport.utilizationPct}% of your allocated monthly income. Consider deferring non-essential purchases.`
                : budgetAlertReport.status === 'critical'
                ? `You have crossed ${budgetAlertReport.thresholdPct}% of your ${formatCurrency(budgetAlertReport.budgetLimit, symbol)} budget. Only ${formatCurrency(budgetAlertReport.remainingSafeBudget, symbol)} remains before total limit exhaustion.`
                : `Current monthly expenditures are healthy at ${budgetAlertReport.utilizationPct}% of gross allocation. You have ${formatCurrency(budgetAlertReport.remainingSafeBudget, symbol)} in available monthly spending capacity.`}
            </p>
          </div>
        </div>

      </div>

      {/* 1. 50/20/15/15 Salary Allocation Framework */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              1. Salary Allocation Strategy & Health Check
            </h2>
            <p className="text-xs text-slate-500">
              Target budgeting rules vs actual monthly expenditures
            </p>
          </div>

          {/* Allocation Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto">
            <button
              onClick={() => handleApplyPreset({ essentialsPct: 50, savingsPct: 20, investmentsPct: 15, lifestylePct: 15 })}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                userProfile.salaryAllocation.essentialsPct === 50 && userProfile.salaryAllocation.investmentsPct === 15
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              50/20/15/15 Standard
            </button>
            <button
              onClick={() => handleApplyPreset({ essentialsPct: 45, savingsPct: 15, investmentsPct: 30, lifestylePct: 10 })}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                userProfile.salaryAllocation.investmentsPct === 30
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Aggressive Wealth (30% Inv)
            </button>
            <button
              onClick={() => handleApplyPreset({ essentialsPct: 60, savingsPct: 20, investmentsPct: 10, lifestylePct: 10 })}
              className={`text-xs px-3 py-1.5 rounded-lg font-semibold transition ${
                userProfile.salaryAllocation.essentialsPct === 60
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              Conservative (60/20/10/10)
            </button>
          </div>
        </div>

        {/* 4 Allocation Buckets Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Essentials Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Essentials ({userProfile.salaryAllocation.essentialsPct}%)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Rent, Food, Bills, Transit</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.targets.essentials, symbol)} <span className="text-xs font-normal text-slate-400">target</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center text-xs">
              <span className="text-slate-500">Spent so far:</span>
              <span className={`font-bold ${summary.bucketActuals.essentials > summary.targets.essentials ? 'text-rose-600' : 'text-slate-800 dark:text-slate-200'}`}>
                {formatCurrency(summary.bucketActuals.essentials, symbol, true)}
              </span>
            </div>
          </div>

          {/* Savings Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Savings ({userProfile.salaryAllocation.savingsPct}%)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Emergency & Buffer</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.targets.savings, symbol)} <span className="text-xs font-normal text-slate-400">target</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center text-xs">
              <span className="text-slate-500">Allocated Buffer:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(summary.targets.savings, symbol)}
              </span>
            </div>
          </div>

          {/* Investments Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
                Investments ({userProfile.salaryAllocation.investmentsPct}%)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Index, SIPs, Stocks</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.targets.investments, symbol)} <span className="text-xs font-normal text-slate-400">target</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center text-xs">
              <span className="text-slate-500">Contributed:</span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {formatCurrency(summary.bucketActuals.investments, symbol, true)}
              </span>
            </div>
          </div>

          {/* Lifestyle Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                Lifestyle ({userProfile.salaryAllocation.lifestylePct}%)
              </span>
              <span className="text-[11px] font-semibold text-slate-500">Dining, Leisure, Shopping</span>
            </div>
            <div className="text-xl font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.targets.lifestyle, symbol)} <span className="text-xs font-normal text-slate-400">target</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between items-center text-xs">
              <span className="text-slate-500">Discretionary:</span>
              <span className={`font-bold ${summary.bucketActuals.lifestyle > summary.targets.lifestyle ? 'text-amber-600' : 'text-slate-800 dark:text-slate-200'}`}>
                {formatCurrency(summary.bucketActuals.lifestyle, symbol, true)}
              </span>
            </div>
          </div>

        </div>
      </div>

      {/* 2. Generic Investment Suggestions & Portfolio Split */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Compass className="w-5 h-5 text-emerald-600" />
              2. Generic Investment Portfolio Suggestions
            </h2>
            <p className="text-xs text-slate-500">
              Institutional-grade asset allocation models based on risk appetite
            </p>
          </div>

          {/* Risk Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            {(['Conservative', 'Moderate', 'Aggressive'] as RiskTolerance[]).map(risk => (
              <button
                key={risk}
                onClick={() => {
                  setActiveRisk(risk);
                  onUpdateProfile({
                    ...userProfile,
                    investmentPreferences: {
                      ...userProfile.investmentPreferences,
                      riskTolerance: risk,
                    },
                  });
                }}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-bold transition ${
                  activeRisk === risk
                    ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                {risk}
              </button>
            ))}
          </div>
        </div>

        {/* Selected Profile Banner */}
        <div className="p-4 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-sm text-emerald-950 dark:text-emerald-200">
                {investmentProfiles[activeRisk].title}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-200/70 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100">
                Target: {investmentProfiles[activeRisk].expectedReturn}
              </span>
            </div>
            <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-1">
              {investmentProfiles[activeRisk].description}
            </p>
          </div>
          <div className="text-xs text-emerald-900 dark:text-emerald-200 font-semibold bg-white/60 dark:bg-slate-900/60 px-3 py-1.5 rounded-lg shrink-0">
            Suggested Monthly Investment: {formatCurrency(summary.targets.investments, symbol)}
          </div>
        </div>

        {/* Asset Class Breakdown Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {investmentProfiles[activeRisk].portfolio.map(asset => {
            const allocationAmount = (summary.targets.investments * asset.pct) / 100;
            return (
              <div 
                key={asset.asset}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800 space-y-2 hover:border-emerald-500/50 transition"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate" title={asset.asset}>
                    {asset.asset}
                  </span>
                  <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded">
                    {asset.pct}%
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug">{asset.desc}</p>
                <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 flex justify-between text-xs">
                  <span className="text-slate-400">Monthly Contribution:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(allocationAmount, symbol)}/mo
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="p-3 bg-slate-100 dark:bg-slate-800/60 rounded-xl flex items-start gap-2.5 text-xs text-slate-600 dark:text-slate-300">
          <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
          <span>
            <strong>Portfolio Guidance:</strong> {investmentProfiles[activeRisk].recommendation} Always maintain your 6-month liquid emergency fund before aggressively expanding high-beta assets.
          </span>
        </div>
      </div>

      {/* 3. Interactive Compound Interest & SIP Growth Calculators */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Navigation Tabs for Calculators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              3. Projected Wealth & Compounding Simulator
            </h2>
            <p className="text-xs text-slate-500">
              Interactive mathematical projection using SIP and Compound Interest formulas
            </p>
          </div>

          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              onClick={() => setCalcTab('sip')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                calcTab === 'sip'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              SIP (Systematic Investment)
            </button>
            <button
              onClick={() => setCalcTab('compound')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                calcTab === 'compound'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Lump Sum Compound Interest
            </button>
            <button
              onClick={() => setCalcTab('goalPlanner')}
              className={`text-xs px-3 py-1.5 rounded-lg font-bold transition ${
                calcTab === 'goalPlanner'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Goal Reverse Planner
            </button>
          </div>
        </div>

        {/* Tab 1: SIP (Systematic Investment Plan) */}
        {calcTab === 'sip' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Sliders Input Panel */}
              <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                
                {/* Monthly SIP Amount Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Monthly Contribution</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(sipMonthly, symbol)}/mo</span>
                  </div>
                  <input
                    type="range"
                    min={symbol === '₹' ? 500 : 50}
                    max={symbol === '₹' ? 100000 : 5000}
                    step={symbol === '₹' ? 500 : 25}
                    value={sipMonthly}
                    onChange={(e) => setSipMonthly(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{formatCurrency(symbol === '₹' ? 500 : 50, symbol)}</span>
                    <span>{formatCurrency(symbol === '₹' ? 50000 : 2500, symbol)}</span>
                    <span>{formatCurrency(symbol === '₹' ? 100000 : 5000, symbol)}</span>
                  </div>
                </div>

                {/* Expected Return Rate Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Expected Annual Return</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{sipReturnRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="4"
                    max="25"
                    step="0.5"
                    value={sipReturnRate}
                    onChange={(e) => setSipReturnRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>4% (Govt Bonds)</span>
                    <span>12% (Equity Index)</span>
                    <span>25% (High Growth)</span>
                  </div>
                </div>

                {/* Investment Horizon Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Time Horizon</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{sipYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={sipYears}
                    onChange={(e) => setSipYears(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>1 Yr</span>
                    <span>15 Yrs</span>
                    <span>30 Yrs</span>
                  </div>
                </div>

                {/* Annual Step-Up Slider */}
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Annual Step-Up (% Increase in Monthly Deposit)</span>
                    <span className="font-bold text-purple-600 dark:text-purple-400">{sipStepUp}%/yr</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="1"
                    value={sipStepUp}
                    onChange={(e) => setSipStepUp(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-600"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">
                    {sipStepUp > 0 ? `Increases contribution by ${sipStepUp}% every 12 months as your salary grows.` : 'Fixed monthly contribution throughout tenure.'}
                  </p>
                </div>

              </div>

              {/* Outputs and Chart */}
              <div className="lg:col-span-7 space-y-4">
                
                {/* Result KPI Badges */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Total Invested</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {formatCurrency(sipResult.investedAmount, symbol)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Estimated Returns</span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +{formatCurrency(sipResult.estimatedReturns, symbol)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Total Future Wealth</span>
                    <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                      {formatCurrency(sipResult.totalAmount, symbol)}
                    </p>
                  </div>
                </div>

                {/* Line Chart Canvas */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 h-64">
                  <canvas ref={projectionCanvasRef} />
                </div>

              </div>

            </div>
          </div>
        )}

        {/* Tab 2: Compound Interest (Lump-Sum) */}
        {calcTab === 'compound' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              <div className="lg:col-span-5 space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800">
                
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Initial Principal Amount (P)</span>
                    <span className="font-bold text-blue-600 dark:text-blue-400">{formatCurrency(ciPrincipal, symbol)}</span>
                  </div>
                  <input
                    type="range"
                    min={symbol === '₹' ? 10000 : 1000}
                    max={symbol === '₹' ? 5000000 : 200000}
                    step={symbol === '₹' ? 10000 : 1000}
                    value={ciPrincipal}
                    onChange={(e) => setCiPrincipal(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                  />
                  <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                    <span>{formatCurrency(symbol === '₹' ? 10000 : 1000, symbol)}</span>
                    <span>{formatCurrency(symbol === '₹' ? 2500000 : 100000, symbol)}</span>
                    <span>{formatCurrency(symbol === '₹' ? 5000000 : 200000, symbol)}</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Annual Return Rate (r)</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{ciReturnRate}% p.a.</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="0.5"
                    value={ciReturnRate}
                    onChange={(e) => setCiReturnRate(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-emerald-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className="text-slate-700 dark:text-slate-300">Time Horizon (t)</span>
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{ciYears} Years</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="30"
                    step="1"
                    value={ciYears}
                    onChange={(e) => setCiYears(Number(e.target.value))}
                    className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Compounding Frequency (n)
                  </label>
                  <select
                    value={ciCompounding}
                    onChange={(e) => setCiCompounding(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs"
                  >
                    <option value={12}>Monthly (n = 12)</option>
                    <option value={4}>Quarterly (n = 4)</option>
                    <option value={2}>Semi-Annually (n = 2)</option>
                    <option value={1}>Annually (n = 1)</option>
                    <option value={365}>Daily (n = 365)</option>
                  </select>
                </div>

                <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl text-[11px] text-blue-700 dark:text-blue-300">
                  <strong>Compound Interest Formula:</strong> <br />
                  <code className="font-mono text-[10px]">A = P × (1 + r/n)^(n×t)</code>
                </div>

              </div>

              <div className="lg:col-span-7 space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-800">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Initial Principal</span>
                    <p className="text-base font-black text-slate-900 dark:text-white mt-0.5">
                      {formatCurrency(ciResult.investedAmount, symbol)}
                    </p>
                  </div>
                  <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/60">
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase">Interest Compounded</span>
                    <p className="text-base font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      +{formatCurrency(ciResult.totalInterest, symbol)}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/60">
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">Maturity Value</span>
                    <p className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5">
                      {formatCurrency(ciResult.totalAmount, symbol)}
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200 dark:border-slate-800 h-64">
                  <canvas ref={projectionCanvasRef} />
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab 3: Goal Reverse SIP Planner */}
        {calcTab === 'goalPlanner' && (
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Reverse SIP Goal Planner: "How much must I invest monthly?"
              </h3>
              <p className="text-xs text-slate-500">
                Define your target corpus and time horizon to automatically calculate your required monthly contribution.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Corpus Amount ({symbol})
                </label>
                <input
                  type="number"
                  step="1000"
                  value={goalTargetAmount}
                  onChange={(e) => setGoalTargetAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-base text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Expected Annual Return (%)
                </label>
                <input
                  type="number"
                  step="0.5"
                  value={goalReturnRate}
                  onChange={(e) => setGoalReturnRate(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-base text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Time Horizon (Years)
                </label>
                <input
                  type="number"
                  min="1"
                  max="35"
                  value={goalYears}
                  onChange={(e) => setGoalYears(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl font-bold text-base text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-blue-200">Required Monthly SIP</span>
                <div className="text-3xl font-black mt-1">
                  {formatCurrency(goalRequiredSip, symbol)}/month
                </div>
                <p className="text-xs text-blue-100 mt-1">
                  Investing {formatCurrency(goalRequiredSip, symbol)} monthly @ {goalReturnRate}% p.a. will accumulate {formatCurrency(goalTargetAmount, symbol)} in {goalYears} years.
                </p>
              </div>

              <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-xl border border-white/20 text-xs shrink-0">
                <div>Total Principal: <span className="font-bold">{formatCurrency(goalRequiredSip * goalYears * 12, symbol)}</span></div>
                <div className="text-emerald-300 font-bold mt-0.5">Interest Multiplier: +{formatCurrency(goalTargetAmount - (goalRequiredSip * goalYears * 12), symbol)}</div>
              </div>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
