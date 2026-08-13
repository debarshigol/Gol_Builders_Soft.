'use client';

import React from 'react';
import Link from 'next/link';
import { Building2, Store, LayoutDashboard, ArrowRight, ShieldCheck, ShoppingBag, Sparkles, CheckCircle } from 'lucide-react';
import { Header } from '@/components/Header';

export default function RootHomePage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans relative overflow-hidden">
      
      {/* Top Ambient Glow Spotlights */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-amber-500/10 via-indigo-500/10 to-emerald-500/10 rounded-full blur-[120px] pointer-events-none -z-0" />

      <Header />

      <main className="flex-1 flex flex-col items-center justify-center max-w-5xl mx-auto px-4 py-16 w-full text-center relative z-10">
        
        {/* Enterprise Badge */}
        <div className="inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold mb-6 shadow-sm animate-fadeIn">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <span>Gol Builders Enterprise ERP & POS System</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight uppercase max-w-4xl leading-tight">
          Building Materials <br className="hidden sm:inline" />
          <span className="bg-gradient-to-r from-amber-400 via-amber-200 to-yellow-500 bg-clip-text text-transparent">
            Smart Management System
          </span>
        </h1>
        
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mt-4 mb-12 leading-relaxed">
          Select your portal terminal below to enter either the <strong>Shopkeeper Billing POS Terminal</strong> or the <strong>Owner Business Analytics & Inventory Dashboard</strong>.
        </p>

        {/* Dual Portal Gateway Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl">
          
          {/* 1. Shopkeeper Route Card */}
          <Link
            href="/shopkeeper"
            className="group relative glass-panel hover:border-emerald-500/50 rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-emerald-500/15 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/25 transition-all"></div>
            
            <div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <Store className="w-7 h-7" />
              </div>

              <span className="bg-emerald-500/15 text-emerald-300 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-emerald-500/30 font-mono tracking-wider">
                Terminal Route: /shopkeeper
              </span>

              <h2 className="text-2xl font-bold text-white mt-4 mb-2 group-hover:text-emerald-400 transition-colors">
                Shopkeeper POS Terminal
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed">
                Add products to cart, lookup customer phone numbers, handle instant registration, track due balances, and issue print receipts.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-emerald-400">
              <span>Open Billing Terminal</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

          {/* 2. Owner Route Card */}
          <Link
            href="/owner"
            className="group relative glass-panel hover:border-indigo-500/50 rounded-3xl p-6 sm:p-8 text-left transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/15 flex flex-col justify-between overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-36 h-36 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/25 transition-all"></div>

            <div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                <LayoutDashboard className="w-7 h-7" />
              </div>

              <span className="bg-indigo-500/15 text-indigo-300 text-[10px] font-extrabold uppercase px-2.5 py-1 rounded-lg border border-indigo-500/30 font-mono tracking-wider">
                Dashboard Route: /owner
              </span>

              <h2 className="text-2xl font-bold text-white mt-4 mb-2 group-hover:text-indigo-400 transition-colors">
                Owner Control Center
              </h2>

              <p className="text-xs text-slate-400 leading-relaxed">
                Monitor sales telemetry, inspect GST reports, track customer credit dues, filter low stock inventory, and manage bulk CSV uploads.
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-extrabold text-indigo-400">
              <span>Open Owner Dashboard</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
            </div>
          </Link>

        </div>

      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <p>Gol Builders Business ERP • POS System Architecture</p>
      </footer>
    </div>
  );
}
