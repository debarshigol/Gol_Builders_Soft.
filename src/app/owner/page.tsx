'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { InvoiceModal } from '@/components/shopkeeper/InvoiceModal';
import { Invoice } from '@/types';

export default function OwnerPage() {
  const { lastGeneratedInvoice, setLastGeneratedInvoice } = useApp();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const activeModalInvoice = viewingInvoice || lastGeneratedInvoice;

  const handleCloseModal = () => {
    setViewingInvoice(null);
    setLastGeneratedInvoice(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Persistent Header */}
      <Header />

      {/* Owner Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <OwnerDashboard onViewInvoice={inv => setViewingInvoice(inv)} />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-600 no-print">
        <p>Gol Builders Business Analytics & Inventory Management • Owner Control Center</p>
      </footer>

      {/* Printable Invoice View Modal */}
      <InvoiceModal invoice={activeModalInvoice} onClose={handleCloseModal} />
    </div>
  );
}
