import React, { useEffect, useRef } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Receipt, 
  ArrowUpRight, 
  ShieldAlert, 
  Sparkles,
  PieChart as PieIcon,
  ChevronRight,
  Plus,
  Repeat,
  Paperclip
} from 'lucide-react';
import { Chart, DoughnutController, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale } from 'chart.js';
import { Expense, UserProfile, FinancialGoal, AppTab } from '../types';
import { calculateMonthlySummary, formatCurrency, formatDateDisplay } from '../utils/calculations';
import { CATEGORY_METADATA } from '../data/initialData';

// Register Chart.js components
Chart.register(DoughnutController, ArcElement, Tooltip, Legend, BarController, BarElement, CategoryScale, LinearScale);

interface DashboardViewProps {
  expenses: Expense[];
  userProfile: UserProfile;
  goals: FinancialGoal[];
  onSelectTab: (tab: AppTab) => void;
  onOpenAddModal: () => void;
  onViewReceipt: (attachment: any, name: string) => void;
  onEditExpense: (expense: Expense) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  expenses,
  userProfile,
  goals,
  onSelectTab,
  onOpenAddModal,
  onViewReceipt,
  onEditExpense,
}) => {
  const doughnutCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const barCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const doughnutChartInstance = useRef<Chart | null>(null);
  const barChartInstance = useRef<Chart | null>(null);

  const symbol = userProfile.currencySymbol || '₹';
  const summary = calculateMonthlySummary(expenses, userProfile.monthlySalary, userProfile.salaryAllocation);
  const spentPct = userProfile.monthlySalary > 0 
    ? Math.round((summary.totalSpent / userProfile.monthlySalary) * 100) 
    : 0;

  // Active budget alert checks
  const isOverBudget = summary.totalSpent > userProfile.monthlySalary;
  const isNearBudgetLimit = spentPct >= userProfile.budgetAlertThreshold;

  // Check category limits
  const categoryAlerts: { category: string; spent: number; limit: number }[] = [];
  Object.entries(userProfile.categoryLimits).forEach(([cat, limitVal]) => {
    const limit = Number(limitVal);
    const spent = summary.categoryTotals[cat] || 0;
    if (spent > limit) {
      categoryAlerts.push({ category: cat, spent, limit });
    }
  });

  // Upcoming recurring dues (next 7 days)
  const now = new Date();
  const upcomingRecurring = expenses
    .filter(e => e.isRecurring && e.nextDueDate)
    .sort((a, b) => (a.nextDueDate! > b.nextDueDate! ? 1 : -1))
    .slice(0, 3);

  // Initialize Doughnut Chart
  useEffect(() => {
    if (!doughnutCanvasRef.current) return;

    if (doughnutChartInstance.current) {
      doughnutChartInstance.current.destroy();
    }

    const categories = Object.keys(summary.categoryTotals);
    const dataValues = Object.values(summary.categoryTotals);
    const bgColors = categories.map(c => CATEGORY_METADATA[c]?.color || '#94A3B8');

    if (categories.length === 0) {
      categories.push('No Expenses Recorded');
      dataValues.push(1);
      bgColors.push('#CBD5E1');
    }

    const ctx = doughnutCanvasRef.current.getContext('2d');
    if (!ctx) return;

    doughnutChartInstance.current = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: categories,
        datasets: [
          {
            data: dataValues,
            backgroundColor: bgColors,
            borderColor: 'transparent',
            hoverOffset: 6,
            borderWidth: 0,
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
                const val = context.raw as number;
                return ` ${context.label}: ${formatCurrency(val, symbol, true)}`;
              },
            },
          },
        },
      },
    });

    return () => {
      if (doughnutChartInstance.current) {
        doughnutChartInstance.current.destroy();
      }
    };
  }, [summary.categoryTotals, symbol]);

  // Initialize Bar Chart (Past 6 months or 7-day spending)
  useEffect(() => {
    if (!barCanvasRef.current) return;

    if (barChartInstance.current) {
      barChartInstance.current.destroy();
    }

    // Build last 7 days spending
    const labels: string[] = [];
    const dailyValues: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const str = d.toISOString().slice(0, 10);
      const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' });
      labels.push(dayLabel);

      const dayTotal = expenses
        .filter(e => e.date === str)
        .reduce((sum, e) => sum + e.amount, 0);
      dailyValues.push(dayTotal);
    }

    const ctx = barCanvasRef.current.getContext('2d');
    if (!ctx) return;

    barChartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Daily Spend',
            data: dailyValues,
            backgroundColor: '#3B82F6',
            borderRadius: 6,
            barThickness: 18,
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
              callback: (val) => `${symbol}${val}`,
            },
          },
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => ` Spend: ${formatCurrency(context.raw as number, symbol, true)}`,
            },
          },
        },
      },
    });

    return () => {
      if (barChartInstance.current) {
        barChartInstance.current.destroy();
      }
    };
  }, [expenses, symbol]);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner / Budget Alerts Notification */}
      {isOverBudget ? (
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 bg-rose-500 text-white rounded-xl shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-rose-900 dark:text-rose-200">
              Budget Exceeded Alert: Spending is at {spentPct}% of Monthly Salary!
            </h3>
            <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
              You have spent {formatCurrency(summary.totalSpent, symbol, true)}, exceeding your monthly income of {formatCurrency(userProfile.monthlySalary, symbol)}. Consider reviewing lifestyle expenditures.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('salary')}
            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
          >
            Adjust Allocation
          </button>
        </div>
      ) : isNearBudgetLimit ? (
        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 bg-amber-500 text-white rounded-xl shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
              Budget Threshold Warning ({spentPct}% of monthly income used)
            </h3>
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
              You have reached your {userProfile.budgetAlertThreshold}% alert threshold with {formatCurrency(summary.remainingBudget, symbol, true)} remaining for the month.
            </p>
          </div>
          <button
            onClick={() => onSelectTab('expenses')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shrink-0 transition"
          >
            Review Transactions
          </button>
        </div>
      ) : null}

      {/* Category Specific Alerts */}
      {categoryAlerts.length > 0 && (
        <div className="p-3.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-200/80 dark:border-orange-900/40 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
            <div className="text-xs text-orange-900 dark:text-orange-200">
              <span className="font-bold">{categoryAlerts.length} Category Limit{categoryAlerts.length > 1 ? 's' : ''} Exceeded: </span>
              {categoryAlerts.map(c => `${c.category} (${formatCurrency(c.spent, symbol)} / ${formatCurrency(c.limit, symbol)})`).join(', ')}
            </div>
          </div>
          <button
            onClick={() => onSelectTab('salary')}
            className="text-xs font-bold text-orange-700 dark:text-orange-300 underline hover:text-orange-900 shrink-0 ml-2"
          >
            Rebalance
          </button>
        </div>
      )}

      {/* 4 Core KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Monthly Income / Salary */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Monthly Salary
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(userProfile.monthlySalary, symbol)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center">
              <CheckCircle className="w-3 h-3 mr-1" /> Active Income
            </span>
            <span>• 50/20/15/15 Rule</span>
          </div>
        </div>

        {/* Total Spent */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Total Spent
            </span>
            <div className={`p-2 rounded-xl ${isOverBudget ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/60' : 'bg-blue-50 text-blue-600 dark:bg-blue-950/60'}`}>
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 dark:text-white">
              {formatCurrency(summary.totalSpent, symbol, true)}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className="text-slate-500">{summary.itemCount} Transactions</span>
            <span className={`font-bold ${spentPct > 90 ? 'text-rose-600' : 'text-blue-600 dark:text-blue-400'}`}>
              {spentPct}% of Income
            </span>
          </div>
        </div>

        {/* Remaining Net Cash Flow */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Remaining Budget
            </span>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 rounded-xl">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className={`text-2xl font-black ${summary.remainingBudget < 0 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
              {formatCurrency(summary.remainingBudget, symbol, true)}
            </span>
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Projected End:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              {formatCurrency(summary.projectedMonthSpend, symbol)}
            </span>
          </div>
        </div>

        {/* Savings Rate & Daily Average */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Savings Rate
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              {summary.savingsRate}%
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
            <span>Daily Velocity:</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              ~{formatCurrency(summary.avgDailySpend, symbol)}/day
            </span>
          </div>
        </div>

      </div>

      {/* Main Analytics Grid: Category Doughnut Chart + 7-Day Spending Bar Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Category Breakdown (Doughnut) */}
        <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
                  <PieIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Category Breakdown</h3>
              </div>
              <button
                onClick={() => onSelectTab('expenses')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5"
              >
                View All <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>

            {/* Doughnut Chart Canvas with Center Metric */}
            <div className="relative h-56 w-full my-4 flex items-center justify-center">
              <canvas ref={doughnutCanvasRef} />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Spent</span>
                <span className="text-xl font-black text-slate-900 dark:text-white">
                  {formatCurrency(summary.totalSpent, symbol)}
                </span>
              </div>
            </div>
          </div>

          {/* Top Category List Badges */}
          <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            {Object.entries(summary.categoryTotals)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 4)
              .map(([cat, amount]) => {
                const meta = CATEGORY_METADATA[cat];
                const pct = summary.totalSpent > 0 ? Math.round((amount / summary.totalSpent) * 100) : 0;
                return (
                  <div key={cat} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: meta?.color || '#3B82F6' }} />
                      <span className="font-medium text-slate-700 dark:text-slate-300">{cat}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 dark:text-white">{formatCurrency(amount, symbol, true)}</span>
                      <span className="text-[10px] text-slate-400 w-8 text-right font-semibold">{pct}%</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        {/* 7-Day Spending Velocity (Bar Chart) & Salary Allocation Preview */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 7-Day Trend Chart Card */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">7-Day Spending Velocity</h3>
                <p className="text-xs text-slate-500">Daily transaction volume against monthly pace</p>
              </div>
              <span className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-lg">
                Last 7 Days
              </span>
            </div>
            <div className="h-52 w-full pt-4">
              <canvas ref={barCanvasRef} />
            </div>
          </div>

          {/* Salary Breakdown 50/20/15/15 Target vs Actual Bar */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <PieIcon className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">50/20/15/15 Salary Allocation Actuals</h3>
              </div>
              <button
                onClick={() => onSelectTab('salary')}
                className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
              >
                Wealth Simulator <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Essentials Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Essentials (Target {userProfile.salaryAllocation.essentialsPct}% = {formatCurrency(summary.targets.essentials, symbol)})
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(summary.bucketActuals.essentials, symbol)} spent
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.bucketActuals.essentials > summary.targets.essentials ? 'bg-rose-500' : 'bg-blue-600'
                    }`}
                    style={{ width: `${Math.min(100, (summary.bucketActuals.essentials / (summary.targets.essentials || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Investments Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Investments (Target {userProfile.salaryAllocation.investmentsPct}% = {formatCurrency(summary.targets.investments, symbol)})
                  </span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(summary.bucketActuals.investments, symbol)} contributed
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (summary.bucketActuals.investments / (summary.targets.investments || 1)) * 100)}%` }}
                  />
                </div>
              </div>

              {/* Lifestyle Bar */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">
                    Lifestyle / Leisure (Target {userProfile.salaryAllocation.lifestylePct}% = {formatCurrency(summary.targets.lifestyle, symbol)})
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {formatCurrency(summary.bucketActuals.lifestyle, symbol)} spent
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      summary.bucketActuals.lifestyle > summary.targets.lifestyle ? 'bg-amber-500' : 'bg-purple-600'
                    }`}
                    style={{ width: `${Math.min(100, (summary.bucketActuals.lifestyle / (summary.targets.lifestyle || 1)) * 100)}%` }}
                  />
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      {/* Bottom Row: Recent Transactions & Upcoming Recurring Bills */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Recent Transactions List */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Recent Transactions</h3>
              <p className="text-xs text-slate-500">Audit trail of latest expenses</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAddModal}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm"
              >
                <Plus className="w-3.5 h-3.5" /> New Expense
              </button>
              <button
                onClick={() => onSelectTab('expenses')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline ml-2"
              >
                View All
              </button>
            </div>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80 mt-2">
            {expenses.slice(0, 5).map(exp => {
              const meta = CATEGORY_METADATA[exp.category];
              return (
                <div 
                  key={exp.id} 
                  className="py-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2 transition cursor-pointer"
                  onClick={() => onEditExpense(exp)}
                >
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: meta?.color || '#3B82F6' }}
                    >
                      <Receipt className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">{exp.name}</span>
                        {exp.isRecurring && (
                          <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 rounded">
                            <Repeat className="w-2.5 h-2.5" /> Recurring
                          </span>
                        )}
                        {exp.attachment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onViewReceipt(exp.attachment, exp.name);
                            }}
                            className="p-1 text-slate-400 hover:text-blue-600 transition"
                            title="View Attached Receipt"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-blue-500" />
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span>{formatDateDisplay(exp.date)}</span>
                        <span>•</span>
                        <span>{exp.category}</span>
                        <span>•</span>
                        <span className="text-[11px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {exp.paymentMethod}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-sm font-black text-slate-900 dark:text-white block">
                      {formatCurrency(exp.amount, symbol, true)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Recorded</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming Recurring Subscriptions & Financial Goals Progress */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Upcoming Bills Widget */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">Upcoming Dues</h3>
              </div>
              <button
                onClick={() => onSelectTab('recurring')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Manage
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {upcomingRecurring.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">No upcoming bills scheduled</p>
              ) : (
                upcomingRecurring.map(bill => (
                  <div key={bill.id} className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">{bill.name}</p>
                      <p className="text-[11px] text-slate-500">Due: {formatDateDisplay(bill.nextDueDate || '')}</p>
                    </div>
                    <span className="text-xs font-black text-slate-900 dark:text-white">
                      {formatCurrency(bill.amount, symbol, true)}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Goals Quick Snapshot */}
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Active Goals</h3>
              <button
                onClick={() => onSelectTab('goals')}
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Goals Hub
              </button>
            </div>

            <div className="space-y-3 mt-3">
              {goals.slice(0, 2).map(goal => {
                const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
                return (
                  <div key={goal.id} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{goal.title}</span>
                      <span className="font-bold text-slate-900 dark:text-white">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};
