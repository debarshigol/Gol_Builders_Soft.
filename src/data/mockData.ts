import { Product, Customer, Invoice, Quotation, OwnerUser } from '@/types';

export const initialProducts: Product[] = [];
export const initialCustomers: Customer[] = [];
export const initialInvoices: Invoice[] = [];
export const initialQuotations: Quotation[] = [];

export interface MockOwnerCredential extends OwnerUser {
  password?: string;
}

export const initialOwnerUsers: MockOwnerCredential[] = [];
