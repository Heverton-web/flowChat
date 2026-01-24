
// Gerenciador Central de Configurações do Sistema
// Fonte da verdade para Infraestrutura, Webhooks e Feature Flags

import { PLAN_DEFS } from '../types';

const VAULT_KEY = 'flowchat_vault';

export interface FeatureItem {
    title: string;
    description: string;
}

export interface BrandingConfig {
    appName: string;
    primaryColor: string; // Hex Code (ex: #3b82f6)
    logoUrlLight: string; // URL para fundo claro
    logoUrlDark: string;  // URL para fundo escuro
    faviconUrl: string;
    
    // Login Screen
    loginTitle: string;
    loginMessage: string;
    loginBenefits: FeatureItem[]; // Os 3 itens à esquerda do login
    loginLayout: 'split' | 'center'; // Layout da tela de login

    // Landing Page
    showSalesPage: boolean;
    landingPageHeadline: string;
    landingPageSubheadline: string;
    landingTag: string; // Ex: Enterprise Edition
    landingFeaturesTitle: string;
    landingFeaturesSubtitle: string;
    landingFeatures: FeatureItem[]; // Os 3 cards inferiores (extras)
    
    // Footer
    footerText: string;
}

export interface PlanConfig {
    name: string;
    price: number;
    seats: number;
    connections: number;
    description: string;
    features: string[];
    highlight?: boolean;
}

export interface SystemConfig {
    // --- INFRA: DOMAINS & ROUTING ---
    domains: {
        frontend: string;
        backend: string;
        webhook: string;
    };

    // --- INFRA: API ENGINE (EVOLUTION) ---
    evolution_url: string;
    evolution_key: string;
    evolution_global_webhook_url: string; // Onde a Evolution deve bater (Global)

    // --- INFRA: DATABASE (SUPABASE) ---
    supabase_url: string;
    supabase_key: string; // Service Role Key

    // --- INFRA: FINANCIAL (STRIPE) ---
    stripe_sk: string;
    stripe_pk: string;
    stripe_webhook_secret: string;
    annualDiscountPercentage: number; // NOVO: Desconto anual configurável (ex: 20)

    // --- WEBHOOKS & N8N ROUTING (Eventos do Sistema para Automação) ---
    webhook_user_signup: string;       // Disparado quando cria conta
    webhook_payment_success: string;   // Disparado quando paga
    webhook_instance_error: string;    // Disparado quando uma instância cai
    webhook_ticket_created: string;    // Disparado ao abrir ticket

    // --- SYSTEM CONTROLS (Feature Flags) ---
    system_maintenance_mode: boolean;  // Bloqueia acesso de todos exceto Owner
    allow_new_registrations: boolean;  // Permite novos cadastros
    enable_free_trial: boolean;        // Habilita teste grátis automático

    // --- WHITE LABEL ---
    branding: BrandingConfig;
    plans: {
        START: PlanConfig;
        GROWTH: PlanConfig;
        SCALE: PlanConfig;
    };
}

const DEFAULT_BRANDING: BrandingConfig = {
    appName: 'Disparai',
    primaryColor: '#3b82f6', // Default Blue
    logoUrlLight: '',
    logoUrlDark: '',
    faviconUrl: '',
    
    loginTitle: 'Acessar Sistema',
    loginMessage: 'Entre com suas credenciais corporativas.',
    loginBenefits: [
        { title: 'Ambientes Exclusivos', description: 'Admin, Gestor, Atendentes e Devs.' },
        { title: 'Configuração Individual', description: 'Instâncias isoladas por usuário.' },
        { title: 'Gestão Granular', description: 'Controle total de equipe e performance.' }
    ],
    loginLayout: 'split',

    showSalesPage: true,
    landingPageHeadline: 'Escalone seu atendimento no WhatsApp hoje.',
    landingPageSubheadline: 'Centralize sua equipe, automatize conversas e tenha controle total da sua operação.',
    landingTag: 'Enterprise Edition',
    landingFeaturesTitle: 'Flexibilidade Total',
    landingFeaturesSubtitle: 'Precisa de mais? Adicione recursos extras ao seu plano a qualquer momento dentro da plataforma.',
    landingFeatures: [
        { title: 'Conexões Extras', description: 'Adicione novos números de WhatsApp por apenas R$ 97/mês.' },
        { title: 'Usuários Extras', description: 'Expanda sua equipe ilimitadamente por R$ 47/seat.' },
        { title: 'Pacotes de Envios', description: 'Compre pacotes de mensagens em massa avulsos conforme demanda.' }
    ],

    footerText: 'Todos os direitos reservados.'
};

const DEFAULT_PLANS = {
    START: { ...PLAN_DEFS.START, highlight: false },
    GROWTH: { ...PLAN_DEFS.GROWTH, highlight: true },
    SCALE: { ...PLAN_DEFS.SCALE, highlight: false }
};

const DEFAULT_CONFIG: SystemConfig = {
    domains: {
        frontend: 'app.disparai.com.br',
        backend: 'api.disparai.com.br',
        webhook: 'webhook.disparai.com.br'
    },

    evolution_url: '',
    evolution_key: '',
    evolution_global_webhook_url: '',
    
    supabase_url: '',
    supabase_key: '',
    
    stripe_sk: '',
    stripe_pk: '',
    stripe_webhook_secret: '',
    annualDiscountPercentage: 20,

    webhook_user_signup: '',
    webhook_payment_success: '',
    webhook_instance_error: '',
    webhook_ticket_created: '',

    system_maintenance_mode: false,
    allow_new_registrations: true,
    enable_free_trial: true,

    branding: DEFAULT_BRANDING,
    plans: DEFAULT_PLANS
};

export const getSystemConfig = (): SystemConfig => {
    try {
        const stored = localStorage.getItem(VAULT_KEY);
        if (!stored) return DEFAULT_CONFIG;
        
        const parsed = JSON.parse(stored);
        
        // Deep merge para garantir compatibilidade e migração de novos campos
        return {
            ...DEFAULT_CONFIG,
            ...parsed,
            domains: { ...DEFAULT_CONFIG.domains, ...(parsed.domains || {}) },
            branding: { 
                ...DEFAULT_CONFIG.branding, 
                ...(parsed.branding || {}),
                // Garante que arrays e novos campos existam mesmo se o JSON antigo não tiver
                loginBenefits: parsed.branding?.loginBenefits || DEFAULT_BRANDING.loginBenefits,
                landingFeatures: parsed.branding?.landingFeatures || DEFAULT_BRANDING.landingFeatures,
                loginLayout: parsed.branding?.loginLayout || DEFAULT_BRANDING.loginLayout
            },
            plans: { ...DEFAULT_CONFIG.plans, ...(parsed.plans || {}) }
        };
    } catch (e) {
        return DEFAULT_CONFIG;
    }
};

export const saveSystemConfig = (config: SystemConfig) => {
    localStorage.setItem(VAULT_KEY, JSON.stringify(config));
    // Notificar a aplicação que a config mudou (para atualizar cores em tempo real)
    window.dispatchEvent(new Event('flowchat_config_updated'));
    console.log("[SystemConfig] Configurações globais atualizadas.");
};

export const hasValidEvolutionConfig = (): boolean => {
    const config = getSystemConfig();
    return !!(config.evolution_url && config.evolution_url.startsWith('http') && config.evolution_key);
};
