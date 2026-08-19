'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useApp } from '@/context/AppContext';
import { Header } from '@/components/Header';
import { OwnerDashboard } from '@/components/owner/OwnerDashboard';
import { OwnerLogin } from '@/components/owner/OwnerLogin';
import { Invoice } from '@/types';
import { Loader2 } from 'lucide-react';

const InvoiceModal = dynamic(
  () => import('@/components/shopkeeper/InvoiceModal').then(m => m.InvoiceModal),
  { ssr: false }
);

export default function OwnerPage() {
  const { isOwnerAuthenticated, isAuthLoading, lastGeneratedInvoice, setLastGeneratedInvoice } = useApp();
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  const activeModalInvoice = viewingInvoice || lastGeneratedInvoice;

  const handleCloseModal = () => {
    setViewingInvoice(null);
    setLastGeneratedInvoice(null);
  };

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans">
        <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-3" />
        <p className="text-sm font-medium text-slate-400">Validating Owner Session...</p>
      </div>
    );
  }

  if (!isOwnerAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4 font-sans selection:bg-indigo-500 selection:text-white">
        <OwnerLogin />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Persistent Header (Only shown when logged in) */}
      <Header />

      {/* Owner Dashboard Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col justify-center">
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
