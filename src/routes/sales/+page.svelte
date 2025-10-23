<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as Tabs from '$lib/components/ui/tabs';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import { Textarea } from '$lib/components/ui/textarea';
  import { salesStore, quotationsByStatus, invoicesByStatus, totalQuotationValue, totalInvoiceValue, totalPaidValue } from '$lib/stores/sales';
  import type { Quotation, Invoice, LineItem } from '$lib/services/sales-db';
  import { calculateTotals } from '$lib/services/sales-db';
  import { cn } from '$lib/utils';

  let sales = $state($salesStore);
  let quotByStatus = $state($quotationsByStatus);
  let invByStatus = $state($invoicesByStatus);
  let quotValue = $state($totalQuotationValue);
  let invValue = $state($totalInvoiceValue);
  let paidValue = $state($totalPaidValue);

  $effect(() => {
    sales = $salesStore;
    quotByStatus = $quotationsByStatus;
    invByStatus = $invoicesByStatus;
    quotValue = $totalQuotationValue;
    invValue = $totalInvoiceValue;
    paidValue = $totalPaidValue;
  });

  let showQuotationDialog = $state(false);
  let showInvoiceDialog = $state(false);
  let editingQuotation = $state<Quotation | null>(null);
  let editingInvoice = $state<Invoice | null>(null);

  let quotationForm = $state({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    currency: 'USD',
    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: 'Payment due within 30 days',
  });

  let invoiceForm = $state({
    clientName: '',
    clientEmail: '',
    clientAddress: '',
    currency: 'USD',
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: '',
    terms: 'Payment due within 30 days',
  });

  let lineItems = $state<LineItem[]>([
    { id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0, total: 0 }
  ]);

  onMount(async () => {
    await salesStore.initialize();
  });

  function addLineItem() {
    lineItems = [...lineItems, {
      id: String(Date.now()),
      description: '',
      quantity: 1,
      unitPrice: 0,
      taxRate: 0,
      discount: 0,
      total: 0
    }];
  }

  function removeLineItem(id: string) {
    lineItems = lineItems.filter(item => item.id !== id);
  }

  function calculateLineTotal(item: LineItem): number {
    const subtotal = item.quantity * item.unitPrice;
    const discount = subtotal * (item.discount / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (item.taxRate / 100);
    return afterDiscount + tax;
  }

  let totals = $derived(calculateTotals(lineItems));

  function openQuotationDialog() {
    editingQuotation = null;
    quotationForm = {
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      currency: 'USD',
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      terms: 'Payment due within 30 days',
    };
    lineItems = [{ id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0, total: 0 }];
    showQuotationDialog = true;
  }

  function openInvoiceDialog() {
    editingInvoice = null;
    invoiceForm = {
      clientName: '',
      clientEmail: '',
      clientAddress: '',
      currency: 'USD',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      notes: '',
      terms: 'Payment due within 30 days',
    };
    lineItems = [{ id: '1', description: '', quantity: 1, unitPrice: 0, taxRate: 0, discount: 0, total: 0 }];
    showInvoiceDialog = true;
  }

  async function saveQuotation() {
    if (!quotationForm.clientName.trim()) {
      alert('Please enter client name');
      return;
    }

    const quotationData = {
      clientName: quotationForm.clientName.trim(),
      clientEmail: quotationForm.clientEmail.trim(),
      clientAddress: quotationForm.clientAddress.trim(),
      status: 'draft' as const,
      lineItems: lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discount: Number(item.discount),
        total: calculateLineTotal(item),
      })),
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      currency: quotationForm.currency,
      validUntil: new Date(quotationForm.validUntil).getTime(),
      notes: quotationForm.notes,
      terms: quotationForm.terms,
    };

    await salesStore.createQuotation(quotationData);
    showQuotationDialog = false;
  }

  async function saveInvoice() {
    if (!invoiceForm.clientName.trim()) {
      alert('Please enter client name');
      return;
    }

    const invoiceData = {
      clientName: invoiceForm.clientName.trim(),
      clientEmail: invoiceForm.clientEmail.trim(),
      clientAddress: invoiceForm.clientAddress.trim(),
      status: 'draft' as const,
      lineItems: lineItems.map(item => ({
        id: item.id,
        description: item.description,
        quantity: Number(item.quantity),
        unitPrice: Number(item.unitPrice),
        taxRate: Number(item.taxRate),
        discount: Number(item.discount),
        total: calculateLineTotal(item),
      })),
      subtotal: totals.subtotal,
      taxTotal: totals.taxTotal,
      discountTotal: totals.discountTotal,
      total: totals.total,
      currency: invoiceForm.currency,
      dueDate: new Date(invoiceForm.dueDate).getTime(),
      notes: invoiceForm.notes,
      terms: invoiceForm.terms,
    };

    await salesStore.createInvoice(invoiceData);
    showInvoiceDialog = false;
  }

  async function convertToInvoice(quotation: Quotation) {
    const dueDate = Date.now() + 30 * 24 * 60 * 60 * 1000;
    await salesStore.convertQuotationToInvoice(quotation.id, dueDate);
  }

  async function updateQuotationStatus(id: string, status: Quotation['status']) {
    await salesStore.updateQuotation(id, { status });
  }

  async function updateInvoiceStatus(id: string, status: Invoice['status']) {
    const updates: Partial<Invoice> = { status };
    if (status === 'paid') {
      updates.paidDate = Date.now();
    }
    await salesStore.updateInvoice(id, updates);
  }

  function formatCurrency(value: number, currency: string = 'USD'): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
    }).format(value);
  }

  function formatDate(timestamp: number): string {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const quotationStatuses: Array<{ key: Quotation['status']; label: string; color: string }> = [
    { key: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { key: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
    { key: 'accepted', label: 'Accepted', color: 'bg-green-100 text-green-800' },
    { key: 'rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
    { key: 'expired', label: 'Expired', color: 'bg-orange-100 text-orange-800' },
  ];

  const invoiceStatuses: Array<{ key: Invoice['status']; label: string; color: string }> = [
    { key: 'draft', label: 'Draft', color: 'bg-gray-100 text-gray-800' },
    { key: 'sent', label: 'Sent', color: 'bg-blue-100 text-blue-800' },
    { key: 'paid', label: 'Paid', color: 'bg-green-100 text-green-800' },
    { key: 'overdue', label: 'Overdue', color: 'bg-red-100 text-red-800' },
    { key: 'cancelled', label: 'Cancelled', color: 'bg-gray-100 text-gray-800' },
  ];
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-purple-50">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => goto('/')}>
            ←
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">📄 Sales - Quotations & Invoices</h1>
            <p class="text-sm text-slate-600">Manage quotes and invoices</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-xs text-slate-500">Quotations</p>
            <p class="text-lg font-bold text-blue-600">{formatCurrency(quotValue)}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Invoiced</p>
            <p class="text-lg font-bold text-purple-600">{formatCurrency(invValue)}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Paid</p>
            <p class="text-lg font-bold text-green-600">{formatCurrency(paidValue)}</p>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Main Content -->
  <div class="p-6">
    <Tabs.Root value="quotations" class="w-full">
      <Tabs.List class="grid w-full grid-cols-2 max-w-md mx-auto mb-6">
        <Tabs.Trigger value="quotations">Quotations</Tabs.Trigger>
        <Tabs.Trigger value="invoices">Invoices</Tabs.Trigger>
      </Tabs.List>

      <!-- Quotations Tab -->
      <Tabs.Content value="quotations">
        <div class="flex justify-end mb-4">
          <Button onclick={openQuotationDialog}>+ New Quotation</Button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each sales.quotations as quotation (quotation.id)}
            <Card class="p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <p class="font-mono text-sm font-bold text-slate-900">{quotation.quotationNumber}</p>
                  <p class="text-xs text-slate-500 mt-1">Valid until {formatDate(quotation.validUntil)}</p>
                </div>
                <span class={cn("text-xs px-2 py-1 rounded font-medium", quotationStatuses.find(s => s.key === quotation.status)?.color)}>
                  {quotationStatuses.find(s => s.key === quotation.status)?.label}
                </span>
              </div>

              <div class="mb-3">
                <p class="font-semibold text-slate-900">{quotation.clientName}</p>
                <p class="text-xs text-slate-600">{quotation.clientEmail}</p>
              </div>

              <div class="border-t pt-3 mb-3">
                <p class="text-2xl font-bold text-green-600">{formatCurrency(quotation.total, quotation.currency)}</p>
                <p class="text-xs text-slate-500">{quotation.lineItems.length} item{quotation.lineItems.length !== 1 ? 's' : ''}</p>
              </div>

              <div class="flex gap-2">
                {#if quotation.status === 'draft'}
                  <Button size="sm" variant="outline" class="flex-1" onclick={() => updateQuotationStatus(quotation.id, 'sent')}>
                    Send
                  </Button>
                {/if}
                {#if quotation.status === 'sent'}
                  <Button size="sm" variant="outline" class="flex-1" onclick={() => convertToInvoice(quotation)}>
                    Convert to Invoice
                  </Button>
                {/if}
                {#if quotation.status === 'accepted' && !quotation.convertedToInvoiceId}
                  <Button size="sm" variant="outline" class="flex-1" onclick={() => convertToInvoice(quotation)}>
                    Create Invoice
                  </Button>
                {/if}
              </div>
            </Card>
          {/each}
        </div>
      </Tabs.Content>

      <!-- Invoices Tab -->
      <Tabs.Content value="invoices">
        <div class="flex justify-end mb-4">
          <Button onclick={openInvoiceDialog}>+ New Invoice</Button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {#each sales.invoices as invoice (invoice.id)}
            <Card class="p-4">
              <div class="flex justify-between items-start mb-3">
                <div>
                  <p class="font-mono text-sm font-bold text-slate-900">{invoice.invoiceNumber}</p>
                  <p class="text-xs text-slate-500 mt-1">Due {formatDate(invoice.dueDate)}</p>
                </div>
                <span class={cn("text-xs px-2 py-1 rounded font-medium", invoiceStatuses.find(s => s.key === invoice.status)?.color)}>
                  {invoiceStatuses.find(s => s.key === invoice.status)?.label}
                </span>
              </div>

              <div class="mb-3">
                <p class="font-semibold text-slate-900">{invoice.clientName}</p>
                <p class="text-xs text-slate-600">{invoice.clientEmail}</p>
              </div>

              <div class="border-t pt-3 mb-3">
                <p class="text-2xl font-bold text-purple-600">{formatCurrency(invoice.total, invoice.currency)}</p>
                <p class="text-xs text-slate-500">{invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}</p>
                {#if invoice.paidDate}
                  <p class="text-xs text-green-600 mt-1">Paid on {formatDate(invoice.paidDate)}</p>
                {/if}
              </div>

              <div class="flex gap-2">
                {#if invoice.status === 'draft'}
                  <Button size="sm" variant="outline" class="flex-1" onclick={() => updateInvoiceStatus(invoice.id, 'sent')}>
                    Send
                  </Button>
                {/if}
                {#if invoice.status === 'sent'}
                  <Button size="sm" class="flex-1 bg-green-600 hover:bg-green-700" onclick={() => updateInvoiceStatus(invoice.id, 'paid')}>
                    Mark Paid
                  </Button>
                {/if}
              </div>
            </Card>
          {/each}
        </div>
      </Tabs.Content>
    </Tabs.Root>
  </div>
</div>

<!-- Quotation Dialog -->
<Dialog.Root open={showQuotationDialog}>
  <Dialog.Content class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>New Quotation</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Client Name *</Label>
          <Input bind:value={quotationForm.clientName} placeholder="Client name" />
        </div>
        <div>
          <Label>Client Email</Label>
          <Input type="email" bind:value={quotationForm.clientEmail} placeholder="email@example.com" />
        </div>
      </div>

      <div>
        <Label>Client Address</Label>
        <Textarea bind:value={quotationForm.clientAddress} placeholder="Full address" rows={2} />
      </div>

      <div class="border-t pt-4">
        <div class="flex justify-between items-center mb-3">
          <Label class="text-base font-semibold">Line Items</Label>
          <Button size="sm" variant="outline" onclick={addLineItem}>+ Add Item</Button>
        </div>

        {#each lineItems as item, index (item.id)}
          <div class="grid grid-cols-12 gap-2 mb-2">
            <div class="col-span-4">
              <Input bind:value={item.description} placeholder="Description" />
            </div>
            <div class="col-span-2">
              <Input type="number" bind:value={item.quantity} min="1" placeholder="Qty" />
            </div>
            <div class="col-span-2">
              <Input type="number" bind:value={item.unitPrice} min="0" step="0.01" placeholder="Price" />
            </div>
            <div class="col-span-1">
              <Input type="number" bind:value={item.taxRate} min="0" max="100" placeholder="Tax%" />
            </div>
            <div class="col-span-1">
              <Input type="number" bind:value={item.discount} min="0" max="100" placeholder="Disc%" />
            </div>
            <div class="col-span-1 flex items-center justify-center">
              <p class="text-sm font-semibold">{formatCurrency(calculateLineTotal(item))}</p>
            </div>
            <div class="col-span-1 flex items-center">
              <Button size="icon" variant="ghost" class="h-8 w-8" onclick={() => removeLineItem(item.id)}>🗑️</Button>
            </div>
          </div>
        {/each}

        <div class="border-t mt-4 pt-3 space-y-1">
          <div class="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div class="flex justify-between text-sm text-red-600">
            <span>Discount:</span>
            <span>-{formatCurrency(totals.discountTotal)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Tax:</span>
            <span>{formatCurrency(totals.taxTotal)}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Currency</Label>
          <select bind:value={quotationForm.currency} class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <Label>Valid Until</Label>
          <Input type="date" bind:value={quotationForm.validUntil} />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea bind:value={quotationForm.notes} placeholder="Additional notes..." rows={2} />
      </div>

      <div>
        <Label>Terms & Conditions</Label>
        <Textarea bind:value={quotationForm.terms} rows={2} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showQuotationDialog = false}>Cancel</Button>
      <Button onclick={saveQuotation}>Create Quotation</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

<!-- Invoice Dialog -->
<Dialog.Root open={showInvoiceDialog}>
  <Dialog.Content class="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>New Invoice</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Client Name *</Label>
          <Input bind:value={invoiceForm.clientName} placeholder="Client name" />
        </div>
        <div>
          <Label>Client Email</Label>
          <Input type="email" bind:value={invoiceForm.clientEmail} placeholder="email@example.com" />
        </div>
      </div>

      <div>
        <Label>Client Address</Label>
        <Textarea bind:value={invoiceForm.clientAddress} placeholder="Full address" rows={2} />
      </div>

      <div class="border-t pt-4">
        <div class="flex justify-between items-center mb-3">
          <Label class="text-base font-semibold">Line Items</Label>
          <Button size="sm" variant="outline" onclick={addLineItem}>+ Add Item</Button>
        </div>

        {#each lineItems as item, index (item.id)}
          <div class="grid grid-cols-12 gap-2 mb-2">
            <div class="col-span-4">
              <Input bind:value={item.description} placeholder="Description" />
            </div>
            <div class="col-span-2">
              <Input type="number" bind:value={item.quantity} min="1" placeholder="Qty" />
            </div>
            <div class="col-span-2">
              <Input type="number" bind:value={item.unitPrice} min="0" step="0.01" placeholder="Price" />
            </div>
            <div class="col-span-1">
              <Input type="number" bind:value={item.taxRate} min="0" max="100" placeholder="Tax%" />
            </div>
            <div class="col-span-1">
              <Input type="number" bind:value={item.discount} min="0" max="100" placeholder="Disc%" />
            </div>
            <div class="col-span-1 flex items-center justify-center">
              <p class="text-sm font-semibold">{formatCurrency(calculateLineTotal(item))}</p>
            </div>
            <div class="col-span-1 flex items-center">
              <Button size="icon" variant="ghost" class="h-8 w-8" onclick={() => removeLineItem(item.id)}>🗑️</Button>
            </div>
          </div>
        {/each}

        <div class="border-t mt-4 pt-3 space-y-1">
          <div class="flex justify-between text-sm">
            <span>Subtotal:</span>
            <span>{formatCurrency(totals.subtotal)}</span>
          </div>
          <div class="flex justify-between text-sm text-red-600">
            <span>Discount:</span>
            <span>-{formatCurrency(totals.discountTotal)}</span>
          </div>
          <div class="flex justify-between text-sm">
            <span>Tax:</span>
            <span>{formatCurrency(totals.taxTotal)}</span>
          </div>
          <div class="flex justify-between text-lg font-bold border-t pt-2">
            <span>Total:</span>
            <span>{formatCurrency(totals.total)}</span>
          </div>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Currency</Label>
          <select bind:value={invoiceForm.currency} class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <Label>Due Date</Label>
          <Input type="date" bind:value={invoiceForm.dueDate} />
        </div>
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea bind:value={invoiceForm.notes} placeholder="Additional notes..." rows={2} />
      </div>

      <div>
        <Label>Terms & Conditions</Label>
        <Textarea bind:value={invoiceForm.terms} rows={2} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showInvoiceDialog = false}>Cancel</Button>
      <Button onclick={saveInvoice}>Create Invoice</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
