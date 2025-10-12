<script>
  import { selectedOKR, selectedDate, currentView, okrDataStore } from '$lib/okr/stores.js';
  
  // Sample OKR data with historical and predicted states
  let okrData = [
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
  ];

  // Sample tasks linked to OKR nodes
  let tasks = [
    { id: 1, title: 'Design Product A UI', okrId: 4, status: 'done', priority: 'high' },
    { id: 2, title: 'Develop backend API', okrId: 4, status: 'in_progress', priority: 'high' },
    { id: 3, title: 'User testing sessions', okrId: 4, status: 'todo', priority: 'medium' },
    { id: 4, title: 'Product B requirements', okrId: 5, status: 'done', priority: 'high' },
    { id: 5, title: 'Beta user recruitment', okrId: 5, status: 'in_progress', priority: 'medium' },
    { id: 6, title: 'A/B testing framework', okrId: 6, status: 'done', priority: 'high' },
    { id: 7, title: 'Optimize landing pages', okrId: 6, status: 'in_progress', priority: 'high' },
    { id: 8, title: 'Marketing campaign Q4', okrId: 3, status: 'in_progress', priority: 'high' }
  ];

  // Key dates for timeline
  let keyDates = [
    { date: '2025-09-01', label: 'Q4 Start', type: 'milestone' },
    { date: '2025-10-01', label: 'Mid Quarter Review', type: 'review' },
    { date: '2025-10-08', label: 'Today', type: 'current' },
    { date: '2025-11-15', label: 'Sprint End', type: 'milestone' },
    { date: '2025-12-01', label: 'Final Review', type: 'review' },
    { date: '2025-12-31', label: 'Q4 End', type: 'deadline' }
  ];

  let draggedOKR = null;
  let hoveredOKR = null;
  let highlightedOKRId = null;
  let alignment = 'center';
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteModal = false;
  let selectedOKRNode = null;
  
  let formData = {
    title: '',
    type: 'key_result',
    parentId: null,
    progress: 0,
    risk: 'low',
    daysLeft: 90,
    owner: ''
  };

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
          const y1 = fromPos.y + nodeHeight + headerOffset; // Bottom edge with header offset
          
          // End at top center of child node, add header offset
          const x2 = toPos.x + nodeWidth / 2;
          const y2 = toPos.y + headerOffset; // Top edge with header offset
          
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

  function handleDateClick(date) {
    selectedDate.set(new Date(date));
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

      // Create completely new array to trigger reactivity
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
    // Check if OKR has children
    const hasChildren = okrData.some(o => o.parentId === selectedOKRNode.id);
    
    if (hasChildren) {
      // Reassign children to the deleted OKR's parent
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

  $: levels = getOKRsByLevel($selectedDate);
  $: connectionLines = getConnectionLines(levels, okrData);
  
  // Re-calculate when okrData, alignment, or selectedDate changes
  $: if (okrData || alignment || $selectedDate) {
    levels = getOKRsByLevel($selectedDate);
    connectionLines = getConnectionLines(levels, okrData);
  }
  
  // Update store whenever okrData changes
  $: okrDataStore.set(okrData);</script>

<div class="okr-container">
  <div class="okr-header">
    <div>
      <h1>OKR System</h1>
      <p class="view-indicator">
        {#if $selectedDate}
          Viewing: {$selectedDate.toLocaleDateString()} 
          {#if $selectedDate < new Date()}
            <span class="badge historical">Historical</span>
          {:else if $selectedDate > new Date()}
            <span class="badge predicted">Predicted</span>
          {:else}
            <span class="badge current">Current</span>
          {/if}
        {/if}
      </p>
    </div>
    <div class="header-actions">
      <div class="alignment-controls">
        <label><input type="radio" bind:group={alignment} value="left" /> Left</label>
        <label><input type="radio" bind:group={alignment} value="center" /> Center</label>
        <label><input type="radio" bind:group={alignment} value="right" /> Right</label>
      </div>
      <button class="btn-primary" on:click={() => openAddModal()}>+ Add OKR</button>
    </div>
  </div>

  <svg class="connections">
    {#each connectionLines as line}
      <path d={line.path} stroke="#94a3b8" stroke-width="2" fill="none" opacity="0.7" />
    {/each}
  </svg>

  <div class="okr-chart">
    {#each Object.keys(levels) as levelKey}
      {@const level = parseInt(levelKey)}
      {#each levels[level] as okr, index}
        {@const pos = getNodePosition(level, index, levels[level].length)}
        {@const isBeingDragged = draggedOKR?.id === okr.id}
        {@const isHovered = hoveredOKR?.id === okr.id}
        {@const isHighlighted = highlightedOKRId === okr.id}
        
        <div
          class="okr-node"
          class:dragging={isBeingDragged}
          class:hovered={isHovered}
          class:highlighted={isHighlighted}
          class:objective={okr.type === 'objective'}
          class:key-result={okr.type === 'key_result'}
          draggable="true"
          on:dragstart={handleDragStart(okr)}
          on:dragover={handleDragOver}
          on:dragenter={handleDragEnter(okr)}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop(okr)}
          on:dragend={handleDragEnd}
          on:click={() => handleOKRClick(okr)}
          style="left: {pos.x}px; top: {pos.y}px; width: {nodeWidth}px; height: {nodeHeight}px; border-left-color: {getRiskColor(okr.risk)};"
        >
          <div class="okr-header-node">
            <span class="okr-type">{okr.type === 'objective' ? '🎯' : '🔑'}</span>
            <div class="okr-actions">
              <button class="icon-btn" on:click|stopPropagation={() => openAddModal(okr)} title="Add child">➕</button>
              <button class="icon-btn" on:click|stopPropagation={() => openEditModal(okr)} title="Edit">✏️</button>
              <button class="icon-btn delete" on:click|stopPropagation={() => openDeleteModal(okr)} title="Delete">🗑️</button>
            </div>
          </div>
          
          <h4 class="okr-title">{okr.title}</h4>
          
          <div class="okr-metrics">
            <div class="metric">
              <div class="progress-bar">
                <div class="progress-fill" style="width: {okr.progress}%; background-color: {getProgressColor(okr.progress)};"></div>
              </div>
              <span class="progress-text">{okr.progress}%</span>
            </div>
            
            <div class="metric-row">
              <span class="metric-item risk" style="color: {getRiskColor(okr.risk)};">
                ⚠️ {okr.risk}
              </span>
              <span class="metric-item">
                📅 {okr.daysLeft}d left
              </span>
            </div>
            
            {#if okr.owner}
              <div class="okr-owner">👤 {okr.owner}</div>
            {/if}
          </div>
          
          {#if okr.viewType === 'historical'}
            <div class="view-badge historical">Historical</div>
          {:else if okr.viewType === 'predicted'}
            <div class="view-badge predicted">Predicted</div>
          {/if}
        </div>
      {/each}
    {/each}
  </div>

  <!-- Add OKR Modal -->
  {#if showAddModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Add New {selectedOKRNode ? 'Key Result' : 'Objective'}</h2>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" bind:value={formData.title} placeholder="Enter title" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Progress (%):</label>
            <input type="number" bind:value={formData.progress} min="0" max="100" />
          </div>
          <div class="form-group">
            <label>Days Left:</label>
            <input type="number" bind:value={formData.daysLeft} min="0" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Risk:</label>
            <select bind:value={formData.risk}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="form-group">
            <label>Owner:</label>
            <input type="text" bind:value={formData.owner} placeholder="Owner name" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-primary" on:click={addOKR}>Add</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Edit OKR Modal -->
  {#if showEditModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Edit OKR</h2>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" bind:value={formData.title} placeholder="Enter title" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Progress (%):</label>
            <input type="number" bind:value={formData.progress} min="0" max="100" />
          </div>
          <div class="form-group">
            <label>Days Left:</label>
            <input type="number" bind:value={formData.daysLeft} min="0" />
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Risk:</label>
            <select bind:value={formData.risk}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="form-group">
            <label>Owner:</label>
            <input type="text" bind:value={formData.owner} placeholder="Owner name" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-primary" on:click={updateOKR}>Save</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete OKR Modal -->
  {#if showDeleteModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Delete OKR</h2>
        <p>Are you sure you want to delete <strong>{selectedOKRNode.title}</strong>?</p>
        {#if okrData.some(o => o.parentId === selectedOKRNode.id)}
          <p class="warning">⚠️ This OKR has children. They will be reassigned to {selectedOKRNode.parentId ? okrData.find(o => o.id === selectedOKRNode.parentId)?.title : 'no parent'}.</p>
        {/if}
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-danger" on:click={deleteOKR}>Delete</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .okr-container {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(to bottom right, #f8fafc, #dbeafe);
    overflow: auto;
    position: relative;
  }

  .okr-header {
    position: sticky;
    top: 0;
    background: white;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    z-index: 100;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .okr-header h1 {
    margin: 0 0 0.25rem 0;
    font-size: 1.75rem;
    color: #1e293b;
  }

  .view-indicator {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .badge {
    padding: 0.125rem 0.5rem;
    border-radius: 0.25rem;
    font-size: 0.75rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .badge.current {
    background: #dbeafe;
    color: #1e40af;
  }

  .badge.historical {
    background: #fef3c7;
    color: #92400e;
  }

  .badge.predicted {
    background: #e9d5ff;
    color: #6b21a8;
  }

  .header-actions {
    display: flex;
    gap: 1rem;
    align-items: center;
  }

  .alignment-controls {
    display: flex;
    gap: 0.75rem;
  }

  .alignment-controls label {
    display: flex;
    align-items: center;
    gap: 0.25rem;
    font-size: 0.875rem;
    color: #475569;
    cursor: pointer;
  }

  .connections {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
    min-height: 100vh;
    min-width: 100vw;
    z-index: 1;
  }

  .okr-chart {
    position: relative;
    min-height: 100vh;
    min-width: 100vw;
    padding-top: 2rem;
    z-index: 2;
  }

  .okr-node {
    position: absolute;
    background: white;
    border-radius: 0.5rem;
    border-left: 5px solid;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    cursor: move;
    transition: all 0.2s;
  }

  .okr-node:hover {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
  }

  .okr-node.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  .okr-node.hovered {
    box-shadow: 0 0 0 4px #60a5fa;
    transform: scale(1.05);
  }

  .okr-node.highlighted {
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1), 0 0 0 3px #3b82f6;
  }

  .okr-header-node {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  .okr-type {
    font-size: 1.25rem;
  }

  .okr-actions {
    display: flex;
    gap: 0.25rem;
  }

  .icon-btn {
    background: none;
    border: none;
    font-size: 0.75rem;
    cursor: pointer;
    padding: 0.25rem;
    opacity: 0.6;
    transition: all 0.2s;
    border-radius: 0.25rem;
  }

  .icon-btn:hover {
    opacity: 1;
    background: #f1f5f9;
  }

  .icon-btn.delete:hover {
    background: #fee2e2;
  }

  .okr-title {
    margin: 0 0 0.75rem 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1e293b;
    line-height: 1.3;
    min-height: 2.6em;
  }

  .okr-metrics {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .metric {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .progress-bar {
    flex: 1;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
  }

  .progress-fill {
    height: 100%;
    transition: width 0.3s;
  }

  .progress-text {
    font-size: 0.75rem;
    font-weight: 600;
    color: #475569;
    min-width: 35px;
  }

  .metric-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .metric-item {
    font-size: 0.75rem;
    color: #64748b;
    display: flex;
    align-items: center;
    gap: 0.25rem;
  }

  .metric-item.risk {
    font-weight: 600;
    text-transform: uppercase;
  }

  .okr-owner {
    font-size: 0.75rem;
    color: #64748b;
    padding-top: 0.25rem;
    border-top: 1px solid #e2e8f0;
  }

  .view-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-size: 0.625rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .view-badge.historical {
    background: #fef3c7;
    color: #92400e;
  }

  .view-badge.predicted {
    background: #e9d5ff;
    color: #6b21a8;
  }

  /* Modal Styles */
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
  }

  .modal {
    background: white;
    border-radius: 0.5rem;
    padding: 1.5rem;
    min-width: 450px;
    max-width: 550px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .modal h2 {
    margin: 0 0 1.25rem 0;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.375rem;
  }

  .form-group input,
  .form-group select {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    box-sizing: border-box;
  }

  .form-group input:focus,
  .form-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .modal-actions {
    display: flex;
    gap: 0.5rem;
    justify-content: flex-end;
    margin-top: 1.5rem;
  }

  .btn-primary,
  .btn-secondary {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary {
    background: #3b82f6;
    color: white;
  }

  .btn-primary:hover {
    background: #2563eb;
  }

  .btn-secondary {
    background: #e2e8f0;
    color: #475569;
  }

  .btn-secondary:hover {
    background: #cbd5e1;
  }

  .btn-danger {
    background: #ef4444;
    color: white;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .warning {
    color: #f59e0b;
    font-size: 0.875rem;
    margin-top: 0.5rem;
    padding: 0.5rem;
    background: #fef3c7;
    border-radius: 0.375rem;
  }
</style>