import { writable, derived } from 'svelte/store';
import type { Quotation, Invoice, LineItem } from '$lib/services/sales-db';
import * as salesDB from '$lib/services/sales-db';

interface SalesState {
  quotations: Quotation[];
  invoices: Invoice[];
  selectedQuotation: Quotation | null;
  selectedInvoice: Invoice | null;
  isLoading: boolean;
}

const initialState: SalesState = {
  quotations: [],
  invoices: [],
  selectedQuotation: null,
  selectedInvoice: null,
  isLoading: false,
};

function createSalesStore() {
  const { subscribe, set, update } = writable<SalesState>(initialState);

  return {
    subscribe,

    // Initialize
    async initialize() {
      update(state => ({ ...state, isLoading: true }));
      try {
        await salesDB.initSalesDB();
        const quotations = await salesDB.getAllQuotations();
        const invoices = await salesDB.getAllInvoices();

        update(state => ({
          ...state,
          quotations,
          invoices,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to initialize Sales:', error);
        update(state => ({ ...state, isLoading: false }));
      }
    },

    // Quotation operations
    async createQuotation(quotation: Omit<Quotation, 'id' | 'createdAt' | 'updatedAt' | 'quotationNumber'>) {
      const count = await salesDB.getAllQuotations();
      const quotationNumber = `QT-${new Date().getFullYear()}-${String(count.length + 1).padStart(4, '0')}`;

      const newQuotation: Quotation = {
        id: `quotation-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        quotationNumber,
        clientName: quotation.clientName,
        clientEmail: quotation.clientEmail,
        clientAddress: quotation.clientAddress,
        status: quotation.status,
        lineItems: quotation.lineItems.map(item => ({ ...item })),
        subtotal: quotation.subtotal,
        taxTotal: quotation.taxTotal,
        discountTotal: quotation.discountTotal,
        total: quotation.total,
        currency: quotation.currency,
        validUntil: quotation.validUntil,
        notes: quotation.notes || '',
        terms: quotation.terms || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await salesDB.saveQuotation(newQuotation);
      update(state => ({
        ...state,
        quotations: [...state.quotations, newQuotation],
      }));

      return newQuotation;
    },

    async updateQuotation(id: string, updates: Partial<Quotation>) {
      const quotation = await salesDB.getQuotation(id);
      if (!quotation) return;

      const updatedQuotation: Quotation = {
        ...quotation,
        ...updates,
        updatedAt: Date.now(),
      };

      await salesDB.saveQuotation(updatedQuotation);

      update(state => ({
        ...state,
        quotations: state.quotations.map(q =>
          q.id === id ? updatedQuotation : q
        ),
      }));
    },

    async deleteQuotation(id: string) {
      await salesDB.deleteQuotation(id);
      update(state => ({
        ...state,
        quotations: state.quotations.filter(q => q.id !== id),
        selectedQuotation: state.selectedQuotation?.id === id ? null : state.selectedQuotation,
      }));
    },

    async convertQuotationToInvoice(quotationId: string, dueDate: number) {
      const quotation = await salesDB.getQuotation(quotationId);
      if (!quotation) return;

      const count = await salesDB.getAllInvoices();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count.length + 1).padStart(4, '0')}`;

      const invoice: Invoice = {
        id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber,
        quotationId: quotation.id,
        clientName: quotation.clientName,
        clientEmail: quotation.clientEmail,
        clientAddress: quotation.clientAddress,
        status: 'draft',
        lineItems: quotation.lineItems.map(item => ({ ...item })),
        subtotal: quotation.subtotal,
        taxTotal: quotation.taxTotal,
        discountTotal: quotation.discountTotal,
        total: quotation.total,
        currency: quotation.currency,
        dueDate,
        notes: quotation.notes,
        terms: quotation.terms,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await salesDB.saveInvoice(invoice);
      await this.updateQuotation(quotationId, {
        status: 'accepted',
        convertedToInvoiceId: invoice.id
      });

      update(state => ({
        ...state,
        invoices: [...state.invoices, invoice],
      }));

      return invoice;
    },

    selectQuotation(quotation: Quotation | null) {
      update(state => ({ ...state, selectedQuotation: quotation }));
    },

    // Invoice operations
    async createInvoice(invoice: Omit<Invoice, 'id' | 'createdAt' | 'updatedAt' | 'invoiceNumber'>) {
      const count = await salesDB.getAllInvoices();
      const invoiceNumber = `INV-${new Date().getFullYear()}-${String(count.length + 1).padStart(4, '0')}`;

      const newInvoice: Invoice = {
        id: `invoice-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        invoiceNumber,
        quotationId: invoice.quotationId,
        clientName: invoice.clientName,
        clientEmail: invoice.clientEmail,
        clientAddress: invoice.clientAddress,
        status: invoice.status,
        lineItems: invoice.lineItems.map(item => ({ ...item })),
        subtotal: invoice.subtotal,
        taxTotal: invoice.taxTotal,
        discountTotal: invoice.discountTotal,
        total: invoice.total,
        currency: invoice.currency,
        dueDate: invoice.dueDate,
        notes: invoice.notes || '',
        terms: invoice.terms || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await salesDB.saveInvoice(newInvoice);
      update(state => ({
        ...state,
        invoices: [...state.invoices, newInvoice],
      }));

      return newInvoice;
    },

    async updateInvoice(id: string, updates: Partial<Invoice>) {
      const invoice = await salesDB.getInvoice(id);
      if (!invoice) return;

      const updatedInvoice: Invoice = {
        ...invoice,
        ...updates,
        updatedAt: Date.now(),
      };

      await salesDB.saveInvoice(updatedInvoice);

      update(state => ({
        ...state,
        invoices: state.invoices.map(i =>
          i.id === id ? updatedInvoice : i
        ),
      }));
    },

    async deleteInvoice(id: string) {
      await salesDB.deleteInvoice(id);
      update(state => ({
        ...state,
        invoices: state.invoices.filter(i => i.id !== id),
        selectedInvoice: state.selectedInvoice?.id === id ? null : state.selectedInvoice,
      }));
    },

    selectInvoice(invoice: Invoice | null) {
      update(state => ({ ...state, selectedInvoice: invoice }));
    },

    reset() {
      set(initialState);
    },
  };
}

export const salesStore = createSalesStore();

// Derived stores
export const quotationsByStatus = derived(salesStore, $sales => {
  return {
    draft: $sales.quotations.filter(q => q.status === 'draft'),
    sent: $sales.quotations.filter(q => q.status === 'sent'),
    accepted: $sales.quotations.filter(q => q.status === 'accepted'),
    rejected: $sales.quotations.filter(q => q.status === 'rejected'),
    expired: $sales.quotations.filter(q => q.status === 'expired'),
  };
});

export const invoicesByStatus = derived(salesStore, $sales => {
  return {
    draft: $sales.invoices.filter(i => i.status === 'draft'),
    sent: $sales.invoices.filter(i => i.status === 'sent'),
    paid: $sales.invoices.filter(i => i.status === 'paid'),
    overdue: $sales.invoices.filter(i => i.status === 'overdue'),
    cancelled: $sales.invoices.filter(i => i.status === 'cancelled'),
  };
});

export const totalQuotationValue = derived(salesStore, $sales => {
  return $sales.quotations
    .filter(q => q.status !== 'rejected' && q.status !== 'expired')
    .reduce((sum, q) => sum + q.total, 0);
});

export const totalInvoiceValue = derived(salesStore, $sales => {
  return $sales.invoices
    .filter(i => i.status !== 'cancelled')
    .reduce((sum, i) => sum + i.total, 0);
});

export const totalPaidValue = derived(salesStore, $sales => {
  return $sales.invoices
    .filter(i => i.status === 'paid')
    .reduce((sum, i) => sum + i.total, 0);
});
