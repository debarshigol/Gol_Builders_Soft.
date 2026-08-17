'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentMethod, Customer, Product } from '@/types';
import {
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Receipt,
  CreditCard,
  QrCode,
  Banknote,
  Percent,
  Tag,
  AlertCircle,
  Check,
  PackageCheck,
  ArrowRight,
  Phone,
  UserCheck,
  UserPlus,
  MapPin,
  Sparkles,
  X,
} from 'lucide-react';

interface ItemBillingSectionProps {
  onInvoiceGenerated: () => void;
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  isCartModalOpen?: boolean;
  setIsCartModalOpen?: (open: boolean) => void;
}

export const ItemBillingSection: React.FC<ItemBillingSectionProps> = ({
  onInvoiceGenerated,
  searchTerm: propSearchTerm,
  setSearchTerm: propSetSearchTerm,
  isCartModalOpen: propIsCartModalOpen,
  setIsCartModalOpen: propSetIsCartModalOpen,
}) => {
  const {
    products,
    cart,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    clearCart,
    generateInvoice,
    registerCustomer,
    lookupCustomerByPhone,
    customers,
  } = useApp();

  const [localSearchTerm, setLocalSearchTerm] = useState('');
  const searchTerm = propSearchTerm !== undefined ? propSearchTerm : localSearchTerm;
  const setSearchTerm = propSetSearchTerm || setLocalSearchTerm;

  const [localIsCartModalOpen, setLocalIsCartModalOpen] = useState<boolean>(false);
  const isCartModalOpen = propIsCartModalOpen !== undefined ? propIsCartModalOpen : localIsCartModalOpen;
  const setIsCartModalOpen = propSetIsCartModalOpen || setLocalIsCartModalOpen;

  const [selectedCategory, setSelectedCategory] = useState('All');
  const [taxRate, setTaxRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [collectedAmountInput, setCollectedAmountInput] = useState<string>('');

  // Customer Details State (Reversed POS Flow)
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Auto-detect if entered phone belongs to a registered customer
  const matchedCustomer: Customer | null =
    customerPhone.trim().length >= 10
      ? customers.find(c => c.phone.trim() === customerPhone.trim()) || null
      : null;

  // Auto-fill Name & Address when a registered customer is matched
  useEffect(() => {
    if (matchedCustomer) {
      setCustomerName(matchedCustomer.name);
      setCustomerAddress(matchedCustomer.address);
    }
  }, [matchedCustomer]);

  const handlePhoneInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomerPhone(val);
    setPhoneError('');

    if (val.trim().length >= 10) {
      const found = customers.find(c => c.phone.trim() === val.trim());
      if (found) {
        setCustomerName(found.name);
        setCustomerAddress(found.address);
      } else {
        setCustomerName('');
        setCustomerAddress('');
      }
    }
  };

  // Categories list (Includes Main Categories and Sub-Categories)
  const categories = useMemo(() => {
    const mainCats = products.map(p => p.category).filter(Boolean);
    const subCats = products.map(p => p.subCategory).filter((s): s is string => Boolean(s));
    const set = new Set([...mainCats, ...subCats]);
    return ['All', ...Array.from(set)];
  }, [products]);

  // Filter products and sort by total units sold (itemSold descending).
  const filteredProducts = useMemo(() => {
    const searchLower = (searchTerm || '').toLowerCase().trim();
    const filtered = products.filter(product => {
      if (!product) return false;
      const matchesCategory =
        selectedCategory === 'All' ||
        product.category === selectedCategory ||
        product.subCategory === selectedCategory;
      const matchesSearch =
        !searchLower ||
        (product.name && product.name.toLowerCase().includes(searchLower)) ||
        (product.sku && product.sku.toLowerCase().includes(searchLower)) ||
        (product.category && product.category.toLowerCase().includes(searchLower)) ||
        (product.subCategory && product.subCategory.toLowerCase().includes(searchLower));
      return matchesCategory && matchesSearch;
    });

    // Sort descending by itemSold from DB/state — most frequently bought items always at the top
    return [...filtered].sort(
      (a, b) => (b.itemSold || 0) - (a.itemSold || 0)
    );
  }, [products, selectedCategory, searchTerm]);

  // ── Loading state: products haven't arrived from Supabase yet ──
  const isLoading = products.length === 0;

  // Totals calculation
  const totalCartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

  // Collected & Due calculation
  const parsedCollected = collectedAmountInput.trim() === '' ? finalTotal : Number(collectedAmountInput);
  const actualPaid = Math.min(finalTotal, Math.max(0, isNaN(parsedCollected) ? 0 : parsedCollected));
  const dueAmount = Math.max(0, Number((finalTotal - actualPaid).toFixed(2)));

  const handleGenerateInvoice = () => {
    if (cart.length === 0) {
      setPhoneError('Cart is empty. Please add products from the catalog first.');
      return;
    }
    if (!customerPhone.trim() || customerPhone.trim().length < 10) {
      setPhoneError('Please enter a valid 10-digit customer phone number.');
      return;
    }

    let targetCust = matchedCustomer;

    if (!targetCust) {
      if (!customerName.trim()) {
        setPhoneError('Customer not registered. Please enter customer full name.');
        return;
      }
      if (!customerAddress.trim()) {
        setPhoneError('Customer not registered. Please enter customer address.');
        return;
      }

      // Register new customer and set as active in context
      targetCust = registerCustomer(customerPhone.trim(), customerName.trim(), customerAddress.trim());
    } else {
      // Set active customer in context
      lookupCustomerByPhone(targetCust.phone);
    }

    const inv = generateInvoice(paymentMethod, taxRate, discount, actualPaid, targetCust);
    if (inv) {
      setCollectedAmountInput('');
      setCustomerPhone('');
      setCustomerName('');
      setCustomerAddress('');
      setPhoneError('');
      setIsCartModalOpen(false); // Close cart popup modal on successful invoice creation
      onInvoiceGenerated();
    }
  };

  return (
    <div id="billing-section" className="scroll-mt-20">

      {/* 100% FULL WIDTH PRODUCT CATALOG & SEARCH (SEAMLESS DISPLAY) */}
      <div className="w-full flex flex-col font-sans">

        {/* Horizontally Scrollable Category Pills Row */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
          {categories.map((cat: string) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Full-Width Products Grid (5 Items Per Row Layout) with Lazy Loading */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-2.5 sm:gap-3.5 overflow-y-auto max-h-[640px] pr-1">

          {/* ── Skeleton shimmer while Supabase is still loading ── */}
          {isLoading ? (
            Array.from({ length: 10 }).map((_, i) => (
              <div
                key={`skel-${i}`}
                className="p-3 rounded-2xl border border-slate-800/60 bg-slate-950/60 flex flex-col animate-pulse"
              >
                <div className="w-full h-28 sm:h-32 rounded-xl bg-slate-800/60 mb-3" />
                <div className="h-3 bg-slate-800/60 rounded-full w-3/4 mb-2" />
                <div className="h-3 bg-slate-800/40 rounded-full w-1/2 mb-4" />
                <div className="flex justify-between items-center pt-2 border-t border-slate-800/40">
                  <div className="h-4 bg-slate-800/60 rounded-full w-16" />
                  <div className="h-7 bg-slate-800/60 rounded-xl w-14" />
                </div>
              </div>
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-500 text-xs">
              No products matching &quot;{searchTerm}&quot;
            </div>
          ) : (
            filteredProducts.map((product: Product, idx: number) => {
              const cartItem = cart.find(i => i.product.id === product.id);
              const isOutOfStock = product.stock <= 0;
              const isLowStock = product.stock > 0 && product.stock <= 10;

              return (
                <div
                  key={product.id}
                  className={`p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between group ${
                    isOutOfStock
                      ? 'bg-slate-950/40 border-slate-850 opacity-60'
                      : cartItem
                      ? 'bg-slate-950 border-emerald-500/60 shadow-lg shadow-emerald-500/10'
                      : 'bg-slate-950 border-slate-800/90 hover:border-emerald-500/40 hover:shadow-xl'
                  }`}
                >
                  {/* Top 50-60%: Product Image / Emoji Container */}
                  <div className="relative w-full h-28 sm:h-32 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-center overflow-hidden p-2.5 group-hover:border-slate-700 transition">

                    {/* Stock Badge Overlay Top Right */}
                    <span
                      className={`absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded-md font-bold z-10 ${
                        isOutOfStock
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : isLowStock
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold'
                          : 'bg-slate-950/90 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {isOutOfStock ? 'Out of Stock' : product.stock > 1000 ? '1000+ left' : `${product.stock} left`}
                    </span>

                    {/* Centered Product Image / Emoji Display */}
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        loading={idx < 10 ? 'eager' : 'lazy'}
                        decoding="async"
                        className="w-full h-full object-contain p-1 rounded-xl"
                      />
                    ) : (
                      <span className="text-4xl sm:text-5xl group-hover:scale-110 transition-transform duration-300 select-none filter drop-shadow-md">
                        {product.imageEmoji || '📦'}
                      </span>
                    )}
                  </div>

                  {/* Middle 30%: Product Info Details */}
                  <div className="mt-3 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-xs sm:text-sm text-white group-hover:text-emerald-300 transition line-clamp-2 leading-snug">
                        {product.name}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-medium mt-1">
                        Unit: <span className="text-slate-300 font-semibold">{product.unit}</span>
                      </p>
                    </div>
                  </div>

                  {/* Bottom 10-15%: Pricing & Blinkit Style ADD Button / Stepper */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80">
                    <div>
                      <div className="text-base font-black text-white font-mono tabular-nums leading-none">
                        ₹{product.price.toLocaleString()}
                      </div>
                    </div>

                    {/* ADD Button or Quantity Stepper */}
                    {cartItem ? (
                      <div className="flex items-center space-x-1 bg-emerald-950/80 border border-emerald-500/60 rounded-xl p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => {
                            if (cartItem.quantity <= 1) {
                              removeFromCart(product.id);
                            } else {
                              updateCartQuantity(product.id, cartItem.quantity - 1);
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-emerald-800 hover:bg-emerald-700 text-white flex items-center justify-center text-xs font-bold transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          max={product.stock}
                          value={cartItem.quantity === 0 ? '' : cartItem.quantity}
                          onChange={e => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateCartQuantity(product.id, isNaN(val) ? 0 : val);
                          }}
                          className="w-10 text-center bg-slate-950 text-white font-mono font-black text-xs py-0.5 border border-emerald-500/40 rounded focus:outline-none focus:border-emerald-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(product.id, cartItem.quantity + 1)}
                          disabled={cartItem.quantity >= product.stock}
                          className="w-6 h-6 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center text-xs font-bold transition"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(product)}
                        disabled={isOutOfStock}
                        className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-2 border-emerald-500 disabled:opacity-40 disabled:hover:bg-transparent font-extrabold rounded-xl text-xs uppercase tracking-wider transition hover:scale-105 shadow-sm flex items-center space-x-1"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>ADD</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* STEP 2: BILL SUMMARY & CHECKOUT POPUP MODAL */}
      {isCartModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="glass-modal border border-slate-700/60 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-scaleUp text-slate-100 overflow-hidden relative">

            {/* Popup Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                  <ShoppingBag className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-white">Billing and Checkout</h3>
                    <span className="bg-emerald-500/20 text-emerald-300 text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-emerald-500/30">
                      {totalCartItemsCount} Items
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {cart.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCart}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsCartModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Popup Modal Body (Scrollable) */}
            <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

              {/* Cart Items List */}
              {cart.length === 0 ? (
                <div className="py-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                  <ShoppingBag className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-400" />
                  <p className="text-xs font-medium text-slate-300">Your bill cart is currently empty.</p>
                  <p className="text-[11px] text-slate-500 mt-1">Add items from the full-width product catalog behind this popup.</p>
                </div>
              ) : (
                <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs shadow-sm"
                    >
                      <div className="flex items-center space-x-3 overflow-hidden">
                        {item.product.imageUrl ? (
                          <img src={item.product.imageUrl} alt={item.product.name} className="w-8 h-8 object-contain p-0.5 rounded-lg border border-slate-700 shrink-0" />
                        ) : (
                          <span className="text-2xl shrink-0">{item.product.imageEmoji || '📦'}</span>
                        )}
                        <div className="truncate">
                          <div className="font-bold text-white truncate text-xs sm:text-sm">{item.product.name}</div>
                          <div className="text-slate-400 font-mono text-[11px]">₹{item.product.price} / {item.product.unit}</div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3 shrink-0">
                        {/* Spacious Quantity Increment/Decrement Stepper */}
                        <div className="flex items-center space-x-1.5 bg-emerald-950/80 border border-emerald-500/60 rounded-2xl p-1 shadow-md">
                          <button
                            type="button"
                            onClick={() => {
                              if (item.quantity <= 1) {
                                removeFromCart(item.product.id);
                              } else {
                                updateCartQuantity(item.product.id, item.quantity - 1);
                              }
                            }}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-black text-sm sm:text-base flex items-center justify-center transition shrink-0 shadow-sm"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={item.product.stock}
                            value={item.quantity === 0 ? '' : item.quantity}
                            onChange={e => {
                              const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                              updateCartQuantity(item.product.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-12 sm:w-16 text-center bg-slate-950 text-white font-mono font-black text-xs sm:text-sm py-1 border border-emerald-500/50 rounded-xl focus:outline-none focus:border-emerald-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button
                            type="button"
                            onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                            disabled={item.quantity >= item.product.stock}
                            className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 active:scale-95 text-white font-black text-sm sm:text-base flex items-center justify-center transition shrink-0 shadow-sm"
                          >
                            +
                          </button>
                        </div>

                        <div className="w-16 text-right font-black text-emerald-400 font-mono text-sm">
                          ₹{(item.product.price * item.quantity).toLocaleString()}
                        </div>

                        <button
                          type="button"
                          onClick={() => removeFromCart(item.product.id)}
                          className="text-slate-500 hover:text-red-400 transition p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Checkout Form & Customer Lookup */}
              {cart.length > 0 && (
                <div className="space-y-4 pt-3 border-t border-slate-800">

                  {/* Customer Phone Search / Registration */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                        <Phone className="w-4 h-4 text-emerald-400" />
                        Customer Mobile Number
                      </span>
                      {matchedCustomer && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                          <UserCheck className="w-3 h-3" /> Registered Customer
                        </span>
                      )}
                    </div>

                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={handlePhoneInputChange}
                      placeholder="Enter 10-digit customer mobile number..."
                      className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
                    />

                    {/* Auto-filled Registered Customer Info */}
                    {matchedCustomer ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs space-y-1">
                        <div className="flex items-center justify-between text-emerald-300 font-bold">
                          <span className="text-xs font-extrabold">{matchedCustomer.name}</span>
                          <span className="font-mono text-[10px] text-emerald-400/80">ID: {matchedCustomer.id}</span>
                        </div>
                        <div className="text-slate-300 flex items-center gap-1 text-[11px]">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {matchedCustomer.address}
                        </div>
                        {matchedCustomer.totalDue && matchedCustomer.totalDue > 0 ? (
                          <div className="mt-1 pt-1 border-t border-emerald-500/20 flex items-center justify-between text-amber-400 font-bold text-[11px]">
                            <span>⚠️ Past Credit Balance Due:</span>
                            <span className="font-mono text-xs">₹{matchedCustomer.totalDue.toLocaleString()}</span>
                          </div>
                        ) : null}
                      </div>
                    ) : customerPhone.trim().length >= 10 ? (
                      /* New Customer Registration Fields */
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs space-y-2.5">
                        <div className="text-amber-300 font-bold text-xs flex items-center gap-1">
                          <UserPlus className="w-3.5 h-3.5" /> New Customer Registration Required
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-300">Customer Full Name *</label>
                          <input
                            type="text"
                            value={customerName}
                            onChange={e => setCustomerName(e.target.value)}
                            placeholder="e.g. Rajesh Kumar"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-300">Address / Location *</label>
                          <input
                            type="text"
                            value={customerAddress}
                            onChange={e => setCustomerAddress(e.target.value)}
                            placeholder="e.g. Site #42, MG Road, Ward 5"
                            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    ) : null}

                    {phoneError && (
                      <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2.5 rounded-xl flex items-center space-x-1.5">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{phoneError}</span>
                      </div>
                    )}
                  </div>

                  {/* GST Tax & Discount Row */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1 font-medium">
                        <Percent className="w-3.5 h-3.5 text-indigo-400" /> GST Tax Rate
                      </label>
                      <select
                        value={taxRate}
                        onChange={e => setTaxRate(Number(e.target.value))}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                      >
                        <option value={0}>0% Tax</option>
                        <option value={5}>5% GST</option>
                        <option value={12}>12% GST</option>
                        <option value={18}>18% GST</option>
                        <option value={28}>28% GST</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-400 mb-1 flex items-center gap-1 font-medium">
                        <Tag className="w-3.5 h-3.5 text-amber-400" /> Discount (₹)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={discount || ''}
                        onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                        placeholder="0"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-white font-mono focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* Payment Method Options */}
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1.5">
                      Payment Method
                    </label>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      {(['UPI', 'Cash', 'Card', 'Store Credit'] as PaymentMethod[]).map(pm => (
                        <button
                          key={pm}
                          type="button"
                          onClick={() => setPaymentMethod(pm)}
                          className={`py-2 px-2 rounded-xl border flex flex-col items-center justify-center transition font-semibold ${paymentMethod === pm
                            ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold shadow-sm'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                          {pm === 'UPI' && <QrCode className="w-4 h-4 mb-1" />}
                          {pm === 'Cash' && <Banknote className="w-4 h-4 mb-1" />}
                          {pm === 'Card' && <CreditCard className="w-4 h-4 mb-1" />}
                          {pm === 'Store Credit' && <Receipt className="w-4 h-4 mb-1" />}
                          <span className="text-[10px]">{pm}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Collected Amount Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-bold text-slate-300 flex items-center gap-1">
                        <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Collected Amount (₹)
                      </label>
                      <span className="text-[10px] text-slate-400">
                        {collectedAmountInput === '' ? '(Default: Full Payment)' : 'Partial Payment'}
                      </span>
                    </div>
                    <input
                      type="number"
                      min="0"
                      max={finalTotal}
                      value={collectedAmountInput}
                      onChange={e => setCollectedAmountInput(e.target.value)}
                      placeholder={`Enter collected amount (Default: Full ₹${finalTotal.toLocaleString()})`}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-emerald-500 rounded-xl p-2.5 text-sm text-white font-mono placeholder-slate-500 focus:outline-none"
                    />
                  </div>

                  {/* Breakdown Summary Box */}
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-xs space-y-1.5">
                    <div className="flex justify-between text-slate-400">
                      <span>Subtotal ({totalCartItemsCount} items):</span>
                      <span className="font-mono">₹{subtotal.toLocaleString()}</span>
                    </div>
                    {taxRate > 0 && (
                      <div className="flex justify-between text-slate-400">
                        <span>GST ({taxRate}%):</span>
                        <span className="font-mono">+₹{taxAmount.toLocaleString()}</span>
                      </div>
                    )}
                    {discount > 0 && (
                      <div className="flex justify-between text-amber-400">
                        <span>Discount Applied:</span>
                        <span className="font-mono">-₹{discount.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-sm font-bold text-white pt-2 border-t border-slate-800">
                      <span>Grand Total:</span>
                      <span className="text-lg text-white font-mono">₹{finalTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs text-emerald-400 font-semibold pt-1">
                      <span>Amount Paid Today:</span>
                      <span className="font-mono">₹{actualPaid.toLocaleString()}</span>
                    </div>
                    {dueAmount > 0 ? (
                      <div className="flex justify-between items-center text-xs text-amber-400 font-bold bg-amber-500/10 p-2.5 rounded-xl border border-amber-500/20 mt-1">
                        <span>Balance Remaining Due:</span>
                        <span className="font-mono text-sm">₹{dueAmount.toLocaleString()}</span>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400 font-medium text-right pt-0.5">
                        ✓ Full Payment Settled
                      </div>
                    )}
                  </div>

                  {/* Generate Bill & Print Receipt Action */}
                  <button
                    type="button"
                    onClick={handleGenerateInvoice}
                    className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold rounded-2xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
                  >
                    <PackageCheck className="w-5 h-5" />
                    <span>Generate Bill & Print Receipt</span>
                  </button>

                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* Floating Mobile Cart Bar (Mobile Only: 6.5" Phone Trigger) */}
      {totalCartItemsCount > 0 && (
        <div className="fixed bottom-4 left-4 right-4 z-30 lg:hidden animate-scaleUp">
          <button
            type="button"
            onClick={() => setIsCartModalOpen(true)}
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-4 py-3 rounded-2xl font-black text-sm flex items-center justify-between shadow-2xl shadow-emerald-500/40 ring-2 ring-emerald-400/40"
          >
            <div className="flex items-center space-x-2">
              <span className="w-7 h-7 rounded-xl bg-slate-950 text-emerald-400 font-mono text-xs flex items-center justify-center font-bold">
                {totalCartItemsCount}
              </span>
              <span>Cart Total: <strong className="font-mono text-base">₹{subtotal.toLocaleString()}</strong></span>
            </div>
            <div className="flex items-center space-x-1 uppercase text-xs tracking-wider font-extrabold">
              <span>Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

    </div>
  );
};
