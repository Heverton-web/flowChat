
import { Instance } from '../types';
import * as financialService from './financialService';

// Mock Instances - Parity with Team (20 instances for 20 users)
const MOCK_INSTANCES: Instance[] = [
  { 
    id: '1', name: 'Suporte Geral', status: 'connected', phone: '5511999999999', 
    lastUpdate: '2023-10-27T10:00:00Z', battery: 85, messagesUsed: 850, 
    messagesLimit: 0, ownerId: 'manager-1', ownerName: 'Gestor Admin'
  },
  { 
    id: '2', name: 'Vendas Júnior', status: 'disconnected', lastUpdate: '2023-10-26T14:30:00Z',
    messagesUsed: 1980, messagesLimit: 0, ownerId: 'agent-1', ownerName: 'Atendente Demo'
  },
  // Dummy instances
  ...Array.from({ length: 18 }).map((_, i) => ({
      id: `inst-${i+3}`,
      name: `Instância ${i+3}`,
      status: (Math.random() > 0.2 ? 'connected' : 'disconnected') as 'connected' | 'disconnected',
      lastUpdate: new Date().toISOString(),
      messagesUsed: Math.floor(Math.random() * 5000),
      messagesLimit: 0,
      ownerId: i === 0 ? 'agent-2' : i === 1 ? 'agent-3' : `agent-mock-${i+2}`,
      ownerName: `Atendente ${i+3}`
  }))
];

export const fetchInstances = async (userId: string, role: string): Promise<Instance[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        if (role === 'manager') {
            resolve([...MOCK_INSTANCES]); 
        } else {
            resolve(MOCK_INSTANCES.filter(i => i.ownerId === userId)); 
        }
    }, 800);
  });
};

export const createInstance = async (name: string, ownerId: string, ownerName: string): Promise<Instance> => {
  
  // 1. Check Global Seat/Instance Limit
  const license = await financialService.getLicenseStatus();
  if (license.usage.usedInstances >= license.totalSeats) {
      throw new Error(`Limite global de instâncias atingido (${license.totalSeats}). Expanda sua licença.`);
  }

  // 2. Check 1:1 User Limit
  const existingInstance = MOCK_INSTANCES.find(i => i.ownerId === ownerId);
  if (existingInstance) {
      throw new Error("Você já possui uma instância ativa (Limite 1 por usuário).");
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const newInstance: Instance = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        status: 'disconnected',
        lastUpdate: new Date().toISOString(),
        messagesUsed: 0,
        messagesLimit: 0,
        ownerId,
        ownerName
      };
      MOCK_INSTANCES.push(newInstance);
      resolve(newInstance);
    }, 1000);
  });
};

export const deleteInstance = async (id: string, name: string): Promise<void> => {
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
