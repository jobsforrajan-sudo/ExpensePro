export interface CurrencyInfo {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export interface ExchangeRatesData {
  base: string;
  rates: Record<string, number>;
  lastUpdated: string;
  source: 'live' | 'cached' | 'fallback';
}

export const SUPPORTED_CURRENCIES: CurrencyInfo[] = [
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'CAD', symbol: 'CA$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'AU$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar', flag: '🇸🇬' },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', flag: '🇨🇭' },
  { code: 'AED', symbol: 'AED', name: 'UAE Dirham', flag: '🇦🇪' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
  { code: 'BRL', symbol: 'R$', name: 'Brazilian Real', flag: '🇧🇷' },
];

// Fallback rates benchmarked against USD (1 USD = X currency)
export const DEFAULT_FALLBACK_RATES: Record<string, number> = {
  USD: 1.0,
  EUR: 0.922,
  GBP: 0.789,
  INR: 83.45,
  CAD: 1.364,
  AUD: 1.518,
  JPY: 155.35,
  SGD: 1.348,
  CHF: 0.908,
  AED: 3.673,
  CNY: 7.245,
  BRL: 5.420,
};

const STORAGE_RATES_KEY = 'expensepro_exchange_rates_v1';
const STORAGE_LAST_FETCH = 'expensepro_exchange_rates_fetch_time';

/**
 * Loads cached exchange rates or returns fallback default rates
 */
export function getStoredExchangeRates(): ExchangeRatesData {
  try {
    const cached = localStorage.getItem(STORAGE_RATES_KEY);
    const lastFetch = localStorage.getItem(STORAGE_LAST_FETCH);
    if (cached) {
      const parsedRates = JSON.parse(cached);
      return {
        base: 'USD',
        rates: { ...DEFAULT_FALLBACK_RATES, ...parsedRates },
        lastUpdated: lastFetch || new Date().toISOString(),
        source: 'cached',
      };
    }
  } catch (err) {
    console.warn('Could not read cached exchange rates', err);
  }

  return {
    base: 'USD',
    rates: DEFAULT_FALLBACK_RATES,
    lastUpdated: new Date().toISOString(),
    source: 'fallback',
  };
}

/**
 * Fetches real-time exchange rates from a high-availability open public rate API
 */
export async function fetchLiveExchangeRates(): Promise<ExchangeRatesData> {
  try {
    // Free open exchange rate endpoint with no auth requirement
    const response = await fetch('https://open.er-api.com/v6/latest/USD', {
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Exchange rate API responded with status ${response.status}`);
    }

    const data = await response.json();
    if (data && data.rates && typeof data.rates === 'object') {
      const updatedRates: Record<string, number> = { ...DEFAULT_FALLBACK_RATES };
      SUPPORTED_CURRENCIES.forEach(curr => {
        if (data.rates[curr.code]) {
          updatedRates[curr.code] = data.rates[curr.code];
        }
      });

      const nowIso = new Date().toISOString();
      try {
        localStorage.setItem(STORAGE_RATES_KEY, JSON.stringify(updatedRates));
        localStorage.setItem(STORAGE_LAST_FETCH, nowIso);
      } catch {}

      return {
        base: 'USD',
        rates: updatedRates,
        lastUpdated: nowIso,
        source: 'live',
      };
    }
  } catch (err) {
    console.warn('Live exchange rates fetch failed, using cached rates:', err);
  }

  return getStoredExchangeRates();
}

/**
 * Calculates conversion rate between any two currencies using USD pivot
 */
export function getConversionRate(
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = DEFAULT_FALLBACK_RATES
): number {
  if (fromCurrency === toCurrency) return 1.0;

  const fromRate = rates[fromCurrency] || DEFAULT_FALLBACK_RATES[fromCurrency] || 1.0;
  const toRate = rates[toCurrency] || DEFAULT_FALLBACK_RATES[toCurrency] || 1.0;

  // Since rates are relative to USD (1 USD = X units):
  // 1 unit of fromCurrency = (1 / fromRate) USD = (toRate / fromRate) of toCurrency
  return toRate / fromRate;
}

/**
 * Converts a numerical amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number> = DEFAULT_FALLBACK_RATES
): number {
  if (isNaN(amount) || amount === 0) return 0;
  if (fromCurrency === toCurrency) return amount;

  const rate = getConversionRate(fromCurrency, toCurrency, rates);
  return amount * rate;
}

/**
 * Formats a currency amount with symbol and optional precision
 */
export function formatCurrencyValue(
  amount: number,
  currencyCode: string,
  showDecimals: boolean = false
): string {
  const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode);
  const symbol = currency?.symbol || currencyCode + ' ';
  const locale = currencyCode === 'INR' ? 'en-IN' : 'en-US';

  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);

  return `${symbol}${formatted}`;
}
