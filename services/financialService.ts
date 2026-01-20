

import { Transaction, LicenseStatus, LicenseTier } from '../types';
import * as teamService from './teamService';
import * as evolutionService from './evolutionService';

// MOCK DATA for Transactions
let MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    userId: 'manager-1',
    userName: 'Gestor Admin',
    date: '2023-11-01T10:00:00Z',
    description: 'Mensalidade Enterprise (30 Seats)',
    amount: 4500.00,
    type: 'subscription',
    status: 'completed',
    paymentMethod: 'invoice',
    invoiceUrl: '#'
  }
];

// Estado Global Simulado da Licença (Cenário do Prompt)
let MOCK_LICENSE_STATUS: LicenseStatus = {
    license: {
        tier: 'ENTERPRISE',
        status: 'ACTIVE',
        renewalDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
        limits: {
            maxSeats: 30, // Limite base
            maxMessagesPerMonth: 1000000,
            maxContacts: 500000
        },
        addonSeats: 0,
        features: {
            canUseApi: true,
            whiteLabel: true,
            prioritySupport: true
        }
    },
    usage: {
        usedSeats: 20, // 1 Manager + 19 Agents (Simulado)
        usedInstances: 20, // Paridade 1:1
        usedMessagesThisMonth: 45200,
        usedContacts: 12500
    },
    get totalSeats() {
        return this.license.limits.maxSeats + this.license.addonSeats;
    }
};

export const getTransactions = async (userId: string, role: string): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        resolve([...MOCK_TRANSACTIONS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, 600);
  });
};

// Obtém o status atual da licença corporativa
export const getLicenseStatus = async (): Promise<LicenseStatus> => {
    return new Promise((resolve) => {
        // Atualiza o uso real baseado nos serviços simulados
        setTimeout(async () => {
            const agents = await teamService.getAgents();
            // Seats usados = Agentes + 1 (Gestor)
            MOCK_LICENSE_STATUS.usage.usedSeats = agents.length + 1; 
            
            // Instâncias usadas
            const instances = await evolutionService.fetchInstances('manager-1', 'manager');
            MOCK_LICENSE_STATUS.usage.usedInstances = instances.length;

            resolve(MOCK_LICENSE_STATUS);
        }, 500);
    });
};

// Stub para solicitar mais seats (Simulação de contato comercial/interno)
export const requestAddonSeat = async (quantity: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            MOCK_LICENSE_STATUS.license.addonSeats += quantity;
            
            // Registra transação simulada (fatura gerada)
            MOCK_TRANSACTIONS.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId: 'manager-1',
                userName: 'Gestor Admin',
                date: new Date().toISOString(),
                description: `Solicitação: +${quantity} Seat(s) Adicionais`,
                amount: quantity * 150.00, // Preço fictício por seat
                type: 'addon_seat',
                status: 'pending', // Fica pendente até pagamento da invoice
                paymentMethod: 'invoice'
            });

            resolve();
        }, 1500);
    });
};

export const purchasePremiumSubscription = async (userId: string, userName: string, paymentMethod: 'credit_card' | 'pix'): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            MOCK_TRANSACTIONS.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId,
                userName,
                date: new Date().toISOString(),
                description: 'Assinatura Premium (Individual)',
                amount: 19.90,
                type: 'subscription',
                status: 'completed',
                paymentMethod: paymentMethod,
            });
            resolve();
        }, 1000);
    });
};

export const purchaseExtraPack = async (
    userId: string, 
    userName: string, 
    quantity: number, 
    paymentMethod: 'credit_card' | 'pix',
    type: 'messages' | 'contacts'
): Promise<void> => {
    return new Promise(async (resolve) => {
        setTimeout(() => {
            const amount = type === 'messages' ? 9.90 * quantity : 7.99 * quantity;
            MOCK_TRANSACTIONS.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId,
                userName,
                date: new Date().toISOString(),
                description: `Pacote Extra: ${quantity}x ${type === 'messages' ? 'Envios' : 'Contatos'}`,
                amount: amount,
                type: 'addon_seat',
                status: 'completed',
                paymentMethod: paymentMethod,
            });
            resolve();
        }, 1000);
    });
};