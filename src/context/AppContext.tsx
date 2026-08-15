'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Customer, Invoice, CartItem, PaymentMethod, UserRole, Quotation, QuotationStatus } from '@/types';
import { initialProducts, initialCustomers, initialInvoices, initialQuotations } from '@/data/mockData';
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
  return {
    id: row.id,
    customerPhone: row.customer_phone,
    customerName: row.customer_name,
    customerAddress: row.customer_address || '',
    customerGstin: row.customer_gstin || undefined,
    items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items || [],
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
  generateInvoice: (
    paymentMethod: PaymentMethod,
    taxRate?: number,
    discount?: number,
    collectedAmount?: number
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
  deleteProduct: (productId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const LOCAL_STORAGE_PREFIX = 'gol_building_materials_v9_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('shopkeeper');
  const [isMounted, setIsMounted] = useState<boolean>(false);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Billing Flow States
  const [phoneSearchTerm, setPhoneSearchTerm] = useState<string>('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<Invoice | null>(null);

  // Hydrate from localStorage on client mount (avoids SSR hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
    try {
      const savedProducts = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'products');
      const savedCustomers = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'customers');
      const savedInvoices = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'invoices');
      const savedQuotations = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'quotations');
      const savedTheme = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'theme') as 'dark' | 'light' | null;

      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedQuotations) setQuotations(JSON.parse(savedQuotations));
      if (savedTheme === 'light' || savedTheme === 'dark') {
        setTheme(savedTheme);
      }
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  }, []);

  // Save changes to localStorage & document element (only after client mount)
  useEffect(() => {
    if (!isMounted) return;
    try {
      const pStr = JSON.stringify(products);
      if (localStorage.getItem(LOCAL_STORAGE_PREFIX + 'products') !== pStr) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'products', pStr);
      }
      const cStr = JSON.stringify(customers);
      if (localStorage.getItem(LOCAL_STORAGE_PREFIX + 'customers') !== cStr) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'customers', cStr);
      }
      const iStr = JSON.stringify(invoices);
      if (localStorage.getItem(LOCAL_STORAGE_PREFIX + 'invoices') !== iStr) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'invoices', iStr);
      }
      const qStr = JSON.stringify(quotations);
      if (localStorage.getItem(LOCAL_STORAGE_PREFIX + 'quotations') !== qStr) {
        localStorage.setItem(LOCAL_STORAGE_PREFIX + 'quotations', qStr);
      }
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'theme', theme);
      if (theme === 'light') {
        document.documentElement.classList.add('light-mode');
      } else {
        document.documentElement.classList.remove('light-mode');
      }
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [products, customers, invoices, quotations, theme, isMounted]);

  // Real-time synchronization across browser tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_PREFIX + 'products' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setProducts(prev => {
              if (JSON.stringify(prev) === e.newValue) return prev;
              return parsed;
            });
          }
        } catch (err) {}
      }
      if (e.key === LOCAL_STORAGE_PREFIX + 'customers' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setCustomers(prev => {
              if (JSON.stringify(prev) === e.newValue) return prev;
              return parsed;
            });
          }
        } catch (err) {}
      }
      if (e.key === LOCAL_STORAGE_PREFIX + 'invoices' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setInvoices(prev => {
              if (JSON.stringify(prev) === e.newValue) return prev;
              return parsed;
            });
          }
        } catch (err) {}
      }
      if (e.key === LOCAL_STORAGE_PREFIX + 'quotations' && e.newValue) {
        try {
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) {
            setQuotations(prev => {
              if (JSON.stringify(prev) === e.newValue) return prev;
              return parsed;
            });
          }
        } catch (err) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Supabase Cloud PostgreSQL Real-time Synchronization (when configured)
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;
    const sb = supabase;

    // 1. Initial Fetch for all tables
    sb.from('products').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (data && !error && data.length > 0) setProducts(data.map(mapDbProduct));
    });

    sb.from('customers').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (data && !error && data.length > 0) setCustomers(data.map(mapDbCustomer));
    });

    sb.from('invoices').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (data && !error && data.length > 0) setInvoices(data.map(mapDbInvoice));
    });

    sb.from('quotations').select('*').order('created_at', { ascending: false }).then(({ data, error }) => {
      if (data && !error && data.length > 0) setQuotations(data.map(mapDbQuotation));
    });

    // 2. Real-time Subscription for all tables
    const channel = sb
      .channel('public:db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'products' }, () => {
        sb.from('products').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setProducts(data.map(mapDbProduct));
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'customers' }, () => {
        sb.from('customers').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setCustomers(data.map(mapDbCustomer));
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => {
        sb.from('invoices').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setInvoices(data.map(mapDbInvoice));
        });
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quotations' }, () => {
        sb.from('quotations').select('*').order('created_at', { ascending: false }).then(({ data }) => {
          if (data) setQuotations(data.map(mapDbQuotation));
        });
      })
      .subscribe();

    return () => {
      sb.removeChannel(channel);
    };
  }, []);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Phone Lookup Logic
  const lookupCustomerByPhone = (phoneInput: string) => {
    const cleanPhone = phoneInput.trim().replace(/\D/g, '');
    setPhoneSearchTerm(cleanPhone);
    setSearchAttempted(true);

    if (!cleanPhone) {
      setActiveCustomer(null);
      setSearchStatus('idle');
      return;
    }

    const found = customers.find(c => c.phone.replace(/\D/g, '') === cleanPhone);

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
    const newCustomer: Customer = {
      id: `c-${Date.now()}`,
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
      supabase.from('customers').upsert(mapCustomerToDb(newCustomer)).then(({ error }) => {
        if (error) console.error('Supabase register customer error:', error);
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
    collectedAmount?: number
  ): Invoice | null => {
    const validItems = cart.filter(item => item.quantity > 0);
    if (!activeCustomer || validItems.length === 0) return null;

    const subtotal = validItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
    const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
    const totalAmount = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

    let amountPaid = totalAmount;
    if (collectedAmount !== undefined && collectedAmount !== null && !isNaN(collectedAmount)) {
      amountPaid = Math.min(totalAmount, Math.max(0, Number(collectedAmount.toFixed(2))));
    }
    const dueAmount = Number((totalAmount - amountPaid).toFixed(2));
    const paymentStatus: 'Paid' | 'Partial' | 'Unpaid' =
      dueAmount <= 0 ? 'Paid' : amountPaid > 0 ? 'Partial' : 'Unpaid';

    const newInvoice: Invoice = {
      id: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      customerPhone: activeCustomer.phone,
      customerName: activeCustomer.name,
      customerAddress: activeCustomer.address,
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

    setInvoices(prev => [newInvoice, ...prev]);

    setProducts(prevProducts =>
      prevProducts.map(p => {
        const cartItem = validItems.find(c => c.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      })
    );

    const updatedCustomerState: Customer = {
      ...activeCustomer,
      totalPurchases: activeCustomer.totalPurchases + 1,
      totalSpent: activeCustomer.totalSpent + totalAmount,
      totalDue: (activeCustomer.totalDue || 0) + dueAmount,
    };

    setCustomers(prevCustomers =>
      prevCustomers.map(c => (c.id === activeCustomer.id ? updatedCustomerState : c))
    );

    setLastGeneratedInvoice(newInvoice);

    // Sync to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured && supabase) {
      const sb = supabase;
      // 1. Insert Invoice
      sb.from('invoices').insert(mapInvoiceToDb(newInvoice)).then(({ error }) => {
        if (error) console.error('Supabase invoice insert error:', error);
      });

      // 2. Upsert Customer stats
      sb.from('customers').upsert(mapCustomerToDb(updatedCustomerState)).then(({ error }) => {
        if (error) console.error('Supabase customer update error:', error);
      });

      // 3. Decrement Product Stock levels
      validItems.forEach(cartItem => {
        const targetProd = products.find(p => p.id === cartItem.product.id);
        if (targetProd) {
          const newStock = Math.max(0, targetProd.stock - cartItem.quantity);
          sb.from('products').update({ stock: newStock }).eq('id', targetProd.id).then();
        }
      });
    }

    return newInvoice;
  };

  // Past Due Settlement Payment
  const payCustomerDue = (
    customerId: string,
    settlementAmount: number,
    paymentMethod: PaymentMethod
  ): Invoice | null => {
    const cust = customers.find(c => c.id === customerId);
    if (!cust || settlementAmount <= 0) return null;

    const previousDue = cust.totalDue || 0;
    const actualPaid = Math.min(previousDue, Math.max(0, settlementAmount));
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
      subtotal: actualPaid,
      taxRate: 0,
      taxAmount: 0,
      discount: 0,
      totalAmount: actualPaid,
      amountPaid: actualPaid,
      dueAmount: newRemainingDue,
      paymentMethod,
      paymentStatus: newRemainingDue <= 0 ? 'Paid' : 'Partial',
      isSettlementReceipt: true,
      previousDue,
      createdAt: new Date().toISOString(),
      status: 'Completed',
    };

    setInvoices(prev => [newInvoice, ...prev]);

    let updatedCustState: Customer | null = null;

    setCustomers(prevCustomers =>
      prevCustomers.map(c => {
        if (c.id === customerId) {
          updatedCustState = {
            ...c,
            totalDue: newRemainingDue,
            totalSpent: c.totalSpent + actualPaid,
          };
          if (activeCustomer && activeCustomer.id === customerId) {
            setActiveCustomer(updatedCustState);
          }
          return updatedCustState;
        }
        return c;
      })
    );

    setLastGeneratedInvoice(newInvoice);

    // Sync to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured && supabase) {
      supabase.from('invoices').insert(mapInvoiceToDb(newInvoice)).then();
      if (updatedCustState) {
        supabase.from('customers').upsert(mapCustomerToDb(updatedCustState)).then();
      }
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

    setInvoices(prev => [newInvoice, ...prev]);

    let targetCust: Customer | null = null;

    setCustomers(prevCustomers => {
      const existing = prevCustomers.find(c => c.phone === data.customerPhone);
      if (existing) {
        targetCust = {
          ...existing,
          totalPurchases: existing.totalPurchases + 1,
          totalSpent: existing.totalSpent + totalAmount,
          totalDue: (existing.totalDue || 0) + dueAmount,
        };
        return prevCustomers.map(c => (c.phone === data.customerPhone ? targetCust! : c));
      } else {
        targetCust = {
          id: `c-${Date.now()}`,
          phone: data.customerPhone,
          name: data.customerName,
          address: data.customerAddress || 'N/A',
          registeredAt: new Date().toISOString(),
          totalPurchases: 1,
          totalSpent: totalAmount,
          totalDue: dueAmount,
        };
        return [targetCust, ...prevCustomers];
      }
    });

    setLastGeneratedInvoice(newInvoice);

    // Sync to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured && supabase) {
      supabase.from('invoices').insert(mapInvoiceToDb(newInvoice)).then();
      if (targetCust) {
        supabase.from('customers').upsert(mapCustomerToDb(targetCust)).then();
      }
    }

    return newInvoice;
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

    setQuotations(prev => [newQuotation, ...prev]);

    // Sync to Supabase Cloud PostgreSQL
    if (isSupabaseConfigured && supabase) {
      supabase.from('quotations').insert(mapQuotationToDb(newQuotation)).then();
    }

    return newQuotation;
  };

  const updateQuotationStatus = (id: string, newStatus: QuotationStatus, ownerNotes?: string) => {
    setQuotations(prev =>
      prev.map(q => {
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
      })
    );
  };

  const toggleQuotationTargeted = (id: string, isTargeted: boolean) => {
    setQuotations(prev =>
      prev.map(q => {
        if (q.id === id) {
          const updated = { ...q, isTargeted };
          if (isSupabaseConfigured && supabase) {
            supabase.from('quotations').update({ is_targeted: isTargeted }).eq('id', id).then();
          }
          return updated;
        }
        return q;
      })
    );
  };

  // Owner Product Actions (Adds items directly to central products array & Supabase Cloud)
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...productData,
      id: `p-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);

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
    setProducts(prev => [...newProds, ...prev]);

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').insert(newProds.map(mapProductToDb)).then(({ error }) => {
        if (error) console.error('Supabase bulk insert error:', error);
      });
    }
  };

  const updateProductStock = (productId: string, newStock: number) => {
    const validStock = Math.max(0, newStock);
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: validStock } : p))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').update({ stock: validStock }).eq('id', productId).then();
    }
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    const validPrice = Math.max(0, newPrice);
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, price: validPrice } : p))
    );

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').update({ price: validPrice }).eq('id', productId).then();
    }
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setCart(prev => prev.filter(item => item.product.id !== productId));

    if (isSupabaseConfigured && supabase) {
      supabase.from('products').delete().eq('id', productId).then();
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
        deleteProduct,
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
