
import { AgentPlan, Campaign, Contact, Instance, Transaction, Conversation, Message, WebhookConfig, Tag } from '../types';

// Chaves do LocalStorage
const KEYS = {
    INSTANCES: 'mock_instances',
    CONTACTS: 'mock_contacts',
    CAMPAIGNS: 'mock_campaigns',
    AGENTS: 'mock_agents',
    TRANSACTIONS: 'mock_transactions',
    WEBHOOKS: 'mock_webhooks',
    CONVERSATIONS: 'mock_conversations',
    MESSAGES: 'mock_messages',
    TAGS: 'mock_tags_v3' // Changed key to force migration
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

const SEED_TAGS: Tag[] = [
    { id: 't1', name: 'Lead', ownerId: 'GLOBAL' },
    { id: 't2', name: 'Vip', ownerId: 'GLOBAL' },
    { id: 't3', name: 'Novo', ownerId: 'GLOBAL' },
    { id: 't4', name: 'Boleto', ownerId: 'GLOBAL' },
    { id: 't5', name: 'Suporte', ownerId: 'GLOBAL' },
    { id: 't6', name: 'Frio', ownerId: 'GLOBAL' },
    { id: 't7', name: 'Lead Quente', ownerId: 'GLOBAL' },
    { id: 't8', name: 'Parceiro', ownerId: 'GLOBAL' },
    { id: 't9', name: 'Boleto Pendente', ownerId: 'GLOBAL' },
    { id: 't10', name: 'Retorno Agendado', ownerId: 'agent-1' } // Exemplo de tag privada
];

// --- SEED CHAT DATA ---
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
    isMockMode: () => {
        const stored = localStorage.getItem('flowchat_mock_mode');
        return stored === 'true';
    },
    setMockMode: (enabled: boolean) => {
        localStorage.setItem('flowchat_mock_mode', enabled ? 'true' : 'false');
    },

    // --- Instances ---
    getInstances: (userId: string, role: string): Instance[] => {
        const all = get<Instance>(KEYS.INSTANCES, SEED_INSTANCES);
        if (role === 'manager' || role === 'super_admin') return all;
        return all.filter(i => i.ownerId === userId);
    },
    createInstance: (name: string, ownerId: string, ownerName: string): Instance => {
        const all = get<Instance>(KEYS.INSTANCES, SEED_INSTANCES);
        const newInstance: Instance = {
            id: `inst_${Date.now()}`,
            name,
            status: 'connecting',
            lastUpdate: new Date().toISOString(),
            messagesUsed: 0,
            messagesLimit: 0,
            ownerId,
            ownerName
        };
        set(KEYS.INSTANCES, [...all, newInstance]);
        return newInstance;
    },
    deleteInstance: (id: string) => {
        const all = get<Instance>(KEYS.INSTANCES, SEED_INSTANCES);
        set(KEYS.INSTANCES, all.filter(i => i.id !== id));
    },
    connectInstance: (id: string) => {
        const all = get<Instance>(KEYS.INSTANCES, SEED_INSTANCES);
        const updated = all.map(i => i.id === id ? { ...i, status: 'connected', phone: '5511999999999' } : i);
        set(KEYS.INSTANCES, updated as Instance[]);
    },

    // --- Contacts ---
    getContacts: (userId: string, role: string): Contact[] => {
        const all = get<Contact>(KEYS.CONTACTS, SEED_CONTACTS);
        if (role === 'manager' || role === 'super_admin') return all;
        return all.filter(c => c.ownerId === userId);
    },
    saveContact: (contact: Partial<Contact>): Contact => {
        const all = get<Contact>(KEYS.CONTACTS, SEED_CONTACTS);
        const newContact = { 
            ...contact, 
            id: contact.id || `c_${Date.now()}`, 
            createdAt: contact.createdAt || new Date().toISOString(),
            campaignHistory: contact.campaignHistory || [],
            tags: contact.tags || []
        } as Contact;
        set(KEYS.CONTACTS, [...all, newContact]);
        return newContact;
    },
    updateContact: (id: string, updates: Partial<Contact>): Contact => {
        const all = get<Contact>(KEYS.CONTACTS, SEED_CONTACTS);
        const index = all.findIndex(c => c.id === id);
        if (index === -1) throw new Error('Contact not found');
        const updated = { ...all[index], ...updates };
        all[index] = updated;
        set(KEYS.CONTACTS, all);
        return updated;
    },
    deleteContact: (id: string) => {
        const all = get<Contact>(KEYS.CONTACTS, SEED_CONTACTS);
        set(KEYS.CONTACTS, all.filter(c => c.id !== id));
    },

    // --- Tags (Com suporte a OwnerId) ---
    getTags: (userId: string, role: string): Tag[] => {
        const all = get<Tag>(KEYS.TAGS, SEED_TAGS);
        // Retorna tags globais + tags privadas do usuário
        return all.filter(t => t.ownerId === 'GLOBAL' || t.ownerId === userId);
    },
    addTag: (tagName: string, ownerId: string) => {
        const all = get<Tag>(KEYS.TAGS, SEED_TAGS);
        if (all.some(t => t.name.toLowerCase() === tagName.toLowerCase() && (t.ownerId === 'GLOBAL' || t.ownerId === ownerId))) {
            return; // Evita duplicatas no mesmo escopo
        }
        const newTag: Tag = {
            id: `tag_${Date.now()}`,
            name: tagName,
            ownerId: ownerId
        };
        set(KEYS.TAGS, [...all, newTag]);
    },
    updateTag: (id: string, newName: string) => {
        const all = get<Tag>(KEYS.TAGS, SEED_TAGS);
        const index = all.findIndex(t => t.id === id);
        if (index !== -1) {
            const oldName = all[index].name;
            all[index].name = newName;
            set(KEYS.TAGS, all);
            
            // Cascata para atualizar contatos que usam a tag antiga (Nome)
            const contacts = get<Contact>(KEYS.CONTACTS, SEED_CONTACTS);
            const updatedContacts = contacts.map(c => ({
                ...c,
                tags: c.tags.map(t => t === oldName ? newName : t)
            }));
            set(KEYS.CONTACTS, updatedContacts);
        }
    },
    deleteTag: (id: string) => {
        const all = get<Tag>(KEYS.TAGS, SEED_TAGS);
        const tag = all.find(t => t.id === id);
        if (!tag) return;

        set(KEYS.TAGS, all.filter(t => t.id !== id));
        
        // Cascata para remover tag dos contatos
        const contacts = get<Contact>(KEYS.CONTACTS, SEED_CONTACTS);
        const updatedContacts = contacts.map(c => ({
            ...c,
            tags: c.tags.filter(t => t !== tag.name)
        }));
        set(KEYS.CONTACTS, updatedContacts);
    },

    // --- Agents ---
    getAgents: (): AgentPlan[] => {
        const mockAgents: AgentPlan[] = [
            { id: 'manager-1', name: 'Gestor Mock', email: 'admin@disparai.com.br', status: 'active', messagesUsed: 1500, permissions: { canCreate: true, canEdit: true, canDelete: true, canCreateTags: true, canEditTags: true, canDeleteTags: true }, role: 'manager' },
            { id: 'agent-1', name: 'Agente Mock', email: 'agent@disparai.com.br', status: 'active', messagesUsed: 450, permissions: { canCreate: true, canEdit: true, canDelete: false, canCreateTags: true, canEditTags: false, canDeleteTags: false }, role: 'agent' }
        ];
        return mockAgents;
    },

    // --- Campaigns ---
    getCampaigns: (userId: string, role: string): Campaign[] => {
        const all = get<Campaign>(KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
        if (role === 'manager' || role === 'super_admin') return all;
        return all.filter(c => c.ownerId === userId);
    },
    createCampaign: (campaign: any): Campaign => {
        const all = get<Campaign>(KEYS.CAMPAIGNS, SEED_CAMPAIGNS);
        const newCamp = { ...campaign, id: `camp_${Date.now()}` };
        set(KEYS.CAMPAIGNS, [...all, newCamp]);
        return newCamp;
    },

    // --- Transactions ---
    getTransactions: (userId: string): Transaction[] => {
        const all = get<Transaction>(KEYS.TRANSACTIONS, SEED_TRANSACTIONS);
        return all.filter(t => t.userId === userId);
    },

    // --- Webhooks ---
    getWebhooks: (): WebhookConfig[] => {
        return get<WebhookConfig>(KEYS.WEBHOOKS, SEED_WEBHOOKS);
    },
    saveWebhook: (event: string, url: string, active: boolean) => {
        const all = get<WebhookConfig>(KEYS.WEBHOOKS, SEED_WEBHOOKS);
        const index = all.findIndex(w => w.event === event);
        if (index >= 0) {
            all[index] = { event, url, active };
        } else {
            all.push({ event, url, active });
        }
        set(KEYS.WEBHOOKS, all);
    },

    // --- Chat / Inbox ---
    getConversations: (userId: string, role: string): Conversation[] => {
        const all = get<Conversation>(KEYS.CONVERSATIONS, SEED_CONVERSATIONS);
        if (role === 'manager' || role === 'super_admin') return all;
        return all.filter(c => c.assignedTo === userId || !c.assignedTo);
    },
    getMessages: (conversationId: string): Message[] => {
        const all = get<Message>(KEYS.MESSAGES, SEED_MESSAGES);
        return all.filter(m => m.conversationId === conversationId).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    },
    sendMessage: (message: Message): Message => {
        const all = get<Message>(KEYS.MESSAGES, SEED_MESSAGES);
        set(KEYS.MESSAGES, [...all, message]);
        return message;
    },
    updateConversation: (id: string, updates: Partial<Conversation>) => {
        const all = get<Conversation>(KEYS.CONVERSATIONS, SEED_CONVERSATIONS);
        const idx = all.findIndex(c => c.id === id);
        if (idx >= 0) {
            all[idx] = { ...all[idx], ...updates };
            set(KEYS.CONVERSATIONS, all);
        }
    }
};
