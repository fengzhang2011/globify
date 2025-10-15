<script lang="ts">
  import { formatDateRange } from "little-date";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { Button } from "$lib/components/ui/button";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import CalendarDay from "$lib/components/ui/calendar/calendar-day.svelte";
  import * as Card from "$lib/components/ui/card";
  import { CalendarDate, isWeekend, getLocalTimeZone, type DateValue } from "@internationalized/date";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { selectedDate } from '$lib/okr/stores.js';

  let keyDates = [
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
  ];

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
      case 'normal': return '';
      default: return '📅';
    }
  }

  function getDayItem(day) {
    const dateObj = new Date(day.year, day.month - 1, day.day);
    const date = dateObj.toISOString().split('T')[0];
    return keyDates.find(e => e.date === date);
  }

  function getDayType(day) {
    const item = getDayItem(day);
    if (item) {
      return item.type;
    }
    return 'normal';
  }

  function getDayLabel(day) {
    const item = getDayItem(day);
    if (item) {
      return item.label;
    }
    return '';
  }

  function getDayDescription(day) {
    const item = getDayItem(day);
    if (item) {
      return item.description;
    }
    return '';
  }

  let hoveredDate = null;

  // Initialize calendar value from selectedDate store
  let value = $state<DateValue | undefined>(
    new CalendarDate(
      $selectedDate.getFullYear(),
      $selectedDate.getMonth() + 1,
      $selectedDate.getDate()
    )
  );

  // Sample events data - in real app this would come from a database
  let allEvents = [
    {
      title: "Team Sync Meeting",
      start: "2025-09-01T09:00:00",
      end: "2025-09-01T10:00:00",
    },
    {
      title: "Design Review",
      start: "2025-09-01T11:30:00",
      end: "2025-09-01T12:30:00",
    },
    {
      title: "Sprint Planning",
      start: "2025-09-15T14:00:00",
      end: "2025-09-15T16:00:00",
    },
    {
      title: "Mid Quarter Review Meeting",
      start: "2025-10-01T10:00:00",
      end: "2025-10-01T12:00:00",
    },
    {
      title: "Product Launch Prep",
      start: "2025-11-01T09:00:00",
      end: "2025-11-01T17:00:00",
    },
    {
      title: "Final Review",
      start: "2025-12-01T13:00:00",
      end: "2025-12-01T15:00:00",
    },
  ];

  // Filter events for the selected date
  let events = $derived.by(() => {
    if (!value) return [];
    const selectedDateStr = `${value.year}-${String(value.month).padStart(2, '0')}-${String(value.day).padStart(2, '0')}`;
    return allEvents.filter(event => {
      const eventDate = event.start.split('T')[0];
      return eventDate === selectedDateStr;
    });
  });

  // Watch for calendar value changes and update the store
  $effect(() => {
    if (value) {
      const newDate = new Date(value.year, value.month - 1, value.day);
      selectedDate.set(newDate);
    }
  });

  // Watch for store changes and update calendar value
  $effect(() => {
    const storeDate = $selectedDate;
    const newValue = new CalendarDate(
      storeDate.getFullYear(),
      storeDate.getMonth() + 1,
      storeDate.getDate()
    );
    // Only update if different to avoid infinite loop
    if (value?.compare(newValue) !== 0) {
      value = newValue;
    }
  });
</script>

<Card.Root class="w-fit py-4">
  <Card.Content class="px-4">
    <Calendar type="single" bind:value class="bg-transparent p-0" preventDeselect>
  {#snippet day({ day, outsideMonth })}
  {@const dayIsWeekend = isWeekend(day, "en-US")}
  <CalendarDay class="flex flex-col items-center">
    {#if getDayLabel(day) !== ''}
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger>
          {#if !outsideMonth}
            <p>{getTypeIcon(getDayType(day))}</p>
          {/if}      
        </Tooltip.Trigger>
        <Tooltip.Content>
          <div class="event-tooltip">
            <strong>{getDayLabel(day)}</strong>
            <p>{getDayDescription(day)}</p>
          </div>
        </Tooltip.Content>
      </Tooltip.Root>
    </Tooltip.Provider>
    {:else}
    {day.day}
{/if}
  </CalendarDay>
{/snippet}
    </Calendar>
  </Card.Content>
  <Card.Footer class="flex flex-col items-start gap-3 border-t px-4 !pt-4">
    <div class="flex w-full items-center justify-between px-1">
      <div class="text-sm font-medium">
        {value?.toDate(getLocalTimeZone()).toLocaleDateString("en-US", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </div>
      <Button variant="ghost" size="icon" class="size-6" title="Add Event">
        <PlusIcon />
        <span class="sr-only">Add Event</span>
      </Button>
    </div>
    <div class="flex w-full flex-col gap-2">
      {#each events as event (event.title)}
        <div
          class="bg-muted after:bg-primary/70 relative rounded-md p-2 pl-6 text-sm after:absolute after:inset-y-2 after:left-2 after:w-1 after:rounded-full"
        >
          <div class="font-medium">{event.title}</div>
          <div class="text-muted-foreground text-xs">
            {formatDateRange(new Date(event.start), new Date(event.end))}
          </div>
        </div>
      {/each}
    </div>
  </Card.Footer>
</Card.Root>
