import { writable, derived } from 'svelte/store';
import type { Lead, Opportunity, Activity } from '$lib/services/crm-db';
import * as crmDB from '$lib/services/crm-db';

interface CRMState {
  leads: Lead[];
  opportunities: Opportunity[];
  activities: Activity[];
  selectedLead: Lead | null;
  selectedOpportunity: Opportunity | null;
  isLoading: boolean;
}

const initialState: CRMState = {
  leads: [],
  opportunities: [],
  activities: [],
  selectedLead: null,
  selectedOpportunity: null,
  isLoading: false,
};

function createCRMStore() {
  const { subscribe, set, update } = writable<CRMState>(initialState);

  return {
    subscribe,

    // Initialize
    async initialize() {
      update(state => ({ ...state, isLoading: true }));
      try {
        await crmDB.initCRMDB();
        const leads = await crmDB.getAllLeads();
        const opportunities = await crmDB.getAllOpportunities();

        update(state => ({
          ...state,
          leads,
          opportunities,
          isLoading: false,
        }));
      } catch (error) {
        console.error('Failed to initialize CRM:', error);
        update(state => ({ ...state, isLoading: false }));
      }
    },

    // Lead operations
    async createLead(lead: Omit<Lead, 'id' | 'createdAt' | 'updatedAt'>) {
      const newLead: Lead = {
        ...lead,
        id: `lead-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await crmDB.saveLead(newLead);
      update(state => ({
        ...state,
        leads: [...state.leads, newLead],
      }));

      return newLead;
    },

    async updateLead(id: string, updates: Partial<Lead>) {
      // First get the existing lead to preserve all fields
      const existingLead = await crmDB.getLead(id);
      if (!existingLead) {
        throw new Error(`Lead ${id} not found`);
      }

      // Merge existing data with updates
      const updatedLead: Lead = {
        ...existingLead,
        ...updates,
        id,
        updatedAt: Date.now(),
      };

      await crmDB.saveLead(updatedLead);

      update(state => ({
        ...state,
        leads: state.leads.map(l => l.id === id ? updatedLead : l),
      }));
    },

    async deleteLead(id: string) {
      await crmDB.deleteLead(id);
      update(state => ({
        ...state,
        leads: state.leads.filter(l => l.id !== id),
        selectedLead: state.selectedLead?.id === id ? null : state.selectedLead,
      }));
    },

    async convertLeadToOpportunity(leadId: string, opportunityData: Partial<Opportunity>) {
      const lead = await crmDB.getLead(leadId);
      if (!lead) return;

      const opportunity: Opportunity = {
        id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        leadId,
        name: opportunityData.name || `${lead.company} - Opportunity`,
        company: lead.company,
        contactName: lead.name,
        contactEmail: lead.email,
        value: opportunityData.value || 0,
        currency: opportunityData.currency || 'USD',
        stage: 'prospecting',
        probability: 10,
        expectedCloseDate: opportunityData.expectedCloseDate || Date.now() + 30 * 24 * 60 * 60 * 1000,
        assignedTo: lead.assignedTo,
        tags: lead.tags,
        notes: lead.notes,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        ...opportunityData,
      };

      await crmDB.saveOpportunity(opportunity);
      await this.updateLead(leadId, {
        status: 'converted',
        convertedToOpportunityId: opportunity.id
      });

      update(state => ({
        ...state,
        opportunities: [...state.opportunities, opportunity],
      }));

      return opportunity;
    },

    selectLead(lead: Lead | null) {
      update(state => ({ ...state, selectedLead: lead }));
    },

    // Opportunity operations
    async createOpportunity(opportunity: Omit<Opportunity, 'id' | 'createdAt' | 'updatedAt'>) {
      const newOpportunity: Opportunity = {
        id: `opp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        leadId: opportunity.leadId,
        name: opportunity.name,
        company: opportunity.company,
        contactName: opportunity.contactName,
        contactEmail: opportunity.contactEmail,
        value: opportunity.value,
        currency: opportunity.currency,
        stage: opportunity.stage,
        probability: opportunity.probability,
        expectedCloseDate: opportunity.expectedCloseDate,
        assignedTo: opportunity.assignedTo,
        tags: opportunity.tags || [],
        notes: opportunity.notes || '',
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      await crmDB.saveOpportunity(newOpportunity);
      update(state => ({
        ...state,
        opportunities: [...state.opportunities, newOpportunity],
      }));

      return newOpportunity;
    },

    async updateOpportunity(id: string, updates: Partial<Opportunity>) {
      // First get the existing opportunity to preserve all fields
      const existingOpp = await crmDB.getOpportunity(id);
      if (!existingOpp) {
        throw new Error(`Opportunity ${id} not found`);
      }

      // Merge existing data with updates
      const updatedOpportunity: Opportunity = {
        ...existingOpp,
        ...updates,
        id,
        updatedAt: Date.now(),
      };

      await crmDB.saveOpportunity(updatedOpportunity);

      update(state => ({
        ...state,
        opportunities: state.opportunities.map(o =>
          o.id === id ? updatedOpportunity : o
        ),
      }));
    },

    async deleteOpportunity(id: string) {
      await crmDB.deleteOpportunity(id);
      update(state => ({
        ...state,
        opportunities: state.opportunities.filter(o => o.id !== id),
        selectedOpportunity: state.selectedOpportunity?.id === id ? null : state.selectedOpportunity,
      }));
    },

    selectOpportunity(opportunity: Opportunity | null) {
      update(state => ({ ...state, selectedOpportunity: opportunity }));
    },

    // Activity operations
    async addActivity(activity: Omit<Activity, 'id' | 'createdAt'>) {
      const newActivity: Activity = {
        ...activity,
        id: `activity-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: Date.now(),
      };

      await crmDB.saveActivity(newActivity);
      update(state => ({
        ...state,
        activities: [...state.activities, newActivity],
      }));

      return newActivity;
    },

    reset() {
      set(initialState);
    },
  };
}

export const crmStore = createCRMStore();

// Derived stores
export const leadsByStatus = derived(crmStore, $crm => {
  return {
    new: $crm.leads.filter(l => l.status === 'new'),
    contacted: $crm.leads.filter(l => l.status === 'contacted'),
    qualified: $crm.leads.filter(l => l.status === 'qualified'),
    unqualified: $crm.leads.filter(l => l.status === 'unqualified'),
    converted: $crm.leads.filter(l => l.status === 'converted'),
  };
});

export const opportunitiesByStage = derived(crmStore, $crm => {
  return {
    prospecting: $crm.opportunities.filter(o => o.stage === 'prospecting'),
    qualification: $crm.opportunities.filter(o => o.stage === 'qualification'),
    proposal: $crm.opportunities.filter(o => o.stage === 'proposal'),
    negotiation: $crm.opportunities.filter(o => o.stage === 'negotiation'),
    closed_won: $crm.opportunities.filter(o => o.stage === 'closed_won'),
    closed_lost: $crm.opportunities.filter(o => o.stage === 'closed_lost'),
  };
});

export const pipelineValue = derived(crmStore, $crm => {
  return $crm.opportunities
    .filter(o => !o.stage.startsWith('closed'))
    .reduce((sum, o) => sum + (o.value * o.probability / 100), 0);
});

export const wonValue = derived(crmStore, $crm => {
  return $crm.opportunities
    .filter(o => o.stage === 'closed_won')
    .reduce((sum, o) => sum + o.value, 0);
});
