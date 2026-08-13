'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { PaymentMethod } from '@/types';
import { X, Plus, Trash2, FileText, CheckCircle2, Calculator, Receipt } from 'lucide-react';

interface LineItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  hsnCode: string;
}

export const ManualGstModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
  const { createManualGstInvoice } = useApp();

  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');

  const [items, setItems] = useState<LineItem[]>([
    { id: '1', name: 'Ultratech Cement (PPC 50kg)', price: 395, quantity: 50, hsnCode: '2523' },
  ]);

  const [taxRate, setTaxRate] = useState<number>(18);
  const [discount, setDiscount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('UPI');
  const [collectedAmountInput, setCollectedAmountInput] = useState<string>('');

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', price: 0, quantity: 1, hsnCode: '2523' },
    ]);
  };

  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) return;
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    setItems(prev =>
      prev.map(item => {
        if (item.id === id) {
          return { ...item, [field]: value };
        }
        return item;
      })
    );
  };

  // Tax calculations
  const subtotal = items.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0);
  const taxAmount = Number(((subtotal * taxRate) / 100).toFixed(2));
  const cgstAmount = Number((taxAmount / 2).toFixed(2));
  const sgstAmount = Number((taxAmount / 2).toFixed(2));
  const grandTotal = Math.max(0, Number((subtotal + taxAmount - discount).toFixed(2)));

  const parsedCollected = collectedAmountInput.trim() === '' ? grandTotal : Number(collectedAmountInput);
  const actualPaid = Math.min(grandTotal, Math.max(0, isNaN(parsedCollected) ? 0 : parsedCollected));
  const dueAmount = Math.max(0, Number((grandTotal - actualPaid).toFixed(2)));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim() || !customerPhone.trim() || items.length === 0) return;

    // Filter valid items
    const validItems = items.filter(i => i.name.trim() !== '' && i.price > 0 && i.quantity > 0);
    if (validItems.length === 0) return;

    const inv = createManualGstInvoice({
      customerName,
      customerPhone,
      customerAddress,
      customerGstin: customerGstin.trim() || undefined,
      items: validItems,
      taxRate,
      discount,
      paymentMethod,
      collectedAmount: actualPaid,
    });

    if (inv) {
      onClose();
      // Reset form
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      setCustomerGstin('');
      setCollectedAmountInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn overflow-y-auto">
      <div className="glass-modal border border-slate-700/60 rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 my-8 relative max-h-[90vh] flex flex-col text-slate-100">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white uppercase tracking-tight">Manual GST Tax Invoice Generator</h2>
              <p className="text-xs text-slate-400">Issue official GST compliant invoice with custom items, HSN & GST %</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="space-y-5 overflow-y-auto pr-1 flex-1">
          
          {/* Section 1: Customer Details */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <span>1. Customer & Business GSTIN Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Customer / Firm Name *</label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  placeholder="e.g. Buildcon Infrastructure Pvt Ltd"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Phone Number *</label>
                <input
                  type="text"
                  required
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  placeholder="e.g. 9876543210"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Billing Address</label>
                <input
                  type="text"
                  value={customerAddress}
                  onChange={e => setCustomerAddress(e.target.value)}
                  placeholder="e.g. Site 42, Industrial Construction Park, Sector 4"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Customer GSTIN <span className="text-slate-400 font-normal">(Optional for B2B)</span>
                </label>
                <input
                  type="text"
                  value={customerGstin}
                  onChange={e => setCustomerGstin(e.target.value.toUpperCase())}
                  placeholder="e.g. 19AAACB1234C1Z5"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono uppercase focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Items Table */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                2. Items & HSN Code Selection
              </h3>

              <button
                type="button"
                onClick={handleAddItem}
                className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-lg text-xs font-bold transition flex items-center space-x-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Item Line</span>
              </button>
            </div>

            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 items-center bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs">
                  <div className="col-span-12 sm:col-span-5">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Item Name</label>
                    <input
                      type="text"
                      required
                      value={item.name}
                      onChange={e => handleItemChange(item.id, 'name', e.target.value)}
                      placeholder="e.g. TMT Steel Rebar 12mm"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">HSN Code</label>
                    <input
                      type="text"
                      value={item.hsnCode}
                      onChange={e => handleItemChange(item.id, 'hsnCode', e.target.value)}
                      placeholder="e.g. 7214"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-4 sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Price (₹)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={item.price || ''}
                      onChange={e => handleItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
                      placeholder="Price"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-3 sm:col-span-2">
                    <label className="block text-[10px] text-slate-400 mb-0.5">Qty</label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={item.quantity || ''}
                      onChange={e => handleItemChange(item.id, 'quantity', parseInt(e.target.value, 10) || 1)}
                      placeholder="Qty"
                      className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  <div className="col-span-1 text-center pt-3 sm:pt-0">
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      disabled={items.length <= 1}
                      className={`p-1.5 rounded-lg transition ${
                        items.length <= 1 ? 'text-slate-600 cursor-not-allowed' : 'text-red-400 hover:bg-red-500/20'
                      }`}
                      title="Remove Item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Tax Rate, Discount & Payment Controls */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              3. GST Tax % & Payment Settlement
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">GST Tax Rate (%):</label>
                <select
                  value={taxRate}
                  onChange={e => setTaxRate(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white focus:outline-none focus:border-amber-500 font-mono font-bold"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST (CGST 2.5% + SGST 2.5%)</option>
                  <option value={12}>12% GST (CGST 6% + SGST 6%)</option>
                  <option value={18}>18% GST (CGST 9% + SGST 9%)</option>
                  <option value={28}>28% GST (CGST 14% + SGST 14%)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Discount (₹):</label>
                <input
                  type="number"
                  min="0"
                  value={discount || ''}
                  onChange={e => setDiscount(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Payment Method:</label>
                <select
                  value={paymentMethod}
                  onChange={e => setPaymentMethod(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-white text-xs focus:outline-none"
                >
                  <option value="UPI">UPI / QR Code</option>
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Store Credit">Bank Transfer</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Collected Amount Today (₹) <span className="text-slate-400 font-normal">(Leave blank for full payment)</span>
              </label>
              <input
                type="number"
                min="0"
                max={grandTotal}
                value={collectedAmountInput}
                onChange={e => setCollectedAmountInput(e.target.value)}
                placeholder={`Full Pay: ₹${grandTotal.toLocaleString()}`}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Calculations Summary Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-300">
                <span>Taxable Value (Subtotal):</span>
                <span>₹{subtotal.toLocaleString()}</span>
              </div>

              {taxRate > 0 && (
                <>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>CGST @ {(taxRate / 2)}%:</span>
                    <span>+₹{cgstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-slate-400 text-[11px]">
                    <span>SGST @ {(taxRate / 2)}%:</span>
                    <span>+₹{sgstAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-emerald-400 font-bold border-t border-slate-800 pt-1">
                    <span>Total GST Tax ({taxRate}%):</span>
                    <span>+₹{taxAmount.toLocaleString()}</span>
                  </div>
                </>
              )}

              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Discount:</span>
                  <span>-₹{discount.toLocaleString()}</span>
                </div>
              )}

              <div className="flex justify-between text-white font-extrabold text-sm border-t border-slate-700 pt-2">
                <span>Grand Total:</span>
                <span className="text-amber-400">₹{grandTotal.toLocaleString()}</span>
              </div>

              <div className="flex justify-between text-slate-300 text-[11px] pt-1">
                <span>Collected Paid Today: <strong className="text-emerald-400">₹{actualPaid.toLocaleString()}</strong></span>
                <span>Remaining Due: <strong className={dueAmount > 0 ? 'text-amber-400' : 'text-emerald-400'}>₹{dueAmount.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-end space-x-3 pt-2 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold rounded-xl text-xs transition"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-slate-950 font-black rounded-xl text-xs shadow-lg shadow-amber-500/20 transition flex items-center space-x-2"
            >
              <Receipt className="w-4 h-4" />
              <span>Generate GST Tax Invoice & Print</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
