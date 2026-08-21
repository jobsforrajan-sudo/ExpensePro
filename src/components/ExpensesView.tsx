import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Plus, 
  Trash2, 
  Edit3, 
  Paperclip, 
  Repeat, 
  Calendar, 
  ArrowUpDown, 
  FileSpreadsheet, 
  CheckSquare, 
  Square,
  Sparkles,
  Download,
  AlertCircle,
  IndianRupee
} from 'lucide-react';
import { Expense, ExpenseCategory, PaymentMethod, UserProfile } from '../types';
import { formatCurrency, formatDateDisplay } from '../utils/calculations';
import { CATEGORY_METADATA } from '../data/initialData';
import { exportExpensesToCSV } from '../utils/export';

interface ExpensesViewProps {
  expenses: Expense[];
  userProfile: UserProfile;
  onOpenAddModal: () => void;
  onEditExpense: (expense: Expense) => void;
  onDeleteExpense: (id: string) => void;
  onBulkDeleteExpenses: (ids: string[]) => void;
  onViewReceipt: (attachment: any, name: string) => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses,
  userProfile,
  onOpenAddModal,
  onEditExpense,
  onDeleteExpense,
  onBulkDeleteExpenses,
  onViewReceipt,
}) => {
  const symbol = userProfile.currencySymbol || '₹';

  // Filters and Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('ALL');
  const [dateFilter, setDateFilter] = useState<'ALL' | 'THIS_MONTH' | 'LAST_MONTH' | 'RECURRING_ONLY'>('ALL');
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'amount_desc' | 'amount_asc' | 'name'>('date_desc');

  // Multi-select bulk state
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Filtered & Sorted Expenses computation
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const thisMonthStr = now.toISOString().slice(0, 7);
    
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthStr = lastMonthDate.toISOString().slice(0, 7);

    return expenses.filter(exp => {
      // Search
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesName = exp.name.toLowerCase().includes(query);
        const matchesNotes = exp.notes?.toLowerCase().includes(query);
        const matchesCat = exp.category.toLowerCase().includes(query);
        if (!matchesName && !matchesNotes && !matchesCat) return false;
      }

      // Category filter
      if (selectedCategory !== 'ALL' && exp.category !== selectedCategory) {
        return false;
      }

      // Payment method filter
      if (selectedPaymentMethod !== 'ALL' && exp.paymentMethod !== selectedPaymentMethod) {
        return false;
      }

      // Date range filter
      if (dateFilter === 'THIS_MONTH' && !exp.date.startsWith(thisMonthStr)) {
        return false;
      }
      if (dateFilter === 'LAST_MONTH' && !exp.date.startsWith(lastMonthStr)) {
        return false;
      }
      if (dateFilter === 'RECURRING_ONLY' && !exp.isRecurring) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      switch (sortBy) {
        case 'date_desc': return b.date.localeCompare(a.date);
        case 'date_asc': return a.date.localeCompare(b.date);
        case 'amount_desc': return b.amount - a.amount;
        case 'amount_asc': return a.amount - b.amount;
        case 'name': return a.name.localeCompare(b.name);
        default: return 0;
      }
    });
  }, [expenses, searchTerm, selectedCategory, selectedPaymentMethod, dateFilter, sortBy]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredExpenses.length / itemsPerPage) || 1;
  const paginatedExpenses = filteredExpenses.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const totalFilteredSum = filteredExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  // Bulk Selection Handlers
  const handleToggleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === paginatedExpenses.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(paginatedExpenses.map(e => e.id));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (confirm(`Are you sure you want to delete ${selectedIds.length} selected transaction(s)?`)) {
      onBulkDeleteExpenses(selectedIds);
      setSelectedIds([]);
    }
  };

  const handleExportFiltered = () => {
    exportExpensesToCSV(filteredExpenses, symbol);
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Header & Metrics Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <div className="p-2 bg-blue-50 dark:bg-blue-950/60 rounded-xl text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/60">
              <IndianRupee className="w-6 h-6" />
            </div>
            Transaction Ledger & Expenses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Filter, audit, and organize your expenses with receipt verification
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportFiltered}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 transition"
            title="Export current filtered list to CSV"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export CSV ({filteredExpenses.length})</span>
          </button>
          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-md hover:shadow transition"
          >
            <Plus className="w-4 h-4" /> Add Expense
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        
        {/* Search input and Quick Filters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by merchant, note, or category..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-9 pr-3.5 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-3">
            <select
              value={selectedCategory}
              onChange={(e) => {
                setSelectedCategory(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Categories ({expenses.length})</option>
              {Object.keys(CATEGORY_METADATA).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div className="md:col-span-2">
            <select
              value={selectedPaymentMethod}
              onChange={(e) => {
                setSelectedPaymentMethod(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="ALL">All Payments</option>
              <option value="UPI">UPI</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Cash">Cash</option>
              <option value="Cryptocurrency">Crypto</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="md:col-span-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date_desc">Date: Newest First</option>
              <option value="date_asc">Date: Oldest First</option>
              <option value="amount_desc">Amount: High to Low</option>
              <option value="amount_asc">Amount: Low to High</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>

        </div>

        {/* Date Filter Badges */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 flex-wrap gap-2">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Period:</span>
            <button
              onClick={() => { setDateFilter('ALL'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                dateFilter === 'ALL'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              All Time
            </button>
            <button
              onClick={() => { setDateFilter('THIS_MONTH'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                dateFilter === 'THIS_MONTH'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              This Month
            </button>
            <button
              onClick={() => { setDateFilter('LAST_MONTH'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                dateFilter === 'LAST_MONTH'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Last Month
            </button>
            <button
              onClick={() => { setDateFilter('RECURRING_ONLY'); setCurrentPage(1); }}
              className={`text-xs px-2.5 py-1 rounded-lg font-medium transition ${
                dateFilter === 'RECURRING_ONLY'
                  ? 'bg-blue-600 text-white font-bold'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              Recurring Bills Only
            </button>
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-900 dark:text-white">{filteredExpenses.length}</strong> records (Total: <strong className="text-slate-900 dark:text-white">{formatCurrency(totalFilteredSum, symbol, true)}</strong>)
          </div>
        </div>

      </div>

      {/* Bulk Action Bar (if items selected) */}
      {selectedIds.length > 0 && (
        <div className="p-3 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-xl flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2 text-xs text-blue-900 dark:text-blue-200 font-semibold">
            <CheckSquare className="w-4 h-4 text-blue-600" />
            <span>{selectedIds.length} expense(s) selected</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete Selected
            </button>
            <button
              onClick={() => setSelectedIds([])}
              className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-white dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Expense List Table / Card Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Table Header */}
        <div className="grid grid-cols-12 gap-3 px-6 py-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 items-center">
          <div className="col-span-1 flex items-center">
            <button 
              onClick={handleSelectAll} 
              className="p-1 text-slate-400 hover:text-slate-700"
              title="Select all on page"
            >
              {selectedIds.length === paginatedExpenses.length && paginatedExpenses.length > 0 ? (
                <CheckSquare className="w-4 h-4 text-blue-600" />
              ) : (
                <Square className="w-4 h-4" />
              )}
            </button>
          </div>
          <div className="col-span-4 sm:col-span-4">Transaction / Merchant</div>
          <div className="col-span-2 hidden sm:block">Category</div>
          <div className="col-span-2 hidden md:block">Payment Method</div>
          <div className="col-span-2 text-right">Amount</div>
          <div className="col-span-3 sm:col-span-1 text-right">Actions</div>
        </div>

        {/* List Content */}
        {paginatedExpenses.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">No transactions match your filters</p>
            <p className="text-xs text-slate-400">Try clearing search keywords or adding a new expense record.</p>
            <button
              onClick={onOpenAddModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Record New Expense
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {paginatedExpenses.map(exp => {
              const meta = CATEGORY_METADATA[exp.category];
              const isSelected = selectedIds.includes(exp.id);

              return (
                <div
                  key={exp.id}
                  className={`grid grid-cols-12 gap-3 px-6 py-4 items-center hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition ${
                    isSelected ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <div className="col-span-1 flex items-center">
                    <button
                      onClick={() => handleToggleSelect(exp.id)}
                      className="p-1 text-slate-400 hover:text-slate-700"
                    >
                      {isSelected ? (
                        <CheckSquare className="w-4 h-4 text-blue-600" />
                      ) : (
                        <Square className="w-4 h-4 text-slate-300 dark:text-slate-600" />
                      )}
                    </button>
                  </div>

                  {/* Name, Date, Notes & Attachment badge */}
                  <div className="col-span-4 sm:col-span-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {exp.name}
                      </span>
                      {exp.isRecurring && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold bg-blue-50 text-blue-600 dark:bg-blue-950/60 dark:text-blue-300 px-1.5 py-0.5 rounded shrink-0">
                          <Repeat className="w-2.5 h-2.5" /> {exp.recurringFrequency || 'Recurring'}
                        </span>
                      )}
                      {exp.attachment && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(exp.attachment, exp.name)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded transition"
                          title="View verified receipt"
                        >
                          <Paperclip className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                      <span>{formatDateDisplay(exp.date)}</span>
                      {exp.notes && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px] italic text-slate-400">"{exp.notes}"</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Category Pill */}
                  <div className="col-span-2 hidden sm:block">
                    <span 
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold truncate max-w-full"
                      style={{ 
                        backgroundColor: `${meta?.color || '#3B82F6'}15`, 
                        color: meta?.color || '#3B82F6' 
                      }}
                    >
                      {exp.category}
                    </span>
                  </div>

                  {/* Payment Method */}
                  <div className="col-span-2 hidden md:block text-xs font-medium text-slate-600 dark:text-slate-400">
                    <span className="bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded-md">
                      {exp.paymentMethod}
                    </span>
                  </div>

                  {/* Amount */}
                  <div className="col-span-2 text-right">
                    <span className="font-black text-sm text-slate-900 dark:text-white block">
                      {formatCurrency(exp.amount, symbol, true)}
                    </span>
                  </div>

                  {/* Action Buttons */}
                  <div className="col-span-3 sm:col-span-1 flex items-center justify-end gap-1">
                    <button
                      onClick={() => onEditExpense(exp)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Edit transaction"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${exp.name}"?`)) onDeleteExpense(exp.id);
                      }}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition"
                      title="Delete transaction"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-200 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
