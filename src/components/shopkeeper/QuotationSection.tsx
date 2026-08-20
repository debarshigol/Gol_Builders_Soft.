'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Product, Quotation } from '@/types';
import { QuotationModal } from './QuotationModal';
import {
  FileCheck2,
  Plus,
  Trash2,
  Search,
  User,
  Phone,
  MapPin,
  Calendar,
  Sparkles,
  Printer,
  X,
  FileText,
  ShoppingBag,
  Check,
  Building2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface QuotationSectionProps {
  searchTerm?: string;
  setSearchTerm?: (term: string) => void;
  isCartModalOpen?: boolean;
  setIsCartModalOpen?: (open: boolean) => void;
}

export const QuotationSection: React.FC<QuotationSectionProps> = ({
  searchTerm = '',
  setSearchTerm,
  isCartModalOpen: externalIsCartModalOpen,
  setIsCartModalOpen: externalSetIsCartModalOpen,
}) => {
  const { products, customers, quotations, createQuotation } = useApp();

  // Local Modal state fallback if external state is omitted
  const [internalIsCartModalOpen, setInternalIsCartModalOpen] = useState<boolean>(false);
  const isModalOpen = externalIsCartModalOpen !== undefined ? externalIsCartModalOpen : internalIsCartModalOpen;
  const setIsModalOpen = externalSetIsCartModalOpen || setInternalIsCartModalOpen;

  // Selected Category filter
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Quotation Cart items state
  const [quoteCart, setQuoteCart] = useState<Array<{ product: Product; quantity: number; quotedPrice: number }>>([]);

  // Customer Form details
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custAddress, setCustAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(0);
  const [validDays, setValidDays] = useState<number>(14);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Search Filter for Recent Saved Quotations
  const [quotationSearchTerm, setQuotationSearchTerm] = useState<string>('');
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);

  // Available Categories (Only Main Categories)
  const categories = useMemo(() => {
    const mainCats = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    return ['All', ...mainCats];
  }, [products]);

  // Filtered Products for 100% full width grid
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesSearch =
        !searchTerm.trim() ||
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'All' || p.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Add / Remove Quote Cart Helpers
  const addToQuoteCart = (prod: Product) => {
    setQuoteCart(prev => {
      const idx = prev.findIndex(i => i.product.id === prod.id);
      if (idx > -1) {
        const updated = [...prev];
        updated[idx].quantity += 1;
        return updated;
      }
      return [...prev, { product: prod, quantity: 1, quotedPrice: prod.price }];
    });
  };

  const updateQuoteQuantity = (productId: string, quantity: number) => {
    setQuoteCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, quantity: Math.max(0, quantity) };
        }
        return item;
      })
    );
  };

  const updateQuotedPrice = (productId: string, price: number) => {
    setQuoteCart(prev =>
      prev.map(item => {
        if (item.product.id === productId) {
          return { ...item, quotedPrice: Math.max(0, price) };
        }
        return item;
      })
    );
  };

  const removeFromQuoteCart = (productId: string) => {
    setQuoteCart(prev => prev.filter(i => i.product.id !== productId));
  };

  // Calculations
  const validQuoteItems = quoteCart.filter(i => i.quantity > 0);
  const totalCartItemsCount = validQuoteItems.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = validQuoteItems.reduce((sum, item) => sum + item.quotedPrice * item.quantity, 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const grandTotal = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

  // Generate & Print Quotation Handler
  const handleGenerateQuotation = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');

    if (validQuoteItems.length === 0) {
      setErrorMsg('Please add at least one material to the quotation cart.');
      return;
    }

    if (!custName.trim() || !custPhone.trim()) {
      setErrorMsg('Please enter Customer Name and Phone Number.');
      return;
    }

    const createdQuotation = createQuotation({
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      notes,
      items: validQuoteItems,
      taxRate,
      discount,
      validDays,
    });

    // Reset Form & Cart
    setQuoteCart([]);
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setNotes('');
    setDiscount(0);
    setIsModalOpen(false);

    // Open Printable Estimate Modal
    setViewingQuotation(createdQuotation);
  };

  // Filtered Saved Quotations
  const cleanSearch = quotationSearchTerm.trim().toLowerCase();
  const filteredQuotations = useMemo(() => {
    if (!cleanSearch) return quotations;
    return quotations.filter(q =>
      q.customerName.toLowerCase().includes(cleanSearch) ||
      q.customerPhone.includes(cleanSearch) ||
      q.id.toLowerCase().includes(cleanSearch)
    );
  }, [quotations, cleanSearch]);

  return (
    <div className="space-y-6 font-sans">

      {/* 100% FULL WIDTH PRODUCT CATALOG GRID (POS & QUOTATION STYLE) */}
      <div className="w-full flex flex-col font-sans">

        {/* Top Category Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-4 scrollbar-none">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${selectedCategory === cat
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 5-Column Responsive Seamless Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-5 2xl:grid-cols-5 gap-3 sm:gap-4">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 bg-slate-900/40 border border-slate-800 rounded-3xl">
              No products matching "{searchTerm}"
            </div>
          ) : (
            filteredProducts.map((product, idx) => {
              const quoteItem = quoteCart.find(i => i.product.id === product.id);

              return (
                <div
                  key={product.id}
                  className={`shop-product-card relative p-3 rounded-2xl border transition-all duration-300 flex flex-col justify-between group ${
                    quoteItem
                      ? 'border-slate-800 shadow-lg'
                      : 'border-slate-800/90 hover:shadow-xl'
                  }`}
                >
                  {/* Top 50-60%: Product Image / Emoji Container */}
                  <div className="shop-product-image relative w-full h-28 sm:h-32 rounded-xl border border-slate-800/80 flex items-center justify-center overflow-hidden p-2.5 group-hover:border-slate-700 transition">
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

                  {/* Bottom 10-15%: Pricing & ADD Button / Stepper */}
                  <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-800/80">
                    <div>
                      <div className="text-base font-black text-white font-mono tabular-nums leading-none">
                        ₹{product.price.toLocaleString()}
                      </div>
                    </div>

                    {quoteItem ? (
                      <div className="flex items-center space-x-1 bg-amber-950/80 border border-amber-500/60 rounded-xl p-1 shadow-sm">
                        <button
                          type="button"
                          onClick={() => {
                            if (quoteItem.quantity <= 1) {
                              removeFromQuoteCart(product.id);
                            } else {
                              updateQuoteQuantity(product.id, quoteItem.quantity - 1);
                            }
                          }}
                          className="w-6 h-6 rounded-lg bg-amber-800 hover:bg-amber-700 text-white flex items-center justify-center text-xs font-bold transition"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          min="1"
                          value={quoteItem.quantity === 0 ? '' : quoteItem.quantity}
                          onChange={e => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                            updateQuoteQuantity(product.id, isNaN(val) ? 0 : val);
                          }}
                          onBlur={() => {
                            if (!quoteItem.quantity || quoteItem.quantity < 1) {
                              updateQuoteQuantity(product.id, 1);
                            }
                          }}
                          className="w-12 text-center bg-slate-950 text-white font-mono font-black text-xs py-0.5 border border-amber-500/40 rounded focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          type="button"
                          onClick={() => updateQuoteQuantity(product.id, (quoteItem.quantity || 0) + 1)}
                          className="w-6 h-6 rounded-lg bg-amber-800 hover:bg-amber-700 text-white flex items-center justify-center text-xs font-bold transition"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToQuoteCart(product)}
                        className="px-3.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border-2 border-amber-500 font-extrabold rounded-xl text-xs uppercase tracking-wider transition hover:scale-105 shadow-sm flex items-center space-x-1"
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

      {/* POPUP CHECKOUT MODAL (GENERATE CUSTOMER QUOTATION) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
          <div className="glass-modal border border-slate-700/60 rounded-3xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl animate-scaleUp text-slate-100 overflow-hidden relative">

            {/* Modal Header */}
            <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-base sm:text-lg font-extrabold text-white">Generate Customer Quotation</h3>
                    <span className="bg-amber-500/20 text-amber-300 text-xs font-mono font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      {totalCartItemsCount} Items
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                {quoteCart.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setQuoteCart([])}
                    className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1 font-bold px-2.5 py-1 rounded-lg bg-red-500/10 border border-red-500/20"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Clear Items
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body (Scrollable) */}
            <form onSubmit={handleGenerateQuotation} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">

              {errorMsg && (
                <div className="p-3 bg-red-500/15 border border-red-500/30 rounded-xl text-red-300 text-xs flex items-center gap-2 font-medium">
                  <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Quoted Items Breakdown List */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2.5 flex items-center gap-1">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-400" /> Quoted Materials Breakdown
                </h4>

                {validQuoteItems.length === 0 ? (
                  <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                    No items in quote cart. Add materials from the catalog behind this modal.
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                    {validQuoteItems.map(item => (
                      <div
                        key={item.product.id}
                        className="flex items-center justify-between p-3 bg-slate-950 rounded-2xl border border-slate-800/80 text-xs shadow-sm"
                      >
                        <div className="flex items-center space-x-3 overflow-hidden">
                          {item.product.imageUrl ? (
                            <img
                              src={item.product.imageUrl}
                              alt={item.product.name}
                              loading="lazy"
                              decoding="async"
                              className="w-8 h-8 object-contain p-0.5 rounded-lg border border-slate-700 shrink-0 bg-slate-900"
                            />
                          ) : (
                            <span className="text-2xl shrink-0">{item.product.imageEmoji || '📦'}</span>
                          )}
                          <div className="truncate">
                            <div className="font-bold text-white truncate text-xs sm:text-sm">{item.product.name}</div>
                            <div className="flex items-center space-x-1.5 mt-0.5">
                              <span className="text-slate-400 font-mono text-[11px]">Quoted Rate: ₹</span>
                              <input
                                type="number"
                                min="0"
                                value={item.quotedPrice}
                                onChange={e => updateQuotedPrice(item.product.id, parseFloat(e.target.value) || 0)}
                                className="w-20 px-1.5 py-0.5 bg-slate-900 text-amber-400 font-mono font-bold text-xs border border-slate-700 rounded focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                              />
                              <span className="text-slate-500 text-[10px]">/ {item.product.unit}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 shrink-0">
                          {/* Spacious Quantity Stepper */}
                          <div className="flex items-center space-x-1.5 bg-amber-950/80 border border-amber-500/60 rounded-2xl p-1 shadow-md">
                            <button
                              type="button"
                              onClick={() => {
                                if (item.quantity <= 1) {
                                  removeFromQuoteCart(item.product.id);
                                } else {
                                  updateQuoteQuantity(item.product.id, item.quantity - 1);
                                }
                              }}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-sm flex items-center justify-center transition shrink-0 shadow-sm"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min="1"
                              value={item.quantity === 0 ? '' : item.quantity}
                              onChange={e => {
                                const val = e.target.value === '' ? 0 : parseInt(e.target.value, 10);
                                updateQuoteQuantity(item.product.id, isNaN(val) ? 0 : val);
                              }}
                              onBlur={() => {
                                if (!item.quantity || item.quantity < 1) {
                                  updateQuoteQuantity(item.product.id, 1);
                                }
                              }}
                              className="w-12 sm:w-16 text-center bg-slate-950 text-white font-mono font-black text-xs sm:text-sm py-1 border border-amber-500/50 rounded-xl focus:outline-none focus:border-amber-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button
                              type="button"
                              onClick={() => updateQuoteQuantity(item.product.id, (item.quantity || 0) + 1)}
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-amber-600 hover:bg-amber-500 active:scale-95 text-white font-black text-sm flex items-center justify-center transition shrink-0 shadow-sm"
                            >
                              +
                            </button>
                          </div>

                          <div className="w-16 text-right font-black text-amber-400 font-mono text-sm">
                            ₹{(item.quotedPrice * item.quantity).toLocaleString()}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeFromQuoteCart(item.product.id)}
                            className="text-slate-500 hover:text-red-400 transition p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Customer Info Form */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-amber-400" /> Customer Information
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Customer Full Name *</label>
                    <input
                      type="text"
                      required
                      value={custName}
                      onChange={e => setCustName(e.target.value)}
                      placeholder="e.g. Rajesh Kumar"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Mobile Phone Number *</label>
                    <input
                      type="tel"
                      required
                      value={custPhone}
                      onChange={e => setCustPhone(e.target.value)}
                      placeholder="e.g. 9876543210"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white font-mono focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Delivery / Site Address</label>
                  <textarea
                    rows={2}
                    value={custAddress}
                    onChange={e => setCustAddress(e.target.value)}
                    placeholder="Construction site address or village location..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Financials & Terms Settings */}
              <div className="bg-slate-950/80 p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">GST Tax Rate %</label>
                    <select
                      value={taxRate}
                      onChange={e => setTaxRate(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value={18}>18% GST (Standard)</option>
                      <option value={5}>5% GST (Reduced)</option>
                      <option value={0}>0% (Exempt)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Discount Amount ₹</label>
                    <input
                      type="number"
                      min="0"
                      value={discount}
                      onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-300 mb-1">Estimate Validity</label>
                    <select
                      value={validDays}
                      onChange={e => setValidDays(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none"
                    >
                      <option value={7}>7 Days</option>
                      <option value={14}>14 Days</option>
                      <option value={30}>30 Days</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-300 mb-1">Notes / Terms (Optional)</label>
                  <input
                    type="text"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="e.g. Free delivery on orders above ₹50,000"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-amber-950/20 border border-amber-500/30 rounded-2xl p-4 space-y-1.5 font-mono text-xs text-right">
                <div className="flex justify-between text-slate-300">
                  <span>Subtotal:</span>
                  <span>₹{subtotal.toLocaleString()}</span>
                </div>
                {taxAmount > 0 && (
                  <div className="flex justify-between text-slate-400">
                    <span>GST ({taxRate}%):</span>
                    <span>+₹{taxAmount.toLocaleString()}</span>
                  </div>
                )}
                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-semibold">
                    <span>Discount:</span>
                    <span>-₹{discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-slate-800 text-sm font-black text-white font-sans">
                  <span>Grand Total Estimate:</span>
                  <span className="text-amber-400 text-base">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={validQuoteItems.length === 0}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 text-slate-950 font-black rounded-2xl text-sm shadow-xl shadow-amber-500/20 flex items-center justify-center space-x-2 transition cursor-pointer"
                >
                  <Printer className="w-4 h-4 stroke-[2.5]" />
                  <span>Generate & Print Quotation</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RECENT SAVED QUOTATIONS DIRECTORY */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-amber-400" /> Recent Customer Quotations ({quotations.length})
            </h3>
            <p className="text-xs text-slate-400">Search past price estimates and print duplicate copies</p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={quotationSearchTerm}
              onChange={e => setQuotationSearchTerm(e.target.value)}
              placeholder="Search by customer name or phone..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 focus:border-amber-500 rounded-xl text-xs text-white focus:outline-none"
            />
          </div>
        </div>

        {filteredQuotations.length === 0 ? (
          <div className="py-8 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl text-xs">
            No quotations found matching "{quotationSearchTerm}".
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono text-[11px] uppercase border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">Quote ID</th>
                  <th className="px-4 py-3">Customer Details</th>
                  <th className="px-4 py-3 text-center">Items</th>
                  <th className="px-4 py-3 text-right">Estimate Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 font-mono text-slate-300">
                {filteredQuotations.map(q => (
                  <tr key={q.id} className="hover:bg-slate-950/60 transition">
                    <td className="px-4 py-3 font-bold text-amber-400">{q.id}</td>
                    <td className="px-4 py-3 font-sans">
                      <div className="font-bold text-white text-xs">{q.customerName}</div>
                      <div className="text-[11px] text-slate-400 font-mono">{q.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3 text-center font-bold">{q.items.length} items</td>
                    <td className="px-4 py-3 text-right font-black text-white">
                      ₹{q.totalAmount.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center font-sans">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300">
                        {q.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-sans">
                      <button
                        onClick={() => setViewingQuotation(q)}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition flex items-center gap-1.5 ml-auto"
                      >
                        <Printer className="w-3.5 h-3.5 text-amber-400" /> Print
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* PRINTABLE QUOTATION ESTIMATE MODAL */}
      <QuotationModal quotation={viewingQuotation} onClose={() => setViewingQuotation(null)} />
    </div>
  );
};
