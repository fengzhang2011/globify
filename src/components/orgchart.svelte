<script>
  let employees = [
    { id: 1, name: 'Sarah Chen', title: 'CEO', supervisorId: null },
    { id: 2, name: 'Marcus Rodriguez', title: 'CTO', supervisorId: 1 },
    { id: 3, name: 'Emily Watson', title: 'CFO', supervisorId: 1 },
    { id: 4, name: 'James Kim', title: 'VP Engineering', supervisorId: 2 },
    { id: 5, name: 'Lisa Anderson', title: 'VP Product', supervisorId: 2 },
    { id: 6, name: 'David Park', title: 'Senior Engineer', supervisorId: 4 },
    { id: 7, name: 'Rachel Green', title: 'Engineer', supervisorId: 4 },
    { id: 8, name: 'Tom Wilson', title: 'Product Manager', supervisorId: 5 },
    { id: 9, name: 'Anna Martinez', title: 'Accountant', supervisorId: 3 },
  ];

  let draggedEmployee = null;
  let hoveredEmployee = null;
  let alignment = 'center'; // 'left', 'center', or 'right'
  
  // Modal states
  let showAddModal = false;
  let showEditModal = false;
  let showDeleteConfirm = false;
  let selectedEmployee = null;
  let highlightedEmployeeId = null;
  
  // Form data
  let formData = {
    name: '',
    title: '',
    supervisorId: null
  };

  const nodeWidth = 200;
  const nodeHeight = 80;
  const levelHeight = 150;
  const nodeSpacing = 50;

  function getEmployeesByLevel(empList) {
    const levels = {};
    const processed = new Set();
    
    function assignLevel(emp, level) {
      if (processed.has(emp.id)) return;
      processed.add(emp.id);
      
      if (!levels[level]) levels[level] = [];
      levels[level].push(emp);
      
      const subordinates = empList.filter(e => e.supervisorId === emp.id);
      subordinates.forEach(sub => assignLevel(sub, level + 1));
    }
    
    const ceo = empList.find(e => e.supervisorId === null);
    if (ceo) assignLevel(ceo, 0);
    
    return levels;
  }

  function getNodePosition(level, index, totalInLevel) {
    const totalWidth = totalInLevel * (nodeWidth + nodeSpacing) - nodeSpacing;
    const containerWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    let startX;
    if (alignment === 'left') {
      startX = 50; // Left margin
    } else if (alignment === 'right') {
      startX = containerWidth - totalWidth - 50; // Right margin
    } else { // center
      startX = (containerWidth - totalWidth) / 2;
    }
    
    return {
      x: startX + index * (nodeWidth + nodeSpacing),
      y: 50 + level * levelHeight
    };
  }

  function getConnectionLines(levels, empList) {
    const lines = [];
    Object.keys(levels).forEach(levelKey => {
      const level = parseInt(levelKey);
      levels[level].forEach((emp, empIndex) => {
        const subordinates = empList.filter(e => e.supervisorId === emp.id);
        subordinates.forEach((sub, subIdx) => {
          const subLevel = level + 1;
          const subIndex = levels[subLevel]?.indexOf(sub);
          if (subIndex !== -1) {
            const fromPos = getNodePosition(level, empIndex, levels[level].length);
            const toPos = getNodePosition(subLevel, subIndex, levels[subLevel].length);
            
            const x1 = fromPos.x + nodeWidth / 2;
            const y1 = fromPos.y + nodeHeight;
            const x2 = toPos.x + nodeWidth / 2;
            const y2 = toPos.y;
            
            // Calculate control points for smooth curves
            const verticalGap = y2 - y1;
            const horizontalDist = Math.abs(x2 - x1);
            
            // Adjust curve based on horizontal distance
            const curveIntensity = Math.min(verticalGap * 0.6, 60);
            
            // Control points for Bézier curve
            const cx1 = x1;
            const cy1 = y1 + curveIntensity;
            const cx2 = x2;
            const cy2 = y2 - curveIntensity;
            
            // Use cubic Bézier curve for smooth connections
            lines.push({
              path: `M ${x1} ${y1} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${x2} ${y2}`,
              fromId: emp.id,
              toId: sub.id
            });
          }
        });
      });
    });
    return lines;
  }

  function handleDragStart(employee) {
    return function(event) {
      draggedEmployee = employee;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', employee.id.toString());
    };
  }

  function handleDragOver(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }

  function handleDragEnter(employee) {
    return function(event) {
      event.preventDefault();
      if (draggedEmployee && draggedEmployee.id !== employee.id) {
        hoveredEmployee = employee;
      }
    };
  }

  function handleDragLeave() {
    hoveredEmployee = null;
  }

  function handleDrop(newSupervisor) {
    return function(event) {
      event.preventDefault();
      
      if (!draggedEmployee || draggedEmployee.id === newSupervisor.id) {
        draggedEmployee = null;
        hoveredEmployee = null;
        return;
      }

      // Check if the new supervisor is a subordinate of the dragged employee
      function isSubordinate(empId, potentialSubId) {
        const emp = employees.find(e => e.id === potentialSubId);
        if (!emp || !emp.supervisorId) return false;
        if (emp.supervisorId === empId) return true;
        return isSubordinate(empId, emp.supervisorId);
      }

      if (isSubordinate(draggedEmployee.id, newSupervisor.id)) {
        alert('Cannot assign someone to report to their own subordinate!');
        draggedEmployee = null;
        hoveredEmployee = null;
        return;
      }

      // Update the employees array - use array spread to force reactivity
      employees = [
        ...employees.map(emp =>
          emp.id === draggedEmployee.id
            ? { ...emp, supervisorId: newSupervisor.id }
            : emp
        )
      ];

      draggedEmployee = null;
      hoveredEmployee = null;
    };
  }

  function handleDragEnd() {
    draggedEmployee = null;
    hoveredEmployee = null;
  }

  $: levels = getEmployeesByLevel(employees);
  $: connectionLines = getConnectionLines(levels, employees);
  
  // Trigger re-layout when alignment changes
  $: if (alignment) {
    levels = getEmployeesByLevel(employees);
    connectionLines = getConnectionLines(levels, employees);
  }
  
  function openAddModal(supervisor = null) {
    formData = {
      name: '',
      title: '',
      supervisorId: supervisor ? supervisor.id : null
    };
    selectedEmployee = supervisor;
    highlightedEmployeeId = supervisor ? supervisor.id : null;
    showAddModal = true;
  }
  
  function openEditModal(employee) {
    formData = {
      name: employee.name,
      title: employee.title,
      supervisorId: employee.supervisorId
    };
    selectedEmployee = employee;
    highlightedEmployeeId = employee.id;
    showEditModal = true;
  }
  
  function openDeleteConfirm(employee) {
    selectedEmployee = employee;
    highlightedEmployeeId = employee.id;
    showDeleteConfirm = true;
  }
  
  function closeModals() {
    showAddModal = false;
    showEditModal = false;
    showDeleteConfirm = false;
    selectedEmployee = null;
    highlightedEmployeeId = null;
  }
  
  function addEmployee() {
    if (!formData.name.trim() || !formData.title.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    const newId = Math.max(...employees.map(e => e.id)) + 1;
    employees = [
      ...employees,
      {
        id: newId,
        name: formData.name.trim(),
        title: formData.title.trim(),
        supervisorId: formData.supervisorId
      }
    ];
    
    closeModals();
  }
  
  function updateEmployee() {
    if (!formData.name.trim() || !formData.title.trim()) {
      alert('Please fill in all fields');
      return;
    }
    
    // Check for circular reporting
    if (formData.supervisorId === selectedEmployee.id) {
      alert('An employee cannot report to themselves!');
      return;
    }
    
    function isSubordinate(empId, potentialSubId) {
      const emp = employees.find(e => e.id === potentialSubId);
      if (!emp || !emp.supervisorId) return false;
      if (emp.supervisorId === empId) return true;
      return isSubordinate(empId, emp.supervisorId);
    }
    
    if (formData.supervisorId && isSubordinate(selectedEmployee.id, formData.supervisorId)) {
      alert('Cannot assign someone to report to their own subordinate!');
      return;
    }
    
    employees = [
      ...employees.map(emp =>
        emp.id === selectedEmployee.id
          ? {
              ...emp,
              name: formData.name.trim(),
              title: formData.title.trim(),
              supervisorId: formData.supervisorId
            }
          : emp
      )
    ];
    
    closeModals();
  }
  
  function deleteEmployee() {
    // Check if employee has subordinates
    const hasSubordinates = employees.some(e => e.supervisorId === selectedEmployee.id);
    
    if (hasSubordinates) {
      // Reassign subordinates to the deleted employee's supervisor
      employees = [
        ...employees
          .filter(emp => emp.id !== selectedEmployee.id)
          .map(emp =>
            emp.supervisorId === selectedEmployee.id
              ? { ...emp, supervisorId: selectedEmployee.supervisorId }
              : emp
          )
      ];
    } else {
      employees = [...employees.filter(emp => emp.id !== selectedEmployee.id)];
    }
    
    closeModals();
  }
</script>

<div class="org-chart-container">
  <div class="header">
    <h1>Organization Chart</h1>
    <p>Drag employees to reorganize reporting lines</p>
    <div class="alignment-controls">
      <label>
        <input type="radio" bind:group={alignment} value="left" />
        Left
      </label>
      <label>
        <input type="radio" bind:group={alignment} value="center" />
        Center
      </label>
      <label>
        <input type="radio" bind:group={alignment} value="right" />
        Right
      </label>
    </div>
    <button class="add-btn" on:click={() => openAddModal()}>+ Add Employee</button>
  </div>

  <svg class="connections">
    {#each connectionLines as line, idx}
      <path
        d={line.path}
        stroke="#94a3b8"
        stroke-width="2"
        fill="none"
        opacity="0.7"
      />
    {/each}
  </svg>

  <div class="nodes-container">
    {#each Object.keys(levels) as levelKey}
      {@const level = parseInt(levelKey)}
      {#each levels[level] as employee, index}
        {@const pos = getNodePosition(level, index, levels[level].length)}
        {@const isBeingDragged = draggedEmployee?.id === employee.id}
        {@const isHovered = hoveredEmployee?.id === employee.id}
        {@const isHighlighted = highlightedEmployeeId === employee.id}
        {@const supervisor = employees.find(e => e.id === employee.supervisorId)}
        
        <div
          class="employee-card"
          class:dragging={isBeingDragged}
          class:hovered={isHovered}
          class:highlighted={isHighlighted}
          draggable="true"
          on:dragstart={handleDragStart(employee)}
          on:dragover={handleDragOver}
          on:dragenter={handleDragEnter(employee)}
          on:dragleave={handleDragLeave}
          on:drop={handleDrop(employee)}
          on:dragend={handleDragEnd}
          on:click={() => highlightedEmployeeId = employee.id}
          role="button"
          tabindex="0"
          style="left: {pos.x}px; top: {pos.y}px; width: {nodeWidth}px; height: {nodeHeight}px;"
        >
          <div class="card-content">
            <div class="grip-icon">⋮⋮</div>
            <div class="employee-info">
              <div class="name-row">
                <span class="user-icon">👤</span>
                <h3>{employee.name}</h3>
              </div>
              <p class="title">{employee.title}</p>
              {#if supervisor}
                <p class="reports-to">Reports to: {supervisor.name}</p>
              {/if}
            </div>
            <div class="action-buttons">
              <button class="icon-btn" on:click|stopPropagation={() => openAddModal(employee)} title="Add subordinate">➕</button>
              <button class="icon-btn" on:click|stopPropagation={() => openEditModal(employee)} title="Edit">✏️</button>
              <button class="icon-btn delete" on:click|stopPropagation={() => openDeleteConfirm(employee)} title="Delete">🗑️</button>
            </div>
          </div>
        </div>
      {/each}
    {/each}
  </div>

  <!-- Add Employee Modal -->
  {#if showAddModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Add New Employee</h2>
        {#if selectedEmployee}
          <p class="modal-subtitle">Will report to: {selectedEmployee.name}</p>
        {/if}
        <div class="form-group">
          <label>Name:</label>
          <input type="text" bind:value={formData.name} placeholder="Enter name" />
        </div>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" bind:value={formData.title} placeholder="Enter title" />
        </div>
        <div class="form-group">
          <label>Reports to:</label>
          <select bind:value={formData.supervisorId}>
            <option value={null}>None (CEO)</option>
            {#each employees as emp}
              <option value={emp.id}>{emp.name} - {emp.title}</option>
            {/each}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-primary" on:click={addEmployee}>Add</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Edit Employee Modal -->
  {#if showEditModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Edit Employee</h2>
        <div class="form-group">
          <label>Name:</label>
          <input type="text" bind:value={formData.name} placeholder="Enter name" />
        </div>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" bind:value={formData.title} placeholder="Enter title" />
        </div>
        <div class="form-group">
          <label>Reports to:</label>
          <select bind:value={formData.supervisorId}>
            <option value={null}>None (CEO)</option>
            {#each employees.filter(e => e.id !== selectedEmployee.id) as emp}
              <option value={emp.id}>{emp.name} - {emp.title}</option>
            {/each}
          </select>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-primary" on:click={updateEmployee}>Save</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Delete Confirmation Modal -->
  {#if showDeleteConfirm}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Delete Employee</h2>
        <p>Are you sure you want to delete <strong>{selectedEmployee.name}</strong>?</p>
        {#if employees.some(e => e.supervisorId === selectedEmployee.id)}
          <p class="warning">⚠️ This employee has subordinates. They will be reassigned to {selectedEmployee.supervisorId ? employees.find(e => e.id === selectedEmployee.supervisorId)?.name : 'no supervisor'}.</p>
        {/if}
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-danger" on:click={deleteEmployee}>Delete</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .org-chart-container {
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(to bottom right, #f8fafc, #dbeafe);
    overflow: auto;
    position: relative;
  }

  .header {
    position: absolute;
    top: 1rem;
    left: 1rem;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    z-index: 10;
  }

  .header h1 {
    font-size: 1.5rem;
    font-weight: bold;
    color: #1e293b;
    margin: 0 0 0.5rem 0;
  }

  .header p {
    font-size: 0.875rem;
    color: #64748b;
    margin: 0 0 0.75rem 0;
  }

  .alignment-controls {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
  }

  .alignment-controls label {
    display: flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.875rem;
    color: #475569;
    cursor: pointer;
  }

  .alignment-controls input[type="radio"] {
    cursor: pointer;
  }

  .add-btn {
    margin-top: 0.75rem;
    padding: 0.5rem 1rem;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s;
  }

  .add-btn:hover {
    background: #2563eb;
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
  }

  .nodes-container {
    position: relative;
    min-height: 100vh;
    min-width: 100vw;
  }

  .employee-card {
    position: absolute;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    padding: 1rem;
    cursor: move;
    transition: all 0.2s;
    user-select: none;
  }

  .employee-card:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .employee-card.dragging {
    opacity: 0.5;
    transform: scale(0.95);
  }

  .employee-card.hovered {
    box-shadow: 0 0 0 4px #60a5fa;
    transform: scale(1.05);
  }

  .employee-card.highlighted {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 0 0 3px #3b82f6;
    border-left: 4px solid #3b82f6;
  }

  .employee-card.highlighted:hover {
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 0 0 3px #3b82f6;
  }

  .card-content {
    display: flex;
    align-items: start;
    gap: 0.5rem;
    height: 100%;
    pointer-events: none;
  }

  .action-buttons {
    display: flex;
    gap: 0.25rem;
    pointer-events: auto;
    margin-left: auto;
  }

  .icon-btn {
    background: none;
    border: none;
    font-size: 0.875rem;
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

  .grip-icon {
    color: #cbd5e1;
    font-size: 0.875rem;
    flex-shrink: 0;
    margin-top: 0.25rem;
  }

  .employee-info {
    flex: 1;
    min-width: 0;
  }

  .name-row {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 0.25rem;
  }

  .user-icon {
    font-size: 1.25rem;
    flex-shrink: 0;
  }

  .employee-info h3 {
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .title {
    font-size: 0.75rem;
    color: #64748b;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .reports-to {
    font-size: 0.75rem;
    color: #cbd5e1;
    margin: 0.25rem 0 0 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
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
    min-width: 400px;
    max-width: 500px;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  }

  .modal h2 {
    margin: 0 0 1rem 0;
    font-size: 1.25rem;
    color: #1e293b;
  }

  .modal-subtitle {
    color: #64748b;
    font-size: 0.875rem;
    margin: -0.5rem 0 1rem 0;
  }

  .form-group {
    margin-bottom: 1rem;
  }

  .form-group label {
    display: block;
    font-size: 0.875rem;
    font-weight: 500;
    color: #475569;
    margin-bottom: 0.25rem;
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
  .btn-secondary,
  .btn-danger {
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