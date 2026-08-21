import React, { useState } from 'react';
import {
  TrendingUp,
  ShieldAlert,
  Percent,
  PiggyBank,
  CreditCard,
  Layers,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Lightbulb,
  Sparkles,
  Sliders,
  IndianRupee,
  ChevronRight,
  ShieldCheck,
  Zap,
  ArrowRight
} from 'lucide-react';
import { UserProfile, FinancialGoal } from '../types';
import { formatCurrency, calculateNetWorthSummary } from '../utils/calculations';

interface WealthGrowthStrategyProps {
  userProfile: UserProfile;
  goals: FinancialGoal[];
  onApplyStrategy?: (strategyType: string, payload?: any) => void;
  onToast?: (message: string) => void;
}

export interface PersonalizedRecommendation {
  id: string;
  category: 'savings' | 'debt' | 'tax' | 'investment' | 'emergency';
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'OPTIMIZATION';
  title: string;
  actionText: string;
  description: string;
  impactMetric: string;
  mathExplanation: string;
  tag: string;
  isTriggered: boolean;
}

export const WealthGrowthStrategy: React.FC<WealthGrowthStrategyProps> = ({
  userProfile,
  goals,
  onApplyStrategy,
  onToast,
}) => {
  const symbol = userProfile.currencySymbol || '₹';
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [completedActions, setCompletedActions] = useState<Record<string, boolean>>({});

  const netWorth = userProfile.netWorth;
  const netWorthSummary = netWorth 
    ? calculateNetWorthSummary(netWorth.assets, netWorth.liabilities)
    : null;

  const monthlySalary = userProfile.monthlySalary || 85000;
  const monthlySavingsSIP = netWorth?.monthlySavingsSIP || 25000;
  const savingsRate = Math.round((monthlySavingsSIP / monthlySalary) * 100);

  const totalAssets = netWorthSummary ? netWorthSummary.totalAssets : 7800000;
  const totalLiabilities = netWorthSummary ? netWorthSummary.totalLiabilities : 1965000;
  const creditCardDebt = netWorth?.liabilities.creditCardDebt || 0;
  const liquidCash = netWorth?.assets.cash || 0;
  const marketInvestments = netWorth?.assets.investments || 0;
  const retirementCorpus = netWorth?.assets.retirement || 0;
  const propertyValue = netWorth?.assets.property || 0;

  // Emergency fund target is 6 months salary
  const emergencyTarget = monthlySalary * 6;
  const hasEmergencyGoal = goals.some(g => g.category === 'Emergency Fund');

  // Dynamic Rule-Based Recommendations Generation based on user profile & balance sheet
  const recommendations: PersonalizedRecommendation[] = [
    // 1. High Interest Debt Avalanche
    {
      id: 'strat_cc_debt',
      category: 'debt',
      priority: creditCardDebt > 0 ? 'CRITICAL' : 'OPTIMIZATION',
      title: creditCardDebt > 0 ? 'Prioritize High-Interest Credit Card Repayment' : 'Maintain Zero Revolving High-Interest Debt',
      actionText: creditCardDebt > 0 ? `Pay off ${formatCurrency(creditCardDebt, symbol)} CC Debt First` : 'Keep CC dues on autopay',
      description: creditCardDebt > 0
        ? `You currently carry ${formatCurrency(creditCardDebt, symbol)} in revolving credit card debt incurring ~36% to 42% APR. Eliminating this provides an instant, guaranteed 40% risk-free return on capital.`
        : `Your revolving credit card debt is clean at ${formatCurrency(0, symbol)}. Continue paying the full statement balance every billing cycle to avoid 3.5%/month finance charges.`,
      impactMetric: creditCardDebt > 0 
        ? `Saves ~${formatCurrency(Math.round(creditCardDebt * 0.38), symbol)} / year in finance charges` 
        : 'Guarantees 0% interest penalties and protects 750+ CIBIL score',
      mathExplanation: creditCardDebt > 0 
        ? `Annual Loss = ${formatCurrency(creditCardDebt, symbol)} × 40% APR = ${formatCurrency(Math.round(creditCardDebt * 0.40), symbol)}/yr lost to banks.`
        : `Autopay full balance prevents compounding daily revolving finance charges.`,
      tag: creditCardDebt > 0 ? '🚨 Urgent Action' : '✓ Good Standing',
      isTriggered: creditCardDebt > 0,
    },

    // 2. Savings Rate Step-Up
    {
      id: 'strat_savings_rate',
      category: 'savings',
      priority: savingsRate < 25 ? 'HIGH' : savingsRate < 40 ? 'MEDIUM' : 'OPTIMIZATION',
      title: savingsRate < 30 ? 'Increase Savings Rate by 5%–10%' : 'Maintain 30%+ Wealth Accumulation Velocity',
      actionText: `Step up monthly SIP by ${formatCurrency(Math.round(monthlySalary * 0.05), symbol)}/mo`,
      description: savingsRate < 30
        ? `Your current savings rate is ${savingsRate}% (${formatCurrency(monthlySavingsSIP, symbol)} of ${formatCurrency(monthlySalary, symbol)}). Escalating your savings rate by 5% (+${formatCurrency(Math.round(monthlySalary * 0.05), symbol)}/mo) via salary-day auto-sweep will add significant terminal compounding.`
        : `You are sustaining an aggressive ${savingsRate}% savings rate (${formatCurrency(monthlySavingsSIP, symbol)}/mo). Channeling annual 10% salary increments directly to SIPs will compound faster than inflation.`,
      impactMetric: `Adds +${formatCurrency(Math.round((monthlySalary * 0.05) * 12 * 10 * 1.75), symbol)} over 10 Years @ 12% CAGR`,
      mathExplanation: `Monthly SIP Step-up of +${formatCurrency(Math.round(monthlySalary * 0.05), symbol)} compounded at 12% CAGR over 10 years creates substantial additional corpus.`,
      tag: savingsRate < 30 ? '📈 High Impact' : '✓ Strong Momentum',
      isTriggered: savingsRate < 35,
    },

    // 3. Tax-Saving Instruments (Section 80C & 80CCD(1B) NPS)
    {
      id: 'strat_tax_saving',
      category: 'tax',
      priority: (retirementCorpus < 1500000 || !userProfile.taxRegime || userProfile.taxRegime === 'OLD') ? 'HIGH' : 'MEDIUM',
      title: 'Diversify into Tax-Saving Instruments (ELSS, PPF & NPS)',
      actionText: 'Max out ₹1.5L (Sec 80C) + ₹50k (Sec 80CCD 1B)',
      description: `Utilize Equity Linked Savings Schemes (ELSS mutual funds with 3-year lock-in), Public Provident Fund (PPF at 7.1% tax-free interest), and National Pension System (NPS Tier-1 for extra ₹50,000 deduction) to retain hard-earned income.`,
      impactMetric: `Saves up to ₹62,400 in direct income tax refunds annually (under 30% slab)`,
      mathExplanation: `Tax Benefit = (₹1,50,000 Sec 80C + ₹50,000 Sec 80CCD) × 31.2% effective tax rate = ₹62,400 per financial year.`,
      tag: '💰 Tax Optimization',
      isTriggered: true,
    },

    // 4. 6-Month Emergency Buffer Fund
    {
      id: 'strat_emergency_fund',
      category: 'emergency',
      priority: liquidCash < emergencyTarget ? 'HIGH' : 'OPTIMIZATION',
      title: liquidCash < emergencyTarget ? 'Build 6-Month Liquid Emergency Buffer' : 'Emergency Fund Fully Capitalized',
      actionText: liquidCash < emergencyTarget ? `Accumulate ${formatCurrency(Math.max(0, emergencyTarget - liquidCash), symbol)} in Liquid FD` : 'Maintain in high-yield liquid funds',
      description: liquidCash < emergencyTarget
        ? `Your liquid bank/cash balance is ${formatCurrency(liquidCash, symbol)}, which is below the 6-month safety threshold of ${formatCurrency(emergencyTarget, symbol)} (6 × ${formatCurrency(monthlySalary, symbol)}). Secure this in zero-penalty sweep-in fixed deposits or liquid debt funds.`
        : `Your liquid cash reserve (${formatCurrency(liquidCash, symbol)}) comfortably covers your 6-month target of ${formatCurrency(emergencyTarget, symbol)}. Avoid holding excessive idle cash above this to prevent inflation drag.`,
      impactMetric: liquidCash < emergencyTarget
        ? `Protects equity portfolio from forced distressed sales during emergencies`
        : `Provides 100% financial peace of mind against sudden job transition or medical events`,
      mathExplanation: `Recommended Buffer = 6 × Monthly Income (${formatCurrency(monthlySalary, symbol)}) = ${formatCurrency(emergencyTarget, symbol)}.`,
      tag: liquidCash < emergencyTarget ? '🛡️ Core Protection' : '✓ Secure Buffer',
      isTriggered: liquidCash < emergencyTarget,
    },

    // 5. Portfolio Diversification & Equity Allocation
    {
      id: 'strat_diversification',
      category: 'investment',
      priority: (marketInvestments / Math.max(1, totalAssets)) < 0.25 ? 'HIGH' : 'MEDIUM',
      title: 'Diversify Across 4 Asset Pillars (Equities, Debt, Gold, Real Estate)',
      actionText: 'Target 60% Equity / 20% Debt / 10% Gold SGB / 10% Cash',
      description: `Ensure your portfolio is not overly concentrated in a single illiquid asset. Rebalance systematically toward low-cost Nifty 50 / Nifty Next 50 index funds, Sovereign Gold Bonds (2.5% annual coupon + tax-free redemption), and fixed income.`,
      impactMetric: `Reduces peak portfolio drawdown from -38% down to -16% during bear markets`,
      mathExplanation: `Multi-asset non-correlated frontier lowers volatility (Standard Deviation σ) while preserving 11–13% blended CAGR.`,
      tag: '⚖️ Asset Allocation',
      isTriggered: true,
    },

    // 6. Annual 10% SIP Step-Up
    {
      id: 'strat_sip_stepup',
      category: 'savings',
      priority: 'OPTIMIZATION',
      title: 'Automate 10% Annual SIP Step-Up with Increments',
      actionText: `Next increment: Increase SIP from ${formatCurrency(monthlySavingsSIP, symbol)} to ${formatCurrency(Math.round(monthlySavingsSIP * 1.10), symbol)}`,
      description: `Commit 50% of every annual salary appraisal towards increasing your systematic investment plans. A 10% annual step-up delivers more than double the terminal corpus compared to a flat SIP over 15 years.`,
      impactMetric: `Delivers ~2.25x larger terminal wealth corpus over 15-year horizon`,
      mathExplanation: `Step-Up compounding: $FV_{step} = \sum_{t=1}^n P(1+g)^{t-1} (1+r)^{n-t+1}$ where $g=10\\%$, $r=12\\%$.`,
      tag: '⚡ Exponential Growth',
      isTriggered: true,
    }
  ];

  const handleToggleComplete = (id: string, title: string) => {
    setCompletedActions(prev => {
      const next = { ...prev, [id]: !prev[id] };
      if (!prev[id] && onToast) {
        onToast(`Marked strategy "${title}" as applied!`);
      }
      return next;
    });
  };

  const filteredRecs = recommendations.filter(rec => {
    if (filterCategory === 'all') return true;
    if (filterCategory === 'critical') return rec.priority === 'CRITICAL' || rec.priority === 'HIGH';
    return rec.category === filterCategory;
  });

  const criticalCount = recommendations.filter(r => r.priority === 'CRITICAL' || r.priority === 'HIGH').length;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-xl">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                Personalized Wealth Growth Strategy
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider">
                  AI Tailored
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Actionable mathematical recommendations formulated from your income ({formatCurrency(monthlySalary, symbol)}/mo), liabilities, and savings profile
              </p>
            </div>
          </div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
          <button
            onClick={() => setFilterCategory('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterCategory === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            All Levers ({recommendations.length})
          </button>
          
          <button
            onClick={() => setFilterCategory('critical')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              filterCategory === 'critical'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-rose-600 dark:text-rose-400'
            }`}
          >
            <span>Priority</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200">
              {criticalCount}
            </span>
          </button>

          <button
            onClick={() => setFilterCategory('savings')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterCategory === 'savings'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Savings Rate
          </button>

          <button
            onClick={() => setFilterCategory('debt')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterCategory === 'debt'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Debt Repayment
          </button>

          <button
            onClick={() => setFilterCategory('tax')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterCategory === 'tax'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'hover:bg-slate-200 dark:hover:bg-slate-700'
            }`}
          >
            Tax Optimization
          </button>
        </div>
      </div>

      {/* Highlights Quick Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/40 dark:to-indigo-950/20 border border-blue-100 dark:border-blue-900/40">
          <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
            <PiggyBank className="w-4 h-4 text-blue-600" />
            <span>Savings Velocity</span>
          </div>
          <div className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-1">
            {savingsRate}% of Income
          </div>
          <p className="text-[11px] text-blue-700 dark:text-blue-400 mt-0.5">
            {formatCurrency(monthlySavingsSIP, symbol)} / {formatCurrency(monthlySalary, symbol)} monthly
          </p>
        </div>

        <div className={`p-4 rounded-2xl border ${
          creditCardDebt > 0 
            ? 'bg-rose-50/70 dark:bg-rose-950/40 border-rose-200 dark:border-rose-900/60'
            : 'bg-emerald-50/70 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900/60'
        }`}>
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
            <CreditCard className={`w-4 h-4 ${creditCardDebt > 0 ? 'text-rose-600' : 'text-emerald-600'}`} />
            <span>High-Interest CC Debt</span>
          </div>
          <div className={`text-2xl font-black mt-1 ${creditCardDebt > 0 ? 'text-rose-900 dark:text-rose-100' : 'text-emerald-900 dark:text-emerald-100'}`}>
            {formatCurrency(creditCardDebt, symbol)}
          </div>
          <p className={`text-[11px] mt-0.5 ${creditCardDebt > 0 ? 'text-rose-700 dark:text-rose-400 font-semibold' : 'text-emerald-700 dark:text-emerald-400'}`}>
            {creditCardDebt > 0 ? 'Costing 36-42% APR interest' : 'Zero revolving debt (Excellent)'}
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50/50 dark:from-purple-950/40 dark:to-pink-950/20 border border-purple-100 dark:border-purple-900/40">
          <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
            <Percent className="w-4 h-4 text-purple-600" />
            <span>Annual Tax Shield Potential</span>
          </div>
          <div className="text-2xl font-black text-purple-950 dark:text-purple-100 mt-1">
            ₹62,400 / yr
          </div>
          <p className="text-[11px] text-purple-700 dark:text-purple-400 mt-0.5">
            Sec 80C (₹1.5L) + Sec 80CCD 1B (₹50k)
          </p>
        </div>
      </div>

      {/* Strategy Recommendation Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {filteredRecs.map((rec) => {
          const isDone = !!completedActions[rec.id];

          return (
            <div
              key={rec.id}
              className={`p-6 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                isDone
                  ? 'bg-slate-50/80 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                  : rec.priority === 'CRITICAL'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60 shadow-xs'
                  : rec.priority === 'HIGH'
                  ? 'bg-amber-50/30 dark:bg-amber-950/20 border-amber-200/80 dark:border-amber-900/50'
                  : 'bg-white dark:bg-slate-900/80 border-slate-200/80 dark:border-slate-800'
              }`}
            >
              <div className="space-y-3">
                
                {/* Card Header & Badge */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg ${
                      rec.priority === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : rec.priority === 'HIGH'
                        ? 'bg-amber-500 text-white'
                        : rec.priority === 'MEDIUM'
                        ? 'bg-blue-600 text-white'
                        : 'bg-emerald-600 text-white'
                    }`}>
                      {rec.tag}
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">
                      {rec.category}
                    </span>
                  </div>

                  <button
                    onClick={() => handleToggleComplete(rec.id, rec.title)}
                    className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl transition ${
                      isDone
                        ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`} />
                    <span>{isDone ? 'Implemented' : 'Mark as Done'}</span>
                  </button>
                </div>

                {/* Title & Action */}
                <div>
                  <h3 className={`font-bold text-base leading-snug ${isDone ? 'line-through text-slate-500' : 'text-slate-900 dark:text-white'}`}>
                    {rec.title}
                  </h3>
                  <div className="inline-flex items-center gap-1.5 mt-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 border border-blue-200/60 dark:border-blue-900/60 text-xs font-bold text-blue-700 dark:text-blue-300">
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>Target Action: {rec.actionText}</span>
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  {rec.description}
                </p>

                {/* Mathematical Insight Pill */}
                <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-800 dark:text-slate-200 font-bold">
                    <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                    <span>Quantitative Impact:</span>
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {rec.impactMetric}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-400 pt-0.5 border-t border-slate-200/40 dark:border-slate-700/40">
                    {rec.mathExplanation}
                  </p>
                </div>

              </div>

              {/* Bottom Quick Trigger */}
              <div className="pt-2">
                <button
                  onClick={() => {
                    handleToggleComplete(rec.id, rec.title);
                    if (onApplyStrategy) onApplyStrategy(rec.category);
                  }}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 ${
                    isDone 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      : rec.priority === 'CRITICAL'
                      ? 'bg-rose-600 hover:bg-rose-700 text-white shadow-xs'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                  }`}
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{isDone ? 'Completed' : `Execute: ${rec.actionText}`}</span>
                </button>
              </div>

            </div>
          );
        })}
      </div>

    </div>
  );
};
