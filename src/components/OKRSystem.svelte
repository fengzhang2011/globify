<script lang="ts">
  import { selectedOKR, selectedDate, currentView, okrDataStore } from '$lib/okr/stores.js';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import * as Dialog from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { cn } from '$lib/utils';

  let { onOpenOKRKanban }: { onOpenOKRKanban: () => void } = $props();

  // Sample OKR data with historical and predicted states
  let okrData = $state([
    {
      id: 1,
      title: 'Increase Revenue by 50%',
      type: 'objective',
      parentId: null,
      progress: 65,
      risk: 'low',
      daysLeft: 45,
      owner: 'CEO',
      quarter: 'Q4 2025',
      history: {
        '2025-09-01': { progress: 20, risk: 'medium', daysLeft: 90 },
        '2025-10-01': { progress: 45, risk: 'low', daysLeft: 60 }
      },
      predictions: {
        '2025-11-15': { progress: 75, risk: 'low', daysLeft: 30 },
        '2025-12-01': { progress: 85, risk: 'low', daysLeft: 15 }
      }
    },
    {
      id: 2,
      title: 'Launch 3 new products',
      type: 'key_result',
      parentId: 1,
      progress: 66,
      risk: 'medium',
      daysLeft: 45,
      owner: 'Product Team',
      quarter: 'Q4 2025',
      history: {
        '2025-09-01': { progress: 0, risk: 'high', daysLeft: 90 },
        '2025-10-01': { progress: 33, risk: 'medium', daysLeft: 60 }
      },
      predictions: {
        '2025-11-15': { progress: 80, risk: 'low', daysLeft: 30 },
        '2025-12-01': { progress: 100, risk: 'low', daysLeft: 15 }
      }
    },
    {
      id: 3,
      title: 'Acquire 10,000 new customers',
      type: 'key_result',
      parentId: 1,
      progress: 70,
      risk: 'low',
      daysLeft: 45,
      owner: 'Marketing',
      quarter: 'Q4 2025',
      history: {
        '2025-09-01': { progress: 25, risk: 'medium', daysLeft: 90 },
        '2025-10-01': { progress: 50, risk: 'low', daysLeft: 60 }
      },
      predictions: {
        '2025-11-15': { progress: 85, risk: 'low', daysLeft: 30 },
        '2025-12-01': { progress: 95, risk: 'low', daysLeft: 15 }
      }
    },
    {
      id: 4,
      title: 'Product A - MVP Launch',
      type: 'objective',
      parentId: 2,
      progress: 80,
      risk: 'low',
      daysLeft: 45,
      owner: 'Team A',
      quarter: 'Q4 2025',
      history: {
        '2025-09-01': { progress: 20, risk: 'high', daysLeft: 90 },
        '2025-10-01': { progress: 50, risk: 'medium', daysLeft: 60 }
      },
      predictions: {
        '2025-11-15': { progress: 90, risk: 'low', daysLeft: 30 },
        '2025-12-01': { progress: 100, risk: 'low', daysLeft: 15 }
      }
    },
    {
      id: 5,
      title: 'Product B - Beta Testing',
      type: 'objective',
      parentId: 2,
      progress: 60,
      risk: 'medium',
      daysLeft: 45,
      owner: 'Team B',
      quarter: 'Q4 2025',
      history: {
        '2025-09-01': { progress: 10, risk: 'high', daysLeft: 90 },
        '2025-10-01': { progress: 35, risk: 'medium', daysLeft: 60 }
      },
      predictions: {
        '2025-11-15': { progress: 75, risk: 'low', daysLeft: 30 },
        '2025-12-01': { progress: 95, risk: 'low', daysLeft: 15 }
      }
    },
    {
      id: 6,
      title: 'Improve conversion rate to 5%',
      type: 'key_result',
      parentId: 3,
      progress: 75,
      risk: 'low',
      daysLeft: 45,
      owner: 'Growth Team',
      quarter: 'Q4 2025',
      history: {
        '2025-09-01': { progress: 30, risk: 'medium', daysLeft: 90 },
        '2025-10-01': { progress: 55, risk: 'low', daysLeft: 60 }
      },
      predictions: {
        '2025-11-15': { progress: 88, risk: 'low', daysLeft: 30 },
        '2025-12-01': { progress: 100, risk: 'low', daysLeft: 15 }
      }
    }
  ]);

  let draggedOKR = $state(null);
  let hoveredOKR = $state(null);
  let highlightedOKRId = $state(null);
  let alignment = $state('center');
  let showAddModal = $state(false);
  let showEditModal = $state(false);
  let showDeleteModal = $state(false);
  let selectedOKRNode = $state(null);

  let formData = $state({
    title: '',
    type: 'key_result',
    parentId: null,
    progress: 0,
    risk: 'low',
    daysLeft: 90,
    owner: ''
  });

  const nodeWidth = 240;
  const nodeHeight = 140;
  const levelHeight = 200;
  const nodeSpacing = 60;
  const headerOffset = 120; // Offset for sticky header height

  // Get OKR data for a specific date
  function getOKRDataForDate(okr, date) {
    const dateStr = formatDate(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    if (targetDate < today && okr.history[dateStr]) {
      return { ...okr, ...okr.history[dateStr], viewType: 'historical' };
    } else if (targetDate > today && okr.predictions[dateStr]) {
      return { ...okr, ...okr.predictions[dateStr], viewType: 'predicted' };
    }
    return { ...okr, viewType: 'current' };
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function getOKRsByLevel() {
    const currentDate = $selectedDate;
    const processedOKRs = okrData.map(okr => getOKRDataForDate(okr, currentDate));

    const levels = {};
    const processed = new Set();

    function assignLevel(okr, level) {
      if (processed.has(okr.id)) return;
      processed.add(okr.id);

      if (!levels[level]) levels[level] = [];
      levels[level].push(okr);

      const children = processedOKRs.filter(o => o.parentId === okr.id);
      children.forEach(child => assignLevel(child, level + 1));
    }

    const roots = processedOKRs.filter(o => o.parentId === null);
    roots.forEach(root => assignLevel(root, 0));

    return levels;
  }

  function getNodePosition(level, index, totalInLevel) {
    const totalWidth = totalInLevel * (nodeWidth + nodeSpacing) - nodeSpacing;
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;

    let startX;
    if (alignment === 'left') {
      startX = 50;
    } else if (alignment === 'right') {
      startX = containerWidth - totalWidth - 50;
    } else {
      startX = (containerWidth - totalWidth) / 2;
    }

    return {
      x: startX + index * (nodeWidth + nodeSpacing),
      y: 100 + level * levelHeight
    };
  }

  function getConnectionLines(levels, currentOKRData) {
    const lines = [];
    Object.keys(levels).forEach(levelKey => {
      const level = parseInt(levelKey);
      if (!levels[level]) return;

      levels[level].forEach((okr, okrIndex) => {
        // Find children using the original okr.id
        const children = currentOKRData.filter(o => o.parentId === okr.id);

        children.forEach(child => {
          const childLevel = level + 1;
          if (!levels[childLevel]) return;

          const childIndex = levels[childLevel].findIndex(o => o.id === child.id);
          if (childIndex === -1) return;

          const fromPos = getNodePosition(level, okrIndex, levels[level].length);
          const toPos = getNodePosition(childLevel, childIndex, levels[childLevel].length);

          // Start from bottom center of parent node, add header offset
          const x1 = fromPos.x + nodeWidth / 2;
          const y1 = fromPos.y + nodeHeight + headerOffset;

          // End at top center of child node, add header offset
          const x2 = toPos.x + nodeWidth / 2;
          const y2 = toPos.y + headerOffset;

          const verticalGap = y2 - y1;
          const curveIntensity = Math.min(verticalGap * 0.5, 50);

          // Control points for Bézier curve
          const cx1 = x1;
          const cy1 = y1 + curveIntensity;
          const cx2 = x2;
          const cy2 = y2 - curveIntensity;

          lines.push({
            path: `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`,
            fromId: okr.id,
            toId: child.id
          });
        });
      });
    });
    return lines;
  }

  function getRiskColor(risk) {
    switch(risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#64748b';
    }
  }

  function getProgressColor(progress) {
    if (progress >= 75) return '#10b981';
    if (progress >= 50) return '#3b82f6';
    if (progress >= 25) return '#f59e0b';
    return '#ef4444';
  }

  function handleOKRClick(okr) {
    highlightedOKRId = okr.id;
    selectedOKR.set(okr);
  }

  function handleDragStart(okr) {
    return function(event) {
      draggedOKR = okr;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', okr.id.toString());
    };
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(okr) {
    return function(event) {
      event.preventDefault();
      if (draggedOKR && draggedOKR.id !== okr.id) {
        hoveredOKR = okr;
      }
    };
  }

  function handleDragLeave() {
    hoveredOKR = null;
  }

  function handleDrop(newParent) {
    return function(event) {
      event.preventDefault();

      if (!draggedOKR || draggedOKR.id === newParent.id) {
        draggedOKR = null;
        hoveredOKR = null;
        return;
      }

      okrData = okrData.map(okr =>
        okr.id === draggedOKR.id
          ? { ...okr, parentId: newParent.id }
          : okr
      );

      draggedOKR = null;
      hoveredOKR = null;
    };
  }

  function handleDragEnd() {
    draggedOKR = null;
    hoveredOKR = null;
  }

  function openAddModal(parent = null) {
    formData = {
      title: '',
      type: parent ? 'key_result' : 'objective',
      parentId: parent ? parent.id : null,
      progress: 0,
      risk: 'low',
      daysLeft: 90,
      owner: ''
    };
    selectedOKRNode = parent;
    showAddModal = true;
  }

  function openEditModal(okr) {
    formData = {
      title: okr.title,
      type: okr.type,
      parentId: okr.parentId,
      progress: okr.progress,
      risk: okr.risk,
      daysLeft: okr.daysLeft,
      owner: okr.owner
    };
    selectedOKRNode = okr;
    showEditModal = true;
  }

  function openDeleteModal(okr) {
    selectedOKRNode = okr;
    showDeleteModal = true;
  }

  function closeModals() {
    showAddModal = false;
    showEditModal = false;
    showDeleteModal = false;
    selectedOKRNode = null;
  }

  function addOKR() {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    const newId = Math.max(...okrData.map(o => o.id)) + 1;
    const newOKR = {
      id: newId,
      title: formData.title.trim(),
      type: formData.type,
      parentId: formData.parentId,
      progress: formData.progress,
      risk: formData.risk,
      daysLeft: formData.daysLeft,
      owner: formData.owner.trim(),
      quarter: 'Q4 2025',
      history: {},
      predictions: {}
    };

    okrData = [...okrData, newOKR];
    closeModals();
  }

  function updateOKR() {
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    okrData = okrData.map(okr =>
      okr.id === selectedOKRNode.id
        ? {
            ...okr,
            title: formData.title.trim(),
            progress: formData.progress,
            risk: formData.risk,
            daysLeft: formData.daysLeft,
            owner: formData.owner.trim()
          }
        : okr
    );

    closeModals();
  }

  function deleteOKR() {
    const hasChildren = okrData.some(o => o.parentId === selectedOKRNode.id);

    if (hasChildren) {
      okrData = okrData
        .filter(okr => okr.id !== selectedOKRNode.id)
        .map(okr =>
          okr.parentId === selectedOKRNode.id
            ? { ...okr, parentId: selectedOKRNode.parentId }
            : okr
        );
    } else {
      okrData = okrData.filter(okr => okr.id !== selectedOKRNode.id);
    }

    closeModals();
  }

  let levels = $derived(getOKRsByLevel());
  let connectionLines = $derived(getConnectionLines(levels, okrData));

  // Update store whenever okrData changes
  $effect(() => {
    okrDataStore.set(okrData);
  });
</script>

<div class="w-full min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 overflow-auto relative">
  <div class="sticky top-0 bg-white p-6 shadow-sm z-[5] flex justify-between items-center">
    <div>
      <h1 class="text-3xl font-bold text-slate-900 mb-1">OKR System</h1>
      <p class="text-sm text-slate-600 flex items-center gap-2">
        {#if $selectedDate}
          Viewing: {$selectedDate.toLocaleDateString()}
          {#if $selectedDate < new Date()}
            <span class="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">Historical</span>
          {:else if $selectedDate > new Date()}
            <span class="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">Predicted</span>
          {:else}
            <span class="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-semibold uppercase">Current</span>
          {/if}
        {/if}
      </p>
    </div>
    <div class="flex gap-4 items-center">
      <div class="flex gap-3 bg-slate-100 p-1 rounded-lg">
        <label class="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer px-3 py-1.5 rounded {alignment === 'left' ? 'bg-white shadow-sm' : ''}">
          <input type="radio" bind:group={alignment} value="left" class="w-4 h-4" /> Left
        </label>
        <label class="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer px-3 py-1.5 rounded {alignment === 'center' ? 'bg-white shadow-sm' : ''}">
          <input type="radio" bind:group={alignment} value="center" class="w-4 h-4" /> Center
        </label>
        <label class="flex items-center gap-1.5 text-sm text-slate-700 cursor-pointer px-3 py-1.5 rounded {alignment === 'right' ? 'bg-white shadow-sm' : ''}">
          <input type="radio" bind:group={alignment} value="right" class="w-4 h-4" /> Right
        </label>
      </div>
      <Button onclick={() => openAddModal()}>+ Add OKR</Button>
    </div>
  </div>

  <svg class="absolute top-0 left-0 w-full h-full pointer-events-none min-h-screen min-w-full z-[1]">
    {#each connectionLines as line}
      <path d={line.path} stroke="#94a3b8" stroke-width="2" fill="none" opacity="0.7" />
    {/each}
  </svg>

  <div class="relative min-h-screen min-w-full pt-8 z-[2]">
    {#each Object.keys(levels) as levelKey}
      {@const level = parseInt(levelKey)}
      {#each levels[level] as okr, index}
        {@const pos = getNodePosition(level, index, levels[level].length)}
        {@const isBeingDragged = draggedOKR?.id === okr.id}
        {@const isHovered = hoveredOKR?.id === okr.id}
        {@const isHighlighted = highlightedOKRId === okr.id}

        <Card
          class={cn(
            "absolute p-4 cursor-move transition-all border-l-[5px]",
            isBeingDragged && "opacity-50 scale-95",
            isHovered && "ring-4 ring-blue-400 scale-105",
            isHighlighted && "ring-3 ring-blue-600"
          )}
          draggable="true"
          ondragstart={handleDragStart(okr)}
          ondragover={handleDragOver}
          ondragenter={handleDragEnter(okr)}
          ondragleave={handleDragLeave}
          ondrop={handleDrop(okr)}
          ondragend={handleDragEnd}
          onclick={() => handleOKRClick(okr)}
          ondblclick={onOpenOKRKanban}
          style="left: {pos.x}px; top: {pos.y}px; width: {nodeWidth}px; height: {nodeHeight}px; border-left-color: {getRiskColor(okr.risk)};"
        >
          <div class="flex justify-between items-center mb-2">
            <span class="text-xl">{okr.type === 'objective' ? '🎯' : '🔑'}</span>
            <div class="flex gap-1">
              <Button size="icon" variant="ghost" class="h-6 w-6" onclick={(e) => { e.stopPropagation(); openAddModal(okr); }} title="Add child">
                ➕
              </Button>
              <Button size="icon" variant="ghost" class="h-6 w-6" onclick={(e) => { e.stopPropagation(); openEditModal(okr); }} title="Edit">
                ✏️
              </Button>
              <Button size="icon" variant="ghost" class="h-6 w-6 hover:bg-red-50" onclick={(e) => { e.stopPropagation(); openDeleteModal(okr); }} title="Delete">
                🗑️
              </Button>
            </div>
          </div>

          <h4 class="text-sm font-semibold text-slate-900 mb-3 line-clamp-2 min-h-[2.6em]">{okr.title}</h4>

          <div class="flex flex-col gap-2">
            <div class="flex items-center gap-2">
              <div class="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                <div class="h-full transition-all" style="width: {okr.progress}%; background-color: {getProgressColor(okr.progress)};"></div>
              </div>
              <span class="text-xs font-semibold text-slate-600 min-w-[35px]">{okr.progress}%</span>
            </div>

            <div class="flex justify-between items-center text-xs">
              <span class="font-semibold uppercase" style="color: {getRiskColor(okr.risk)};">
                ⚠️ {okr.risk}
              </span>
              <span class="text-slate-600">
                📅 {okr.daysLeft}d left
              </span>
            </div>

            {#if okr.owner}
              <div class="text-xs text-slate-600 pt-2 border-t border-slate-200">
                👤 {okr.owner}
              </div>
            {/if}
          </div>

          {#if okr.viewType === 'historical'}
            <div class="absolute top-2 right-2 bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
              Historical
            </div>
          {:else if okr.viewType === 'predicted'}
            <div class="absolute top-2 right-2 bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase">
              Predicted
            </div>
          {/if}
        </Card>
      {/each}
    {/each}
  </div>

  <!-- Add OKR Modal -->
  <Dialog.Root bind:open={showAddModal}>
    <Dialog.Content class="sm:max-w-[525px]">
      <Dialog.Header>
        <Dialog.Title>Add New {selectedOKRNode ? 'Key Result' : 'Objective'}</Dialog.Title>
      </Dialog.Header>
      <div class="space-y-4 py-4">
        <div>
          <Label>Title:</Label>
          <Input bind:value={formData.title} placeholder="Enter title" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>Progress (%):</Label>
            <Input type="number" bind:value={formData.progress} min="0" max="100" />
          </div>
          <div>
            <Label>Days Left:</Label>
            <Input type="number" bind:value={formData.daysLeft} min="0" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>Risk:</Label>
            <select bind:value={formData.risk} class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <Label>Owner:</Label>
            <Input bind:value={formData.owner} placeholder="Owner name" />
          </div>
        </div>
      </div>
      <Dialog.Footer>
        <Button variant="secondary" onclick={closeModals}>Cancel</Button>
        <Button onclick={addOKR}>Add</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  <!-- Edit OKR Modal -->
  <Dialog.Root bind:open={showEditModal}>
    <Dialog.Content class="sm:max-w-[525px]">
      <Dialog.Header>
        <Dialog.Title>Edit OKR</Dialog.Title>
      </Dialog.Header>
      <div class="space-y-4 py-4">
        <div>
          <Label>Title:</Label>
          <Input bind:value={formData.title} placeholder="Enter title" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>Progress (%):</Label>
            <Input type="number" bind:value={formData.progress} min="0" max="100" />
          </div>
          <div>
            <Label>Days Left:</Label>
            <Input type="number" bind:value={formData.daysLeft} min="0" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>Risk:</Label>
            <select bind:value={formData.risk} class="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <Label>Owner:</Label>
            <Input bind:value={formData.owner} placeholder="Owner name" />
          </div>
        </div>
      </div>
      <Dialog.Footer>
        <Button variant="secondary" onclick={closeModals}>Cancel</Button>
        <Button onclick={updateOKR}>Save</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  <!-- Delete OKR Modal -->
  <Dialog.Root bind:open={showDeleteModal}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Delete OKR</Dialog.Title>
        <Dialog.Description>
          Are you sure you want to delete <strong>{selectedOKRNode?.title}</strong>?
        </Dialog.Description>
      </Dialog.Header>
      <div class="py-4">
        {#if okrData.some(o => o.parentId === selectedOKRNode?.id)}
          <p class="text-amber-700 text-sm p-2 bg-amber-50 rounded">
            ⚠️ This OKR has children. They will be reassigned to {selectedOKRNode.parentId ? okrData.find(o => o.id === selectedOKRNode.parentId)?.title : 'no parent'}.
          </p>
        {/if}
      </div>
      <Dialog.Footer>
        <Button variant="secondary" onclick={closeModals}>Cancel</Button>
        <Button variant="destructive" onclick={deleteOKR}>Delete</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</div>
