import React, { useState, useEffect, useRef } from 'react';
import {
  Wallet,
  TrendingUp,
  ShieldCheck,
  Building,
  Gem,
  CreditCard,
  AlertTriangle,
  ArrowUpRight,
  Sparkles,
  PiggyBank,
  Percent,
  Sliders,
  CheckCircle2,
  HelpCircle,
  BarChart3,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  RotateCcw
} from 'lucide-react';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend } from 'chart.js';
import { UserProfile, NetWorthData, NetWorthAssets, NetWorthLiabilities } from '../types';
import { 
  calculateNetWorthSummary, 
  formatCurrency,
  formatINR,
  formatPercentage,
  formatNumber
} from '../utils/calculations';

// Register Chart.js components
Chart.register(DoughnutController, ArcElement, Tooltip, Legend);

interface NetWorthViewProps {
  userProfile: UserProfile;
  onUpdateProfile: (updated: UserProfile) => void;
  onToast?: (message: string) => void;
}

export const NetWorthView: React.FC<NetWorthViewProps> = ({
  userProfile,
  onUpdateProfile,
  onToast,
}) => {
  const symbol = userProfile.currencySymbol || '₹';

  // Initialize or fallback to userProfile.netWorth
  const defaultNetWorth: NetWorthData = userProfile.netWorth || {
    assets: {
      cash: 450000,
      investments: 1850000,
      retirement: 920000,
      property: 4500000,
      valuables: 650000,
    },
    liabilities: {
      loans: 1800000,
      creditCardDebt: 45000,
      obligations: 120000,
    },
    monthlySavingsSIP: 35000,
    expectedAnnualReturnPct: 12,
    sipStepUpPct: 10,
    inflationRatePct: 6,
    lastUpdated: new Date().toISOString().slice(0, 10),
  };

  const [assets, setAssets] = useState<NetWorthAssets>(defaultNetWorth.assets);
  const [liabilities, setLiabilities] = useState<NetWorthLiabilities>(defaultNetWorth.liabilities);
  const [monthlySIP, setMonthlySIP] = useState<number>(defaultNetWorth.monthlySavingsSIP);
  const [expectedReturn, setExpectedReturn] = useState<number>(defaultNetWorth.expectedAnnualReturnPct);
  const [stepUpPct, setStepUpPct] = useState<number>(defaultNetWorth.sipStepUpPct);
  const [inflationPct, setInflationPct] = useState<number>(defaultNetWorth.inflationRatePct);
  const [isEditingInputs, setIsEditingInputs] = useState<boolean>(false);

  // Chart Canvas Ref
  const assetDoughnutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const assetDoughnutChartInstance = useRef<Chart | null>(null);

  // Compute live summaries
  const netWorthSummary = calculateNetWorthSummary(assets, liabilities);
  
  const currentNetWorthData: NetWorthData = {
    assets,
    liabilities,
    monthlySavingsSIP: monthlySIP,
    expectedAnnualReturnPct: expectedReturn,
    sipStepUpPct: stepUpPct,
    inflationRatePct: inflationPct,
    lastUpdated: new Date().toISOString().slice(0, 10),
  };

  // Persist edits
  const handleSaveNetWorth = () => {
    const updatedProfile: UserProfile = {
      ...userProfile,
      netWorth: currentNetWorthData,
    };
    onUpdateProfile(updatedProfile);
    setIsEditingInputs(false);
    if (onToast) {
      onToast(`Net Worth portfolio updated: Total ${formatCurrency(netWorthSummary.netWorth, symbol)}`);
    }
  };

  // Render Asset Distribution Doughnut Chart
  useEffect(() => {
    if (!assetDoughnutCanvasRef.current) return;

    if (assetDoughnutChartInstance.current) {
      assetDoughnutChartInstance.current.destroy();
    }

    const ctx = assetDoughnutCanvasRef.current.getContext('2d');
    if (!ctx) return;

    const dataValues = [
      assets.cash || 0,
      assets.investments || 0,
      assets.retirement || 0,
      assets.property || 0,
      assets.valuables || 0,
    ];

    const labels = [
      'Cash & Bank (Liquid)',
      'Investments (Equities & Gold)',
      'Retirement (EPF/PPF/NPS)',
      'Real Estate & Property',
      'Valuables & Others',
    ];

    const colors = [
      '#3B82F6', // Blue (Cash)
      '#10B981', // Emerald (Investments)
      '#8B5CF6', // Purple (Retirement)
      '#F59E0B', // Amber (Property)
      '#EC4899', // Pink (Valuables)
    ];

    assetDoughnutChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [
          {
            data: dataValues,
            backgroundColor: colors,
            borderWidth: 2,
            borderColor: '#FFFFFF',
            hoverOffset: 6,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '72%',
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const val = context.parsed;
                const total = netWorthSummary.totalAssets || 1;
                const pct = ((val / total) * 100).toFixed(1);
                return ` ${context.label}: ${formatCurrency(val, symbol)} (${pct}%)`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (assetDoughnutChartInstance.current) {
        assetDoughnutChartInstance.current.destroy();
      }
    };
  }, [assets, netWorthSummary.totalAssets, symbol]);

  return (
    <div className="space-y-8">
      
      {/* 1. Net Worth Dashboard Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Total Wealth & Balance Sheet
              </span>
              <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                netWorthSummary.healthStatus === 'fortress' 
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : netWorthSummary.healthStatus === 'strong'
                  ? 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  : netWorthSummary.healthStatus === 'balanced'
                  ? 'bg-blue-500/20 text-blue-300 border-blue-500/30'
                  : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
              }`}>
                {netWorthSummary.healthLabel}
              </span>
            </div>

            <div className="pt-1">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Current Net Worth (INR)
              </span>
              <div className="text-3xl sm:text-5xl font-black text-white tracking-tight flex items-baseline gap-2">
                <span>{formatCurrency(netWorthSummary.netWorth, symbol)}</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 max-w-xl">
              Calculated as Total Realized Assets ({formatCurrency(netWorthSummary.totalAssets, symbol)}) minus Total Liabilities ({formatCurrency(netWorthSummary.totalLiabilities, symbol)}).
            </p>
          </div>

          {/* Quick Metrics & Edit Controls */}
          <div className="flex flex-col sm:flex-row lg:flex-col gap-3 shrink-0">
            <div className="grid grid-cols-2 gap-2 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10 text-xs">
              <div className="p-2">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Liquid Net Worth</span>
                <p className="text-base font-black text-emerald-400 mt-0.5">
                  {formatCurrency(netWorthSummary.liquidNetWorth, symbol)}
                </p>
              </div>
              <div className="p-2 border-l border-white/10">
                <span className="text-slate-400 text-[10px] uppercase font-bold">Debt-To-Asset</span>
                <p className="text-base font-black text-amber-300 mt-0.5">
                  {netWorthSummary.debtToAssetRatio}%
                </p>
              </div>
            </div>

            <button
              id="networth-edit-toggle-btn"
              onClick={() => setIsEditingInputs(!isEditingInputs)}
              className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-blue-600/30"
            >
              <Sliders className="w-4 h-4" />
              <span>{isEditingInputs ? 'Close Input Panel' : 'Edit Assets & Liabilities'}</span>
            </button>
          </div>
        </div>

        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
      </div>

      {/* 2. Interactive Input Editor (Collapsible Drawer / Card) */}
      {isEditingInputs && (
        <div className="bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-900/60 rounded-3xl p-6 sm:p-8 shadow-md space-y-6 animate-in fade-in slide-in-from-top-3">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-600" />
                Update Asset & Liability Ledger
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Input all holdings in Indian Rupees (₹) to automatically calculate your true balance sheet
              </p>
            </div>
            <button
              onClick={() => setIsEditingInputs(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Cancel
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Assets Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" /> Assets (What You Own)
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Total: {formatCurrency(netWorthSummary.totalAssets, symbol)}
                </span>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cash & Bank Balances ({symbol})
                  </label>
                  <input
                    type="number"
                    value={assets.cash}
                    onChange={(e) => setAssets({ ...assets, cash: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="Savings accounts, Liquid funds, High-yield FDs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Savings accounts, liquid mutual funds, emergency FDs</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Market Investments ({symbol})
                  </label>
                  <input
                    type="number"
                    value={assets.investments}
                    onChange={(e) => setAssets({ ...assets, investments: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="Stocks, Mutual Funds, ETFs, SGBs, Crypto"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Nifty index funds, direct equities, sovereign gold bonds</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Retirement Corpus ({symbol})
                  </label>
                  <input
                    type="number"
                    value={assets.retirement}
                    onChange={(e) => setAssets({ ...assets, retirement: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="EPF, PPF, NPS, Superannuation"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">EPF passbook balance, PPF account, NPS Tier-1</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Real Estate & Property Market Value ({symbol})
                  </label>
                  <input
                    type="number"
                    value={assets.property}
                    onChange={(e) => setAssets({ ...assets, property: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="Residential flat, land, commercial property"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Current estimated market value of owned properties</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Valuables & Other Physical Assets ({symbol})
                  </label>
                  <input
                    type="number"
                    value={assets.valuables}
                    onChange={(e) => setAssets({ ...assets, valuables: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="Physical gold jewelry, vehicles, collectibles"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Physical gold, silver, vehicles, precious items</p>
                </div>
              </div>
            </div>

            {/* Liabilities Column */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-rose-600 dark:text-rose-400 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4" /> Liabilities (What You Owe)
                </span>
                <span className="text-xs font-black text-slate-900 dark:text-white">
                  Total: {formatCurrency(netWorthSummary.totalLiabilities, symbol)}
                </span>
              </div>

              <div className="space-y-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200/70 dark:border-slate-800">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Term Loans & Mortgages ({symbol})
                  </label>
                  <input
                    type="number"
                    value={liabilities.loans}
                    onChange={(e) => setLiabilities({ ...liabilities, loans: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="Home loan, Car loan, Education loan principal"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Remaining principal on home loans, auto loans, student debt</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Credit Card Outstanding Balances ({symbol})
                  </label>
                  <input
                    type="number"
                    value={liabilities.creditCardDebt}
                    onChange={(e) => setLiabilities({ ...liabilities, creditCardDebt: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="Rolling credit card balances"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">High-priority unsecured revolving debt</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Other Debts & Obligations ({symbol})
                  </label>
                  <input
                    type="number"
                    value={liabilities.obligations}
                    onChange={(e) => setLiabilities({ ...liabilities, obligations: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3.5 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white"
                    placeholder="Personal loans, family hand-loans, pending EMIs"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Personal loans, informal borrowings, pending commitments</p>
                </div>
              </div>

              {/* Projection Parameters */}
              <div className="space-y-3 bg-blue-50/50 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/40">
                <span className="text-xs font-bold text-blue-900 dark:text-blue-200 flex items-center gap-1.5">
                  <Zap className="w-3.5 h-3.5 text-blue-600" /> Growth & SIP Assumptions
                </span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      Monthly SIP ({symbol})
                    </label>
                    <input
                      type="number"
                      value={monthlySIP}
                      onChange={(e) => setMonthlySIP(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      Expected Return (%)
                    </label>
                    <input
                      type="number"
                      value={expectedReturn}
                      onChange={(e) => setExpectedReturn(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-600 dark:text-slate-300">
                      Annual Step-Up (%)
                    </label>
                    <input
                      type="number"
                      value={stepUpPct}
                      onChange={(e) => setStepUpPct(parseFloat(e.target.value) || 0)}
                      className="w-full px-2 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setIsEditingInputs(false)}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 rounded-xl"
            >
              Cancel
            </button>
            <button
              id="networth-save-btn"
              onClick={handleSaveNetWorth}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md transition flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" /> Save & Re-Calculate Net Worth
            </button>
          </div>
        </div>
      )}

      {/* 3. Distribution & Asset Breakdown Visuals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Asset Distribution Doughnut & Category Breakdown */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <PieChartIcon className="w-4 h-4 text-blue-600" />
                Asset Distribution Portfolio
              </h3>
              <p className="text-xs text-slate-400">
                Breakdown of {formatCurrency(netWorthSummary.totalAssets, symbol)} total assets across 5 wealth pillars
              </p>
            </div>
            <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2.5 py-1 rounded-lg">
              100% Asset Split
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 items-center">
            {/* Doughnut Chart Canvas */}
            <div className="sm:col-span-5 relative h-56 flex items-center justify-center">
              <canvas ref={assetDoughnutCanvasRef} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Gross Assets</span>
                <span className="text-sm font-black text-slate-900 dark:text-white">
                  {formatCurrency(netWorthSummary.totalAssets, symbol)}
                </span>
              </div>
            </div>

            {/* Asset Pillars List */}
            <div className="sm:col-span-7 space-y-2.5">
              
              {/* Cash */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-blue-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Cash & Bank Balances</span>
                    <span className="text-[10px] text-slate-400 block">Liquid funds & High-yield FDs</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(assets.cash, symbol)}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold">{netWorthSummary.assetDistribution.cash}%</span>
                </div>
              </div>

              {/* Investments */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Market Investments</span>
                    <span className="text-[10px] text-slate-400 block">Stocks, Mutual Funds, SGBs</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(assets.investments, symbol)}</span>
                  <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">{netWorthSummary.assetDistribution.investments}%</span>
                </div>
              </div>

              {/* Retirement */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-purple-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Retirement Accounts</span>
                    <span className="text-[10px] text-slate-400 block">EPF, PPF, NPS Corpus</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(assets.retirement, symbol)}</span>
                  <span className="text-[10px] text-purple-600 dark:text-purple-400 font-semibold">{netWorthSummary.assetDistribution.retirement}%</span>
                </div>
              </div>

              {/* Real Estate */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Real Estate & Property</span>
                    <span className="text-[10px] text-slate-400 block">Residential, Commercial, Land</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(assets.property, symbol)}</span>
                  <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold">{netWorthSummary.assetDistribution.property}%</span>
                </div>
              </div>

              {/* Valuables */}
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/60 dark:border-slate-700/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="w-3 h-3 rounded-full bg-pink-500" />
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">Valuables & Others</span>
                    <span className="text-[10px] text-slate-400 block">Physical Gold, Vehicles</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 dark:text-white block">{formatCurrency(assets.valuables, symbol)}</span>
                  <span className="text-[10px] text-pink-600 dark:text-pink-400 font-semibold">{netWorthSummary.assetDistribution.valuables}%</span>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* Liabilities & Solvency Meter */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between space-y-5">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500" />
                Liabilities Breakdown
              </h3>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400">
                {formatCurrency(netWorthSummary.totalLiabilities, symbol)}
              </span>
            </div>

            {/* Visual Balance Bar */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-emerald-600 dark:text-emerald-400">Assets: {100 - Math.min(100, Math.round(netWorthSummary.debtToAssetRatio))}%</span>
                <span className="text-rose-600 dark:text-rose-400">Debt Ratio: {netWorthSummary.debtToAssetRatio}%</span>
              </div>
              <div className="w-full h-3 bg-rose-200 dark:bg-rose-950/80 rounded-full overflow-hidden flex">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.max(0, 100 - netWorthSummary.debtToAssetRatio)}%` }}
                />
                <div 
                  className="h-full bg-rose-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, netWorthSummary.debtToAssetRatio)}%` }}
                />
              </div>
            </div>

            {/* Liabilities Items */}
            <div className="space-y-2.5 pt-2">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Term Mortgages & Loans</span>
                  <span className="text-[10px] text-slate-400">Home/Auto/Education</span>
                </div>
                <div className="text-right font-bold text-slate-900 dark:text-white">
                  {formatCurrency(liabilities.loans, symbol)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Credit Card Debt</span>
                  <span className="text-[10px] text-rose-500 font-semibold">High Priority 36-42% APR</span>
                </div>
                <div className="text-right font-bold text-slate-900 dark:text-white">
                  {formatCurrency(liabilities.creditCardDebt, symbol)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">Other Commitments & EMIs</span>
                  <span className="text-[10px] text-slate-400">Personal & informal loans</span>
                </div>
                <div className="text-right font-bold text-slate-900 dark:text-white">
                  {formatCurrency(liabilities.obligations, symbol)}
                </div>
              </div>
            </div>
          </div>

          <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-2xl border border-blue-100 dark:border-blue-900/40 text-[11px] text-blue-900 dark:text-blue-200 space-y-1">
            <strong>💡 Solvency Benchmark:</strong>
            <p>
              Financial experts recommend keeping total debt-to-asset ratios below 35%. Your current ratio of {netWorthSummary.debtToAssetRatio}% is rated <strong>{netWorthSummary.healthLabel}</strong>.
            </p>
          </div>
        </div>

      </div>

      {/* 4. Solvency & Balance Sheet Summary Fundamentals */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-5 border border-slate-800">
        <div className="flex items-center gap-2">
          <Info className="w-5 h-5 text-blue-400" />
          <h3 className="font-black text-base tracking-tight">
            Financial Balance Sheet Principles
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
          
          {/* Formula 1: Net Worth */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              1. Net Worth Formula
            </span>
            <div className="p-2.5 rounded-xl bg-black/40 font-mono text-xs text-blue-300 border border-blue-500/20">
              Net Worth = Σ(Assets) - Σ(Liabilities)
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Total liquid and illiquid real economic value after satisfying all outstanding liabilities.
            </p>
          </div>

          {/* Formula 2: Liquid Net Worth */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              2. Liquid Net Worth
            </span>
            <div className="p-2.5 rounded-xl bg-black/40 font-mono text-xs text-emerald-300 border border-emerald-500/20">
              Liquid NW = (Cash + Market Investments) - Short Debt
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Immediate purchasing power and emergency buffer available within T+2 settlement days.
            </p>
          </div>

          {/* Formula 3: Debt-To-Asset Solvency */}
          <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
              3. Solvency Health Ratio
            </span>
            <div className="p-2.5 rounded-xl bg-black/40 font-mono text-xs text-amber-300 border border-amber-500/20">
              D/A Ratio = (Total Liabilities / Total Assets) × 100
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Solvency benchmark under 35% indicates fortress balance sheet stability.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};

function PieChartIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21.21 15.89A10 10 0 1 1 8 2.83" />
      <path d="M22 12A10 10 0 0 0 12 2v10z" />
    </svg>
  );
}
