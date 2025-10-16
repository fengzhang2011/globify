<script lang="ts">
  import { onMount } from 'svelte';
  import { formatDateRange } from "little-date";
  import PlusIcon from "@lucide/svelte/icons/plus";
  import { Button } from "$lib/components/ui/button";
  import Calendar from "$lib/components/ui/calendar/calendar.svelte";
  import CalendarDay from "$lib/components/ui/calendar/calendar-day.svelte";
  import * as Card from "$lib/components/ui/card";
  import { CalendarDate, isWeekend, getLocalTimeZone, type DateValue } from "@internationalized/date";
  import * as Tooltip from "$lib/components/ui/tooltip";
  import { selectedDate } from '$lib/okr/stores.js';

  let keyDates = $state([]);
  let allEvents = $state([]);

  // Fetch events and key dates from API on component mount
  onMount(async () => {
    try {
      const response = await fetch('/api/events');
      const result = await response.json();
      if (result.success) {
        allEvents = result.data.events;
        keyDates = result.data.keyDates;
      }
    } catch (error) {
      console.error('Failed to fetch event data:', error);
    }
  });

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
          {:else}
            <p style="opacity: 0.5">{getTypeIcon(getDayType(day))}</p>
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
