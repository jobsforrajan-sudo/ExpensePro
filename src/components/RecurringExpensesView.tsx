import React, { useState, useMemo } from 'react';
import { 
  CalendarClock, 
  Repeat, 
  Plus, 
  Search, 
  Edit3,
  Calendar,
  CreditCard,
  Tag,
  IndianRupee,
  Clock,
  Sparkles,
  Layers
} from 'lucide-react';
import { Expense, UserProfile, RecurringFrequency } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils/calculations';
import { CATEGORY_METADATA } from '../data/initialData';

interface RecurringExpensesViewProps {
  expenses: Expense[];
  userProfile: UserProfile;
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onProcessRecurring?: (recurringExpense: Expense) => void;
}

export const RecurringExpensesView: React.FC<RecurringExpensesViewProps> = ({
  expenses,
  userProfile,
  onOpenAddModal,
  onEditExpense,
}) => {
  const symbol = userProfile.currencySymbol || '₹';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');

  // Filter all expenses marked as recurring
  const recurringBills = useMemo(() => {
    return expenses.filter(e => e.isRecurring);
  }, [expenses]);

  // Calculate monthly normalized recurring commitment
  const totalMonthlyCommitment = useMemo(() => {
    return recurringBills.reduce((acc, curr) => {
      switch (curr.recurringFrequency) {
        case 'Daily': return acc + (curr.amount * 30);
        case 'Weekly': return acc + (curr.amount * 4.33);
        case 'Bi-Weekly': return acc + (curr.amount * 2.16);
        case 'Monthly': return acc + curr.amount;
        case 'Quarterly': return acc + (curr.amount / 3);
        case 'Yearly': return acc + (curr.amount / 12);
        default: return acc + curr.amount;
      }
    }, 0);
  }, [recurringBills]);

  // Frequency counts for filter badges
  const frequencyCounts = useMemo(() => {
    const counts: Record<string, number> = { all: recurringBills.length };
    recurringBills.forEach(b => {
      const freq = b.recurringFrequency || 'Monthly';
      counts[freq] = (counts[freq] || 0) + 1;
    });
    return counts;
  }, [recurringBills]);

  // Filtered list based on search and selected frequency
  const filteredBills = useMemo(() => {
    return recurringBills.filter(bill => {
      const matchesSearch = 
        bill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bill.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (bill.notes && bill.notes.toLowerCase().includes(searchQuery.toLowerCase())) ||
        bill.paymentMethod.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesFreq = 
        selectedFrequency === 'all' || 
        (bill.recurringFrequency || 'Monthly').toLowerCase() === selectedFrequency.toLowerCase();

      return matchesSearch && matchesFreq;
    });
  }, [recurringBills, searchQuery, selectedFrequency]);

  // Helper to compute normalized monthly cost for display
  const getMonthlyEquivalent = (amount: number, frequency?: RecurringFrequency) => {
    if (!frequency || frequency === 'Monthly') return null;
    let monthly = amount;
    if (frequency === 'Daily') monthly = amount * 30;
    else if (frequency === 'Weekly') monthly = amount * 4.33;
    else if (frequency === 'Bi-Weekly') monthly = amount * 2.16;
    else if (frequency === 'Quarterly') monthly = amount / 3;
    else if (frequency === 'Yearly') monthly = amount / 12;
    return Math.round(monthly);
  };

  const monthlySalary = userProfile.monthlySalary || 1;
  const incomePercentage = Math.round((totalMonthlyCommitment / monthlySalary) * 100);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
              <CalendarClock className="w-6 h-6" />
            </div>
            Recurring Subscriptions & Bills
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage scheduled commitments, renewal cycles, and monthly budget impact
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-xs transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Subscription</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        
        {/* Monthly Committed Cost */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Monthly Commitment</span>
            <IndianRupee className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {formatCurrency(totalMonthlyCommitment, symbol)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ mo</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Represents <span className="font-bold text-blue-600 dark:text-blue-400">{incomePercentage}%</span> of monthly income
          </p>
        </div>

        {/* Active Subscriptions Count */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Active Outflows</span>
            <Repeat className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-white">
            {recurringBills.length}
            <span className="text-xs font-normal text-slate-400 ml-1">Rules</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Active auto-debit & recurring schedules
          </p>
        </div>

        {/* Annualized Run Rate */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wider text-slate-400">
            <span>Annual Run Rate</span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalMonthlyCommitment * 12, symbol)}
            <span className="text-xs font-normal text-slate-400 ml-1">/ yr</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
            Projected 12-month recurring obligation
          </p>
        </div>

      </div>

      {/* Main Recurring List Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden">
        
        {/* Controls Bar: Search & Frequency Filters */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <h2 className="font-bold text-base text-slate-900 dark:text-white">
              Active Recurring Outflows
            </h2>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
              {filteredBills.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search subscriptions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-56 pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>

            {/* Frequency Filter Chips */}
            <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
              {[
                { id: 'all', label: 'All' },
                { id: 'monthly', label: 'Monthly' },
                { id: 'quarterly', label: 'Quarterly' },
                { id: 'yearly', label: 'Yearly' },
              ].map((filter) => {
                const count = filter.id === 'all' 
                  ? recurringBills.length 
                  : (frequencyCounts[filter.id.charAt(0).toUpperCase() + filter.id.slice(1)] || 0);

                if (filter.id !== 'all' && count === 0) return null;

                return (
                  <button
                    key={filter.id}
                    onClick={() => setSelectedFrequency(filter.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1.5 ${
                      selectedFrequency === filter.id
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{filter.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      selectedFrequency === filter.id
                        ? 'bg-blue-500 text-white'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

          </div>

        </div>

        {/* Outflows List */}
        {filteredBills.length === 0 ? (
          <div className="p-12 text-center text-slate-400 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mx-auto text-slate-400">
              <Repeat className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-sm text-slate-700 dark:text-slate-300">
                {recurringBills.length === 0 ? 'No recurring expenses configured' : 'No subscriptions match your search'}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                {recurringBills.length === 0
                  ? 'Add your subscriptions, utility bills, and memberships to track fixed obligations.'
                  : 'Try adjusting your search terms or frequency filters.'}
              </p>
            </div>
            {recurringBills.length === 0 && (
              <button
                onClick={onOpenAddModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl hover:bg-blue-700 transition"
              >
                <Plus className="w-4 h-4" /> Add Subscription
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredBills.map(bill => {
              const meta = CATEGORY_METADATA[bill.category];
              const freq = bill.recurringFrequency || 'Monthly';
              const monthlyEq = getMonthlyEquivalent(bill.amount, bill.recurringFrequency);

              return (
                <div 
                  key={bill.id} 
                  className="p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                >
                  
                  {/* Left: Category Icon + Details */}
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-xs"
                      style={{ backgroundColor: meta?.color || '#3B82F6' }}
                    >
                      <Repeat className="w-5 h-5" />
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                          {bill.name}
                        </h3>
                        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60">
                          {freq}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                        <span className="font-medium text-slate-600 dark:text-slate-300">
                          {bill.category}
                        </span>
                        <span>•</span>
                        <span>Paid via {bill.paymentMethod}</span>
                        {bill.nextDueDate && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-slate-400" />
                              Next Due: {formatDateDisplay(bill.nextDueDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Clean Edit Action */}
                  <div className="flex items-center justify-between sm:justify-end gap-5 self-stretch sm:self-center pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                    <div className="text-left sm:text-right">
                      <div className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                        {formatCurrency(bill.amount, symbol, true)}
                        <span className="text-[11px] text-slate-400 font-semibold ml-1">
                          / {freq.toLowerCase()}
                        </span>
                      </div>
                      {monthlyEq !== null && (
                        <span className="text-[11px] text-slate-400 font-medium block">
                          ~{formatCurrency(monthlyEq, symbol)} / mo
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditExpense(bill)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition"
                        title="Edit subscription details"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
};
