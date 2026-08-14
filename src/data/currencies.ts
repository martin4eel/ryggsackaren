import type { Currency } from './types';

/**
 * Basenheten i spelet är svenska kronor. Alla priser lagras i basenheter och
 * växlas till spelarens hemvaluta vid visning, precis som i Backpacker 2 där
 * allt räknades i startlandets valuta.
 */
export const CURRENCIES: Record<string, Currency> = {
  SEK: { code: 'SEK', symbol: 'kr', name: 'svenska kronor', perBase: 1, decimals: 0 },
  NOK: { code: 'NOK', symbol: 'kr', name: 'norska kronor', perBase: 1.02, decimals: 0 },
  DKK: { code: 'DKK', symbol: 'kr', name: 'danska kronor', perBase: 0.68, decimals: 0 },
  EUR: { code: 'EUR', symbol: '€', name: 'euro', perBase: 0.091, decimals: 2 },
  GBP: { code: 'GBP', symbol: '£', name: 'brittiska pund', perBase: 0.077, decimals: 2 },
  USD: { code: 'USD', symbol: '$', name: 'US-dollar', perBase: 0.098, decimals: 2 },
  CAD: { code: 'CAD', symbol: 'C$', name: 'kanadensiska dollar', perBase: 0.133, decimals: 2 },
  MXN: { code: 'MXN', symbol: 'MX$', name: 'mexikanska peso', perBase: 1.85, decimals: 0 },
  BRL: { code: 'BRL', symbol: 'R$', name: 'brasilianska real', perBase: 0.53, decimals: 2 },
  ARS: { code: 'ARS', symbol: 'AR$', name: 'argentinska peso', perBase: 92, decimals: 0 },
  PEN: { code: 'PEN', symbol: 'S/', name: 'peruanska sol', perBase: 0.37, decimals: 2 },
  MAD: { code: 'MAD', symbol: 'DH', name: 'marockanska dirham', perBase: 0.98, decimals: 2 },
  EGP: { code: 'EGP', symbol: 'E£', name: 'egyptiska pund', perBase: 4.7, decimals: 0 },
  KES: { code: 'KES', symbol: 'KSh', name: 'kenyanska shilling', perBase: 12.7, decimals: 0 },
  ZAR: { code: 'ZAR', symbol: 'R', name: 'sydafrikanska rand', perBase: 1.79, decimals: 2 },
  TRY: { code: 'TRY', symbol: '₺', name: 'turkiska lira', perBase: 3.35, decimals: 2 },
  INR: { code: 'INR', symbol: '₹', name: 'indiska rupier', perBase: 8.2, decimals: 0 },
  THB: { code: 'THB', symbol: '฿', name: 'thailändska baht', perBase: 3.5, decimals: 2 },
  CNY: { code: 'CNY', symbol: '¥', name: 'kinesiska yuan', perBase: 0.71, decimals: 2 },
  JPY: { code: 'JPY', symbol: '¥', name: 'japanska yen', perBase: 14.8, decimals: 0 },
  AUD: { code: 'AUD', symbol: 'A$', name: 'australiska dollar', perBase: 0.148, decimals: 2 },
  NZD: { code: 'NZD', symbol: 'NZ$', name: 'nyzeeländska dollar', perBase: 0.163, decimals: 2 },
  RUB: { code: 'RUB', symbol: '₽', name: 'ryska rubel', perBase: 8.6, decimals: 0 },
  ISK: { code: 'ISK', symbol: 'kr', name: 'isländska kronor', perBase: 13.4, decimals: 0 },
};

export function formatMoney(baseAmount: number, currencyCode: string): string {
  const c = CURRENCIES[currencyCode] ?? CURRENCIES.SEK;
  const value = baseAmount * c.perBase;
  const rounded =
    c.decimals === 0 ? Math.round(value) : Math.round(value * 100) / 100;
  const text = rounded.toLocaleString('sv-SE', {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
  return `${text} ${c.symbol}`;
}
