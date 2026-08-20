'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import {
  Building2,
  Sparkles,
  Clock,
  Store,
  LayoutDashboard,
  ShoppingCart,
  History,
  FileCheck2,
  ChevronDown,
  ChevronRight,
  Search,
  ShoppingBag,
  X,
  Sun,
  Moon,
  Printer,
  LogOut,
} from 'lucide-react';

interface HeaderProps {
  activeTab?: 'billing' | 'history' | 'quotation';
  onTabChange?: (tab: 'billing' | 'history' | 'quotation') => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  onOpenCart?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  searchTerm,
  onSearchChange,
  onOpenCart,
}) => {
  const { cart, theme, toggleTheme, currentOwner, logoutOwner, currentShopkeeper, logoutShopkeeper } = useApp();
  const pathname = usePathname();
  const [timeString, setTimeString] = useState<string>('');
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const leaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  const handleMouseEnter = () => {
    if (leaveTimeoutRef.current) {
      clearTimeout(leaveTimeoutRef.current);
      leaveTimeoutRef.current = null;
    }
    setIsMenuOpen(true);
  };

  const handleMouseLeave = () => {
    leaveTimeoutRef.current = setTimeout(() => {
      setIsMenuOpen(false);
    }, 400); // 400ms smooth grace delay before closing
  };

  const isOwnerActive = pathname === '/owner';
  const isShopkeeperActive = pathname === '/shopkeeper' || pathname === '/';
  const subtotal = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/80 text-white shadow-2xl transition-all">
      <div className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">

        {/* Left: Brand Logo & Full Height Sidebar Drawer Trigger */}
        <div
          className="relative w-48 sm:w-56 shrink-0"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          {/* Logo & Name Trigger */}
          <div
            onClick={() => setIsMenuOpen(prev => !prev)}
            className="flex items-center space-x-2 sm:space-x-2.5 group cursor-pointer py-1.5 px-1 sm:px-2 rounded-2xl hover:bg-slate-900/60 transition"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-300/40 text-slate-950 font-black text-lg sm:text-xl tracking-wider group-hover:scale-105 transition-all duration-300 shrink-0">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div className="truncate">
              <div className="flex items-center space-x-1.5">
                <h1 className={`font-extrabold text-sm sm:text-base tracking-tight uppercase font-sans truncate ${theme === 'light'
                    ? 'text-slate-950 font-black'
                    : 'bg-gradient-to-r from-white via-slate-100 to-amber-200 bg-clip-text text-transparent'
                  }`}>
                  Gol Builders
                </h1>
                {isShopkeeperActive && onTabChange && (
                  <ChevronDown className={`w-3.5 h-3.5 text-amber-400 shrink-0 transition-transform duration-300 ${isMenuOpen ? 'rotate-180' : ''}`} />
                )}
              </div>
            </div>
          </div>

          {/* Left-Side Full Viewport Height Sidebar Drawer (15-20% Screen Width) */}
          {isShopkeeperActive && onTabChange && (
            <>
              {/* Dimmed Overlay Backdrop */}
              <div
                onClick={() => setIsMenuOpen(false)}
                className={`fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
                  }`}
              />

              {/* 15-20% Wide Left Full Screen Height Sidebar Drawer */}
              <aside
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={`fixed top-0 left-0 bottom-0 h-screen z-50 w-[18vw] min-w-[260px] max-w-[320px] bg-slate-950/95 backdrop-blur-2xl border-r border-slate-800 shadow-2xl p-5 flex flex-col justify-between transition-transform duration-300 ease-in-out font-sans ${isMenuOpen ? 'translate-x-0' : '-translate-x-full'
                  }`}
              >
                {/* Sidebar Top Content */}
                <div>
                  <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 via-amber-500 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/25 ring-1 ring-amber-300/40 text-slate-950 font-black text-xl">
                        <Building2 className="w-5 h-5 text-slate-950 stroke-[2.5]" />
                      </div>
                      <div>
                        <h2 className="font-extrabold text-sm text-white tracking-tight uppercase">Gol Builders</h2>
                        <span className="text-[10px] text-amber-400 font-mono font-bold flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" /> POS ERP Menu
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsMenuOpen(false)}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="text-[11px] font-bold text-slate-400 font-mono uppercase tracking-wider mb-3 px-1">
                    Select Terminal Mode
                  </div>

                  {/* 3 Terminal Options */}
                  <div className="space-y-2">
                    {/* 1. POS Billing & Checkout */}
                    <button
                      onClick={() => {
                        onTabChange('billing');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${activeTab === 'billing'
                          ? 'bg-emerald-500/15 border-emerald-500/50 text-white shadow-md font-bold'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'billing' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-emerald-400 border border-slate-800'
                          }`}>
                          <ShoppingCart className="w-4.5 h-4.5" />
                        </div>
                        <span className="font-bold text-xs">POS Billing & Checkout</span>
                      </div>
                      {activeTab === 'billing' && <ChevronRight className="w-4 h-4 text-emerald-400 shrink-0" />}
                    </button>

                    {/* 2. Customer Purchase History & Search */}
                    <button
                      onClick={() => {
                        onTabChange('history');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${activeTab === 'history'
                          ? 'bg-indigo-500/15 border-indigo-500/50 text-white shadow-md font-bold'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'history' ? 'bg-indigo-600 text-white font-bold' : 'bg-slate-900 text-indigo-400 border border-slate-800'
                          }`}>
                          <History className="w-4.5 h-4.5" />
                        </div>
                        <span className="font-bold text-xs">Customer History & Dues</span>
                      </div>
                      {activeTab === 'history' && <ChevronRight className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </button>

                    {/* 3. Make Quotation Estimate */}
                    <button
                      onClick={() => {
                        onTabChange('quotation');
                        setIsMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-left group ${activeTab === 'quotation'
                          ? 'bg-amber-500/15 border-amber-500/50 text-white shadow-md font-bold'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                        }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${activeTab === 'quotation' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-amber-400 border border-slate-800'
                          }`}>
                          <FileCheck2 className="w-4.5 h-4.5" />
                        </div>
                        <span className="font-bold text-xs">Make Quotation Estimate</span>
                      </div>
                      {activeTab === 'quotation' && <ChevronRight className="w-4 h-4 text-amber-400 shrink-0" />}
                    </button>
                  </div>
                </div>

                {/* Sidebar Footer Status */}
                <div className="pt-4 border-t border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-400 font-mono bg-slate-900/80 p-2.5 rounded-xl border border-slate-800">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>System Online</span>
                    </span>
                    <span className="text-emerald-400 font-bold">POS Active</span>
                  </div>
                </div>
              </aside>
            </>
          )}
        </div>

        {/* Center Header: Product Search Bar (POS Billing & Make Quotation Modes) */}
        {isShopkeeperActive && (activeTab === 'billing' || activeTab === 'quotation' || !activeTab) && onSearchChange && (
          <div className="flex-1 max-w-md sm:max-w-lg lg:max-w-xl mx-2 sm:mx-4 relative min-w-0">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm || ''}
              onChange={e => onSearchChange(e.target.value)}
              placeholder="Search product name or SKU code..."
              className="w-full pl-10 pr-4 py-3 sm:py-3.5 bg-slate-900/90 border border-slate-800 focus:border-amber-500 rounded-2xl text-xs sm:text-sm text-white focus:outline-none shadow-inner transition"
            />
          </div>
        )}

        {/* Right Corner: Cart Button / Print Quotation Button, Owner Badge, and TOP-RIGHT LIGHT/DARK THEME TOGGLE BUTTON */}
        <div className="flex items-center space-x-2 shrink-0">

          {/* 1. POS Cart Action Button (Billing Mode) */}
          {isShopkeeperActive && (activeTab === 'billing' || !activeTab) && onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className={`min-w-[130px] sm:min-w-[155px] px-3 sm:px-3.5 py-2 sm:py-2.5 rounded-2xl border transition-all flex items-center justify-between space-x-1.5 font-bold text-xs sm:text-sm shadow-xl group shrink-0 ${cart.length > 0
                  ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 border-emerald-400 shadow-emerald-500/25 ring-2 ring-emerald-400/40 animate-pulseGlow'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700 hover:text-white'
                }`}
            >
              <div className="flex items-center space-x-1.5 shrink-0">
                <ShoppingBag className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform shrink-0" />
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-black font-mono border shrink-0 ${cart.length > 0
                    ? 'bg-slate-950 text-emerald-400 border-emerald-500/40'
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}>
                  {cart.length}
                </span>
              </div>
              <span className={`font-mono font-black text-xs sm:text-sm shrink-0 ${cart.length > 0 ? 'text-slate-950' : 'text-slate-400'
                }`}>
                ₹{subtotal.toLocaleString()}
              </span>
            </button>
          )}

          {/* 2. Print Quotation Action Button (Quotation Mode) */}
          {isShopkeeperActive && activeTab === 'quotation' && onOpenCart && (
            <button
              type="button"
              onClick={onOpenCart}
              className="px-3.5 py-2 sm:py-2.5 rounded-2xl border transition-all flex items-center justify-between space-x-2 font-bold text-xs sm:text-sm shadow-xl group shrink-0 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 border-amber-400 shadow-amber-500/25 ring-2 ring-amber-400/40 cursor-pointer"
            >
              <div className="flex items-center space-x-1.5 shrink-0">
                <Printer className="w-4 h-4 sm:w-4.5 sm:h-4.5 group-hover:scale-110 transition-transform shrink-0" />
                <span>Print Quotation</span>
              </div>
            </button>
          )}

          {/* Shopkeeper Mode Status Badge & Logout Button */}
          {isShopkeeperActive && currentShopkeeper && (
            <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
              <div className="shopkeeper-status-pill hidden lg:flex items-center space-x-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl border font-bold text-xs shadow-sm bg-emerald-950/80 text-emerald-300 border-emerald-500/40">
                <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-400"></span>
                <span className="font-extrabold text-white">
                  {currentShopkeeper.name}
                </span>
              </div>
              <button
                type="button"
                onClick={logoutShopkeeper}
                title="Log Out of Shopkeeper Terminal"
                className="header-logout-btn px-2.5 py-1.5 sm:py-2 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition flex items-center space-x-1 hover:border-red-500/50 cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Logout</span>
              </button>
            </div>
          )}

          {/* Owner Mode Status Badge & Logout Button */}
          {isOwnerActive && currentOwner && (
            <div className="flex items-center space-x-2">
              <div className="owner-status-pill flex items-center space-x-1.5 sm:space-x-2 px-2.5 sm:px-3 py-1.5 rounded-2xl border font-bold text-xs shadow-sm transition-all bg-indigo-950/80 text-indigo-300 border-indigo-500/40">
                <span className="w-2 h-2 rounded-full animate-pulse bg-emerald-400"></span>
                <span className="font-extrabold text-white">
                  {currentOwner.name}
                </span>
              </div>
              <button
                type="button"
                onClick={logoutOwner}
                title="Log Out of Owner Control Center"
                className="header-logout-btn px-2.5 py-1.5 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-bold transition flex items-center space-x-1 hover:border-red-500/50 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Logout</span>
              </button>
            </div>
          )}

          {isOwnerActive && !currentOwner && (
            <div className="flex items-center space-x-2 px-3 sm:px-4 py-1.5 rounded-2xl border font-bold text-xs shadow-sm transition-all bg-indigo-950/80 text-indigo-300 border-indigo-500/40">
              <span className="w-2 h-2 rounded-full animate-pulse bg-indigo-400"></span>
              <span className="flex items-center gap-1.5">
                <LayoutDashboard className="w-3.5 h-3.5 text-indigo-400" />
                <span className="font-extrabold hidden sm:inline">Owner Control Center</span>
                <span className="font-extrabold sm:hidden">Owner</span>
              </span>
            </div>
          )}

          {/* TOP RIGHT CORNER: Light / Dark Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            title={theme === 'dark' ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
            className={`p-2 sm:p-2.5 rounded-2xl border transition-all duration-300 flex items-center justify-center shadow-md group shrink-0 hover:scale-105 active:scale-95 ${theme === 'dark'
                ? 'bg-slate-900 text-amber-400 border-slate-800 hover:border-amber-400/60'
                : 'bg-slate-100 text-indigo-600 border-slate-300 hover:border-indigo-400 shadow-slate-200'
              }`}
          >
            {theme === 'dark' ? (
              <Sun className="w-4.5 h-4.5 text-amber-400 group-hover:rotate-45 transition-transform duration-300" />
            ) : (
              <Moon className="w-4.5 h-4.5 text-indigo-600 group-hover:-rotate-12 transition-transform duration-300" />
            )}
          </button>
        </div>

      </div>
    </header>
  );
};
