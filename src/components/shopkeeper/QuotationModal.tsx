'use client';

import React from 'react';
import { Quotation } from '@/types';
import { Printer, X, Building2, Phone, MapPin, Calendar, FileText, CheckCircle2 } from 'lucide-react';

interface QuotationModalProps {
  quotation: Quotation | null;
  onClose: () => void;
}

export const QuotationModal: React.FC<QuotationModalProps> = ({ quotation, onClose }) => {
  if (!quotation) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(quotation.createdAt).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const validUntilDate = new Date(quotation.validUntil).toLocaleDateString([], {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      {/* Modal Card */}
      <div className="glass-modal border border-slate-700/60 rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        
        {/* Header Actions (Hidden on Print) */}
        <div className="p-4 sm:p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2">
            <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-mono font-bold uppercase">
              PROFORMA QUOTATION ESTIMATE
            </span>
            <span className="font-mono text-xs text-amber-400 font-bold">#{quotation.id}</span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg shadow-indigo-600/30 transition flex items-center space-x-1.5"
            >
              <Printer className="w-4 h-4" />
              <span>Print Quotation</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Content Container */}
        <div className="p-6 sm:p-8 overflow-y-auto space-y-6 print-container bg-white text-slate-900">
          
          {/* Printable Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-slate-200 pb-6">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500 flex items-center justify-center font-black text-white text-2xl">
                <Building2 className="w-7 h-7 text-slate-950" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  Gol Builders
                </h1>
                <p className="text-xs text-slate-600 font-medium">Building Materials & Construction Supply</p>
                <p className="text-[11px] text-slate-500">Pathar Pratima, South 24 Parganas, WB • Mobile: +91 9876543210</p>
              </div>
            </div>

            <div className="mt-4 sm:mt-0 text-left sm:text-right">
              <span className="inline-block px-3 py-1 bg-indigo-100 text-indigo-900 text-xs font-black tracking-widest uppercase rounded">
                PRICE ESTIMATE / QUOTATION
              </span>
              <p className="text-sm font-mono font-bold text-slate-900 mt-2">No: {quotation.id}</p>
              <p className="text-xs text-slate-600">Date: {formattedDate}</p>
              <p className="text-xs text-amber-700 font-semibold mt-0.5">Valid Until: {validUntilDate}</p>
            </div>
          </div>

          {/* Customer Info Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Quotation For (Customer)</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">{quotation.customerName}</h3>
              <p className="text-xs text-slate-600 font-mono mt-0.5 flex items-center gap-1">
                <Phone className="w-3 h-3 text-slate-400" /> Phone: {quotation.customerPhone}
              </p>
            </div>

            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">Delivery / Site Address</span>
              <p className="text-xs text-slate-700 font-medium mt-0.5 flex items-start gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                {quotation.customerAddress || 'N/A'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Quoted Material Breakdown</h4>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase border-b border-slate-200 text-[10px]">
                  <tr>
                    <th className="px-3 py-2">Item Description</th>
                    <th className="px-3 py-2 text-center">Qty</th>
                    <th className="px-3 py-2 text-right">Quoted Rate</th>
                    <th className="px-3 py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 font-mono text-slate-800">
                  {quotation.items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-sans font-medium text-slate-900">
                        <span className="mr-1">{item.product.imageEmoji || '📦'}</span>
                        {item.product.name}
                      </td>
                      <td className="px-3 py-2.5 text-center font-bold">
                        {item.quantity} {item.product.unit || 'Pcs'}
                      </td>
                      <td className="px-3 py-2.5 text-right text-slate-600">
                        ₹{item.quotedPrice.toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2.5 text-right font-bold text-slate-900">
                        ₹{(item.quotedPrice * item.quantity).toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quotation Financial Totals */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 pt-2 border-t border-slate-200">
            <div className="text-xs text-slate-600 max-w-md">
              {quotation.notes && (
                <div className="mb-2 bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-amber-900 text-xs">
                  <strong>Notes & Remarks:</strong> {quotation.notes}
                </div>
              )}
              <p className="text-[11px] text-slate-500 italic">
                * Prices quoted are valid until {validUntilDate}. Final billing will be subject to stock availability and delivery terms at time of order confirmation.
              </p>
            </div>

            <div className="w-full sm:w-64 bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-1.5 font-mono text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span>₹{quotation.subtotal.toLocaleString('en-IN')}</span>
              </div>
              {quotation.taxAmount > 0 && (
                <div className="flex justify-between text-slate-600">
                  <span>GST ({quotation.taxRate}%):</span>
                  <span>+₹{quotation.taxAmount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {quotation.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-semibold">
                  <span>Discount:</span>
                  <span>-₹{quotation.discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-black text-slate-900 font-sans">
                <span>Grand Total:</span>
                <span className="text-indigo-900">₹{quotation.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature Block */}
          <div className="pt-6 mt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-500">
            <div>
              <p className="font-bold text-slate-800">Gol Builders POS & ERP System</p>
              <p>Thank you for inquiring with us!</p>
            </div>
            <div className="text-right border-t border-slate-400 pt-1 w-44 text-slate-700 font-medium">
              Authorized Signatory
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
