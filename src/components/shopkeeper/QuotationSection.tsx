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
  Check
} from 'lucide-react';

export const QuotationSection: React.FC = () => {
  const { products, customers, quotations, createQuotation } = useApp();

  // Customer Form State
  const [custName, setCustName] = useState<string>('');
  const [custPhone, setCustPhone] = useState<string>('');
  const [custAddress, setCustAddress] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(0);
  const [validDays, setValidDays] = useState<number>(14);

  // Selected Items for Quotation
  const [quoteItems, setQuoteItems] = useState<Array<{ product: Product; quantity: number; quotedPrice: number }>>([]);
  
  // Keyword Search State for Materials Selection
  const [materialSearch, setMaterialSearch] = useState<string>('');

  // Search & Filter State for Saved Quotations
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);

  // Auto-fill customer details from existing directory
  const handleQuickSelectCustomer = (c: typeof customers[0]) => {
    setCustName(c.name);
    setCustPhone(c.phone);
    setCustAddress(c.address);
  };

  // Keyword Matching Products (requires at least 1 character)
  const cleanMatSearch = materialSearch.trim().toLowerCase();
  const searchResults = useMemo(() => {
    if (!cleanMatSearch) return [];
    return products.filter(p =>
      p.name.toLowerCase().includes(cleanMatSearch) ||
      p.category.toLowerCase().includes(cleanMatSearch) ||
      p.sku.toLowerCase().includes(cleanMatSearch)
    );
  }, [products, cleanMatSearch]);

  const handleSelectProduct = (prod: Product) => {
    setQuoteItems(prev => {
      const existingIdx = prev.findIndex(i => i.product.id === prod.id);
      if (existingIdx > -1) {
        const updated = [...prev];
        updated[existingIdx].quantity += 1;
        return updated;
      }
      return [...prev, { product: prod, quantity: 1, quotedPrice: prod.price }];
    });
    setMaterialSearch('');
  };

  const handleUpdateItemQty = (prodId: string, qty: number) => {
    if (qty <= 0) {
      setQuoteItems(prev => prev.filter(i => i.product.id !== prodId));
      return;
    }
    setQuoteItems(prev =>
      prev.map(i => (i.product.id === prodId ? { ...i, quantity: qty } : i))
    );
  };

  const handleUpdateItemPrice = (prodId: string, price: number) => {
    setQuoteItems(prev =>
      prev.map(i => (i.product.id === prodId ? { ...i, quotedPrice: Math.max(0, price) } : i))
    );
  };

  const handleRemoveItem = (prodId: string) => {
    setQuoteItems(prev => prev.filter(i => i.product.id !== prodId));
  };

  // Financial calculations
  const subtotal = useMemo(() => {
    return quoteItems.reduce((sum, item) => sum + item.quotedPrice * item.quantity, 0);
  }, [quoteItems]);

  const taxAmount = useMemo(() => {
    return Number(((subtotal * taxRate) / 100).toFixed(2));
  }, [subtotal, taxRate]);

  const totalAmount = useMemo(() => {
    return Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));
  }, [subtotal, taxAmount, discount]);

  // Handle Save & Generate Quotation
  const handleSaveQuotation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName.trim()) {
      alert('Please enter customer full name.');
      return;
    }
    if (!custPhone.trim() || custPhone.trim().replace(/\D/g, '').length < 10) {
      alert('Please enter a valid 10-digit mobile number.');
      return;
    }
    if (quoteItems.length === 0) {
      alert('Please select at least one material item for the quotation.');
      return;
    }

    const created = createQuotation({
      customerName: custName,
      customerPhone: custPhone,
      customerAddress: custAddress,
      notes,
      items: quoteItems,
      taxRate,
      discount,
      validDays,
    });

    // Reset Form
    setCustName('');
    setCustPhone('');
    setCustAddress('');
    setNotes('');
    setQuoteItems([]);
    setDiscount(0);
    setMaterialSearch('');

    // Open Printable Modal
    setViewingQuotation(created);
  };

  // Search Filter for Saved Quotations (Only returns items when cleanSearch is non-empty)
  const cleanSearch = searchTerm.trim().toLowerCase();
  const digitsOnly = cleanSearch.replace(/\D/g, '');

  const filteredQuotations = useMemo(() => {
    if (!cleanSearch) return [];

    return quotations.filter(q => {
      const matchesName = q.customerName.toLowerCase().includes(cleanSearch);
      const matchesPhone = digitsOnly.length > 0 ? q.customerPhone.replace(/\D/g, '').includes(digitsOnly) : false;
      const matchesId = q.id.toLowerCase().includes(cleanSearch);
      return matchesName || matchesPhone || matchesId;
    });
  }, [quotations, cleanSearch, digitsOnly]);

  return (
    <div className="space-y-8">
      {/* 1. MAKE QUOTATION BUILDER FORM */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-bold font-mono uppercase">
                Make Customer Price Estimate
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
              <FileCheck2 className="w-6 h-6 text-amber-400" />
              Generate Customer Quotation
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Store customer name, phone number, address, and quoted materials so the owner can conduct targeted follow-up sales calls.
            </p>
          </div>

          {/* Quick Select Customer Pills */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-400" /> Quick Autofill:
            </span>
            {customers.slice(0, 3).map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => handleQuickSelectCustomer(c)}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition flex items-center gap-1"
              >
                <User className="w-3 h-3 text-amber-400" />
                <span>{c.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        <form onSubmit={handleSaveQuotation} className="space-y-6">
          {/* Customer Details Block */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Customer Full Name <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={custName}
                  onChange={e => setCustName(e.target.value)}
                  placeholder="e.g. Rajesh Kumar (Buildcon)"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Customer 10-Digit Mobile # <span className="text-amber-400">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="tel"
                  required
                  value={custPhone}
                  onChange={e => setCustPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono font-medium focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Delivery / Site Address</label>
              <div className="relative">
                <MapPin className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={custAddress}
                  onChange={e => setCustAddress(e.target.value)}
                  placeholder="e.g. Site 42, Sector 4, Kakdwip"
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-medium focus:outline-none focus:border-amber-500 transition"
                />
              </div>
            </div>
          </div>

          {/* KEYWORD MATERIAL SEARCH BAR */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-amber-400" />
                Search & Select Material Items for Quotation
              </h3>
              <span className="text-[11px] text-slate-400">
                Type keywords like <strong className="text-amber-400">cement, steel, sand, brick, pipe</strong>
              </span>
            </div>

            {/* Keyword Search Input */}
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
              <input
                type="text"
                value={materialSearch}
                onChange={e => setMaterialSearch(e.target.value)}
                placeholder="Type keyword to search materials (e.g. 'cement', 'steel', 'sand', 'brick', 'fixit')..."
                className="w-full pl-12 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-all shadow-inner"
              />
              {materialSearch && (
                <button
                  type="button"
                  onClick={() => setMaterialSearch('')}
                  className="absolute right-3.5 top-3 text-slate-400 hover:text-white p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Material Keyword Search Results Container */}
            {cleanMatSearch.length > 0 && (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3 shadow-xl space-y-2 animate-fadeIn max-h-60 overflow-y-auto">
                <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Search Results ({searchResults.length} material{searchResults.length !== 1 && 's'} found):
                </div>

                {searchResults.length === 0 ? (
                  <div className="text-xs text-slate-500 py-3 text-center">
                    No materials found matching &quot;{materialSearch}&quot;.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {searchResults.map(prod => {
                      const isAlreadyAdded = quoteItems.some(i => i.product.id === prod.id);

                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleSelectProduct(prod)}
                          className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                            isAlreadyAdded
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                              : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-200'
                          }`}
                        >
                          <div className="flex items-center space-x-2.5 overflow-hidden">
                            <span className="text-xl shrink-0">{prod.imageEmoji}</span>
                            <div className="truncate">
                              <h4 className="text-xs font-bold text-white truncate">{prod.name}</h4>
                              <p className="text-[10px] text-slate-400 font-mono">
                                Base: ₹{prod.price}/{prod.unit} • SKU: {prod.sku}
                              </p>
                            </div>
                          </div>

                          <button
                            type="button"
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold shrink-0 transition flex items-center gap-1 ${
                              isAlreadyAdded
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 group-hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-slate-700'
                            }`}
                          >
                            {isAlreadyAdded ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                            <span>{isAlreadyAdded ? 'Added' : 'Select'}</span>
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Selected Quotation Items Table */}
            {quoteItems.length === 0 ? (
              <div className="bg-slate-950/50 border border-dashed border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
                No materials added to this quotation yet. Type keywords in the material search bar above and click to select items.
              </div>
            ) : (
              <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs font-bold text-slate-300">
                  <span>Selected Quotation Materials ({quoteItems.length})</span>
                  <span className="text-[11px] text-amber-400 font-normal">Adjust quantity and quoted price for each item below</span>
                </div>

                <table className="w-full text-left text-xs text-slate-200">
                  <thead className="bg-slate-900/60 text-slate-400 font-bold uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="px-4 py-2.5">Material Description</th>
                      <th className="px-4 py-2.5 text-center">Quantity</th>
                      <th className="px-4 py-2.5 text-right">Quoted Rate (₹)</th>
                      <th className="px-4 py-2.5 text-right">Line Total (₹)</th>
                      <th className="px-4 py-2.5 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {quoteItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-900/50">
                        <td className="px-4 py-3 font-sans font-medium text-white">
                          <span className="mr-2">{item.product.imageEmoji}</span>
                          {item.product.name}
                          <span className="ml-1 text-[10px] text-slate-500 font-mono block sm:inline">
                            (Base: ₹{item.product.price}/{item.product.unit})
                          </span>
                        </td>

                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center space-x-1">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={e => handleUpdateItemQty(item.product.id, Number(e.target.value))}
                              className="w-20 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-center text-white font-bold font-mono focus:outline-none focus:border-amber-500"
                            />
                            <span className="text-[10px] text-slate-400 font-sans">{item.product.unit}</span>
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right">
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            value={item.quotedPrice}
                            onChange={e => handleUpdateItemPrice(item.product.id, Number(e.target.value))}
                            className="w-28 px-2 py-1 bg-slate-900 border border-slate-800 rounded-lg text-right text-amber-400 font-bold font-mono focus:outline-none focus:border-amber-500"
                          />
                        </td>

                        <td className="px-4 py-3 text-right font-bold text-emerald-400 text-sm">
                          ₹{(item.quotedPrice * item.quantity).toLocaleString('en-IN')}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(item.product.id)}
                            className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition"
                            title="Remove item"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Quotation Remarks & Financial Totals Footer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Follow-up Remarks / Target Notes (Visible to Owner)
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
                placeholder="e.g. Inquired for 3-storey building foundation. Wants bulk discount on steel."
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
              />
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2 font-mono text-xs text-right">
              <div className="flex justify-between text-slate-400">
                <span>Quotation Subtotal:</span>
                <span className="font-bold text-white">₹{subtotal.toLocaleString('en-IN')}</span>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="flex items-center gap-1">GST Tax (%):</span>
                <div className="flex items-center space-x-1">
                  <input
                    type="number"
                    min="0"
                    max="28"
                    value={taxRate}
                    onChange={e => setTaxRate(Number(e.target.value))}
                    className="w-14 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-right text-white font-mono"
                  />
                  <span>% (+₹{taxAmount.toLocaleString('en-IN')})</span>
                </div>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span>Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  value={discount}
                  onChange={e => setDiscount(Number(e.target.value))}
                  className="w-24 px-1.5 py-0.5 bg-slate-900 border border-slate-800 rounded text-right text-emerald-400 font-mono font-bold"
                />
              </div>

              <div className="flex justify-between pt-2 border-t border-slate-800 text-base font-black text-amber-400 font-sans">
                <span>Total Quoted Estimate:</span>
                <span>₹{totalAmount.toLocaleString('en-IN')}</span>
              </div>

              <button
                type="submit"
                disabled={quoteItems.length === 0}
                className="w-full mt-3 py-3 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-sm uppercase tracking-wider rounded-xl transition shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2"
              >
                <FileCheck2 className="w-5 h-5" />
                <span>Save & Generate Quotation</span>
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* 2. SAVED QUOTATIONS SEARCH & HISTORY SUB-SECTION */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Search className="w-5 h-5 text-amber-400" />
              Search Saved Quotations & Estimates
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Type customer name or phone number below to locate matching price estimates and print receipts.
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Type Customer Name (e.g. 'Rajesh') or 10-digit Phone Number to search..."
            className="w-full pl-12 pr-10 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3.5 top-3 text-slate-400 hover:text-white p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Quotations Search Results (Only displayed when search query is entered) */}
        {cleanSearch && filteredQuotations.length === 0 && (
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-8 text-center text-xs text-slate-400">
            No quotations found matching &quot;{searchTerm}&quot;.
          </div>
        )}

        {cleanSearch && filteredQuotations.length > 0 && (
          <div className="space-y-3">
            <div className="text-xs font-mono text-slate-400 font-bold uppercase tracking-wider px-1">
              Matching Quotations Found ({filteredQuotations.length}):
            </div>

            <div className="space-y-2.5">
              {filteredQuotations.map(quote => {
                const formattedDate = new Date(quote.createdAt).toLocaleDateString([], {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div
                    key={quote.id}
                    className="bg-slate-950 border border-slate-800 hover:border-amber-500/40 rounded-2xl p-4 sm:p-5 transition-all shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-start space-x-3.5">
                      <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center font-bold shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>

                      <div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          <span className="font-mono text-sm font-bold text-amber-400">{quote.id}</span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            {quote.status}
                          </span>
                        </div>

                        <div className="flex items-center space-x-3 text-xs text-slate-300 mt-1 flex-wrap">
                          <span className="flex items-center gap-1">
                            <User className="w-3.5 h-3.5 text-slate-500" />
                            <strong className="text-white">{quote.customerName}</strong>
                          </span>
                          <span>•</span>
                          <span className="font-mono flex items-center gap-1 text-slate-400">
                            <Phone className="w-3.5 h-3.5 text-slate-500" />
                            {quote.customerPhone}
                          </span>
                          <span>•</span>
                          <span className="text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5 text-slate-500" />
                            {formattedDate}
                          </span>
                        </div>

                        {quote.notes && (
                          <p className="text-[11px] text-slate-400 mt-1 italic">
                            &quot;{quote.notes}&quot;
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                      <div className="text-left sm:text-right font-mono">
                        <div className="text-base font-black text-amber-400">
                          ₹{quote.totalAmount.toLocaleString('en-IN')}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          {quote.items.length} material item{quote.items.length !== 1 && 's'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setViewingQuotation(quote)}
                        className="px-3.5 py-2 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 border border-amber-500/30 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Print / View</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Printable Quotation Modal */}
      <QuotationModal quotation={viewingQuotation} onClose={() => setViewingQuotation(null)} />
    </div>
  );
};
