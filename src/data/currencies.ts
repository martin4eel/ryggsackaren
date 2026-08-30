import type { Currency } from './types';

/**
 * Basenheten i spelet är svenska kronor. Alla priser lagras i basenheter och
 * växlas till spelarens hemvaluta vid visning, precis som i Backpacker 2 där
 * allt räknades i startlandets valuta.
 */
export const CURRENCIES: Record<string, Currency> = {
  SEK: { code: 'SEK', symbol: 'kr', name: 'svenska kronor', perBase: 1, decimals: 0 },
  NOK: { code: 'NOK', symbol: 'NOK', name: 'norska kronor', perBase: 1.02, decimals: 0 },
  DKK: { code: 'DKK', symbol: 'DKK', name: 'danska kronor', perBase: 0.68, decimals: 0 },
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
  ISK: { code: 'ISK', symbol: 'ISK', name: 'isländska kronor', perBase: 13.4, decimals: 0 },
  CZK: { code: 'CZK', symbol: 'Kč', name: 'tjeckiska kronor', perBase: 2.2, decimals: 0 },
  PLN: { code: 'PLN', symbol: 'zł', name: 'polska zloty', perBase: 0.38, decimals: 2 },
  HUF: { code: 'HUF', symbol: 'Ft', name: 'ungerska forint', perBase: 34, decimals: 0 },
  CHF: { code: 'CHF', symbol: 'Fr', name: 'schweizerfranc', perBase: 0.085, decimals: 2 },
  AED: { code: 'AED', symbol: 'د.إ', name: 'emiratiska dirham', perBase: 0.36, decimals: 2 },
  RSD: { code: 'RSD', symbol: 'RSD', name: 'serbiska dinarer', perBase: 10.2, decimals: 0 },
  JOD: { code: 'JOD', symbol: 'JD', name: 'jordanska dinarer', perBase: 0.069, decimals: 2 },
  KRW: { code: 'KRW', symbol: '₩', name: 'sydkoreanska won', perBase: 135, decimals: 0 },
  SGD: { code: 'SGD', symbol: 'S$', name: 'singaporianska dollar', perBase: 0.128, decimals: 2 },
  VND: { code: 'VND', symbol: '₫', name: 'vietnamesiska dong', perBase: 2500, decimals: 0 },
  NPR: { code: 'NPR', symbol: 'Rs', name: 'nepalesiska rupier', perBase: 13.2, decimals: 0 },
  IDR: { code: 'IDR', symbol: 'Rp', name: 'indonesiska rupiah', perBase: 1600, decimals: 0 },
  JMD: { code: 'JMD', symbol: 'J$', name: 'jamaicanska dollar', perBase: 15.4, decimals: 0 },
  CUP: { code: 'CUP', symbol: '$MN', name: 'kubanska peso', perBase: 2.4, decimals: 0 },
  XOF: { code: 'XOF', symbol: 'CFA', name: 'västafrikanska franc', perBase: 59, decimals: 0 },
  ETB: { code: 'ETB', symbol: 'Br', name: 'etiopiska birr', perBase: 11.5, decimals: 0 },
  CLP: { code: 'CLP', symbol: 'CL$', name: 'chilenska peso', perBase: 92, decimals: 0 },
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
