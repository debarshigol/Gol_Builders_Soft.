'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product, Customer, Invoice, CartItem, PaymentMethod, UserRole, Quotation, QuotationStatus } from '@/types';
import { initialProducts, initialCustomers, initialInvoices, initialQuotations } from '@/data/mockData';

interface AppContextType {
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  products: Product[];
  customers: Customer[];
  invoices: Invoice[];
  quotations: Quotation[];
  
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

const LOCAL_STORAGE_PREFIX = 'gol_building_materials_v8_';

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeRole, setActiveRole] = useState<UserRole>('shopkeeper');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [quotations, setQuotations] = useState<Quotation[]>(initialQuotations);

  // Billing Flow States
  const [phoneSearchTerm, setPhoneSearchTerm] = useState<string>('');
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [searchStatus, setSearchStatus] = useState<'idle' | 'found' | 'not_found'>('idle');
  const [searchAttempted, setSearchAttempted] = useState<boolean>(false);

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);
  const [lastGeneratedInvoice, setLastGeneratedInvoice] = useState<Invoice | null>(null);

  // Load from localStorage on mount (hydration safe)
  useEffect(() => {
    try {
      const savedProducts = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'products');
      const savedCustomers = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'customers');
      const savedInvoices = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'invoices');
      const savedQuotations = localStorage.getItem(LOCAL_STORAGE_PREFIX + 'quotations');

      if (savedProducts) setProducts(JSON.parse(savedProducts));
      if (savedCustomers) setCustomers(JSON.parse(savedCustomers));
      if (savedInvoices) setInvoices(JSON.parse(savedInvoices));
      if (savedQuotations) setQuotations(JSON.parse(savedQuotations));
    } catch (e) {
      console.warn('LocalStorage unavailable:', e);
    }
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'products', JSON.stringify(products));
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'customers', JSON.stringify(customers));
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'invoices', JSON.stringify(invoices));
      localStorage.setItem(LOCAL_STORAGE_PREFIX + 'quotations', JSON.stringify(quotations));
    } catch (e) {
      console.warn('Failed to save to localStorage:', e);
    }
  }, [products, customers, invoices, quotations]);

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

    const updated = [newCustomer, ...customers];
    setCustomers(updated);
    setActiveCustomer(newCustomer);
    setSearchStatus('found');
    setSearchAttempted(true);
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
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          const maxAvailable = item.product.stock;
          return { product: item.product, quantity: Math.min(quantity, maxAvailable) };
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
    if (!activeCustomer || cart.length === 0) return null;

    const subtotal = cart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
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
      items: [...cart],
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
        const cartItem = cart.find(c => c.product.id === p.id);
        if (cartItem) {
          return { ...p, stock: Math.max(0, p.stock - cartItem.quantity) };
        }
        return p;
      })
    );

    setCustomers(prevCustomers =>
      prevCustomers.map(c => {
        if (c.id === activeCustomer.id) {
          return {
            ...c,
            totalPurchases: c.totalPurchases + 1,
            totalSpent: c.totalSpent + totalAmount,
            totalDue: (c.totalDue || 0) + dueAmount,
          };
        }
        return c;
      })
    );

    setLastGeneratedInvoice(newInvoice);
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

    setCustomers(prevCustomers =>
      prevCustomers.map(c => {
        if (c.id === customerId) {
          const updatedCust = {
            ...c,
            totalDue: newRemainingDue,
            totalSpent: c.totalSpent + actualPaid,
          };
          if (activeCustomer && activeCustomer.id === customerId) {
            setActiveCustomer(updatedCust);
          }
          return updatedCust;
        }
        return c;
      })
    );

    setLastGeneratedInvoice(newInvoice);
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

    setCustomers(prevCustomers => {
      const existing = prevCustomers.find(c => c.phone === data.customerPhone);
      if (existing) {
        return prevCustomers.map(c =>
          c.phone === data.customerPhone
            ? {
                ...c,
                totalPurchases: c.totalPurchases + 1,
                totalSpent: c.totalSpent + totalAmount,
                totalDue: (c.totalDue || 0) + dueAmount,
              }
            : c
        );
      } else {
        const newCust: Customer = {
          id: `c-${Date.now()}`,
          phone: data.customerPhone,
          name: data.customerName,
          address: data.customerAddress || 'N/A',
          registeredAt: new Date().toISOString(),
          totalPurchases: 1,
          totalSpent: totalAmount,
          totalDue: dueAmount,
        };
        return [newCust, ...prevCustomers];
      }
    });

    setLastGeneratedInvoice(newInvoice);
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

    // Also register or update customer if not present
    setCustomers(prev => {
      const existing = prev.find(c => c.phone === newQuotation.customerPhone);
      if (!existing) {
        const newCust: Customer = {
          id: `c-${Date.now()}`,
          phone: newQuotation.customerPhone,
          name: newQuotation.customerName,
          address: newQuotation.customerAddress || 'N/A',
          registeredAt: new Date().toISOString(),
          totalPurchases: 0,
          totalSpent: 0,
          totalDue: 0,
        };
        return [newCust, ...prev];
      }
      return prev;
    });

    return newQuotation;
  };

  const updateQuotationStatus = (id: string, newStatus: QuotationStatus, ownerNotes?: string) => {
    setQuotations(prev =>
      prev.map(q => {
        if (q.id === id) {
          return {
            ...q,
            status: newStatus,
            ownerCallLog: ownerNotes
              ? {
                  lastCalledAt: new Date().toISOString(),
                  ownerNotes,
                }
              : q.ownerCallLog,
          };
        }
        return q;
      })
    );
  };

  const toggleQuotationTargeted = (id: string, isTargeted: boolean) => {
    setQuotations(prev =>
      prev.map(q => (q.id === id ? { ...q, isTargeted } : q))
    );
  };

  // Owner Product Actions
  const addProduct = (productData: Omit<Product, 'id'>) => {
    const newProd: Product = {
      ...productData,
      id: `p-${Date.now()}`,
    };
    setProducts(prev => [newProd, ...prev]);
  };

  const bulkAddProducts = (productsData: Array<Omit<Product, 'id'>>) => {
    const now = Date.now();
    const newProds: Product[] = productsData.map((data, idx) => ({
      ...data,
      id: `p-${now}-${idx}`,
    }));
    setProducts(prev => [...newProds, ...prev]);
  };

  const updateProductStock = (productId: string, newStock: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p))
    );
  };

  const updateProductPrice = (productId: string, newPrice: number) => {
    setProducts(prev =>
      prev.map(p => (p.id === productId ? { ...p, price: Math.max(0, newPrice) } : p))
    );
  };

  const deleteProduct = (productId: string) => {
    setProducts(prev => prev.filter(p => p.id !== productId));
    setCart(prev => prev.filter(item => item.product.id !== productId));
  };

  return (
    <AppContext.Provider
      value={{
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
