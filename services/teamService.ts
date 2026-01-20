
import { AgentPlan, AgentPermissions, GlobalSubscription } from '../types';

// Mock Agents Data
let MOCK_AGENTS: AgentPlan[] = [
  { 
    id: 'agent-1', 
    name: 'Atendente Demo', 
    email: 'agente@empresa.com', 
    extraPacks: 0, 
    extraContactPacks: 0,
    status: 'active',
    messagesUsed: 850, 
    permissions: { canCreate: true, canEdit: true, canDelete: true }
  },
  { 
    id: 'agent-2', 
    name: 'Roberto Vendas', 
    email: 'roberto@empresa.com', 
    extraPacks: 2, 
    extraContactPacks: 1, 
    status: 'active',
    messagesUsed: 2800, 
    permissions: { canCreate: true, canEdit: true, canDelete: false } 
  },
  { 
    id: 'agent-3', 
    name: 'Carla Suporte', 
    email: 'carla@empresa.com', 
    extraPacks: 5, 
    extraContactPacks: 0,
    status: 'active',
    messagesUsed: 1200, 
    permissions: { canCreate: true, canEdit: true, canDelete: true },
    personalPremiumExpiry: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString() // Mock: Bought 15 days ago, 15 left
  }
];

// Mock Global Subscription State
let MOCK_SUBSCRIPTION: GlobalSubscription = {
    planType: 'business',
    status: 'active',
    renewalDate: new Date(new Date().setDate(new Date().getDate() + 25)).toISOString(), // 25 days left
    totalMessagePacksPurchased: 10, // Total bought by manager
    totalContactPacksPurchased: 5,  // Total bought by manager
    hasPremiumFeatures: false // Default false to test agent upgrade
};

export const getAgents = async (): Promise<AgentPlan[]> => {
  return new Promise(resolve => setTimeout(() => resolve([...MOCK_AGENTS]), 500));
};

export const getAgentById = async (id: string): Promise<AgentPlan | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(MOCK_AGENTS.find(a => a.id === id)), 300));
}

export const getGlobalSubscription = async (): Promise<GlobalSubscription> => {
    return new Promise(resolve => setTimeout(() => resolve({...MOCK_SUBSCRIPTION}), 400));
}

// Called by Subscription Component (Buying more capacity)
export const purchaseGlobalPacks = async (type: 'message' | 'contact', quantity: number): Promise<GlobalSubscription> => {
    return new Promise(resolve => {
        if (type === 'message') {
            MOCK_SUBSCRIPTION.totalMessagePacksPurchased += quantity;
        } else {
            MOCK_SUBSCRIPTION.totalContactPacksPurchased += quantity;
        }
        setTimeout(() => resolve({...MOCK_SUBSCRIPTION}), 800);
    });
};

export const togglePremiumFeatures = async (active: boolean): Promise<GlobalSubscription> => {
    return new Promise(resolve => {
        MOCK_SUBSCRIPTION.hasPremiumFeatures = active;
        setTimeout(() => resolve({...MOCK_SUBSCRIPTION}), 500);
    });
};

// Simulation for Agent buying Premium themselves
export const activateAgentPremium = async (agentId: string): Promise<AgentPlan | undefined> => {
    return new Promise(resolve => {
        const agentIndex = MOCK_AGENTS.findIndex(a => a.id === agentId);
        if (agentIndex > -1) {
            // Set expiry to 30 days from now
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + 30);
            MOCK_AGENTS[agentIndex].personalPremiumExpiry = expiry.toISOString();
            setTimeout(() => resolve(MOCK_AGENTS[agentIndex]), 800);
        } else {
            resolve(undefined);
        }
    });
};

interface AddAgentPayload {
    name: string;
    email: string;
    password?: string;
    permissions?: AgentPermissions;
}

// Creating agent now just adds them to the list, pack distribution happens later
export const addAgent = async (agent: AddAgentPayload): Promise<AgentPlan> => {
  return new Promise(resolve => {
    const newAgent: AgentPlan = { 
      id: Math.random().toString(36).substr(2, 9), 
      name: agent.name,
      email: agent.email,
      extraPacks: 0, // Starts with 0 distributed packs
      extraContactPacks: 0, // Starts with 0 distributed packs
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

// Called by Team Component (Distributing available capacity)
export const assignPackToAgent = async (agentId: string, type: 'message' | 'contact', newValue: number): Promise<void> => {
  return new Promise((resolve, reject) => {
      // Calculate totals to ensure we don't assign more than we have
      const totalAssignedMsgs = MOCK_AGENTS.reduce((acc, a) => acc + (a.id === agentId ? newValue : a.extraPacks), 0);
      const totalAssignedContacts = MOCK_AGENTS.reduce((acc, a) => acc + (a.id === agentId ? newValue : a.extraContactPacks), 0);

      // Validation logic is handled in UI usually, but good to have here
      if (type === 'message' && newValue > MOCK_AGENTS.find(a => a.id === agentId)!.extraPacks) {
          // If increasing, check global limit
          const currentTotal = MOCK_AGENTS.reduce((acc, a) => acc + a.extraPacks, 0);
          const diff = newValue - MOCK_AGENTS.find(a => a.id === agentId)!.extraPacks;
          if (currentTotal + diff > MOCK_SUBSCRIPTION.totalMessagePacksPurchased) {
              reject(new Error("Saldo de pacotes globais insuficiente. Adquira mais na aba Assinatura."));
              return;
          }
      }
      
      // ... similar logic for contacts ...

      MOCK_AGENTS = MOCK_AGENTS.map(a => {
          if (a.id === agentId) {
              return type === 'message' 
                  ? { ...a, extraPacks: newValue }
                  : { ...a, extraContactPacks: newValue };
          }
          return a;
      });
      setTimeout(resolve, 300);
  });
};

// Legacy support wrappers if needed
export const updateAgentPacks = async (id: string, newPacks: number): Promise<void> => {
    return assignPackToAgent(id, 'message', newPacks);
}
export const updateAgentContactPacks = async (id: string, newPacks: number): Promise<void> => {
    return assignPackToAgent(id, 'contact', newPacks);
}

export const updateAgentPermissions = async (id: string, permissions: AgentPermissions): Promise<void> => {
    return new Promise(resolve => {
        MOCK_AGENTS = MOCK_AGENTS.map(a => a.id === id ? { ...a, permissions } : a);
        setTimeout(resolve, 300);
    });
};
