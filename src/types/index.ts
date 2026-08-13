export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  costPrice: number;
  stock: number;
  sku: string;
  unit: string;
  imageEmoji: string;
}

export interface Customer {
  id: string;
  phone: string;
  name: string;
  address: string;
  registeredAt: string;
  totalPurchases: number;
  totalSpent: number;
  totalDue: number; // Accumulated unpaid due balance
}

export interface CartItem {
  product: Product;
  quantity: number;
  hsnCode?: string;
}

export type PaymentMethod = 'Cash' | 'UPI' | 'Card' | 'Store Credit';

export interface Invoice {
  id: string;
  customerPhone: string;
  customerName: string;
  customerAddress: string;
  items: CartItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;      // Amount collected from customer
  dueAmount: number;       // Balance remaining due after this transaction
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Partial' | 'Unpaid';
  createdAt: string;
  status: 'Completed' | 'Pending';
  isSettlementReceipt?: boolean; // True if this is a Past Due Clearance / Settlement Receipt
  previousDue?: number;          // Total due before this settlement payment
  isGstInvoice?: boolean;        // True if this is a formal manual/POS GST Tax Invoice
  customerGstin?: string;       // Customer GSTIN number if applicable
  cgstAmount?: number;          // Central GST amount (taxAmount / 2)
  sgstAmount?: number;          // State GST amount (taxAmount / 2)
}

export interface QuotationItem {
  product: Product;
  quantity: number;
  quotedPrice: number;
  hsnCode?: string;
}

export type QuotationStatus = 'Pending Follow-up' | 'Followed Up' | 'Converted to Sale' | 'Cancelled';

export interface Quotation {
  id: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  notes?: string;
  items: QuotationItem[];
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  discount: number;
  totalAmount: number;
  createdAt: string;
  validUntil: string;
  status: QuotationStatus;
  isTargeted?: boolean;
  ownerCallLog?: {
    lastCalledAt: string;
    ownerNotes: string;
  };
}

export type UserRole = 'shopkeeper' | 'owner';
