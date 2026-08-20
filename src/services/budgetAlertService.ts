import { Expense, UserProfile } from '../types';
import { calculateMonthlySummary, formatCurrency } from '../utils/calculations';

export interface BucketAlertInfo {
  bucket: 'essentials' | 'savings' | 'investments' | 'lifestyle';
  name: string;
  spent: number;
  allocatedLimit: number;
  utilizationPct: number;
  isOverLimit: boolean;
  isNearLimit: boolean; // >= 90%
}

export interface BudgetAlertReport {
  targetMonth: string;
  totalSpent: number;
  budgetLimit: number; // userProfile.monthlySalary
  utilizationPct: number;
  thresholdPct: number; // 90%
  status: 'healthy' | 'caution' | 'critical' | 'exceeded';
  isAlertTriggered: boolean; // >= 90%
  alertSeverity: 'none' | 'warning' | 'critical';
  headline: string;
  toastMessage: string;
  bucketAlerts: BucketAlertInfo[];
  overLimitBucketsCount: number;
  remainingSafeBudget: number;
}

/**
 * Evaluates monthly expenses against the user's allocated monthly salary/budget.
 * Generates an alert if monthly expenses exceed 90% of the allocated budget limit.
 */
export function checkBudgetAlert(
  expenses: Expense[],
  userProfile: UserProfile,
  thresholdPct: number = 90
): BudgetAlertReport {
  const summary = calculateMonthlySummary(expenses, userProfile.monthlySalary, userProfile.salaryAllocation);
  const symbol = userProfile.currencySymbol || '₹';
  const budgetLimit = Math.max(1, userProfile.monthlySalary);
  const totalSpent = summary.totalSpent;
  const utilizationPct = (totalSpent / budgetLimit) * 100;
  const roundedPct = Math.round(utilizationPct * 10) / 10;

  // Evaluate bucket-level allocations
  const bucketKeys: ('essentials' | 'savings' | 'investments' | 'lifestyle')[] = [
    'essentials',
    'savings',
    'investments',
    'lifestyle',
  ];

  const bucketNames: Record<string, string> = {
    essentials: `Essentials (${userProfile.salaryAllocation.essentialsPct}%)`,
    savings: `Savings Buffer (${userProfile.salaryAllocation.savingsPct}%)`,
    investments: `Investments (${userProfile.salaryAllocation.investmentsPct}%)`,
    lifestyle: `Lifestyle & Leisure (${userProfile.salaryAllocation.lifestylePct}%)`,
  };

  const bucketAlerts: BucketAlertInfo[] = bucketKeys.map((key) => {
    const allocated = summary.targets[key];
    const spent = summary.bucketActuals[key];
    const pct = allocated > 0 ? (spent / allocated) * 100 : 0;
    return {
      bucket: key,
      name: bucketNames[key],
      spent,
      allocatedLimit: allocated,
      utilizationPct: Math.round(pct * 10) / 10,
      isOverLimit: spent > allocated,
      isNearLimit: pct >= thresholdPct,
    };
  });

  const overLimitBucketsCount = bucketAlerts.filter((b) => b.isNearLimit || b.isOverLimit).length;
  const remainingSafeBudget = Math.max(0, budgetLimit - totalSpent);

  let status: 'healthy' | 'caution' | 'critical' | 'exceeded' = 'healthy';
  let alertSeverity: 'none' | 'warning' | 'critical' = 'none';
  let headline = 'Budget allocation healthy and within safe boundaries.';
  let toastMessage = `✅ Budget on track: You have utilized ${roundedPct}% of your allocated monthly budget (${formatCurrency(totalSpent, symbol)} / ${formatCurrency(budgetLimit, symbol)}).`;

  if (utilizationPct >= 100) {
    status = 'exceeded';
    alertSeverity = 'critical';
    headline = `Total monthly expenditures have exceeded 100% of your allocated budget!`;
    toastMessage = `🚨 Budget Exceeded: You have spent ${roundedPct}% of your allocated limit (${formatCurrency(totalSpent, symbol)} / ${formatCurrency(budgetLimit, symbol)})!`;
  } else if (utilizationPct >= thresholdPct) {
    status = 'critical';
    alertSeverity = 'critical';
    headline = `Critical Budget Alert: You have reached ${roundedPct}% of your monthly limit (exceeding the ${thresholdPct}% threshold)!`;
    toastMessage = `⚠️ Budget Alert: Total monthly expenses have reached ${roundedPct}% of your allocated limit (${formatCurrency(totalSpent, symbol)} / ${formatCurrency(budgetLimit, symbol)})!`;
  } else if (utilizationPct >= 75) {
    status = 'caution';
    alertSeverity = 'warning';
    headline = `Approaching budget limit: ${roundedPct}% utilized.`;
    toastMessage = `ℹ️ Budget Notice: You have used ${roundedPct}% of your monthly budget limit (${formatCurrency(totalSpent, symbol)} / ${formatCurrency(budgetLimit, symbol)}).`;
  }

  return {
    targetMonth: summary.targetMonth,
    totalSpent,
    budgetLimit,
    utilizationPct: roundedPct,
    thresholdPct,
    status,
    isAlertTriggered: utilizationPct >= thresholdPct,
    alertSeverity,
    headline,
    toastMessage,
    bucketAlerts,
    overLimitBucketsCount,
    remainingSafeBudget,
  };
}

/**
 * Dispatches a notification toast if expenses exceed the threshold (default 90%).
 */
export function triggerBudgetAlertToast(
  expenses: Expense[],
  userProfile: UserProfile,
  onToast: (message: string) => void,
  thresholdPct: number = 90,
  forceToast: boolean = false
): BudgetAlertReport {
  const report = checkBudgetAlert(expenses, userProfile, thresholdPct);
  if (report.isAlertTriggered || forceToast) {
    onToast(report.toastMessage);
  }
  return report;
}
