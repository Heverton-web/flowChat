
// Gerenciador Central de Configurações do Sistema
// Fonte da verdade para Infraestrutura, Webhooks e Feature Flags

const VAULT_KEY = 'flowchat_vault';

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
}

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
    enable_free_trial: true
};

export const getSystemConfig = (): SystemConfig => {
    try {
        const stored = localStorage.getItem(VAULT_KEY);
        // Merge stored config with default to ensure new keys exist
        return stored ? { ...DEFAULT_CONFIG, ...JSON.parse(stored) } : DEFAULT_CONFIG;
    } catch (e) {
        return DEFAULT_CONFIG;
    }
};

export const saveSystemConfig = (config: SystemConfig) => {
    localStorage.setItem(VAULT_KEY, JSON.stringify(config));
    // Em produção: Disparar chamada para API para salvar no banco seguro ou Redis
    console.log("[SystemConfig] Configurações globais atualizadas.");
};

export const hasValidEvolutionConfig = (): boolean => {
    const config = getSystemConfig();
    return !!(config.evolution_url && config.evolution_url.startsWith('http') && config.evolution_key);
};
