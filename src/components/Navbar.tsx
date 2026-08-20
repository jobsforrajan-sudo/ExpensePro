import React, { useState } from 'react';
import { 
  Wallet, 
  LayoutDashboard, 
  Receipt, 
  PieChart, 
  Target, 
  CalendarClock, 
  BarChart3, 
  Plus, 
  Sun, 
  Moon, 
  RefreshCw, 
  Settings, 
  Smartphone, 
  Monitor,
  Download,
  FileSpreadsheet,
  Printer,
  User,
  Database,
  CloudCheck
} from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';
import { AppTab, SyncStatus, UserProfile } from '../types';

interface NavbarProps {
  currentTab: AppTab;
  onSelectTab?: (tab: AppTab) => void;
  onNavigate?: (tab: AppTab) => void;
  onOpenAddModal: () => void;
  onOpenSettings: () => void;
  onOpenAuth?: () => void;
  currentUser?: FirebaseUser | null;
  theme?: 'light' | 'dark';
  isDarkMode?: boolean;
  onToggleTheme: () => void;
  syncStatus?: SyncStatus;
  onTriggerSync?: () => void;
  userProfile?: UserProfile;
  isMobileFrame?: boolean;
  onToggleMobileFrame?: () => void;
  onExportCSV?: () => void;
  onPrintReport?: () => void;
  expenses?: any[];
  goals?: any[];
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  onNavigate,
  onOpenAddModal,
  onOpenSettings,
  onOpenAuth,
  currentUser,
  theme,
  isDarkMode,
  onToggleTheme,
  syncStatus = 'synced',
  onTriggerSync,
  userProfile,
  isMobileFrame = false,
  onToggleMobileFrame,
  onExportCSV,
  onPrintReport,
}) => {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const handleTabChange = onSelectTab || onNavigate || (() => {});
  const isDark = theme === 'dark' || isDarkMode === true;
  const currentSyncStatus = syncStatus || 'synced';

  const tabs: { id: AppTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'expenses', label: 'Expenses', icon: <Receipt className="w-4 h-4" /> },
    { id: 'salary', label: 'Salary & Wealth', icon: <PieChart className="w-4 h-4" /> },
    { id: 'goals', label: 'Goals', icon: <Target className="w-4 h-4" /> },
    { id: 'recurring', label: 'Recurring', icon: <CalendarClock className="w-4 h-4" /> },
    { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0 cursor-pointer" onClick={() => handleTabChange('dashboard')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 dark:text-white">
                  Expense<span className="text-blue-600 dark:text-blue-400">Pro</span>
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 rounded-full border border-blue-200/60 dark:border-blue-800/60">
                  v2.4 Pro
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium hidden md:block leading-none">
                Smart Expense & Wealth Engine
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs (Desktop) */}
          <nav className="hidden lg:flex items-center gap-1 bg-slate-100/80 dark:bg-slate-800/80 p-1 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
            {tabs.map(tab => {
              const active = currentTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`nav-tab-${tab.id}`}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                    active
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-slate-700/40'
                  }`}
                >
                  {tab.icon}
                  {tab.label}
                </button>
              );
            })}
          </nav>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2">
            
            {/* Sync Status Indicator / Auth Modal Trigger */}
            <button
              id="cloud-sync-btn"
              onClick={onOpenAuth || onTriggerSync || (() => {})}
              title={currentUser ? `Cloud Firestore Active: ${currentUser.email}` : 'Sign in to enable Firestore sync'}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${currentUser ? 'text-emerald-500' : 'text-blue-500'} ${currentSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              <span className="hidden xl:inline text-[11px] font-semibold text-slate-700 dark:text-slate-200">
                {currentUser ? 'Firestore Synced' : 'Cloud Sync'}
              </span>
            </button>

            {/* User Account / Sign In Trigger */}
            {currentUser ? (
              <button
                id="user-account-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-2 p-1 pl-1.5 pr-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
                title={`Logged in as ${currentUser.displayName || currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'User'}
                    className="w-6 h-6 rounded-full border border-blue-500 object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                    {currentUser.displayName ? currentUser.displayName.charAt(0).toUpperCase() : 'U'}
                  </div>
                )}
                <span className="hidden md:inline text-xs font-semibold text-slate-700 dark:text-slate-200 max-w-[90px] truncate">
                  {currentUser.displayName ? currentUser.displayName.split(' ')[0] : 'Account'}
                </span>
              </button>
            ) : (
              <button
                id="sign-in-btn"
                onClick={onOpenAuth}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 dark:hover:bg-blue-900/60 border border-blue-200/80 dark:border-blue-800/80 text-xs font-semibold transition"
                title="Sign in with Google"
              >
                <User className="w-3.5 h-3.5" />
                <span>Sign In</span>
              </button>
            )}

            {/* Export Dropdown */}
            <div className="relative">
              <button
                id="export-menu-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition border border-transparent hover:border-slate-200 dark:border-slate-700"
                title="Export & Reports"
              >
                <Download className="w-4 h-4" />
              </button>

              {showExportMenu && (
                <div 
                  className="absolute right-0 mt-2 w-52 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-1.5 z-50 animate-in fade-in slide-in-from-top-2"
                  onMouseLeave={() => setShowExportMenu(false)}
                >
                  <div className="px-2.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Export Options
                  </div>
                  <button
                    onClick={() => {
                      onExportCSV?.();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                    Download CSV Statement
                  </button>
                  <button
                    onClick={() => {
                      onPrintReport?.();
                      setShowExportMenu(false);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-left"
                  >
                    <Printer className="w-4 h-4 text-blue-500" />
                    Print Executive Statement
                  </button>
                </div>
              )}
            </div>

            {/* Mobile View Toggle */}
            <button
              id="device-frame-toggle-btn"
              onClick={onToggleMobileFrame || (() => {})}
              className={`p-2 rounded-lg transition border ${
                isMobileFrame
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/50 dark:border-indigo-800 dark:text-indigo-300'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border-transparent'
              }`}
              title={isMobileFrame ? 'Switch to Full Desktop View' : 'Preview Mobile App Frame (iOS/Android)'}
            >
              {isMobileFrame ? <Monitor className="w-4 h-4" /> : <Smartphone className="w-4 h-4" />}
            </button>

            {/* Theme Toggle */}
            <button
              id="theme-toggle-btn"
              onClick={onToggleTheme}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
            </button>

            {/* Settings Trigger */}
            <button
              id="settings-modal-btn"
              onClick={onOpenSettings}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              title="Preferences & Profile Settings"
            >
              <Settings className="w-4 h-4" />
            </button>

            {/* Add Expense Primary CTA */}
            <button
              id="header-add-expense-btn"
              onClick={onOpenAddModal}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm hover:shadow transition transform active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Expense</span>
            </button>

          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex lg:hidden overflow-x-auto py-2 gap-1 scrollbar-none border-t border-slate-100 dark:border-slate-800">
          {tabs.map(tab => {
            const active = currentTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 transition ${
                  active
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            );
          })}
        </div>

      </div>
    </header>
  );
};
