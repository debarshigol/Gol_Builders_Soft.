'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { Invoice, Product } from '@/types';
import {
  TrendingUp,
  Receipt,
  Users,
  AlertTriangle,
  Plus,
  Search,
  Filter,
  Eye,
  ArrowUpRight,
  Package,
  Calendar,
  CheckCircle2,
  PieChart as PieIcon,
  ShoppingBag,
  DollarSign,
  Trash2,
  AlertCircle,
  X,
  FileText,
  Sparkles,
  Star,
  Printer,
  FileCheck2,
  FileSpreadsheet,
} from 'lucide-react';
import dynamic from 'next/dynamic';

const AddProductModal = dynamic(() => import('./AddProductModal').then(m => m.AddProductModal), { ssr: false });
const ManualGstModal = dynamic(() => import('./ManualGstModal').then(m => m.ManualGstModal), { ssr: false });
const QuotationModal = dynamic(() => import('../shopkeeper/QuotationModal').then(m => m.QuotationModal), { ssr: false });
const SalesCharts = dynamic(
  () => import('./SalesCharts').then(m => m.SalesCharts),
  {
    ssr: false,
    loading: () => (
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 animate-pulse">
        <div className="lg:col-span-8 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 h-72 flex flex-col justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/3 mb-2" />
          <div className="h-48 bg-slate-800/40 rounded-xl" />
        </div>
        <div className="lg:col-span-4 bg-slate-900/60 border border-slate-800 rounded-2xl p-5 h-72 flex flex-col justify-between">
          <div className="h-4 bg-slate-800 rounded w-1/2 mb-2" />
          <div className="h-48 bg-slate-800/40 rounded-xl" />
        </div>
      </div>
    ),
  }
);
import { Quotation } from '@/types';

export const OwnerDashboard: React.FC<{ onViewInvoice: (inv: Invoice) => void }> = ({ onViewInvoice }) => {
  const {
    products,
    customers,
    invoices,
    quotations,
    updateQuotationStatus,
    toggleQuotationTargeted,
    updateProductStock,
    updateProductPrice,
    deleteProduct,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'analytics' | 'sales' | 'inventory' | 'customers' | 'gst_invoices' | 'quotations'>('analytics');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManualGstModalOpen, setIsManualGstModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Modal for Viewing Full Quotation Details
  const [viewingQuotation, setViewingQuotation] = useState<Quotation | null>(null);

  // Quotation Leads Search & Filter State
  const [quoteSearch, setQuoteSearch] = useState('');
  const [quoteFilter, setQuoteFilter] = useState<'all' | 'targeted' | 'pending' | 'converted'>('all');

  // Sales History Filters
  const [salesSearch, setSalesSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('All');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | '7days'>('all');

  // Inventory Search & Filters
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategory, setInventoryCategory] = useState('All');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'all' | 'low_stock' | 'out_of_stock' | 'in_stock'>('all');

  // Customer Search
  const [customerSearch, setCustomerSearch] = useState('');

  // GST Invoices Search & Timeframe Filters
  const [gstSearch, setGstSearch] = useState('');
  const [gstTimeframe, setGstTimeframe] = useState<'all' | 'fy_2026' | 'fy_2025' | 'this_month' | 'today'>('all');
  const [gstRateFilter, setGstRateFilter] = useState<string>('All');

  // Key Analytics Computations (Memoized)
  const totalRevenue = useMemo(() => invoices.reduce((acc, inv) => acc + inv.totalAmount, 0), [invoices]);
  const totalInvoicesCount = invoices.length;
  const lowStockCount = useMemo(() => products.filter(p => p.stock <= 10).length, [products]);
  const totalCustomersCount = customers.length;
  const totalOutstandingDues = useMemo(() => customers.reduce((acc, c) => acc + (c.totalDue || 0), 0), [customers]);

  // Revenue chart data formatted from invoices
  const chartData = useMemo(() => {
    return invoices
      .slice()
      .reverse()
      .map(inv => ({
        date: new Date(inv.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
        amount: inv.totalAmount,
        invoiceId: inv.id,
        customer: inv.customerName,
      }));
  }, [invoices]);

  // Payment Method Breakdown for pie/bar chart
  const paymentBreakdown = useMemo(() => [
    { name: 'UPI', count: invoices.filter(i => i.paymentMethod === 'UPI').length, color: '#10b981' },
    { name: 'Cash', count: invoices.filter(i => i.paymentMethod === 'Cash').length, color: '#f59e0b' },
    { name: 'Card', count: invoices.filter(i => i.paymentMethod === 'Card').length, color: '#6366f1' },
    { name: 'Store Credit', count: invoices.filter(i => i.paymentMethod === 'Store Credit').length, color: '#ec4899' },
  ], [invoices]);

  // Filter Invoices
  const filteredInvoices = useMemo(() => {
    const sLower = salesSearch.toLowerCase().trim();
    return invoices.filter(inv => {
      const matchesSearch =
        !sLower ||
        inv.id.toLowerCase().includes(sLower) ||
        inv.customerName.toLowerCase().includes(sLower) ||
        inv.customerPhone.includes(sLower);

      const matchesPayment = paymentFilter === 'All' || inv.paymentMethod === paymentFilter;

      let matchesDate = true;
      if (dateFilter === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchesDate = inv.createdAt.startsWith(todayStr);
      } else if (dateFilter === '7days') {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        matchesDate = new Date(inv.createdAt) >= sevenDaysAgo;
      }

      return matchesSearch && matchesPayment && matchesDate;
    });
  }, [invoices, salesSearch, paymentFilter, dateFilter]);

  // Filter Inventory
  const categoriesList = useMemo(() => ['All', ...Array.from(new Set(products.map(p => p.category)))], [products]);
  const filteredProducts = useMemo(() => {
    const sLower = inventorySearch.toLowerCase().trim();
    return products.filter(p => {
      const matchesCat = inventoryCategory === 'All' || p.category === inventoryCategory;
      const matchesSearch =
        !sLower ||
        p.name.toLowerCase().includes(sLower) ||
        p.sku.toLowerCase().includes(sLower);

      let matchesStock = true;
      if (inventoryStockFilter === 'low_stock') {
        matchesStock = p.stock <= 10;
      } else if (inventoryStockFilter === 'out_of_stock') {
        matchesStock = p.stock === 0;
      } else if (inventoryStockFilter === 'in_stock') {
        matchesStock = p.stock > 10;
      }

      return matchesCat && matchesSearch && matchesStock;
    });
  }, [products, inventoryCategory, inventorySearch, inventoryStockFilter]);

  // Filter Customers
  const filteredCustomers = useMemo(() => {
    const sLower = customerSearch.toLowerCase().trim();
    if (!sLower) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(sLower) ||
      c.phone.includes(sLower) ||
      c.address.toLowerCase().includes(sLower)
    );
  }, [customers, customerSearch]);

  // Filter GST Invoices & Financial Year Computations
  const filteredGstInvoices = useMemo(() => {
    const sLower = gstSearch.toLowerCase().trim();
    return invoices.filter(inv => {
      const isGst = inv.isGstInvoice || inv.taxRate > 0;
      if (!isGst) return false;

      const matchesSearch =
        !sLower ||
        inv.id.toLowerCase().includes(sLower) ||
        inv.customerName.toLowerCase().includes(sLower) ||
        inv.customerPhone.includes(sLower) ||
        (inv.customerGstin && inv.customerGstin.toLowerCase().includes(sLower));

      const matchesRate = gstRateFilter === 'All' || inv.taxRate === Number(gstRateFilter);

      let matchesTimeframe = true;
      const invDate = new Date(inv.createdAt);
      if (gstTimeframe === 'fy_2026') {
        const fyStart = new Date('2026-04-01');
        const fyEnd = new Date('2027-03-31T23:59:59');
        matchesTimeframe = invDate >= fyStart && invDate <= fyEnd;
      } else if (gstTimeframe === 'fy_2025') {
        const fyStart = new Date('2025-04-01');
        const fyEnd = new Date('2026-03-31T23:59:59');
        matchesTimeframe = invDate >= fyStart && invDate <= fyEnd;
      } else if (gstTimeframe === 'this_month') {
        matchesTimeframe =
          invDate.getMonth() === new Date().getMonth() &&
          invDate.getFullYear() === new Date().getFullYear();
      } else if (gstTimeframe === 'today') {
        const todayStr = new Date().toISOString().split('T')[0];
        matchesTimeframe = inv.createdAt.startsWith(todayStr);
      }

      return matchesSearch && matchesRate && matchesTimeframe;
    });
  }, [invoices, gstSearch, gstRateFilter, gstTimeframe]);

  const totalGstTaxableValue = useMemo(() => filteredGstInvoices.reduce((sum, i) => sum + i.subtotal, 0), [filteredGstInvoices]);
  const totalGstTaxCollected = useMemo(() => filteredGstInvoices.reduce((sum, i) => sum + i.taxAmount, 0), [filteredGstInvoices]);

  return (
    <div className="space-y-6">
      
      {/* 1. TOP ANALYTICS OVERVIEW CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        
        {/* Total Revenue */}
        <div className="glass-panel rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Business Revenue</p>
              <h3 className="text-xl font-extrabold text-white font-mono tabular-nums mt-1">
                ₹{totalRevenue.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-emerald-400 font-medium">
            <ArrowUpRight className="w-3.5 h-3.5 mr-0.5 shrink-0" />
            <span>Total Sales Billed</span>
          </div>
        </div>

        {/* Total Outstanding Customer Dues */}
        <div className="glass-panel rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Customer Credit Dues</p>
              <h3 className="text-xl font-extrabold text-amber-400 font-mono tabular-nums mt-1">
                ₹{totalOutstandingDues.toLocaleString()}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-amber-400 font-medium">
            <span>Pending Balance to Collect</span>
          </div>
        </div>

        {/* Total Invoices */}
        <div className="glass-panel rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Total Bills Generated</p>
              <h3 className="text-xl font-extrabold text-white font-mono tabular-nums mt-1">
                {totalInvoicesCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-slate-400">
            <span>Avg: <strong className="text-slate-200 font-mono">₹{totalInvoicesCount ? Math.round(totalRevenue / totalInvoicesCount) : 0}</strong></span>
          </div>
        </div>

        {/* Registered Customers */}
        <div className="glass-panel rounded-2xl p-4 shadow-xl relative overflow-hidden group hover:border-cyan-500/40 transition-all duration-300">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Registered Customers</p>
              <h3 className="text-xl font-extrabold text-white font-mono tabular-nums mt-1">
                {totalCustomersCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center text-[11px] text-cyan-400 font-medium">
            <span>Active Builders Directory</span>
          </div>
        </div>

        {/* Low Stock Alert */}
        <div
          onClick={() => {
            setActiveTab('inventory');
            setInventoryStockFilter('low_stock');
          }}
          className="glass-panel rounded-2xl p-4 shadow-xl relative overflow-hidden cursor-pointer hover:border-amber-500/60 transition-all duration-300 group"
        >
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">Low Stock Items</p>
              <h3 className={`text-xl font-extrabold font-mono tabular-nums mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                {lowStockCount}
              </h3>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-[11px] text-amber-400 font-medium">
            <span>{lowStockCount > 0 ? 'Reorder needed' : 'Stock healthy'}</span>
            <span className="text-slate-500 group-hover:text-amber-300 font-bold underline text-[10px]">Filter →</span>
          </div>
        </div>

      </div>

      {/* 2. OWNER DASHBOARD NAVIGATION TABS */}
      <div className="glass-panel rounded-2xl p-1.5 flex items-center justify-between flex-wrap gap-2 shadow-xl">
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'analytics'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>Sales Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('sales')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'sales'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Invoice History ({filteredInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'inventory'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Inventory ({products.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('customers')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'customers'
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Customers ({customers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('gst_invoices')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 ${
              activeTab === 'gst_invoices'
                ? 'bg-amber-500 text-slate-950 font-extrabold shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>GST Invoices ({filteredGstInvoices.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('quotations')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center space-x-1.5 ${
              activeTab === 'quotations'
                ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                : 'text-amber-400 hover:text-amber-300 hover:bg-amber-500/10'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Quotation Leads & Calls ({quotations.length})</span>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsManualGstModalOpen(true)}
            className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-1.5"
          >
            <FileText className="w-4 h-4" />
            <span>+ Generate Manual GST Invoice</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>+ Add Item / Bulk Upload</span>
          </button>
        </div>
      </div>

      {/* 3. TAB CONTENT */}

      {/* TAB 1: ANALYTICS & CHARTS */}
      {activeTab === 'analytics' && (
        <SalesCharts chartData={chartData} paymentBreakdown={paymentBreakdown} />
      )}

      {/* TAB 2: FILTERABLE SALES HISTORY */}
      {activeTab === 'sales' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={salesSearch}
                onChange={e => setSalesSearch(e.target.value)}
                placeholder="Filter by invoice ID, customer name, or phone..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* Payment Filter */}
              <select
                value={paymentFilter}
                onChange={e => setPaymentFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-2 focus:outline-none"
              >
                <option value="All">All Payment Modes</option>
                <option value="UPI">UPI</option>
                <option value="Cash">Cash</option>
                <option value="Card">Card</option>
                <option value="Store Credit">Store Credit</option>
              </select>

              {/* Date Filter */}
              <select
                value={dateFilter}
                onChange={e => setDateFilter(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-2 focus:outline-none"
              >
                <option value="all">All Dates</option>
                <option value="today">Today Only</option>
                <option value="7days">Past 7 Days</option>
              </select>
            </div>
          </div>

          {/* Sales History Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Invoice ID</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Customer</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right font-mono">Total</th>
                  <th className="py-3 px-3 text-right font-mono">Paid</th>
                  <th className="py-3 px-3 text-right font-mono">Due</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No invoices found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map(inv => {
                    const paidVal = inv.amountPaid !== undefined ? inv.amountPaid : inv.totalAmount;
                    const dueVal = inv.dueAmount !== undefined ? inv.dueAmount : 0;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-white">{inv.id}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(inv.createdAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{inv.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">📱 {inv.customerPhone}</div>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-1">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 border border-slate-700 text-slate-300 uppercase">
                              {inv.paymentMethod}
                            </span>
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              dueVal > 0 ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            }`}>
                              {dueVal > 0 ? 'Partial' : 'Paid'}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-white">
                          ₹{inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-bold text-emerald-400">
                          ₹{paidVal.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          {dueVal > 0 ? (
                            <span className="font-bold text-amber-400">₹{dueVal.toLocaleString()}</span>
                          ) : (
                            <span className="text-slate-500">₹0</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-indigo-400 rounded-lg text-[11px] font-semibold border border-slate-700 transition flex items-center justify-center space-x-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Bill</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 3: INVENTORY MANAGEMENT */}
      {activeTab === 'inventory' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Inventory Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={inventorySearch}
                onChange={e => setInventorySearch(e.target.value)}
                placeholder="Search inventory by name or SKU..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <select
                value={inventoryCategory}
                onChange={e => setInventoryCategory(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-2 focus:outline-none"
              >
                {categoriesList.map(cat => (
                  <option key={cat} value={cat}>
                    Category: {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Products Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">SKU</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Cost Price</th>
                  <th className="py-3 px-3 text-right">Selling Price (Edit)</th>
                  <th className="py-3 px-3 text-center">Stock Qty (Edit)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredProducts.map(p => {
                  const margin = p.price > 0 ? Math.round(((p.price - p.costPrice) / p.price) * 100) : 0;
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3">
                        <div className="flex items-center space-x-2.5">
                          {p.imageUrl ? (
                            <img src={p.imageUrl} alt={p.name} className="w-7 h-7 object-contain p-0.5 rounded-lg border border-slate-700 shrink-0" />
                          ) : (
                            <span className="text-xl shrink-0">{p.imageEmoji || '📦'}</span>
                          )}
                          <div>
                            <div className="font-semibold text-white">{p.name}</div>
                            <div className="text-[10px] text-slate-400">Per {p.unit}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-400">{p.sku}</td>
                      <td className="py-3 px-3">
                        <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-800 text-slate-300 block font-semibold w-fit">
                          {p.category}
                        </span>
                        {p.subCategory && (
                          <span className="text-[10px] text-amber-400 font-mono mt-0.5 block">
                            {p.subCategory}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-400">₹{p.costPrice}</td>
                      
                      {/* Directly Editable Selling Price */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end space-x-1 font-mono">
                          <span className="text-slate-400 font-bold">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="any"
                            value={p.price}
                            onChange={e => {
                              const val = parseFloat(e.target.value);
                              updateProductPrice(p.id, isNaN(val) ? 0 : val);
                            }}
                            className="w-24 text-right bg-slate-950 font-extrabold text-emerald-400 text-xs py-1 px-2 border border-slate-700 rounded-lg focus:outline-none focus:border-emerald-500 shadow-inner"
                          />
                        </div>
                        <div className="text-[10px] text-slate-400 text-right mt-0.5 font-mono">
                          {margin}% margin
                        </div>
                      </td>

                      {/* Directly Editable Stock Level */}
                      <td className="py-3 px-3 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <input
                            type="number"
                            min="0"
                            value={p.stock}
                            onChange={e => {
                              const val = parseInt(e.target.value, 10);
                              updateProductStock(p.id, isNaN(val) ? 0 : val);
                            }}
                            className={`w-24 text-center font-mono font-black text-xs py-1 px-2 rounded-lg border focus:outline-none shadow-inner ${
                              p.stock === 0
                                ? 'bg-red-950/40 border-red-500/50 text-red-400'
                                : p.stock <= 10
                                ? 'bg-amber-950/40 border-amber-500/50 text-amber-400'
                                : 'bg-slate-950 border-slate-700 text-white focus:border-indigo-500'
                            }`}
                          />
                          <span className="text-[10px] text-slate-400 font-mono">{p.unit}s</span>
                        </div>
                        <div className="mt-1">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              p.stock === 0
                                ? 'bg-red-500/20 text-red-400'
                                : p.stock <= 10
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-emerald-500/20 text-emerald-400'
                            }`}
                          >
                            {p.stock === 0 ? 'Out of Stock' : p.stock <= 10 ? 'Low Stock' : 'In Stock'}
                          </span>
                        </div>
                      </td>

                      {/* Action: Delete Item Button */}
                      <td className="py-3 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => setProductToDelete(p)}
                          className="p-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg transition"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* TAB 4: CUSTOMER DIRECTORY */}
      {activeTab === 'customers' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              value={customerSearch}
              onChange={e => setCustomerSearch(e.target.value)}
              placeholder="Search customers by name, phone or address..."
              className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Customer Name</th>
                  <th className="py-3 px-3">Phone Number</th>
                  <th className="py-3 px-3">Address</th>
                  <th className="py-3 px-3 text-center">Total Visits</th>
                  <th className="py-3 px-3 text-right">Lifetime Spend</th>
                  <th className="py-3 px-3 text-right">Pending Credit Due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredCustomers.map(c => {
                  const actualVisits = invoices.filter(
                    i => !i.isSettlementReceipt && i.customerPhone.replace(/\D/g, '') === c.phone.replace(/\D/g, '')
                  ).length;
                  const totalVisits = Math.max(c.totalPurchases || 0, actualVisits);
                  const actualSpent = invoices
                    .filter(i => !i.isSettlementReceipt && i.customerPhone.replace(/\D/g, '') === c.phone.replace(/\D/g, ''))
                    .reduce((sum, i) => sum + i.totalAmount, 0);
                  const lifetimeSpent = Math.max(c.totalSpent || 0, actualSpent);

                  return (
                    <tr key={c.id} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-semibold text-white">{c.name}</td>
                      <td className="py-3 px-3 font-mono text-emerald-400">📱 {c.phone}</td>
                      <td className="py-3 px-3 text-slate-400">{c.address}</td>
                      <td className="py-3 px-3 text-center font-mono font-bold text-indigo-400">
                        {totalVisits}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        ₹{lifetimeSpent.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-3 text-right font-mono">
                        {c.totalDue && c.totalDue > 0 ? (
                          <span className="px-2.5 py-1 rounded-md text-xs font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            ₹{c.totalDue.toLocaleString('en-IN')} Due
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-semibold">₹0 Clear</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: GST INVOICES COMPLIANCE & HISTORY */}
      {activeTab === 'gst_invoices' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          
          {/* Header & KPI Summary for GST */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                <span>GST Tax Invoices & Compliance Center</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Issue manual GST bills, view financial year tax logs, and audit CGST + SGST collections.
              </p>
            </div>

            <button
              onClick={() => setIsManualGstModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center space-x-1.5 shrink-0"
            >
              <FileText className="w-4 h-4" />
              <span>+ Generate Manual GST Invoice</span>
            </button>
          </div>

          {/* Quick GST Tax Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Taxable Revenue Value</span>
              <div className="text-lg font-extrabold text-white mt-1">₹{totalGstTaxableValue.toLocaleString()}</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">Total GST Tax Collected (CGST + SGST)</span>
              <div className="text-lg font-extrabold text-emerald-400 mt-1">₹{totalGstTaxCollected.toLocaleString()}</div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3.5">
              <span className="text-[10px] text-slate-400 uppercase font-sans font-bold">GST Invoices Filtered</span>
              <div className="text-lg font-extrabold text-amber-400 mt-1">{filteredGstInvoices.length}</div>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                value={gstSearch}
                onChange={e => setGstSearch(e.target.value)}
                placeholder="Filter by GST invoice ID, customer name, phone or customer GSTIN..."
                className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
              />
            </div>

            <div className="flex items-center space-x-2">
              {/* Financial Year / Timeframe Filter */}
              <select
                value={gstTimeframe}
                onChange={e => setGstTimeframe(e.target.value as any)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-2 focus:outline-none font-medium"
              >
                <option value="all">Timeframe: All Dates</option>
                <option value="fy_2026">Financial Year 2026-27</option>
                <option value="fy_2025">Financial Year 2025-26</option>
                <option value="this_month">This Month</option>
                <option value="today">Today Only</option>
              </select>

              {/* GST Rate Filter */}
              <select
                value={gstRateFilter}
                onChange={e => setGstRateFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 text-slate-300 text-xs rounded-xl p-2 focus:outline-none font-medium"
              >
                <option value="All">All GST Rates</option>
                <option value="0">0% GST</option>
                <option value="5">5% GST</option>
                <option value="12">12% GST</option>
                <option value="18">18% GST</option>
                <option value="28">28% GST</option>
              </select>
            </div>
          </div>

          {/* GST Invoices Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="py-3 px-3">Invoice ID</th>
                  <th className="py-3 px-3">Date & Time</th>
                  <th className="py-3 px-3">Billed Customer & GSTIN</th>
                  <th className="py-3 px-3 text-right font-mono">Taxable Value</th>
                  <th className="py-3 px-3 text-right font-mono">GST Tax (CGST + SGST)</th>
                  <th className="py-3 px-3 text-right font-mono">Total Invoice Value</th>
                  <th className="py-3 px-3 text-center">Status</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filteredGstInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-500">
                      No GST Tax Invoices found matching filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredGstInvoices.map(inv => {
                    const cgst = inv.cgstAmount !== undefined ? inv.cgstAmount : inv.taxAmount / 2;
                    const sgst = inv.sgstAmount !== undefined ? inv.sgstAmount : inv.taxAmount / 2;
                    return (
                      <tr key={inv.id} className="hover:bg-slate-800/40 transition">
                        <td className="py-3 px-3 font-mono font-bold text-amber-400">{inv.id}</td>
                        <td className="py-3 px-3 text-slate-400">
                          {new Date(inv.createdAt).toLocaleString([], {
                            dateStyle: 'short',
                            timeStyle: 'short',
                          })}
                        </td>
                        <td className="py-3 px-3">
                          <div className="font-semibold text-white">{inv.customerName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">📱 {inv.customerPhone}</div>
                          {inv.customerGstin && (
                            <div className="text-[10px] text-indigo-400 font-mono font-bold">
                              GSTIN: {inv.customerGstin}
                            </div>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right font-mono text-slate-300">
                          ₹{inv.subtotal.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-right font-mono">
                          <div className="font-bold text-emerald-400">₹{inv.taxAmount.toLocaleString()}</div>
                          <div className="text-[9px] text-slate-400">
                            {inv.taxRate}% (CGST ₹{cgst} + SGST ₹{sgst})
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right font-mono font-extrabold text-white text-sm">
                          ₹{inv.totalAmount.toLocaleString()}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            inv.dueAmount && inv.dueAmount > 0
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          }`}>
                            {inv.dueAmount && inv.dueAmount > 0 ? `Partial (Due ₹${inv.dueAmount})` : 'Paid'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => onViewInvoice(inv)}
                            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-[11px] font-bold transition flex items-center justify-center space-x-1 mx-auto"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View GST Bill</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

        </div>
      )}

      {/* 8. QUOTATION LEADS & TARGETED CALL TRACKER */}
      {activeTab === 'quotations' && (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl space-y-6">
          {/* Header & KPI Summary */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center space-x-2">
                <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-mono font-bold uppercase">
                  Owner Quotation Control Center
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
                <FileCheck2 className="w-6 h-6 text-amber-400" />
                Shopkeeper Quotations & Targeted Call Leads
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Filter customer price estimates created by shopkeepers, flag priority targeted leads, view full itemized details, and track sales follow-up calls.
              </p>
            </div>

            {/* KPI Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-slate-500 block uppercase">Total Quotes</span>
                <span className="text-sm font-bold text-white">{quotations.length}</span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-amber-500/80 block uppercase">Targeted Leads</span>
                <span className="text-sm font-bold text-amber-400">
                  ⭐ {quotations.filter(q => q.isTargeted).length}
                </span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-indigo-400 block uppercase">Pending Calls</span>
                <span className="text-sm font-bold text-indigo-300">
                  {quotations.filter(q => q.status === 'Pending Follow-up').length}
                </span>
              </div>
              <div className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[10px] text-emerald-400 block uppercase">Converted Sales</span>
                <span className="text-sm font-bold text-emerald-400">
                  ₹{quotations.filter(q => q.status === 'Converted to Sale').reduce((acc, q) => acc + q.totalAmount, 0).toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls Block */}
          <div className="space-y-3 bg-slate-950/60 p-4 rounded-2xl border border-slate-800">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-amber-400" />
                <span>Search Owner Quotation Directory</span>
                <span className="text-[10px] text-slate-500 font-normal">(Search by Customer Name or 10-Digit Mobile #)</span>
              </label>

              {/* Filter Toggle Buttons */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => setQuoteFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    quoteFilter === 'all'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All ({quotations.length})
                </button>

                <button
                  type="button"
                  onClick={() => setQuoteFilter('targeted')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1 ${
                    quoteFilter === 'targeted'
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-900 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10'
                  }`}
                >
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>Targeted Leads ({quotations.filter(q => q.isTargeted).length})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuoteFilter('pending')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    quoteFilter === 'pending'
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Pending ({quotations.filter(q => q.status === 'Pending Follow-up').length})
                </button>

                <button
                  type="button"
                  onClick={() => setQuoteFilter('converted')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition ${
                    quoteFilter === 'converted'
                      ? 'bg-emerald-600 text-white shadow-md'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Converted ({quotations.filter(q => q.status === 'Converted to Sale').length})
                </button>
              </div>
            </div>

            {/* Prominent Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
              <input
                type="text"
                value={quoteSearch}
                onChange={e => setQuoteSearch(e.target.value)}
                placeholder="Type Customer Name (e.g. 'Rajesh', 'Vikram') or 10-Digit Mobile # (e.g. '9876543210') to search..."
                className="w-full pl-10 pr-9 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-white text-xs font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 transition shadow-inner"
              />
              {quoteSearch && (
                <button
                  type="button"
                  onClick={() => setQuoteSearch('')}
                  className="absolute right-3 top-2.5 text-slate-400 hover:text-white p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Quotation Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900 text-slate-400 text-[10px] uppercase font-bold border-b border-slate-800 font-mono">
                <tr>
                  <th className="px-4 py-3">Quotation ID</th>
                  <th className="px-4 py-3">Customer Details</th>
                  <th className="px-4 py-3">Target Flag</th>
                  <th className="px-4 py-3 text-right">Quoted Total</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {quotations.filter(q => {
                  const cleanS = quoteSearch.trim().toLowerCase();
                  const digitsS = cleanS.replace(/\D/g, '');
                  const matchesS =
                    !cleanS ||
                    q.customerName.toLowerCase().includes(cleanS) ||
                    q.id.toLowerCase().includes(cleanS) ||
                    (digitsS.length > 0 && q.customerPhone.replace(/\D/g, '').includes(digitsS));

                  let matchesF = true;
                  if (quoteFilter === 'targeted') matchesF = !!q.isTargeted;
                  else if (quoteFilter === 'pending') matchesF = q.status === 'Pending Follow-up';
                  else if (quoteFilter === 'converted') matchesF = q.status === 'Converted to Sale';

                  return matchesS && matchesF;
                }).length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-500 font-sans">
                      No quotations found matching criteria.
                    </td>
                  </tr>
                ) : (
                  quotations
                    .filter(q => {
                      const cleanS = quoteSearch.trim().toLowerCase();
                      const digitsS = cleanS.replace(/\D/g, '');
                      const matchesS =
                        !cleanS ||
                        q.customerName.toLowerCase().includes(cleanS) ||
                        q.id.toLowerCase().includes(cleanS) ||
                        (digitsS.length > 0 && q.customerPhone.replace(/\D/g, '').includes(digitsS));

                      let matchesF = true;
                      if (quoteFilter === 'targeted') matchesF = !!q.isTargeted;
                      else if (quoteFilter === 'pending') matchesF = q.status === 'Pending Follow-up';
                      else if (quoteFilter === 'converted') matchesF = q.status === 'Converted to Sale';

                      return matchesS && matchesF;
                    })
                    .map(quote => {
                      const formattedDate = new Date(quote.createdAt).toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric',
                      });

                      return (
                        <tr key={quote.id} className={`hover:bg-slate-900/50 ${quote.isTargeted ? 'bg-amber-500/5' : ''}`}>
                          <td className="px-4 py-3 font-bold text-amber-400">
                            <div className="flex items-center space-x-1.5">
                              <span>{quote.id}</span>
                              {quote.isTargeted && (
                                <Star className="w-3.5 h-3.5 text-amber-400 fill-current shrink-0" />
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 font-normal">{formattedDate}</div>
                          </td>

                          <td className="px-4 py-3 font-sans">
                            <strong className="text-white block">{quote.customerName}</strong>
                            <a
                              href={`tel:${quote.customerPhone}`}
                              className="text-indigo-400 hover:underline font-mono text-xs inline-flex items-center gap-1 mt-0.5"
                            >
                              📞 {quote.customerPhone}
                            </a>
                          </td>

                          <td className="px-4 py-3 font-sans">
                            <button
                              type="button"
                              onClick={() => toggleQuotationTargeted(quote.id, !quote.isTargeted)}
                              className={`px-2.5 py-1 rounded-xl text-xs font-bold transition flex items-center space-x-1 border ${
                                quote.isTargeted
                                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-sm'
                                  : 'bg-slate-900 text-slate-400 hover:text-white border-slate-800'
                              }`}
                            >
                              <Star className={`w-3.5 h-3.5 ${quote.isTargeted ? 'fill-current' : ''}`} />
                              <span>{quote.isTargeted ? 'Targeted Lead' : 'Mark Targeted'}</span>
                            </button>
                          </td>

                          <td className="px-4 py-3 text-right font-bold text-white text-sm">
                            ₹{quote.totalAmount.toLocaleString('en-IN')}
                            <div className="text-[10px] text-slate-400 font-normal font-sans">
                              {quote.items.length} item(s)
                            </div>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <select
                              value={quote.status}
                              onChange={e =>
                                updateQuotationStatus(
                                  quote.id,
                                  e.target.value as any,
                                  prompt('Enter call follow-up notes (optional):') || undefined
                                )
                              }
                              className={`px-2 py-1 rounded-lg text-xs font-bold font-sans border focus:outline-none ${
                                quote.status === 'Converted to Sale'
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                  : quote.status === 'Followed Up'
                                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40'
                                  : quote.status === 'Cancelled'
                                  ? 'bg-red-500/20 text-red-300 border-red-500/40'
                                  : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              }`}
                            >
                              <option value="Pending Follow-up" className="bg-slate-900 text-white">Pending Follow-up</option>
                              <option value="Followed Up" className="bg-slate-900 text-white">Followed Up</option>
                              <option value="Converted to Sale" className="bg-slate-900 text-white">Converted to Sale</option>
                              <option value="Cancelled" className="bg-slate-900 text-white">Cancelled</option>
                            </select>
                          </td>

                          <td className="px-4 py-3 text-center">
                            <button
                              type="button"
                              onClick={() => setViewingQuotation(quote)}
                              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md transition inline-flex items-center gap-1 font-sans"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>View Details</span>
                            </button>
                          </td>
                        </tr>
                      );
                    })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal for adding product */}
      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />

      {/* Manual GST Invoice Generator Modal */}
      <ManualGstModal isOpen={isManualGstModalOpen} onClose={() => setIsManualGstModalOpen(false)} />

      {/* Delete Product Confirmation Warning Modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative">
            <button
              onClick={() => setProductToDelete(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center space-x-3 text-red-400">
              <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete Item Warning</h3>
                <p className="text-xs text-slate-400">Are you sure you want to delete this product?</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs space-y-1 text-slate-300">
              <div className="font-semibold text-white flex items-center gap-2">
                <span>{productToDelete.imageEmoji}</span>
                <span>{productToDelete.name}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-mono">SKU: {productToDelete.sku} | Category: {productToDelete.category}</div>
              <div className="text-[11px] text-slate-400 font-mono">Current Stock: {productToDelete.stock} {productToDelete.unit}s | Selling Price: ₹{productToDelete.price}</div>
            </div>

            <p className="text-xs text-slate-300">
              This action cannot be undone. The item will be permanently removed from inventory and POS billing options.
            </p>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteProduct(productToDelete.id);
                  setProductToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-red-600/30 transition flex items-center space-x-1.5"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete Item</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Printable Quotation Modal for Owner */}
      <QuotationModal quotation={viewingQuotation} onClose={() => setViewingQuotation(null)} />

    </div>
  );
};
