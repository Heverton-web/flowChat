

import { Transaction, LicenseStatus } from '../types';
import * as teamService from './teamService';
import * as evolutionService from './evolutionService';

// MOCK DATA for Enterprise Transactions (Invoices)
let MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 't1',
    userId: 'manager-1',
    userName: 'Gestor Admin',
    date: '2023-11-01T10:00:00Z',
    description: 'Licença Enterprise - Mensalidade (30 Seats)',
    amount: 4500.00,
    type: 'subscription',
    status: 'completed',
    paymentMethod: 'invoice',
    invoiceUrl: '#'
  }
];

// Estado Global Simulado da Licença
let MOCK_LICENSE_STATUS: LicenseStatus = {
    license: {
        tier: 'ENTERPRISE',
        status: 'ACTIVE',
        renewalDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
        limits: {
            maxSeats: 30, // 30 Seats Contracted
            maxMessagesPerMonth: 1000000,
            maxContacts: 50000
        },
        addonSeats: 0,
        features: {
            canUseApi: true,
            whiteLabel: true,
            prioritySupport: true
        }
    },
    usage: {
        usedSeats: 20, // 20 Currently Used (1 Manager + 19 Agents)
        usedInstances: 20, // 1:1 Parity
        usedMessagesThisMonth: 124500,
        usedContacts: 15400
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

export const getLicenseStatus = async (): Promise<LicenseStatus> => {
    return new Promise((resolve) => {
        // Sync mock usage with other services
        setTimeout(async () => {
            const agents = await teamService.getAgents();
            MOCK_LICENSE_STATUS.usage.usedSeats = agents.length + 1; // Agents + Manager
            
            // For instances, we assume parity or fetch count
            const instances = await evolutionService.fetchInstances('manager-1', 'manager');
            MOCK_LICENSE_STATUS.usage.usedInstances = instances.length;

            resolve(MOCK_LICENSE_STATUS);
        }, 500);
    });
};

export const requestAddonSeat = async (quantity: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            // In a real app, this would trigger a sales request or add to invoice
            MOCK_LICENSE_STATUS.license.addonSeats += quantity;
            
            MOCK_TRANSACTIONS.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId: 'manager-1',
                userName: 'Gestor Admin',
                date: new Date().toISOString(),
                description: `Solicitação: +${quantity} Seat(s) Adicionais`,
                amount: quantity * 150.00,
                type: 'addon_seat',
                status: 'pending', 
                paymentMethod: 'invoice'
            });

            resolve();
        }, 1500);
    });
};

export const purchasePremiumSubscription = async (userId: string, userName: string, method: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
             MOCK_TRANSACTIONS.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId,
                userName,
                date: new Date().toISOString(),
                description: 'Assinatura Premium (Individual) - 30 Dias',
                amount: 19.90,
                type: 'subscription',
                status: 'completed',
                paymentMethod: method as any
            });
            resolve();
        }, 1500);
    });
};

export const purchaseExtraPack = async (userId: string, userName: string, quantity: number, method: string, type: string): Promise<void> => {
     return new Promise((resolve) => {
        setTimeout(() => {
             const amount = type === 'messages' ? 9.90 * quantity : 7.99 * quantity;
             MOCK_TRANSACTIONS.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId,
                userName,
                date: new Date().toISOString(),
                description: `Pacote Adicional: ${quantity}x ${type === 'messages' ? 'Envios' : 'Contatos'}`,
                amount: amount,
                type: 'addon_seat', 
                status: 'completed',
                paymentMethod: method as any
            });
            resolve();
        }, 1500);
    });
};