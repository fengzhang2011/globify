import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'globify-sales';
const DB_VERSION = 1;
const QUOTATIONS_STORE = 'quotations';
const INVOICES_STORE = 'invoices';
const LINE_ITEMS_STORE = 'lineItems';

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  taxRate: number; // percentage
  discount: number; // percentage
  total: number; // calculated
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  lineItems: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  validUntil: number;
  notes: string;
  terms: string;
  createdAt: number;
  updatedAt: number;
  convertedToInvoiceId?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  quotationId?: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  lineItems: LineItem[];
  subtotal: number;
  taxTotal: number;
  discountTotal: number;
  total: number;
  currency: string;
  dueDate: number;
  paidDate?: number;
  notes: string;
  terms: string;
  createdAt: number;
  updatedAt: number;
}

let db: IDBPDatabase | null = null;

export async function initSalesDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, newVersion, transaction) {
      // Quotations store
      if (!database.objectStoreNames.contains(QUOTATIONS_STORE)) {
        const quotationsStore = database.createObjectStore(QUOTATIONS_STORE, { keyPath: 'id' });
        quotationsStore.createIndex('status', 'status');
        quotationsStore.createIndex('quotationNumber', 'quotationNumber');
        quotationsStore.createIndex('createdAt', 'createdAt');
        quotationsStore.createIndex('validUntil', 'validUntil');
      }

      // Invoices store
      if (!database.objectStoreNames.contains(INVOICES_STORE)) {
        const invoicesStore = database.createObjectStore(INVOICES_STORE, { keyPath: 'id' });
        invoicesStore.createIndex('status', 'status');
        invoicesStore.createIndex('invoiceNumber', 'invoiceNumber');
        invoicesStore.createIndex('dueDate', 'dueDate');
        invoicesStore.createIndex('createdAt', 'createdAt');
      }
    },
  });

  return db;
}

// Quotation operations
export async function saveQuotation(quotation: Quotation): Promise<void> {
  const database = await initSalesDB();
  await database.put(QUOTATIONS_STORE, quotation);
}

export async function getQuotation(id: string): Promise<Quotation | undefined> {
  const database = await initSalesDB();
  return await database.get(QUOTATIONS_STORE, id);
}

export async function getAllQuotations(): Promise<Quotation[]> {
  const database = await initSalesDB();
  return await database.getAll(QUOTATIONS_STORE);
}

export async function getQuotationsByStatus(status: Quotation['status']): Promise<Quotation[]> {
  const database = await initSalesDB();
  return await database.getAllFromIndex(QUOTATIONS_STORE, 'status', status);
}

export async function deleteQuotation(id: string): Promise<void> {
  const database = await initSalesDB();
  await database.delete(QUOTATIONS_STORE, id);
}

// Invoice operations
export async function saveInvoice(invoice: Invoice): Promise<void> {
  const database = await initSalesDB();
  await database.put(INVOICES_STORE, invoice);
}

export async function getInvoice(id: string): Promise<Invoice | undefined> {
  const database = await initSalesDB();
  return await database.get(INVOICES_STORE, id);
}

export async function getAllInvoices(): Promise<Invoice[]> {
  const database = await initSalesDB();
  return await database.getAll(INVOICES_STORE);
}

export async function getInvoicesByStatus(status: Invoice['status']): Promise<Invoice[]> {
  const database = await initSalesDB();
  return await database.getAllFromIndex(INVOICES_STORE, 'status', status);
}

export async function deleteInvoice(id: string): Promise<void> {
  const database = await initSalesDB();
  await database.delete(INVOICES_STORE, id);
}

// Helper function to calculate totals
export function calculateLineItemTotal(item: LineItem): number {
  const subtotal = item.quantity * item.unitPrice;
  const discountAmount = subtotal * (item.discount / 100);
  const afterDiscount = subtotal - discountAmount;
  const taxAmount = afterDiscount * (item.taxRate / 100);
  return afterDiscount + taxAmount;
}

export function calculateTotals(lineItems: LineItem[]) {
  const subtotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const discountTotal = lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    return sum + (itemSubtotal * (item.discount / 100));
  }, 0);
  const afterDiscount = subtotal - discountTotal;
  const taxTotal = lineItems.reduce((sum, item) => {
    const itemSubtotal = item.quantity * item.unitPrice;
    const itemDiscount = itemSubtotal * (item.discount / 100);
    const itemAfterDiscount = itemSubtotal - itemDiscount;
    return sum + (itemAfterDiscount * (item.taxRate / 100));
  }, 0);
  const total = afterDiscount + taxTotal;

  return {
    subtotal,
    discountTotal,
    taxTotal,
    total,
  };
}
