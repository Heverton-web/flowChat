
import { Instance } from '../types';

// This service mocks the Evolution API behavior
// Generates instances for the mock agents created in teamService
const MOCK_INSTANCES: Instance[] = [
  { 
    id: '1', name: 'Suporte Geral', status: 'connected', phone: '5511999999999', 
    lastUpdate: '2023-10-27T10:00:00Z', battery: 85, messagesUsed: 850, 
    messagesLimit: 1000, ownerId: 'manager-1', ownerName: 'Gestor Admin'
  },
  { 
    id: '2', name: 'Vendas Júnior', status: 'disconnected', lastUpdate: '2023-10-26T14:30:00Z',
    messagesUsed: 1980, messagesLimit: 3000, ownerId: 'agent-1', ownerName: 'Atendente Demo'
  },
  // Generate dummy instances for the other 18 agents
  ...Array.from({ length: 18 }).map((_, i) => ({
      id: `inst-${i+3}`,
      name: `Instância ${i+3}`,
      status: (Math.random() > 0.2 ? 'connected' : 'disconnected') as 'connected' | 'disconnected',
      lastUpdate: new Date().toISOString(),
      messagesUsed: Math.floor(Math.random() * 5000),
      messagesLimit: 5000,
      ownerId: i === 0 ? 'agent-2' : i === 1 ? 'agent-3' : `agent-mock-${i+2}`, // Mapping loosely
      ownerName: `Atendente ${i+3}`
  }))
];

export const fetchInstances = async (userId: string, role: string): Promise<Instance[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        if (role === 'manager') {
            resolve([...MOCK_INSTANCES]); // Manager sees ALL instances
        } else {
            resolve(MOCK_INSTANCES.filter(i => i.ownerId === userId)); // Agent sees ONLY theirs
        }
    }, 800);
  });
};

export const createInstance = async (name: string, ownerId: string, ownerName: string): Promise<Instance> => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Check if user already has an instance (Parity 1:1 Rule)
      const existingInstance = MOCK_INSTANCES.find(i => i.ownerId === ownerId);
      if (existingInstance) {
          reject(new Error("Você já possui uma instância ativa (Limite 1 por usuário)."));
          return;
      }

      // NOTE: Global limit check should happen here or be passed down, currently handled in UI component via financialService check.

      const newInstance: Instance = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        status: 'disconnected',
        lastUpdate: new Date().toISOString(),
        messagesUsed: 0,
        messagesLimit: 1000, // Default base limit for new instance
        ownerId,
        ownerName
      };
      MOCK_INSTANCES.push(newInstance);
      resolve(newInstance);
    }, 1000);
  });
};

export const deleteInstance = async (id: string, name: string): Promise<void> => {
  const N8N_WEBHOOK_URL = 'https://seu-n8n.com/webhook/delete-instance';

  try {
    console.log(`[Mock] Webhook sent to N8N to delete instance: ${name} (${id})`);
  } catch (error) {
    console.error("Error triggering N8N webhook", error);
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const index = MOCK_INSTANCES.findIndex(i => i.id === id);
      if (index > -1) MOCK_INSTANCES.splice(index, 1);
      resolve();
    }, 600);
  });
};

export const getInstanceQRCode = async (instanceId: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_Connection_Test');
    }, 1200);
  });
};

export const connectInstance = async (instanceId: string): Promise<void> => {
   return new Promise((resolve) => setTimeout(resolve, 2000));
}
