import React, { useState } from 'react';
import { 
  CalendarClock, 
  Repeat, 
  Plus, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Play, 
  Sparkles, 
  Trash2,
  Edit3
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Expense, UserProfile } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils/calculations';
import { CATEGORY_METADATA } from '../data/initialData';

interface RecurringExpensesViewProps {
  expenses: Expense[];
  userProfile: UserProfile;
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onProcessRecurring: (recurringExpense: Expense) => void;
}

export const RecurringExpensesView: React.FC<RecurringExpensesViewProps> = ({
  expenses,
  userProfile,
  onOpenAddModal,
  onEditExpense,
  onProcessRecurring,
}) => {
  const symbol = userProfile.currencySymbol || '₹';
  const recurringBills = expenses.filter(e => e.isRecurring);

  const [processedIds, setProcessedIds] = useState<string[]>([]);

  // Calculate monthly recurring commitment
  const totalMonthlyRecurringCommitment = recurringBills.reduce((acc, curr) => {
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

  const handleRunBill = (bill: Expense) => {
    onProcessRecurring(bill);
    setProcessedIds(prev => [...prev, bill.id]);
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 },
    });
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <CalendarClock className="w-6 h-6 text-blue-600" />
            Recurring Subscriptions & Scheduled Bills
          </h1>
          <p className="text-xs text-slate-500">
            Automate fixed costs, track upcoming renewal deadlines, and simulate monthly commitments
          </p>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow transition"
        >
          <Plus className="w-4 h-4" /> Add Subscription / Bill
        </button>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Committed Cost</span>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatCurrency(totalMonthlyRecurringCommitment, symbol)}/mo
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            {Math.round((totalMonthlyRecurringCommitment / (userProfile.monthlySalary || 1)) * 100)}% of monthly gross income
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Subscriptions</span>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
            {recurringBills.length} Active Rules
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Automated calendar synchronization enabled
          </p>
        </div>

        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Annualized Run Rate</span>
          <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {formatCurrency(totalMonthlyRecurringCommitment * 12, symbol)}/yr
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Expected total outflow across next 12 months
          </p>
        </div>
      </div>

      {/* Recurring Bills List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="font-bold text-sm text-slate-900 dark:text-white">Active Recurring Outflows</h3>
          <span className="text-xs text-slate-500">{recurringBills.length} items configured</span>
        </div>

        {recurringBills.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Repeat className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p className="font-bold text-sm text-slate-700 dark:text-slate-300">No recurring expenses set up</p>
            <p className="text-xs text-slate-400 mt-1">When adding an expense, check the "Recurring Subscription / Bill" box.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recurringBills.map(bill => {
              const meta = CATEGORY_METADATA[bill.category];
              const isProcessed = processedIds.includes(bill.id);

              return (
                <div key={bill.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition">
                  
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm"
                      style={{ backgroundColor: meta?.color || '#3B82F6' }}
                    >
                      <Repeat className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{bill.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/60">
                          {bill.recurringFrequency || 'Monthly'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                        <span>{bill.category}</span>
                        <span>•</span>
                        <span>Paid via {bill.paymentMethod}</span>
                        {bill.nextDueDate && (
                          <>
                            <span>•</span>
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              Next Due: {formatDateDisplay(bill.nextDueDate)}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right">
                      <span className="text-lg font-black text-slate-900 dark:text-white block">
                        {formatCurrency(bill.amount, symbol, true)}
                      </span>
                      <span className="text-[11px] text-slate-400 font-medium">per cycle</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => onEditExpense(bill)}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition"
                        title="Edit rule"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        disabled={isProcessed}
                        onClick={() => handleRunBill(bill)}
                        className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                          isProcessed
                            ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 cursor-default'
                            : 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:opacity-90 shadow-sm'
                        }`}
                      >
                        {isProcessed ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Processed for Today
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            Post Transaction Now
                          </>
                        )}
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
