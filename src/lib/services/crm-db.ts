import { openDB, type IDBPDatabase } from 'idb';

const DB_NAME = 'globify-crm';
const DB_VERSION = 1;
const LEADS_STORE = 'leads';
const OPPORTUNITIES_STORE = 'opportunities';
const ACTIVITIES_STORE = 'activities';

export interface Lead {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string;
  source: 'website' | 'referral' | 'cold_call' | 'linkedin' | 'event' | 'other';
  status: 'new' | 'contacted' | 'qualified' | 'unqualified' | 'converted';
  score: number; // 0-100
  assignedTo: string;
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  convertedToOpportunityId?: string;
}

export interface Opportunity {
  id: string;
  leadId?: string;
  name: string;
  company: string;
  contactName: string;
  contactEmail: string;
  value: number;
  currency: string;
  stage: 'prospecting' | 'qualification' | 'proposal' | 'negotiation' | 'closed_won' | 'closed_lost';
  probability: number; // 0-100
  expectedCloseDate: number;
  assignedTo: string;
  tags: string[];
  notes: string;
  createdAt: number;
  updatedAt: number;
  closedAt?: number;
  lostReason?: string;
}

export interface Activity {
  id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  relatedTo: 'lead' | 'opportunity';
  relatedId: string;
  subject: string;
  description: string;
  completedAt?: number;
  dueAt?: number;
  createdBy: string;
  createdAt: number;
}

let db: IDBPDatabase | null = null;

export async function initCRMDB(): Promise<IDBPDatabase> {
  if (db) return db;

  db = await openDB(DB_NAME, DB_VERSION, {
    upgrade(database, oldVersion, newVersion, transaction) {
      // Leads store
      if (!database.objectStoreNames.contains(LEADS_STORE)) {
        const leadsStore = database.createObjectStore(LEADS_STORE, { keyPath: 'id' });
        leadsStore.createIndex('status', 'status');
        leadsStore.createIndex('assignedTo', 'assignedTo');
        leadsStore.createIndex('createdAt', 'createdAt');
        leadsStore.createIndex('score', 'score');
      }

      // Opportunities store
      if (!database.objectStoreNames.contains(OPPORTUNITIES_STORE)) {
        const opportunitiesStore = database.createObjectStore(OPPORTUNITIES_STORE, { keyPath: 'id' });
        opportunitiesStore.createIndex('stage', 'stage');
        opportunitiesStore.createIndex('assignedTo', 'assignedTo');
        opportunitiesStore.createIndex('expectedCloseDate', 'expectedCloseDate');
        opportunitiesStore.createIndex('createdAt', 'createdAt');
      }

      // Activities store
      if (!database.objectStoreNames.contains(ACTIVITIES_STORE)) {
        const activitiesStore = database.createObjectStore(ACTIVITIES_STORE, { keyPath: 'id' });
        activitiesStore.createIndex('relatedTo', 'relatedTo');
        activitiesStore.createIndex('relatedId', 'relatedId');
        activitiesStore.createIndex('createdAt', 'createdAt');
        activitiesStore.createIndex('dueAt', 'dueAt');
      }
    },
  });

  return db;
}

// Lead operations
export async function saveLead(lead: Lead): Promise<void> {
  const database = await initCRMDB();
  await database.put(LEADS_STORE, lead);
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const database = await initCRMDB();
  return await database.get(LEADS_STORE, id);
}

export async function getAllLeads(): Promise<Lead[]> {
  const database = await initCRMDB();
  return await database.getAll(LEADS_STORE);
}

export async function getLeadsByStatus(status: Lead['status']): Promise<Lead[]> {
  const database = await initCRMDB();
  return await database.getAllFromIndex(LEADS_STORE, 'status', status);
}

export async function deleteLead(id: string): Promise<void> {
  const database = await initCRMDB();
  await database.delete(LEADS_STORE, id);
}

// Opportunity operations
export async function saveOpportunity(opportunity: Opportunity): Promise<void> {
  const database = await initCRMDB();
  await database.put(OPPORTUNITIES_STORE, opportunity);
}

export async function getOpportunity(id: string): Promise<Opportunity | undefined> {
  const database = await initCRMDB();
  return await database.get(OPPORTUNITIES_STORE, id);
}

export async function getAllOpportunities(): Promise<Opportunity[]> {
  const database = await initCRMDB();
  return await database.getAll(OPPORTUNITIES_STORE);
}

export async function getOpportunitiesByStage(stage: Opportunity['stage']): Promise<Opportunity[]> {
  const database = await initCRMDB();
  return await database.getAllFromIndex(OPPORTUNITIES_STORE, 'stage', stage);
}

export async function deleteOpportunity(id: string): Promise<void> {
  const database = await initCRMDB();
  await database.delete(OPPORTUNITIES_STORE, id);
}

// Activity operations
export async function saveActivity(activity: Activity): Promise<void> {
  const database = await initCRMDB();
  await database.put(ACTIVITIES_STORE, activity);
}

export async function getActivitiesForLead(leadId: string): Promise<Activity[]> {
  const database = await initCRMDB();
  const allActivities = await database.getAll(ACTIVITIES_STORE);
  return allActivities.filter(a => a.relatedTo === 'lead' && a.relatedId === leadId);
}

export async function getActivitiesForOpportunity(opportunityId: string): Promise<Activity[]> {
  const database = await initCRMDB();
  const allActivities = await database.getAll(ACTIVITIES_STORE);
  return allActivities.filter(a => a.relatedTo === 'opportunity' && a.relatedId === opportunityId);
}

export async function deleteActivity(id: string): Promise<void> {
  const database = await initCRMDB();
  await database.delete(ACTIVITIES_STORE, id);
}
