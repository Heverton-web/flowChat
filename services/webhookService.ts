
import { mockStore, WebhookConfig } from './mockDataStore';
import { getSystemConfig, hasValidEvolutionConfig } from './configService';

// Helper para obter URL baseada no evento
const getWebhookUrlForEvent = (event: string): string => {
    const config = getSystemConfig();
    switch (event) {
        case 'user.created': return config.webhook_user_signup;
        case 'payment.success': return config.webhook_payment_success;
        case 'instance.disconnected': return config.webhook_instance_error;
        case 'ticket.created': return config.webhook_ticket_created;
        default: return '';
    }
};

export const getWebhooks = async (): Promise<WebhookConfig[]> => {
    if (mockStore.isMockMode()) {
        return mockStore.getWebhooks();
    }
    await new Promise(r => setTimeout(r, 300));
    return mockStore.getWebhooks();
};

export const saveWebhook = async (event: string, url: string, active: boolean): Promise<void> => {
    // Legacy support for mock store ui
    if (mockStore.isMockMode()) {
        mockStore.saveWebhook(event, url, active);
        return;
    }
    // In real mode, we use configService mainly, but keeping this for legacy components
    mockStore.saveWebhook(event, url, active); 
};

export const triggerTestWebhook = async (event: string, directUrl?: string): Promise<{ success: boolean; status: number; message: string }> => {
    const targetUrl = directUrl || getWebhookUrlForEvent(event);

    if (!targetUrl) {
        return { success: false, status: 400, message: 'URL não configurada no Master Console.' };
    }

    if (!targetUrl.startsWith('http')) {
        return { success: false, status: 400, message: 'URL inválida. Deve começar com http:// ou https://' };
    }

    // Payloads Reais para Teste
    const payloads: Record<string, any> = {
        'user.created': {
            event: 'user.created',
            timestamp: new Date().toISOString(),
            data: {
                id: 'usr_test_123',
                name: 'Usuário de Teste',
                email: 'test@flowchat.com',
                role: 'manager',
                plan: 'TRIAL'
            }
        },
        'payment.success': {
            event: 'payment.success',
            timestamp: new Date().toISOString(),
            data: {
                transaction_id: 'tx_stripe_999',
                amount: 29700, // cents
                currency: 'brl',
                customer_email: 'cliente@loja.com'
            }
        },
        'instance.disconnected': {
            event: 'instance.disconnected',
            timestamp: new Date().toISOString(),
            data: {
                instance_id: 'inst_evo_001',
                name: 'Suporte Principal',
                reason: 'phone_disconnected'
            }
        },
        'ticket.created': {
            event: 'ticket.created',
            timestamp: new Date().toISOString(),
            data: {
                ticket_id: 'tkt_888',
                contact_phone: '5511999998888',
                initial_message: 'Olá, gostaria de um orçamento.'
            }
        }
    };

    const payload = payloads[event] || { event, timestamp: new Date().toISOString(), message: "Test Payload from Master Console" };

    try {
        console.log(`[Webhook] Sending to ${targetUrl}`, payload);
        
        // Tenta envio real
        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            mode: 'no-cors' // Permite envio para n8n/webhooks sem checagem estrita de CORS no browser
        });
        
        // Com no-cors, response.ok é sempre false e status é 0. Assumimos sucesso se não lançar erro de rede.
        return { success: true, status: 200, message: 'Evento enviado (Opaque Mode)' };
    } catch (e: any) {
        console.error("Webhook Error:", e);
        return { success: false, status: 500, message: e.message || 'Erro de rede ao conectar no N8N' };
    }
};
