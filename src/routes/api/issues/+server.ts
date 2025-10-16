import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock issue data
const mockIssues = [
	{
		id: 'GLOB-101',
		title: 'Implement user authentication system',
		description: 'Add OAuth2 authentication with Google and GitHub providers',
		status: 'in_progress',
		priority: 'high',
		type: 'feature',
		assignee: 'Sarah Chen',
		reporter: 'John Doe',
		createdAt: '2025-09-15',
		updatedAt: '2025-10-10',
		dueDate: '2025-10-20',
		labels: ['authentication', 'security'],
		comments: 5,
		attachments: 2
	},
	{
		id: 'GLOB-102',
		title: 'Fix navigation menu on mobile devices',
		description: 'Menu items are not properly aligned on screens smaller than 768px',
		status: 'todo',
		priority: 'medium',
		type: 'bug',
		assignee: 'Mike Johnson',
		reporter: 'Sarah Chen',
		createdAt: '2025-09-20',
		updatedAt: '2025-09-22',
		dueDate: '2025-10-15',
		labels: ['ui', 'mobile', 'bug'],
		comments: 3,
		attachments: 1
	},
	{
		id: 'GLOB-103',
		title: 'Add dark mode support',
		description: 'Implement dark mode theme with toggle switch in settings',
		status: 'done',
		priority: 'low',
		type: 'feature',
		assignee: 'Lisa Wang',
		reporter: 'Mike Johnson',
		createdAt: '2025-08-10',
		updatedAt: '2025-09-05',
		dueDate: '2025-09-10',
		labels: ['ui', 'theme'],
		comments: 12,
		attachments: 0
	},
	{
		id: 'GLOB-104',
		title: 'Optimize database queries',
		description: 'Reduce response time for dashboard data by 50%',
		status: 'in_progress',
		priority: 'high',
		type: 'improvement',
		assignee: 'John Doe',
		reporter: 'Sarah Chen',
		createdAt: '2025-09-25',
		updatedAt: '2025-10-08',
		dueDate: '2025-10-25',
		labels: ['performance', 'backend'],
		comments: 8,
		attachments: 3
	},
	{
		id: 'GLOB-105',
		title: 'Update documentation for API endpoints',
		description: 'Document all REST API endpoints with examples and response codes',
		status: 'todo',
		priority: 'medium',
		type: 'documentation',
		assignee: null,
		reporter: 'Lisa Wang',
		createdAt: '2025-10-01',
		updatedAt: '2025-10-01',
		dueDate: '2025-10-30',
		labels: ['documentation', 'api'],
		comments: 0,
		attachments: 0
	},
	{
		id: 'GLOB-106',
		title: 'Memory leak in dashboard component',
		description: 'Browser memory usage increases over time when dashboard is open',
		status: 'in_review',
		priority: 'critical',
		type: 'bug',
		assignee: 'Sarah Chen',
		reporter: 'John Doe',
		createdAt: '2025-10-05',
		updatedAt: '2025-10-12',
		dueDate: '2025-10-14',
		labels: ['bug', 'critical', 'memory'],
		comments: 15,
		attachments: 5
	},
	{
		id: 'GLOB-107',
		title: 'Create onboarding tutorial',
		description: 'Build interactive tutorial for new users',
		status: 'todo',
		priority: 'low',
		type: 'feature',
		assignee: 'Mike Johnson',
		reporter: 'Lisa Wang',
		createdAt: '2025-10-08',
		updatedAt: '2025-10-08',
		dueDate: '2025-11-15',
		labels: ['ux', 'onboarding'],
		comments: 2,
		attachments: 0
	},
	{
		id: 'GLOB-108',
		title: 'Implement real-time notifications',
		description: 'Add WebSocket support for live notifications',
		status: 'in_progress',
		priority: 'medium',
		type: 'feature',
		assignee: 'John Doe',
		reporter: 'Sarah Chen',
		createdAt: '2025-09-30',
		updatedAt: '2025-10-11',
		dueDate: '2025-10-22',
		labels: ['websocket', 'notifications'],
		comments: 6,
		attachments: 1
	}
];

// GET /api/issues - Retrieve all issues
export const GET: RequestHandler = async ({ url }) => {
	await new Promise((resolve) => setTimeout(resolve, 100));

	// Support filtering by status, priority, assignee
	const status = url.searchParams.get('status');
	const priority = url.searchParams.get('priority');
	const assignee = url.searchParams.get('assignee');

	let filtered = mockIssues;

	if (status) {
		filtered = filtered.filter((issue) => issue.status === status);
	}
	if (priority) {
		filtered = filtered.filter((issue) => issue.priority === priority);
	}
	if (assignee) {
		filtered = filtered.filter((issue) => issue.assignee === assignee);
	}

	return json({
		success: true,
		data: filtered,
		meta: {
			total: filtered.length,
			statuses: {
				todo: mockIssues.filter((i) => i.status === 'todo').length,
				in_progress: mockIssues.filter((i) => i.status === 'in_progress').length,
				in_review: mockIssues.filter((i) => i.status === 'in_review').length,
				done: mockIssues.filter((i) => i.status === 'done').length
			}
		}
	});
};

// POST /api/issues - Create a new issue
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	const newIssue = {
		id: `GLOB-${Math.floor(Math.random() * 1000) + 100}`,
		...body,
		createdAt: new Date().toISOString().split('T')[0],
		updatedAt: new Date().toISOString().split('T')[0],
		comments: 0,
		attachments: 0
	};

	mockIssues.push(newIssue);

	return json(
		{
			success: true,
			data: newIssue
		},
		{ status: 201 }
	);
};

// PUT /api/issues - Update an existing issue
export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { id, ...updates } = body;

	const index = mockIssues.findIndex((i) => i.id === id);
	if (index === -1) {
		return json(
			{
				success: false,
				error: 'Issue not found'
			},
			{ status: 404 }
		);
	}

	mockIssues[index] = {
		...mockIssues[index],
		...updates,
		updatedAt: new Date().toISOString().split('T')[0]
	};

	return json({
		success: true,
		data: mockIssues[index]
	});
};

// DELETE /api/issues - Delete an issue
export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

	const index = mockIssues.findIndex((i) => i.id === id);
	if (index === -1) {
		return json(
			{
				success: false,
				error: 'Issue not found'
			},
			{ status: 404 }
		);
	}

	const deletedIssue = mockIssues.splice(index, 1)[0];

	return json({
		success: true,
		data: deletedIssue
	});
};
