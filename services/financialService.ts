
import { Transaction, LicenseStatus, LicenseTier } from '../types';
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
        baseLimits: {
            maxUsers: 30,
            maxInstances: 30,
            maxMessagesPerMonth: 100000,
            maxContacts: 50000
        },
        addonSeats: 0,
        addonMessagePacks: 15,
        addonContactPacks: 10,
        features: {
            canUseApi: true,
            whiteLabel: true,
            prioritySupport: true
        }
    },
    usage: {
        usedUsers: 20, // Cenário do cliente real
        usedInstances: 20, // Paridade 1:1
        usedMessagesThisMonth: 12450,
        usedContacts: 4500
    },
    get totalLimits() {
        return {
            maxUsers: this.license.baseLimits.maxUsers + this.license.addonSeats,
            maxInstances: this.license.baseLimits.maxInstances + this.license.addonSeats,
            maxMessagesPerMonth: this.license.baseLimits.maxMessagesPerMonth, // Lógica simplificada
            maxContacts: this.license.baseLimits.maxContacts
        };
    }
};

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

// Obtém o status atual da licença corporativa
export const getLicenseStatus = async (): Promise<LicenseStatus> => {
    return new Promise((resolve) => {
        // Atualiza o uso real baseado nos serviços simulados
        // (Em um app real, isso viria do backend)
        setTimeout(async () => {
            // Sincroniza contagem de usuários
            const agents = await teamService.getAgents();
            // Contamos agents + 1 manager
            MOCK_LICENSE_STATUS.usage.usedUsers = agents.length + 1; 
            
            // Instâncias vamos assumir sincronizadas pelo mock do evolutionService ou manter estático por enquanto
            // MOCK_LICENSE_STATUS.usage.usedInstances = ... (seria fetchInstances().length)

            resolve(MOCK_LICENSE_STATUS);
        }, 500);
    });
};

// Stub para upgrade de plano
export const requestLicenseUpgrade = async (newTier: LicenseTier): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            MOCK_LICENSE_STATUS.license.tier = newTier;
            // Ajustaria limites baseados no tier...
            console.log(`Upgrade solicitado para ${newTier}`);
            resolve();
        }, 1500);
    });
};

// Stub para contratar Seat adicional
export const requestAddonSeat = async (quantity: number): Promise<void> => {
    return new Promise((resolve) => {
        setTimeout(() => {
            MOCK_LICENSE_STATUS.license.addonSeats += quantity;
            
            // Registra transação
            MOCK_TRANSACTIONS.unshift({
                id: Math.random().toString(36).substr(2, 9),
                userId: 'manager-1',
                userName: 'Gestor Admin',
                date: new Date().toISOString(),
                description: `Add-on: +${quantity} Seat(s) (Usuário + Instância)`,
                amount: quantity * 150.00, // Preço fictício
                type: 'addon_seat',
                status: 'completed',
                paymentMethod: 'invoice'
            });

            resolve();
        }, 1500);
    });
};

// Mantido para compatibilidade, mas agora afeta o LicenseStatus global
export const purchaseExtraPack = async (
    userId: string, 
    userName: string, 
    quantity: number, 
    paymentMethod: 'pix' | 'credit_card',
    packType: 'messages' | 'contacts'
): Promise<Transaction> => {
    return new Promise(async (resolve) => {
        await new Promise(r => setTimeout(r, 2000));

        const unitPrice = packType === 'messages' ? 9.90 : 7.99;
        const unitLabel = packType === 'messages' ? 'msgs' : 'contatos';
        const unitSize = packType === 'messages' ? 1000 : 500;
        const amount = quantity * unitPrice;

        const newTransaction: Transaction = {
            id: Math.random().toString(36).substr(2, 9),
            userId,
            userName,
            date: new Date().toISOString(),
            description: `Add-on: Pacote Avulso (${quantity * unitSize} ${unitLabel})`,
            amount,
            type: 'extra_pack',
            status: 'completed',
            paymentMethod,
            invoiceUrl: '#'
        };

        MOCK_TRANSACTIONS.unshift(newTransaction);

        // Atualiza a licença global
        if (packType === 'messages') {
            MOCK_LICENSE_STATUS.license.addonMessagePacks += quantity;
        } else {
            MOCK_LICENSE_STATUS.license.addonContactPacks += quantity;
        }

        // Também atualiza o agente individual para manter a lógica legado funcionando
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
    // Mantido para fluxo legado de agente comprando premium individual
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
