
import { AgentPlan, AgentPermissions, UserRole } from '../types';
import { supabase } from './supabaseClient';
import { mockStore } from './mockDataStore';

export const getAgents = async (): Promise<AgentPlan[]> => {
  if (mockStore.isMockMode()) {
      return mockStore.getAgents() as AgentPlan[];
  }

  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
      console.error(error);
      return [];
  }

  return data.map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role as UserRole,
      status: 'active',
      messagesUsed: 0, // Metric would come from another table/count in real app
      permissions: { 
          canCreate: true, canEdit: true, canDelete: p.role !== 'agent',
          canCreateTags: true, canEditTags: true, canDeleteTags: p.role !== 'agent'
      },
      avatar: p.avatar_url
  }));
};

export const getAgentById = async (id: string): Promise<AgentPlan | undefined> => {
    if (mockStore.isMockMode()) {
        return mockStore.getAgents().find(a => a.id === id) as AgentPlan | undefined;
    }

    const { data, error } = await supabase.from('profiles').select('*').eq('id', id).single();
    if (error || !data) return undefined;
    
    // Default permission logic for real app fallback
    const isManager = data.role === 'manager' || data.role === 'super_admin';
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        status: 'active',
        messagesUsed: 0,
        permissions: { 
            canCreate: true, 
            canEdit: true, 
            canDelete: isManager, 
            canCreateTags: true, 
            canEditTags: true, 
            canDeleteTags: isManager 
        }
    };
}

interface AddAgentPayload {
    name: string;
    email: string;
    password?: string;
    role?: UserRole;
    permissions?: AgentPermissions;
}

export const addAgent = async (agent: AddAgentPayload): Promise<AgentPlan> => {
  if (mockStore.isMockMode()) {
      // Mock Creation logic handles pushing to local array
      // In a real app, this would call an Edge Function to create Auth User + Profile
      console.log("[MOCK] Creating agent:", agent);
      const newAgent: AgentPlan = {
          id: `mock_agent_${Date.now()}`,
          name: agent.name,
          email: agent.email,
          role: agent.role || 'agent',
          status: 'active',
          messagesUsed: 0,
          permissions: agent.permissions || { 
              canCreate: true, canEdit: true, canDelete: false, 
              canCreateTags: true, canEditTags: true, canDeleteTags: false 
          }
      };
      // We push to mockStore via a helper (assumed mockStore has a setter or we simulate it here by not persisting across refresh if setAgents isnt used)
      // For this demo, the UI state update is enough, but to persist in mockStore:
      // mockStore.addAgent(newAgent); // Hypothetical
      return newAgent;
  }
  
  throw new Error("Backend Function Required: Creating new users requires server-side admin privileges. Please set up an Edge Function.");
};

export const updateAgent = async (id: string, updates: Partial<AgentPlan>): Promise<AgentPlan> => {
    if (mockStore.isMockMode()) {
        return { ...updates, id } as AgentPlan;
    }

    const { data, error } = await supabase.from('profiles').update({
        name: updates.name,
        role: updates.role
        // Permissions typically stored in a JSONB column 'settings' or separate table
    }).eq('id', id).select().single();

    if (error) throw error;
    return { ...updates, id } as AgentPlan;
};

export const removeAgent = async (id: string): Promise<void> => {
  if (mockStore.isMockMode()) return;
  // Soft delete typically
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
};
