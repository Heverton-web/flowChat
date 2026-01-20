
import { Transaction } from '../types';
import * as teamService from './teamService';

let MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    userId: 'manager-1',
    userName: 'Gestor Admin',
    date: '2023-11-01T10:00:00Z',
    description: 'Renovação Mensal - Plano Business',
    amount: 199.50,
    type: 'subscription',
    status: 'completed',
    paymentMethod: 'credit_card',
    invoiceUrl: '#'
  },
  {
    id: 't2',
    userId: 'agent-1',
    userName: 'Atendente Demo',
    date: '2023-11-05T14:30:00Z',
    description: 'Pacote Adicional (1.000 msgs)',
    amount: 9.90,
    type: 'extra_pack',
    status: 'completed',
    paymentMethod: 'pix',
    invoiceUrl: '#'
  },
  {
    id: 't3',
    userId: 'agent-2',
    userName: 'Roberto Vendas',
    date: '2023-11-10T09:15:00Z',
    description: 'Pacote Adicional (2.000 msgs)',
    amount: 19.80,
    type: 'extra_pack',
    status: 'completed',
    paymentMethod: 'credit_card',
    invoiceUrl: '#'
  }
];

export const getTransactions = async (userId: string, role: string): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (role === 'manager') {
        // Managers see everything
        resolve([...MOCK_TRANSACTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      } else {
        // Agents see only their purchases
        resolve(MOCK_TRANSACTIONS.filter(t => t.userId === userId).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      }
    }, 600);
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
            description: `Pacote Adicional (${quantity * unitSize} ${unitLabel})`,
            amount,
            type: 'extra_pack',
            status: 'completed',
            paymentMethod,
            invoiceUrl: '#'
        };

        MOCK_TRANSACTIONS.unshift(newTransaction);

        // 3. Update Agent Quota (Call teamService)
        // We first need to get current agent data
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
        // 1. Simulate Payment Processing delay
        await new Promise(r => setTimeout(r, 2000));

        const amount = 19.90;

        // 2. Create Transaction Record
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

        // 3. Activate Premium
        await teamService.activateAgentPremium(userId);

        resolve(newTransaction);
    });
};
