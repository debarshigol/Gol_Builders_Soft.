'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { CustomerSearchSection } from '@/components/shopkeeper/CustomerSearchSection';
import { ItemBillingSection } from '@/components/shopkeeper/ItemBillingSection';
import { CustomerHistorySection } from '@/components/shopkeeper/CustomerHistorySection';
import { QuotationSection } from '@/components/shopkeeper/QuotationSection';
import { InvoiceModal } from '@/components/shopkeeper/InvoiceModal';
import { Invoice } from '@/types';
import { ShoppingCart, History, FileCheck2, Store } from 'lucide-react';

export default function ShopkeeperPage() {
  const { lastGeneratedInvoice, setLastGeneratedInvoice } = useApp();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'quotation'>('billing');

  const activeModalInvoice = viewingInvoice || lastGeneratedInvoice;

  const handleCloseModal = () => {
    setViewingInvoice(null);
    setLastGeneratedInvoice(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Top Persistent Header */}
      <Header />

      {/* Workspace Navigation Bar */}
      <div className="bg-slate-900/60 border-b border-slate-800/80 sticky top-16 z-30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-12">
          <div className="flex items-center space-x-1 sm:space-x-2">
            <button
              onClick={() => setActiveTab('billing')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'billing'
                  ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <ShoppingCart className="w-4 h-4" />
              <span>POS Billing & Checkout</span>
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <History className="w-4 h-4" />
              <span>Customer Purchase History & Search</span>
            </button>

            <button
              onClick={() => setActiveTab('quotation')}
              className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                activeTab === 'quotation'
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
              }`}
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Make Quotation</span>
            </button>
          </div>

          <div className="hidden md:flex items-center space-x-2 text-xs text-slate-400 font-mono">
            <Store className="w-3.5 h-3.5 text-amber-400" />
            <span>Terminal Mode: <strong className="text-white uppercase">{activeTab}</strong></span>
          </div>
        </div>
      </div>

      {/* Shopkeeper POS Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'billing' && (
          <ItemBillingSection onInvoiceGenerated={() => {}} />
        )}

        {activeTab === 'history' && (
          <CustomerHistorySection onViewInvoice={inv => setViewingInvoice(inv)} />
        )}

        {activeTab === 'quotation' && <QuotationSection />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600 no-print">
        <p>Gol Builders POS Billing System • Shopkeeper Terminal</p>
      </footer>

      {/* Printable Invoice Modal */}
      <InvoiceModal invoice={activeModalInvoice} onClose={handleCloseModal} />
    </div>
  );
}
