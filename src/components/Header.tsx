'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { Building2, LayoutDashboard, Store, AlertTriangle, Sparkles, Clock } from 'lucide-react';

export const Header: React.FC = () => {
  const { products, cart } = useApp();
  const pathname = usePathname();
  const [timeString, setTimeString] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) +
          ' • ' +
          now.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const lowStockCount = products.filter(p => p.stock <= 10).length;
  const cartItemCount = cart.reduce((acc, i) => acc + i.quantity, 0);

  const isShopkeeperActive = pathname === '/shopkeeper' || pathname === '/';
  const isOwnerActive = pathname === '/owner';

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-2xl transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Brand Logo & Live Status */}
        <Link href="/shopkeeper" className="flex items-center space-x-3.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-300/40 text-slate-950 font-black text-xl tracking-wider group-hover:scale-105 transition-all duration-300">
            <Building2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent uppercase font-sans">
                Gol Builders
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-300 border border-amber-500/30 font-mono shadow-sm">
                <Sparkles className="w-3 h-3 mr-1 text-amber-400" /> POS ERP
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:flex items-center gap-1 mt-0.5">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>{timeString}</span>
            </p>
          </div>
        </Link>

        {/* Center: Apple-style Translucent Pill Switch */}
        <div className="bg-slate-900/90 p-1 rounded-2xl border border-slate-800 flex items-center shadow-inner backdrop-blur-md">
          <Link
            href="/shopkeeper"
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              isShopkeeperActive
                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <Store className="w-4 h-4" />
            <span>Shopkeeper POS</span>
            {cartItemCount > 0 && (
              <span className="ml-1.5 bg-slate-950 text-emerald-400 text-xs px-2 py-0.5 rounded-full font-extrabold font-mono border border-emerald-500/30">
                {cartItemCount}
              </span>
            )}
          </Link>

          <Link
            href="/owner"
            className={`flex items-center space-x-2 px-4 py-1.5 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
              isOwnerActive
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25 font-bold'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/70'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Owner Dashboard</span>
            {lowStockCount > 0 && (
              <span className="ml-1.5 bg-amber-500 text-slate-950 text-xs px-1.5 py-0.5 rounded-full font-black flex items-center font-mono shadow-sm">
                <AlertTriangle className="w-3 h-3 mr-0.5" />
                {lowStockCount}
              </span>
            )}
          </Link>
        </div>

        {/* Right Active Terminal Indicator */}
        <div className="hidden md:flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-2 bg-slate-900/90 px-3.5 py-1.5 rounded-xl border border-slate-800 font-mono shadow-sm">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-slate-400 text-[11px]">
              Active: <strong className="text-white font-bold">{isOwnerActive ? 'Owner Mode' : 'Shopkeeper Terminal'}</strong>
            </span>
          </div>
        </div>

      </div>
    </header>
  );
};
