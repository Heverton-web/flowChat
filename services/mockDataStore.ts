
import { AgentPlan, Campaign, Contact, Instance, Transaction } from '../types';

// Chaves do LocalStorage
const KEYS = {
    INSTANCES: 'mock_instances',
    CONTACTS: 'mock_contacts',
    CAMPAIGNS: 'mock_campaigns',
    AGENTS: 'mock_agents',
    TRANSACTIONS: 'mock_transactions',
    WEBHOOKS: 'mock_webhooks' // Nova chave para webhooks
};

export interface WebhookConfig {
    event: string;
    url: string;
    active: boolean;
}

// Dados Iniciais (Seeds) para o cliente ver o sistema "vivo"
const SEED_CONTACTS: Contact[] = [
    { id: 'c1', name: 'Roberto Almeida', phone: '5511999991111', email: 'roberto@email.com', tags: ['Lead Quente', 'Vip'], notes: 'Interessado no plano anual', createdAt: new Date().toISOString(), ownerId: 'manager-1', campaignHistory: [] },
    { id: 'c2', name: 'Fernanda Costa', phone: '5511999992222', email: 'fernanda@site.com', tags: ['Novo'], createdAt: new Date().toISOString(), ownerId: 'agent-1', campaignHistory: [] },
    { id: 'c3', name: 'Marcos Silva', phone: '5521988887777', tags: ['Boleto Pendente'], createdAt: new Date().toISOString(), ownerId: 'manager-1', campaignHistory: [] },
    { id: 'c4', name: 'Loja Exemplo LTDA', phone: '5531977776666', email: 'contato@loja.com.br', tags: ['Parceiro'], createdAt: new Date().toISOString(), ownerId: 'agent-1', campaignHistory: [] },
];

const SEED_INSTANCES: Instance[] = [
    { id: 'inst_1', name: 'Suporte Principal', status: 'connected', phone: '5511988880000', lastUpdate: new Date().toISOString(), messagesUsed: 1250, messagesLimit: 0, ownerId: 'manager-1', ownerName: 'Gestor Mock', battery: 85 },
    { id: 'inst_2', name: 'Vendas Roberto', status: 'disconnected', lastUpdate: new Date().toISOString(), messagesUsed: 400, messagesLimit: 0, ownerId: 'agent-1', ownerName: 'Agente Mock' }
];

const SEED_CAMPAIGNS: Campaign[] = [
    { id: 'camp_1', name: 'Black Friday Antecipada', scheduledDate: new Date().toISOString(), objective: 'sales', status: 'completed', agentName: 'Gestor Mock', ownerId: 'manager-1', totalContacts: 150, deliveryRate: 98.5, executedAt: new Date().toISOString(), workflow: [], minDelay: 30, maxDelay: 120 },
    { id: 'camp_2', name: 'Aviso de Manutenção', scheduledDate: new Date(Date.now() + 86400000).toISOString(), objective: 'communication', status: 'scheduled', agentName: 'Gestor Mock', ownerId: 'manager-1', totalContacts: 45, workflow: [], minDelay: 20, maxDelay: 60 }
];

const SEED_TRANSACTIONS: Transaction[] = [
    { id: 'tx_1', userId: 'manager-1', userName: 'Gestor Mock', date: new Date().toISOString(), description: 'Renovação Plano Enterprise', amount: 997.00, type: 'subscription', status: 'completed', paymentMethod: 'credit_card' },
    { id: 'tx_2', userId: 'manager-1', userName: 'Gestor Mock', date: new Date(Date.now() - 86400000 * 30).toISOString(), description: 'Pack 5.000 Mensagens', amount: 49.90, type: 'addon_seat', status: 'completed', paymentMethod: 'pix' }
];

const SEED_WEBHOOKS: WebhookConfig[] = [
    { event: 'user.created', url: 'https://n8n.webhook.com/user-created', active: true },
    { event: 'instance.disconnected', url: '', active: false },
    { event: 'campaign.completed', url: '', active: false }
];

// --- HELPER FUNCTIONS ---

const get = <T>(key: string, seed: T[]): T[] => {
    const stored = localStorage.getItem(key);
    if (!stored) {
        localStorage.setItem(key, JSON.stringify(seed));
        return seed;
    }
    return JSON.parse(stored);
};

const set = <T>(key: string, data: T[]) => {
    localStorage.setItem(key, JSON.stringify(data));
};

// --- EXPORTED METHODS ---

export const mockStore = {
    // Flag de Controle
    isMockMode: () => localStorage.getItem('flowchat_mock_mode') === 'true',
    setMockMode: (active: boolean) => {
        if(active) localStorage.setItem('flowchat_mock_mode', 'true');
        else {
            localStorage.removeItem('flowchat_mock_mode');
            // Limpar dados mock ao sair? Opcional. Vamos manter para persistencia de sessão.
        }
    },

    // Contacts
    getContacts: (userId: string, role: string) => {
        let all = get(KEYS.CONTACTS, SEED_CONTACTS);
        if (role === 'manager' || role === 'super_admin') return all;
        return all.filter(c => c.ownerId === userId);
    },
    saveContact: (contact: any) => {
        const all = get(KEYS.CONTACTS, SEED_CONTACTS);
        const newContact = { ...contact, id: `mock_c_${Date.now()}`, createdAt: new Date().toISOString() };
        all.unshift(newContact);
        set(KEYS.CONTACTS, all);
        return newContact;
    },
    updateContact: (id: string, updates: any) => {
        const all = get(KEYS.CONTACTS, SEED_CONTACTS);
        const index = all.findIndex(c => c.id === id);
        if (index >= 0) {
            all[index] = { ...all[index], ...updates };
            set(KEYS.CONTACTS, all);
            return all[index];
        }
        throw new Error('Contact not found in mock store');
    },
    deleteContact: (id: string) => {
        const all = get(KEYS.CONTACTS, SEED_CONTACTS);
        set(KEYS.CONTACTS, all.filter(c => c.id !== id));
    },

    // Instances
    getInstances: (userId: string, role: string) => {
        let all = get(KEYS.INSTANCES, SEED_INSTANCES);
        if (role === 'manager' || role === 'super_admin') return all;
        return all.filter(i => i.ownerId === userId);
    },
    createInstance: (name: string, ownerId: string, ownerName: string) => {
        const all = get(KEYS.INSTANCES, SEED_INSTANCES);
        const newInstance: Instance = {
            id: `mock_inst_${Date.now()}`,
            name,
            status: 'connecting',
            lastUpdate: new Date().toISOString(),
            messagesUsed: 0,
            messagesLimit: 0,
            ownerId,
            ownerName
        };
        all.push(newInstance);
        set(KEYS.INSTANCES, all);
        return newInstance;
    },
    deleteInstance: (id: string) => {
        const all = get(KEYS.INSTANCES, SEED_INSTANCES);
        set(KEYS.INSTANCES, all.filter(i => i.id !== id));
    },
    connectInstance: (id: string) => {
        const all = get(KEYS.INSTANCES, SEED_INSTANCES);
        const index = all.findIndex(i => i.id === id);
        if (index >= 0) {
            all[index].status = 'connected';
            all[index].phone = '5511999998888';
            all[index].battery = 100;
            set(KEYS.INSTANCES, all);
        }
    },

    // Campaigns
    getCampaigns: (userId: string, role: string) => {
        let all = get(KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
        if (role === 'manager' || role === 'super_admin') return all;
        return all.filter(c => c.ownerId === userId);
    },
    createCampaign: (data: any) => {
        const all = get(KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
        const newCamp = { ...data, id: `mock_camp_${Date.now()}`, status: 'processing', deliveryRate: 0 };
        all.unshift(newCamp);
        set(KEYS.CAMPAIGNS, all);
        return newCamp;
    },

    // Transactions
    getTransactions: (userId: string) => {
        return get(KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
    },

    // Agents
    getAgents: () => {
        // Retorna sempre a lista estática simulada + os criados
        return [
            { id: 'manager-1', name: 'Gestor Mock', email: 'admin@flowchat.com', role: 'manager', status: 'active', messagesUsed: 1200, permissions: { canCreate: true, canEdit: true, canDelete: true, canCreateTags: true, canEditTags: true, canDeleteTags: true } },
            { id: 'agent-1', name: 'Agente Mock', email: 'agent@flowchat.com', role: 'agent', status: 'active', messagesUsed: 450, permissions: { canCreate: true, canEdit: true, canDelete: false, canCreateTags: false, canEditTags: false, canDeleteTags: false } },
            { id: 'dev-1', name: 'Dev Mock', email: 'dev@flowchat.com', role: 'developer', status: 'active', messagesUsed: 0, permissions: { canCreate: true, canEdit: true, canDelete: true, canCreateTags: true, canEditTags: true, canDeleteTags: true } }
        ];
    },

    // Webhooks
    getWebhooks: () => {
        return get(KEYS.WEBHOOKS, SEED_WEBHOOKS);
    },
    saveWebhook: (event: string, url: string, active: boolean) => {
        const all = get(KEYS.WEBHOOKS, SEED_WEBHOOKS);
        const index = all.findIndex(w => w.event === event);
        if (index >= 0) {
            all[index] = { event, url, active };
        } else {
            all.push({ event, url, active });
        }
        set(KEYS.WEBHOOKS, all);
    }
};
