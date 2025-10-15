<script lang="ts">
  export interface KeyDate {
    date: string;
    label: string;
    type: string;
    description?: string;
  }

  export let keyDates: KeyDate[] = [
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

  export let projectTitle = "Project Timeline";
  export let product = "Product X";

  // 不同类型颜色
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

  // 转换日期对象并排序
  const sortedDates = keyDates
    .map(d => ({ ...d, dateObj: new Date(d.date) }))
    .sort((a, b) => a.dateObj.getTime() - b.dateObj.getTime());

  // 获取最早和最晚日期
  const minDate = sortedDates[0].dateObj.getTime();
  const maxDate = sortedDates[sortedDates.length - 1].dateObj.getTime();
  const totalRange = maxDate - minDate;

  function getPosition(dateObj: Date): string {
    const ratio = (dateObj.getTime() - minDate) / totalRange;
    return `${ratio * 100}%`;
  }
</script>

<div class="p-8">
  <div class="relative border-t-4 border-gray-900 h-2 w-full mt-20 mb-24">
    {#each sortedDates as item, index}
      <div
        class="absolute flex flex-col items-center text-center"
        style={`left:${getPosition(item.dateObj)}; transform: translateX(-50%) translateY(-17px);`}
      >
        <div class={`w-8 h-8 rounded-full ${typeColor[item.type] ?? "bg-blue-500"} flex items-center justify-center text-white font-semibold z-10 shadow-md`}>
          {getTypeIcon(item.type)}
        </div>
        {#if index % 2 === 0}
          <div class={`w-[2px] h-7 ${typeColor[item.type] ?? "bg-blue-500"}`}></div>
          <div class={`w-2 h-2 rounded-full ${typeColor[item.type] ?? "bg-blue-500"} flex items-center justify-center text-white font-semibold z-10 shadow-md`}></div>
          <div class="mt-3 max-w-[160px]">
            <h3 class="font-semibold text-sm">{item.label}</h3>
            <p class="text-xs text-gray-600">{item.date}</p>
            {#if item.description}
              <p class="text-xs text-gray-500 mt-1">{item.description}</p>
            {/if}
          </div>
          {:else}
          <div class={`w-[2px] h-7 ${typeColor[item.type] ?? "bg-blue-500"}`} style="transform: translateY(-60px)"></div>
          <div class={`w-2 h-2 rounded-full ${typeColor[item.type] ?? "bg-blue-500"} flex items-center justify-center text-white font-semibold z-10 shadow-md`} style="transform: translateY(-95px)"></div>
          <div class="mt-3 max-w-[160px]" style="transform: translateY(-180px)">
            <h3 class="font-semibold text-sm">{item.label}</h3>
            <p class="text-xs text-gray-600">{item.date}</p>
            {#if item.description}
              <p class="text-xs text-gray-500 mt-1">{item.description}</p>
            {/if}
          </div>
          {/if}
      </div>
    {/each}
  </div>
</div>
