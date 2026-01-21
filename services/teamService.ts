
import { AgentPlan, AgentPermissions, UserRole } from '../types';
import { supabase } from './supabaseClient';
import { mockStore } from './mockDataStore';

export const getAgents = async (): Promise<AgentPlan[]> => {
  if (mockStore.isMockMode()) {
      return mockStore.getAgents() as AgentPlan[];
  }

  const { data, error } = await supabase.from('profiles').select('*').eq('role', 'agent');
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
      messagesUsed: 0,
      permissions: { 
          canCreate: true, canEdit: true, canDelete: false,
          canCreateTags: true, canEditTags: true, canDeleteTags: false
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
    return {
        id: data.id,
        name: data.name,
        email: data.email,
        role: data.role as UserRole,
        status: 'active',
        messagesUsed: 0,
        permissions: { canCreate: true, canEdit: true, canDelete: false, canCreateTags: true, canEditTags: true, canDeleteTags: false }
    };
}

interface AddAgentPayload {
    name: string;
    email: string;
    password?: string;
    permissions?: AgentPermissions;
}

export const addAgent = async (agent: AddAgentPayload): Promise<AgentPlan> => {
  if (mockStore.isMockMode()) {
      // Em modo mock, apenas fingimos que criamos
      return {
          id: `mock_agent_${Date.now()}`,
          name: agent.name,
          email: agent.email,
          status: 'active',
          messagesUsed: 0,
          permissions: agent.permissions || { canCreate: true, canEdit: true, canDelete: false, canCreateTags: true, canEditTags: true, canDeleteTags: false }
      };
  }
  
  throw new Error("Backend Function Required: Creating new users requires server-side admin privileges. Please set up an Edge Function.");
};

export const updateAgent = async (id: string, updates: Partial<AgentPlan>): Promise<AgentPlan> => {
    if (mockStore.isMockMode()) return { ...updates, id } as AgentPlan;

    const { data, error } = await supabase.from('profiles').update({
        name: updates.name,
    }).eq('id', id).select().single();

    if (error) throw error;
    return { ...updates, id } as AgentPlan;
};

export const removeAgent = async (id: string): Promise<void> => {
  if (mockStore.isMockMode()) return;
  const { error } = await supabase.from('profiles').delete().eq('id', id);
  if (error) throw error;
};