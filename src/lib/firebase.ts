import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signOut as fbSignOut, 
  onAuthStateChanged as fbOnAuthStateChanged,
  User as FirebaseUser 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  onSnapshot, 
  deleteDoc, 
  writeBatch,
  query,
  orderBy,
  getDocs,
  Firestore
} from 'firebase/firestore';
import firebaseConfigData from '../../firebase-applet-config.json';
import { Expense, FinancialGoal, UserProfile } from '../types';

export const firebaseConfig = {
  projectId: firebaseConfigData.projectId,
  appId: firebaseConfigData.appId,
  apiKey: firebaseConfigData.apiKey,
  authDomain: firebaseConfigData.authDomain,
  firestoreDatabaseId: firebaseConfigData.firestoreDatabaseId,
  storageBucket: firebaseConfigData.storageBucket,
  messagingSenderId: firebaseConfigData.messagingSenderId,
};

// Initialize Firebase App singleton
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Auth Instance
export const auth = getAuth(app);

// Firestore Instance with specific databaseId if provided
export const db: Firestore = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

export async function loginWithGoogle(): Promise<FirebaseUser> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error: any) {
    console.error('Firebase Google Sign-In failed:', error);
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  try {
    await fbSignOut(auth);
  } catch (error: any) {
    console.error('Firebase Sign-Out failed:', error);
    throw error;
  }
}

export function subscribeToAuth(callback: (user: FirebaseUser | null) => void) {
  return fbOnAuthStateChanged(auth, callback);
}

// -------------------------------------------------------------
// FIRESTORE DATABASE SYNCHRONIZATION HELPERS
// -------------------------------------------------------------

// Clean undefined fields before writing to Firestore
function sanitizeDocData<T extends Record<string, any>>(obj: T): Record<string, any> {
  const sanitized: Record<string, any> = {};
  Object.keys(obj).forEach((key) => {
    if (obj[key] !== undefined) {
      sanitized[key] = obj[key];
    }
  });
  return sanitized;
}

// Profile Sync
export async function syncUserProfileToCloud(userId: string, profile: UserProfile): Promise<void> {
  try {
    const profileRef = doc(db, 'users', userId);
    await setDoc(profileRef, sanitizeDocData(profile), { merge: true });
  } catch (err) {
    console.error('Failed to sync user profile to Firestore:', err);
    throw err;
  }
}

export async function fetchCloudUserProfile(userId: string): Promise<UserProfile | null> {
  try {
    const profileRef = doc(db, 'users', userId);
    const snap = await getDoc(profileRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (err) {
    console.error('Failed to fetch user profile from Firestore:', err);
    return null;
  }
}

// Expense Sync
export async function syncExpenseToCloud(userId: string, expense: Expense): Promise<void> {
  try {
    const expenseRef = doc(db, 'users', userId, 'expenses', expense.id);
    await setDoc(expenseRef, sanitizeDocData(expense), { merge: true });
  } catch (err) {
    console.error('Failed to save expense to Firestore:', err);
    throw err;
  }
}

export async function deleteExpenseFromCloud(userId: string, expenseId: string): Promise<void> {
  try {
    const expenseRef = doc(db, 'users', userId, 'expenses', expenseId);
    await deleteDoc(expenseRef);
  } catch (err) {
    console.error('Failed to delete expense from Firestore:', err);
    throw err;
  }
}

// Goal Sync
export async function syncGoalToCloud(userId: string, goal: FinancialGoal): Promise<void> {
  try {
    const goalRef = doc(db, 'users', userId, 'goals', goal.id);
    await setDoc(goalRef, sanitizeDocData(goal), { merge: true });
  } catch (err) {
    console.error('Failed to save goal to Firestore:', err);
    throw err;
  }
}

export async function deleteGoalFromCloud(userId: string, goalId: string): Promise<void> {
  try {
    const goalRef = doc(db, 'users', userId, 'goals', goalId);
    await deleteDoc(goalRef);
  } catch (err) {
    console.error('Failed to delete goal from Firestore:', err);
    throw err;
  }
}

// Batch upload local data to cloud (Initial migration for newly logged in user)
export async function uploadLocalDataToCloud(
  userId: string, 
  expenses: Expense[], 
  goals: FinancialGoal[], 
  profile: UserProfile
): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Profile
    const profileRef = doc(db, 'users', userId);
    batch.set(profileRef, sanitizeDocData(profile), { merge: true });

    // Expenses (limit batch to top items to respect Firestore batch limits)
    expenses.slice(0, 400).forEach(exp => {
      const expRef = doc(db, 'users', userId, 'expenses', exp.id);
      batch.set(expRef, sanitizeDocData(exp), { merge: true });
    });

    // Goals
    goals.forEach(goal => {
      const goalRef = doc(db, 'users', userId, 'goals', goal.id);
      batch.set(goalRef, sanitizeDocData(goal), { merge: true });
    });

    await batch.commit();
  } catch (err) {
    console.error('Failed to bulk upload local data to Firestore:', err);
    throw err;
  }
}

// Real-time Listeners
export function subscribeToCloudExpenses(
  userId: string, 
  onUpdate: (expenses: Expense[]) => void,
  onError?: (error: any) => void
) {
  const expensesCol = collection(db, 'users', userId, 'expenses');
  const q = query(expensesCol, orderBy('date', 'desc'));

  return onSnapshot(q, (snapshot) => {
    const items: Expense[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as Expense);
    });
    onUpdate(items);
  }, (err) => {
    console.warn('Firestore expenses listener error:', err);
    onError?.(err);
  });
}

export function subscribeToCloudGoals(
  userId: string, 
  onUpdate: (goals: FinancialGoal[]) => void,
  onError?: (error: any) => void
) {
  const goalsCol = collection(db, 'users', userId, 'goals');
  
  return onSnapshot(goalsCol, (snapshot) => {
    const items: FinancialGoal[] = [];
    snapshot.forEach((docSnap) => {
      items.push({ id: docSnap.id, ...docSnap.data() } as FinancialGoal);
    });
    onUpdate(items);
  }, (err) => {
    console.warn('Firestore goals listener error:', err);
    onError?.(err);
  });
}

export function subscribeToCloudProfile(
  userId: string, 
  onUpdate: (profile: UserProfile) => void,
  onError?: (error: any) => void
) {
  const profileRef = doc(db, 'users', userId);

  return onSnapshot(profileRef, (snap) => {
    if (snap.exists()) {
      onUpdate(snap.data() as UserProfile);
    }
  }, (err) => {
    console.warn('Firestore profile listener error:', err);
    onError?.(err);
  });
}
