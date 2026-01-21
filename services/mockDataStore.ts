
import { AgentPlan, Campaign, Contact, Instance, Transaction, Conversation, Message, WebhookConfig } from '../types';

// Chaves do LocalStorage
const KEYS = {
    INSTANCES: 'mock_instances',
    CONTACTS: 'mock_contacts',
    CAMPAIGNS: 'mock_campaigns',
    AGENTS: 'mock_agents',
    TRANSACTIONS: 'mock_transactions',
    WEBHOOKS: 'mock_webhooks',
    CONVERSATIONS: 'mock_conversations',
    MESSAGES: 'mock_messages'
};

export type { WebhookConfig };

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

// --- SEED CHAT DATA (NEW) ---
const SEED_CONVERSATIONS: Conversation[] = [
    { 
        id: 'conv_1', contactId: 'c1', contactName: 'Roberto Almeida', contactPhone: '5511999991111', 
        lastMessage: 'Gostaria de saber mais sobre a API.', lastMessageAt: new Date().toISOString(), 
        unreadCount: 1, status: 'open', channel: 'whatsapp', tags: ['Lead Quente'], assignedTo: 'agent-1'
    },
    { 
        id: 'conv_2', contactId: 'c2', contactName: 'Fernanda Costa', contactPhone: '5511999992222', 
        lastMessage: 'Obrigada pelo atendimento!', lastMessageAt: new Date(Date.now() - 3600000).toISOString(), 
        unreadCount: 0, status: 'resolved', channel: 'whatsapp', tags: ['Novo'], assignedTo: 'manager-1'
    },
    { 
        id: 'conv_3', contactId: 'c3', contactName: 'Marcos Silva', contactPhone: '5521988887777', 
        lastMessage: 'Meu boleto venceu, pode enviar outro?', lastMessageAt: new Date(Date.now() - 7200000).toISOString(), 
        unreadCount: 2, status: 'open', channel: 'whatsapp', tags: ['Boleto Pendente'] // Unassigned
    }
];

const SEED_MESSAGES: Message[] = [
    { id: 'm1', conversationId: 'conv_1', content: 'Olá, bom dia!', sender: 'contact', type: 'text', isPrivate: false, createdAt: new Date(Date.now() - 8000000).toISOString(), status: 'read' },
    { id: 'm2', conversationId: 'conv_1', content: 'Olá Roberto, como posso ajudar?', sender: 'agent', senderName: 'Agente Mock', type: 'text', isPrivate: false, createdAt: new Date(Date.now() - 7900000).toISOString(), status: 'read' },
    { id: 'm3', conversationId: 'conv_1', content: 'Gostaria de saber mais sobre a API.', sender: 'contact', type: 'text', isPrivate: false, createdAt: new Date().toISOString(), status: 'delivered' },
    
    { id: 'm4', conversationId: 'conv_3', content: 'Oi, preciso de ajuda com financeiro.', sender: 'contact', type: 'text', isPrivate: false, createdAt: new Date(Date.now() - 7300000).toISOString(), status: 'read' },
    { id: 'm5', conversationId: 'conv_3', content: 'Meu boleto venceu, pode enviar outro?', sender: 'contact', type: 'text', isPrivate: false, createdAt: new Date(Date.now() - 7200000).toISOString(), status: 'delivered' },
    { id: 'm6', conversationId: 'conv_3', content: 'Cliente solicitou boleto vencido. Verificar no sistema.', sender: 'agent', senderName: 'System', type: 'text', isPrivate: true, createdAt: new Date().toISOString(), status: 'read' }, // Private Note
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
    },

    // --- CHAT METHODS ---
    getConversations: (userId: string, role: string) => {
        let all = get(KEYS.CONVERSATIONS, SEED_CONVERSATIONS);
        // Filter logic could be expanded based on role (e.g., agents only see assigned)
        return all;
    },
    
    updateConversation: (id: string, updates: Partial<Conversation>) => {
        const all = get(KEYS.CONVERSATIONS, SEED_CONVERSATIONS);
        const index = all.findIndex(c => c.id === id);
        if (index >= 0) {
            all[index] = { ...all[index], ...updates };
            set(KEYS.CONVERSATIONS, all);
            return all[index];
        }
        throw new Error('Conversation not found');
    },

    getMessages: (conversationId: string) => {
        const all = get(KEYS.MESSAGES, SEED_MESSAGES);
        return all.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },

    sendMessage: (msg: Message) => {
        const all = get(KEYS.MESSAGES, SEED_MESSAGES);
        all.push(msg);
        set(KEYS.MESSAGES, all);
        
        // Update conversation last message
        const convs = get(KEYS.CONVERSATIONS, SEED_CONVERSATIONS);
        const convIdx = convs.findIndex(c => c.id === msg.conversationId);
        if (convIdx >= 0) {
            convs[convIdx].lastMessage = msg.content;
            convs[convIdx].lastMessageAt = msg.createdAt;
            if (msg.sender === 'contact') {
                convs[convIdx].unreadCount += 1;
                convs[convIdx].status = 'open'; // Reopen if new message
            }
            set(KEYS.CONVERSATIONS, convs);
        }
        return msg;
    }
};
