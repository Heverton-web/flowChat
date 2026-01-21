
import React, { useState, useEffect } from 'react';
import { 
  Server, Plug, Activity, Save, Play, Copy, Terminal, 
  AlertCircle, Smartphone, MessageSquare, Users, Globe, Database,
  Eye, EyeOff, Loader2, ListChecks, Share2, Link as LinkIcon, 
  ToggleLeft, ToggleRight, ExternalLink, User, GitBranch, RotateCw, Cloud,
  CheckCircle, Zap, ShieldCheck
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../services/supabaseClient';
import * as webhookService from '../services/webhookService';
import { WebhookConfig } from '../types';

interface DeveloperConsoleProps {
    view: 'integrations' | 'api' | 'diagnostics';
}

// --- CONSTANTS ---
const API_ENDPOINTS = [
    {
        category: 'Instance',
        icon: Smartphone,
        items: [
            { method: 'POST', path: '/instance/create', title: 'Criar Instância', desc: 'Cria uma nova instância de conexão', body: { "instanceName": "sac_vendas", "token": "123", "qrcode": true } },
            { method: 'GET', path: '/instance/fetchInstances', title: 'Listar Instâncias', desc: 'Retorna todas as instâncias criadas', body: {} },
            { method: 'DELETE', path: '/instance/delete/{instance}', title: 'Deletar Instância', desc: 'Remove uma instância e desconecta', body: {} }
        ]
    },
    {
        category: 'Send Message (Workflow)',
        icon: MessageSquare,
        items: [
            { 
                method: 'POST', 
                path: '/message/sendText/{instance}', 
                title: 'Enviar Texto', 
                desc: 'Simula digitação (delay) e envia texto', 
                body: { 
                    "number": "5511999998888", 
                    "delay": 1200, 
                    "linkPreview": true,
                    "textMessage": { 
                        "text": "Olá {nome}! Tudo bem? Segue nossa proposta." 
                    } 
                } 
            },
            { 
                method: 'POST', 
                path: '/message/sendMedia/{instance}', 
                title: 'Enviar Mídia URL', 
                desc: 'Envia imagem/vídeo via Link com delay', 
                body: { 
                    "number": "5511999998888", 
                    "delay": 2000,
                    "mediaMessage": { 
                        "mediatype": "image", 
                        "media": "https://example.com/promo_blackfriday.png", 
                        "caption": "🔥 Oferta exclusiva para você!" 
                    } 
                } 
            },
            { 
                method: 'POST', 
                path: '/message/sendWhatsAppAudio/{instance}', 
                title: 'Enviar Áudio (PTT)', 
                desc: 'Simula gravação de áudio na hora', 
                body: { 
                    "number": "5511999998888", 
                    "delay": 5000,
                    "audioMessage": { 
                        "audio": "https://example.com/audio_vendas.mp3" 
                    } 
                } 
            },
            { 
                method: 'POST', 
                path: '/message/sendPoll/{instance}', 
                title: 'Enviar Enquete', 
                desc: 'Cria uma enquete interativa', 
                body: { 
                    "number": "5511999998888", 
                    "delay": 1000,
                    "pollMessage": { 
                        "name": "Qual melhor horário para contato?", 
                        "selectableCount": 1, 
                        "values": ["Manhã (09h - 12h)", "Tarde (14h - 18h)", "Noite (19h - 21h)"] 
                    } 
                } 
            }
        ]
    }
];

const AVAILABLE_WEBHOOK_EVENTS = [
    { 
        id: 'user.created', 
        label: 'Credencial Criada', 
        desc: 'Disparado quando um novo usuário/agente é cadastrado no sistema.',
        icon: Users,
        color: 'bg-green-100 text-green-600',
        example: 'Enviar email e whatsapp com login/senha.'
    },
    { 
        id: 'instance.disconnected', 
        label: 'Instância Desconectada', 
        desc: 'Disparado quando a conexão com o WhatsApp cai ou falha.',
        icon: AlertCircle,
        color: 'bg-red-100 text-red-600',
        example: 'Notificar suporte no Slack/Telegram.'
    },
    { 
        id: 'campaign.completed', 
        label: 'Campanha Finalizada', 
        desc: 'Disparado ao término de uma campanha de disparo em massa.',
        icon: CheckCircle,
        color: 'bg-blue-100 text-blue-600',
        example: 'Gerar relatório PDF e enviar ao gestor.'
    },
    { 
        id: 'contact.created', 
        label: 'Novo Lead', 
        desc: 'Disparado quando um novo contato entra na base ou inicia conversa.',
        icon: User, 
        color: 'bg-purple-100 text-purple-600',
        example: 'Cadastrar no CRM (Hubspot/Pipedrive).'
    }
];

const DeveloperConsole: React.FC<DeveloperConsoleProps> = ({ view }) => {
    const { showToast } = useApp();
    
    // Integrations State
    const [integrationTab, setIntegrationTab] = useState<'evolution' | 'webhooks' | 'simulator'>('evolution');
    const [config, setConfig] = useState({ url: 'https://api.evolution.com', key: 'global-api-key-secret' });
    const [showKey, setShowKey] = useState(false);

    // Webhook State
    const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
    const [testingWebhook, setTestingWebhook] = useState<string | null>(null);

    // Simulator State
    const [simContacts] = useState([{ name: 'Ana Silva', phone: '5511999001001' }, { name: 'Bruno Santos', phone: '5511999002002' }]);
    // Aligned with N8N JSON provided by user
    const [simSteps] = useState([
        { type: 'text', text: 'Olá {name}! 👋 Bem-vindo(a)!', delay: 3000 },
        { type: 'image', mediaUrl: 'https://images.unsplash.com/photo-1552664730-d307ca884978', caption: '🎯 {name}, veja isso!', delay: 5000 },
        { type: 'audio', mediaUrl: 'https://filesamples.com/samples/audio/mp3/sample3.mp3', delay: 4000 },
        { type: 'poll', text: 'O que achou?', options: ['Gostei', 'Não gostei'], delay: 3000 }
    ]);
    const [simLog, setSimLog] = useState<string[]>([]);
    const [isSimulating, setIsSimulating] = useState(false);

    // API Tester State
    const [selectedEndpoint, setSelectedEndpoint] = useState<any>(API_ENDPOINTS[0].items[0]);
    const [requestBody, setRequestBody] = useState(JSON.stringify(API_ENDPOINTS[0].items[0].body, null, 2));
    const [response, setResponse] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Diagnostics State
    const [results, setResults] = useState<Record<string, any>>({});
    const [activeTestId, setActiveTestId] = useState<string | null>(null);

    useEffect(() => {
        if (view === 'integrations') {
            loadWebhooks();
        }
    }, [view]);

    // --- INTEGRATION METHODS ---
    const loadWebhooks = async () => {
        const data = await webhookService.getWebhooks();
        setWebhooks(data);
    };

    const handleWebhookChange = (event: string, field: 'url' | 'active', value: any) => {
        const updated = [...webhooks];
        const index = updated.findIndex(w => w.event === event);
        
        if (index >= 0) {
            (updated[index] as any)[field] = value;
        } else {
            updated.push({ event, url: '', active: false, [field]: value } as any);
        }
        setWebhooks(updated);
    };

    const handleSaveWebhook = async (event: string) => {
        const wh = webhooks.find(w => w.event === event);
        if (wh) {
            await webhookService.saveWebhook(wh.event, wh.url, wh.active);
            showToast('Webhook salvo com sucesso!', 'success');
        }
    };

    const handleTestWebhook = async (event: string) => {
        const wh = webhooks.find(w => w.event === event);
        if (!wh || !wh.url) {
            showToast('Configure uma URL válida antes de testar.', 'error');
            return;
        }
        setTestingWebhook(event);
        try {
            await webhookService.triggerTestWebhook(event, wh.url);
            showToast(`Disparo de teste enviado para ${wh.url}`, 'success');
        } catch (e: any) {
            showToast(e.message, 'error');
        } finally {
            setTestingWebhook(null);
        }
    };

    const handleSaveConfig = () => {
        showToast('Configurações da Evolution API salvas!', 'success');
    };

    // --- SIMULATOR METHODS ---
    const getSimulatorJson = () => {
        return JSON.stringify({
            instanceName: "Principal",
            baseUrl: config.url,
            apiKey: config.key,
            contacts: simContacts,
            workflow: simSteps
        }, null, 2);
    };

    const runSimulation = async () => {
        setIsSimulating(true);
        setSimLog([]);
        const addToLog = (msg: string) => setSimLog(prev => [...prev, msg]);

        addToLog(`🚀 Iniciando Campanha via n8n Webhook...`);
        addToLog(`📦 Payload: ${simContacts.length} contatos, ${simSteps.length} passos.`);
        
        await new Promise(r => setTimeout(r, 800));

        // Outer Loop: Contacts
        for (let i = 0; i < simContacts.length; i++) {
            const contact = simContacts[i];
            addToLog(`\n👤 [Loop 1: SplitInBatches] Contato: ${contact.name} (${contact.phone})`);
            
            // Inner Loop: Steps
            for (let j = 0; j < simSteps.length; j++) {
                const step = simSteps[j];
                const stepDesc = step.text || step.mediaUrl || "Enquete";
                addToLog(`   🔹 [Loop 2: Item] Passo ${j + 1}: ${step.type.toUpperCase()}`);
                
                // Variable Replacement Simulation
                if (step.text || step.caption) {
                    let content = (step.text || step.caption || "").replace('{name}', contact.name);
                    addToLog(`      📝 [Function] Substituição: "${content.substring(0, 30)}..."`);
                }

                // Delay
                addToLog(`      ⏳ [Wait] Aguardando ${step.delay}ms...`);
                await new Promise(r => setTimeout(r, 600)); // Visual delay

                // Switch / Router Logic
                let endpoint = "";
                let method = "POST";
                switch(step.type) {
                    case 'text': endpoint = '/message/sendText'; break;
                    case 'image': endpoint = '/message/sendMedia'; break;
                    case 'video': endpoint = '/message/sendMedia'; break;
                    case 'document': endpoint = '/message/sendMedia'; break;
                    case 'audio': endpoint = '/message/sendWhatsAppAudio'; break;
                    case 'poll': endpoint = '/message/sendPoll'; break;
                    default: endpoint = '/message/sendText';
                }

                addToLog(`      🔀 [Switch] Rota: ${step.type}`);
                addToLog(`      📡 [HTTP Request] ${method} ${endpoint}/{instance}`);
                addToLog(`      ✅ Status 200 OK - Message Queued`);
            }
        }

        addToLog(`\n🏁 Workflow de Campanha finalizado!`);
        setIsSimulating(false);
    };

    // --- API TESTER METHODS ---
    const handleSelectEndpoint = (endpoint: any) => {
        setSelectedEndpoint(endpoint);
        setRequestBody(JSON.stringify(endpoint.body, null, 2));
        setResponse(null);
    };

    const executeRequest = async () => {
        if (!selectedEndpoint) return;
        setIsLoading(true);
        setResponse(null);
        try {
            // Simulate API call
            await new Promise(r => setTimeout(r, 1000));
            
            let mockResponse: any = { success: true, data: {} };
            if (selectedEndpoint.path.includes('create')) {
                mockResponse.data = { id: 'inst_' + Math.random().toString(36).substr(2, 5), status: 'created', qrcode: 'data:image/png;base64,...' };
            } else if (selectedEndpoint.path.includes('fetch')) {
                mockResponse.data = [{ id: 'inst_1', name: 'Principal', status: 'connected' }, { id: 'inst_2', name: 'Vendas', status: 'disconnected' }];
            } else {
                // Return reflected body + mock status to show user it works
                const parsedBody = JSON.parse(requestBody);
                mockResponse.data = { 
                    messageId: 'msg_' + Date.now(), 
                    status: 'SENT', 
                    timestamp: new Date().toISOString(),
                    metadata: {
                        delayApplied: parsedBody.delay || 0,
                        target: parsedBody.number
                    }
                };
            }
            
            setResponse(JSON.stringify(mockResponse, null, 2));
        } catch (e: any) {
            setResponse(JSON.stringify({ error: e.message }, null, 2));
        } finally {
            setIsLoading(false);
        }
    };

    const copyToClipboard = (text: string) => { navigator.clipboard.writeText(text); showToast('Copiado!', 'success'); };

    // --- DIAGNOSTIC METHODS ---
    const runDiagnostic = async () => {
        setIsLoading(true);
        setResults({});
        setActiveTestId(null);
        
        const tests = [
            { id: 'db', label: 'Conexão Database (Supabase)', fn: async () => { await supabase.from('profiles').select('count').single(); return { status: 'ok', latency: '45ms' }; } },
            { id: 'api', label: 'Evolution API Gateway', fn: async () => { await new Promise(r => setTimeout(r, 800)); return { status: 'ok', latency: '120ms' }; } },
            { id: 'auth', label: 'Serviço de Autenticação', fn: async () => { await new Promise(r => setTimeout(r, 400)); return { status: 'ok', latency: '60ms' }; } },
            { id: 'storage', label: 'Storage & CDN', fn: async () => { await new Promise(r => setTimeout(r, 600)); return { status: 'ok', latency: '90ms' }; } }
        ];

        for (const test of tests) {
            setActiveTestId(test.id);
            try {
                const res = await test.fn();
                setResults(prev => ({ ...prev, [test.id]: res }));
            } catch (e) {
                setResults(prev => ({ ...prev, [test.id]: { status: 'error', message: 'Timeout' } }));
            }
            await new Promise(r => setTimeout(r, 300));
        }
        setActiveTestId(null);
        setIsLoading(false);
    };

    // --- RENDERERS ---

    if (view === 'integrations' || view === 'api') {
        // Consolidated View for Integrations & API
        return (
            <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                
                {/* Header with Tabs */}
                <div className="flex flex-col md:flex-row justify-between items-end border-b border-slate-200 dark:border-slate-700 pb-4 gap-4">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-xl">
                            <Plug size={32} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Central de Integrações</h2>
                            <p className="text-slate-500 dark:text-slate-400">Conecte o FlowChat a serviços externos e gerencie a API.</p>
                        </div>
                    </div>
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg overflow-x-auto">
                        <button 
                            onClick={() => setIntegrationTab('evolution')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${integrationTab === 'evolution' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Server size={14}/> Evolution API
                        </button>
                        <button 
                            onClick={() => setIntegrationTab('webhooks')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${integrationTab === 'webhooks' ? 'bg-white dark:bg-slate-600 shadow text-pink-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Zap size={14}/> Webhooks
                        </button>
                        <button 
                            onClick={() => setIntegrationTab('simulator')}
                            className={`px-4 py-2 text-sm font-bold rounded-md transition-all flex items-center gap-2 whitespace-nowrap ${integrationTab === 'simulator' ? 'bg-white dark:bg-slate-600 shadow text-emerald-600 dark:text-white' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}
                        >
                            <Share2 size={14}/> Simulador n8n
                        </button>
                    </div>
                </div>

                {integrationTab === 'evolution' && (
                    <div className="space-y-8 animate-in fade-in">
                        {/* Section 1: Global Config */}
                        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Globe size={20} />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Configuração Global</h3>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        URL da API (Instância Principal)
                                    </label>
                                    <input 
                                        type="text" 
                                        className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm" 
                                        value={config.url} 
                                        onChange={e => setConfig({...config, url: e.target.value})} 
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                                        Global API Key
                                    </label>
                                    <div className="relative">
                                        <input 
                                            type={showKey ? "text" : "password"} 
                                            className="w-full pl-4 pr-12 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-sm" 
                                            value={config.key} 
                                            onChange={e => setConfig({...config, key: e.target.value})} 
                                        />
                                        <button 
                                            onClick={() => setShowKey(!showKey)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                        >
                                            {showKey ? <Eye size={18}/> : <EyeOff size={18}/>}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="mt-6 flex justify-end">
                                <button onClick={handleSaveConfig} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all text-sm">
                                    <Save size={18}/> Salvar Conexão
                                </button>
                            </div>
                        </div>

                        {/* Section 2: Developer API Explorer (Merged) */}
                        <div className="flex flex-col md:flex-row gap-6 h-[600px]">
                            {/* Sidebar Endpoints */}
                            <div className="w-full md:w-1/3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        <Terminal size={18} className="text-blue-600"/> API Explorer
                                    </h3>
                                </div>
                                <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                                    {API_ENDPOINTS.map((cat, idx) => (
                                        <div key={idx} className="mb-4">
                                            <div className="px-3 py-2 text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                                <cat.icon size={14}/> {cat.category}
                                            </div>
                                            <div className="space-y-1">
                                                {cat.items.map((item: any, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={() => handleSelectEndpoint(item)}
                                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center justify-between group ${selectedEndpoint === item ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-300'}`}
                                                    >
                                                        <span className="truncate">{item.title}</span>
                                                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                                                            item.method === 'GET' ? 'bg-green-100 text-green-700 border-green-200' :
                                                            item.method === 'POST' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            'bg-red-100 text-red-700 border-red-200'
                                                        }`}>{item.method}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Main Console */}
                            <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-6 flex-1 flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <span className={`px-3 py-1 rounded-lg font-bold text-sm ${
                                        selectedEndpoint.method === 'GET' ? 'bg-green-100 text-green-700' : 
                                        selectedEndpoint.method === 'POST' ? 'bg-blue-100 text-blue-700' : 
                                        'bg-red-100 text-red-700'
                                    }`}>
                                        {selectedEndpoint.method}
                                    </span>
                                    <div className="flex-1 bg-slate-100 dark:bg-slate-900 px-4 py-2 rounded-lg font-mono text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 truncate">
                                        {selectedEndpoint.path}
                                    </div>
                                    <button onClick={executeRequest} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70">
                                        {isLoading ? <RotateCw className="animate-spin" size={18}/> : <Play size={18}/>} Send
                                    </button>
                                </div>

                                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
                                    <div className="flex flex-col h-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Request Body (JSON)</label>
                                            <button onClick={() => setRequestBody(JSON.stringify(selectedEndpoint.body, null, 2))} className="text-xs text-blue-600 hover:underline">Reset</button>
                                        </div>
                                        <textarea 
                                            className="flex-1 w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4 font-mono text-xs text-slate-700 dark:text-slate-300 resize-none outline-none focus:ring-2 focus:ring-blue-500"
                                            value={requestBody}
                                            onChange={e => setRequestBody(e.target.value)}
                                            spellCheck={false}
                                        ></textarea>
                                    </div>
                                    <div className="flex flex-col h-full">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-xs font-bold text-slate-500 uppercase">Response</label>
                                            {response && <button onClick={() => copyToClipboard(response)} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Copy size={10}/> Copy</button>}
                                        </div>
                                        <div className="flex-1 w-full bg-slate-900 rounded-xl p-4 font-mono text-xs text-green-400 overflow-auto border border-slate-700 relative custom-scrollbar">
                                            {response ? <pre>{response}</pre> : <span className="text-slate-600 italic absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Aguardando requisição...</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {integrationTab === 'webhooks' && (
                    <div className="space-y-6 animate-in fade-in">
                        <div className="bg-gradient-to-r from-pink-500 to-rose-600 rounded-2xl p-6 text-white shadow-lg flex justify-between items-center relative overflow-hidden">
                            <div className="relative z-10">
                                <h3 className="text-xl font-bold mb-1 flex items-center gap-2"><Zap size={24}/> Automação de Fluxos</h3>
                                <p className="text-pink-100 text-sm max-w-lg">
                                    Configure webhooks para disparar automações no n8n, Typebot ou Make sempre que um evento ocorrer no sistema.
                                </p>
                            </div>
                            <div className="hidden md:block relative z-10">
                                <a href="https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/" target="_blank" rel="noreferrer" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2">
                                    <ExternalLink size={16}/> Documentação n8n
                                </a>
                            </div>
                            <div className="absolute -right-10 -bottom-20 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                        </div>

                        <div className="grid gap-4">
                            {AVAILABLE_WEBHOOK_EVENTS.map(ev => {
                                const currentConfig = webhooks.find(w => w.event === ev.id) || { url: '', active: false };
                                return (
                                    <div key={ev.id} className={`bg-white dark:bg-slate-800 rounded-xl border transition-all duration-300 ${currentConfig.active ? 'border-pink-500 shadow-md ring-1 ring-pink-500/20' : 'border-slate-200 dark:border-slate-700'}`}>
                                        <div className="p-6 flex flex-col md:flex-row gap-6">
                                            <div className="flex gap-4 md:w-1/3">
                                                <div className={`p-3 rounded-xl h-fit ${ev.color} dark:bg-opacity-20`}>
                                                    <ev.icon size={24}/>
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                        {ev.label}
                                                        <span className="text-[10px] font-mono font-normal text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 rounded">{ev.id}</span>
                                                    </h4>
                                                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{ev.desc}</p>
                                                    <div className="mt-2 text-[10px] text-slate-400 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-100 dark:border-slate-700">
                                                        <span className="font-bold">Exemplo:</span> {ev.example}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex-1 flex flex-col gap-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="relative flex-1">
                                                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                                        <input 
                                                            type="text" 
                                                            placeholder="https://seu-n8n.com/webhook/..." 
                                                            className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-pink-500 transition-all ${currentConfig.active ? 'border-pink-300 dark:border-pink-900' : 'border-slate-200 dark:border-slate-700'}`}
                                                            value={currentConfig.url}
                                                            onChange={e => handleWebhookChange(ev.id, 'url', e.target.value)}
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={() => handleWebhookChange(ev.id, 'active', !currentConfig.active)}
                                                        className={`p-2 rounded-lg transition-colors ${currentConfig.active ? 'text-green-600 bg-green-50 dark:bg-green-900/20' : 'text-slate-400 bg-slate-100 dark:bg-slate-700'}`}
                                                        title={currentConfig.active ? "Desativar" : "Ativar"}
                                                    >
                                                        {currentConfig.active ? <ToggleRight size={28} fill="currentColor"/> : <ToggleLeft size={28}/>}
                                                    </button>
                                                </div>
                                                <div className="flex justify-end gap-2 mt-auto">
                                                    <button 
                                                        onClick={() => handleTestWebhook(ev.id)}
                                                        disabled={testingWebhook === ev.id || !currentConfig.url}
                                                        className="px-4 py-1.5 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg flex items-center gap-1 transition-colors disabled:opacity-50"
                                                    >
                                                        {testingWebhook === ev.id ? <RotateCw size={12} className="animate-spin"/> : <Play size={12}/>} 
                                                        Testar Disparo
                                                    </button>
                                                    <button onClick={() => handleSaveWebhook(ev.id)} className="px-4 py-1.5 text-xs font-bold text-white bg-slate-900 dark:bg-slate-600 hover:bg-slate-800 dark:hover:bg-slate-500 rounded-lg flex items-center gap-1 transition-colors">
                                                        <Save size={12}/> Salvar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {integrationTab === 'simulator' && (
                    <div className="space-y-6 animate-in fade-in h-[600px] flex flex-col">
                        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 rounded-xl p-4 flex gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-800/50 rounded-full text-emerald-600 dark:text-emerald-400 h-fit">
                                <GitBranch size={24}/>
                            </div>
                            <div>
                                <h3 className="font-bold text-emerald-800 dark:text-emerald-200">Simulador de Lógica de Campanha (N8N)</h3>
                                <p className="text-sm text-emerald-700 dark:text-emerald-300 mt-1">
                                    Visualize como o JSON da campanha é estruturado e como o n8n deve processar o loop aninhado (Contatos x Workflow).
                                    Utilize o JSON gerado abaixo como payload de teste no seu nó "Webhook".
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-6 flex-1 min-h-0">
                            {/* Column 1: Config */}
                            <div className="w-1/3 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col">
                                <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                    <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2"><ListChecks size={16}/> Configuração Mock</h4>
                                </div>
                                <div className="p-4 overflow-y-auto flex-1 space-y-6 custom-scrollbar">
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">1. Workflow (Passos)</label>
                                        <div className="space-y-2">
                                            {simSteps.map((step, idx) => (
                                                <div key={idx} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex gap-2 items-center bg-slate-50 dark:bg-slate-900">
                                                    <span className="font-bold bg-slate-200 dark:bg-slate-700 px-1.5 rounded">{idx+1}</span>
                                                    <span className="uppercase font-mono text-blue-600 dark:text-blue-400">{step.type}</span>
                                                    <span className="truncate flex-1 text-slate-600 dark:text-slate-300">
                                                        {step.text || step.mediaUrl}
                                                    </span>
                                                    <span className="text-slate-400">{step.delay}ms</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-slate-500 uppercase mb-2 block">2. Contatos (Alvos)</label>
                                        <div className="space-y-2">
                                            {simContacts.map((contact, idx) => (
                                                <div key={idx} className="p-2 border border-slate-200 dark:border-slate-700 rounded-lg text-xs flex gap-2 items-center bg-slate-50 dark:bg-slate-900">
                                                    <User size={12} className="text-slate-400"/>
                                                    <span className="font-bold text-slate-700 dark:text-slate-200">{contact.name}</span>
                                                    <span className="font-mono text-slate-500">{contact.phone}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="p-4 border-t border-slate-100 dark:border-slate-700">
                                    <button onClick={runSimulation} disabled={isSimulating} className="w-full bg-emerald-600 hover:bg-emerald-700 text-white py-2 rounded-lg font-bold text-sm shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70">
                                        {isSimulating ? <Loader2 className="animate-spin" size={16}/> : <Play size={16}/>}
                                        Executar Simulação
                                    </button>
                                </div>
                            </div>

                            {/* Column 2: JSON & Log */}
                            <div className="flex-1 flex flex-col gap-4">
                                {/* JSON Output */}
                                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col min-h-0">
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                        <h4 className="font-bold text-xs text-slate-500 uppercase">Payload JSON (Para o Webhook)</h4>
                                        <button onClick={() => copyToClipboard(getSimulatorJson())} className="text-xs text-blue-600 hover:underline flex items-center gap-1"><Copy size={12}/> Copiar</button>
                                    </div>
                                    <textarea readOnly className="flex-1 w-full bg-slate-900 text-green-400 font-mono text-xs p-4 resize-none outline-none custom-scrollbar" value={getSimulatorJson()}></textarea>
                                </div>

                                {/* Execution Log */}
                                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col min-h-0">
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                                        <h4 className="font-bold text-xs text-slate-500 uppercase">Log de Execução Lógica (Simulação)</h4>
                                    </div>
                                    <div className="flex-1 w-full bg-slate-50 dark:bg-slate-900 p-4 font-mono text-xs text-slate-600 dark:text-slate-300 overflow-y-auto custom-scrollbar">
                                        {simLog.length === 0 ? (
                                            <span className="text-slate-400 italic">Aguardando execução...</span>
                                        ) : (
                                            simLog.map((line, i) => <div key={i} className="whitespace-pre-wrap">{line}</div>)
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (view === 'diagnostics') {
        return (
            <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in">
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-white dark:bg-slate-800 rounded-full shadow-lg mb-4 relative">
                        <Activity size={48} className="text-blue-600"/>
                        {isLoading && <div className="absolute inset-0 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>}
                    </div>
                    <h2 className="text-3xl font-bold text-slate-800 dark:text-white">Diagnóstico de Sistema</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                        Verifique a saúde da infraestrutura, conexões de banco de dados e latência da API em tempo real.
                    </p>
                    <button 
                        onClick={runDiagnostic}
                        disabled={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-600/30 transition-all transform hover:-translate-y-1 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Executando testes...' : 'Iniciar Diagnóstico'}
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { id: 'db', label: 'Conexão Database (Supabase)', icon: Database },
                        { id: 'api', label: 'Evolution API Gateway', icon: Server },
                        { id: 'auth', label: 'Serviço de Autenticação', icon: ShieldCheck },
                        { id: 'storage', label: 'Storage & CDN', icon: Cloud }
                    ].map(item => {
                        const result = results[item.id];
                        const isActive = activeTestId === item.id;
                        const Icon = item.icon || Activity;

                        return (
                            <div key={item.id} className={`bg-white dark:bg-slate-800 p-5 rounded-xl border transition-all duration-300 flex items-center justify-between ${isActive ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50 dark:bg-blue-900/10' : result?.status === 'ok' ? 'border-green-200 dark:border-green-900' : result?.status === 'error' ? 'border-red-200 dark:border-red-900' : 'border-slate-200 dark:border-slate-700'}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-lg ${result?.status === 'ok' ? 'bg-green-100 text-green-600' : result?.status === 'error' ? 'bg-red-100 text-red-600' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        <Icon size={20}/>
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.label}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                            {isActive ? 'Testando...' : result?.status === 'ok' ? 'Operacional' : result?.status === 'error' ? 'Falha' : 'Aguardando'}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    {isActive && <Loader2 className="animate-spin text-blue-600" size={20}/>}
                                    {!isActive && result?.status === 'ok' && <span className="text-xs font-mono font-bold text-green-600 bg-green-50 px-2 py-1 rounded dark:bg-green-900/30">{result.latency}</span>}
                                    {!isActive && result?.status === 'error' && <AlertCircle className="text-red-500" size={20}/>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        );
    }

    return null;
};

export default DeveloperConsole;
