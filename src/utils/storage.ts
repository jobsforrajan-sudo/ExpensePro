import { Expense, FinancialGoal, UserProfile, SyncStatus } from '../types';
import { INITIAL_EXPENSES, INITIAL_FINANCIAL_GOALS, INITIAL_USER_PROFILE } from '../data/initialData';

const EXPENSES_STORAGE_KEY = 'expensepro_transactions_v3';
const GOALS_STORAGE_KEY = 'expensepro_goals_v3';
const PROFILE_STORAGE_KEY = 'expensepro_profile_v3';
const THEME_STORAGE_KEY = 'expensepro_theme';

export function loadStoredExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(EXPENSES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Clean up older USD cache
    localStorage.removeItem('expensepro_transactions_v2');
  } catch (err) {
    console.warn('Failed to load local expenses, using initial dataset', err);
  }
  return INITIAL_EXPENSES;
}

export function saveStoredExpenses(expenses: Expense[]): void {
  try {
    localStorage.setItem(EXPENSES_STORAGE_KEY, JSON.stringify(expenses));
  } catch (err) {
    console.error('Failed to persist expenses locally', err);
  }
}

export function loadStoredGoals(): FinancialGoal[] {
  try {
    const raw = localStorage.getItem(GOALS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
    // Clean up older USD cache
    localStorage.removeItem('expensepro_goals_v2');
  } catch (err) {
    console.warn('Failed to load local goals', err);
  }
  return INITIAL_FINANCIAL_GOALS;
}

export function saveStoredGoals(goals: FinancialGoal[]): void {
  try {
    localStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(goals));
  } catch (err) {
    console.error('Failed to persist goals locally', err);
  }
}

export function loadStoredProfile(): UserProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (raw) {
      const parsed: UserProfile = JSON.parse(raw);
      if (parsed && parsed.currency === 'INR') {
        return parsed;
      }
    }
    // Clean up older USD cache
    localStorage.removeItem('expensepro_profile_v2');
  } catch (err) {
    console.warn('Failed to load profile', err);
  }
  return INITIAL_USER_PROFILE;
}

export const loadStoredUserProfile = loadStoredProfile;

export function saveStoredProfile(profile: UserProfile): void {
  try {
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
  } catch (err) {
    console.error('Failed to persist user profile', err);
  }
}

export const saveStoredUserProfile = saveStoredProfile;

export function loadStoredTheme(): boolean {
  try {
    const raw = localStorage.getItem(THEME_STORAGE_KEY);
    if (raw === 'dark') return true;
    if (raw === 'light') return false;
  } catch {}
  return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function saveStoredTheme(isDark: boolean): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  } catch {}
}

export function resetToDemoData(): { expenses: Expense[]; goals: FinancialGoal[]; profile: UserProfile } {
  saveStoredExpenses(INITIAL_EXPENSES);
  saveStoredGoals(INITIAL_FINANCIAL_GOALS);
  saveStoredProfile(INITIAL_USER_PROFILE);
  return {
    expenses: INITIAL_EXPENSES,
    goals: INITIAL_FINANCIAL_GOALS,
    profile: INITIAL_USER_PROFILE,
  };
}

export const resetToInitialSeedData = resetToDemoData;
