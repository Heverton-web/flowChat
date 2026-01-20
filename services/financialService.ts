
import { Transaction, LicenseStatus } from '../types';
import * as teamService from './teamService';
import * as evolutionService from './evolutionService';

const STORAGE_TRANS_KEY = 'flowchat_transactions';
const STORAGE_LIC_KEY = 'flowchat_license';

// MOCK DEFAULTS
const MOCK_TRANS_DEFAULTS: Transaction[] = [
  {
    id: 't1', userId: 'manager-1', userName: 'Gestor Admin', date: '2023-11-01T10:00:00Z',
    description: 'Licença Enterprise - Mensalidade (30 Seats)', amount: 4500.00,
    type: 'subscription', status: 'completed', paymentMethod: 'invoice'
  }
];

const MOCK_LIC_DEFAULT: LicenseStatus = {
    license: {
        tier: 'ENTERPRISE', status: 'ACTIVE',
        renewalDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString(),
        limits: { maxSeats: 30, maxMessagesPerMonth: 1000000, maxContacts: 50000 },
        addonSeats: 0,
        features: { canUseApi: true, whiteLabel: true, prioritySupport: true }
    },
    usage: { usedSeats: 20, usedInstances: 20, usedMessagesThisMonth: 124500, usedContacts: 15400 },
    get totalSeats() { return this.license.limits.maxSeats + this.license.addonSeats; }
};

const loadTransactions = (): Transaction[] => {
    const stored = localStorage.getItem(STORAGE_TRANS_KEY);
    return stored ? JSON.parse(stored) : MOCK_TRANS_DEFAULTS;
};

const saveTransactions = (data: Transaction[]) => localStorage.setItem(STORAGE_TRANS_KEY, JSON.stringify(data));

// License is partially persisted (addonSeats), partly computed (usage)
const getBaseLicense = (): LicenseStatus => {
    const stored = localStorage.getItem(STORAGE_LIC_KEY);
    if (stored) {
        const parsed = JSON.parse(stored);
        // Re-attach getter
        Object.defineProperty(parsed, 'totalSeats', {
            get: function() { return this.license.limits.maxSeats + this.license.addonSeats; }
        });
        return parsed;
    }
    return MOCK_LIC_DEFAULT;
};

const saveLicense = (data: LicenseStatus) => localStorage.setItem(STORAGE_LIC_KEY, JSON.stringify(data));

export const getTransactions = async (userId: string, role: string): Promise<Transaction[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        const trans = loadTransactions();
        resolve(trans.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    }, 600);
  });
};

export const getLicenseStatus = async (): Promise<LicenseStatus> => {
    return new Promise((resolve) => {
        setTimeout(async () => {
            const licenseData = getBaseLicense();
            
            // Sync live usage
            const agents = await teamService.getAgents();
            const instances = await evolutionService.fetchInstances('manager-1', 'manager');
            
            licenseData.usage.usedSeats = agents.length + 1;
            licenseData.usage.usedInstances = instances.length;

            resolve(licenseData);
        }, 500);
    });
};

export const requestAddonSeat = async (quantity: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            const licenseData = getBaseLicense();
            licenseData.license.addonSeats += quantity;
            saveLicense(licenseData);
            
            const trans = loadTransactions();
            trans.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId: 'manager-1', userName: 'Gestor Admin', date: new Date().toISOString(),
                description: `Solicitação: +${quantity} Seat(s) Adicionais`,
                amount: quantity * 150.00, type: 'addon_seat', status: 'pending', paymentMethod: 'invoice'
            });
            saveTransactions(trans);
            resolve();
        }, 1500);
    });
};

export const purchasePremiumSubscription = async (userId: string, userName: string, method: string): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
             const trans = loadTransactions();
             trans.unshift({
                id: Math.random().toString(36).substr(2, 9), userId, userName, date: new Date().toISOString(),
                description: 'Assinatura Premium (Individual) - 30 Dias', amount: 19.90,
                type: 'subscription', status: 'completed', paymentMethod: method as any
            });
            saveTransactions(trans);
            resolve();
        }, 1500);
    });
};

export const purchaseExtraPack = async (userId: string, userName: string, quantity: number, method: string, type: string): Promise<void> => {
     return new Promise((resolve) => {
        setTimeout(() => {
             const amount = type === 'messages' ? 9.90 * quantity : 7.99 * quantity;
             const trans = loadTransactions();
             trans.unshift({
                id: Math.random().toString(36).substr(2, 9), userId, userName, date: new Date().toISOString(),
                description: `Pacote Adicional: ${quantity}x ${type === 'messages' ? 'Envios' : 'Contatos'}`,
                amount, type: 'addon_seat', status: 'completed', paymentMethod: method as any
            });
            saveTransactions(trans);
            resolve();
        }, 1500);
    });
};
