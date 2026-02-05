import { Company, CreditCard, Transaction, QuickCountData, AppSettings, Subscription } from './types';

export const INITIAL_APP_SETTINGS: AppSettings = {
  appName: 'FinCommand',
  appLogo: null
};

// Default companies structure (users usually want the structure, but maybe empty data)
export const INITIAL_COMPANIES: Company[] = [
  {
    id: '1',
    name: 'Empresa Principal',
    logo: null,
    theme: 'green',
    primaryColor: '#10b981',
    secondaryColor: '#064e3b',
  },
  {
    id: '2',
    name: 'Empresa Secundaria',
    logo: null,
    theme: 'black',
    primaryColor: '#111827',
    secondaryColor: '#000000',
  },
  {
    id: '3',
    name: 'Empresa Terciaria',
    logo: null,
    theme: 'red',
    primaryColor: '#ef4444',
    secondaryColor: '#7f1d1d',
  }
];

// Start with empty transactions
export const INITIAL_TRANSACTIONS: Transaction[] = [];

// Start with empty cards
export const INITIAL_CARDS: CreditCard[] = [];

// Start with empty subscriptions
export const INITIAL_SUBSCRIPTIONS: Subscription[] = [];

// Start with zeroed quick count but default rate
export const INITIAL_QUICK_COUNT: QuickCountData = {
  bancoPopular: 0,
  bancoBHD: 0,
  bancoBanReservas: 0,
  efectivo: 0,
  weeklyDebts: [],
  exchangeRate: 58.50,
  adSpendUS: 0,
  daysForCalc: 1
};

export const INCOME_CATEGORIES = ['Recaudos de plataformas', 'Retiros', 'Ventas Directas', 'Otros'];
export const EXPENSE_CATEGORIES = ['Pago de tarjeta de crédito', 'Publicidad', 'Mercancía', 'Préstamos', 'Flete', 'Servicio al cliente', 'Préstamos de urgencia', 'Nómina', 'Otros'];
