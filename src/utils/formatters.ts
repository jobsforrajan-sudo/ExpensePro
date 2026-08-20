/**
 * Comprehensive financial formatting utilities with native Indian Rupee (INR - ₹) and international support.
 */

export function formatCurrency(amount: number, symbol: string = '₹', decimals: boolean = false): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return `${symbol}0`;
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);
  const locale = symbol === '₹' || symbol === 'INR' ? 'en-IN' : 'en-US';
  
  const formatted = decimals 
    ? abs.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : abs.toLocaleString(locale, { maximumFractionDigits: 0 });
    
  return isNegative ? `-${symbol}${formatted}` : `${symbol}${formatted}`;
}

export function formatINR(amount: number, decimals: boolean = false): string {
  return formatCurrency(amount, '₹', decimals);
}

export function formatNumber(value: number, locale: string = 'en-IN'): string {
  if (isNaN(value) || value === null || value === undefined) return '0';
  return value.toLocaleString(locale);
}

export function formatPercentage(value: number, decimals: number = 1): string {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${value.toFixed(decimals)}%`;
}

export function formatDateDisplay(dateStr: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month || !day) return dateStr;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('en-IN', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}
