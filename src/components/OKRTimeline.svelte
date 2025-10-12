<script>
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

  let viewMode = 'timeline'; // 'timeline' or 'calendar'
  let currentMonth = new Date(2025, 9, 1); // October 2025
  let hoveredDate = null;

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

  $: calendarDays = getDaysInMonth(currentMonth);
  $: sortedKeyDates = [...keyDates].sort((a, b) => new Date(a.date) - new Date(b.date));
</script>

<div class="timeline-container">
  <div class="timeline-header">
    <h2>Timeline</h2>
    <div class="view-toggle">
      <button 
        class="toggle-btn" 
        class:active={viewMode === 'timeline'}
        on:click={() => viewMode = 'timeline'}
      >
        Timeline
      </button>
      <button 
        class="toggle-btn" 
        class:active={viewMode === 'calendar'}
        on:click={() => viewMode = 'calendar'}
      >
        Calendar
      </button>
    </div>
  </div>

  {#if viewMode === 'timeline'}
    <div class="timeline-view">
      <div class="timeline-line"></div>
      {#each sortedKeyDates as keyDate, index}
        {@const dateObj = new Date(keyDate.date)}
        {@const isPastDate = isPast(keyDate.date)}
        {@const isFutureDate = isFuture(keyDate.date)}
        {@const isSelectedDate = isSelected(keyDate.date)}
        
        <div 
          class="timeline-item"
          class:past={isPastDate}
          class:future={isFutureDate}
          class:selected={isSelectedDate}
          on:click={() => handleDateClick(keyDate.date)}
          on:mouseenter={() => hoveredDate = keyDate.date}
          on:mouseleave={() => hoveredDate = null}
        >
          <div class="timeline-marker" style="background-color: {getTypeColor(keyDate.type)}">
            <span class="marker-icon">{getTypeIcon(keyDate.type)}</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-date">{dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
            <div class="timeline-label">{keyDate.label}</div>
            <div class="timeline-description">{keyDate.description}</div>
            {#if isPastDate}
              <span class="status-badge past">Historical</span>
            {:else if isFutureDate}
              <span class="status-badge future">Predicted</span>
            {:else}
              <span class="status-badge current">Current</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="calendar-view">
      <div class="calendar-controls">
        <button class="nav-btn" on:click={() => changeMonth(-1)}>‹</button>
        <h3>{getMonthName(currentMonth)}</h3>
        <button class="nav-btn" on:click={() => changeMonth(1)}>›</button>
      </div>

      <div class="calendar-grid">
        <div class="calendar-header">Sun</div>
        <div class="calendar-header">Mon</div>
        <div class="calendar-header">Tue</div>
        <div class="calendar-header">Wed</div>
        <div class="calendar-header">Thu</div>
        <div class="calendar-header">Fri</div>
        <div class="calendar-header">Sat</div>

        {#each calendarDays as dateStr}
          {#if dateStr}
            {@const keyDate = getKeyDate(dateStr)}
            {@const isPastDate = isPast(dateStr)}
            {@const isFutureDate = isFuture(dateStr)}
            {@const isSelectedDate = isSelected(dateStr)}
            {@const day = new Date(dateStr).getDate()}
            
            <div 
              class="calendar-day"
              class:has-event={keyDate}
              class:past={isPastDate}
              class:future={isFutureDate}
              class:selected={isSelectedDate}
              class:today={isToday(dateStr)}
              on:click={() => handleDateClick(dateStr)}
              on:mouseenter={() => hoveredDate = dateStr}
              on:mouseleave={() => hoveredDate = null}
            >
              <div class="day-number">{day}</div>
              {#if keyDate}
                <div class="event-indicator" style="background-color: {getTypeColor(keyDate.type)}">
                  {getTypeIcon(keyDate.type)}
                </div>
                {#if hoveredDate === dateStr}
                  <div class="event-tooltip">
                    <strong>{keyDate.label}</strong>
                    <p>{keyDate.description}</p>
                  </div>
                {/if}
              {/if}
            </div>
          {:else}
            <div class="calendar-day empty"></div>
          {/if}
        {/each}
      </div>

      <div class="legend">
        <h4>Legend</h4>
        <div class="legend-items">
          {#each ['milestone', 'review', 'sprint', 'deadline', 'current'] as type}
            <div class="legend-item">
              <span class="legend-icon" style="background-color: {getTypeColor(type)}">
                {getTypeIcon(type)}
              </span>
              <span class="legend-label">{type}</span>
            </div>
          {/each}
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .timeline-container {
    width: 100%;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    overflow: hidden;
  }

  .timeline-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .timeline-header h2 {
    margin: 0;
    font-size: 1.5rem;
    color: #1e293b;
  }

  .view-toggle {
    display: flex;
    gap: 0.5rem;
    background: #f1f5f9;
    padding: 0.25rem;
    border-radius: 0.5rem;
  }

  .toggle-btn {
    padding: 0.5rem 1rem;
    border: none;
    background: transparent;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s;
  }

  .toggle-btn.active {
    background: white;
    color: #1e293b;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  /* Timeline View */
  .timeline-view {
    padding: 2rem;
    position: relative;
    max-height: 600px;
    overflow-y: auto;
  }

  .timeline-line {
    position: absolute;
    left: 2.9rem;
    top: 0;
    bottom: 0;
    width: 2px;
    background: #e2e8f0;
  }

  .timeline-item {
    display: flex;
    gap: 1rem;
    margin-bottom: 2rem;
    cursor: pointer;
    transition: all 0.2s;
    padding: 0.5rem;
    border-radius: 0.5rem;
    position: relative;
  }

  .timeline-item:hover {
    background: #f8fafc;
  }

  .timeline-item.selected {
    background: #eff6ff;
    box-shadow: 0 0 0 2px #3b82f6;
  }

  .timeline-marker {
    flex-shrink: 0;
    width: 3rem;
    height: 3rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    box-shadow: 0 0 0 4px white;
  }

  .marker-icon {
    font-size: 1.25rem;
  }

  .timeline-content {
    flex: 1;
    padding-top: 0.25rem;
  }

  .timeline-date {
    font-size: 0.75rem;
    color: #64748b;
    margin-bottom: 0.25rem;
  }

  .timeline-label {
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 0.25rem;
  }

  .timeline-description {
    font-size: 0.875rem;
    color: #64748b;
    margin-bottom: 0.5rem;
  }

  .status-badge {
    display: inline-block;
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .status-badge.past {
    background: #fef3c7;
    color: #92400e;
  }

  .status-badge.future {
    background: #e9d5ff;
    color: #6b21a8;
  }

  .status-badge.current {
    background: #dbeafe;
    color: #1e40af;
  }

  /* Calendar View */
  .calendar-view {
    padding: 1.5rem;
  }

  .calendar-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
  }

  .calendar-controls h3 {
    margin: 0;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .nav-btn {
    background: #f1f5f9;
    border: none;
    width: 2.5rem;
    height: 2.5rem;
    border-radius: 0.5rem;
    font-size: 1.5rem;
    cursor: pointer;
    transition: all 0.2s;
    color: #475569;
  }

  .nav-btn:hover {
    background: #e2e8f0;
  }

  .calendar-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 0.5rem;
    margin-bottom: 1.5rem;
  }

  .calendar-header {
    text-align: center;
    font-size: 0.75rem;
    font-weight: 600;
    color: #64748b;
    padding: 0.5rem;
    text-transform: uppercase;
  }

  .calendar-day {
    aspect-ratio: 1;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.5rem;
    cursor: pointer;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    background: white;
  }

  .calendar-day:hover:not(.empty) {
    background: #f8fafc;
    border-color: #cbd5e1;
  }

  .calendar-day.empty {
    background: transparent;
    border: none;
    cursor: default;
  }

  .calendar-day.today {
    border-color: #ef4444;
    border-width: 2px;
  }

  .calendar-day.selected {
    background: #eff6ff;
    border-color: #3b82f6;
    border-width: 2px;
  }

  .calendar-day.has-event {
    background: #fefce8;
  }

  .calendar-day.past {
    opacity: 0.6;
  }

  .day-number {
    font-size: 0.875rem;
    font-weight: 500;
    color: #1e293b;
  }

  .event-indicator {
    font-size: 1rem;
    margin-top: 0.25rem;
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .event-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: #1e293b;
    color: white;
    padding: 0.5rem 0.75rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    white-space: nowrap;
    z-index: 10;
    margin-bottom: 0.5rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }

  .event-tooltip strong {
    display: block;
    margin-bottom: 0.25rem;
  }

  .event-tooltip p {
    margin: 0;
    opacity: 0.9;
  }

  .legend {
    border-top: 1px solid #e2e8f0;
    padding-top: 1rem;
  }

  .legend h4 {
    margin: 0 0 0.75rem 0;
    font-size: 0.875rem;
    color: #64748b;
    text-transform: uppercase;
    font-weight: 600;
  }

  .legend-items {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .legend-icon {
    width: 1.5rem;
    height: 1.5rem;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.75rem;
  }

  .legend-label {
    font-size: 0.75rem;
    color: #64748b;
    text-transform: capitalize;
  }
</style>