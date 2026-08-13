'use client';

import React, { useState, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentMethod, Customer } from '@/types';
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
  Phone,
  UserCheck,
  UserPlus,
  MapPin,
  Sparkles,
} from 'lucide-react';

export const ItemBillingSection: React.FC<{ onInvoiceGenerated: () => void }> = ({ onInvoiceGenerated }) => {
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

  const [searchTerm, setSearchTerm] = useState('');
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
        // Reset name and address when entering a new un-registered number
        setCustomerName('');
        setCustomerAddress('');
      }
    }
  };

  // Categories list
  const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];

  // Filter products
  const filteredProducts = products.filter(product => {
    const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Totals calculation
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const finalTotal = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

  // Collected & Due calculation
  const parsedCollected = collectedAmountInput.trim() === '' ? finalTotal : Number(collectedAmountInput);
  const actualPaid = Math.min(finalTotal, Math.max(0, isNaN(parsedCollected) ? 0 : parsedCollected));
  const dueAmount = Math.max(0, Number((finalTotal - actualPaid).toFixed(2)));

  const handleGenerateInvoice = () => {
    if (cart.length === 0) {
      setPhoneError('Cart is empty. Please add products from the catalog on the left first.');
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

    const inv = generateInvoice(paymentMethod, taxRate, discount, actualPaid);
    if (inv) {
      setCollectedAmountInput('');
      setCustomerPhone('');
      setCustomerName('');
      setCustomerAddress('');
      setPhoneError('');
      onInvoiceGenerated();
    }
  };

  return (
    <div id="billing-section" className="scroll-mt-20">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: Product Catalog & Search (7 Cols) - ALWAYS UNLOCKED */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">

          <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-3">
              <div className="w-16 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                Step 1
              </div>
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-400" /> Select Products & Quantities
                </h2>
                <p className="text-xs text-slate-400">
                  Search inventory and add items to cart before asking for customer phone number
                </p>
              </div>
            </div>
          </div>

          {/* Search & Category Filter */}
          <div className="space-y-3 mb-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search product name or SKU code..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-sm text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Categories horizontally scrollable */}
            <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${selectedCategory === cat
                    ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Products Grid (Blinkit Style Card Layout) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5 overflow-y-auto max-h-[580px] pr-1 font-sans">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center text-slate-500 text-xs">
                No products matching "{searchTerm}"
              </div>
            ) : (
              filteredProducts.map(product => {
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
                    {/* Top 50-60%: Product Image / Emoji Display Container */}
                    <div className="relative w-full h-32 sm:h-36 rounded-xl bg-slate-900/90 border border-slate-800/80 flex items-center justify-center overflow-hidden p-3 group-hover:border-slate-700 transition">
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

                      {/* Large Centered Product Emoji (50-60% Image Display) */}
                      <span className="text-5xl sm:text-6xl group-hover:scale-110 transition-transform duration-300 select-none filter drop-shadow-md">
                        {product.imageEmoji}
                      </span>
                    </div>

                    {/* Middle 30%: Product Info Details */}
                    <div className="mt-2.5 flex-1 flex flex-col justify-between">
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
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/80">
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
                            onClick={() => updateCartQuantity(product.id, cartItem.quantity - 1)}
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
                            className="w-10 text-center bg-slate-950 text-white font-mono font-black text-xs py-0.5 border border-emerald-500/40 rounded focus:outline-none focus:border-emerald-400"
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

        {/* RIGHT: Cart Summary, Customer Lookup & Bill Checkout (5 Cols) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-16 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
                  Step 2
                </div>
                <h3 className="font-bold text-white text-base">Bill Summary & Checkout</h3>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={clearCart}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              )}
            </div>

            {/* Cart Items List */}
            {cart.length === 0 ? (
              <div className="py-10 text-center text-slate-500 border border-dashed border-slate-800 rounded-xl mb-4">
                <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-30 text-emerald-400" />
                <p className="text-xs font-medium text-slate-400">No items added to bill yet.</p>
                <p className="text-[11px] text-slate-600">Select products from the catalog on the left.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 mb-4">
                {cart.map(item => (
                  <div
                    key={item.product.id}
                    className="flex items-center justify-between p-2.5 bg-slate-950 rounded-xl border border-slate-800/80 text-xs"
                  >
                    <div className="flex items-center space-x-2.5 overflow-hidden">
                      <span className="text-lg">{item.product.imageEmoji}</span>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate">{item.product.name}</div>
                        <div className="text-slate-400 font-mono">₹{item.product.price} / {item.product.unit}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 shrink-0">
                      {/* Direct Editable Quantity Input */}
                      <div className="flex items-center space-x-1 bg-slate-900 border border-slate-700 rounded-lg p-0.5">
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity - 1)}
                          className="px-2 py-1 text-slate-300 hover:text-white font-bold"
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
                          className="w-14 text-center bg-slate-950 text-white font-mono font-bold text-xs py-1 border border-slate-800 rounded focus:outline-none focus:border-emerald-500"
                        />
                        <button
                          type="button"
                          onClick={() => updateCartQuantity(item.product.id, item.quantity + 1)}
                          disabled={item.quantity >= item.product.stock}
                          className="px-2 py-1 text-slate-300 hover:text-white disabled:opacity-30 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <div className="w-16 text-right font-bold text-emerald-400 font-mono">
                        ₹{(item.product.price * item.quantity).toLocaleString()}
                      </div>

                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-slate-500 hover:text-red-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Customer Details & Checkout Form */}
          {cart.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-800">

              {/* Step 3: Customer Details Lookup / Registration */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-emerald-400" />
                    Customer Mobile Number
                  </span>
                  {matchedCustomer && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <UserCheck className="w-3 h-3" /> Registered
                    </span>
                  )}
                </div>

                <input
                  type="tel"
                  value={customerPhone}
                  onChange={handlePhoneInputChange}
                  placeholder="Enter 10-digit customer mobile number..."
                  className="w-full bg-slate-900 border border-slate-800 focus:border-emerald-500 rounded-xl px-3 py-2 text-xs text-white font-mono placeholder-slate-500 focus:outline-none"
                />

                {/* Auto-filled Registered Customer Info */}
                {matchedCustomer ? (
                  <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-2.5 text-xs space-y-1">
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
                  /* New Unregistered Customer Registration Fields */
                  <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-3 text-xs space-y-2">
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
                  <div className="text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded-lg flex items-center space-x-1.5">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{phoneError}</span>
                  </div>
                )}
              </div>

              {/* Tax % & Discount inputs */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 flex items-center gap-1">
                    <Percent className="w-3 h-3 text-indigo-400" /> GST Tax Rate
                  </label>
                  <select
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none"
                  >
                    <option value={0}>0% Tax</option>
                    <option value={5}>5% GST</option>
                    <option value={12}>12% GST</option>
                    <option value={18}>18% GST</option>
                    <option value={28}>28% GST</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 mb-1 flex items-center gap-1">
                    <Tag className="w-3 h-3 text-amber-400" /> Discount (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={discount || ''}
                    onChange={e => setDiscount(Math.max(0, Number(e.target.value)))}
                    placeholder="0"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-mono focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Payment Method
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs">
                  {(['UPI', 'Cash', 'Card', 'Store Credit'] as PaymentMethod[]).map(pm => (
                    <button
                      key={pm}
                      type="button"
                      onClick={() => setPaymentMethod(pm)}
                      className={`py-2 px-1.5 rounded-lg border flex flex-col items-center justify-center transition font-medium ${paymentMethod === pm
                        ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400 font-bold'
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

              {/* Collected Amount Field (Partial / Full Payment) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                    <Banknote className="w-3.5 h-3.5 text-emerald-400" /> Collected Amount (₹)
                  </label>
                  <span className="text-[10px] text-slate-400">
                    {collectedAmountInput === '' ? '(Default: Full Payment)' : 'Partial Payment Entered'}
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
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal ({cart.reduce((a, c) => a + c.quantity, 0)} items):</span>
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
                  <div className="flex justify-between items-center text-xs text-amber-400 font-bold bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 mt-1">
                    <span>Balance Remaining Due:</span>
                    <span className="font-mono text-sm">₹{dueAmount.toLocaleString()}</span>
                  </div>
                ) : (
                  <div className="text-[11px] text-emerald-400 font-medium text-right pt-0.5">
                    ✓ Full Payment Settled
                  </div>
                )}
              </div>

              {/* Generate Invoice Action */}
              <button
                onClick={handleGenerateInvoice}
                className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold rounded-xl text-sm transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
              >
                <PackageCheck className="w-5 h-5" />
                <span>Generate Bill & Print Receipt</span>
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
