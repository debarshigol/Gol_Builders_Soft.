'use client';

import React from 'react';
import { Invoice } from '@/types';
import { Printer, Download, CheckCircle, X, Store, Sparkles, RefreshCw } from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const { resetBillingSession } = useApp();

  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleNewBill = () => {
    resetBillingSession();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="glass-modal border border-slate-700/60 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl animate-scaleUp my-8">

        {/* Header Bar */}
        <div className="bg-slate-800 px-5 py-3 border-b border-slate-700 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
            <CheckCircle className="w-4 h-4" />
            <span>Invoice Generated Successfully!</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* PRINTABLE RECEIPT CONTENT CONTAINER */}
        <div id="printable-receipt" className="p-6 sm:p-8 bg-white text-slate-900 font-sans">

          {/* Receipt Top Store Header */}
          <div className="text-center pb-4 border-b border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center mx-auto mb-2 font-bold text-xl shadow">
              🏗️
            </div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase">
              Gol Builders
            </h2>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-1">Building Materials & Hardware Depot</p>
            <p className="text-xs text-slate-600">Madhab Nagar, Pathar Pratima, WB, 743371</p>
            <p className="text-xs text-slate-500 font-mono">GSTIN: 29GOLBLD9988C1Z4 | Ph: +91 98765 43210</p>
          </div>

          {/* Receipt Details Bar */}
          <div className="grid grid-cols-2 gap-4 py-3 my-2 border-b border-dashed border-slate-300 text-xs">
            <div>
              <span className="text-slate-500 block">
                {invoice.isSettlementReceipt ? 'Receivable Receipt #' : 'Invoice Number:'}
              </span>
              <strong className="font-mono text-slate-900">{invoice.id}</strong>
            </div>
            <div className="text-right">
              <span className="text-slate-500 block">Date & Time:</span>
              <strong className="font-mono text-slate-900">
                {new Date(invoice.createdAt).toLocaleString([], {
                  dateStyle: 'short',
                  timeStyle: 'short',
                })}
              </strong>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs mb-4">
            <div className="flex justify-between items-center font-bold text-slate-800 mb-1">
              <span>Billed To (Customer):</span>
              <span className="font-mono font-normal text-slate-600">📱 {invoice.customerPhone}</span>
            </div>
            <div className="font-semibold text-slate-900">{invoice.customerName}</div>
            <div className="text-slate-600 text-[11px] mt-0.5">{invoice.customerAddress}</div>
            {invoice.customerGstin && (
              <div className="mt-1.5 pt-1.5 border-t border-slate-200 text-[11px] text-indigo-900 font-mono font-bold flex items-center justify-between">
                <span>Customer GSTIN:</span>
                <span>{invoice.customerGstin}</span>
              </div>
            )}
          </div>

          {/* If Settlement Receipt vs Regular/GST Sales Invoice */}
          {invoice.isSettlementReceipt ? (
            <div className="my-4 bg-amber-50/80 border border-amber-200 rounded-xl p-4 space-y-2 text-xs">
              <div className="text-center font-black uppercase text-slate-900 tracking-wider text-sm border-b border-amber-200 pb-2">
                📜 Official Past Credit Due Settlement
              </div>

              <div className="flex justify-between text-slate-700 font-medium">
                <span>Previous Outstanding Due Balance:</span>
                <span className="font-mono font-bold text-amber-900">
                  ₹{(invoice.previousDue || 0).toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-900 font-bold border-t border-amber-200 pt-1.5">
                <span>Amount Paid Today:</span>
                <span className="font-mono text-emerald-700 text-sm">
                  -₹{invoice.amountPaid.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between text-slate-900 font-extrabold text-sm border-t-2 border-amber-300 pt-2">
                <span>Remaining Account Balance Due:</span>
                <span className={`font-mono ${invoice.dueAmount > 0 ? 'text-amber-900' : 'text-emerald-700 font-black'}`}>
                  {invoice.dueAmount > 0 ? `₹${invoice.dueAmount.toLocaleString()}` : '₹0 (NIL - Fully Cleared)'}
                </span>
              </div>
            </div>
          ) : (
            <>
              {/* Items Table */}
              <table className="w-full text-xs text-left mb-4">
                <thead>
                  <tr className="border-b-2 border-slate-800 text-slate-700 font-bold uppercase text-[10px]">
                    <th className="py-1.5">Item</th>
                    <th className="py-1.5 text-center">Qty</th>
                    <th className="py-1.5 text-right">Rate</th>
                    <th className="py-1.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoice.items.map((item, idx) => (
                    <tr key={idx} className="text-slate-800">
                      <td className="py-2 pr-2">
                        <span className="font-semibold">{item.product.name}</span>
                        <span className="block text-[10px] text-slate-500 font-mono">
                          {item.hsnCode ? `HSN Code: ${item.hsnCode}` : item.product.sku}
                        </span>
                      </td>
                      <td className="py-2 text-center font-mono font-bold">{item.quantity}</td>
                      <td className="py-2 text-right font-mono">₹{item.product.price}</td>
                      <td className="py-2 text-right font-mono font-bold">
                        ₹{item.product.price * item.quantity}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Breakdown */}
              <div className="border-t border-slate-300 pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Taxable Value (Subtotal):</span>
                  <span className="font-mono font-bold">₹{invoice.subtotal.toLocaleString()}</span>
                </div>

                {invoice.taxRate > 0 && (
                  <div className="space-y-1 bg-slate-50 p-2 rounded border border-slate-200 my-1">
                    <div className="flex justify-between text-slate-700 text-[11px]">
                      <span>CGST (Central Tax @ {(invoice.taxRate / 2)}%):</span>
                      <span className="font-mono font-semibold">+₹{(invoice.cgstAmount !== undefined ? invoice.cgstAmount : invoice.taxAmount / 2).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-700 text-[11px]">
                      <span>SGST (State Tax @ {(invoice.taxRate / 2)}%):</span>
                      <span className="font-mono font-semibold">+₹{(invoice.sgstAmount !== undefined ? invoice.sgstAmount : invoice.taxAmount / 2).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-slate-900 text-xs font-bold border-t border-slate-300 pt-1">
                      <span>Total GST Tax ({invoice.taxRate}%):</span>
                      <span className="font-mono text-emerald-800">+₹{invoice.taxAmount.toLocaleString()}</span>
                    </div>
                  </div>
                )}

                {invoice.discount > 0 && (
                  <div className="flex justify-between text-emerald-700 font-medium">
                    <span>Discount Applied:</span>
                    <span className="font-mono">-₹{invoice.discount.toLocaleString()}</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-base font-extrabold text-slate-900 border-t-2 border-slate-900 pt-2 mt-2">
                  <span>Grand Total:</span>
                  <span className="font-mono text-lg text-slate-900">
                    ₹{invoice.totalAmount.toLocaleString()}
                  </span>
                </div>

                <div className="flex justify-between text-xs text-slate-700 pt-1 font-semibold">
                  <span>Amount Collected (Paid):</span>
                  <span className="font-mono text-emerald-700 font-bold">
                    ₹{(invoice.amountPaid !== undefined ? invoice.amountPaid : invoice.totalAmount).toLocaleString()}
                  </span>
                </div>

                {invoice.dueAmount !== undefined && invoice.dueAmount > 0 && (
                  <div className="flex justify-between text-xs text-amber-800 bg-amber-50 p-2 rounded border border-amber-300 font-bold mt-1">
                    <span>Balance Remaining Due:</span>
                    <span className="font-mono">₹{invoice.dueAmount.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex justify-between items-center text-xs text-slate-600 pt-3 border-t border-slate-200 mt-2">
            <span>Payment Mode & Status:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded uppercase border ${
              invoice.dueAmount && invoice.dueAmount > 0
                ? 'bg-amber-100 text-amber-900 border-amber-300'
                : 'bg-emerald-100 text-emerald-900 border-emerald-300'
            }`}>
              {invoice.paymentMethod} — {invoice.isSettlementReceipt ? (invoice.dueAmount <= 0 ? 'DUE CLEARED (NIL)' : 'PARTIAL SETTLEMENT') : (invoice.paymentStatus || (invoice.dueAmount > 0 ? 'PARTIAL' : 'FULL PAID'))}
            </span>
          </div>

          {/* Footer Note */}
          <div className="text-center pt-6 mt-4 border-t border-dashed border-slate-300 text-[11px] text-slate-500">
            <p className="font-medium">Thank you for shopping with us!</p>
            <p>For returns, please produce this bill within 7 days.</p>
          </div>

        </div>

        {/* Modal Bottom Actions (Hidden when printing) */}
        <div className="bg-slate-800 px-6 py-4 border-t border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <button
            onClick={handleNewBill}
            className="w-full sm:w-auto px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl text-xs font-semibold transition flex items-center justify-center space-x-1.5"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Bill Session</span>
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-2">
            <button
              onClick={handlePrint}
              className="flex-1 sm:flex-initial px-5 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold rounded-xl text-xs transition flex items-center justify-center space-x-1.5 shadow"
            >
              <Printer className="w-4 h-4" />
              <span>Print Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
