<script lang="ts">
  import { selectedDate } from '$lib/okr/stores.js';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { cn } from '$lib/utils';

  export interface KeyDate {
    date: string;
    label: string;
    type: string;
    description?: string;
  }

  let { keyDates = $bindable([
    { date: '2025-09-01', label: 'Q4 Start', type: 'milestone', description: 'Quarter begins' },
    { date: '2025-09-15', label: 'Sprint 1 End', type: 'sprint', description: 'First sprint completion' },
    { date: '2025-10-01', label: 'Mid Quarter Review', type: 'review', description: 'Progress review meeting' },
    { date: '2025-10-08', label: 'Today', type: 'current', description: 'Current date' },
    { date: '2025-10-15', label: 'Sprint 2 End', type: 'sprint', description: 'Second sprint completion' },
    { date: '2025-11-01', label: 'Product Launch', type: 'milestone', description: 'Major product release' },
    { date: '2025-11-15', label: 'Sprint 3 End', type: 'sprint', description: 'Third sprint completion' },
    { date: '2025-12-01', label: 'Final Review', type: 'review', description: 'End of quarter review' },
    { date: '2025-12-15', label: 'Planning Week', type: 'milestone', description: 'Q1 2026 planning' },
    { date: '2025-12-31', label: 'Q4 End', type: 'deadline', description: 'Quarter ends' }
  ]) }: { keyDates?: KeyDate[] } = $props();

  let showOKRSnapshot = $state(false);
  let snapshotDate = $state(null);
  let snapshotOKRs = $state([]);
  let snapshotMeta = $state(null);
  let isLoadingSnapshot = $state(false);
  let hoveredIndex = $state(null);

  // Type colors
  const typeColor: Record<string, string> = {
    milestone: "bg-blue-500",
    sprint: "bg-green-500",
    review: "bg-yellow-500",
    current: "bg-red-500 animate-pulse",
    deadline: "bg-gray-600"
  };

  function getTypeIcon(type) {
    switch(type) {
      case 'milestone': return '🎯';
      case 'review': return '📊';
      case 'current': return '📍';
      case 'deadline': return '⚠️';
      case 'sprint': return '🏃';
      case 'normal': return '';
      default: return '📅';
    }
  }

  // Convert date objects and sort
  const sortedDates = $derived(keyDates
    .map(d => ({ ...d, dateObj: new Date(d.date) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime()));

  // Get earliest and latest dates
  const minDate = $derived(sortedDates[0]?.dateObj.getTime() || 0);
  const maxDate = $derived(sortedDates[sortedDates.length - 1]?.dateObj.getTime() || 0);
  const totalRange = $derived(maxDate - minDate);

  function getPosition(dateObj: Date): string {
    const ratio = (dateObj.getTime() - minDate) / totalRange;
    return `${ratio * 100}%`;
  }

  function handleDateClick(dateStr: string) {
    selectedDate.set(new Date(dateStr));
  }

  async function showOKRSnapshotForDate(dateStr: string) {
    snapshotDate = dateStr;
    isLoadingSnapshot = true;
    showOKRSnapshot = true;

    try {
      const response = await fetch(`/api/okrs?date=${dateStr}`);
      const result = await response.json();
      if (result.success) {
        snapshotOKRs = result.data;
        snapshotMeta = result.meta;
      }
    } catch (error) {
      console.error('Failed to fetch OKR snapshot:', error);
    } finally {
      isLoadingSnapshot = false;
    }
  }

  function getProgressColor(progress) {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  }

  function getRiskColor(risk) {
    switch(risk) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  }
</script>

<div class="pt-5 pb-2 pl-15 pr-15">
  <div class="relative border-t-4 border-gray-900 h-2 w-full mt-20 mb-24">
    {#each sortedDates as item, index}
      <button
        class="absolute flex flex-col items-center text-center cursor-pointer group"
        style={`left:${getPosition(item.dateObj)}; transform: translateX(-50%) translateY(-17px);`}
        onclick={() => showOKRSnapshotForDate(item.date)}
        onmouseenter={() => hoveredIndex = index}
        onmouseleave={() => hoveredIndex = null}
        tabindex="0"
      >
        <div class={cn(
          "w-8 h-8 rounded-full flex items-center justify-center text-white font-semibold z-10 shadow-md transition-all",
          typeColor[item.type] ?? "bg-blue-500",
          hoveredIndex === index && "scale-125 shadow-lg"
        )}>
          {getTypeIcon(item.type)}
        </div>
        {#if index % 2 === 0}
          <div class={`w-[2px] h-7 ${typeColor[item.type] ?? "bg-blue-500"}`}></div>
          <div class={`w-2 h-2 rounded-full ${typeColor[item.type] ?? "bg-blue-500"} flex items-center justify-center text-white font-semibold z-10 shadow-md`}></div>
          <div class={cn(
            "mt-3 w-[160px] transition-all",
            hoveredIndex === index && "transform scale-105"
          )}>
            <h3 class="font-semibold text-sm">{item.label}</h3>
            <p class="text-xs text-gray-600">{item.date}</p>
            {#if item.description}
              <p class="text-xs text-gray-500 mt-1">{item.description}</p>
            {/if}
          </div>
          {:else}
          <div class={`w-[2px] h-7 ${typeColor[item.type] ?? "bg-blue-500"}`} style="transform: translateY(-60px)"></div>
          <div class={`w-2 h-2 rounded-full ${typeColor[item.type] ?? "bg-blue-500"} flex items-center justify-center text-white font-semibold z-10 shadow-md`} style="transform: translateY(-95px)"></div>
          <div class={cn(
            "mt-3 w-[160px] transition-all",
            hoveredIndex === index && "transform scale-105"
          )} style="transform: translateY(-180px)">
            <h3 class="font-semibold text-sm">{item.label}</h3>
            <p class="text-xs text-gray-600">{item.date}</p>
            {#if item.description}
              <p class="text-xs text-gray-500 mt-1">{item.description}</p>
            {/if}
          </div>
          {/if}
      </button>
    {/each}
  </div>
</div>

<!-- OKR Snapshot Modal -->
<Dialog.Root bind:open={showOKRSnapshot}>
  <Dialog.Content class="max-w-4xl max-h-[80vh] overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>
        OKR Snapshot - {snapshotDate ? new Date(snapshotDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}
      </Dialog.Title>
      <Dialog.Description>
        {#if snapshotMeta}
          Showing {snapshotMeta.total} OKRs ({snapshotMeta.active} active, {snapshotMeta.finished} finished) as of this date
        {/if}
      </Dialog.Description>
    </Dialog.Header>

    <div class="py-4">
      {#if isLoadingSnapshot}
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      {:else if snapshotOKRs.length === 0}
        <div class="text-center py-12 text-slate-500">
          <div class="text-5xl mb-4">📋</div>
          <p>No OKRs found for this date</p>
        </div>
      {:else}
        <div class="space-y-3">
          {#each snapshotOKRs as okr}
            <Card class="p-4 border-l-4" style="border-left-color: {okr.type === 'objective' ? '#3b82f6' : '#10b981'}">
              <div class="flex items-start justify-between mb-3">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <span class="text-xs font-semibold px-2 py-0.5 rounded uppercase" style="background-color: {okr.type === 'objective' ? '#dbeafe' : '#d1fae5'}; color: {okr.type === 'objective' ? '#1e40af' : '#065f46'}">
                      {okr.type === 'objective' ? 'Objective' : 'Key Result'}
                    </span>
                    {#if okr.status === 'finished'}
                      <span class="text-xs font-semibold px-2 py-0.5 rounded uppercase bg-green-100 text-green-800">
                        ✓ Finished
                      </span>
                    {/if}
                    {#if okr.viewType === 'historical'}
                      <span class="text-xs font-semibold px-2 py-0.5 rounded uppercase bg-amber-100 text-amber-800">
                        Historical
                      </span>
                    {:else if okr.viewType === 'predicted'}
                      <span class="text-xs font-semibold px-2 py-0.5 rounded uppercase bg-purple-100 text-purple-800">
                        Predicted
                      </span>
                    {/if}
                  </div>
                  <h4 class="font-semibold text-slate-900 mb-1">{okr.title}</h4>
                  <div class="flex items-center gap-3 text-xs text-slate-600">
                    <span>👤 {okr.owner}</span>
                    <span>📅 {okr.daysLeft}d left</span>
                    <span class="px-2 py-0.5 rounded" style="background-color: {getRiskColor(okr.risk)}20; color: {getRiskColor(okr.risk)}">
                      ⚠️ {okr.risk} risk
                    </span>
                  </div>
                </div>
              </div>

              <!-- Progress bar -->
              <div class="space-y-1">
                <div class="flex justify-between text-xs text-slate-600">
                  <span>Progress</span>
                  <span class="font-semibold">{okr.progress}%</span>
                </div>
                <div class="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    class={cn("h-full transition-all rounded-full", getProgressColor(okr.progress))}
                    style="width: {okr.progress}%"
                  ></div>
                </div>
              </div>
            </Card>
          {/each}
        </div>
      {/if}
    </div>

    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showOKRSnapshot = false}>Close</Button>
      <Button onclick={() => { handleDateClick(snapshotDate); showOKRSnapshot = false; }}>
        Navigate to this date
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
