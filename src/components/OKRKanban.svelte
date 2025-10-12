<script>
  import { selectedOKR, okrDataStore } from '$lib/okr/stores.js';

  let columns = [
    { id: 1, title: 'To Do', color: '#64748b' },
    { id: 2, title: 'In Progress', color: '#3b82f6' },
    { id: 3, title: 'Review', color: '#f59e0b' },
    { id: 4, title: 'Done', color: '#10b981' }
  ];

  let allTasks = [
    { id: 1, title: 'Design Product A UI', okrId: 4, columnId: 4, priority: 'high', assignee: 'Sarah' },
    { id: 2, title: 'Develop backend API', okrId: 4, columnId: 2, priority: 'high', assignee: 'John' },
    { id: 3, title: 'User testing sessions', okrId: 4, columnId: 1, priority: 'medium', assignee: 'Mike' },
    { id: 4, title: 'Product B requirements', okrId: 5, columnId: 4, priority: 'high', assignee: 'Lisa' },
    { id: 5, title: 'Beta user recruitment', okrId: 5, columnId: 2, priority: 'medium', assignee: 'Sarah' },
    { id: 6, title: 'A/B testing framework', okrId: 6, columnId: 4, priority: 'high', assignee: 'John' },
    { id: 7, title: 'Optimize landing pages', okrId: 6, columnId: 2, priority: 'high', assignee: 'Mike' },
    { id: 8, title: 'Marketing campaign Q4', okrId: 3, columnId: 2, priority: 'high', assignee: 'Lisa' },
    { id: 9, title: 'Product A deployment', okrId: 4, columnId: 3, priority: 'high', assignee: 'John' },
    { id: 10, title: 'Customer feedback analysis', okrId: 3, columnId: 1, priority: 'medium', assignee: 'Sarah' }
  ];

  let draggedTask = null;
  let draggedOverColumn = null;
  let showAddTaskModal = false;
  let showEditTaskModal = false;
  let showAddColumnModal = false;
  let selectedTask = null;

  let taskFormData = {
    title: '',
    columnId: 1,
    priority: 'medium',
    assignee: ''
  };

  let columnFormData = {
    title: '',
    color: '#64748b'
  };

  // Get all OKR IDs in the hierarchy (current + all descendants)
  function getOKRHierarchy(okrId, allOKRs) {
    const result = [okrId];
    const children = allOKRs.filter(o => o.parentId === okrId);
    children.forEach(child => {
      result.push(...getOKRHierarchy(child.id, allOKRs));
    });
    return result;
  }

  // Filter tasks: direct (editable) and indirect (read-only)
  function getFilteredTasks() {
    if (!$selectedOKR) {
      return { direct: [], indirect: [] };
    }

    // Get all child OKR IDs using the store data
    const childOKRIds = getOKRHierarchy($selectedOKR.id, $okrDataStore).filter(id => id !== $selectedOKR.id);

    const direct = allTasks.filter(task => task.okrId === $selectedOKR.id);
    const indirect = allTasks.filter(task => childOKRIds.includes(task.okrId));

    return { direct, indirect };
  }

  function getTasksByColumn(columnId, taskList) {
    return taskList.filter(task => task.columnId === columnId);
  }

  function handleTaskDragStart(task, isEditable) {
    return function(event) {
      if (!isEditable) {
        event.preventDefault();
        return;
      }
      draggedTask = task;
      event.dataTransfer.effectAllowed = 'move';
    };
  }

  function handleColumnDragOver(columnId) {
    return function(event) {
      event.preventDefault();
      if (draggedTask) {
        event.dataTransfer.dropEffect = 'move';
        draggedOverColumn = columnId;
      }
    };
  }

  function handleColumnDrop(columnId) {
    return function(event) {
      event.preventDefault();
      
      if (!draggedTask) return;

      allTasks = allTasks.map(task =>
        task.id === draggedTask.id
          ? { ...task, columnId: columnId }
          : task
      );

      draggedTask = null;
      draggedOverColumn = null;
    };
  }

  function openAddTaskModal() {
    if (!$selectedOKR) {
      alert('Please select an OKR first');
      return;
    }

    taskFormData = {
      title: '',
      columnId: 1,
      priority: 'medium',
      assignee: ''
    };
    showAddTaskModal = true;
  }

  function openEditTaskModal(task) {
    taskFormData = {
      title: task.title,
      columnId: task.columnId,
      priority: task.priority,
      assignee: task.assignee
    };
    selectedTask = task;
    showEditTaskModal = true;
  }

  function closeModals() {
    showAddTaskModal = false;
    showEditTaskModal = false;
    showAddColumnModal = false;
    selectedTask = null;
  }

  function openAddColumnModal() {
    columnFormData = {
      title: '',
      color: '#64748b'
    };
    showAddColumnModal = true;
  }

  function addColumn() {
    if (!columnFormData.title.trim()) {
      alert('Please enter a column title');
      return;
    }

    const newId = Math.max(...columns.map(c => c.id)) + 1;
    columns = [
      ...columns,
      {
        id: newId,
        title: columnFormData.title.trim(),
        color: columnFormData.color
      }
    ];

    closeModals();
  }

  function deleteColumn(columnId) {
    const tasksInColumn = allTasks.filter(t => t.columnId === columnId);
    if (tasksInColumn.length > 0) {
      alert('Cannot delete column with tasks. Please move or delete tasks first.');
      return;
    }

    columns = columns.filter(col => col.id !== columnId);
  }

  function addTask() {
    if (!taskFormData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const newId = Math.max(...allTasks.map(t => t.id), 0) + 1;
    const newTask = {
      id: newId,
      title: taskFormData.title.trim(),
      okrId: $selectedOKR.id,
      columnId: taskFormData.columnId,
      priority: taskFormData.priority,
      assignee: taskFormData.assignee.trim()
    };
    
    allTasks = [...allTasks, newTask];
    closeModals();
  }

  function updateTask() {
    if (!taskFormData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    allTasks = allTasks.map(task =>
      task.id === selectedTask.id
        ? {
            ...task,
            title: taskFormData.title.trim(),
            columnId: taskFormData.columnId,
            priority: taskFormData.priority,
            assignee: taskFormData.assignee.trim()
          }
        : task
    );

    closeModals();
  }

  function deleteTask(task) {
    if (confirm('Are you sure you want to delete this task?')) {
      allTasks = allTasks.filter(t => t.id !== task.id);
    }
  }

  function getPriorityColor(priority) {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  }

  $: filteredTasks = getFilteredTasks();
  $: tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = {
      direct: getTasksByColumn(col.id, filteredTasks.direct),
      indirect: getTasksByColumn(col.id, filteredTasks.indirect)
    };
    return acc;
  }, {});
  
  // Re-filter when allTasks, okrDataStore, or selectedOKR changes
  $: if (allTasks || $okrDataStore || $selectedOKR) {
    filteredTasks = getFilteredTasks();
    tasksByColumn = columns.reduce((acc, col) => {
      acc[col.id] = {
        direct: getTasksByColumn(col.id, filteredTasks.direct),
        indirect: getTasksByColumn(col.id, filteredTasks.indirect)
      };
      return acc;
    }, {});
  }
</script>

<div class="kanban-container">
  <div class="kanban-header">
    <div>
      <h2>Tasks</h2>
      {#if $selectedOKR}
        <p class="okr-context">For: <strong>{$selectedOKR.title}</strong></p>
      {:else}
        <p class="okr-context">Select an OKR to view tasks</p>
      {/if}
    </div>
    <div class="header-actions">
      <button class="btn-primary" on:click={openAddTaskModal} disabled={!$selectedOKR}>
        + Add Task
      </button>
      <button class="btn-secondary" on:click={openAddColumnModal}>
        + Add Column
      </button>
    </div>
  </div>

  {#if $selectedOKR}
    <div class="kanban-board">
      {#each columns as column}
        <div
          class="column"
          class:drag-over={draggedOverColumn === column.id}
          on:dragover={handleColumnDragOver(column.id)}
          on:drop={handleColumnDrop(column.id)}
        >
          <div class="column-header" style="border-left: 4px solid {column.color}">
            <h3>{column.title}</h3>
            <div class="column-actions">
              <span class="task-count">
                {(tasksByColumn[column.id]?.direct.length || 0) + (tasksByColumn[column.id]?.indirect.length || 0)}
              </span>
              <button class="icon-btn" on:click={() => openAddTaskModal(column.id)} title="Add task">➕</button>
              <button class="column-delete-btn" on:click|stopPropagation={() => deleteColumn(column.id)} title="Delete column">🗑️</button>            
            </div>
          </div>

          <div class="tasks-container">
            <!-- Direct tasks (editable) -->
            {#each tasksByColumn[column.id]?.direct || [] as task (task.id)}
              <div
                class="task-card editable"
                class:dragging={draggedTask?.id === task.id}
                draggable="true"
                on:dragstart={handleTaskDragStart(task, true)}
                on:dragend={() => draggedTask = null}
              >
                <div class="task-header">
                  <h4>{task.title}</h4>
                  <div class="task-actions">
                    <button class="icon-btn-small" on:click|stopPropagation={() => openEditTaskModal(task)}>✏️</button>
                    <button class="icon-btn-small delete" on:click|stopPropagation={() => deleteTask(task)}>🗑️</button>
                  </div>
                </div>
                
                <div class="task-footer">
                  <span class="priority-badge" style="background-color: {getPriorityColor(task.priority)}">
                    {task.priority}
                  </span>
                  {#if task.assignee}
                    <span class="assignee">👤 {task.assignee}</span>
                  {/if}
                </div>
              </div>
            {/each}

            <!-- Indirect tasks (read-only) -->
            {#each tasksByColumn[column.id]?.indirect || [] as task (task.id)}
              <div class="task-card readonly">
                <div class="readonly-badge">🔒 Read-only</div>
                <div class="task-header">
                  <h4>{task.title}</h4>
                </div>
                
                <div class="task-footer">
                  <span class="priority-badge" style="background-color: {getPriorityColor(task.priority)}">
                    {task.priority}
                  </span>
                  {#if task.assignee}
                    <span class="assignee">👤 {task.assignee}</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <div class="empty-state">
      <div class="empty-icon">📋</div>
      <p>Select an OKR node to view and manage tasks</p>
    </div>
  {/if}

  <!-- Add Task Modal -->
  {#if showAddTaskModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Add New Task</h2>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" bind:value={taskFormData.title} placeholder="Enter task title" />
        </div>
        <div class="form-group">
          <label>Column:</label>
          <select bind:value={taskFormData.columnId}>
            {#each columns as col}
              <option value={col.id}>{col.title}</option>
            {/each}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Priority:</label>
            <select bind:value={taskFormData.priority}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="form-group">
            <label>Assignee:</label>
            <input type="text" bind:value={taskFormData.assignee} placeholder="Name" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-primary" on:click={addTask}>Add Task</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Edit Task Modal -->
  {#if showEditTaskModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Edit Task</h2>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" bind:value={taskFormData.title} placeholder="Enter task title" />
        </div>
        <div class="form-group">
          <label>Column:</label>
          <select bind:value={taskFormData.columnId}>
            {#each columns as col}
              <option value={col.id}>{col.title}</option>
            {/each}
          </select>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label>Priority:</label>
            <select bind:value={taskFormData.priority}>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div class="form-group">
            <label>Assignee:</label>
            <input type="text" bind:value={taskFormData.assignee} placeholder="Name" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-primary" on:click={updateTask}>Save</button>
        </div>
      </div>
    </div>
  {/if}

  <!-- Add Column Modal -->
  {#if showAddColumnModal}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Add New Column</h2>
        <div class="form-group">
          <label>Title:</label>
          <input type="text" bind:value={columnFormData.title} placeholder="Enter column title" />
        </div>
        <div class="form-group">
          <label>Color:</label>
          <input type="color" bind:value={columnFormData.color} />
        </div>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-primary" on:click={addColumn}>Add Column</button>
        </div>
      </div>
    </div>
  {/if}
</div>

<style>
  .kanban-container {
    width: 100%;
    min-height: 400px;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
    border-bottom: 1px solid #e2e8f0;
  }

  .kanban-header h2 {
    margin: 0 0 0.25rem 0;
    font-size: 1.5rem;
    color: #1e293b;
  }

  .okr-context {
    margin: 0;
    font-size: 0.875rem;
    color: #64748b;
  }

  .okr-context strong {
    color: #3b82f6;
  }

  .header-actions {
    display: flex;
    gap: 0.5rem;
  }

  .header-actions button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .kanban-board {
    display: flex;
    gap: 1rem;
    padding: 1.5rem;
    overflow-x: auto;
  }

  .column {
    flex: 0 0 280px;
    background: #f8fafc;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    max-height: 600px;
    transition: all 0.2s;
  }

  .column.drag-over {
    background: #eff6ff;
    box-shadow: 0 0 0 2px #3b82f6;
  }

  .column-header {
    display: flex;
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    background: white;
    border-radius: 0.5rem 0.5rem 0 0;
  }

  .column-title-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
    gap: 0.5rem;
  }

  .column-header h3 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1e293b;
    flex: 1;
    min-width: 0;
  }

  .column-delete-btn {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    cursor: pointer;
    padding: 0.5rem;
    transition: all 0.2s;
    border-radius: 0.375rem;
    font-size: 1.125rem;
    line-height: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 2rem;
    height: 2rem;
  }

  .column-delete-btn:hover {
    background: #fee2e2;
    border-color: #fecaca;
    transform: scale(1.05);
  }

  .column-actions {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .task-count {
    background: #e2e8f0;
    color: #475569;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    font-size: 0.75rem;
    font-weight: 600;
    display: inline-block;
  }

  .tasks-container {
    flex: 1;
    overflow-y: auto;
    padding: 0.75rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }

  .task-card {
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 0.5rem;
    padding: 0.875rem;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
    position: relative;
  }

  .task-card.editable {
    cursor: grab;
  }

  .task-card.editable:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }

  .task-card.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .task-card.readonly {
    background: #f8fafc;
    border-color: #cbd5e1;
    opacity: 0.8;
  }

  .readonly-badge {
    position: absolute;
    top: 0.5rem;
    right: 0.5rem;
    font-size: 0.625rem;
    color: #64748b;
    background: #e2e8f0;
    padding: 0.125rem 0.375rem;
    border-radius: 0.25rem;
    font-weight: 600;
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 0.5rem;
  }

  .task-header h4 {
    margin: 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #1e293b;
    flex: 1;
    line-height: 1.3;
  }

  .task-actions {
    display: flex;
    gap: 0.25rem;
    margin-left: 0.5rem;
  }

  .task-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 0.5rem;
  }

  .priority-badge {
    font-size: 0.6875rem;
    color: white;
    padding: 0.25rem 0.5rem;
    border-radius: 0.25rem;
    font-weight: 600;
    text-transform: uppercase;
  }

  .assignee {
    font-size: 0.75rem;
    color: #64748b;
  }

  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 4rem 2rem;
    color: #94a3b8;
  }

  .empty-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  .empty-state p {
    margin: 0;
    font-size: 1rem;
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

  .form-group input[type="color"] {
    height: 40px;
    cursor: pointer;
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
</style>