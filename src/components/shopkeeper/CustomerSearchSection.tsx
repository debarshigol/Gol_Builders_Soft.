'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentMethod } from '@/types';
import { Phone, Search, UserCheck, UserPlus, MapPin, CheckCircle2, ArrowRight, RefreshCw, User, Sparkles } from 'lucide-react';

export const CustomerSearchSection: React.FC = () => {
  const {
    phoneSearchTerm,
    setPhoneSearchTerm,
    activeCustomer,
    searchStatus,
    searchAttempted,
    lookupCustomerByPhone,
    registerCustomer,
    resetBillingSession,
    customers,
  } = useApp();

  // Local state for registration inputs if customer not found
  const [regName, setRegName] = useState('');
  const [regAddress, setRegAddress] = useState('');
  const [regError, setRegError] = useState('');

  // Local state for past due clearance payment
  const [showDueForm, setShowDueForm] = useState(false);
  const [settlementInput, setSettlementInput] = useState<string>('');
  const [duePayMethod, setDuePayMethod] = useState<PaymentMethod>('UPI');
  const { payCustomerDue } = useApp();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPhoneSearchTerm(val);
    if (val.trim().length >= 10) {
      lookupCustomerByPhone(val);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    lookupCustomerByPhone(phoneSearchTerm);
  };

  const handleRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!regName.trim()) {
      setRegError('Please enter customer full name.');
      return;
    }
    if (!regAddress.trim()) {
      setRegError('Please enter customer address.');
      return;
    }
    setRegError('');
    registerCustomer(phoneSearchTerm, regName, regAddress);
    setRegName('');
    setRegAddress('');
  };

  const handleDueSettlementSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomer || !activeCustomer.totalDue) return;
    const payingVal = settlementInput === '' ? activeCustomer.totalDue : Number(settlementInput);
    if (payingVal <= 0) return;
    payCustomerDue(activeCustomer.id, payingVal, duePayMethod);
    setShowDueForm(false);
    setSettlementInput('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -z-0 pointer-events-none" />

      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm border border-emerald-500/20">
            Step 1
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400" /> Customer Phone Search & Verification
            </h2>
            <p className="text-xs text-slate-400">
              Enter phone number to fetch customer details or register a new customer
            </p>
          </div>
        </div>

        {activeCustomer && (
          <button
            onClick={resetBillingSession}
            className="flex items-center space-x-1 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-700 transition"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Switch Customer</span>
          </button>
        )}
      </div>

      {/* Demo Customer Quick Pills */}
      {!activeCustomer && (
        <div className="mb-4">
          <p className="text-xs text-slate-400 mb-2 flex items-center gap-1 font-medium">
            <Sparkles className="w-3 h-3 text-amber-400" /> Demo Quick Select (Click to test):
          </p>
          <div className="flex flex-wrap gap-2">
            {customers.slice(0, 3).map(c => (
              <button
                key={c.id}
                type="button"
                onClick={() => {
                  setPhoneSearchTerm(c.phone);
                  lookupCustomerByPhone(c.phone);
                }}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 transition flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>{c.name} ({c.phone})</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                const newPhone = '999' + Math.floor(1000000 + Math.random() * 9000000);
                setPhoneSearchTerm(newPhone);
                lookupCustomerByPhone(newPhone);
              }}
              className="text-xs px-2.5 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 transition flex items-center gap-1"
            >
              <UserPlus className="w-3 h-3" /> Test New Phone
            </button>
          </div>
        </div>
      )}

      {/* Phone Number Input Form */}
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
            <Phone className="w-5 h-5" />
          </div>
          <input
            type="tel"
            value={phoneSearchTerm}
            onChange={handlePhoneChange}
            placeholder="Enter 10-digit mobile number (e.g. 9876543210)..."
            disabled={searchStatus === 'found' && !!activeCustomer}
            className={`w-full pl-11 pr-28 py-3 bg-slate-950 border rounded-xl text-white text-base font-mono placeholder-slate-500 focus:outline-none transition-all ${
              searchStatus === 'found'
                ? 'border-emerald-500/60 ring-2 ring-emerald-500/20 bg-emerald-950/10'
                : searchStatus === 'not_found'
                ? 'border-amber-500/60 ring-2 ring-amber-500/20'
                : 'border-slate-800 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20'
            }`}
          />
          <button
            type="submit"
            disabled={!phoneSearchTerm.trim() || (searchStatus === 'found' && !!activeCustomer)}
            className="absolute right-2 top-2 bottom-2 px-4 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-slate-950 font-bold rounded-lg text-xs transition flex items-center space-x-1.5 shadow"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Lookup</span>
          </button>
        </div>
      </form>

      {/* RESULT CASE 1: Registered Customer Found */}
      {searchStatus === 'found' && activeCustomer && (
        <div className="bg-emerald-950/30 border border-emerald-500/40 rounded-xl p-4 animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold text-lg">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="bg-emerald-500/20 text-emerald-300 text-xs font-semibold px-2 py-0.5 rounded-md border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Registered Customer
                  </span>
                  <span className="text-xs text-slate-400 font-mono">ID: {activeCustomer.id}</span>
                </div>
                <h3 className="text-lg font-bold text-white mt-1">{activeCustomer.name}</h3>
                <p className="text-xs text-slate-300 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{activeCustomer.address}</span>
                </p>
              </div>
            </div>

            <div className="flex sm:flex-col items-center sm:items-end justify-between border-t sm:border-t-0 border-emerald-900/50 pt-2 sm:pt-0">
              <div className="text-xs text-slate-300">
                Total Visits: <strong className="text-emerald-400 font-mono">{activeCustomer.totalPurchases}</strong>
              </div>
              <div className="text-xs text-slate-300">
                Total Spent: <strong className="text-emerald-400 font-mono">₹{activeCustomer.totalSpent.toLocaleString()}</strong>
              </div>
              <div className="text-xs text-slate-300">
                Outstanding Due: <strong className={`font-mono ${activeCustomer.totalDue && activeCustomer.totalDue > 0 ? 'text-amber-400 font-bold' : 'text-emerald-400'}`}>₹{(activeCustomer.totalDue || 0).toLocaleString()}</strong>
              </div>
            </div>
          </div>

          {/* PAST DUE SETTLEMENT NOTICE & PAY BOX */}
          {activeCustomer.totalDue > 0 && (
            <div className="mt-3 pt-3 border-t border-amber-500/30 bg-amber-950/40 p-3 rounded-xl border">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <span>⚠️ Past Outstanding Due Found:</span>
                    <span className="font-mono text-sm font-black text-amber-300">₹{activeCustomer.totalDue.toLocaleString()}</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Customer wants to pay past due to make balance Nil (₹0) or pay a custom partial amount?
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowDueForm(!showDueForm);
                    setSettlementInput(activeCustomer.totalDue.toString());
                  }}
                  className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition flex items-center justify-center space-x-1.5 shrink-0 shadow"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{showDueForm ? 'Close Settlement Form' : 'Pay / Settle Past Due'}</span>
                </button>
              </div>

              {/* Expandable Due Clearance Form */}
              {showDueForm && (
                <form onSubmit={handleDueSettlementSubmit} className="mt-3 pt-3 border-t border-amber-500/20 space-y-3 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Amount Customer is Paying Now (₹)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max={activeCustomer.totalDue}
                        value={settlementInput}
                        onChange={e => setSettlementInput(e.target.value)}
                        placeholder={`Full pay: ₹${activeCustomer.totalDue}`}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-slate-300 font-semibold mb-1">
                        Payment Mode
                      </label>
                      <select
                        value={duePayMethod}
                        onChange={e => setDuePayMethod(e.target.value as any)}
                        className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white text-xs focus:outline-none"
                      >
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Cash">Cash</option>
                        <option value="Card">Card</option>
                        <option value="Store Credit">Bank Transfer</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-300">
                      {settlementInput === '' || Number(settlementInput) >= activeCustomer.totalDue ? (
                        <span className="text-emerald-400 font-bold">✓ Customer Past Due will become NIL (₹0)</span>
                      ) : (
                        <span className="text-amber-300 font-semibold">
                          New Remaining Due after payment: <strong>₹{(activeCustomer.totalDue - Number(settlementInput)).toLocaleString()}</strong>
                        </span>
                      )}
                    </span>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-slate-950 font-extrabold rounded-lg text-xs transition shadow flex items-center space-x-1.5"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Collect Payment & Print Receipt</span>
                    </button>
                  </div>
                </form>
              )}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-emerald-500/20 flex items-center justify-between text-xs text-emerald-300 font-medium">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Customer verified! Proceed to select items below.
            </span>
            <a href="#billing-section" className="text-emerald-400 hover:underline font-bold flex items-center gap-1">
              Add Items <ArrowRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* RESULT CASE 2: Customer Not Found -> Prompt for 2 fields: Name & Address */}
      {searchStatus === 'not_found' && searchAttempted && (
        <div className="bg-amber-950/20 border border-amber-500/40 rounded-xl p-4 sm:p-5 animate-fadeIn">
          <div className="flex items-center space-x-2 text-amber-400 font-semibold mb-3">
            <UserPlus className="w-5 h-5" />
            <h3 className="text-sm sm:text-base">New Customer — Register Details</h3>
          </div>
          <p className="text-xs text-slate-300 mb-4">
            No registered record found for <span className="font-mono font-bold text-amber-300">{phoneSearchTerm}</span>. Please fill in the 2 details below to register and start billing:
          </p>

          {regError && (
            <div className="mb-3 text-xs bg-red-500/10 border border-red-500/30 text-red-400 p-2 rounded-md">
              {regError}
            </div>
          )}

          <form onSubmit={handleRegisterSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Field 1: Customer Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  1. Customer Full Name <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regName}
                    onChange={e => setRegName(e.target.value)}
                    placeholder="e.g. Rahul Verma"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>

              {/* Field 2: Customer Address */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  2. Customer Address <span className="text-amber-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={regAddress}
                    onChange={e => setRegAddress(e.target.value)}
                    placeholder="e.g. 24 Bakery Lane, Sector 5"
                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-sm text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={resetBillingSession}
                className="px-3 py-2 text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-lg text-xs transition shadow flex items-center space-x-1.5"
              >
                <UserCheck className="w-4 h-4" />
                <span>Save & Proceed to Billing</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
