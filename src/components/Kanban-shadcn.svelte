<script>
  import Button from '$lib/components/ui/button.svelte';
  import Card from '$lib/components/ui/card.svelte';
  import Dialog from '$lib/components/ui/dialog.svelte';
  import Input from '$lib/components/ui/input.svelte';
  import Label from '$lib/components/ui/label.svelte';
  import Select from '$lib/components/ui/select.svelte';
  import { cn } from '$lib/utils';

  let columns = $state([
    { id: 1, title: 'To Do', color: '#64748b' },
    { id: 2, title: 'In Progress', color: '#3b82f6' },
    { id: 3, title: 'Review', color: '#f59e0b' },
    { id: 4, title: 'Done', color: '#10b981' }
  ]);

  let tasks = $state([
    { id: 1, title: 'Design landing page', description: 'Create mockups for the new landing page', columnId: 1, priority: 'high', assignee: 'Sarah' },
    { id: 2, title: 'API integration', description: 'Connect frontend to backend API', columnId: 1, priority: 'medium', assignee: 'John' },
    { id: 3, title: 'User authentication', description: 'Implement login and signup', columnId: 2, priority: 'high', assignee: 'Mike' },
    { id: 4, title: 'Database optimization', description: 'Optimize query performance', columnId: 2, priority: 'low', assignee: 'Lisa' },
    { id: 5, title: 'Code review', description: 'Review pull requests', columnId: 3, priority: 'medium', assignee: 'Sarah' },
    { id: 6, title: 'Deploy to production', description: 'Release v2.0', columnId: 4, priority: 'high', assignee: 'John' }
  ]);

  let draggedTask = null;
  let draggedOverColumn = null;
  let selectedTask = null;

  // Modal states
  let showAddTaskModal = $state(false);
  let showEditTaskModal = $state(false);
  let showDeleteConfirm = $state(false);
  let showAddColumnModal = $state(false);

  // Form data
  let taskFormData = $state({
    title: '',
    description: '',
    columnId: null,
    priority: 'medium',
    assignee: ''
  });

  let columnFormData = $state({
    title: '',
    color: '#64748b'
  });

  function getTasksByColumn(columnId) {
    return tasks.filter(task => task.columnId === columnId);
  }

  // Reactive statement to ensure UI updates when tasks change
  let tasksByColumn = $derived(columns.reduce((acc, col) => {
    acc[col.id] = tasks.filter(task => task.columnId === col.id);
    return acc;
  }, {}));

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

<div class="w-full min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-6">
  <Card class="mb-6">
    <div class="flex justify-between items-center p-6">
      <h1 class="text-3xl font-bold text-slate-900">Kanban Board</h1>
      <div class="flex gap-3">
        <Button onclick={() => openAddTaskModal()}>+ Add Task</Button>
        <Button variant="secondary" onclick={openAddColumnModal}>+ Add Column</Button>
      </div>
    </div>
  </Card>

  <div class="flex gap-4 overflow-x-auto pb-4">
    {#each columns as column}
      <div
        class={cn(
          "flex-shrink-0 w-80 bg-white rounded-lg shadow-sm flex flex-col max-h-[calc(100vh-180px)] transition-all",
          draggedOverColumn === column.id && "bg-blue-50 ring-2 ring-blue-500"
        )}
        ondragover={handleColumnDragOver(column.id)}
        ondragleave={handleColumnDragLeave}
        ondrop={handleColumnDrop(column.id)}
      >
        <div class="p-4 border-b border-slate-200 bg-slate-50 rounded-t-lg" style="border-left: 4px solid {column.color}">
          <div class="flex justify-between items-center">
            <h3 class="font-semibold text-slate-900">{column.title}</h3>
            <div class="flex items-center gap-2">
              <span class="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                {tasksByColumn[column.id]?.length || 0}
              </span>
              <Button size="icon" variant="ghost" onclick={() => openAddTaskModal(column.id)} title="Add task">
                ➕
              </Button>
              <Button size="icon" variant="ghost" onclick={() => deleteColumn(column.id)} title="Delete column">
                🗑️
              </Button>
            </div>
          </div>
        </div>

        <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
          {#each tasksByColumn[column.id] || [] as task (task.id)}
            <Card
              class={cn(
                "p-3.5 cursor-grab transition-all hover:shadow-md",
                draggedTask?.id === task.id && "opacity-50 cursor-grabbing"
              )}
              draggable="true"
              ondragstart={handleTaskDragStart(task)}
              ondragend={handleTaskDragEnd}
              onclick={() => selectedTask = task}
            >
              <div class="flex justify-between items-start mb-2">
                <h4 class="font-semibold text-slate-900 text-sm">{task.title}</h4>
                <div class="flex gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6"
                    onclick={(e) => { e.stopPropagation(); openEditTaskModal(task); }}
                    title="Edit"
                  >
                    ✏️
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    class="h-6 w-6 hover:bg-red-50"
                    onclick={(e) => { e.stopPropagation(); openDeleteTaskConfirm(task); }}
                    title="Delete"
                  >
                    🗑️
                  </Button>
                </div>
              </div>

              {#if task.description}
                <p class="text-xs text-slate-600 mb-3 leading-relaxed">{task.description}</p>
              {/if}

              <div class="flex justify-between items-center gap-2">
                <span
                  class="text-xs text-white px-2 py-1 rounded font-semibold uppercase"
                  style="background-color: {getPriorityColor(task.priority)}"
                >
                  {task.priority}
                </span>
                {#if task.assignee}
                  <span class="text-xs text-slate-600">👤 {task.assignee}</span>
                {/if}
              </div>
            </Card>
          {/each}
        </div>
      </div>
    {/each}
  </div>

  <!-- Add Task Modal -->
  <Dialog bind:open={showAddTaskModal}>
    <h2 class="text-xl font-bold mb-4">Add New Task</h2>
    <div class="space-y-4">
      <div>
        <Label>Title:</Label>
        <Input bind:value={taskFormData.title} placeholder="Enter task title" />
      </div>
      <div>
        <Label>Description:</Label>
        <textarea
          bind:value={taskFormData.description}
          placeholder="Enter task description"
          rows="3"
          class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        ></textarea>
      </div>
      <div>
        <Label>Column:</Label>
        <Select bind:value={taskFormData.columnId}>
          {#each columns as col}
            <option value={col.id}>{col.title}</option>
          {/each}
        </Select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Priority:</Label>
          <Select bind:value={taskFormData.priority}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
        <div>
          <Label>Assignee:</Label>
          <Input bind:value={taskFormData.assignee} placeholder="Name" />
        </div>
      </div>
      <div class="flex gap-2 justify-end pt-2">
        <Button variant="secondary" onclick={closeModals}>Cancel</Button>
        <Button onclick={addTask}>Add Task</Button>
      </div>
    </div>
  </Dialog>

  <!-- Edit Task Modal -->
  <Dialog bind:open={showEditTaskModal}>
    <h2 class="text-xl font-bold mb-4">Edit Task</h2>
    <div class="space-y-4">
      <div>
        <Label>Title:</Label>
        <Input bind:value={taskFormData.title} placeholder="Enter task title" />
      </div>
      <div>
        <Label>Description:</Label>
        <textarea
          bind:value={taskFormData.description}
          placeholder="Enter task description"
          rows="3"
          class="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        ></textarea>
      </div>
      <div>
        <Label>Column:</Label>
        <Select bind:value={taskFormData.columnId}>
          {#each columns as col}
            <option value={col.id}>{col.title}</option>
          {/each}
        </Select>
      </div>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <Label>Priority:</Label>
          <Select bind:value={taskFormData.priority}>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
        </div>
        <div>
          <Label>Assignee:</Label>
          <Input bind:value={taskFormData.assignee} placeholder="Name" />
        </div>
      </div>
      <div class="flex gap-2 justify-end pt-2">
        <Button variant="secondary" onclick={closeModals}>Cancel</Button>
        <Button onclick={updateTask}>Save</Button>
      </div>
    </div>
  </Dialog>

  <!-- Delete Task Confirmation -->
  <Dialog bind:open={showDeleteConfirm}>
    <h2 class="text-xl font-bold mb-4">Delete Task</h2>
    <p class="mb-6">Are you sure you want to delete <strong>{selectedTask?.title}</strong>?</p>
    <div class="flex gap-2 justify-end">
      <Button variant="secondary" onclick={closeModals}>Cancel</Button>
      <Button variant="destructive" onclick={deleteTask}>Delete</Button>
    </div>
  </Dialog>

  <!-- Add Column Modal -->
  <Dialog bind:open={showAddColumnModal}>
    <h2 class="text-xl font-bold mb-4">Add New Column</h2>
    <div class="space-y-4">
      <div>
        <Label>Title:</Label>
        <Input bind:value={columnFormData.title} placeholder="Enter column title" />
      </div>
      <div>
        <Label>Color:</Label>
        <input type="color" bind:value={columnFormData.color} class="h-10 w-full rounded-md cursor-pointer" />
      </div>
      <div class="flex gap-2 justify-end pt-2">
        <Button variant="secondary" onclick={closeModals}>Cancel</Button>
        <Button onclick={addColumn}>Add Column</Button>
      </div>
    </div>
  </Dialog>
</div>
