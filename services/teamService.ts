
import { AgentPlan, AgentPermissions } from '../types';
import * as financialService from './financialService';

// Mock Agents (1 Manager + 19 Agents = 20 Used Seats)
let MOCK_AGENTS: AgentPlan[] = [
  { 
    id: 'agent-1', name: 'Atendente Demo', email: 'agente@empresa.com', 
    status: 'active', messagesUsed: 850, 
    permissions: { canCreate: true, canEdit: true, canDelete: true }
  },
  { 
    id: 'agent-2', name: 'Roberto Vendas', email: 'roberto@empresa.com', 
    status: 'active', messagesUsed: 2800, 
    permissions: { canCreate: true, canEdit: true, canDelete: false } 
  },
  { 
    id: 'agent-3', name: 'Carla Suporte', email: 'carla@empresa.com', 
    status: 'active', messagesUsed: 1200, 
    permissions: { canCreate: true, canEdit: true, canDelete: true },
  },
  // Generate dummy agents to reach 19 total agents
  ...Array.from({ length: 16 }).map((_, i) => ({
      id: `agent-mock-${i+4}`,
      name: `Atendente ${i+4}`,
      email: `user${i+4}@empresa.com`,
      status: 'active' as const,
      messagesUsed: Math.floor(Math.random() * 1000),
      permissions: { canCreate: false, canEdit: true, canDelete: false }
  }))
];

export const getAgents = async (): Promise<AgentPlan[]> => {
  return new Promise(resolve => setTimeout(() => resolve([...MOCK_AGENTS]), 500));
};

export const getAgentById = async (id: string): Promise<AgentPlan | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_AGENTS.find(a => a.id === id)), 300));
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
    const newAgent: AgentPlan = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: agent.name,
      email: agent.email,
      status: 'active', 
      messagesUsed: 0,
      permissions: agent.permissions || { canCreate: true, canEdit: true, canDelete: false },
      tempPassword: agent.password 
    };
    MOCK_AGENTS = [...MOCK_AGENTS, newAgent];
    setTimeout(() => resolve(newAgent), 800);
  });
};

export const removeAgent = async (id: string): Promise<void> => {
  return new Promise(resolve => {
    MOCK_AGENTS = MOCK_AGENTS.filter(a => a.id !== id);
    setTimeout(resolve, 500);
  });
};

export const updateAgentPermissions = async (id: string, permissions: AgentPermissions): Promise<void> => {
    return new Promise(resolve => {
        MOCK_AGENTS = MOCK_AGENTS.map(a => a.id === id ? { ...a, permissions } : a);
        setTimeout(resolve, 300);
    });
};
