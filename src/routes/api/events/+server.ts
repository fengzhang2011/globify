import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// Mock data matching the structure from OKRCalendar.svelte
const mockEvents = [
  {
    id: 1,
    title: "Team Sync Meeting",
    start: "2025-09-01T09:00:00",
    end: "2025-09-01T10:00:00",
  },
  {
    id: 2,
    title: "Design Review",
    start: "2025-09-01T11:30:00",
    end: "2025-09-01T12:30:00",
  },
  {
    id: 3,
    title: "Sprint Planning",
    start: "2025-09-15T14:00:00",
    end: "2025-09-15T16:00:00",
  },
  {
    id: 4,
    title: "Mid Quarter Review Meeting",
    start: "2025-10-01T10:00:00",
    end: "2025-10-01T12:00:00",
  },
  {
    id: 5,
    title: "Product Launch Prep",
    start: "2025-11-01T09:00:00",
    end: "2025-11-01T17:00:00",
  },
  {
    id: 6,
    title: "Final Review",
    start: "2025-12-01T13:00:00",
    end: "2025-12-01T15:00:00",
  },
];

const mockKeyDates = [
  { date: '2025-09-01', label: 'Q4 Start', type: 'milestone', description: 'Quarter begins' },
  { date: '2025-09-15', label: 'Sprint 1 End', type: 'sprint', description: 'First sprint completion' },
  { date: '2025-10-01', label: 'Mid Quarter Review', type: 'review', description: 'Progress review meeting' },
  { date: '2025-10-08', label: 'Today', type: 'current', description: 'Current date' },
  { date: '2025-10-15', label: 'Sprint 2 End', type: 'sprint', description: 'Second sprint completion' },
  { date: '2025-11-01', label: 'Product Launch', type: 'milestone', description: 'Major product release' },
  { date: '2025-11-15', label: 'Sprint 3 End', type: 'sprint', description: 'Third sprint completion' },
  { date: '2025-12-01', label: 'Final Review', type: 'review', description: 'End of quarter review' },
  { date: '2025-12-15', label: 'Planning Week', type: 'milestone', description: 'Q1 2026 planning' },
  { date: '2025-12-31', label: 'Q4 End', type: 'deadline', description: 'Quarter ends' }
];

// GET /api/events - Retrieve all events and key dates
export const GET: RequestHandler = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  return json({
    success: true,
    data: {
      events: mockEvents,
      keyDates: mockKeyDates
    }
  });
};

// POST /api/events - Create a new event
export const POST: RequestHandler = async ({ request }) => {
  const eventData = await request.json();

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const newEvent = {
    id: Math.max(...mockEvents.map(e => e.id), 0) + 1,
    ...eventData
  };

  mockEvents.push(newEvent);

  return json({
    success: true,
    data: newEvent
  });
};

// PUT /api/events - Update an existing event
export const PUT: RequestHandler = async ({ request }) => {
  const { id, ...updates } = await request.json();

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const eventIndex = mockEvents.findIndex(e => e.id === id);
  if (eventIndex === -1) {
    return json({
      success: false,
      error: 'Event not found'
    }, { status: 404 });
  }

  mockEvents[eventIndex] = { ...mockEvents[eventIndex], ...updates };

  return json({
    success: true,
    data: mockEvents[eventIndex]
  });
};

// DELETE /api/events - Delete an event
export const DELETE: RequestHandler = async ({ request }) => {
  const { id } = await request.json();

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 100));

  const eventIndex = mockEvents.findIndex(e => e.id === id);
  if (eventIndex === -1) {
    return json({
      success: false,
      error: 'Event not found'
    }, { status: 404 });
  }

  const deletedEvent = mockEvents.splice(eventIndex, 1)[0];

  return json({
    success: true,
    data: deletedEvent
  });
};
