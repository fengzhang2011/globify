<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { Button } from '$lib/components/ui/button';
  import * as Table from '$lib/components/ui/table';
  import * as Dialog from '$lib/components/ui/dialog';
  import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
  import { Input } from '$lib/components/ui/input';
  import { Label } from '$lib/components/ui/label';
  import * as Select from '$lib/components/ui/select';
  import { Badge } from '$lib/components/ui/badge';
  import { cn } from '$lib/utils';

  interface Issue {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    type: string;
    assignee: string | null;
    reporter: string;
    createdAt: string;
    updatedAt: string;
    dueDate: string;
    labels: string[];
    comments: number;
    attachments: number;
  }

  let issues = $state<Issue[]>([]);
  let filteredIssues = $state<Issue[]>([]);
  let selectedIssues = $state<Set<string>>(new Set());
  let isLoading = $state(true);
  let showCreateDialog = $state(false);
  let selectedStatus = $state<string>('all');
  let selectedPriority = $state<string>('all');
  let searchQuery = $state('');

  // Form data for creating new issue
  let newIssue = $state({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    type: 'feature',
    assignee: '',
    reporter: 'Current User',
    dueDate: '',
    labels: ''
  });

  const statusOptions = [
    { value: 'all', label: 'All Status', color: 'bg-slate-100 text-slate-800' },
    { value: 'todo', label: 'To Do', color: 'bg-gray-100 text-gray-800' },
    { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-800' },
    { value: 'in_review', label: 'In Review', color: 'bg-purple-100 text-purple-800' },
    { value: 'done', label: 'Done', color: 'bg-green-100 text-green-800' }
  ];

  const priorityOptions = [
    { value: 'all', label: 'All Priority', color: 'bg-slate-100 text-slate-800' },
    { value: 'low', label: 'Low', color: 'bg-green-100 text-green-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
  ];

  const typeOptions = [
    { value: 'feature', label: 'Feature', icon: '✨' },
    { value: 'bug', label: 'Bug', icon: '🐛' },
    { value: 'improvement', label: 'Improvement', icon: '⚡' },
    { value: 'documentation', label: 'Documentation', icon: '📚' }
  ];

  onMount(async () => {
    await fetchIssues();
  });

  async function fetchIssues() {
    isLoading = true;
    try {
      const response = await fetch('/api/issues');
      const result = await response.json();
      if (result.success) {
        issues = result.data;
        filterIssues();
      }
    } catch (error) {
      console.error('Failed to fetch issues:', error);
    } finally {
      isLoading = false;
    }
    console.log(isLoading);
  }

  function filterIssues() {
    filteredIssues = issues.filter((issue) => {
      const matchesStatus = selectedStatus === 'all' || issue.status === selectedStatus;
      const matchesPriority = selectedPriority === 'all' || issue.priority === selectedPriority;
      const matchesSearch = searchQuery === '' ||
        issue.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        issue.id.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesStatus && matchesPriority && matchesSearch;
    });
  }

  $effect(() => {
    selectedStatus;
    selectedPriority;
    searchQuery;
    filterIssues();
  });

  async function createIssue() {
    try {
      const response = await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newIssue,
          labels: newIssue.labels.split(',').map(l => l.trim()).filter(Boolean)
        })
      });
      const result = await response.json();
      if (result.success) {
        await fetchIssues();
        showCreateDialog = false;
        resetForm();
      }
    } catch (error) {
      console.error('Failed to create issue:', error);
    }
  }

  function resetForm() {
    newIssue = {
      title: '',
      description: '',
      status: 'todo',
      priority: 'medium',
      type: 'feature',
      assignee: '',
      reporter: 'Current User',
      dueDate: '',
      labels: ''
    };
  }

  function toggleIssueSelection(issueId: string) {
    const newSet = new Set(selectedIssues);
    if (newSet.has(issueId)) {
      newSet.delete(issueId);
    } else {
      newSet.add(issueId);
    }
    selectedIssues = newSet;
  }

  function toggleSelectAll() {
    if (selectedIssues.size === filteredIssues.length) {
      selectedIssues = new Set();
    } else {
      selectedIssues = new Set(filteredIssues.map(i => i.id));
    }
  }

  function getStatusColor(status: string) {
    return statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
  }

  function getPriorityColor(priority: string) {
    return priorityOptions.find(p => p.value === priority)?.color || 'bg-gray-100 text-gray-800';
  }

  function getTypeIcon(type: string) {
    return typeOptions.find(t => t.value === type)?.icon || '📋';
  }

  function getTypeLabel(type: string) {
    return typeOptions.find(t => t.value === type)?.label || type;
  }
</script>

<svelte:head>
  <title>Issues</title>
</svelte:head>

<div class="min-h-screen bg-slate-50">
  <!-- Header -->
  <div class="bg-white border-b border-slate-200 sticky top-0 z-10">
    <div class="max-w-7xl mx-auto px-6 py-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-4">
          <Button variant="ghost" size="icon" onclick={() => goto('/')}>
            ←
          </Button>
          <div>
            <h1 class="text-2xl font-bold text-slate-900">Issues</h1>
            <p class="text-sm text-slate-600">Track and manage your project tasks</p>
          </div>
        </div>
        <Button onclick={() => showCreateDialog = true}>
          + Create Issue
        </Button>
      </div>
    </div>
  </div>

  <!-- Filters and Search -->
  <div class="max-w-7xl mx-auto px-6 py-6">
    <div class="flex flex-col sm:flex-row gap-4 mb-6">
      <div class="flex-1">
        <Input
          type="search"
          placeholder="Search issues by ID or title..."
          bind:value={searchQuery}
          class="w-full"
        />
      </div>

      <Select.Root bind:value={selectedStatus}>
        <Select.Trigger class="w-[180px]">
          {statusOptions.find(s => s.value === selectedStatus)?.label || 'All Status'}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            {#each statusOptions as option}
              <Select.Item value={option.value} label={option.label}>
                {option.label}
              </Select.Item>
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>

      <Select.Root bind:value={selectedPriority}>
        <Select.Trigger class="w-[180px]">
          {priorityOptions.find(p => p.value === selectedPriority)?.label || 'All Priority'}
        </Select.Trigger>
        <Select.Content>
          <Select.Group>
            {#each priorityOptions as option}
              <Select.Item value={option.value} label={option.label}>
                {option.label}
              </Select.Item>
            {/each}
          </Select.Group>
        </Select.Content>
      </Select.Root>
    </div>

    <!-- Issues Table -->
    {#if isLoading}
      <div class="flex items-center justify-center py-20">
        <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    {:else if filteredIssues.length === 0}
      <div class="bg-white rounded-lg border border-slate-200 p-12 text-center">
        <div class="text-5xl mb-4">📋</div>
        <h3 class="text-lg font-semibold text-slate-900 mb-2">No issues found</h3>
        <p class="text-slate-600 mb-4">Try adjusting your filters or create a new issue</p>
        <Button onclick={() => showCreateDialog = true}>Create Issue</Button>
      </div>
    {:else}
      <div class="bg-white rounded-lg border border-slate-200 overflow-hidden">
        <Table.Root>
          <Table.Header>
            <Table.Row class="hover:bg-transparent border-b border-slate-200">
              <Table.Head class="w-12">
                <input
                  type="checkbox"
                  class="h-4 w-4 rounded border-slate-300 cursor-pointer"
                  checked={selectedIssues.size === filteredIssues.length && filteredIssues.length > 0}
                  onchange={toggleSelectAll}
                />
              </Table.Head>
              <Table.Head class="w-12">::</Table.Head>
              <Table.Head class="w-32">ID</Table.Head>
              <Table.Head class="min-w-[300px]">Title</Table.Head>
              <Table.Head class="w-2000">Tags</Table.Head>
              <Table.Head class="w-40">Type</Table.Head>
              <Table.Head class="w-32">Status</Table.Head>
              <Table.Head class="w-32">Priority</Table.Head>
              <Table.Head class="w-40">Assignee</Table.Head>
              <Table.Head class="w-32">Due Date</Table.Head>
              <Table.Head class="w-12"></Table.Head>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {#each filteredIssues as issue}
              <Table.Row class="group hover:bg-slate-50 border-b border-slate-100">
                <Table.Cell>
                  <input
                    type="checkbox"
                    class="h-4 w-4 rounded border-slate-300 cursor-pointer"
                    checked={selectedIssues.has(issue.id)}
                    onchange={() => toggleIssueSelection(issue.id)}
                  />
                </Table.Cell>
                <Table.Cell class="text-slate-400 cursor-move">
                  <span class="opacity-0 group-hover:opacity-100 transition-opacity">::</span>
                </Table.Cell>
                <Table.Cell>
                  <span class="font-mono text-sm text-slate-600">{issue.id}</span>
                </Table.Cell>
                <Table.Cell>
                  <div class="flex flex-col gap-1">
                    <span class="font-medium text-slate-900">{issue.title}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div class="flex flex-col gap-1">
                    {#if issue.labels.length > 0}
                      <div class="flex gap-1 flex-wrap">
                        {#each issue.labels.slice(0, 3) as label}
                          <Badge variant="outline" class="text-xs">
                            {label}
                          </Badge>
                        {/each}
                        {#if issue.labels.length > 3}
                          <Badge variant="outline" class="text-xs">
                            +{issue.labels.length - 3}
                          </Badge>
                        {/if}
                      </div>
                    {/if}
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <div class="flex items-center gap-2">
                    <span class="text-lg">{getTypeIcon(issue.type)}</span>
                    <span class="text-sm text-slate-600">{getTypeLabel(issue.type)}</span>
                  </div>
                </Table.Cell>
                <Table.Cell>
                  <Badge class={cn("text-xs", getStatusColor(issue.status))}>
                    {statusOptions.find(s => s.value === issue.status)?.label}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  <Badge class={cn("text-xs", getPriorityColor(issue.priority))}>
                    {issue.priority}
                  </Badge>
                </Table.Cell>
                <Table.Cell>
                  {#if issue.assignee}
                    <div class="flex items-center gap-2">
                      <div class="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-xs">
                        {issue.assignee.charAt(0).toUpperCase()}
                      </div>
                      <span class="text-sm text-slate-700">{issue.assignee}</span>
                    </div>
                  {:else}
                    <span class="text-sm text-slate-400">Unassigned</span>
                  {/if}
                </Table.Cell>
                <Table.Cell>
                  <span class="text-sm text-slate-600">{new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                </Table.Cell>
                <Table.Cell>
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger>
                      <Button variant="ghost" size="icon" class="h-8 w-8">
                        <span class="text-slate-400">⋮</span>
                      </Button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Content align="end">
                      <DropdownMenu.Item>Edit</DropdownMenu.Item>
                      <DropdownMenu.Item>Duplicate</DropdownMenu.Item>
                      <DropdownMenu.Separator />
                      <DropdownMenu.Item class="text-red-600">Delete</DropdownMenu.Item>
                    </DropdownMenu.Content>
                  </DropdownMenu.Root>
                </Table.Cell>
              </Table.Row>
            {/each}
          </Table.Body>
        </Table.Root>
      </div>
    {/if}
  </div>
</div>

<!-- Create Issue Dialog -->
<Dialog.Root bind:open={showCreateDialog}>
  <Dialog.Content class="max-w-2xl">
    <Dialog.Header>
      <Dialog.Title>Create New Issue</Dialog.Title>
      <Dialog.Description>
        Fill in the details to create a new issue
      </Dialog.Description>
    </Dialog.Header>

    <div class="space-y-4 py-4">
      <div class="space-y-2">
        <Label for="title">Title *</Label>
        <Input
          id="title"
          bind:value={newIssue.title}
          placeholder="Brief description of the issue"
        />
      </div>

      <div class="space-y-2">
        <Label for="description">Description</Label>
        <textarea
          id="description"
          bind:value={newIssue.description}
          placeholder="Detailed description of the issue"
          rows="4"
          class="w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-slate-900 focus:outline-none"
        ></textarea>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="type">Type</Label>
          <Select.Root bind:value={newIssue.type}>
            <Select.Trigger>
              {typeOptions.find(t => t.value === newIssue.type)?.label || 'Select type'}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each typeOptions as option}
                  <Select.Item value={option.value} label={option.label}>
                    {option.icon} {option.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>

        <div class="space-y-2">
          <Label for="priority">Priority</Label>
          <Select.Root bind:value={newIssue.priority}>
            <Select.Trigger>
              {priorityOptions.filter(p => p.value !== 'all').find(p => p.value === newIssue.priority)?.label || 'Select priority'}
            </Select.Trigger>
            <Select.Content>
              <Select.Group>
                {#each priorityOptions.filter(p => p.value !== 'all') as option}
                  <Select.Item value={option.value} label={option.label}>
                    {option.label}
                  </Select.Item>
                {/each}
              </Select.Group>
            </Select.Content>
          </Select.Root>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label for="assignee">Assignee</Label>
          <Input
            id="assignee"
            bind:value={newIssue.assignee}
            placeholder="Person responsible"
          />
        </div>

        <div class="space-y-2">
          <Label for="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            type="date"
            bind:value={newIssue.dueDate}
          />
        </div>
      </div>

      <div class="space-y-2">
        <Label for="labels">Labels (comma-separated)</Label>
        <Input
          id="labels"
          bind:value={newIssue.labels}
          placeholder="e.g., bug, urgent, frontend"
        />
      </div>
    </div>

    <Dialog.Footer>
      <Button variant="secondary" onclick={() => showCreateDialog = false}>
        Cancel
      </Button>
      <Button onclick={createIssue} disabled={!newIssue.title.trim()}>
        Create Issue
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
