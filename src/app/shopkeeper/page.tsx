'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { ItemBillingSection } from '@/components/shopkeeper/ItemBillingSection';
import { Invoice } from '@/types';

import { ShopkeeperLogin } from '@/components/shopkeeper/ShopkeeperLogin';
import { Loader2 } from 'lucide-react';

const CustomerHistorySection = dynamic(
  () => import('@/components/shopkeeper/CustomerHistorySection').then(m => m.CustomerHistorySection)
);

const QuotationSection = dynamic(
  () => import('@/components/shopkeeper/QuotationSection').then(m => m.QuotationSection)
);

const InvoiceModal = dynamic(
  () => import('@/components/shopkeeper/InvoiceModal').then(m => m.InvoiceModal)
);

export default function ShopkeeperPage() {
  const { isShopkeeperAuthenticated, isShopkeeperAuthLoading, lastGeneratedInvoice, setLastGeneratedInvoice } = useApp();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [activeTab, setActiveTab] = useState<'billing' | 'history' | 'quotation'>('billing');

  // Shared Search & Cart Modal State for Header & ItemBillingSection
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [isCartModalOpen, setIsCartModalOpen] = useState<boolean>(false);

  const activeModalInvoice = viewingInvoice || lastGeneratedInvoice;

  const handleCloseModal = () => {
    setViewingInvoice(null);
    setLastGeneratedInvoice(null);
  };

  if (isShopkeeperAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Validating Shopkeeper Session...</p>
      </div>
    );
  }

  if (!isShopkeeperAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-emerald-500 selection:text-slate-950">
        <ShopkeeperLogin />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      {/* Persistent Header with 50-60% Search bar & Cart button in header space */}
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onOpenCart={() => setIsCartModalOpen(true)}
      />

      {/* Shopkeeper POS Workspace */}
      <main className="flex-1 max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {activeTab === 'billing' && (
          <ItemBillingSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isCartModalOpen={isCartModalOpen}
            setIsCartModalOpen={setIsCartModalOpen}
            onInvoiceGenerated={() => {}}
          />
        )}

        {activeTab === 'history' && (
          <CustomerHistorySection onViewInvoice={inv => setViewingInvoice(inv)} />
        )}

        {activeTab === 'quotation' && (
          <QuotationSection
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isCartModalOpen={isCartModalOpen}
            setIsCartModalOpen={setIsCartModalOpen}
          />
        )}
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
