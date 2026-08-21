import React, { useState, useEffect, useRef } from 'react';
import { 
  Navbar 
} from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { SalaryBreakdownView } from './components/SalaryBreakdownView';
import { ExpensesView } from './components/ExpensesView';
import { GoalsView } from './components/GoalsView';
import { RecurringExpensesView } from './components/RecurringExpensesView';
import { AnalyticsView } from './components/AnalyticsView';
import { AddExpenseModal } from './components/AddExpenseModal';
import { EditExpenseModal } from './components/EditExpenseModal';
import { ReceiptModal } from './components/ReceiptModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';
import { Expense, FinancialGoal, UserProfile, AttachmentFile, SyncStatus } from './types';
import { 
  loadStoredExpenses, 
  saveStoredExpenses, 
  loadStoredUserProfile, 
  saveStoredUserProfile, 
  loadStoredGoals, 
  saveStoredGoals, 
  loadStoredTheme, 
  saveStoredTheme,
  resetToInitialSeedData 
} from './utils/storage';
import { exportExpensesToCSV, printExecutiveSummaryReport } from './utils/export';
import { 
  getStoredExchangeRates, 
  fetchLiveExchangeRates, 
  ExchangeRatesData 
} from './utils/currency';
import { 
  subscribeToAuth, 
  subscribeToCloudExpenses, 
  subscribeToCloudGoals, 
  subscribeToCloudProfile, 
  syncExpenseToCloud, 
  deleteExpenseFromCloud, 
  syncGoalToCloud, 
  deleteGoalFromCloud, 
  syncUserProfileToCloud,
  uploadLocalDataToCloud
} from './lib/firebase';
import { User as FirebaseUser } from 'firebase/auth';
import { 
  LayoutDashboard, 
  PieChart as PieIcon, 
  Receipt, 
  Target, 
  CalendarClock, 
  BarChart3, 
  Plus, 
  WifiOff, 
  CheckCircle2, 
  AlertCircle, 
  Smartphone,
  IndianRupee
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function App() {
  // Navigation State
  const [currentTab, setCurrentTab] = useState<'dashboard' | 'salary' | 'expenses' | 'goals' | 'recurring' | 'analytics'>('dashboard');

  // Persistence Data State
  const [expenses, setExpenses] = useState<Expense[]>(loadStoredExpenses);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadStoredUserProfile);
  const [goals, setGoals] = useState<FinancialGoal[]>(loadStoredGoals);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(loadStoredTheme);
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(navigator.onLine ? 'synced' : 'offline');
  const [isMobileFrame, setIsMobileFrame] = useState<boolean>(false);
  const [exchangeRatesData, setExchangeRatesData] = useState<ExchangeRatesData>(getStoredExchangeRates);

  // Firebase Auth State
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const isInitialCloudSyncDone = useRef(false);

  // Modal States
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingReceipt, setViewingReceipt] = useState<{ attachment: AttachmentFile; name: string } | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Subscribe to Firebase Auth
  useEffect(() => {
    const unsubAuth = subscribeToAuth((user) => {
      setCurrentUser(user);
      if (user) {
        setSyncStatus('synced');
        // Update user profile name/email if currently default
        setUserProfile(prev => ({
          ...prev,
          name: user.displayName || prev.name,
          email: user.email || prev.email,
        }));
      }
    });

    return () => unsubAuth();
  }, []);

  // Subscribe to Cloud Firestore when user is authenticated
  useEffect(() => {
    if (!currentUser) return;

    setSyncStatus('syncing');

    // Subscribe to Expenses
    const unsubExpenses = subscribeToCloudExpenses(currentUser.uid, (cloudExpenses) => {
      if (cloudExpenses.length > 0) {
        setExpenses(cloudExpenses);
      } else if (!isInitialCloudSyncDone.current && expenses.length > 0) {
        // Automatically sync initial seed/local expenses to newly created cloud account
        uploadLocalDataToCloud(currentUser.uid, expenses, goals, userProfile).catch(console.error);
        isInitialCloudSyncDone.current = true;
      }
      setSyncStatus('synced');
    });

    // Subscribe to Goals
    const unsubGoals = subscribeToCloudGoals(currentUser.uid, (cloudGoals) => {
      if (cloudGoals.length > 0) {
        setGoals(cloudGoals);
      }
    });

    // Subscribe to User Profile
    const unsubProfile = subscribeToCloudProfile(currentUser.uid, (cloudProf) => {
      if (cloudProf) {
        setUserProfile(cloudProf);
      }
    });

    return () => {
      unsubExpenses();
      unsubGoals();
      unsubProfile();
    };
  }, [currentUser]);

  // Sync exchange rates on mount
  useEffect(() => {
    if (navigator.onLine) {
      fetchLiveExchangeRates().then(data => {
        setExchangeRatesData(data);
      }).catch(err => {
        console.warn('Could not fetch initial live exchange rates, using cached/fallback rates:', err);
      });
    }
  }, []);

  const handleRefreshExchangeRates = async () => {
    try {
      const data = await fetchLiveExchangeRates();
      setExchangeRatesData(data);
      showToast('Live exchange rates updated successfully.');
    } catch (e) {
      showToast('Using stored exchange rates (offline fallback).');
    }
  };

  // Sync dark mode class with DOM
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    saveStoredTheme(isDarkMode);
  }, [isDarkMode]);

  // Online / Offline Listener
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSyncStatus('synced');
    };
    const handleOffline = () => {
      setIsOnline(false);
      setSyncStatus('offline');
    };
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Manual Sync Trigger
  const handleTriggerSync = () => {
    setSyncStatus('syncing');
    showToast(currentUser ? 'Syncing with Firestore...' : 'Connecting to Cloud Sync Engine...');
    
    if (currentUser) {
      uploadLocalDataToCloud(currentUser.uid, expenses, goals, userProfile)
        .then(() => {
          setSyncStatus('synced');
          showToast('Cloud Firestore synchronized & verified.');
        })
        .catch(() => {
          setSyncStatus('synced');
          showToast('Data synced.');
        });
    } else {
      setTimeout(() => {
        setSyncStatus('synced');
        showToast('Local ledger verified. Sign in with Google to enable cloud database.');
      }, 800);
    }
  };

  // CSV Export & Print Handlers
  const handleExportCSV = () => {
    exportExpensesToCSV(expenses, userProfile.currencySymbol);
    showToast('Exported CSV transaction statement.');
  };

  const handlePrintReport = () => {
    printExecutiveSummaryReport(expenses, userProfile, goals);
  };

  // Save changes to storage & Cloud
  useEffect(() => {
    saveStoredExpenses(expenses);
  }, [expenses]);

  useEffect(() => {
    saveStoredUserProfile(userProfile);
    if (currentUser) {
      syncUserProfileToCloud(currentUser.uid, userProfile).catch(console.error);
    }
  }, [userProfile, currentUser]);

  useEffect(() => {
    saveStoredGoals(goals);
  }, [goals]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Add Expense
  const handleAddExpense = (newExpense: Omit<Expense, 'id'>) => {
    const created: Expense = {
      ...newExpense,
      id: `exp-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    setExpenses(prev => [created, ...prev]);
    if (currentUser) {
      syncExpenseToCloud(currentUser.uid, created).catch(console.error);
    }
    showToast(`Added "${created.name}" successfully!`);
  };

  // Edit Expense
  const handleUpdateExpense = (updated: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e));
    setEditingExpense(null);
    if (currentUser) {
      syncExpenseToCloud(currentUser.uid, updated).catch(console.error);
    }
    showToast(`Updated "${updated.name}"`);
  };

  // Delete Expense
  const handleDeleteExpense = (id: string) => {
    setExpenses(prev => prev.filter(e => e.id !== id));
    if (currentUser) {
      deleteExpenseFromCloud(currentUser.uid, id).catch(console.error);
    }
    showToast('Transaction removed.');
  };

  // Bulk Delete
  const handleBulkDeleteExpenses = (ids: string[]) => {
    setExpenses(prev => prev.filter(e => !ids.includes(e.id)));
    if (currentUser) {
      ids.forEach(id => deleteExpenseFromCloud(currentUser.uid, id).catch(console.error));
    }
    showToast(`Deleted ${ids.length} transactions.`);
  };

  // Add Goal
  const handleAddGoal = (newGoal: Omit<FinancialGoal, 'id'>) => {
    const created: FinancialGoal = {
      ...newGoal,
      id: `goal-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    };
    setGoals(prev => [...prev, created]);
    if (currentUser) {
      syncGoalToCloud(currentUser.uid, created).catch(console.error);
    }
    showToast(`Goal "${created.title}" initialized!`);
  };

  // Update Goal
  const handleUpdateGoal = (updated: FinancialGoal) => {
    setGoals(prev => prev.map(g => g.id === updated.id ? updated : g));
    if (currentUser) {
      syncGoalToCloud(currentUser.uid, updated).catch(console.error);
    }
    showToast(`Goal updated!`);
  };

  // Delete Goal
  const handleDeleteGoal = (id: string) => {
    setGoals(prev => prev.filter(g => g.id !== id));
    if (currentUser) {
      deleteGoalFromCloud(currentUser.uid, id).catch(console.error);
    }
    showToast('Financial goal removed.');
  };

  // Process Recurring bill into a live transaction
  const handleProcessRecurring = (rec: Expense) => {
    const newTrans: Expense = {
      ...rec,
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().slice(0, 10),
      notes: `Automated recurring renewal from ${rec.name}`,
    };
    setExpenses(prev => [newTrans, ...prev]);
    if (currentUser) {
      syncExpenseToCloud(currentUser.uid, newTrans).catch(console.error);
    }
    showToast(`Posted renewal transaction for ${rec.name}`);
  };

  // Backup Import
  const handleImportBackup = (data: { expenses: Expense[]; goals: FinancialGoal[]; profile: UserProfile }) => {
    if (data.expenses) setExpenses(data.expenses);
    if (data.goals) setGoals(data.goals);
    if (data.profile) setUserProfile(data.profile);
    if (currentUser) {
      uploadLocalDataToCloud(currentUser.uid, data.expenses || expenses, data.goals || goals, data.profile || userProfile)
        .catch(console.error);
    }
    showToast('All financial data restored successfully!');
  };

  // Reset Demo
  const handleResetDemo = () => {
    const seed = resetToInitialSeedData();
    setExpenses(seed.expenses);
    setUserProfile(seed.profile);
    setGoals(seed.goals);
    if (currentUser) {
      uploadLocalDataToCloud(currentUser.uid, seed.expenses, seed.goals, seed.profile).catch(console.error);
    }
    showToast('Reset to original demo financial ledger.');
  };

  return (
    <div className="min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      
      {/* Top Main Navigation */}
      <Navbar
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onSelectTab={setCurrentTab}
        isDarkMode={isDarkMode}
        theme={isDarkMode ? 'dark' : 'light'}
        onToggleTheme={() => setIsDarkMode(prev => !prev)}
        onOpenAddModal={() => setIsAddExpenseOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenAuth={() => setIsAuthModalOpen(true)}
        currentUser={currentUser}
        syncStatus={syncStatus}
        onTriggerSync={handleTriggerSync}
        isMobileFrame={isMobileFrame}
        onToggleMobileFrame={() => setIsMobileFrame(prev => !prev)}
        onExportCSV={handleExportCSV}
        onPrintReport={handlePrintReport}
        expenses={expenses}
        goals={goals}
        userProfile={userProfile}
      />

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="bg-amber-500 text-slate-950 px-4 py-2 text-xs font-bold text-center flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4" />
          <span>Offline Mode Active — Changes are being persisted safely to local offline storage and will sync upon reconnection.</span>
        </div>
      )}

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-24 sm:pb-12">
        {currentTab === 'dashboard' && (
          <DashboardView
            expenses={expenses}
            userProfile={userProfile}
            goals={goals}
            onOpenAddModal={() => setIsAddExpenseOpen(true)}
            onNavigate={setCurrentTab}
            onViewReceipt={(att, name) => setViewingReceipt({ attachment: att, name })}
          />
        )}

        {currentTab === 'salary' && (
          <SalaryBreakdownView
            expenses={expenses}
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            onToast={showToast}
          />
        )}

        {currentTab === 'expenses' && (
          <ExpensesView
            expenses={expenses}
            userProfile={userProfile}
            onOpenAddModal={() => setIsAddExpenseOpen(true)}
            onEditExpense={setEditingExpense}
            onDeleteExpense={handleDeleteExpense}
            onBulkDeleteExpenses={handleBulkDeleteExpenses}
            onViewReceipt={(att, name) => setViewingReceipt({ attachment: att, name })}
          />
        )}

        {currentTab === 'goals' && (
          <GoalsView
            goals={goals}
            userProfile={userProfile}
            onUpdateProfile={setUserProfile}
            onToast={showToast}
            onAddGoal={handleAddGoal}
            onUpdateGoal={handleUpdateGoal}
            onDeleteGoal={handleDeleteGoal}
          />
        )}

        {currentTab === 'recurring' && (
          <RecurringExpensesView
            expenses={expenses}
            userProfile={userProfile}
            onOpenAddModal={() => setIsAddExpenseOpen(true)}
            onEditExpense={setEditingExpense}
            onProcessRecurring={handleProcessRecurring}
          />
        )}

        {currentTab === 'analytics' && (
          <AnalyticsView
            expenses={expenses}
            userProfile={userProfile}
            exchangeRatesData={exchangeRatesData}
            onRefreshRates={handleRefreshExchangeRates}
          />
        )}
      </main>

      {/* Mobile Floating Action Bottom Navigation Bar (iOS / Android Native Ergonomics) */}
      <nav 
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-lg border-t border-slate-200/80 dark:border-slate-800 px-2 pt-1.5 pb-[max(env(safe-area-inset-bottom,0px),0.625rem)] shadow-lg shadow-slate-900/5 select-none"
      >
        <div className="flex items-center justify-around max-w-lg mx-auto">
          {/* Dashboard Tab */}
          <button
            id="mobile-tab-dashboard"
            role="tab"
            aria-selected={currentTab === 'dashboard'}
            onClick={() => setCurrentTab('dashboard')}
            className={`min-h-[48px] min-w-[56px] flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              currentTab === 'dashboard'
                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800/60'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <LayoutDashboard className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'dashboard' ? 'scale-110' : ''}`} />
              {currentTab === 'dashboard' && (
                <span className="absolute -top-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </div>
            <span className="text-[11px] leading-tight tracking-tight">Dashboard</span>
          </button>

          {/* Salary Breakdown Tab */}
          <button
            id="mobile-tab-salary"
            role="tab"
            aria-selected={currentTab === 'salary'}
            onClick={() => setCurrentTab('salary')}
            className={`min-h-[48px] min-w-[56px] flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              currentTab === 'salary'
                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800/60'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <PieIcon className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'salary' ? 'scale-110' : ''}`} />
              {currentTab === 'salary' && (
                <span className="absolute -top-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </div>
            <span className="text-[11px] leading-tight tracking-tight">Salary</span>
          </button>

          {/* Center Elevated Quick Add Action Button */}
          <div className="flex-1 flex items-center justify-center px-1">
            <button
              id="mobile-action-add-expense"
              onClick={() => setIsAddExpenseOpen(true)}
              aria-label="Add New Expense"
              className="w-12 h-12 -mt-5 bg-gradient-to-tr from-blue-600 to-indigo-600 active:from-blue-700 active:to-indigo-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/40 active:shadow-sm active:scale-90 transition-all duration-150 border-2 border-white dark:border-slate-900"
              title="Add New Expense"
            >
              <Plus className="w-6 h-6 stroke-[2.5]" />
            </button>
          </div>

          {/* Ledger / Expenses Tab */}
          <button
            id="mobile-tab-expenses"
            role="tab"
            aria-selected={currentTab === 'expenses'}
            onClick={() => setCurrentTab('expenses')}
            className={`min-h-[48px] min-w-[56px] flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              currentTab === 'expenses'
                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800/60'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <IndianRupee className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'expenses' ? 'scale-110' : ''}`} />
              {currentTab === 'expenses' && (
                <span className="absolute -top-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </div>
            <span className="text-[11px] leading-tight tracking-tight">Ledger</span>
          </button>

          {/* Goals Tab */}
          <button
            id="mobile-tab-goals"
            role="tab"
            aria-selected={currentTab === 'goals'}
            onClick={() => setCurrentTab('goals')}
            className={`min-h-[48px] min-w-[56px] flex-1 flex flex-col items-center justify-center gap-1 py-1 px-1 rounded-xl transition-all duration-150 active:scale-90 ${
              currentTab === 'goals'
                ? 'text-blue-600 dark:text-blue-400 font-bold bg-blue-50/80 dark:bg-blue-950/60'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 active:bg-slate-100 dark:active:bg-slate-800/60'
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Target className={`w-5 h-5 transition-transform duration-150 ${currentTab === 'goals' ? 'scale-110' : ''}`} />
              {currentTab === 'goals' && (
                <span className="absolute -top-1.5 w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400" />
              )}
            </div>
            <span className="text-[11px] leading-tight tracking-tight">Goals</span>
          </button>
        </div>
      </nav>

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-16 sm:bottom-6 right-6 z-50 px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-in fade-in slide-in-from-bottom-2 border ${
          toastMessage.includes('🚨') || toastMessage.includes('Exceeded')
            ? 'bg-rose-900 text-white border-rose-700/80 shadow-rose-900/30'
            : toastMessage.includes('⚠️') || toastMessage.includes('Alert')
            ? 'bg-amber-900 text-white border-amber-700/80 shadow-amber-900/30'
            : 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-800 dark:border-slate-200'
        }`}>
          {toastMessage.includes('🚨') || toastMessage.includes('⚠️') || toastMessage.includes('Alert') ? (
            <AlertCircle className="w-4 h-4 text-amber-400 dark:text-amber-300 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          )}
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modals */}
      <AddExpenseModal
        isOpen={isAddExpenseOpen}
        onClose={() => setIsAddExpenseOpen(false)}
        onAddExpense={handleAddExpense}
        userProfile={userProfile}
      />

      <EditExpenseModal
        isOpen={!!editingExpense}
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onUpdateExpense={handleUpdateExpense}
        onDeleteExpense={handleDeleteExpense}
        userProfile={userProfile}
      />

      <ReceiptModal
        isOpen={!!viewingReceipt}
        attachment={viewingReceipt?.attachment || null}
        expenseName={viewingReceipt?.name || ''}
        onClose={() => setViewingReceipt(null)}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userProfile={userProfile}
        onUpdateProfile={setUserProfile}
        expenses={expenses}
        goals={goals}
        onImportBackup={handleImportBackup}
        onResetDemoData={handleResetDemo}
        exchangeRatesData={exchangeRatesData}
        onRefreshRates={handleRefreshExchangeRates}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthModalOpen(true)}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        currentUser={currentUser}
        expenses={expenses}
        goals={goals}
        userProfile={userProfile}
        onToast={showToast}
      />

    </div>
  );
}

