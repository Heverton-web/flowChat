
// Gerenciador Central de Configurações do Sistema
// Fonte da verdade para Infraestrutura, Webhooks e Feature Flags

const VAULT_KEY = 'flowchat_vault';

export interface BrandingConfig {
    appName: string;
    primaryColor: string; // Hex Code (ex: #3b82f6)
    logoUrlLight: string; // URL para fundo claro
    logoUrlDark: string;  // URL para fundo escuro
    faviconUrl: string;
    loginTitle: string;
    loginMessage: string;
    landingPageHeadline: string;
    landingPageSubheadline: string;
    showSalesPage: boolean;
}

export interface SystemConfig {
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
}

const DEFAULT_BRANDING: BrandingConfig = {
    appName: 'Disparai',
    primaryColor: '#3b82f6', // Default Blue
    logoUrlLight: '',
    logoUrlDark: '',
    faviconUrl: '',
    loginTitle: 'Acessar Sistema',
    loginMessage: 'Entre com suas credenciais corporativas.',
    landingPageHeadline: 'Escalone seu atendimento no WhatsApp hoje.',
    landingPageSubheadline: 'Centralize sua equipe, automatize conversas e tenha controle total da sua operação.',
    showSalesPage: true
};

const DEFAULT_CONFIG: SystemConfig = {
    evolution_url: '',
    evolution_key: '',
    evolution_global_webhook_url: '',
    
    supabase_url: '',
    supabase_key: '',
    
    stripe_sk: '',
    stripe_pk: '',
    stripe_webhook_secret: '',

    webhook_user_signup: '',
    webhook_payment_success: '',
    webhook_instance_error: '',
    webhook_ticket_created: '',

    system_maintenance_mode: false,
    allow_new_registrations: true,
    enable_free_trial: true,

    branding: DEFAULT_BRANDING
};

export const getSystemConfig = (): SystemConfig => {
    try {
        const stored = localStorage.getItem(VAULT_KEY);
        if (!stored) return DEFAULT_CONFIG;
        
        const parsed = JSON.parse(stored);
        // Deep merge para garantir que chaves novas (como branding) existam mesmo em configs antigas
        return {
            ...DEFAULT_CONFIG,
            ...parsed,
            branding: { ...DEFAULT_CONFIG.branding, ...(parsed.branding || {}) }
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
