<script>
  import { selectedDate } from '$lib/okr/stores.js';
  import {Button} from '$lib/components/ui/button';
  import {Card} from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { cn } from '$lib/utils';

  let showOKRSnapshot = $state(false);
  let snapshotDate = $state(null);
  let snapshotOKRs = $state([]);
  let snapshotMeta = $state(null);
  let isLoadingSnapshot = $state(false);

  let keyDates = $state([
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
  ]);

  let viewMode = $state('timeline'); // 'timeline' or 'calendar'
  let currentMonth = $state(new Date(2025, 9, 1)); // October 2025
  let hoveredDate = $state(null);

  function getDateType(dateStr) {
    const keyDate = keyDates.find(d => d.date === dateStr);
    if (keyDate) return keyDate.type;
    return null;
  }

  function getKeyDate(dateStr) {
    return keyDates.find(d => d.date === dateStr);
  }

  function formatDateStr(date) {
    return date.toISOString().split('T')[0];
  }

  function handleDateClick(dateStr) {
    selectedDate.set(new Date(dateStr));
  }

  async function showOKRSnapshotForDate(dateStr) {
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

  function getTypeColor(type) {
    switch(type) {
      case 'milestone': return '#3b82f6';
      case 'review': return '#8b5cf6';
      case 'current': return '#ef4444';
      case 'deadline': return '#dc2626';
      case 'sprint': return '#10b981';
      default: return '#64748b';
    }
  }

  function getTypeIcon(type) {
    switch(type) {
      case 'milestone': return '🎯';
      case 'review': return '📊';
      case 'current': return '📍';
      case 'deadline': return '⚠️';
      case 'sprint': return '🏃';
      default: return '📅';
    }
  }

  function isToday(dateStr) {
    const today = new Date();
    const date = new Date(dateStr);
    return today.toDateString() === date.toDateString();
  }

  function isPast(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date < today;
  }

  function isFuture(dateStr) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const date = new Date(dateStr);
    date.setHours(0, 0, 0, 0);
    return date > today;
  }

  function isSelected(dateStr) {
    return formatDateStr($selectedDate) === dateStr;
  }

  // Calendar functions
  function getDaysInMonth(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      days.push(dateStr);
    }

    return days;
  }

  function changeMonth(delta) {
    currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + delta, 1);
  }

  function getMonthName(date) {
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  let calendarDays = $derived(getDaysInMonth(currentMonth));
  let sortedKeyDates = $derived([...keyDates].sort((a, b) => new Date(a.date) - new Date(b.date)));
</script>

<Card class="w-full overflow-hidden">
  <div class="flex justify-between items-center p-6 border-b border-slate-200">
    <h2 class="text-2xl font-bold text-slate-900">Timeline</h2>
    <div class="flex gap-2 bg-slate-100 p-1 rounded-lg">
      <Button
        variant={viewMode === 'timeline' ? 'default' : 'ghost'}
        size="sm"
        onclick={() => viewMode = 'timeline'}
      >
        Timeline
      </Button>
      <Button
        variant={viewMode === 'calendar' ? 'default' : 'ghost'}
        size="sm"
        onclick={() => viewMode = 'calendar'}
      >
        Calendar
      </Button>
    </div>
  </div>

  {#if viewMode === 'timeline'}
    <div class="p-8 relative max-h-[600px] overflow-y-auto">
      <div class="absolute left-[2.9rem] top-0 bottom-0 w-0.5 bg-slate-200"></div>
      {#each sortedKeyDates as keyDate, index}
        {@const dateObj = new Date(keyDate.date)}
        {@const isPastDate = isPast(keyDate.date)}
        {@const isFutureDate = isFuture(keyDate.date)}
        {@const isSelectedDate = isSelected(keyDate.date)}

        <div
          class={cn(
            "flex gap-4 mb-8 cursor-pointer transition-all p-2 rounded-lg relative hover:bg-slate-50",
            isSelectedDate && "bg-blue-50 ring-2 ring-blue-600"
          )}
          onclick={() => showOKRSnapshotForDate(keyDate.date)}
          onmouseenter={() => hoveredDate = keyDate.date}
          onmouseleave={() => hoveredDate = null}
        >
          <div
            class="flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center relative z-10 shadow-[0_0_0_4px_white] hover:scale-110 transition-transform"
            style="background-color: {getTypeColor(keyDate.type)}"
          >
            <span class="text-xl">{getTypeIcon(keyDate.type)}</span>
          </div>
          <div class="flex-1 pt-1">
            <div class="text-xs text-slate-600 mb-1">
              {dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
            <div class="text-base font-semibold text-slate-900 mb-1">{keyDate.label}</div>
            <div class="text-sm text-slate-600 mb-2">{keyDate.description}</div>
            {#if isPastDate}
              <span class="inline-block bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                Historical
              </span>
            {:else if isFutureDate}
              <span class="inline-block bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                Predicted
              </span>
            {:else}
              <span class="inline-block bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">
                Current
              </span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="p-6">
      <div class="flex justify-between items-center mb-6">
        <Button variant="outline" size="icon" onclick={() => changeMonth(-1)}>‹</Button>
        <h3 class="text-xl font-semibold text-slate-900">{getMonthName(currentMonth)}</h3>
        <Button variant="outline" size="icon" onclick={() => changeMonth(1)}>›</Button>
      </div>

      <div class="grid grid-cols-7 gap-2 mb-6">
        <div class="text-center text-xs font-semibold text-slate-600 uppercase p-2">Sun</div>
        <div class="text-center text-xs font-semibold text-slate-600 uppercase p-2">Mon</div>
        <div class="text-center text-xs font-semibold text-slate-600 uppercase p-2">Tue</div>
        <div class="text-center text-xs font-semibold text-slate-600 uppercase p-2">Wed</div>
        <div class="text-center text-xs font-semibold text-slate-600 uppercase p-2">Thu</div>
        <div class="text-center text-xs font-semibold text-slate-600 uppercase p-2">Fri</div>
        <div class="text-center text-xs font-semibold text-slate-600 uppercase p-2">Sat</div>

        {#each calendarDays as dateStr}
          {#if dateStr}
            {@const keyDate = getKeyDate(dateStr)}
            {@const isPastDate = isPast(dateStr)}
            {@const isFutureDate = isFuture(dateStr)}
            {@const isSelectedDate = isSelected(dateStr)}
            {@const day = new Date(dateStr).getDate()}

            <div
              class={cn(
                "aspect-square border border-slate-200 rounded-lg p-2 cursor-pointer relative flex flex-col items-center justify-center transition-all bg-white hover:border-blue-400",
                keyDate && "bg-yellow-50",
                isPastDate && "opacity-60",
                isToday(dateStr) && "border-red-500 border-2",
                isSelectedDate && "bg-blue-50 border-blue-600 border-2"
              )}
              onclick={() => keyDate ? showOKRSnapshotForDate(dateStr) : handleDateClick(dateStr)}
              onmouseenter={() => hoveredDate = dateStr}
              onmouseleave={() => hoveredDate = null}
            >
              <div class="text-sm font-medium text-slate-900">{day}</div>
              {#if keyDate}
                <div
                  class="text-base mt-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style="background-color: {getTypeColor(keyDate.type)}"
                >
                  {getTypeIcon(keyDate.type)}
                </div>
                {#if hoveredDate === dateStr}
                  <div class="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white p-2 rounded text-xs whitespace-nowrap z-10 shadow-lg">
                    <strong class="block mb-1">{keyDate.label}</strong>
                    <p class="opacity-90 m-0">{keyDate.description}</p>
                  </div>
                {/if}
              {/if}
            </div>
          {:else}
            <div class="aspect-square"></div>
          {/if}
        {/each}
      </div>

      <div class="border-t border-slate-200 pt-4">
        <h4 class="text-sm font-semibold text-slate-600 uppercase mb-3">Legend</h4>
        <div class="flex flex-wrap gap-4">
          {#each ['milestone', 'review', 'sprint', 'deadline', 'current'] as type}
            <div class="flex items-center gap-2">
              <span
                class="w-6 h-6 rounded-full flex items-center justify-center text-xs"
                style="background-color: {getTypeColor(type)}"
              >
                {getTypeIcon(type)}
              </span>
              <span class="text-xs text-slate-600 capitalize">{type}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</Card>

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
