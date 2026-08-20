import React, { useState } from 'react';
import { 
  Target, 
  Plus, 
  ShieldCheck, 
  Home, 
  Plane, 
  Car, 
  GraduationCap, 
  Sparkles, 
  TrendingUp, 
  Calendar, 
  Trash2, 
  DollarSign,
  CheckCircle2,
  X,
  Wallet,
  PieChart,
  Lightbulb
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { FinancialGoal, UserProfile } from '../types';
import { formatCurrency, calculateRequiredSIPForGoal, formatDateDisplay, calculateNetWorthSummary } from '../utils/calculations';
import { NetWorthView } from './NetWorthView';
import { WealthGrowthStrategy } from './WealthGrowthStrategy';

interface GoalsViewProps {
  goals: FinancialGoal[];
  userProfile: UserProfile;
  onAddGoal: (goal: Omit<FinancialGoal, 'id'>) => void;
  onUpdateGoal: (goal: FinancialGoal) => void;
  onDeleteGoal: (id: string) => void;
  onUpdateProfile?: (profile: UserProfile) => void;
  onToast?: (message: string) => void;
}

export const GoalsView: React.FC<GoalsViewProps> = ({
  goals,
  userProfile,
  onAddGoal,
  onUpdateGoal,
  onDeleteGoal,
  onUpdateProfile,
  onToast,
}) => {
  const symbol = userProfile.currencySymbol || '₹';

  // Sub-tab state: 'networth' or 'goals'
  const [activeSubTab, setActiveSubTab] = useState<'networth' | 'goals'>('networth');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [contributeGoal, setContributeGoal] = useState<FinancialGoal | null>(null);
  const [depositAmount, setDepositAmount] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<FinancialGoal['category']>('Emergency Fund');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState('2027-12-31');
  const [notes, setNotes] = useState('');

  // Net Worth quick metric
  const netWorthSummary = userProfile.netWorth 
    ? calculateNetWorthSummary(userProfile.netWorth.assets, userProfile.netWorth.liabilities)
    : null;

  const getCategoryIcon = (cat: FinancialGoal['category']) => {
    switch (cat) {
      case 'Emergency Fund': return <ShieldCheck className="w-5 h-5 text-emerald-600" />;
      case 'Real Estate': return <Home className="w-5 h-5 text-blue-600" />;
      case 'Vacation': return <Plane className="w-5 h-5 text-amber-600" />;
      case 'Vehicle': return <Car className="w-5 h-5 text-indigo-600" />;
      case 'Education': return <GraduationCap className="w-5 h-5 text-purple-600" />;
      default: return <Target className="w-5 h-5 text-rose-600" />;
    }
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !targetAmount) return;

    onAddGoal({
      title: title.trim(),
      category,
      targetAmount: parseFloat(targetAmount) || 1000,
      currentAmount: parseFloat(currentAmount) || 0,
      targetDate,
      icon: 'Target',
      notes: notes.trim() || undefined,
    });

    setTitle('');
    setTargetAmount('');
    setCurrentAmount('');
    setNotes('');
    setIsAddModalOpen(false);
    if (onToast) {
      onToast(`Goal "${title.trim()}" created successfully!`);
    }
  };

  const handleContribute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contributeGoal || !depositAmount) return;

    const added = parseFloat(depositAmount) || 0;
    const newTotal = contributeGoal.currentAmount + added;

    if (newTotal >= contributeGoal.targetAmount && contributeGoal.currentAmount < contributeGoal.targetAmount) {
      // Trigger milestone celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      if (onToast) {
        onToast(`🎉 Congratulations! Milestone achieved for "${contributeGoal.title}"!`);
      }
    } else if (onToast) {
      onToast(`Added ${formatCurrency(added, symbol)} to "${contributeGoal.title}"`);
    }

    onUpdateGoal({
      ...contributeGoal,
      currentAmount: newTotal,
    });

    setContributeGoal(null);
    setDepositAmount('');
  };

  const totalSavedAcrossGoals = goals.reduce((acc, g) => acc + g.currentAmount, 0);
  const totalTargetAcrossGoals = goals.reduce((acc, g) => acc + g.targetAmount, 0);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner with Navigation Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <Wallet className="w-6 h-6 text-blue-600" />
            Net Worth & Wealth Goals Hub
          </h1>
          <p className="text-xs text-slate-500">
            Track total net worth balance sheet, asset allocations, solvency health, and milestone targets
          </p>
        </div>

        {/* Dual Mode Switcher */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 self-start md:self-auto shadow-inner">
          <button
            id="subtab-networth-btn"
            onClick={() => setActiveSubTab('networth')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'networth'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Net Worth Dashboard</span>
            {netWorthSummary && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${activeSubTab === 'networth' ? 'bg-blue-700 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'}`}>
                {formatCurrency(netWorthSummary.netWorth, symbol)}
              </span>
            )}
          </button>

          <button
            id="subtab-goals-btn"
            onClick={() => setActiveSubTab('goals')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
              activeSubTab === 'goals'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Target className="w-4 h-4" />
            <span>Milestones & Goals ({goals.length})</span>
          </button>
        </div>
      </div>

      {/* Sub-Tab 1: Net Worth Hub */}
      {activeSubTab === 'networth' && (
        <div className="space-y-6">
          <NetWorthView
            userProfile={userProfile}
            onUpdateProfile={(updated) => onUpdateProfile && onUpdateProfile(updated)}
            onToast={onToast}
          />
          <WealthGrowthStrategy
            userProfile={userProfile}
            goals={goals}
            onToast={onToast}
          />
        </div>
      )}

      {/* Sub-Tab 2: Financial Milestones & Goals View */}
      {activeSubTab === 'goals' && (
        <div className="space-y-6 animate-in fade-in duration-300">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Target Milestone Tracker
              </h2>
              <p className="text-xs text-slate-500">
                Individual savings targets with automated monthly SIP calculations
              </p>
            </div>

            <button
              onClick={() => setIsAddModalOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" /> Create New Goal
            </button>
          </div>

          {/* Aggregate Overview Card */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 to-indigo-950 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-6 border border-slate-800">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-300">
                Total Goal Portfolio Progress
              </span>
              <div className="text-3xl font-black mt-1">
                {formatCurrency(totalSavedAcrossGoals, symbol)} <span className="text-sm font-normal text-slate-400">/ {formatCurrency(totalTargetAcrossGoals, symbol)}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                {goals.length} active financial targets in progress
              </p>
            </div>

            <div className="sm:w-64 space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span>Overall Fulfillment</span>
                <span>{totalTargetAcrossGoals > 0 ? Math.round((totalSavedAcrossGoals / totalTargetAcrossGoals) * 100) : 0}%</span>
              </div>
              <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                  style={{ width: `${totalTargetAcrossGoals > 0 ? Math.min(100, (totalSavedAcrossGoals / totalTargetAcrossGoals) * 100) : 0}%` }}
                />
              </div>
            </div>
          </div>

          {/* Goals Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {goals.map(goal => {
              const pct = Math.min(100, Math.round((goal.currentAmount / goal.targetAmount) * 100));
              const remaining = Math.max(0, goal.targetAmount - goal.currentAmount);

              // Calculate years left to target date
              const targetD = new Date(goal.targetDate);
              const nowD = new Date();
              const monthsLeft = Math.max(1, Math.round((targetD.getTime() - nowD.getTime()) / (1000 * 60 * 60 * 24 * 30.4)));
              const yearsLeft = monthsLeft / 12;
              const monthlyRequired = calculateRequiredSIPForGoal(remaining, 10, yearsLeft);

              const isCompleted = goal.currentAmount >= goal.targetAmount;

              return (
                <div 
                  key={goal.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5 hover:border-blue-500/50 transition"
                >
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          {getCategoryIcon(goal.category)}
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-slate-900 dark:text-white leading-tight">{goal.title}</h3>
                          <span className="text-xs text-slate-400">{goal.category}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (confirm(`Remove goal "${goal.title}"?`)) onDeleteGoal(goal.id);
                        }}
                        className="text-slate-400 hover:text-rose-600 transition p-1"
                        title="Delete goal"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Amount Progress */}
                    <div className="mt-5 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xl font-black text-slate-900 dark:text-white">
                          {formatCurrency(goal.currentAmount, symbol)}
                        </span>
                        <span className="text-xs font-semibold text-slate-500">
                          Target: {formatCurrency(goal.targetAmount, symbol)}
                        </span>
                      </div>

                      <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-emerald-500' : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex justify-between text-xs text-slate-500 pt-1">
                        <span>{pct}% Funded</span>
                        <span>{isCompleted ? '🎉 Goal Achieved!' : `${formatCurrency(remaining, symbol)} to go`}</span>
                      </div>
                    </div>

                    {/* SIP Monthly Requirement */}
                    {!isCompleted && (
                      <div className="mt-4 p-3 bg-blue-50/60 dark:bg-blue-950/40 rounded-xl border border-blue-100 dark:border-blue-900/40 text-xs">
                        <div className="flex justify-between text-blue-900 dark:text-blue-200">
                          <span>Required Monthly SIP:</span>
                          <strong className="font-bold">{formatCurrency(monthlyRequired, symbol)}/mo</strong>
                        </div>
                        <p className="text-[10px] text-blue-700 dark:text-blue-300 mt-0.5">
                          To reach target by {formatDateDisplay(goal.targetDate)} ({monthsLeft} mos remaining @ 10% APY)
                        </p>
                      </div>
                    )}

                    {goal.notes && (
                      <p className="text-xs text-slate-500 italic mt-3 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-lg">
                        "{goal.notes}"
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="pt-2">
                    <button
                      onClick={() => setContributeGoal(goal)}
                      className="w-full py-2.5 bg-slate-100 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-bold text-xs rounded-xl transition border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Deposit / Milestone Progress
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Contextual Wealth Strategy Section within Goals View */}
          <WealthGrowthStrategy
            userProfile={userProfile}
            goals={goals}
            onToast={onToast}
          />
        </div>
      )}

      {/* Quick Deposit Modal */}
      {contributeGoal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-sm p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Add Contribution: {contributeGoal.title}
              </h3>
              <button 
                onClick={() => setContributeGoal(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleContribute} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Deposit Amount ({symbol})
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  step="any"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder="e.g. 5000"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-bold text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setContributeGoal(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow transition"
                >
                  Confirm Deposit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" /> Create Financial Goal
              </h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateGoal} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Goal Title *</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. 6-Month Emergency Fund"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  >
                    <option value="Emergency Fund">Emergency Fund</option>
                    <option value="Real Estate">Real Estate</option>
                    <option value="Vacation">Vacation</option>
                    <option value="Vehicle">Vehicle</option>
                    <option value="Education">Education</option>
                    <option value="General">General Milestone</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Date</label>
                  <input
                    type="date"
                    required
                    value={targetDate}
                    onChange={(e) => setTargetDate(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Target Amount ({symbol}) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="e.g. 500000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Current Saved ({symbol})</label>
                  <input
                    type="number"
                    min="0"
                    value={currentAmount}
                    onChange={(e) => setCurrentAmount(e.target.value)}
                    placeholder="e.g. 100000"
                    className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">Strategic Notes (Optional)</label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Stored in Liquid Mutual Funds & Sweep-in Fixed Deposits"
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 font-semibold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition"
                >
                  Save Goal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
