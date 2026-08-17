import { Product, Customer, Invoice, Quotation } from '@/types';

const STORAGE_KEYS = {
  PRODUCTS: 'gol_v11_cache_products',
  CUSTOMERS: 'gol_v11_cache_customers',
  INVOICES: 'gol_v11_cache_invoices',
  QUOTATIONS: 'gol_v11_cache_quotations',
  THEME: 'gol_v11_theme_preference',
} as const;

// ── L1 In-Memory High-Speed Cache ──────────────────────────────────────────────
interface MemoryStore {
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  quotations: Quotation[];
  phoneIndex: Map<string, Customer>;
  isHydrated: boolean;
}

const memoryStore: MemoryStore = {
  products: [],
  customers: [],
  invoices: [],
  quotations: [],
  phoneIndex: new Map(),
  isHydrated: false,
};

// ── Fast Synchronous L2 LocalStorage Helpers ────────────────────────────────────
function getStorageItem<T>(key: string): T[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.data)) return parsed.data;
    return [];
  } catch {
    return [];
  }
}

function setStorageItem<T>(key: string, data: T[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ ts: Date.now(), data }));
  } catch {}
}

// ── Hydrate L1 Memory from L2 Storage Synchronously ───────────────────────────
export function initMemoryCache(): MemoryStore {
  if (memoryStore.isHydrated) return memoryStore;

  const rawProducts = getStorageItem<Product>(STORAGE_KEYS.PRODUCTS);
  const products = rawProducts.sort((a, b) => (b.itemSold || 0) - (a.itemSold || 0));
  const customers = getStorageItem<Customer>(STORAGE_KEYS.CUSTOMERS);
  const invoices = getStorageItem<Invoice>(STORAGE_KEYS.INVOICES);
  const quotations = getStorageItem<Quotation>(STORAGE_KEYS.QUOTATIONS);

  const phoneIndex = new Map<string, Customer>();
  customers.forEach(c => {
    const clean = (c.phone || '').trim().replace(/\D/g, '');
    if (clean) phoneIndex.set(clean, c);
  });

  memoryStore.products = products;
  memoryStore.customers = customers;
  memoryStore.invoices = invoices;
  memoryStore.quotations = quotations;
  memoryStore.phoneIndex = phoneIndex;
  memoryStore.isHydrated = true;

  return memoryStore;
}

// ── Cache Getters & Setters ──────────────────────────────────────────────────
export const CacheManager = {
  getProducts(): Product[] {
    if (memoryStore.products.length > 0) return memoryStore.products;
    const stored = getStorageItem<Product>(STORAGE_KEYS.PRODUCTS);
    if (stored.length > 0) {
      memoryStore.products = stored.sort((a, b) => (b.itemSold || 0) - (a.itemSold || 0));
    }
    return memoryStore.products;
  },

  setProducts(products: Product[]): void {
    const sorted = [...products].sort((a, b) => (b.itemSold || 0) - (a.itemSold || 0));
    memoryStore.products = sorted;
    setStorageItem(STORAGE_KEYS.PRODUCTS, sorted);
  },

  getCustomers(): Customer[] {
    if (memoryStore.customers.length > 0) return memoryStore.customers;
    const stored = getStorageItem<Customer>(STORAGE_KEYS.CUSTOMERS);
    if (stored.length > 0) {
      memoryStore.customers = stored;
      stored.forEach(c => {
        const clean = (c.phone || '').trim().replace(/\D/g, '');
        if (clean) memoryStore.phoneIndex.set(clean, c);
      });
    }
    return memoryStore.customers;
  },

  setCustomers(customers: Customer[]): void {
    memoryStore.customers = customers;
    const index = new Map<string, Customer>();
    customers.forEach(c => {
      const clean = (c.phone || '').trim().replace(/\D/g, '');
      if (clean) index.set(clean, c);
    });
    memoryStore.phoneIndex = index;
    setStorageItem(STORAGE_KEYS.CUSTOMERS, customers);
  },

  getInvoices(): Invoice[] {
    if (memoryStore.invoices.length > 0) return memoryStore.invoices;
    const stored = getStorageItem<Invoice>(STORAGE_KEYS.INVOICES);
    if (stored.length > 0) memoryStore.invoices = stored;
    return memoryStore.invoices;
  },

  setInvoices(invoices: Invoice[]): void {
    memoryStore.invoices = invoices;
    setStorageItem(STORAGE_KEYS.INVOICES, invoices);
  },

  getQuotations(): Quotation[] {
    if (memoryStore.quotations.length > 0) return memoryStore.quotations;
    const stored = getStorageItem<Quotation>(STORAGE_KEYS.QUOTATIONS);
    if (stored.length > 0) memoryStore.quotations = stored;
    return memoryStore.quotations;
  },

  setQuotations(quotations: Quotation[]): void {
    memoryStore.quotations = quotations;
    setStorageItem(STORAGE_KEYS.QUOTATIONS, quotations);
  },

  lookupCustomerByPhone(phone: string): Customer | null {
    const clean = phone.trim().replace(/\D/g, '');
    if (!clean) return null;
    return memoryStore.phoneIndex.get(clean) || null;
  },

  getTheme(): 'dark' | 'light' {
    if (typeof window === 'undefined') return 'light';
    try {
      const val = localStorage.getItem(STORAGE_KEYS.THEME);
      return val === 'dark' || val === 'light' ? val : 'light';
    } catch {
      return 'light';
    }
  },

  setTheme(theme: 'dark' | 'light'): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {}
  },
};
