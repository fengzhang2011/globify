import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data matching the structure from OKRKanban.svelte
const mockTasks = [
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

const mockColumns = [
  { id: 1, title: 'To Do', color: '#64748b' },
  { id: 2, title: 'In Progress', color: '#3b82f6' },
  { id: 3, title: 'Review', color: '#f59e0b' },
  { id: 4, title: 'Done', color: '#10b981' }
];

const mockPriorities = [
  { priority: 'low', title: 'Low', color: '#10b981' },
  { priority: 'medium', title: 'Medium', color: '#f59e0b' },
  { priority: 'high', title: 'High', color: '#ef4444' },
];

// GET /api/tasks - Retrieve all tasks, columns, and priorities
export const GET: RequestHandler = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return json({
    success: true,
    data: {
      tasks: mockTasks,
      columns: mockColumns,
      priorities: mockPriorities
    }
  });
};

// POST /api/tasks - Create a new task
export const POST: RequestHandler = async ({ request }) => {
  const taskData = await request.json();

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const newTask = {
    id: Math.max(...mockTasks.map(t => t.id), 0) + 1,
    ...taskData
  };

  mockTasks.push(newTask);

  return json({
    success: true,
    data: newTask
  });
};

// PUT /api/tasks - Update an existing task
export const PUT: RequestHandler = async ({ request }) => {
  const { id, ...updates } = await request.json();

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const taskIndex = mockTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return json({
      success: false,
      error: 'Task not found'
    }, { status: 404 });
  }

  mockTasks[taskIndex] = { ...mockTasks[taskIndex], ...updates };

  return json({
    success: true,
    data: mockTasks[taskIndex]
  });
};

// DELETE /api/tasks - Delete a task
export const DELETE: RequestHandler = async ({ request }) => {
  const { id } = await request.json();

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const taskIndex = mockTasks.findIndex(t => t.id === id);
  if (taskIndex === -1) {
    return json({
      success: false,
      error: 'Task not found'
    }, { status: 404 });
  }

  const deletedTask = mockTasks.splice(taskIndex, 1)[0];

  return json({
    success: true,
    data: deletedTask
  });
};
