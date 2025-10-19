<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Textarea } from '$lib/components/ui/textarea';
  import { crmStore, opportunitiesByStage, pipelineValue, wonValue } from '$lib/stores/crm';
  import type { Opportunity } from '$lib/services/crm-db';
  import { cn } from '$lib/utils';

  let crm = $state($crmStore);
  let oppByStage = $state($opportunitiesByStage);
  let totalPipelineValue = $state($pipelineValue);
  let totalWonValue = $state($wonValue);

  $effect(() => {
    crm = $crmStore;
    oppByStage = $opportunitiesByStage;
    totalPipelineValue = $pipelineValue;
    totalWonValue = $wonValue;
  });

  let showAddOpportunity = $state(false);
  let showEditOpportunity = $state(false);
  let selectedOpportunity = $state<Opportunity | null>(null);

  let showDialog = $derived(showAddOpportunity || showEditOpportunity);

  let formData = $state({
    name: '',
    company: '',
    contactName: '',
    contactEmail: '',
    value: 0,
    currency: 'USD',
    stage: 'prospecting' as Opportunity['stage'],
    probability: 10,
    expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    assignedTo: 'You',
    notes: '',
    tags: [] as string[],
  });

  const stages: Array<{ key: Opportunity['stage']; label: string; color: string }> = [
    { key: 'prospecting', label: 'Prospecting', color: 'bg-slate-100 border-slate-300' },
    { key: 'qualification', label: 'Qualification', color: 'bg-blue-100 border-blue-300' },
    { key: 'proposal', label: 'Proposal', color: 'bg-purple-100 border-purple-300' },
    { key: 'negotiation', label: 'Negotiation', color: 'bg-amber-100 border-amber-300' },
    { key: 'closed_won', label: 'Closed Won', color: 'bg-green-100 border-green-300' },
    { key: 'closed_lost', label: 'Closed Lost', color: 'bg-red-100 border-red-300' },
  ];

  onMount(async () => {
    await crmStore.initialize();
  });

  function openAddDialog() {
    formData = {
      name: '',
      company: '',
      contactName: '',
      contactEmail: '',
      value: 0,
      currency: 'USD',
      stage: 'prospecting',
      probability: 10,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      assignedTo: 'You',
      notes: '',
      tags: [],
    };
    showAddOpportunity = true;
  }

  function openEditDialog(opp: Opportunity) {
    selectedOpportunity = opp;
    formData = {
      name: opp.name,
      company: opp.company,
      contactName: opp.contactName,
      contactEmail: opp.contactEmail,
      value: opp.value,
      currency: opp.currency,
      stage: opp.stage,
      probability: opp.probability,
      expectedCloseDate: new Date(opp.expectedCloseDate).toISOString().split('T')[0],
      assignedTo: opp.assignedTo,
      notes: opp.notes,
      tags: opp.tags || [],
    };
    showEditOpportunity = true;
  }

  async function handleSaveOpportunity() {
    if (!formData.name.trim() || !formData.company.trim()) {
      alert('Please fill in required fields');
      return;
    }

    // Create a plain object to avoid DataClone errors
    const opportunityData = {
      name: formData.name.trim(),
      company: formData.company.trim(),
      contactName: formData.contactName.trim(),
      contactEmail: formData.contactEmail.trim(),
      value: Number(formData.value),
      currency: formData.currency,
      stage: formData.stage,
      probability: Number(formData.probability),
      expectedCloseDate: new Date(formData.expectedCloseDate).getTime(),
      assignedTo: formData.assignedTo.trim(),
      notes: formData.notes.trim(),
      tags: [...formData.tags], // Create a new plain array
    };

    if (showEditOpportunity && selectedOpportunity) {
      await crmStore.updateOpportunity(selectedOpportunity.id, opportunityData);
    } else {
      await crmStore.createOpportunity(opportunityData);
    }

    showAddOpportunity = false;
    showEditOpportunity = false;
    selectedOpportunity = null;
  }

  async function handleDeleteOpportunity(id: string) {
    if (confirm('Are you sure you want to delete this opportunity?')) {
      await crmStore.deleteOpportunity(id);
    }
  }

  async function moveOpportunity(oppId: string, newStage: Opportunity['stage']) {
    const opp = crm.opportunities.find(o => o.id === oppId);
    if (!opp) return;

    const updates: Partial<Opportunity> = { stage: newStage };

    // Update probability based on stage
    const probabilities = {
      prospecting: 10,
      qualification: 25,
      proposal: 50,
      negotiation: 75,
      closed_won: 100,
      closed_lost: 0,
    };
    updates.probability = probabilities[newStage];

    // Set closed date if won or lost
    if (newStage === 'closed_won' || newStage === 'closed_lost') {
      updates.closedAt = Date.now();
    }

    await crmStore.updateOpportunity(oppId, updates);
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

  let draggedOpportunity = $state<Opportunity | null>(null);

  function handleDragStart(opp: Opportunity) {
    return (event: DragEvent) => {
      draggedOpportunity = opp;
      if (event.dataTransfer) {
        event.dataTransfer.effectAllowed = 'move';
      }
    };
  }

  function handleDragOver(event: DragEvent) {
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  function handleDrop(stage: Opportunity['stage']) {
    return async (event: DragEvent) => {
      event.preventDefault();
      if (draggedOpportunity && draggedOpportunity.stage !== stage) {
        await moveOpportunity(draggedOpportunity.id, stage);
      }
      draggedOpportunity = null;
    };
  }
</script>

<div class="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => goto('/')}>
            ←
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">💼 CRM - Sales Pipeline</h1>
            <p class="text-sm text-slate-600">Track leads and close opportunities</p>
          </div>
        </div>
        <div class="flex items-center gap-4">
          <div class="text-right">
            <p class="text-xs text-slate-500">Pipeline Value</p>
            <p class="text-lg font-bold text-blue-600">{formatCurrency(totalPipelineValue)}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-slate-500">Won Value</p>
            <p class="text-lg font-bold text-green-600">{formatCurrency(totalWonValue)}</p>
          </div>
          <Button onclick={openAddDialog}>+ Add Opportunity</Button>
        </div>
      </div>
    </div>
  </div>

  <!-- Pipeline Board -->
  <div class="p-6">
    <div class="grid grid-cols-6 gap-4">
      {#each stages as stage}
        <div
          class="flex flex-col"
          ondragover={handleDragOver}
          ondrop={handleDrop(stage.key)}
        >
          <!-- Column Header -->
          <div class={cn("p-3 rounded-t-lg border-2", stage.color)}>
            <h3 class="font-semibold text-sm">{stage.label}</h3>
            <p class="text-xs text-slate-600 mt-1">
              {oppByStage[stage.key].length} deal{oppByStage[stage.key].length !== 1 ? 's' : ''}
              {#if oppByStage[stage.key].length > 0}
                · {formatCurrency(oppByStage[stage.key].reduce((sum, o) => sum + o.value, 0))}
              {/if}
            </p>
          </div>

          <!-- Opportunities in this stage -->
          <div class="flex-1 bg-slate-50 border-2 border-t-0 border-slate-200 rounded-b-lg p-2 min-h-[500px] space-y-2">
            {#each oppByStage[stage.key] as opp (opp.id)}
              <Card
                class="p-3 cursor-move hover:shadow-md transition-shadow bg-white gap-0"
                draggable="true"
                ondragstart={handleDragStart(opp)}
              >
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-semibold text-sm line-clamp-1">{opp.name}</h4>
                  <div class="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      class="h-6 w-6"
                      onclick={(e) => { e.stopPropagation(); openEditDialog(opp); }}
                      title="Edit"
                    >
                      ✏️
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      class="h-6 w-6 hover:bg-red-50"
                      onclick={(e) => { e.stopPropagation(); handleDeleteOpportunity(opp.id); }}
                      title="Delete"
                    >
                      🗑️
                    </Button>
                  </div>
                </div>

                <p class="text-xs text-slate-600 mb-2">{opp.company}</p>

                <div class="flex items-center justify-between mt-2">
                  <p class="text-sm font-bold text-green-600">{formatCurrency(opp.value, opp.currency)}</p>
                  <span class="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded">{opp.probability}%</span>
                </div>

                <div class="flex items-center justify-between mt-2 text-xs text-slate-500">
                  <span>👤 {opp.assignedTo}</span>
                  <span>📅 {formatDate(opp.expectedCloseDate)}</span>
                </div>

                {#if opp.notes}
                  <p class="text-xs text-slate-500 mt-2 line-clamp-2">{opp.notes}</p>
                {/if}
              </Card>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  </div>
</div>

<!-- Add/Edit Opportunity Dialog -->
<Dialog.Root open={showDialog}>
  <Dialog.Content class="sm:max-w-[600px]">
    <Dialog.Header>
      <Dialog.Title>{showEditOpportunity ? 'Edit' : 'Add New'} Opportunity</Dialog.Title>
    </Dialog.Header>
    <div class="space-y-4 py-4">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Opportunity Name *</Label>
          <Input bind:value={formData.name} placeholder="e.g., Enterprise License Deal" />
        </div>
        <div>
          <Label>Company *</Label>
          <Input bind:value={formData.company} placeholder="Company name" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Contact Name</Label>
          <Input bind:value={formData.contactName} placeholder="Primary contact" />
        </div>
        <div>
          <Label>Contact Email</Label>
          <Input type="email" bind:value={formData.contactEmail} placeholder="email@company.com" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <Label>Value *</Label>
          <Input type="number" bind:value={formData.value} min="0" step="100" />
        </div>
        <div>
          <Label>Currency</Label>
          <select bind:value={formData.currency} class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="GBP">GBP</option>
          </select>
        </div>
        <div>
          <Label>Probability (%)</Label>
          <Input type="number" bind:value={formData.probability} min="0" max="100" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Stage</Label>
          <select bind:value={formData.stage} class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm">
            {#each stages as stage}
              <option value={stage.key}>{stage.label}</option>
            {/each}
          </select>
        </div>
        <div>
          <Label>Expected Close Date</Label>
          <Input type="date" bind:value={formData.expectedCloseDate} />
        </div>
      </div>

      <div>
        <Label>Assigned To</Label>
        <Input bind:value={formData.assignedTo} placeholder="Owner name" />
      </div>

      <div>
        <Label>Notes</Label>
        <Textarea bind:value={formData.notes} placeholder="Additional notes..." rows={3} />
      </div>
    </div>
    <Dialog.Footer>
      <Button variant="secondary" onclick={() => { showAddOpportunity = false; showEditOpportunity = false; }}>
        Cancel
      </Button>
      <Button onclick={handleSaveOpportunity}>Save</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
