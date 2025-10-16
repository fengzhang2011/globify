import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock task data - should match what's in tasks API
const mockTasks = [
	{
		id: 1,
		title: 'Design Product A UI',
		okrId: 4,
		columnId: 4,
		priority: 'high',
		assignee: 'Sarah'
	},
	{
		id: 2,
		title: 'Develop backend API',
		okrId: 4,
		columnId: 2,
		priority: 'high',
		assignee: 'John'
	},
	{
		id: 3,
		title: 'User testing sessions',
		okrId: 4,
		columnId: 1,
		priority: 'medium',
		assignee: 'Mike'
	},
	{
		id: 4,
		title: 'Product B requirements',
		okrId: 5,
		columnId: 4,
		priority: 'high',
		assignee: 'Lisa'
	},
	{
		id: 5,
		title: 'Beta user recruitment',
		okrId: 5,
		columnId: 2,
		priority: 'medium',
		assignee: 'Sarah'
	},
	{
		id: 6,
		title: 'A/B testing framework',
		okrId: 6,
		columnId: 4,
		priority: 'high',
		assignee: 'John'
	},
	{
		id: 7,
		title: 'Optimize landing pages',
		okrId: 6,
		columnId: 2,
		priority: 'high',
		assignee: 'Mike'
	},
	{
		id: 8,
		title: 'Marketing campaign Q4',
		okrId: 3,
		columnId: 2,
		priority: 'high',
		assignee: 'Lisa'
	},
	{
		id: 9,
		title: 'Product A deployment',
		okrId: 4,
		columnId: 3,
		priority: 'high',
		assignee: 'John'
	},
	{
		id: 10,
		title: 'Customer feedback analysis',
		okrId: 3,
		columnId: 1,
		priority: 'medium',
		assignee: 'Sarah'
	}
];

// OKR data structure with lifecycle dates and change history
const mockOKRs = [
	{
		id: 1,
		title: 'Increase Revenue by 50%',
		type: 'objective',
		parentId: null,
		owner: 'CEO',
		quarter: 'Q4 2025',

		// Lifecycle dates
		createdAt: '2025-09-01',
		updatedAt: '2025-10-08',
		finishedAt: null, // null means not finished yet
		deletedAt: null, // null means not deleted

		// Current state (always the latest)
		risk: 'low',
		daysLeft: 45,

		// Change history - tracks field changes over time
		changeHistory: [
			{
				date: '2025-09-01',
				fields: { risk: 'medium', daysLeft: 90, title: 'Increase Revenue by 50%' }
			},
			{ date: '2025-10-01', fields: { risk: 'low', daysLeft: 60 } },
			{ date: '2025-10-08', fields: { daysLeft: 45 } }
		]
	},
	{
		id: 2,
		title: 'Launch 3 new products',
		type: 'key_result',
		parentId: 1,
		owner: 'Product Team',
		quarter: 'Q4 2025',

		createdAt: '2025-09-01',
		updatedAt: '2025-10-08',
		finishedAt: null,
		deletedAt: null,

		risk: 'medium',
		daysLeft: 45,

		changeHistory: [
			{
				date: '2025-09-01',
				fields: { risk: 'high', daysLeft: 90, title: 'Launch 3 new products' }
			},
			{ date: '2025-10-01', fields: { risk: 'medium', daysLeft: 60 } },
			{ date: '2025-10-08', fields: { daysLeft: 45 } }
		]
	},
	{
		id: 3,
		title: 'Acquire 10,000 new customers',
		type: 'key_result',
		parentId: 1,
		owner: 'Marketing',
		quarter: 'Q4 2025',

		createdAt: '2025-09-01',
		updatedAt: '2025-10-08',
		finishedAt: null,
		deletedAt: null,

		risk: 'low',
		daysLeft: 45,

		changeHistory: [
			{
				date: '2025-09-01',
				fields: { risk: 'medium', daysLeft: 90, title: 'Acquire 10,000 new customers' }
			},
			{ date: '2025-10-01', fields: { risk: 'low', daysLeft: 60 } },
			{ date: '2025-10-08', fields: { daysLeft: 45 } }
		]
	},
	{
		id: 4,
		title: 'Product A - MVP Launch',
		type: 'objective',
		parentId: 2,
		owner: 'Team A',
		quarter: 'Q4 2025',

		createdAt: '2025-09-01',
		updatedAt: '2025-10-08',
		finishedAt: null,
		deletedAt: null,

		risk: 'low',
		daysLeft: 45,

		changeHistory: [
			{
				date: '2025-09-01',
				fields: { risk: 'high', daysLeft: 90, title: 'Product A - MVP Launch' }
			},
			{ date: '2025-10-01', fields: { risk: 'medium', daysLeft: 60 } },
			{ date: '2025-10-08', fields: { risk: 'low', daysLeft: 45 } }
		]
	},
	{
		id: 5,
		title: 'Product B - Beta Testing',
		type: 'objective',
		parentId: 2,
		owner: 'Team B',
		quarter: 'Q4 2025',

		createdAt: '2025-09-01',
		updatedAt: '2025-10-08',
		finishedAt: null,
		deletedAt: null,

		risk: 'medium',
		daysLeft: 45,

		changeHistory: [
			{
				date: '2025-09-01',
				fields: { risk: 'high', daysLeft: 90, title: 'Product B - Beta Testing' }
			},
			{ date: '2025-10-01', fields: { risk: 'medium', daysLeft: 60 } },
			{ date: '2025-10-08', fields: { daysLeft: 45 } }
		]
	},
	{
		id: 6,
		title: 'Improve conversion rate to 5%',
		type: 'key_result',
		parentId: 3,
		owner: 'Growth Team',
		quarter: 'Q4 2025',

		createdAt: '2025-09-01',
		updatedAt: '2025-10-08',
		finishedAt: null,
		deletedAt: null,

		risk: 'low',
		daysLeft: 45,

		changeHistory: [
			{
				date: '2025-09-01',
				fields: { risk: 'medium', daysLeft: 90, title: 'Improve conversion rate to 5%' }
			},
			{ date: '2025-10-01', fields: { risk: 'low', daysLeft: 60 } },
			{ date: '2025-10-08', fields: { daysLeft: 45 } }
		]
	},
	// Example of a finished OKR
	{
		id: 7,
		title: 'Setup Development Environment',
		type: 'objective',
		parentId: null,
		owner: 'Engineering',
		quarter: 'Q3 2025',

		createdAt: '2025-07-01',
		updatedAt: '2025-08-15',
		finishedAt: '2025-08-15', // Finished on this date
		deletedAt: null,

		risk: 'low',
		daysLeft: 0,

		changeHistory: [
			{
				date: '2025-07-01',
				fields: { risk: 'medium', daysLeft: 45, title: 'Setup Development Environment' }
			},
			{ date: '2025-08-01', fields: { risk: 'low', daysLeft: 14 } },
			{ date: '2025-08-15', fields: { daysLeft: 0 } }
		]
	},
	// Example of a deleted OKR
	{
		id: 8,
		title: 'Deprecated Feature X',
		type: 'key_result',
		parentId: 1,
		owner: 'Product Team',
		quarter: 'Q4 2025',

		createdAt: '2025-09-01',
		updatedAt: '2025-09-20',
		finishedAt: null,
		deletedAt: '2025-09-20', // Deleted on this date

		risk: 'high',
		daysLeft: 70,

		changeHistory: [
			{ date: '2025-09-01', fields: { risk: 'high', daysLeft: 90, title: 'Deprecated Feature X' } },
			{ date: '2025-09-15', fields: { daysLeft: 75 } }
		]
	}
];

// Calculate progress for an OKR based on its tasks
function calculateOKRProgress(okrId: number, allOKRs: any[]): number {
	// Get direct tasks for this OKR
	const directTasks = mockTasks.filter((t) => t.okrId === okrId);

	if (directTasks.length > 0) {
		// Calculate based on tasks in "Done" column (columnId: 4)
		const completedTasks = directTasks.filter((t) => t.columnId === 4).length;
		return Math.round((completedTasks / directTasks.length) * 100);
	}

	// If no direct tasks, calculate based on child OKRs
	const children = allOKRs.filter((o) => o.parentId === okrId);
	if (children.length > 0) {
		const avgProgress =
			children.reduce((sum, child) => sum + (child.progress || 0), 0) / children.length;
		return Math.round(avgProgress);
	}

	return 0;
}

// Get OKR state at a specific date by applying change history
function getOKRStateAtDate(okr: any, targetDate: string): any {
	// Start with base OKR data
	let state = {
		id: okr.id,
		type: okr.type,
		parentId: okr.parentId,
		owner: okr.owner,
		quarter: okr.quarter,
		createdAt: okr.createdAt,
		finishedAt: okr.finishedAt,
		deletedAt: okr.deletedAt
	};

	// Apply change history up to the target date
	const applicableChanges = okr.changeHistory
		.filter((change) => change.date <= targetDate)
		.sort((a, b) => a.date.localeCompare(b.date));

	for (const change of applicableChanges) {
		state = { ...state, ...change.fields };
	}

	return state;
}

// Get OKRs for a specific date
function getOKRsForDate(dateStr: string | null) {
	const today = new Date();
	today.setHours(0, 0, 0, 0);
	const todayStr = today.toISOString().split('T')[0];

	// If no date specified, use today
	const targetDate = dateStr || todayStr;
	const targetDateObj = new Date(targetDate);
	targetDateObj.setHours(0, 0, 0, 0);

	// Filter and process OKRs
	const activeOKRs = mockOKRs
		.filter((okr) => {
			// Must be created before or on target date
			if (okr.createdAt > targetDate) return false;

			// Must not be deleted, or deleted after target date
			if (okr.deletedAt && okr.deletedAt <= targetDate) return false;

			// Must not be finished, or finished after target date
			if (okr.finishedAt && okr.finishedAt <= targetDate) return false;

			// Include both finished and unfinished OKRs
			return true;
		})
		.map((okr) => {
			// Get the state of this OKR at the target date
			const state = getOKRStateAtDate(okr, targetDate);

			// Determine view type
			let viewType = 'current';
			if (targetDateObj < today) {
				viewType = 'historical';
			} else if (targetDateObj > today) {
				viewType = 'predicted';
			}

			return {
				...state,
				viewType,
				// Add status badge
				status: okr.finishedAt && okr.finishedAt <= targetDate ? 'finished' : 'active'
			};
		});

	// Calculate progress for each OKR
	activeOKRs.forEach((okr) => {
		okr.progress = calculateOKRProgress(okr.id, activeOKRs);
	});

	return activeOKRs;
}

// GET /api/okrs?date=YYYY-MM-DD - Retrieve OKRs for a specific date
export const GET: RequestHandler = async ({ url }) => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 100));

	const dateParam = url.searchParams.get('date');
	const okrs = getOKRsForDate(dateParam);

	return json({
		success: true,
		data: okrs,
		meta: {
			date: dateParam || new Date().toISOString().split('T')[0],
			total: okrs.length,
			active: okrs.filter((o) => o.status === 'active').length,
			finished: okrs.filter((o) => o.status === 'finished').length
		}
	});
};

// POST /api/okrs - Create a new OKR
export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const now = new Date().toISOString().split('T')[0];

	// Simulate creating a new OKR
	const newOKR = {
		id: Math.max(...mockOKRs.map((o) => o.id)) + 1,
		...body,
		createdAt: now,
		updatedAt: now,
		finishedAt: null,
		deletedAt: null,
		changeHistory: [
			{
				date: now,
				fields: {
					title: body.title,
					risk: body.risk,
					daysLeft: body.daysLeft
				}
			}
		]
	};

	mockOKRs.push(newOKR);

	return json(
		{
			success: true,
			data: newOKR
		},
		{ status: 201 }
	);
};

// PUT /api/okrs - Update an existing OKR
export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { id, ...updates } = body;
	const now = new Date().toISOString().split('T')[0];

	const index = mockOKRs.findIndex((o) => o.id === id);
	if (index === -1) {
		return json(
			{
				success: false,
				error: 'OKR not found'
			},
			{ status: 404 }
		);
	}

	// Add to change history
	const changedFields = {};
	for (const [key, value] of Object.entries(updates)) {
		if (mockOKRs[index][key] !== value) {
			changedFields[key] = value;
		}
	}

	if (Object.keys(changedFields).length > 0) {
		mockOKRs[index].changeHistory.push({
			date: now,
			fields: changedFields
		});
	}

	mockOKRs[index] = {
		...mockOKRs[index],
		...updates,
		updatedAt: now
	};

	return json({
		success: true,
		data: mockOKRs[index]
	});
};

// DELETE /api/okrs - Soft delete an OKR
export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();
	const now = new Date().toISOString().split('T')[0];

	const index = mockOKRs.findIndex((o) => o.id === id);
	if (index === -1) {
		return json(
			{
				success: false,
				error: 'OKR not found'
			},
			{ status: 404 }
		);
	}

	// Soft delete - mark as deleted instead of removing
	mockOKRs[index].deletedAt = now;
	mockOKRs[index].updatedAt = now;

	return json({
		success: true,
		data: { id, deletedAt: now }
	});
};
