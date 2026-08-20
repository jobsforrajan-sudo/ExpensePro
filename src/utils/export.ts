import { Expense, UserProfile, FinancialGoal } from '../types';
import { formatCurrency, formatDateDisplay, calculateMonthlySummary } from './calculations';

export function exportExpensesToCSV(expenses: Expense[], currencySymbol: string = '₹'): void {
  const headers = [
    'ID',
    'Date',
    'Expense Name',
    'Category',
    'Amount',
    'Payment Method',
    'Recurring',
    'Frequency',
    'Next Due Date',
    'Notes',
    'Has Attachment',
  ];

  const escapeCSV = (str: string | number | undefined | null): string => {
    if (str === undefined || str === null) return '""';
    const s = String(str).replace(/"/g, '""');
    return `"${s}"`;
  };

  const rows = expenses.map(exp => [
    escapeCSV(exp.id),
    escapeCSV(exp.date),
    escapeCSV(exp.name),
    escapeCSV(exp.category),
    escapeCSV(exp.amount),
    escapeCSV(exp.paymentMethod),
    escapeCSV(exp.isRecurring ? 'Yes' : 'No'),
    escapeCSV(exp.recurringFrequency || 'N/A'),
    escapeCSV(exp.nextDueDate || 'N/A'),
    escapeCSV(exp.notes || ''),
    escapeCSV(exp.attachment ? 'Yes' : 'No'),
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ExpensePro_Statement_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportFullDataBackup(data: {
  expenses: Expense[];
  goals: FinancialGoal[];
  profile: UserProfile;
}): void {
  const backup = {
    version: '2.0.0',
    exportDate: new Date().toISOString(),
    ...data,
  };
  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `ExpensePro_Backup_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function printExecutiveSummaryReport(
  expenses: Expense[],
  profile: UserProfile,
  goals: FinancialGoal[]
): void {
  const summary = calculateMonthlySummary(expenses, profile.monthlySalary, profile.salaryAllocation);
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Please allow popups to open the Executive Statement Report.');
    return;
  }

  const symbol = profile.currencySymbol || '₹';

  const rowsHtml = expenses.slice(0, 25).map(e => `
    <tr>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px;">${formatDateDisplay(e.date)}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; font-weight: 600;">${e.name}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px;">${e.category}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px;">${e.paymentMethod}</td>
      <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-size: 13px; text-align: right; font-weight: 600;">${formatCurrency(e.amount, symbol, true)}</td>
    </tr>
  `).join('');

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>ExpensePro Executive Financial Statement</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #0F172A; margin: 32px; }
          .header { display: flex; justify-content: space-between; border-bottom: 2px solid #0F172A; padding-bottom: 16px; margin-bottom: 24px; }
          .title { font-size: 24px; font-weight: 800; color: #0F172A; }
          .subtitle { color: #64748B; font-size: 14px; margin-top: 4px; }
          .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
          .kpi-card { background: #F8FAFC; border: 1px solid #E2E8F0; padding: 16px; border-radius: 8px; }
          .kpi-label { font-size: 12px; color: #64748B; text-transform: uppercase; font-weight: 600; }
          .kpi-value { font-size: 20px; font-weight: 800; color: #0F172A; margin-top: 4px; }
          table { width: 100%; border-collapse: collapse; margin-top: 16px; }
          th { background: #F1F5F9; text-align: left; padding: 10px 12px; font-size: 12px; text-transform: uppercase; color: #475569; border-bottom: 2px solid #CBD5E1; }
          .badge { display: inline-block; padding: 3px 8px; border-radius: 9999px; font-size: 11px; font-weight: 600; background: #E0E7FF; color: #3730A3; }
          @media print {
            body { margin: 16px; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">ExpensePro • Executive Financial Statement</div>
            <div class="subtitle">Prepared for ${profile.name} (${profile.email}) | Period: ${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
          </div>
          <div style="text-align: right;">
            <div style="font-weight: 700; color: #0284C7; font-size: 16px;">Verified Audit Report</div>
            <div style="color: #94A3B8; font-size: 12px;">Generated: ${new Date().toLocaleDateString()}</div>
          </div>
        </div>

        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-label">Monthly Gross Income</div>
            <div class="kpi-value">${formatCurrency(profile.monthlySalary, symbol)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Total Monthly Expenses</div>
            <div class="kpi-value" style="color: #DC2626;">${formatCurrency(summary.totalSpent, symbol, true)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Remaining Net Cash Flow</div>
            <div class="kpi-value" style="color: #16A34A;">${formatCurrency(summary.remainingBudget, symbol, true)}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-label">Calculated Savings Rate</div>
            <div class="kpi-value" style="color: #2563EB;">${summary.savingsRate}%</div>
          </div>
        </div>

        <h3 style="margin-top: 24px; margin-bottom: 8px; font-size: 16px;">50/20/15/15 Salary Allocation Actuals vs Targets</h3>
        <table style="margin-bottom: 24px;">
          <thead>
            <tr>
              <th>Allocation Category</th>
              <th>Target Allocation</th>
              <th>Actual Spent</th>
              <th>Variance / Health</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Essentials (50%)</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${formatCurrency(summary.targets.essentials, symbol)}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${formatCurrency(summary.bucketActuals.essentials, symbol, true)}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: ${summary.bucketActuals.essentials > summary.targets.essentials ? '#DC2626' : '#16A34A'}">
                ${summary.bucketActuals.essentials > summary.targets.essentials ? '⚠️ Over Target' : '✅ Within Target'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Investments (15%)</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${formatCurrency(summary.targets.investments, symbol)}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${formatCurrency(summary.bucketActuals.investments, symbol, true)}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: #2563EB;">
                ${summary.bucketActuals.investments >= summary.targets.investments ? '🎯 Goal Met' : '📈 Opportunity'}
              </td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600;">Lifestyle (15%)</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${formatCurrency(summary.targets.lifestyle, symbol)}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0;">${formatCurrency(summary.bucketActuals.lifestyle, symbol, true)}</td>
              <td style="padding: 8px 12px; border-bottom: 1px solid #E2E8F0; font-weight: 600; color: ${summary.bucketActuals.lifestyle > summary.targets.lifestyle ? '#DC2626' : '#16A34A'}">
                ${summary.bucketActuals.lifestyle > summary.targets.lifestyle ? '⚠️ Over Discretionary' : '✅ Balanced'}
              </td>
            </tr>
          </tbody>
        </table>

        <h3 style="margin-top: 24px; margin-bottom: 8px; font-size: 16px;">Itemized Transactions (Recent ${expenses.length} Records)</h3>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Expense Description</th>
              <th>Category</th>
              <th>Payment Method</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div style="margin-top: 40px; text-align: center; color: #94A3B8; font-size: 12px; border-top: 1px solid #E2E8F0; padding-top: 16px;">
          Generated with ExpensePro Automated Financial Engine • Confidential Personal Report
        </div>
        <script>
          window.onload = function() {
            window.print();
          };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
