
import { Transaction, License } from '../types';
import * as teamService from './teamService';

// MOCK DATA for Transactions
let MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    userId: 'manager-1',
    userName: 'Gestor Admin',
    date: '2023-11-01T10:00:00Z',
    description: 'Setup Inicial + Licença Enterprise (Mensalidade)',
    amount: 2500.00,
    type: 'subscription',
    status: 'completed',
    paymentMethod: 'pix',
    invoiceUrl: '#'
  }
];

export const getTransactions = async (userId: string, role: string): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (role === 'manager') {
        resolve([...MOCK_TRANSACTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        resolve(MOCK_TRANSACTIONS.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    }, 600);
  });
};

// NEW: Mock for Single-Tenant License Status
// Simulating the CLIENT SCENARIO: 20 Agents on an Enterprise Plan (Max 30)
export const getLicenseStatus = async (): Promise<License> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            resolve({
                type: 'enterprise',
                maxUsers: 30,
                maxInstances: 30, // Parity 1:1
                status: 'active',
                renewalDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(), // 15 days to renew
                modules: ['crm', 'kanban', 'api_access', 'reports_advanced'],
                
                // Real Usage (Simulating the 20 agents scenario)
                activeUsers: 20, 
                activeInstances: 20, // All connected
                
                features: {
                    canUseApi: true,
                    whiteLabel: true,
                    prioritySupport: true
                }
            });
        }, 800);
    });
};

export const purchaseExtraPack = async (
    userId: string, 
    userName: string, 
    quantity: number, 
    paymentMethod: 'pix' | 'credit_card',
    packType: 'messages' | 'contacts' // Added parameter
): Promise<Transaction> => {
    return new Promise(async (resolve) => {
        // 1. Simulate Payment Processing delay
        await new Promise(r => setTimeout(r, 2000));

        // Determine price based on type
        // Messages: 9.90 / 1000
        // Contacts: 7.99 / 500
        const unitPrice = packType === 'messages' ? 9.90 : 7.99;
        const unitLabel = packType === 'messages' ? 'msgs' : 'contatos';
        const unitSize = packType === 'messages' ? 1000 : 500;

        const amount = quantity * unitPrice;

        // 2. Create Transaction Record
        const newTransaction: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            userName,
            date: new Date().toISOString(),
            description: `Add-on: Pacote Adicional (${quantity * unitSize} ${unitLabel})`,
            amount,
            type: 'extra_pack',
            status: 'completed',
            paymentMethod,
            invoiceUrl: '#'
        };

        MOCK_TRANSACTIONS.unshift(newTransaction);

        // 3. Update Agent Quota (Call teamService)
        const agent = await teamService.getAgentById(userId);
        if (agent) {
            if (packType === 'messages') {
                await teamService.updateAgentPacks(userId, agent.extraPacks + quantity);
            } else {
                await teamService.updateAgentContactPacks(userId, (agent.extraContactPacks || 0) + quantity);
            }
        }

        resolve(newTransaction);
    });
};

export const purchasePremiumSubscription = async (
    userId: string,
    userName: string,
    paymentMethod: 'pix' | 'credit_card'
): Promise<Transaction> => {
    return new Promise(async (resolve) => {
        await new Promise(r => setTimeout(r, 2000));
        const amount = 19.90;
        const newTransaction: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            userName,
            date: new Date().toISOString(),
            description: `Assinatura Premium Individual (30 dias)`,
            amount,
            type: 'upgrade_pro',
            status: 'completed',
            paymentMethod,
            invoiceUrl: '#'
        };
        MOCK_TRANSACTIONS.unshift(newTransaction);
        await teamService.activateAgentPremium(userId);
        resolve(newTransaction);
    });
};
