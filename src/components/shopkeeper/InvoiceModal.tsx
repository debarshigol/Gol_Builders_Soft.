'use client';

import React, { useState } from 'react';
import { Invoice } from '@/types';
import {
  Printer,
  CheckCircle2,
  X,
  RefreshCw,
  Copy,
  Check,
} from 'lucide-react';
import { useApp } from '@/context/AppContext';

interface InvoiceModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({ invoice, onClose }) => {
  const { resetBillingSession } = useApp();
  const [copied, setCopied] = useState(false);

  if (!invoice) return null;

  const handlePrint = () => {
    const printContent = document.getElementById('printable-receipt');
    if (!printContent) return;

    const htmlContent = printContent.outerHTML;

    const printWindow = window.open('', '_blank', 'width=900,height=700');
    if (!printWindow) {
      alert('Please allow pop-ups for this site to print the invoice.');
      return;
    }

    const styleNodes = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'));
    const styleTags = styleNodes.map((node) => node.outerHTML).join('\n');

    printWindow.document.write(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title></title>
  ${styleTags}
  <style>
    /* ===== A4 PRINT SETUP: EXACT 1:1 FIT WITHOUT STRETCH OR CROPPING ===== */
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    *, *::before, *::after {
      box-sizing: border-box !important;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    html, body {
      margin: 0 !important;
      padding: 0 !important;
      width: 100% !important;
      background: #ffffff !important;
      color: #000000 !important;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
    }
    #printable-receipt {
      border-radius: 0 !important;
      box-shadow: none !important;
      border: none !important;
      padding: 0 !important;
      margin: 0 auto !important;
      width: 100% !important;
      max-width: 100% !important;
      background: #ffffff !important;
      color: #000000 !important;
    }
    table {
      width: 100% !important;
      border-collapse: collapse !important;
    }
  </style>
</head>
<body>
  ${htmlContent}
  <script>
    document.title = "";
    window.onload = function () {
      setTimeout(function () {
        window.print();
        setTimeout(function () { window.close(); }, 600);
      }, 350);
    };
  <\/script>
</body>
</html>`);

    printWindow.document.close();
  };

  const handleNewBill = () => {
    resetBillingSession();
    onClose();
  };

  const handleCopyId = () => {
    if (invoice?.id) {
      navigator.clipboard.writeText(invoice.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isDue = invoice.dueAmount !== undefined && invoice.dueAmount > 0;
  const isSettlement = Boolean(invoice.isSettlementReceipt);

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-fadeIn">
      <div className="invoice-modal-card bg-slate-900 border border-slate-700/80 rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl animate-scaleUp my-4 sm:my-8 flex flex-col text-slate-100 relative">

        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="invoice-modal-header bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between no-print">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-500 shrink-0 font-bold">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="invoice-modal-title text-xs sm:text-sm font-bold text-white block">
                {isSettlement ? 'Payment Receipt Generated' : 'Invoice Generated Successfully'}
              </span>
              <span className="invoice-modal-subtitle text-[10px] text-slate-400 font-mono">
                {invoice.id} • Clean B&amp;W Print
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopyId}
              type="button"
              className="invoice-btn-secondary px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center space-x-1 border border-slate-700 transition cursor-pointer"
              title="Copy Invoice ID"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy ID'}</span>
            </button>

            <button
              onClick={onClose}
              type="button"
              className="invoice-btn-close p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition border border-transparent hover:border-slate-700 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE RECEIPT CONTENT - MINIMAL, HIGH-ALIGNMENT B&W FORMAT */}
        <div className="invoice-modal-body overflow-y-auto max-h-[80vh] p-3 sm:p-6 bg-slate-900/50">
          <div
            id="printable-receipt"
            className="bg-white text-black p-6 sm:p-8 font-sans relative"
          >
            {/* ── 1. CENTERED HEADER: COMPANY DETAILS ── */}
            <div className="text-center pb-5">
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-black uppercase">
                Gol Builders
              </h1>
              <p className="text-xs text-neutral-600 mt-1">
                Madhab Nagar, Pathar Pratima, South 24 Parganas, WB – 743371
              </p>
              <p className="text-xs text-neutral-700 font-mono mt-0.5">
                Phone: +91 77971 31118 / +91 94745 01779 &nbsp;|&nbsp; GSTIN: 19AUGPG3703L1ZK
              </p>
            </div>

            {/* ── 2. INVOICE TITLE WITH SIDE LINES ── */}
            <div className="relative flex items-center justify-center my-3">
              <div className="border-t border-neutral-300 w-full" />
              <span className="bg-white px-5 text-2xl sm:text-3xl font-black tracking-widest uppercase text-black shrink-0">
                {isSettlement ? 'RECEIPT' : invoice.isGstInvoice ? 'TAX INVOICE' : 'INVOICE'}
              </span>
              <div className="border-t border-neutral-300 w-full" />
            </div>

            {/* ── 3. BILL TO (LEFT) & INVOICE META (RIGHT) ── */}
            <div className="flex flex-row justify-between items-start gap-4 pt-4 pb-4 text-xs">
              {/* Bill To Info */}
              <div className="space-y-0.5 w-1/2">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider">Bill To:</p>
                <p className="font-bold text-sm text-black">{invoice.customerName}</p>
                <p className="text-neutral-700">{invoice.customerAddress || 'Local Counter Delivery'}</p>
                <p className="text-neutral-800 font-mono">Phone: {invoice.customerPhone}</p>
                {invoice.customerGstin && (
                  <p className="text-neutral-800 font-mono">GSTIN: {invoice.customerGstin}</p>
                )}
              </div>

              {/* Invoice Meta Data */}
              <div className="w-1/2 flex justify-end shrink-0 text-xs">
                <table className="text-xs border-collapse">
                  <tbody>
                    <tr>
                      <td className="text-neutral-600 text-left pr-3 py-0.5 whitespace-nowrap">Invoice #:</td>
                      <td className="font-bold text-black font-mono text-right py-0.5 whitespace-nowrap">{invoice.id}</td>
                    </tr>
                    <tr>
                      <td className="text-neutral-600 text-left pr-3 py-0.5 whitespace-nowrap">Issue Date:</td>
                      <td className="font-bold text-black text-right py-0.5 whitespace-nowrap">
                        {new Date(invoice.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-neutral-600 text-left pr-3 py-0.5 whitespace-nowrap">Issue Time:</td>
                      <td className="font-bold text-black text-right py-0.5 whitespace-nowrap">
                        {new Date(invoice.createdAt).toLocaleTimeString('en-IN', { timeStyle: 'short' })}
                      </td>
                    </tr>
                    <tr>
                      <td className="text-neutral-600 text-left pr-3 py-0.5 whitespace-nowrap">Status:</td>
                      <td className="font-bold text-black uppercase tracking-wider text-right py-0.5 whitespace-nowrap">
                        {isSettlement
                          ? 'Settlement'
                          : isDue
                            ? `Due (₹${invoice.dueAmount.toLocaleString('en-IN')})`
                            : 'PAID IN FULL'}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── 4. SETTLEMENT SUMMARY (IF SETTLEMENT) OR ITEMS TABLE ── */}
            {isSettlement ? (
              <div className="my-5 border-t border-b border-neutral-300 py-3 space-y-3">
                <p className="text-xs font-bold uppercase tracking-wider text-black">
                  Credit Due Settlement Breakdown:
                </p>
                <div className="flex justify-between text-xs py-1 border-b border-neutral-200">
                  <span className="text-neutral-600">Previous Total Balance:</span>
                  <span className="font-mono font-bold text-black">
                    ₹{(invoice.previousDue || 0).toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1 border-b border-neutral-200">
                  <span className="text-neutral-600">Amount Paid Today:</span>
                  <span className="font-mono font-bold text-black">
                    –₹{invoice.amountPaid.toLocaleString('en-IN')}
                  </span>
                </div>
                <div className="flex justify-between text-xs py-1 font-bold">
                  <span className="text-black uppercase">Remaining Due Balance:</span>
                  <span className="font-mono text-sm text-black">
                    {invoice.dueAmount > 0 ? `₹${invoice.dueAmount.toLocaleString('en-IN')}` : '₹0 (NIL)'}
                  </span>
                </div>
              </div>
            ) : (
              /* Regular Items Table */
              <div className="my-5">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-t border-b border-neutral-300 text-neutral-700 text-[11px] font-bold">
                      <th className="py-2 px-2 w-[48%]">Item</th>
                      <th className="py-2 px-2 text-right w-[18%]">Rate (₹)</th>
                      <th className="py-2 px-2 text-center w-[16%]">Qty / Unit</th>
                      <th className="py-2 px-2 text-right w-[18%]">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items.map((item, idx) => (
                      <tr key={idx} className="border-b border-neutral-200">
                        <td className="py-2 px-2 font-medium text-black">
                          {item.product.name}
                        </td>
                        <td className="py-2 px-2 text-right font-mono text-neutral-800">
                          {item.product.price.toLocaleString('en-IN')}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-neutral-800">
                          {item.quantity} {item.product.unit}
                        </td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-black">
                          {(item.product.price * item.quantity).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* ── 5. BOTTOM TOTALS SECTION (NO BOXES, CLEAN ALIGNMENT) ── */}
            {!isSettlement && (
              <div className="flex flex-row justify-between items-start gap-6 pt-3">
                {/* Left: Payment Method Info */}
                <div className="w-1/2 text-xs space-y-2">
                  <div className="space-y-0.5">
                    <p className="font-bold text-neutral-700">Payment Terms:</p>
                    <p className="text-neutral-800">
                      Payment Mode: <strong className="text-black">{invoice.paymentMethod}</strong>
                    </p>
                  </div>

                  {invoice.taxRate > 0 && (
                    <div className="text-xs text-neutral-600 font-mono space-y-0.5 pt-1.5">
                      <div className="flex justify-between">
                        <span>CGST ({invoice.taxRate / 2}%):</span>
                        <span>₹{(invoice.cgstAmount ?? invoice.taxAmount / 2).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST ({invoice.taxRate / 2}%):</span>
                        <span>₹{(invoice.sgstAmount ?? invoice.taxAmount / 2).toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Right: Clean Aligned Totals */}
                <div className="w-1/2 max-w-xs space-y-1.5 text-xs ml-auto">
                  <div className="flex justify-between text-neutral-700">
                    <span>Subtotal:</span>
                    <span className="font-mono font-medium text-black">
                      ₹{invoice.subtotal.toLocaleString('en-IN')}
                    </span>
                  </div>

                  {invoice.discount > 0 && (
                    <div className="flex justify-between text-neutral-700">
                      <span>Discount:</span>
                      <span className="font-mono font-medium">–₹{invoice.discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}

                  {invoice.taxRate > 0 && (
                    <div className="flex justify-between text-neutral-700">
                      <span>Tax ({invoice.taxRate}% GST):</span>
                      <span className="font-mono font-medium text-black">
                        ₹{invoice.taxAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  <div className="border-t border-neutral-300 pt-1.5 flex justify-between font-bold text-sm text-black">
                    <span>Total Due:</span>
                    <span className="font-mono text-base">
                      ₹{invoice.totalAmount.toLocaleString('en-IN')}
                    </span>
                  </div>

                  <div className="border-t border-neutral-200 pt-1 flex justify-between text-neutral-800">
                    <span>Amount Paid:</span>
                    <span className="font-mono font-bold text-black">
                      ₹{(invoice.amountPaid !== undefined ? invoice.amountPaid : invoice.totalAmount).toLocaleString('en-IN')}
                    </span>
                  </div>

                  {isDue && (
                    <div className="border-t border-neutral-300 pt-1 flex justify-between font-bold text-xs text-black">
                      <span>Balance Due:</span>
                      <span className="font-mono text-sm font-black">
                        ₹{invoice.dueAmount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── 6. FOOTER: THANK YOU & SIGNATURE ── */}
            <div className="mt-14 pt-3 flex flex-row justify-between items-end gap-6 text-xs">
              <p className="font-bold text-xs text-black">
                Thank you for building with Gol Builders!
              </p>
              <div className="text-center border-t border-black pt-1 min-w-[170px]">
                <p className="text-[10px] text-neutral-600 uppercase tracking-wider">Authorized Signatory</p>
                <p className="font-bold text-black text-xs">For Gol Builders</p>
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Actions (Hidden when printing) */}
        <div className="invoice-modal-footer bg-slate-950 px-6 py-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 no-print">
          <button
            onClick={handleNewBill}
            type="button"
            className="invoice-btn-secondary w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 border border-slate-700 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>New Bill Session</span>
          </button>

          <div className="w-full sm:w-auto flex items-center space-x-2.5">
            <button
              onClick={onClose}
              type="button"
              className="invoice-btn-close px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
            >
              Close
            </button>

            <button
              onClick={handlePrint}
              type="button"
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black rounded-xl text-xs transition flex items-center justify-center space-x-2 shadow-lg cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice / Receipt</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
