export type Currency = 'RD$' | 'US$';

export enum TransactionType {
  INCOME = 'INCOME',
  EXPENSE = 'EXPENSE'
}

export interface AppSettings {
  appName: string;
  appLogo: string | null; // Data URL
}

export interface Transaction {
  id: string;
  date: string; // ISO String YYYY-MM-DD
  month: string;
  year: number;
  typeCategory: string;
  description: string; // Concepto
  amountRD: number;
  amountUS: number;
  paymentMethod: string;
  companyId: string;
  type: TransactionType;
}

export interface Company {
  id: string;
  name: string;
  logo: string | null; // Data URL
  theme: 'green' | 'black' | 'red';
  primaryColor: string;
  secondaryColor: string;
}

export interface CreditCard {
  id: string;
  bank: string;
  name: string;
  cutoffDate: string; // YYYY-MM-DD
  companyId: string;

  // Dual currency debt tracking
  debtRD: number;
  debtUS: number;

  // Debt types per currency
  debtTypeRD: string; // e.g., 'Consumo'
  debtTypeUS: string; // e.g., 'Publicidad'

  status: 'Pagada' | 'Abonada' | 'Pendiente';

  // Payment Control
  paymentAmountRD: number;
  paymentAmountUS: number;

  expiryDate: string; // YYYY-MM-DD
}

export interface WeeklyDebt {
  id: string;
  concept: string;
  amount: number;
  paymentType: 'Completo' | 'Mitad';
  isPaid: boolean;
}

export interface QuickCountData {
  bancoPopular: number;
  bancoBHD: number;
  bancoBanReservas: number;
  efectivo: number;
  weeklyDebts: WeeklyDebt[];
  exchangeRate: number; // Moved to global for sharing with Subscriptions
  adSpendUS: number;
  daysForCalc: number;
}

export type SubscriptionCategory = 'Importante' | 'Lujo';

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  currency: Currency;
  chargeDay: number; // 1-31
  cardId: string; // Linked Credit Card ID
  category: SubscriptionCategory;
}
