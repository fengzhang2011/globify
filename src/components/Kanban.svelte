<script>
  let columns = [
    { id: 1, title: 'To Do', color: '#64748b' },
    { id: 2, title: 'In Progress', color: '#3b82f6' },
    { id: 3, title: 'Review', color: '#f59e0b' },
    { id: 4, title: 'Done', color: '#10b981' }
  ];

  let tasks = [
    { id: 1, title: 'Design landing page', description: 'Create mockups for the new landing page', columnId: 1, priority: 'high', assignee: 'Sarah' },
    { id: 2, title: 'API integration', description: 'Connect frontend to backend API', columnId: 1, priority: 'medium', assignee: 'John' },
    { id: 3, title: 'User authentication', description: 'Implement login and signup', columnId: 2, priority: 'high', assignee: 'Mike' },
    { id: 4, title: 'Database optimization', description: 'Optimize query performance', columnId: 2, priority: 'low', assignee: 'Lisa' },
    { id: 5, title: 'Code review', description: 'Review pull requests', columnId: 3, priority: 'medium', assignee: 'Sarah' },
    { id: 6, title: 'Deploy to production', description: 'Release v2.0', columnId: 4, priority: 'high', assignee: 'John' }
  ];

  let draggedTask = null;
  let draggedOverColumn = null;
  let selectedTask = null;
  
  // Modal states
  let showAddTaskModal = false;
  let showEditTaskModal = false;
  let showDeleteConfirm = false;
  let showAddColumnModal = false;
  
  // Form data
  let taskFormData = {
    title: '',
    description: '',
    columnId: null,
    priority: 'medium',
    assignee: ''
  };
  
  let columnFormData = {
    title: '',
    color: '#64748b'
  };

  function getTasksByColumn(columnId) {
    return tasks.filter(task => task.columnId === columnId);
  }
  
  // Reactive statement to ensure UI updates when tasks change
  $: tasksByColumn = columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter(task => task.columnId === col.id);
    return acc;
  }, {});

  function handleTaskDragStart(task) {
    return function(event) {
      draggedTask = task;
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', task.id.toString());
    };
  }

  function handleColumnDragOver(columnId) {
    return function(event) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'move';
      draggedOverColumn = columnId;
    };
  }

  function handleColumnDragLeave() {
    draggedOverColumn = null;
  }

  function handleColumnDrop(columnId) {
    return function(event) {
      event.preventDefault();
      
      if (!draggedTask) return;

      tasks = [
        ...tasks.map(task =>
          task.id === draggedTask.id
            ? { ...task, columnId: columnId }
            : task
        )
      ];

      draggedTask = null;
      draggedOverColumn = null;
    };
  }

  function handleTaskDragEnd() {
    draggedTask = null;
    draggedOverColumn = null;
  }

  function openAddTaskModal(columnId = null) {
    taskFormData = {
      title: '',
      description: '',
      columnId: columnId || columns[0].id,
      priority: 'medium',
      assignee: ''
    };
    showAddTaskModal = true;
  }

  function openEditTaskModal(task) {
    taskFormData = {
      title: task.title,
      description: task.description,
      columnId: task.columnId,
      priority: task.priority,
      assignee: task.assignee
    };
    selectedTask = task;
    showEditTaskModal = true;
  }

  function openDeleteTaskConfirm(task) {
    selectedTask = task;
    showDeleteConfirm = true;
  }

  function openAddColumnModal() {
    columnFormData = {
      title: '',
      color: '#64748b'
    };
    showAddColumnModal = true;
  }

  function closeModals() {
    showAddTaskModal = false;
    showEditTaskModal = false;
    showDeleteConfirm = false;
    showAddColumnModal = false;
    selectedTask = null;
  }

  function addTask() {
    if (!taskFormData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    const newId = tasks.length > 0 ? Math.max(...tasks.map(t => t.id)) + 1 : 1;
    const newTask = {
      id: newId,
      title: taskFormData.title.trim(),
      description: taskFormData.description.trim(),
      columnId: taskFormData.columnId,
      priority: taskFormData.priority,
      assignee: taskFormData.assignee.trim()
    };
    
    // Force reactivity by creating a new array reference
    tasks = [...tasks, newTask];

    closeModals();
  }

  function updateTask() {
    if (!taskFormData.title.trim()) {
      alert('Please enter a task title');
      return;
    }

    tasks = [
      ...tasks.map(task =>
        task.id === selectedTask.id
          ? {
              ...task,
              title: taskFormData.title.trim(),
              description: taskFormData.description.trim(),
              columnId: taskFormData.columnId,
              priority: taskFormData.priority,
              assignee: taskFormData.assignee.trim()
            }
          : task
      )
    ];

    closeModals();
  }

  function deleteTask() {
    tasks = [...tasks.filter(task => task.id !== selectedTask.id)];
    closeModals();
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
    if (tasks.some(t => t.columnId === columnId)) {
      alert('Cannot delete column with tasks. Please move or delete tasks first.');
      return;
    }

    columns = [...columns.filter(col => col.id !== columnId)];
  }

  function getPriorityColor(priority) {
    switch(priority) {
      case 'high': return '#ef4444';
      case 'medium': return '#f59e0b';
      case 'low': return '#10b981';
      default: return '#64748b';
    }
  }
</script>

<div class="kanban-container">
  <div class="kanban-header">
    <h1>Kanban Board</h1>
    <div class="header-actions">
      <button class="btn-primary" on:click={() => openAddTaskModal()}>+ Add Task</button>
      <button class="btn-secondary" on:click={openAddColumnModal}>+ Add Column</button>
    </div>
  </div>

  <div class="kanban-board">
    {#each columns as column}
      <div
        class="column"
        class:drag-over={draggedOverColumn === column.id}
        on:dragover={handleColumnDragOver(column.id)}
        on:dragleave={handleColumnDragLeave}
        on:drop={handleColumnDrop(column.id)}
      >
        <div class="column-header" style="border-left: 4px solid {column.color}">
          <h3>{column.title}</h3>
          <div class="column-actions">
            <span class="task-count">{tasksByColumn[column.id]?.length || 0}</span>
            <button class="icon-btn" on:click={() => openAddTaskModal(column.id)} title="Add task">➕</button>
            <button class="icon-btn delete" on:click={() => deleteColumn(column.id)} title="Delete column">🗑️</button>
          </div>
        </div>

        <div class="tasks-container">
          {#each tasksByColumn[column.id] || [] as task (task.id)}
            <div
              class="task-card"
              class:dragging={draggedTask?.id === task.id}
              draggable="true"
              on:dragstart={handleTaskDragStart(task)}
              on:dragend={handleTaskDragEnd}
              on:click={() => selectedTask = task}
            >
              <div class="task-header">
                <h4>{task.title}</h4>
                <div class="task-actions">
                  <button class="icon-btn-small" on:click|stopPropagation={() => openEditTaskModal(task)} title="Edit">✏️</button>
                  <button class="icon-btn-small delete" on:click|stopPropagation={() => openDeleteTaskConfirm(task)} title="Delete">🗑️</button>
                </div>
              </div>
              
              {#if task.description}
                <p class="task-description">{task.description}</p>
              {/if}
              
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
          <label>Description:</label>
          <textarea bind:value={taskFormData.description} placeholder="Enter task description" rows="3"></textarea>
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
          <label>Description:</label>
          <textarea bind:value={taskFormData.description} placeholder="Enter task description" rows="3"></textarea>
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

  <!-- Delete Task Confirmation -->
  {#if showDeleteConfirm}
    <div class="modal-overlay" on:click={closeModals}>
      <div class="modal" on:click|stopPropagation>
        <h2>Delete Task</h2>
        <p>Are you sure you want to delete <strong>{selectedTask.title}</strong>?</p>
        <div class="modal-actions">
          <button class="btn-secondary" on:click={closeModals}>Cancel</button>
          <button class="btn-danger" on:click={deleteTask}>Delete</button>
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
    min-height: 100vh;
    background: linear-gradient(to bottom right, #f8fafc, #e0e7ff);
    padding: 1.5rem;
    box-sizing: border-box;
  }

  .kanban-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.5rem;
    background: white;
    padding: 1.5rem;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .kanban-header h1 {
    margin: 0;
    font-size: 1.75rem;
    color: #1e293b;
  }

  .header-actions {
    display: flex;
    gap: 0.75rem;
  }

  .kanban-board {
    display: flex;
    gap: 1rem;
    overflow-x: auto;
    padding-bottom: 1rem;
  }

  .column {
    flex: 0 0 320px;
    background: white;
    border-radius: 0.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    max-height: calc(100vh - 180px);
    transition: all 0.2s;
  }

  .column.drag-over {
    background: #eff6ff;
    box-shadow: 0 0 0 3px #3b82f6;
  }

  .column-header {
    padding: 1rem;
    border-bottom: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: #f8fafc;
    border-radius: 0.5rem 0.5rem 0 0;
  }

  .column-header h3 {
    margin: 0;
    font-size: 1rem;
    font-weight: 600;
    color: #1e293b;
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
    cursor: grab;
    transition: all 0.2s;
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  }

  .task-card:hover {
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }

  .task-card.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .task-header {
    display: flex;
    justify-content: space-between;
    align-items: start;
    margin-bottom: 0.5rem;
  }

  .task-header h4 {
    margin: 0;
    font-size: 0.9375rem;
    font-weight: 600;
    color: #1e293b;
    flex: 1;
  }

  .task-actions {
    display: flex;
    gap: 0.25rem;
    margin-left: 0.5rem;
  }

  .task-description {
    font-size: 0.8125rem;
    color: #64748b;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
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

  .icon-btn, .icon-btn-small {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0.25rem;
    opacity: 0.6;
    transition: all 0.2s;
    border-radius: 0.25rem;
  }

  .icon-btn {
    font-size: 0.875rem;
  }

  .icon-btn-small {
    font-size: 0.75rem;
  }

  .icon-btn:hover, .icon-btn-small:hover {
    opacity: 1;
    background: #f1f5f9;
  }

  .icon-btn.delete:hover, .icon-btn-small.delete:hover {
    background: #fee2e2;
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
    max-height: 90vh;
    overflow-y: auto;
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
  .form-group select,
  .form-group textarea {
    width: 100%;
    padding: 0.5rem;
    border: 1px solid #cbd5e1;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    box-sizing: border-box;
    font-family: inherit;
  }

  .form-group textarea {
    resize: vertical;
  }

  .form-group input[type="color"] {
    height: 40px;
    cursor: pointer;
  }

  .form-group input:focus,
  .form-group select:focus,
  .form-group textarea:focus {
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
</style>