'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Invoice } from '@/types';
import {
  Search,
  User,
  Phone,
  Receipt,
  Calendar,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  X,
  FileText,
  ExternalLink
} from 'lucide-react';

interface CustomerHistorySectionProps {
  onViewInvoice: (invoice: Invoice) => void;
}

export const CustomerHistorySection: React.FC<CustomerHistorySectionProps> = ({ onViewInvoice }) => {
  const { invoices, customers, activeCustomer } = useApp();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'due' | 'today'>('all');

  // Clean search input
  const cleanSearch = searchTerm.trim().toLowerCase();

  // Effective customer filter string (either typed query or active customer phone/name)
  const effectiveSearch = cleanSearch || (activeCustomer ? activeCustomer.phone.toLowerCase() : '');

  // Is a search or customer selection currently active?
  const isSearchActive = effectiveSearch !== '' || filterStatus !== 'all';

  // Filter invoices strictly for the searched customer name, phone number, or invoice ID
  const filteredInvoices = useMemo(() => {
    if (!isSearchActive) return [];

    return invoices.filter(inv => {
      let matchesTerm = false;

      if (effectiveSearch) {
        const query = effectiveSearch.trim().toLowerCase();
        const digitsOnlyQuery = query.replace(/\D/g, '');

        // 1. Match Customer Name (case-insensitive substring match)
        const matchesName = inv.customerName.toLowerCase().includes(query);

        // 2. Match Invoice Number (e.g. INV-2026-1001 or 1001)
        const matchesId = inv.id.toLowerCase().includes(query);

        // 3. Match Phone Number (ONLY if query contains at least 1 digit)
        const matchesPhone =
          digitsOnlyQuery.length > 0
            ? inv.customerPhone.replace(/\D/g, '').includes(digitsOnlyQuery)
            : false;

        matchesTerm = matchesName || matchesPhone || matchesId;
      }

      if (!matchesTerm) return false;

      // Status Filter
      if (filterStatus === 'due') {
        return inv.dueAmount > 0;
      } else if (filterStatus === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        return inv.createdAt.startsWith(todayStr);
      }

      return true;
    });
  }, [invoices, effectiveSearch, filterStatus, isSearchActive]);

  // Aggregate metrics for currently filtered search results
  const summaryMetrics = useMemo(() => {
    const totalSpent = filteredInvoices.reduce((acc, inv) => acc + inv.totalAmount, 0);
    const totalPaid = filteredInvoices.reduce((acc, inv) => acc + inv.amountPaid, 0);
    const totalDue = filteredInvoices.reduce((acc, inv) => acc + inv.dueAmount, 0);

    return {
      count: filteredInvoices.length,
      totalSpent,
      totalPaid,
      totalDue,
    };
  }, [filteredInvoices]);

  const clearSearch = () => {
    setSearchTerm('');
    setFilterStatus('all');
  };

  return (
    <div id="customer-history-section" className="glass-panel rounded-3xl p-5 sm:p-7 shadow-2xl relative overflow-hidden text-slate-100">
      {/* Background Accent Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

      {/* Section Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold font-mono uppercase">
              Customer & Invoice Search
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-400" />
            Search Invoices by Customer Name or Invoice #
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Type customer full name (e.g. &quot;Rajesh&quot;), mobile number, or Invoice ID (e.g. &quot;INV-2026-1001&quot;) to view matching bills.
          </p>
        </div>

        {/* Quick Demo Customer Search Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-400" /> Quick Select:
          </span>
          {customers.slice(0, 3).map(c => (
            <button
              key={c.id}
              type="button"
              onClick={() => setSearchTerm(c.name.split(' ')[0])}
              className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                searchTerm.toLowerCase() === c.name.split(' ')[0].toLowerCase()
                  ? 'bg-indigo-600 text-white border-indigo-500 font-bold'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'
              }`}
            >
              <User className="w-3 h-3 text-indigo-400" />
              <span>{c.name.split(' ')[0]}</span>
            </button>
          ))}
          {invoices.length > 0 && (
            <button
              type="button"
              onClick={() => setSearchTerm(invoices[0].id)}
              className="text-xs px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition font-mono"
            >
              #{invoices[0].id}
            </button>
          )}
        </div>
      </div>

      {/* Active Customer Context Notice (if active customer is set from Step 1) */}
      {activeCustomer && !searchTerm && (
        <div className="mb-4 px-4 py-2.5 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-between text-xs text-indigo-300">
          <div className="flex items-center space-x-2">
            <User className="w-4 h-4 text-indigo-400" />
            <span>
              Currently displaying invoices for active customer: <strong className="text-white font-bold">{activeCustomer.name}</strong> ({activeCustomer.phone})
            </span>
          </div>
          <button
            onClick={() => setSearchTerm('')}
            className="text-[11px] underline hover:text-white"
          >
            Reset
          </button>
        </div>
      )}

      {/* Main Search Input */}
      <div className="space-y-4 mb-6">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-slate-400 pointer-events-none">
            <Search className="w-5 h-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Type Customer Name (e.g. Rajesh), Phone Number, or Invoice # (e.g. INV-2026-1001)..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-sm sm:text-base font-mono placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-3.5 text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition"
              title="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Status Filter Buttons for the Searched Customer */}
        {isSearchActive && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={() => setFilterStatus('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  filterStatus === 'all'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>All Matching Invoices</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('due')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  filterStatus === 'due'
                    ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Pending Credit Dues</span>
              </button>

              <button
                type="button"
                onClick={() => setFilterStatus('today')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center space-x-1.5 ${
                  filterStatus === 'today'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                <Clock className="w-3.5 h-3.5" />
                <span>Today&apos;s Purchases</span>
              </button>
            </div>

            <div className="text-xs font-mono">
              Invoices Found: <strong className="text-indigo-400 text-sm">{filteredInvoices.length}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Summary Metrics for Searched Customer / Invoice */}
      {isSearchActive && filteredInvoices.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Invoices Found</span>
            <div className="text-xl sm:text-2xl font-black text-indigo-400 mt-0.5 font-mono">{summaryMetrics.count}</div>
            <span className="text-[10px] text-slate-500">Matching search records</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Total Spent</span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 font-mono">₹{summaryMetrics.totalSpent.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-slate-500">Gross purchase total</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Paid Amount</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 font-mono">₹{summaryMetrics.totalPaid.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-slate-500">Total collected</span>
          </div>

          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3 sm:p-4">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Balance Due</span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 font-mono">₹{summaryMetrics.totalDue.toLocaleString('en-IN')}</div>
            <span className="text-[10px] text-slate-500">Unpaid credit</span>
          </div>
        </div>
      )}

      {/* No Results for Search Term */}
      {isSearchActive && filteredInvoices.length === 0 && (
        <div className="bg-slate-950/50 border border-slate-800/80 rounded-2xl p-10 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-800 text-slate-500 mx-auto flex items-center justify-center mb-3">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-white mb-1">No Invoices Found for &quot;{searchTerm}&quot;</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No invoices match the customer name or invoice number &quot;{searchTerm}&quot;. Please check the spelling or invoice number.
          </p>
          <button
            onClick={clearSearch}
            className="mt-4 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold rounded-xl transition"
          >
            Clear Search
          </button>
        </div>
      )}

      {/* Matching Invoices List */}
      {isSearchActive && filteredInvoices.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-400 font-bold uppercase tracking-wider px-1">
            <span>Matching Invoices ({filteredInvoices.length})</span>
            <span className="text-[11px] text-indigo-400 font-normal">Click any invoice to view full bill details</span>
          </div>

          <div className="space-y-2.5">
            {filteredInvoices.map(inv => {
              const dateFormatted = new Date(inv.createdAt).toLocaleString([], {
                dateStyle: 'medium',
                timeStyle: 'short',
              });

              return (
                <div
                  key={inv.id}
                  onClick={() => onViewInvoice(inv)}
                  className="group bg-slate-950 hover:bg-slate-900/90 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 sm:p-5 transition-all shadow-md cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Customer & Invoice Overview */}
                  <div className="flex items-center space-x-3.5">
                    <div className="w-11 h-11 rounded-xl bg-slate-900 group-hover:bg-indigo-500/10 border border-slate-800 group-hover:border-indigo-500/30 flex items-center justify-center text-indigo-400 font-black shrink-0 transition">
                      <Receipt className="w-5 h-5 text-indigo-400 group-hover:scale-110 transition-transform" />
                    </div>

                    <div>
                      <div className="flex items-center space-x-2 flex-wrap">
                        <span className="font-mono text-base font-black text-amber-400 group-hover:text-amber-300 transition">{inv.id}</span>
                        {inv.isGstInvoice && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                            GST TAX INVOICE
                          </span>
                        )}
                        {inv.isSettlementReceipt && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 font-mono">
                            CREDIT SETTLEMENT
                          </span>
                        )}
                        {inv.paymentStatus === 'Paid' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" /> Fully Paid
                          </span>
                        )}
                        {inv.paymentStatus === 'Partial' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Partial (Due: ₹{inv.dueAmount})
                          </span>
                        )}
                        {inv.paymentStatus === 'Unpaid' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/30 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> Unpaid Credit
                          </span>
                        )}
                      </div>

                      <div className="flex items-center space-x-3 text-xs text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <strong className="text-slate-200">{inv.customerName}</strong>
                        </span>
                        <span>•</span>
                        <span className="font-mono flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5 text-slate-500" />
                          {inv.customerPhone}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {dateFormatted}
                        </span>
                        <span>•</span>
                        <span className="text-slate-400">
                          {inv.items.length} item{inv.items.length !== 1 && 's'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Amount & Full View Action */}
                  <div className="flex items-center justify-between sm:justify-end space-x-4 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-900">
                    <div className="text-left sm:text-right">
                      <div className="text-lg font-black text-white font-mono group-hover:text-indigo-300 transition">
                        ₹{inv.totalAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Paid: <strong className="text-emerald-400 font-mono">₹{inv.amountPaid.toLocaleString('en-IN')}</strong>
                        {inv.dueAmount > 0 && (
                          <span className="ml-1 text-amber-400 font-bold font-mono">
                            | Due: ₹{inv.dueAmount.toLocaleString('en-IN')}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="px-3.5 py-2 bg-indigo-600 group-hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition flex items-center space-x-1.5 shadow-md group-hover:scale-105 shrink-0">
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Full View</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
