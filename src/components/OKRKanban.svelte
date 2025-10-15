<script>
  import { selectedOKR, okrDataStore } from '$lib/okr/stores.js';
  import { Button } from '$lib/components/ui/button';
  import { Card } from '$lib/components/ui/card';
  import {Dialog} from '$lib/components/ui/dialog';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import {Select} from '$lib/components/ui/select';
  import { cn } from '$lib/utils';

  let columns = $state([
    { id: 1, title: 'To Do', color: '#64748b' },
    { id: 2, title: 'In Progress', color: '#3b82f6' },
    { id: 3, title: 'Review', color: '#f59e0b' },
    { id: 4, title: 'Done', color: '#10b981' }
  ]);

  let priorities = $state([
    { priority: 'low', title: 'Low', color: '#10b981' },
    { priority: 'medium', title: 'Medium', color: '#f59e0b' },
    { priority: 'high', title: 'High', color: '#ef4444' },
  ]);

  let allTasks = $state([
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
  ]);

  let draggedTask = $state(null);
  let draggedOverColumn = $state(null);
  let showAddTaskModal = $state(false);
  let showEditTaskModal = $state(false);
  let showAddColumnModal = $state(false);
  let selectedTask = $state(null);

  let taskFormData = $state({
    title: '',
    columnId: 1,
    priority: 'medium',
    assignee: ''
  });

  const selectedTaskPriority = $derived(
    priorities.find((e) => e.priority === taskFormData.priority)?.title ?? "Select the priority"
  );

  let columnFormData = $state({
    title: '',
    color: '#64748b'
  });

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

  let filteredTasks = $derived(getFilteredTasks());
  let tasksByColumn = $derived(columns.reduce((acc, col) => {
    acc[col.id] = {
      direct: getTasksByColumn(col.id, filteredTasks.direct),
      indirect: getTasksByColumn(col.id, filteredTasks.indirect)
    };
    return acc;
  }, {}));

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

  function getColumnTitle(column) {
    console.log(column);
    console.log(taskFormData.columnId);
    return columns.find((e) => e.id === Number(taskFormData.columnId))?.title ?? "Select a column"
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

<Card class="w-full min-h-[400px]">
  <div class="flex justify-between items-center p-6 border-b border-slate-200">
    <div>
      <h2 class="text-2xl font-bold text-slate-900 mb-1">Tasks</h2>
      {#if $selectedOKR}
        <p class="text-sm text-slate-600">For: <strong class="text-blue-600">{$selectedOKR.title}</strong></p>
      {:else}
        <p class="text-sm text-slate-600">Select an OKR to view tasks</p>
      {/if}
    </div>
    <div class="flex gap-2">
      <Button onclick={openAddTaskModal} disabled={!$selectedOKR}>+ Add Task</Button>
      <Button onclick={openAddColumnModal} disabled={!$selectedOKR}>+ Add Column</Button>
    </div>
  </div>

  {#if $selectedOKR}
    <div class="flex gap-4 p-6 overflow-x-auto">
      {#each columns as column}
        <div role="region"
          class={cn(
            "flex-shrink-0 w-72 bg-slate-50 rounded-lg flex flex-col max-h-[600px] transition-all",
            draggedOverColumn === column.id && "bg-blue-50 ring-2 ring-blue-500"
          )}
          ondragover={handleColumnDragOver(column.id)}
          ondrop={handleColumnDrop(column.id)}
        >
          <div class="p-4 border-b border-slate-200 bg-white rounded-t-lg flex justify-between items-center" style="border-left: 4px solid {column.color}">
            <h3 class="font-semibold text-slate-900">{column.title}</h3>
            <div class="flex items-center gap-2">
              <span class="bg-slate-200 text-slate-700 px-2 py-1 rounded text-xs font-semibold">
                {(tasksByColumn[column.id]?.direct.length || 0) + (tasksByColumn[column.id]?.indirect.length || 0)}
              </span>
              <Button size="icon" variant="ghost" onclick={() => openAddTaskModal(column.id)} title="Add task">
                ➕
              </Button>
              <Button size="icon" variant="ghost" onclick={() => deleteColumn(column.id)} title="Delete column">
                🗑️
              </Button>
            </div>
          </div>

          <div class="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
            <!-- Direct tasks (editable) -->
            {#each tasksByColumn[column.id]?.direct || [] as task (task.id)}
              <Card
                class={cn(
                  "p-3.5 cursor-grab transition-all hover:shadow-md relative",
                  draggedTask?.id === task.id && "opacity-50 cursor-grabbing"
                )}
                draggable="true"
                ondragstart={handleTaskDragStart(task, true)}
                ondragend={() => draggedTask = null}
              >
                <div class="flex justify-between items-start mb-2">
                  <h4 class="font-semibold text-slate-900 text-sm flex-1">{task.title}</h4>
                  <div class="flex gap-1 ml-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      class="h-6 w-6"
                      onclick={(e) => { e.stopPropagation(); openEditTaskModal(task); }}
                    >
                      ✏️
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      class="h-6 w-6 hover:bg-red-50"
                      onclick={(e) => { e.stopPropagation(); deleteTask(task); }}
                    >
                      🗑️
                    </Button>
                  </div>
                </div>

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

            <!-- Indirect tasks (read-only) -->
            {#each tasksByColumn[column.id]?.indirect || [] as task (task.id)}
              <Card class="p-3.5 bg-slate-50 border-slate-300 opacity-80 relative">
                <div class="absolute top-2 right-2 text-[10px] text-slate-600 bg-slate-200 px-1.5 py-0.5 rounded font-semibold">
                  🔒 Read-only
                </div>
                <div class="mb-2">
                  <h4 class="font-semibold text-slate-900 text-sm">{task.title}</h4>
                </div>

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
  {:else}
    <div class="flex flex-col items-center justify-center p-16 text-slate-400">
      <div class="text-6xl mb-4">📋</div>
      <p class="text-base">Select an OKR node to view and manage tasks</p>
    </div>
  {/if}

  <!-- Add Task Modal -->
  <Dialog.Root bind:open={showAddTaskModal}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Add New Task</Dialog.Title>
        <Dialog.Description>
          Make changes to your profile here. Click save when you're done.
        </Dialog.Description>
      </Dialog.Header>
      <div class="space-y-3">
        <div>
          <Label>Title:</Label>
          <Input bind:value={taskFormData.title} placeholder="Enter task title" />
        </div>
        <div>
          <Label>Column:</Label>
          <Select.Root type="single" bind:value={taskFormData.columnId}>
            <Select.Trigger class="w-[180px]">
              {getColumnTitle(taskFormData.columnId)}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each columns as col}
                  <Select.Item value={String(col.id)} label={col.title}>
                    {col.title}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>Priority:</Label>
            <Select.Root type="single" bind:value={taskFormData.priority}>
              <Select.Trigger class="w-[180px]">
                {selectedTaskPriority}
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {#each priorities as item}
                    <Select.Item value={item.priority} label={item.title}>
                      {item.title}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <Label>Assignee:</Label>
            <Input bind:value={taskFormData.assignee} placeholder="Name" />
          </div>
        </div>
      </div>
      <Dialog.Footer>
        <Dialog.Close>
          <Button variant="secondary">Cancel</Button>
        </Dialog.Close>
        <Button onclick={addTask}>Add Task</Button>
    </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  <!-- Add Column Modal -->
  <Dialog.Root bind:open={showAddColumnModal}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Add New Column</Dialog.Title>
        <Dialog.Description>
          Make changes to your profile here. Click save when you're done.
        </Dialog.Description>
      </Dialog.Header>
      <div class="space-y-3">
        <div>
          <Label>Title:</Label>
          <Input bind:value={columnFormData.title} placeholder="Enter column title" />
        </div>
        <div>
          <Label>Color:</Label>
          <input type="color" bind:value={columnFormData.color} class="h-10 w-full rounded-md cursor-pointer" />
        </div>
      </div>
      <Dialog.Footer>
        <Dialog.Close>
          <Button variant="secondary">Cancel</Button>
        </Dialog.Close>
        <Button onclick={addColumn}>Add Column</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>

  <!-- Edit Task Modal -->
  <Dialog.Root bind:open={showEditTaskModal}>
    <Dialog.Content class="sm:max-w-[425px]">
      <Dialog.Header>
        <Dialog.Title>Edit Task</Dialog.Title>
        <Dialog.Description>
          Make changes to your profile here. Click save when you're done.
        </Dialog.Description>
      </Dialog.Header>
      <div class="space-y-3">
        <div>
          <Label>Title:</Label>
          <Input bind:value={taskFormData.title} placeholder="Enter task title" />
        </div>
        <div>
          <Label>Column:</Label>
          <Select.Root type="single" bind:value={taskFormData}>
            <Select.Trigger class="w-[180px]">
              {getColumnTitle(taskFormData.columnId)}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each columns as col}
                  <Select.Item value={String(col.id)} label={col.title}>
                    {col.title}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <Label>Priority:</Label>
            <Select.Root type="single" bind:value={taskFormData.priority}>
              <Select.Trigger class="w-[180px]">
                {selectedTaskPriority}
              </Select.Trigger>
              <Select.Content>
                <Select.Group>
                  {#each priorities as item}
                    <Select.Item value={item.priority} label={item.title}>
                      {item.title}
                    </Select.Item>
                  {/each}
                </Select.Group>
              </Select.Content>
            </Select.Root>
          </div>
          <div>
            <Label>Assignee:</Label>
            <Input bind:value={taskFormData.assignee} placeholder="Name" />
          </div>
        </div>
      </div>
      <Dialog.Footer>
        <Dialog.Close>
          <Button variant="secondary">Cancel</Button>
        </Dialog.Close>
        <Button onclick={updateTask}>Save</Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
</Card>
