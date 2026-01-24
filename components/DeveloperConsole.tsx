
import React, { useState, useEffect } from 'react';
import { 
  Server, Plug, Activity, Save, Database, Lock, Eye, EyeOff, 
  Terminal, ShieldCheck, CreditCard, Radio, Globe, Key, AlertTriangle,
  CheckCircle, RefreshCw, Smartphone, Code, Cpu, Wifi, XCircle,
  Webhook, ToggleLeft, ToggleRight, Layers, PlayCircle, Settings, Palette, Image as ImageIcon, Type
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../services/supabaseClient';
import { getSystemConfig, saveSystemConfig, SystemConfig } from '../services/configService';
import * as webhookService from '../services/webhookService';

interface DeveloperConsoleProps {
    initialTab?: 'infrastructure' | 'webhooks' | 'system' | 'logs' | 'whitelabel';
}

const MasterConsole: React.FC<DeveloperConsoleProps> = ({ initialTab = 'infrastructure' }) => {
    const { showToast } = useApp();
    const [vault, setVault] = useState<SystemConfig>(getSystemConfig());
    const [activeTab, setActiveTab] = useState<'infrastructure' | 'webhooks' | 'system' | 'logs' | 'whitelabel'>(initialTab);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [statusChecks, setStatusChecks] = useState<Record<string, 'checking' | 'ok' | 'error' | null>>({});
    const [logs, setLogs] = useState<string[]>([]);

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
    }, [initialTab]);

    const addLog = (msg: string, type: 'INFO' | 'ERROR' | 'SUCCESS' | 'WARN' = 'INFO') => {
        const time = new Date().toISOString().split('T')[1].split('.')[0];
        setLogs(prev => [`[${time}] [${type}] ${msg}`, ...prev].slice(0, 100));
    };

    const toggleSecret = (key: string) => {
        setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleSave = () => {
        setIsSaving(true);
        try {
            saveSystemConfig(vault);
            addLog('Vault atualizado e criptografado localmente.', 'SUCCESS');
            showToast('Configurações do sistema aplicadas.', 'success');
        } catch (e) {
            addLog('Falha crítica ao salvar configurações.', 'ERROR');
            showToast('Erro ao salvar.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const updateVal = (key: keyof SystemConfig, value: any) => {
        setVault((prev) => ({ ...prev, [key]: value }));
    };

    const updateBranding = (key: keyof SystemConfig['branding'], value: any) => {
        setVault((prev) => ({
            ...prev,
            branding: {
                ...prev.branding,
                [key]: value
            }
        }));
    };

    // --- TESTERS ---

    const testEvolution = async () => {
        if (!vault.evolution_url) return showToast('URL não configurada', 'error');
        setStatusChecks(p => ({...p, evolution: 'checking'}));
        addLog(`Ping Evolution API: ${vault.evolution_url}`, 'INFO');
        try {
            const res = await fetch(`${vault.evolution_url}/instance/fetchInstances`, {
                headers: { 'apikey': vault.evolution_key, 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setStatusChecks(p => ({...p, evolution: 'ok'}));
                addLog('Evolution API: Online e Autenticada.', 'SUCCESS');
            } else {
                throw new Error(res.statusText);
            }
        } catch (e: any) {
            setStatusChecks(p => ({...p, evolution: 'error'}));
            addLog(`Evolution API Error: ${e.message}`, 'ERROR');
        }
    };

    const testWebhook = async (eventKey: string, url: string) => {
        if (!url) return showToast('URL do Webhook vazia', 'error');
        addLog(`Disparando evento de teste [${eventKey}] para N8N...`, 'INFO');
        const result = await webhookService.triggerTestWebhook(eventKey, url);
        if (result.success) {
            addLog(`Webhook [${eventKey}] entregue: ${result.status}`, 'SUCCESS');
            showToast('Webhook entregue com sucesso.', 'success');
        } else {
            addLog(`Falha no Webhook [${eventKey}]: ${result.message}`, 'ERROR');
            showToast('Falha na entrega do Webhook.', 'error');
        }
    };

    // --- COMPONENTS ---

    const SecretField = ({ label, objKey, placeholder }: { label: string, objKey: keyof SystemConfig, placeholder?: string }) => (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lock size={10} /> {label}
            </label>
            <div className="relative group">
                <input 
                    type={showSecrets[objKey] ? "text" : "password"} 
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 font-mono text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-700"
                    placeholder={placeholder || "sk_live_..."}
                    value={vault[objKey] as string}
                    onChange={(e) => updateVal(objKey, e.target.value)}
                />
                <button 
                    onClick={() => toggleSecret(objKey)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1"
                >
                    {showSecrets[objKey] ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
            </div>
        </div>
    );

    const WebhookRow = ({ event, label, objKey }: { event: string, label: string, objKey: keyof SystemConfig }) => (
        <div className="flex items-center gap-4 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors">
            <div className="p-2 bg-purple-500/10 text-purple-400 rounded-lg">
                <Webhook size={18} />
            </div>
            <div className="flex-1 space-y-1">
                <div className="flex justify-between">
                    <label className="text-xs font-bold text-slate-300">{label}</label>
                    <span className="text-[10px] font-mono text-slate-500">{event}</span>
                </div>
                <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-1.5 text-xs text-slate-300 font-mono outline-none focus:border-purple-500 transition-colors placeholder:text-slate-700"
                    placeholder="https://n8n.seuservidor.com/webhook/..."
                    value={vault[objKey] as string}
                    onChange={(e) => updateVal(objKey, e.target.value)}
                />
            </div>
            <button 
                onClick={() => testWebhook(event, vault[objKey] as string)}
                className="p-2 bg-slate-800 hover:bg-purple-600 hover:text-white text-slate-400 rounded-lg transition-colors" 
                title="Testar Disparo"
            >
                <PlayCircle size={18} />
            </button>
        </div>
    );

    const ToggleCard = ({ label, desc, checked, onChange, danger = false }: any) => (
        <div className={`p-4 rounded-xl border flex items-center justify-between ${checked ? (danger ? 'bg-red-900/10 border-red-800' : 'bg-green-900/10 border-green-800') : 'bg-slate-900 border-slate-800'}`}>
            <div>
                <h4 className={`text-sm font-bold ${checked ? (danger ? 'text-red-400' : 'text-green-400') : 'text-slate-400'}`}>{label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <button onClick={() => onChange(!checked)} className={`transition-colors ${checked ? (danger ? 'text-red-500' : 'text-green-500') : 'text-slate-600'}`}>
                {checked ? <ToggleRight size={32} fill="currentColor" className="opacity-20"/> : <ToggleLeft size={32} />}
            </button>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 font-sans -m-6 md:-m-10 flex flex-col">
            
            {/* Top Bar */}
            <div className="bg-slate-900 border-b border-slate-800 px-6 py-3 flex justify-between items-center sticky top-0 z-50 shrink-0 h-16">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-red-600 rounded flex items-center justify-center shadow-lg shadow-red-600/20">
                        <ShieldCheck size={16} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
                            GOD MODE <span className="px-1.5 py-0.5 rounded bg-red-900/50 border border-red-800 text-[9px] text-red-400 uppercase">Owner</span>
                        </h1>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {isSaving && <span className="text-xs text-slate-500 animate-pulse">Aplicando alterações...</span>}
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-xs shadow-lg shadow-blue-900/20 flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        <Save size={14}/> Salvar e Aplicar
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                
                {/* Sidebar */}
                <div className="w-64 bg-slate-900/50 border-r border-slate-800 flex flex-col gap-1 p-2 overflow-y-auto">
                    <div className="px-4 py-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Infraestrutura</div>
                    <button onClick={() => setActiveTab('infrastructure')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'infrastructure' ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Server size={16}/> APIs & Banco
                    </button>
                    <button onClick={() => setActiveTab('webhooks')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'webhooks' ? 'bg-purple-600/10 text-purple-400 border border-purple-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Webhook size={16}/> Webhooks (N8N)
                    </button>
                    
                    <div className="px-4 py-2 mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Controle</div>
                    <button onClick={() => setActiveTab('system')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'system' ? 'bg-red-600/10 text-red-400 border border-red-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Settings size={16}/> System Flags
                    </button>
                    
                    <button onClick={() => setActiveTab('whitelabel')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'whitelabel' ? 'bg-amber-600/10 text-amber-400 border border-amber-600/20' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Palette size={16}/> White Label
                    </button>

                    <button onClick={() => setActiveTab('logs')} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all ${activeTab === 'logs' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:bg-slate-800'}`}>
                        <Terminal size={16}/> Logs de Sistema
                    </button>
                </div>

                {/* Main Content */}
                <div className="flex-1 overflow-y-auto bg-slate-950 p-8">
                    
                    {/* --- INFRASTRUCTURE --- */}
                    {activeTab === 'infrastructure' && (
                        <div className="max-w-4xl space-y-8 animate-in fade-in">
                            {/* Evolution API */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Smartphone className="text-green-500"/> WhatsApp Engine (Evolution API)</h2>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Globe size={10} /> Base URL</label>
                                            <input type="text" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono outline-none focus:border-green-500" value={vault.evolution_url} onChange={(e) => updateVal('evolution_url', e.target.value)} placeholder="https://api.evolution.com"/>
                                        </div>
                                        <SecretField label="Global API Key" objKey="evolution_key" />
                                    </div>
                                    <div className="pt-2 border-t border-slate-800 flex justify-between items-center">
                                        <span className="text-xs text-slate-500">Status: {statusChecks.evolution === 'ok' ? 'Online' : statusChecks.evolution === 'error' ? 'Offline' : 'Não verificado'}</span>
                                        <button onClick={testEvolution} className="text-xs bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded transition-colors border border-slate-700">Testar Conexão</button>
                                    </div>
                                </div>
                            </div>

                            {/* Database & Storage */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Database className="text-amber-500"/> Banco de Dados (Supabase)</h2>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Globe size={10} /> Project URL</label>
                                            <input type="text" className="w-full px-3 py-2.5 bg-slate-950 border border-slate-700 rounded-lg text-slate-200 text-xs font-mono outline-none focus:border-amber-500" value={vault.supabase_url} onChange={(e) => updateVal('supabase_url', e.target.value)} disabled/>
                                        </div>
                                        <SecretField label="Service Role Key (Master)" objKey="supabase_key" />
                                    </div>
                                </div>
                            </div>

                            {/* Financial */}
                            <div className="space-y-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard className="text-blue-500"/> Stripe Payments</h2>
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
                                    <SecretField label="Secret Key (sk_live)" objKey="stripe_sk" />
                                    <SecretField label="Publishable Key (pk_live)" objKey="stripe_pk" />
                                    <SecretField label="Webhook Secret (whsec)" objKey="stripe_webhook_secret" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- WEBHOOKS (N8N) --- */}
                    {activeTab === 'webhooks' && (
                        <div className="max-w-4xl space-y-6 animate-in fade-in">
                            <div className="flex justify-between items-end">
                                <div>
                                    <h2 className="text-lg font-bold text-white flex items-center gap-2"><Webhook className="text-purple-500"/> Roteamento de Eventos (N8N)</h2>
                                    <p className="text-xs text-slate-400 mt-1">Configure para onde o sistema deve enviar notificações de eventos.</p>
                                </div>
                                <a href="#" className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1"><Layers size={12}/> Ver documentação de payload</a>
                            </div>

                            <div className="space-y-3">
                                <WebhookRow event="user.created" label="Novo Cadastro de Usuário" objKey="webhook_user_signup" />
                                <WebhookRow event="payment.success" label="Pagamento Aprovado (Stripe)" objKey="webhook_payment_success" />
                                <WebhookRow event="instance.disconnected" label="Instância Desconectada" objKey="webhook_instance_error" />
                                <WebhookRow event="ticket.created" label="Novo Ticket/Chat Iniciado" objKey="webhook_ticket_created" />
                            </div>

                            <div className="p-4 bg-blue-900/10 border border-blue-900/30 rounded-xl flex gap-3">
                                <Activity className="text-blue-400 mt-0.5" size={18}/>
                                <div>
                                    <h4 className="text-sm font-bold text-blue-200">Global Instance Webhook (Evolution)</h4>
                                    <p className="text-xs text-blue-300/80 mb-2">Defina uma URL única para receber TODOS os eventos de todas as instâncias WhatsApp criadas.</p>
                                    <input 
                                        type="text" 
                                        className="w-full bg-slate-950 border border-blue-900/50 rounded px-3 py-2 text-xs text-blue-100 font-mono outline-none focus:border-blue-500"
                                        placeholder="https://n8n.seuservidor.com/webhook/evolution-global"
                                        value={vault.evolution_global_webhook_url}
                                        onChange={(e) => updateVal('evolution_global_webhook_url', e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SYSTEM CONTROLS --- */}
                    {activeTab === 'system' && (
                        <div className="max-w-3xl space-y-6 animate-in fade-in">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2"><Settings className="text-red-500"/> Controles do Sistema (Feature Flags)</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ToggleCard 
                                    label="Modo Manutenção" 
                                    desc="Bloqueia acesso de todos os usuários (exceto Owner)." 
                                    checked={vault.system_maintenance_mode} 
                                    onChange={(v: boolean) => updateVal('system_maintenance_mode', v)}
                                    danger
                                />
                                <ToggleCard 
                                    label="Novos Cadastros" 
                                    desc="Permite que novos usuários criem contas." 
                                    checked={vault.allow_new_registrations} 
                                    onChange={(v: boolean) => updateVal('allow_new_registrations', v)}
                                />
                                <ToggleCard 
                                    label="Free Trial Automático" 
                                    desc="Concede 3 dias grátis para novas contas." 
                                    checked={vault.enable_free_trial} 
                                    onChange={(v: boolean) => updateVal('enable_free_trial', v)}
                                />
                            </div>
                        </div>
                    )}

                    {/* --- WHITE LABEL EDITOR --- */}
                    {activeTab === 'whitelabel' && (
                        <div className="max-w-4xl space-y-8 animate-in fade-in">
                            <div>
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Palette className="text-amber-500"/> White Label & Personalização</h2>
                                <p className="text-xs text-slate-400 mt-1">Personalize a identidade visual e textual da plataforma.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Visual Identity */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <ImageIcon size={14}/> Identidade Visual
                                    </h3>
                                    
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">Nome da Aplicação</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                                                value={vault.branding.appName}
                                                onChange={e => updateBranding('appName', e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-300 block mb-1">Cor Primária (Hex)</label>
                                                <div className="flex gap-2">
                                                    <input 
                                                        type="color" 
                                                        className="h-9 w-9 bg-transparent border-none cursor-pointer"
                                                        value={vault.branding.primaryColor}
                                                        onChange={e => updateBranding('primaryColor', e.target.value)}
                                                    />
                                                    <input 
                                                        type="text" 
                                                        className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white outline-none uppercase"
                                                        value={vault.branding.primaryColor}
                                                        onChange={e => updateBranding('primaryColor', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                            <div className="flex items-end">
                                                <div className="w-full h-9 rounded bg-blue-600/20 border border-blue-600/50 flex items-center justify-center text-xs text-blue-400" style={{backgroundColor: `${vault.branding.primaryColor}33`, borderColor: vault.branding.primaryColor, color: vault.branding.primaryColor}}>
                                                    Preview Cor
                                                </div>
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">URL da Logo (Claro)</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-amber-500 placeholder:text-slate-700"
                                                placeholder="https://sua-cdn.com/logo-light.png"
                                                value={vault.branding.logoUrlLight}
                                                onChange={e => updateBranding('logoUrlLight', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">URL da Logo (Escuro)</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-amber-500 placeholder:text-slate-700"
                                                placeholder="https://sua-cdn.com/logo-dark.png"
                                                value={vault.branding.logoUrlDark}
                                                onChange={e => updateBranding('logoUrlDark', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">URL do Favicon</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white outline-none focus:border-amber-500 placeholder:text-slate-700"
                                                placeholder="https://sua-cdn.com/favicon.ico"
                                                value={vault.branding.faviconUrl}
                                                onChange={e => updateBranding('faviconUrl', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Texts & Pages */}
                                <div className="space-y-4">
                                    <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                        <Type size={14}/> Textos e Landing Page
                                    </h3>
                                    
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">Título do Login</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                                                value={vault.branding.loginTitle}
                                                onChange={e => updateBranding('loginTitle', e.target.value)}
                                            />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">Subtítulo do Login</label>
                                            <input 
                                                type="text" 
                                                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                                                value={vault.branding.loginMessage}
                                                onChange={e => updateBranding('loginMessage', e.target.value)}
                                            />
                                        </div>
                                        
                                        <div className="h-px bg-slate-800 my-2"></div>

                                        <div className="flex items-center justify-between">
                                            <label className="text-xs font-bold text-slate-300">Exibir Landing Page de Vendas?</label>
                                            <button 
                                                onClick={() => updateBranding('showSalesPage', !vault.branding.showSalesPage)}
                                                className={vault.branding.showSalesPage ? "text-green-500" : "text-slate-600"}
                                            >
                                                {vault.branding.showSalesPage ? <ToggleRight size={24}/> : <ToggleLeft size={24}/>}
                                            </button>
                                        </div>

                                        {vault.branding.showSalesPage && (
                                            <>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-300 block mb-1">Headline (H1)</label>
                                                    <input 
                                                        type="text" 
                                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
                                                        value={vault.branding.landingPageHeadline}
                                                        onChange={e => updateBranding('landingPageHeadline', e.target.value)}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs font-bold text-slate-300 block mb-1">Subheadline</label>
                                                    <textarea 
                                                        className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white outline-none focus:border-amber-500 resize-none h-20"
                                                        value={vault.branding.landingPageSubheadline}
                                                        onChange={e => updateBranding('landingPageSubheadline', e.target.value)}
                                                    />
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- LOGS --- */}
                    {activeTab === 'logs' && (
                        <div className="h-full flex flex-col animate-in fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Terminal className="text-slate-500"/> Logs de Auditoria</h2>
                                <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-white">Limpar</button>
                            </div>
                            <div className="flex-1 bg-black rounded-xl border border-slate-800 p-4 font-mono text-[10px] md:text-xs overflow-auto text-slate-300 shadow-inner">
                                {logs.length === 0 && <span className="text-slate-600 italic">Aguardando eventos...</span>}
                                {logs.map((log, idx) => (
                                    <div key={idx} className="mb-1 border-b border-slate-900 pb-1 break-all">
                                        <span className={
                                            log.includes('[ERROR]') ? 'text-red-400' : 
                                            log.includes('[SUCCESS]') ? 'text-green-400' : 
                                            log.includes('[WARN]') ? 'text-amber-400' :
                                            'text-blue-300'
                                        }>
                                            {log}
                                        </span>
                                    </div>
                                ))}
                                <div className="mt-2 animate-pulse text-slate-500">_</div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MasterConsole;
