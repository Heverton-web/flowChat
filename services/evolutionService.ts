
import { Instance } from '../types';

// This service mocks the Evolution API behavior
// In a real scenario, you would use fetch() or axios.

const MOCK_INSTANCES: Instance[] = [
  { 
    id: '1', 
    name: 'Suporte Geral', 
    status: 'connected', 
    phone: '5511999999999', 
    lastUpdate: '2023-10-27T10:00:00Z', 
    battery: 85,
    messagesUsed: 850,
    messagesLimit: 1000,
    ownerId: 'manager-1',
    ownerName: 'Gestor Admin'
  },
  { 
    id: '2', 
    name: 'Vendas Júnior', 
    status: 'disconnected', 
    lastUpdate: '2023-10-26T14:30:00Z',
    messagesUsed: 1980,
    messagesLimit: 3000,
    ownerId: 'agent-1',
    ownerName: 'Atendente Demo'
  }
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
      // Check if user already has an instance
      const existingInstance = MOCK_INSTANCES.find(i => i.ownerId === ownerId);
      if (existingInstance) {
          reject(new Error("Limit reached: You can only have 1 instance."));
          return;
      }

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
  // SIMULATION OF N8N WEBHOOK
  // In production, replace the URL below with your N8N Webhook URL
  const N8N_WEBHOOK_URL = 'https://seu-n8n.com/webhook/delete-instance';

  try {
    // Uncomment this block to actually send the request
    /*
    await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
            instanceId: id,
            instanceName: name,
            action: 'delete'
        })
    });
    */
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
