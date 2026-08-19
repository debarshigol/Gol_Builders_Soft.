'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Customer, Invoice, CartItem, PaymentMethod, UserRole, Quotation, QuotationStatus, OwnerUser, ShopkeeperUser } from '@/types';
import { initialProducts, initialCustomers, initialInvoices, initialQuotations, initialOwnerUsers } from '@/data/mockData';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

// Helper to map Supabase DB row to Product
function mapDbProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    subCategory: row.sub_category || undefined,
    price: Number(row.price) || 0,
    costPrice: Number(row.cost_price) || 0,
    stock: Number(row.stock) || 0,
    itemSold: Number(row.item_sold ?? row.items_sold ?? 0),
    sku: row.sku || '',
    unit: row.unit || 'Pieces',
    imageEmoji: row.image_emoji || '📦',
    imageUrl: row.image_url || undefined,
  };
}

// Helper to map Product to Supabase DB row
function mapProductToDb(p: Omit<Product, 'id'> & { id?: string }) {
  return {
    ...(p.id ? { id: p.id } : {}),
    name: p.name,
    category: p.category,
    sub_category: p.subCategory || null,
    price: p.price,
    cost_price: p.costPrice,
    stock: p.stock,
    item_sold: p.itemSold || 0,
    sku: p.sku || null,
    unit: p.unit,
    image_emoji: p.imageEmoji || '📦',
    image_url: p.imageUrl || null,
  };
}

// Helper to map Supabase DB row to Customer
function mapDbCustomer(row: any): Customer {
  return {
    id: row.id,
    phone: row.phone,
    name: row.name,
    address: row.address || '',
    registeredAt: row.registered_at || new Date().toISOString().split('T')[0],
    totalPurchases: Number(row.total_purchases) || 0,
    totalSpent: Number(row.total_spent) || 0,
    totalDue: Number(row.total_due) || 0,
  };
}

function mapCustomerToDb(c: Customer) {
  return {
    id: c.id,
    phone: c.phone,
    name: c.name,
    address: c.address,
    registered_at: c.registeredAt ? c.registeredAt.split('T')[0] : new Date().toISOString().split('T')[0],
    total_purchases: c.totalPurchases,
    total_spent: c.totalSpent,
    total_due: c.totalDue,
  };
}

// Helper to map Supabase DB row to Invoice
function mapDbInvoice(row: any): Invoice {
  let parsedItems = [];
  if (row.items) {
    if (typeof row.items === 'string') {
      try {
        parsedItems = JSON.parse(row.items);
      } catch {
        parsedItems = [];
      }
    } else if (Array.isArray(row.items)) {
      parsedItems = row.items;
    }
  }

  return {
    id: row.id,
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    customerAddress: row.customer_address || '',
    customerGstin: row.customer_gstin || undefined,
    items: parsedItems,
    subtotal: Number(row.subtotal) || 0,
    taxRate: Number(row.tax_rate) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    cgstAmount: row.cgst_amount ? Number(row.cgst_amount) : undefined,
    sgstAmount: row.sgst_amount ? Number(row.sgst_amount) : undefined,
    discount: Number(row.discount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    amountPaid: Number(row.amount_paid) || 0,
    dueAmount: Number(row.due_amount) || 0,
    paymentMethod: row.payment_method,
    paymentStatus: row.payment_status,
    isSettlementReceipt: Boolean(row.is_settlement_receipt),
    isGstInvoice: Boolean(row.is_gst_invoice),
    previousDue: row.previous_due ? Number(row.previous_due) : undefined,
    status: row.status || 'Completed',
    createdAt: row.created_at || new Date().toISOString(),
  };
}

function mapInvoiceToDb(inv: Invoice) {
  return {
    id: inv.id,
    customer_phone: inv.customerPhone,
    customer_name: inv.customerName,
    customer_address: inv.customerAddress,
    customer_gstin: inv.customerGstin || null,
    items: inv.items,
    subtotal: inv.subtotal,
    tax_rate: inv.taxRate,
    tax_amount: inv.taxAmount,
    cgst_amount: inv.cgstAmount || null,
    sgst_amount: inv.sgstAmount || null,
    discount: inv.discount,
    total_amount: inv.totalAmount,
    amount_paid: inv.amountPaid,
    due_amount: inv.dueAmount,
    payment_method: inv.paymentMethod,
    payment_status: inv.paymentStatus,
    is_settlement_receipt: Boolean(inv.isSettlementReceipt),
    is_gst_invoice: Boolean(inv.isGstInvoice),
    previous_due: inv.previousDue || 0,
    status: inv.status || 'Completed',
    created_at: inv.createdAt,
  };
}

// Helper to map Supabase DB row to Quotation
function mapDbQuotation(row: any): Quotation {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerPhone: row.customer_phone,
    customerAddress: row.customer_address || '',
    notes: row.notes || undefined,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [],
    subtotal: Number(row.subtotal) || 0,
    taxRate: Number(row.tax_rate) || 0,
    taxAmount: Number(row.tax_amount) || 0,
    discount: Number(row.discount) || 0,
    totalAmount: Number(row.total_amount) || 0,
    createdAt: row.created_at || new Date().toISOString(),
    validUntil: row.valid_until || new Date().toISOString(),
    status: row.status || 'Pending Follow-up',
    isTargeted: Boolean(row.is_targeted),
    ownerCallLog: row.owner_call_log ? (typeof row.owner_call_log === 'string' ? JSON.parse(row.owner_call_log) : row.owner_call_log) : undefined,
  };
}

function mapQuotationToDb(q: Quotation) {
  return {
    id: q.id,
    customer_name: q.customerName,
    customer_phone: q.customerPhone,
    customer_address: q.customerAddress,
    notes: q.notes || null,
    items: q.items,
    subtotal: q.subtotal,
    tax_rate: q.taxRate,
    tax_amount: q.taxAmount,
    discount: q.discount,
    total_amount: q.totalAmount,
    created_at: q.createdAt,
    valid_until: q.validUntil,
    status: q.status,
    is_targeted: Boolean(q.isTargeted),
    owner_call_log: q.ownerCallLog || null,
  };
}

interface AppContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  quotations: Quotation[];

  // Theme State
  theme: 'dark' | 'light';
  toggleTheme: () => void;

  // Billing Session State
  phoneSearchTerm: string;
  setPhoneSearchTerm: (term: string) => void;
  activeCustomer: Customer | null;
  searchStatus: 'idle' | 'found' | 'not_found';
  searchAttempted: boolean;
  lookupCustomerByPhone: (phone: string) => void;
  registerCustomer: (phone: string, name: string, address: string) => Customer;
  resetBillingSession: () => void;

  // Cart State
  cart: CartItem[];
  addToCart: (product: Product) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;

  // Invoice & Settlement Actions
  lastGeneratedInvoice: Invoice | null;
  setLastGeneratedInvoice: (inv: Invoice | null) => void;
  fetchInvoiceDetails: (invoiceId: string) => Promise<Invoice | null>;
  loadMoreInvoices: (pageSize?: number) => Promise<boolean>;
  hasMoreInvoices: boolean;
  isLoadingMoreInvoices: boolean;
  generateInvoice: (
    paymentMethod: PaymentMethod,
    taxRate?: number,
    discount?: number,
    collectedAmount?: number,
    targetCustomerOverride?: Customer
  ) => Invoice | null;
  payCustomerDue: (
    customerId: string,
    settlementAmount: number,
    paymentMethod: PaymentMethod
  ) => Invoice | null;
  createManualGstInvoice: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerGstin?: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      hsnCode?: string;
    }>;
    taxRate: number;
    discount: number;
    paymentMethod: PaymentMethod;
    collectedAmount?: number;
  }) => Invoice | null;

  // Quotation Management Actions
  createQuotation: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    notes?: string;
    items: Array<{
      product: Product;
      quantity: number;
      quotedPrice: number;
    }>;
    taxRate?: number;
    discount?: number;
    validDays?: number;
  }) => Quotation;
  updateQuotationStatus: (id: string, newStatus: QuotationStatus, ownerNotes?: string) => void;
  toggleQuotationTargeted: (id: string, isTargeted: boolean) => void;

  // Owner Management Actions
  addProduct: (productData: Omit<Product, 'id'>) => void;
  bulkAddProducts: (productsData: Array<Omit<Product, 'id'>>) => void;
  updateProductStock: (productId: string, newStock: number) => void;
  updateProductPrice: (productId: string, newPrice: number) => void;
  updateProductFull: (productId: string, updates: Partial<Omit<Product, 'id'>>) => Promise<void>;
  deleteProduct: (productId: string) => void;

  // Owner Authentication State & Actions
  currentOwner: OwnerUser | null;
  isOwnerAuthenticated: boolean;
  isAuthLoading: boolean;
  loginOwner: (username: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string; user?: OwnerUser }>;
  logoutOwner: () => void;

  // Shopkeeper Authentication & Access Management
  currentShopkeeper: ShopkeeperUser | null;
  isShopkeeperAuthenticated: boolean;
  isShopkeeperAuthLoading: boolean;
  shopkeeperUsers: ShopkeeperUser[];
  isLoadingShopkeeperUsers: boolean;
  fetchShopkeeperUsers: () => Promise<ShopkeeperUser[]>;
  createShopkeeperUser: (data: { name: string; username: string; password: string }) => Promise<{ success: boolean; error?: string; user?: ShopkeeperUser }>;
  deleteShopkeeperUser: (id: string) => Promise<{ success: boolean; error?: string }>;
  toggleShopkeeperUserStatus: (id: string, isActive: boolean) => Promise<{ success: boolean; error?: string }>;
  resetShopkeeperPassword: (id: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  loginShopkeeper: (username: string, password: string, remember?: boolean) => Promise<{ success: boolean; error?: string; user?: ShopkeeperUser }>;
  logoutShopkeeper: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

import { CacheManager, initMemoryCache } from '@/lib/cacheManager';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('shopkeeper');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [theme, setTheme] = useState<'dark' | 'light'>('light');
  const [hasMoreInvoices, setHasMoreInvoices] = useState<boolean>(true);
  const [isLoadingMoreInvoices, setIsLoadingMoreInvoices] = useState<boolean>(false);

  // Billing Flow States
  const [phoneSearchTerm, setPhoneSearchTerm] = useState<string>('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<Invoice | null>(null);

  // Owner Authentication State
  const [currentOwner, setCurrentOwner] = useState<OwnerUser | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);

  // Shopkeeper Authentication & Management State
  const [currentShopkeeper, setCurrentShopkeeper] = useState<ShopkeeperUser | null>(null);
  const [isShopkeeperAuthLoading, setIsShopkeeperAuthLoading] = useState<boolean>(true);
  const [shopkeeperUsers, setShopkeeperUsers] = useState<ShopkeeperUser[]>([]);
  const [isLoadingShopkeeperUsers, setIsLoadingShopkeeperUsers] = useState<boolean>(false);

  // ── Step 1: Immediate Synchronous Cache Hydration (0ms Latency) & Session Recovery ──
  useEffect(() => {
    setIsMounted(true);
    const store = initMemoryCache();
    if (store.products.length > 0) setProducts(store.products);
    if (store.customers.length > 0) setCustomers(store.customers);
    if (store.invoices.length > 0) setInvoices(store.invoices);
    if (store.quotations.length > 0) setQuotations(store.quotations);
    setTheme(CacheManager.getTheme());

    // Restore Owner Session
    try {
      if (typeof window !== 'undefined') {
        const savedSession = localStorage.getItem('gol_builders_owner_session');
        if (savedSession) {
          const parsed = JSON.parse(savedSession);
          if (parsed && parsed.username) {
            setCurrentOwner(parsed);
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore owner session:', e);
    } finally {
      setIsAuthLoading(false);
    }

    // Restore Shopkeeper Session (with 8-hour expiration check)
    try {
      if (typeof window !== 'undefined') {
        const savedSkSession = localStorage.getItem('gol_builders_shopkeeper_session');
        if (savedSkSession) {
          const parsedSk = JSON.parse(savedSkSession);
          if (parsedSk && parsedSk.username) {
            // Check if 8-hour session has expired
            if (parsedSk.expiresAt && Date.now() > parsedSk.expiresAt) {
              localStorage.removeItem('gol_builders_shopkeeper_session');
              setCurrentShopkeeper(null);
            } else {
              setCurrentShopkeeper(parsedSk);
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to restore shopkeeper session:', e);
    } finally {
      setIsShopkeeperAuthLoading(false);
    }
  }, []);

  // ── Auto Logout Monitor for Shopkeeper 8-Hour Session ────────────────────────
  useEffect(() => {
    if (!currentShopkeeper) return;

    const checkShopkeeperExpiry = () => {
      try {
        const savedSkSession = localStorage.getItem('gol_builders_shopkeeper_session');
        if (savedSkSession) {
          const parsedSk = JSON.parse(savedSkSession);
          if (parsedSk && parsedSk.expiresAt && Date.now() > parsedSk.expiresAt) {
            setCurrentShopkeeper(null);
            localStorage.removeItem('gol_builders_shopkeeper_session');
          }
        }
      } catch (e) {}
    };

    // Check every 30 seconds & on browser tab focus
    const interval = setInterval(checkShopkeeperExpiry, 30000);
    window.addEventListener('focus', checkShopkeeperExpiry);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', checkShopkeeperExpiry);
    };
  }, [currentShopkeeper]);

  // ── Step 2: Intelligent Priority Data Loading Pipeline ────────────────────────
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const sb = supabase;

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isShopkeeper = pathname.includes('shopkeeper') || pathname === '/';

    const loadPriorityPipeline = async () => {
      if (isShopkeeper) {
        // ★ STAGE 1 (CRITICAL - IMMEDIATE): Load Products Table First
        try {
          const prodRes = await sb.from('products')
            .select('id,name,category,sub_category,price,cost_price,stock,item_sold,sku,unit,image_emoji,image_url,created_at')
            .order('item_sold', { ascending: false });

          if (prodRes.data && !prodRes.error) {
            const mapped = prodRes.data
              .map(mapDbProduct)
              .sort((a, b) => (b.itemSold || 0) - (a.itemSold || 0));
            setProducts(mapped);
            CacheManager.setProducts(mapped);
          }
        } catch (e) {
          console.warn('Product load error:', e);
        }

        // ★ STAGE 2 (DEFERRED ASYNC): Load Customers, Invoices, Quotations in Background
        setTimeout(async () => {
          try {
            const [custRes, invRes, quotRes] = await Promise.allSettled([
              sb.from('customers')
                .select('id,phone,name,address,registered_at,total_purchases,total_spent,total_due')
                .order('created_at', { ascending: false }),
              sb.from('invoices')
                .select('id,customer_phone,customer_name,customer_address,customer_gstin,subtotal,tax_rate,tax_amount,cgst_amount,sgst_amount,discount,total_amount,amount_paid,due_amount,payment_method,payment_status,is_settlement_receipt,is_gst_invoice,previous_due,status,created_at')
                .order('created_at', { ascending: false }),
              sb.from('quotations')
                .select('id,customer_name,customer_phone,customer_address,notes,items,subtotal,tax_rate,tax_amount,discount,total_amount,created_at,valid_until,status,is_targeted,owner_call_log')
                .order('created_at', { ascending: false }),
            ]);

            if (custRes.status === 'fulfilled' && custRes.value.data && !custRes.value.error) {
              const mapped = custRes.value.data.map(mapDbCustomer);
              setCustomers(mapped);
              CacheManager.setCustomers(mapped);
            }
            if (invRes.status === 'fulfilled' && invRes.value.data && !invRes.value.error) {
              const mapped = invRes.value.data.map(mapDbInvoice);
              setHasMoreInvoices(false);
              setInvoices(mapped);
              CacheManager.setInvoices(mapped);
            }
            if (quotRes.status === 'fulfilled' && quotRes.value.data && !quotRes.value.error) {
              const mapped = quotRes.value.data.map(mapDbQuotation);
              setQuotations(mapped);
              CacheManager.setQuotations(mapped);
            }
          } catch (e) { }
        }, 100);

      } else {
        // ★ TIER 1 PRIORITY (OWNER): Complete Invoices + Inventory Overview + Customer Dues
        try {
          const [invRes, prodRes, custRes] = await Promise.allSettled([
            sb.from('invoices')
              .select('id,customer_phone,customer_name,customer_address,customer_gstin,subtotal,tax_rate,tax_amount,cgst_amount,sgst_amount,discount,total_amount,amount_paid,due_amount,payment_method,payment_status,is_settlement_receipt,is_gst_invoice,previous_due,status,created_at')
              .order('created_at', { ascending: false }),
            sb.from('products')
              .select('id,name,category,sub_category,price,cost_price,stock,item_sold,sku,unit,image_emoji,image_url,created_at')
              .order('item_sold', { ascending: false }),
            sb.from('customers')
              .select('id,phone,name,address,registered_at,total_purchases,total_spent,total_due')
              .order('created_at', { ascending: false }),
          ]);

          if (invRes.status === 'fulfilled' && invRes.value.data && !invRes.value.error) {
            const mapped = invRes.value.data.map(mapDbInvoice);
            setHasMoreInvoices(false);
            setInvoices(mapped);
            CacheManager.setInvoices(mapped);
          }
          if (prodRes.status === 'fulfilled' && prodRes.value.data && !prodRes.value.error) {
            const mapped = prodRes.value.data
              .map(mapDbProduct)
              .sort((a, b) => (b.itemSold || 0) - (a.itemSold || 0));
            setProducts(mapped);
            CacheManager.setProducts(mapped);
          }
          if (custRes.status === 'fulfilled' && custRes.value.data && !custRes.value.error) {
            const mapped = custRes.value.data.map(mapDbCustomer);
            setCustomers(mapped);
            CacheManager.setCustomers(mapped);
          }
        } catch (e) {
          console.warn('Owner Tier 1 sync error:', e);
        }

        // ★ TIER 2 PRIORITY (OWNER): Deferred Quotation Leads CRM
        setTimeout(async () => {
          try {
            const quotRes = await sb.from('quotations')
              .select('id,customer_name,customer_phone,customer_address,notes,items,subtotal,tax_rate,tax_amount,discount,total_amount,created_at,valid_until,status,is_targeted,owner_call_log')
              .order('created_at', { ascending: false });
            if (quotRes.data && !quotRes.error) {
              const mapped = quotRes.data.map(mapDbQuotation);
              setQuotations(mapped);
              CacheManager.setQuotations(mapped);
            }
          } catch (e) { }
        }, 150);
      }
    };

    loadPriorityPipeline();

    // ── Real-time Subscriptions (Syncs rows in-place) ──────────────────────────
    const channel = sb
      .channel('public:db-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'products' }, ({ new: row }) => {
        if (row) setProducts(prev => { const n = [mapDbProduct(row), ...prev]; CacheManager.setProducts(n); return n; });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'products' }, ({ new: row }) => {
        if (row) setProducts(prev => { const n = prev.map(p => p.id === row.id ? mapDbProduct(row) : p); CacheManager.setProducts(n); return n; });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'products' }, ({ old: row }) => {
        if (row) setProducts(prev => { const n = prev.filter(p => p.id !== row.id); CacheManager.setProducts(n); return n; });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'customers' }, ({ new: row }) => {
        if (row) setCustomers(prev => { const n = [mapDbCustomer(row), ...prev]; CacheManager.setCustomers(n); return n; });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'customers' }, ({ new: row }) => {
        if (row) setCustomers(prev => { const n = prev.map(c => c.id === row.id ? mapDbCustomer(row) : c); CacheManager.setCustomers(n); return n; });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'invoices' }, ({ new: row }) => {
        if (row) setInvoices(prev => { const n = [mapDbInvoice(row), ...prev]; CacheManager.setInvoices(n); return n; });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'invoices' }, ({ new: row }) => {
        if (row) setInvoices(prev => { const n = prev.map(inv => inv.id === row.id ? mapDbInvoice(row) : inv); CacheManager.setInvoices(n); return n; });
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'quotations' }, ({ new: row }) => {
        if (row) setQuotations(prev => { const n = [mapDbQuotation(row), ...prev]; CacheManager.setQuotations(n); return n; });
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'quotations' }, ({ new: row }) => {
        if (row) setQuotations(prev => { const n = prev.map(q => q.id === row.id ? mapDbQuotation(row) : q); CacheManager.setQuotations(n); return n; });
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  // Sync theme state to <html> element
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.classList.add('light-mode');
    } else {
      document.documentElement.classList.remove('light-mode');
    }
    CacheManager.setTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fast O(1) Phone Lookup Logic
  const lookupCustomerByPhone = (phoneInput: string) => {
    const cleanPhone = phoneInput.trim().replace(/\D/g, '');
    setPhoneSearchTerm(cleanPhone);
    setSearchAttempted(true);

    if (!cleanPhone) {
      setActiveCustomer(null);
      setSearchStatus('idle');
      return;
    }

    // Fast indexed Map lookup (O(1)) with fallback to state array
    const indexed = CacheManager.lookupCustomerByPhone(cleanPhone);
    const found = indexed || customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone) || null;

    if (found) {
      setActiveCustomer(found);
      setSearchStatus('found');
    } else {
      setActiveCustomer(null);
      setSearchStatus('not_found');
    }
  };

  // Customer Registration Logic
  const registerCustomer = (phone: string, name: string, address: string): Customer => {
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const tempId = `c-${Date.now()}`; // temporary local id until Supabase responds
    const newCustomer: Customer = {
      id: tempId,
      phone: cleanPhone,
      name: name.trim(),
      address: address.trim(),
      registeredAt: new Date().toISOString().split('T')[0],
      totalPurchases: 0,
      totalSpent: 0,
      totalDue: 0,
    };

    setCustomers(prev => [newCustomer, ...prev]);
    setActiveCustomer(newCustomer);
    setSearchStatus('found');
    setSearchAttempted(true);

    if (isSupabaseConfigured && supabase) {
      // Omit the local temp id — let Supabase generate the real UUID
      const { id: _localId, ...customerWithoutId } = mapCustomerToDb(newCustomer);
      supabase
        .from('customers')
        .insert(customerWithoutId)
        .select('id')
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Supabase register customer error:', error);
          } else if (data?.id) {
            // Patch local state with the real UUID so future upserts work correctly
            const realId = data.id;
            setCustomers(prev => {
              const updated = prev.map(c => c.id === tempId ? { ...c, id: realId } : c);
              CacheManager.setCustomers(updated);
              return updated;
            });
            setActiveCustomer(prev => prev?.id === tempId ? { ...prev, id: realId } : prev);
          }
        });
    }

    return newCustomer;
  };

  // Reset Billing Form & Cart
  const resetBillingSession = () => {
    setPhoneSearchTerm('');
    setActiveCustomer(null);
    setSearchStatus('idle');
    setSearchAttempted(false);
    setCart([]);
  };

  // Cart Functions
  const addToCart = (product: Product) => {
    setCart(prev => {
      const existingIndex = prev.findIndex(item => item.product.id === product.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        const currentQty = updated[existingIndex].quantity;
        if (currentQty < product.stock) {
          updated[existingIndex].quantity += 1;
        }
        return updated;
      }
      return [...prev, { product, quantity: 1 }];
    });
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const maxAvailable = item.product.stock;
          return { product: item.product, quantity: Math.max(0, Math.min(quantity, maxAvailable)) };
        }
        return item;
      })
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
  };

  // Generate Bill & Update Inventory + Sales Analytics
  const generateInvoice = (
    paymentMethod: PaymentMethod,
    taxRate: number = 0,
    discount: number = 0,
    collectedAmount?: number,
    targetCustomerOverride?: Customer
  ): Invoice | null => {
    const validItems = cart.filter(item => item.quantity > 0);
    const targetCust = targetCustomerOverride || activeCustomer;
    if (!targetCust || validItems.length === 0) return null;

    const subtotal = validItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const totalAmount = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

    let amountPaid = totalAmount;
    if (collectedAmount !== undefined && collectedAmount !== null && !isNaN(collectedAmount)) {
      amountPaid = Math.min(totalAmount, Math.max(0, Number(collectedAmount.toFixed(2))));
    }
    // dueAmount on the invoice = what is still owed FROM THIS TRANSACTION
    const dueAmount = Number((totalAmount - amountPaid).toFixed(2));
    const paymentStatus: 'Paid' | 'Partial' | 'Unpaid' =
      dueAmount <= 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

    const newInvoice: Invoice = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerPhone: targetCust.phone,
      customerName: targetCust.name,
      customerAddress: targetCust.address,
      items: validItems,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      totalAmount,
      amountPaid,
      dueAmount,
      paymentMethod,
      paymentStatus,
      createdAt: new Date().toISOString(),
      status: 'Completed',
    };

    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      CacheManager.setInvoices(updated);
      return updated;
    });

    setProducts(prevProducts => {
      const updated = prevProducts.map(p => {
        const cartItem = validItems.find(c => c.product.id === p.id);
        if (cartItem) {
          return {
            ...p,
            stock: Math.max(0, p.stock - cartItem.quantity),
            itemSold: (p.itemSold || 0) + cartItem.quantity,
          };
        }
        return p;
      });
      CacheManager.setProducts(updated);
      return updated;
    });

    // Compute updated customer stats from the LATEST row in state (not from the
    // potentially-stale targetCust snapshot) to avoid double-counting across
    // rapid successive invoices or Supabase real-time updates.
    let updatedCustomerState: Customer = {
      ...targetCust,
      totalPurchases: (targetCust.totalPurchases || 0) + 1,
      totalSpent: Number(((targetCust.totalSpent || 0) + totalAmount).toFixed(2)),
      totalDue: Number(((targetCust.totalDue || 0) + dueAmount).toFixed(2)),
    };

    setCustomers(prevCustomers => {
      const targetPhone = targetCust.phone.replace(/\D/g, '');
      const existing = prevCustomers.find(c => c.phone.replace(/\D/g, '') === targetPhone);
      let updatedList: Customer[];
      if (existing) {
        // Always derive from the freshest row in state
        updatedCustomerState = {
          ...existing,
          totalPurchases: (existing.totalPurchases || 0) + 1,
          totalSpent: Number(((existing.totalSpent || 0) + totalAmount).toFixed(2)),
          totalDue: Number(((existing.totalDue || 0) + dueAmount).toFixed(2)),
        };
        updatedList = prevCustomers.map(c =>
          c.phone.replace(/\D/g, '') === targetPhone ? updatedCustomerState : c
        );
      } else {
        updatedList = [updatedCustomerState, ...prevCustomers];
      }
      CacheManager.setCustomers(updatedList);
      return updatedList;
    });

    setActiveCustomer(updatedCustomerState);
    setLastGeneratedInvoice(newInvoice);

    // Sync to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      // 1. Insert Invoice — invoice.due_amount records what is owed from THIS transaction
      sb.from('invoices').insert(mapInvoiceToDb(newInvoice)).then(({ error }) => {
        if (error) console.error('Supabase invoice insert error:', error);
      });

      // 2. Upsert Customer stats — re-read updatedCustomerState after state setter has run
      // We use a microtask delay so the state updater above has captured the latest row.
      Promise.resolve().then(() => {
        sb.from('customers').upsert(mapCustomerToDb(updatedCustomerState)).then(({ error }) => {
          if (error) console.error('Supabase customer update error:', error);
        });
      });

      // 3. Decrement Product Stock levels & increment item_sold count
      validItems.forEach(cartItem => {
        const targetProd = products.find(p => p.id === cartItem.product.id);
        if (targetProd) {
          const newStock = Math.max(0, targetProd.stock - cartItem.quantity);
          const newItemSold = (targetProd.itemSold || 0) + cartItem.quantity;

          sb.from('products')
            .update({ stock: newStock, item_sold: newItemSold })
            .eq('id', targetProd.id)
            .then(({ error }) => {
              if (error) {
                // In case the DB column hasn't been added yet, fallback to stock update
                sb.from('products').update({ stock: newStock }).eq('id', targetProd.id).then();
              }
            });
        }
      });
    }

    return newInvoice;
  };

  // Past Due Settlement Payment
  const payCustomerDue = (
    customerIdOrPhone: string,
    settlementAmount: number,
    paymentMethod: PaymentMethod
  ): Invoice | null => {
    const cleanQuery = customerIdOrPhone.trim().replace(/\D/g, '');
    const cust = customers.find(
      c => c.id === customerIdOrPhone || (cleanQuery.length > 0 && c.phone.replace(/\D/g, '') === cleanQuery)
    );
    if (!cust || settlementAmount <= 0) return null;

    const previousDue = cust.totalDue || 0;
    const actualPaid = Math.min(previousDue, Math.max(0, settlementAmount));
    // newRemainingDue is the CUSTOMER's outstanding balance after this payment.
    const newRemainingDue = Math.max(0, Number((previousDue - actualPaid).toFixed(2)));

    const settlementItem: CartItem = {
      product: {
        id: 'p-settlement',
        name: 'Past Credit Due Clearance',
        category: 'Credit Settlement',
        price: actualPaid,
        costPrice: 0,
        stock: 9999,
        sku: 'CRED-SETTLE',
        unit: 'Payment',
        imageEmoji: '🧾',
      },
      quantity: 1,
    };

    const newInvoice: Invoice = {
      id: `REC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerPhone: cust.phone,
      customerName: cust.name,
      customerAddress: cust.address,
      items: [settlementItem],
      subtotal: 0,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      // totalAmount for settlement = the amount being cleared in this payment
      totalAmount: actualPaid,
      amountPaid: actualPaid,
      // dueAmount = remaining balance due after this payment
      dueAmount: newRemainingDue,
      paymentMethod,
      paymentStatus: newRemainingDue <= 0 ? 'Paid' : 'Partial',
      isSettlementReceipt: true,
      // previousDue records the customer's balance BEFORE this payment (for receipt display)
      previousDue,
      createdAt: new Date().toISOString(),
      status: 'Completed',
    };

    // Preserve customer's gross totalSpent UNCHANGED (no new item purchase occurred).
    // Only reduce totalDue by the amount actually paid.
    const updatedCustState: Customer = {
      ...cust,
      totalDue: newRemainingDue,
      totalSpent: cust.totalSpent,
    };

    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      CacheManager.setInvoices(updated);
      return updated;
    });

    setCustomers(prevCustomers => {
      const updated = prevCustomers.map(c =>
        c.phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, '') ? updatedCustState : c
      );
      CacheManager.setCustomers(updated);
      return updated;
    });

    if (activeCustomer && activeCustomer.phone.replace(/\D/g, '') === cust.phone.replace(/\D/g, '')) {
      setActiveCustomer(updatedCustState);
    }

    setLastGeneratedInvoice(newInvoice);

    // Sync to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      sb.from('invoices').insert(mapInvoiceToDb(newInvoice)).then(({ error }) => {
        if (error) console.error('Supabase settlement invoice error:', error);
      });
      sb.from('customers').upsert(mapCustomerToDb(updatedCustState)).then(({ error }) => {
        if (error) console.error('Supabase customer due update error:', error);
      });
    }

    return newInvoice;
  };

  // Owner Manual GST Invoice Generator
  const createManualGstInvoice = (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    customerGstin?: string;
    items: Array<{
      name: string;
      price: number;
      quantity: number;
      hsnCode?: string;
    }>;
    taxRate: number;
    discount: number;
    paymentMethod: PaymentMethod;
    collectedAmount?: number;
  }): Invoice | null => {
    if (!data.customerName || !data.customerPhone || data.items.length === 0) return null;

    const subtotal = data.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const taxAmount = Number(((subtotal * data.taxRate) / 100).toFixed(2));
    const cgstAmount = Number((taxAmount / 2).toFixed(2));
    const sgstAmount = Number((taxAmount / 2).toFixed(2));
    const totalAmount = Math.max(0, Number((subtotal + taxAmount - data.discount).toFixed(2)));

    let amountPaid = totalAmount;
    if (data.collectedAmount !== undefined && data.collectedAmount !== null && !isNaN(data.collectedAmount)) {
      amountPaid = Math.min(totalAmount, Math.max(0, Number(data.collectedAmount.toFixed(2))));
    }
    const dueAmount = Number((totalAmount - amountPaid).toFixed(2));
    const paymentStatus: 'Paid' | 'Partial' | 'Unpaid' =
      dueAmount <= 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

    const cartItems: CartItem[] = data.items.map((item, idx) => ({
      product: {
        id: `manual-gst-${Date.now()}-${idx}`,
        name: item.name,
        category: 'GST Tax Invoice',
        price: item.price,
        costPrice: item.price * 0.8,
        stock: 9999,
        sku: item.hsnCode ? `HSN-${item.hsnCode}` : 'GST-ITEM',
        unit: 'Pcs',
        imageEmoji: '📜',
      },
      quantity: item.quantity,
      hsnCode: item.hsnCode,
    }));

    const newInvoice: Invoice = {
      id: `GST-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerPhone: data.customerPhone,
      customerName: data.customerName,
      customerAddress: data.customerAddress,
      customerGstin: data.customerGstin,
      items: cartItems,
      subtotal,
      taxRate: data.taxRate,
      taxAmount,
      cgstAmount,
      sgstAmount,
      discount: data.discount,
      totalAmount,
      amountPaid,
      dueAmount,
      paymentMethod: data.paymentMethod,
      paymentStatus,
      createdAt: new Date().toISOString(),
      status: 'Completed',
      isGstInvoice: true,
    };

    setInvoices(prev => {
      const updated = [newInvoice, ...prev];
      CacheManager.setInvoices(updated);
      return updated;
    });

    const existingCust = customers.find(c => c.phone === data.customerPhone);
    let finalCustState: Customer;
    if (existingCust) {
      finalCustState = {
        ...existingCust,
        totalPurchases: (existingCust.totalPurchases || 0) + 1,
        totalSpent: Number(((existingCust.totalSpent || 0) + totalAmount).toFixed(2)),
        totalDue: Number(((existingCust.totalDue || 0) + dueAmount).toFixed(2)),
      };
    } else {
      finalCustState = {
        id: `c-${Date.now()}`,
        phone: data.customerPhone,
        name: data.customerName,
        address: data.customerAddress || 'N/A',
        registeredAt: new Date().toISOString(),
        totalPurchases: 1,
        totalSpent: Number(totalAmount.toFixed(2)),
        totalDue: Number(dueAmount.toFixed(2)),
      };
    }

    setCustomers(prevCustomers => {
      const idx = prevCustomers.findIndex(c => c.phone === data.customerPhone);
      let next: Customer[];
      if (idx !== -1) {
        const fresh = prevCustomers[idx];
        const freshUpdated: Customer = {
          ...fresh,
          totalPurchases: (fresh.totalPurchases || 0) + 1,
          totalSpent: Number(((fresh.totalSpent || 0) + totalAmount).toFixed(2)),
          totalDue: Number(((fresh.totalDue || 0) + dueAmount).toFixed(2)),
        };
        next = [...prevCustomers];
        next[idx] = freshUpdated;
      } else {
        next = [finalCustState, ...prevCustomers];
      }
      CacheManager.setCustomers(next);
      return next;
    });

    setLastGeneratedInvoice(newInvoice);

    // Sync to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured && supabase) {
      supabase.from('invoices').insert(mapInvoiceToDb(newInvoice)).then();
      supabase.from('customers').upsert(mapCustomerToDb(finalCustState)).then();
    }

    return newInvoice;
  };

  // Lazy-Load Invoice Item Details on Demand (when user clicks View Bill)
  const fetchInvoiceDetails = async (invoiceId: string): Promise<Invoice | null> => {
    const existing = invoices.find(inv => inv.id === invoiceId);
    // If items are already populated or if it is a settlement receipt without items, return immediately
    if (existing && ((existing.items && existing.items.length > 0) || existing.isSettlementReceipt)) {
      return existing;
    }

    if (!isSupabaseConfigured || !supabase) {
      return existing || null;
    }

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select('items')
        .eq('id', invoiceId)
        .single();

      if (data && !error) {
        let parsedItems: any[] = [];
        if (data.items) {
          if (typeof data.items === 'string') {
            try {
              parsedItems = JSON.parse(data.items);
            } catch {
              parsedItems = [];
            }
          } else if (Array.isArray(data.items)) {
            parsedItems = data.items;
          }
        }

        let updatedInvoice: Invoice | null = null;
        setInvoices(prev => {
          const updated = prev.map(inv => {
            if (inv.id === invoiceId) {
              updatedInvoice = { ...inv, items: parsedItems };
              return updatedInvoice;
            }
            return inv;
          });
          CacheManager.setInvoices(updated);
          return updated;
        });

        return updatedInvoice || (existing ? { ...existing, items: parsedItems } : null);
      }
    } catch (e) {
      console.warn('Failed to lazy-load invoice items:', e);
    }

    return existing || null;
  };

  // Load More Past Invoices from Supabase on Demand
  const loadMoreInvoices = async (pageSize: number = 50): Promise<boolean> => {
    if (!isSupabaseConfigured || !supabase || isLoadingMoreInvoices || !hasMoreInvoices) {
      return false;
    }

    setIsLoadingMoreInvoices(true);
    try {
      const currentOffset = invoices.length;
      const { data, error } = await supabase
        .from('invoices')
        .select('id,customer_phone,customer_name,customer_address,customer_gstin,subtotal,tax_rate,tax_amount,cgst_amount,sgst_amount,discount,total_amount,amount_paid,due_amount,payment_method,payment_status,is_settlement_receipt,is_gst_invoice,previous_due,status,created_at')
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + pageSize - 1);

      if (data && !error) {
        const mapped = data.map(mapDbInvoice);
        if (mapped.length < pageSize) {
          setHasMoreInvoices(false);
        }
        if (mapped.length > 0) {
          setInvoices(prev => {
            const existingIds = new Set(prev.map(i => i.id));
            const newUnique = mapped.filter(i => !existingIds.has(i.id));
            const combined = [...prev, ...newUnique];
            CacheManager.setInvoices(combined);
            return combined;
          });
        }
        setIsLoadingMoreInvoices(false);
        return mapped.length > 0;
      } else {
        setIsLoadingMoreInvoices(false);
        return false;
      }
    } catch (e) {
      console.warn('Failed to load more invoices:', e);
      setIsLoadingMoreInvoices(false);
      return false;
    }
  };

  // Quotation Generator
  const createQuotation = (data: {
    customerName: string;
    customerPhone: string;
    customerAddress: string;
    notes?: string;
    items: Array<{
      product: Product;
      quantity: number;
      quotedPrice: number;
    }>;
    taxRate?: number;
    discount?: number;
    validDays?: number;
  }): Quotation => {
    const taxRate = data.taxRate ?? 18;
    const discount = data.discount ?? 0;
    const validDays = data.validDays ?? 14;

    const subtotal = data.items.reduce((sum, item) => sum + item.quotedPrice * item.quantity, 0);
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const totalAmount = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

    const now = new Date();
    const validUntilDate = new Date(now.getTime() + validDays * 24 * 60 * 60 * 1000);

    const newQuotation: Quotation = {
      id: `QTN-${now.getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: data.customerName.trim(),
      customerPhone: data.customerPhone.trim().replace(/\D/g, ''),
      customerAddress: data.customerAddress.trim(),
      notes: data.notes?.trim() || '',
      items: data.items,
      subtotal,
      taxRate,
      taxAmount,
      discount,
      totalAmount,
      createdAt: now.toISOString(),
      validUntil: validUntilDate.toISOString(),
      status: 'Pending Follow-up',
    };

    setQuotations(prev => {
      const updated = [newQuotation, ...prev];
      CacheManager.setQuotations(updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('quotations').insert(mapQuotationToDb(newQuotation)).then();
    }

    return newQuotation;
  };

  const updateQuotationStatus = (id: string, newStatus: QuotationStatus, ownerNotes?: string) => {
    setQuotations(prev => {
      const updatedList = prev.map(q => {
        if (q.id === id) {
          const updated = {
            ...q,
            status: newStatus,
            ownerCallLog: ownerNotes
              ? {
                lastCalledAt: new Date().toISOString(),
                ownerNotes,
              }
              : q.ownerCallLog,
          };
          if (isSupabaseConfigured && supabase) {
            supabase.from('quotations').update(mapQuotationToDb(updated)).eq('id', id).then();
          }
          return updated;
        }
        return q;
      });
      CacheManager.setQuotations(updatedList);
      return updatedList;
    });
  };

  const toggleQuotationTargeted = (id: string, isTargeted: boolean) => {
    setQuotations(prev => {
      const updatedList = prev.map(q => {
        if (q.id === id) {
          const updated = { ...q, isTargeted };
          if (isSupabaseConfigured && supabase) {
            supabase.from('quotations').update({ is_targeted: isTargeted }).eq('id', id).then();
          }
          return updated;
        }
        return q;
      });
      CacheManager.setQuotations(updatedList);
      return updatedList;
    });
  };

  // Owner Product Actions (Adds items directly to central products array & Supabase Cloud)
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...productData,
      id: `p-${Date.now()}`,
    };
    setProducts(prev => {
      const updated = [newProd, ...prev];
      CacheManager.setProducts(updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').insert(mapProductToDb(newProd)).then(({ error }) => {
        if (error) console.error('Supabase product insert error:', error);
      });
    }
  };

  const bulkAddProducts = (productsData: Array<Omit<Product, 'id'>>) => {
    const now = Date.now();
    const newProds: Product[] = productsData.map((data, idx) => ({
      ...data,
      id: `p-${now}-${idx}`,
    }));
    setProducts(prev => {
      const updated = [...newProds, ...prev];
      CacheManager.setProducts(updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').insert(newProds.map(mapProductToDb)).then(({ error }) => {
        if (error) console.error('Supabase bulk insert error:', error);
      });
    }
  };

  const updateProductStock = (productId: string, newStock: number) => {
    const validStock = Math.max(0, newStock);
    setProducts(prev => {
      const updated = prev.map(p => (p.id === productId ? { ...p, stock: validStock } : p));
      CacheManager.setProducts(updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').update({ stock: validStock }).eq('id', productId).then();
    }
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setProducts(prev => {
      const updated = prev.map(p => (p.id === productId ? { ...p, price: validPrice } : p));
      CacheManager.setProducts(updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').update({ price: validPrice }).eq('id', productId).then();
    }
  };

  const updateProductFull = async (productId: string, updates: Partial<Omit<Product, 'id'>>): Promise<void> => {
    setProducts(prev => {
      const updated = prev.map(p => (p.id === productId ? { ...p, ...updates } : p));
      CacheManager.setProducts(updated);
      return updated;
    });

    if (isSupabaseConfigured && supabase) {
      const dbUpdates: Record<string, unknown> = {};
      if (updates.name !== undefined) dbUpdates.name = updates.name;
      if (updates.sku !== undefined) dbUpdates.sku = updates.sku;
      if (updates.category !== undefined) dbUpdates.category = updates.category;
      if (updates.subCategory !== undefined) dbUpdates.sub_category = updates.subCategory;
      if (updates.costPrice !== undefined) dbUpdates.cost_price = updates.costPrice;
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.stock !== undefined) dbUpdates.stock = updates.stock;
      if (updates.unit !== undefined) dbUpdates.unit = updates.unit;
      if (updates.imageEmoji !== undefined) dbUpdates.image_emoji = updates.imageEmoji;
      if (updates.imageUrl !== undefined) dbUpdates.image_url = updates.imageUrl || null;

      await supabase.from('products').update(dbUpdates).eq('id', productId);
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      CacheManager.setProducts(updated);
      return updated;
    });
    setCart(prev => prev.filter(item => item.product.id !== productId));

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').delete().eq('id', productId).then();
    }
  };

  // ── Owner Authentication Handlers ──────────────────────────────────────────
  const loginOwner = async (
    usernameInput: string,
    passwordInput: string,
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string; user?: OwnerUser }> => {
    const trimmedUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!trimmedUser || !cleanPass) {
      return { success: false, error: 'Please enter both Username and Password.' };
    }

    try {
      // 1. STEP 1: Query database table 'owner_users' for matching username
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('owner_users')
            .select('id, username, password, name, role, is_active, created_at, last_login')
            .ilike('username', trimmedUser)
            .maybeSingle();

          if (!error && data) {
            // STEP 2: Username exists in DB -> Validate active status & password
            if (data.is_active === false) {
              return { success: false, error: `Account @${data.username} has been deactivated. Contact system admin.` };
            }

            if (data.password !== cleanPass) {
              return { success: false, error: 'Incorrect password. Please verify and try again.' };
            }

            // STEP 3: Password matches -> Grant access & update last login
            const authenticatedUser: OwnerUser = {
              id: data.id,
              username: data.username,
              name: data.name,
              role: data.role || 'owner',
              isActive: data.is_active,
              createdAt: data.created_at,
              lastLogin: new Date().toISOString(),
            };

            // Update last_login timestamp in Supabase
            supabase
              .from('owner_users')
              .update({ last_login: authenticatedUser.lastLogin })
              .eq('id', data.id)
              .then();

            setCurrentOwner(authenticatedUser);
            if (remember && typeof window !== 'undefined') {
              try {
                localStorage.setItem('gol_builders_owner_session', JSON.stringify(authenticatedUser));
              } catch (e) {}
            }
            return { success: true, user: authenticatedUser };
          }
        } catch (dbErr) {
          console.warn('Supabase query error during login:', dbErr);
        }
      }

      // 2. Fallback check against initial owners (for offline or local testing)
      const matchedLocal = initialOwnerUsers.find(
        u => u.username.toLowerCase() === trimmedUser.toLowerCase()
      );

      if (matchedLocal) {
        if (matchedLocal.isActive === false) {
          return { success: false, error: `Account @${matchedLocal.username} is inactive.` };
        }
        if (matchedLocal.password !== cleanPass) {
          return { success: false, error: 'Incorrect password. Please verify and try again.' };
        }

        const authenticatedUser: OwnerUser = {
          id: matchedLocal.id,
          username: matchedLocal.username,
          name: matchedLocal.name,
          role: matchedLocal.role,
          isActive: matchedLocal.isActive,
          lastLogin: new Date().toISOString(),
        };

        setCurrentOwner(authenticatedUser);
        if (remember && typeof window !== 'undefined') {
          try {
            localStorage.setItem('gol_builders_owner_session', JSON.stringify(authenticatedUser));
          } catch (e) {}
        }
        return { success: true, user: authenticatedUser };
      }

      return { success: false, error: `Username "${trimmedUser}" not found in Owner Database.` };
    } catch (err: any) {
      console.error('Login process error:', err);
      return { success: false, error: err.message || 'Authentication error. Please try again.' };
    }
  };

  const logoutOwner = () => {
    setCurrentOwner(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('gol_builders_owner_session');
      } catch (e) {}
    }
  };

  // ── Shopkeeper Access Management & Authentication Handlers ──────────────────
  const fetchShopkeeperUsers = async (): Promise<ShopkeeperUser[]> => {
    if (!isSupabaseConfigured || !supabase) return [];
    setIsLoadingShopkeeperUsers(true);
    try {
      const { data, error } = await supabase
        .from('shopkeeper_users')
        .select('id, name, username, password, role, is_active, created_at, last_login, created_by')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: ShopkeeperUser[] = data.map(row => ({
          id: row.id,
          name: row.name,
          username: row.username,
          password: row.password,
          role: 'shopkeeper',
          isActive: row.is_active,
          createdAt: row.created_at,
          lastLogin: row.last_login,
          createdBy: row.created_by,
        }));
        setShopkeeperUsers(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Failed to fetch shopkeeper users:', e);
    } finally {
      setIsLoadingShopkeeperUsers(false);
    }
    return [];
  };

  const createShopkeeperUser = async (data: {
    name: string;
    username: string;
    password: string;
  }): Promise<{ success: boolean; error?: string; user?: ShopkeeperUser }> => {
    const trimmedName = data.name.trim();
    const trimmedUser = data.username.trim();
    const cleanPass = data.password.trim();

    if (!trimmedName || !trimmedUser || !cleanPass) {
      return { success: false, error: 'Full Name, User ID (Username), and Password are all required.' };
    }

    if (cleanPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      return { success: false, error: 'Supabase database is not configured.' };
    }

    try {
      // Check if username already exists in shopkeeper_users
      const { data: existingUser } = await supabase
        .from('shopkeeper_users')
        .select('id, username')
        .ilike('username', trimmedUser)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: `Username "${trimmedUser}" is already taken. Please choose another.` };
      }

      const newId = `sk-${Date.now()}`;
      const payload = {
        id: newId,
        name: trimmedName,
        username: trimmedUser,
        password: cleanPass,
        role: 'shopkeeper',
        is_active: true,
        created_at: new Date().toISOString(),
        created_by: currentOwner ? `${currentOwner.name} (@${currentOwner.username})` : 'Owner',
      };

      const { error: insertError } = await supabase.from('shopkeeper_users').insert([payload]);

      if (insertError) {
        console.error('Insert shopkeeper error:', insertError);
        return { success: false, error: insertError.message || 'Failed to save shopkeeper user to database.' };
      }

      const createdUser: ShopkeeperUser = {
        id: newId,
        name: trimmedName,
        username: trimmedUser,
        password: cleanPass,
        role: 'shopkeeper',
        isActive: true,
        createdAt: payload.created_at,
        createdBy: payload.created_by,
      };

      setShopkeeperUsers(prev => [createdUser, ...prev]);
      return { success: true, user: createdUser };
    } catch (err: any) {
      console.error('Create shopkeeper error:', err);
      return { success: false, error: err.message || 'An error occurred while creating shopkeeper account.' };
    }
  };

  const deleteShopkeeperUser = async (id: string): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      setShopkeeperUsers(prev => prev.filter(u => u.id !== id));
      return { success: true };
    }
    try {
      const { error } = await supabase.from('shopkeeper_users').delete().eq('id', id);
      if (error) throw error;
      setShopkeeperUsers(prev => prev.filter(u => u.id !== id));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to delete shopkeeper user.' };
    }
  };

  const toggleShopkeeperUserStatus = async (id: string, isActive: boolean): Promise<{ success: boolean; error?: string }> => {
    if (!isSupabaseConfigured || !supabase) {
      setShopkeeperUsers(prev => prev.map(u => u.id === id ? { ...u, isActive } : u));
      return { success: true };
    }
    try {
      const { error } = await supabase.from('shopkeeper_users').update({ is_active: isActive }).eq('id', id);
      if (error) throw error;
      setShopkeeperUsers(prev => prev.map(u => u.id === id ? { ...u, isActive } : u));
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e.message || 'Failed to update shopkeeper status.' };
    }
  };

  const resetShopkeeperPassword = async (
    id: string,
    newPassword: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanPass = newPassword.trim();
    if (!cleanPass) {
      return { success: false, error: 'Password cannot be empty.' };
    }
    if (cleanPass.length < 4) {
      return { success: false, error: 'Password must be at least 4 characters long.' };
    }

    if (!isSupabaseConfigured || !supabase) {
      setShopkeeperUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, password: cleanPass } : u))
      );
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('shopkeeper_users')
        .update({ password: cleanPass })
        .eq('id', id);

      if (error) throw error;

      setShopkeeperUsers(prev =>
        prev.map(u => (u.id === id ? { ...u, password: cleanPass } : u))
      );
      return { success: true };
    } catch (e: any) {
      console.error('Reset password error:', e);
      return { success: false, error: e.message || 'Failed to update password in database.' };
    }
  };

  const loginShopkeeper = async (
    usernameInput: string,
    passwordInput: string,
    remember: boolean = true
  ): Promise<{ success: boolean; error?: string; user?: ShopkeeperUser }> => {
    const trimmedUser = usernameInput.trim();
    const cleanPass = passwordInput.trim();

    if (!trimmedUser || !cleanPass) {
      return { success: false, error: 'Please enter both Username and Password.' };
    }

    try {
      // 1. STEP 1: Query database table 'shopkeeper_users'
      if (isSupabaseConfigured && supabase) {
        try {
          const { data, error } = await supabase
            .from('shopkeeper_users')
            .select('id, name, username, password, role, is_active, created_at, last_login, created_by')
            .ilike('username', trimmedUser)
            .maybeSingle();

          if (!error && data) {
            // STEP 2: Validate active status & password
            if (data.is_active === false) {
              return { success: false, error: `Account @${data.username} has been deactivated. Please contact store owner.` };
            }

            if (data.password !== cleanPass) {
              return { success: false, error: 'Incorrect password. Please verify and try again.' };
            }

            // STEP 3: Grant access & update last login (8-Hour Shift Session)
            const SHOPKEEPER_SESSION_DURATION_MS = 8 * 60 * 60 * 1000; // 8 Hours
            const authenticatedUser: ShopkeeperUser = {
              id: data.id,
              name: data.name,
              username: data.username,
              role: 'shopkeeper',
              isActive: data.is_active,
              createdAt: data.created_at,
              lastLogin: new Date().toISOString(),
              createdBy: data.created_by,
              expiresAt: Date.now() + SHOPKEEPER_SESSION_DURATION_MS,
            };

            supabase
              .from('shopkeeper_users')
              .update({ last_login: authenticatedUser.lastLogin })
              .eq('id', data.id)
              .then();

            setCurrentShopkeeper(authenticatedUser);
            if (remember && typeof window !== 'undefined') {
              try {
                localStorage.setItem('gol_builders_shopkeeper_session', JSON.stringify(authenticatedUser));
              } catch (e) {}
            }
            return { success: true, user: authenticatedUser };
          }
        } catch (dbErr) {
          console.warn('Supabase shopkeeper auth query error:', dbErr);
        }
      }

      return { success: false, error: `Username "${trimmedUser}" not found in Shopkeeper Database.` };
    } catch (err: any) {
      console.error('Shopkeeper login error:', err);
      return { success: false, error: err.message || 'Authentication error. Please try again.' };
    }
  };

  const logoutShopkeeper = () => {
    setCurrentShopkeeper(null);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem('gol_builders_shopkeeper_session');
      } catch (e) {}
    }
  };

  return (
    <AppContext.Provider
      value={{
        theme,
        toggleTheme,
        activeRole,
        setActiveRole,
        products,
        customers,
        invoices,
        quotations,
        phoneSearchTerm,
        setPhoneSearchTerm,
        activeCustomer,
        searchStatus,
        searchAttempted,
        lookupCustomerByPhone,
        registerCustomer,
        resetBillingSession,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        lastGeneratedInvoice,
        setLastGeneratedInvoice,
        fetchInvoiceDetails,
        loadMoreInvoices,
        hasMoreInvoices,
        isLoadingMoreInvoices,
        generateInvoice,
        payCustomerDue,
        createManualGstInvoice,
        createQuotation,
        updateQuotationStatus,
        toggleQuotationTargeted,
        addProduct,
        bulkAddProducts,
        updateProductStock,
        updateProductPrice,
        updateProductFull,
        deleteProduct,
        currentOwner,
        isOwnerAuthenticated: !!currentOwner,
        isAuthLoading,
        loginOwner,
        logoutOwner,
        currentShopkeeper,
        isShopkeeperAuthenticated: !!currentShopkeeper,
        isShopkeeperAuthLoading,
        shopkeeperUsers,
        isLoadingShopkeeperUsers,
        fetchShopkeeperUsers,
        createShopkeeperUser,
        deleteShopkeeperUser,
        toggleShopkeeperUserStatus,
        resetShopkeeperPassword,
        loginShopkeeper,
        logoutShopkeeper,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
