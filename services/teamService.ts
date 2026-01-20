
import { AgentPlan, AgentPermissions } from '../types';
import * as financialService from './financialService';

const STORAGE_KEY = 'flowchat_agents';

// Default Mocks
const MOCK_DEFAULTS: AgentPlan[] = [
  { 
    id: 'agent-1', name: 'Atendente Demo', email: 'agente@empresa.com', 
    status: 'active', messagesUsed: 850, 
    permissions: { canCreate: true, canEdit: true, canDelete: true }
  },
  { 
    id: 'agent-2', name: 'Roberto Vendas', email: 'roberto@empresa.com', 
    status: 'active', messagesUsed: 2800, 
    permissions: { canCreate: true, canEdit: true, canDelete: false } 
  }
];

const loadData = (): AgentPlan[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DEFAULTS));
  return MOCK_DEFAULTS;
};

const saveData = (data: AgentPlan[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getAgents = async (): Promise<AgentPlan[]> => {
  return new Promise(resolve => setTimeout(() => resolve(loadData()), 500));
};

export const getAgentById = async (id: string): Promise<AgentPlan | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(loadData().find(a => a.id === id)), 300));
}

interface AddAgentPayload {
    name: string;
    email: string;
    password?: string;
    permissions?: AgentPermissions;
}

export const addAgent = async (agent: AddAgentPayload): Promise<AgentPlan> => {
  // Check License Limits
  const license = await financialService.getLicenseStatus();
  if (license.usage.usedSeats >= license.totalSeats) {
      throw new Error(`Limite de Seats atingido (${license.totalSeats}). Solicite expansão da licença.`);
  }

  return new Promise(resolve => {
    const agents = loadData();
    const newAgent: AgentPlan = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: agent.name,
      email: agent.email,
      status: 'active', 
      messagesUsed: 0,
      permissions: agent.permissions || { canCreate: true, canEdit: true, canDelete: false },
      tempPassword: agent.password 
    };
    saveData([...agents, newAgent]);
    setTimeout(() => resolve(newAgent), 800);
  });
};

export const removeAgent = async (id: string): Promise<void> => {
  return new Promise(resolve => {
    const agents = loadData();
    saveData(agents.filter(a => a.id !== id));
    setTimeout(resolve, 500);
  });
};

export const updateAgentPermissions = async (id: string, permissions: AgentPermissions): Promise<void> => {
    return new Promise(resolve => {
        const agents = loadData();
        saveData(agents.map(a => a.id === id ? { ...a, permissions } : a));
        setTimeout(resolve, 300);
    });
};
