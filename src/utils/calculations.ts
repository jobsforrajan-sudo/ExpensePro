import { Expense, SalaryAllocationRule, ExpenseCategory, NetWorthAssets, NetWorthLiabilities, NetWorthData } from '../types';

/**
 * Calculates total assets, total liabilities, and net worth breakdown
 */
export function calculateNetWorthSummary(
  assets: NetWorthAssets,
  liabilities: NetWorthLiabilities
) {
  const totalAssets = (assets.cash || 0) + 
    (assets.investments || 0) + 
    (assets.retirement || 0) + 
    (assets.property || 0) + 
    (assets.valuables || 0);

  const totalLiabilities = (liabilities.loans || 0) + 
    (liabilities.creditCardDebt || 0) + 
    (liabilities.obligations || 0);

  const netWorth = totalAssets - totalLiabilities;
  const liquidAssets = (assets.cash || 0) + (assets.investments || 0);
  const liquidNetWorth = liquidAssets - (liabilities.creditCardDebt || 0) - (liabilities.obligations || 0);
  
  const debtToAssetRatio = totalAssets > 0 ? (totalLiabilities / totalAssets) * 100 : 0;
  const roundedDebtRatio = Math.round(debtToAssetRatio * 10) / 10;

  // Asset Percentages
  const assetDistribution = {
    cash: totalAssets > 0 ? Math.round(((assets.cash || 0) / totalAssets) * 1000) / 10 : 0,
    investments: totalAssets > 0 ? Math.round(((assets.investments || 0) / totalAssets) * 1000) / 10 : 0,
    retirement: totalAssets > 0 ? Math.round(((assets.retirement || 0) / totalAssets) * 1000) / 10 : 0,
    property: totalAssets > 0 ? Math.round(((assets.property || 0) / totalAssets) * 1000) / 10 : 0,
    valuables: totalAssets > 0 ? Math.round(((assets.valuables || 0) / totalAssets) * 1000) / 10 : 0,
  };

  // Liability Percentages
  const liabilityDistribution = {
    loans: totalLiabilities > 0 ? Math.round(((liabilities.loans || 0) / totalLiabilities) * 1000) / 10 : 0,
    creditCardDebt: totalLiabilities > 0 ? Math.round(((liabilities.creditCardDebt || 0) / totalLiabilities) * 1000) / 10 : 0,
    obligations: totalLiabilities > 0 ? Math.round(((liabilities.obligations || 0) / totalLiabilities) * 1000) / 10 : 0,
  };

  // Health Status
  let healthStatus: 'fortress' | 'strong' | 'balanced' | 'leveraged' = 'balanced';
  let healthLabel = 'Balanced Financial Position';
  let healthColor = 'text-blue-600 bg-blue-50 dark:bg-blue-950/60 border-blue-200';

  if (totalLiabilities === 0 || debtToAssetRatio < 15) {
    healthStatus = 'fortress';
    healthLabel = 'Fortress Balance Sheet (Low Debt)';
    healthColor = 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200';
  } else if (debtToAssetRatio < 35) {
    healthStatus = 'strong';
    healthLabel = 'Strong & Solvent Position';
    healthColor = 'text-teal-600 bg-teal-50 dark:bg-teal-950/60 border-teal-200';
  } else if (debtToAssetRatio < 55) {
    healthStatus = 'balanced';
    healthLabel = 'Moderate Leverage';
    healthColor = 'text-amber-600 bg-amber-50 dark:bg-amber-950/60 border-amber-200';
  } else {
    healthStatus = 'leveraged';
    healthLabel = 'High Debt Leverage (Priority Payoff)';
    healthColor = 'text-rose-600 bg-rose-50 dark:bg-rose-950/60 border-rose-200';
  }

  return {
    totalAssets,
    totalLiabilities,
    netWorth,
    liquidAssets,
    liquidNetWorth,
    debtToAssetRatio: roundedDebtRatio,
    assetDistribution,
    liabilityDistribution,
    healthStatus,
    healthLabel,
    healthColor,
  };
}

export interface NetWorthProjectionYear {
  year: number;
  existingAssetsValue: number;
  sipAccumulatedValue: number;
  projectedLiabilities: number;
  projectedNetWorth: number;
  inflationAdjustedNetWorth: number;
  totalInvestedViaSIP: number;
}

/**
 * Calculates long-term Net Worth growth projections combining:
 * 1. Compound growth on starting liquid & investment assets (A = P*(1+r/n)^(nt))
 * 2. Monthly SIP future value with optional annual Step-Up rate
 * 3. Retirement corpus compounding (EPF/PPF @ 7.5%)
 * 4. Property appreciation (@ 6% CAGR)
 * 5. Amortization / paydown of loans
 */
export function calculateNetWorthGrowthProjection(
  netWorthData: NetWorthData,
  yearsHorizon: number = 10
) {
  const { assets, liabilities, monthlySavingsSIP, expectedAnnualReturnPct, sipStepUpPct, inflationRatePct } = netWorthData;
  const equityRate = expectedAnnualReturnPct / 100;
  const propertyRate = 0.055; // 5.5% conservative real estate CAGR
  const retirementRate = 0.075; // 7.5% EPF / PPF CAGR
  const cashRate = 0.045; // 4.5% Liquid FD / Savings rate
  const inflationRate = inflationRatePct / 100;

  const startingInvestments = assets.investments || 0;
  const startingCash = assets.cash || 0;
  const startingRetirement = assets.retirement || 0;
  const startingProperty = assets.property || 0;
  const startingValuables = assets.valuables || 0;
  const startingLiabilities = (liabilities.loans || 0) + (liabilities.creditCardDebt || 0) + (liabilities.obligations || 0);

  const yearlyProjections: NetWorthProjectionYear[] = [];

  let currentMonthlySIP = monthlySavingsSIP || 0;
  let accumulatedSIPValue = 0;
  let totalSIPInvested = 0;
  const monthlyEquityRate = equityRate / 12;

  // Track loan paydown over time (assumes 10-15 yr average loan payoff)
  const annualLoanPaydown = startingLiabilities > 0 ? startingLiabilities / Math.min(12, Math.max(5, yearsHorizon)) : 0;

  for (let yr = 1; yr <= yearsHorizon; yr++) {
    // 1. Existing Assets Compounding: A = P*(1+r)^t
    const grownInvestments = startingInvestments * Math.pow(1 + equityRate, yr);
    const grownRetirement = startingRetirement * Math.pow(1 + retirementRate, yr);
    const grownProperty = startingProperty * Math.pow(1 + propertyRate, yr);
    const grownCash = startingCash * Math.pow(1 + cashRate, yr);
    const grownValuables = startingValuables * Math.pow(1 + 0.06, yr); // 6% gold/asset CAGR

    const existingAssetsValue = Math.round(grownInvestments + grownRetirement + grownProperty + grownCash + grownValuables);

    // 2. Future Value of SIP with Step-Up for Year yr
    for (let m = 1; m <= 12; m++) {
      totalSIPInvested += currentMonthlySIP;
      accumulatedSIPValue = (accumulatedSIPValue + currentMonthlySIP) * (1 + monthlyEquityRate);
    }

    if (sipStepUpPct > 0) {
      currentMonthlySIP = currentMonthlySIP * (1 + sipStepUpPct / 100);
    }

    // 3. Projected Liabilities remaining
    const remainingLiabilities = Math.max(0, Math.round(startingLiabilities - (annualLoanPaydown * yr)));

    // 4. Net Worth in INR: Total Assets - Remaining Liabilities
    const totalProjectedAssets = existingAssetsValue + Math.round(accumulatedSIPValue);
    const projectedNetWorth = totalProjectedAssets - remainingLiabilities;

    // 5. Inflation Adjusted Real Net Worth
    const inflationAdjustedNetWorth = Math.round(projectedNetWorth / Math.pow(1 + inflationRate, yr));

    yearlyProjections.push({
      year: yr,
      existingAssetsValue,
      sipAccumulatedValue: Math.round(accumulatedSIPValue),
      projectedLiabilities: remainingLiabilities,
      projectedNetWorth: Math.max(0, projectedNetWorth),
      inflationAdjustedNetWorth: Math.max(0, inflationAdjustedNetWorth),
      totalInvestedViaSIP: Math.round(totalSIPInvested),
    });
  }

  return {
    yearlyProjections,
    targetYearProjection: yearlyProjections[yearlyProjections.length - 1] || null,
    totalSIPInvested: Math.round(totalSIPInvested),
    totalSIPAccumulated: Math.round(accumulatedSIPValue),
  };
}

/**
 * Maps categories into the 4 50/20/15/15 Salary Allocation buckets
 */
export function mapCategoryToBucket(category: ExpenseCategory): 'essentials' | 'savings' | 'investments' | 'lifestyle' {
  switch (category) {
    case 'Housing & Rent':
    case 'Groceries & Food':
    case 'Transportation':
    case 'Utilities & Bills':
    case 'Healthcare & Fitness':
    case 'Debt & Loan Repayment':
      return 'essentials';
    case 'Investments & Savings':
      return 'investments';
    case 'Dining & Nightlife':
    case 'Entertainment & Leisure':
    case 'Shopping & Personal':
    case 'Education & Books':
    case 'Miscellaneous':
    default:
      return 'lifestyle';
  }
}

/**
 * Calculates Compound Interest for a Lump-Sum investment
 * A = P * (1 + r/n)^(n*t)
 * @param principal Initial investment amount (P)
 * @param annualRatePercent Annual interest rate in percent (e.g. 8 for 8%)
 * @param years Time horizon in years (t)
 * @param compoundingFreq Compounding periods per year (n, default 12 for monthly)
 */
export function calculateCompoundInterest(
  principal: number,
  annualRatePercent: number,
  years: number,
  compoundingFreq: number = 12
) {
  const r = annualRatePercent / 100;
  const n = compoundingFreq;
  const t = Math.max(1, years);
  const totalAmount = principal * Math.pow(1 + r / n, n * t);
  const totalInterest = Math.max(0, totalAmount - principal);

  const yearlyBreakdown: { year: number; invested: number; interest: number; total: number }[] = [];
  for (let yr = 1; yr <= t; yr++) {
    const yrTotal = principal * Math.pow(1 + r / n, n * yr);
    const yrInterest = Math.max(0, yrTotal - principal);
    yearlyBreakdown.push({
      year: yr,
      invested: principal,
      interest: Math.round(yrInterest),
      total: Math.round(yrTotal),
    });
  }

  return {
    investedAmount: principal,
    totalAmount: Math.round(totalAmount),
    totalInterest: Math.round(totalInterest),
    yearlyBreakdown,
  };
}

/**
 * Calculates Systematic Investment Plan (SIP) returns
 * M = P * [((1 + i)^n - 1) / i] * (1 + i)
 * @param monthlyAmount Monthly contribution (P)
 * @param annualRatePercent Annual return rate (r)
 * @param years Duration in years (t)
 * @param stepUpPercent Annual step-up percentage in monthly deposit (e.g. 10% per year)
 */
export function calculateSIP(
  monthlyAmount: number,
  annualRatePercent: number,
  years: number,
  stepUpPercent: number = 0
) {
  const monthlyRate = annualRatePercent / 100 / 12;
  const totalYears = Math.max(1, years);

  let currentMonthly = monthlyAmount;
  let totalInvested = 0;
  let accumulatedValue = 0;

  const yearlyBreakdown: { year: number; invested: number; interest: number; total: number; monthlyDeposit: number }[] = [];

  for (let yr = 1; yr <= totalYears; yr++) {
    for (let m = 1; m <= 12; m++) {
      totalInvested += currentMonthly;
      accumulatedValue = (accumulatedValue + currentMonthly) * (1 + monthlyRate);
    }

    yearlyBreakdown.push({
      year: yr,
      invested: Math.round(totalInvested),
      interest: Math.round(Math.max(0, accumulatedValue - totalInvested)),
      total: Math.round(accumulatedValue),
      monthlyDeposit: Math.round(currentMonthly),
    });

    if (stepUpPercent > 0) {
      currentMonthly = currentMonthly * (1 + stepUpPercent / 100);
    }
  }

  return {
    investedAmount: Math.round(totalInvested),
    totalAmount: Math.round(accumulatedValue),
    estimatedReturns: Math.round(Math.max(0, accumulatedValue - totalInvested)),
    yearlyBreakdown,
  };
}

/**
 * Calculates Required Monthly SIP to reach a target financial goal
 */
export function calculateRequiredSIPForGoal(targetAmount: number, annualRatePercent: number, years: number) {
  if (years <= 0 || targetAmount <= 0) return 0;
  const i = annualRatePercent / 100 / 12;
  const n = years * 12;
  if (i === 0) {
    return targetAmount / n;
  }
  // Target = P * [((1 + i)^n - 1) / i] * (1 + i)
  // P = Target / { [((1 + i)^n - 1) / i] * (1 + i) }
  const factor = ((Math.pow(1 + i, n) - 1) / i) * (1 + i);
  return Math.round(targetAmount / factor);
}

/**
 * Aggregates expenses for the current month and calculates salary allocation actuals
 */
export function calculateMonthlySummary(
  expenses: Expense[],
  monthlySalary: number,
  allocationRules: SalaryAllocationRule,
  currentYearMonth?: string // format "YYYY-MM"
) {
  const targetMonth = currentYearMonth || new Date().toISOString().slice(0, 7);
  
  const currentMonthExpenses = expenses.filter(e => e.date.startsWith(targetMonth));
  const totalSpent = currentMonthExpenses.reduce((acc, curr) => acc + curr.amount, 0);

  const bucketActuals = {
    essentials: 0,
    savings: 0,
    investments: 0,
    lifestyle: 0,
  };

  const categoryTotals: Record<string, number> = {};

  currentMonthExpenses.forEach(exp => {
    const bucket = mapCategoryToBucket(exp.category);
    bucketActuals[bucket] += exp.amount;
    categoryTotals[exp.category] = (categoryTotals[exp.category] || 0) + exp.amount;
  });

  const netSalary = Math.max(0, monthlySalary);
  const remainingBudget = netSalary - totalSpent;
  const savingsRate = netSalary > 0 ? Math.max(0, ((netSalary - totalSpent) / netSalary) * 100) : 0;

  // Compute Targets based on rule
  const targets = {
    essentials: (netSalary * allocationRules.essentialsPct) / 100,
    savings: (netSalary * allocationRules.savingsPct) / 100,
    investments: (netSalary * allocationRules.investmentsPct) / 100,
    lifestyle: (netSalary * allocationRules.lifestylePct) / 100,
  };

  // Days in month calculation for daily average
  const now = new Date();
  const currentDay = Math.min(now.getDate(), 30);
  const avgDailySpend = currentDay > 0 ? totalSpent / currentDay : 0;
  const projectedMonthSpend = avgDailySpend * 30;

  return {
    targetMonth,
    totalSpent,
    remainingBudget,
    savingsRate: Math.min(100, Math.round(savingsRate * 10) / 10),
    avgDailySpend: Math.round(avgDailySpend),
    projectedMonthSpend: Math.round(projectedMonthSpend),
    bucketActuals,
    targets,
    categoryTotals,
    itemCount: currentMonthExpenses.length,
  };
}

export { formatCurrency, formatINR, formatNumber, formatPercentage, formatDateDisplay } from './formatters';
