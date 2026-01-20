
import { Instance } from '../types';
import * as financialService from './financialService';

const STORAGE_KEY = 'flowchat_instances';

// Default Mocks
const MOCK_DEFAULTS: Instance[] = [
  { 
    id: '1', name: 'Suporte Geral', status: 'connected', phone: '5511999999999', 
    lastUpdate: '2023-10-27T10:00:00Z', battery: 85, messagesUsed: 850, 
    messagesLimit: 0, ownerId: 'manager-1', ownerName: 'Gestor Admin'
  },
  { 
    id: '2', name: 'Vendas Júnior', status: 'disconnected', lastUpdate: '2023-10-26T14:30:00Z',
    messagesUsed: 1980, messagesLimit: 0, ownerId: 'agent-1', ownerName: 'Atendente Demo'
  }
];

// Helper to load/save
const loadData = (): Instance[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  // If not found, save defaults
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DEFAULTS));
  return MOCK_DEFAULTS;
};

const saveData = (data: Instance[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const fetchInstances = async (userId: string, role: string): Promise<Instance[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        const instances = loadData();
        if (role === 'manager') {
            resolve(instances); 
        } else {
            resolve(instances.filter(i => i.ownerId === userId)); 
        }
    }, 600);
  });
};

export const createInstance = async (name: string, ownerId: string, ownerName: string): Promise<Instance> => {
  
  // 1. Check Global Seat/Instance Limit
  const license = await financialService.getLicenseStatus();
  const instances = loadData();
  
  if (instances.length >= license.totalSeats) {
      throw new Error(`Limite global de instâncias atingido (${license.totalSeats}). Expanda sua licença.`);
  }

  // 2. Check 1:1 User Limit
  const existingInstance = instances.find(i => i.ownerId === ownerId);
  if (existingInstance) {
      throw new Error("Você já possui uma instância ativa (Limite 1 por usuário).");
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      const newInstance: Instance = {
        id: Math.random().toString(36).substr(2, 9),
        name,
        status: 'connecting', // Initial state
        lastUpdate: new Date().toISOString(),
        messagesUsed: 0,
        messagesLimit: 0,
        ownerId,
        ownerName
      };
      
      const updated = [...instances, newInstance];
      saveData(updated);
      resolve(newInstance);
    }, 1500); // Simulated delay for "Creating..."
  });
};

export const deleteInstance = async (id: string, name: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const instances = loadData();
      const updated = instances.filter(i => i.id !== id);
      saveData(updated);
      resolve();
    }, 600);
  });
};

export const getInstanceQRCode = async (instanceId: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Return a static QR or dynamic one
      resolve('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_Connection_Test_' + instanceId);
    }, 1500); // Simulate API generation time
  });
};

export const connectInstance = async (instanceId: string): Promise<void> => {
   return new Promise((resolve) => {
       setTimeout(() => {
           const instances = loadData();
           const updated = instances.map(i => i.id === instanceId ? { ...i, status: 'connected' as const, phone: '5511999999999' } : i);
           saveData(updated);
           resolve();
       }, 500); // Fast update, visual delay handled in frontend
   });
}
