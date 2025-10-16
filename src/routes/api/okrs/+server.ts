import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock OKR data - in production this would come from a database
const mockOKRs = [
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

export const GET: RequestHandler = async () => {
	// Simulate API delay
	await new Promise((resolve) => setTimeout(resolve, 100));

	return json({
		success: true,
		data: mockOKRs
	});
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();

	// Simulate creating a new OKR
	const newOKR = {
		id: Math.max(...mockOKRs.map((o) => o.id)) + 1,
		...body,
		history: {},
		predictions: {}
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

export const PUT: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { id, ...updates } = body;

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

	mockOKRs[index] = { ...mockOKRs[index], ...updates };

	return json({
		success: true,
		data: mockOKRs[index]
	});
};

export const DELETE: RequestHandler = async ({ request }) => {
	const { id } = await request.json();

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

	mockOKRs.splice(index, 1);

	return json({
		success: true
	});
};
