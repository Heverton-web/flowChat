
import React, { useState, useEffect } from 'react';
import { 
  Server, Activity, Save, Database, Lock, Eye, EyeOff, 
  Terminal, ShieldCheck, CreditCard, Globe, AlertTriangle,
  CheckCircle, Smartphone, Webhook, ToggleLeft, ToggleRight, 
  PlayCircle, Settings, Palette, Image as ImageIcon, Type, ShoppingBag, 
  BarChart2, Cpu, Wifi, Zap, Layout, RefreshCw, LayoutTemplate, Monitor,
  MessageSquare, Mic, FileText, ListChecks, Radio, Upload, Link as LinkIcon,
  DollarSign, LogOut, TableProperties, Code, Trash2, Edit, Plus, X
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip } from 'recharts';
import { useApp } from '../contexts/AppContext';
import { getSystemConfig, saveSystemConfig, SystemConfig } from '../services/configService';
import { supabase } from '../services/supabaseClient';
import * as webhookService from '../services/webhookService';
import Logo from './Logo';

// Mock Data for System Health
const HEALTH_DATA = [
  { time: '10:00', latency: 45, errors: 0 },
  { time: '10:05', latency: 48, errors: 0 },
  { time: '10:10', latency: 150, errors: 2 },
  { time: '10:15', latency: 52, errors: 0 },
  { time: '10:20', latency: 49, errors: 0 },
  { time: '10:25', latency: 47, errors: 0 },
];

const PRESET_COLORS = [
    { name: 'Blue', hex: '#3b82f6' },
    { name: 'Purple', hex: '#a855f7' },
    { name: 'Emerald', hex: '#10b981' },
    { name: 'Rose', hex: '#f43f5e' },
    { name: 'Amber', hex: '#f59e0b' },
    { name: 'Slate', hex: '#64748b' },
];

const AVAILABLE_TABLES = [
    'profiles', 
    'instances', 
    'contacts', 
    'campaigns', 
    'licenses', 
    'transactions', 
    'tags'
];

interface DeveloperConsoleProps {
    initialTab?: 'dashboard' | 'infrastructure' | 'webhooks' | 'system' | 'whitelabel' | 'logs' | 'evolution_api' | 'supabase';
    onLogout?: () => void;
}

const MasterConsole: React.FC<DeveloperConsoleProps> = ({ initialTab = 'dashboard', onLogout }) => {
    const { showToast, theme } = useApp();
    const [vault, setVault] = useState<SystemConfig>(getSystemConfig());
    const [activeTab, setActiveTab] = useState<string>(initialTab);
    const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
    const [isSaving, setIsSaving] = useState(false);
    const [statusChecks, setStatusChecks] = useState<Record<string, 'checking' | 'ok' | 'error' | null>>({});
    const [logs, setLogs] = useState<string[]>([]);
    
    // Preview Mode State
    const [previewMode, setPreviewMode] = useState<'login' | 'dashboard'>('login');

    // --- EVOLUTION PLAYGROUND STATE ---
    const [testInstance, setTestInstance] = useState('');
    const [testPhone, setTestPhone] = useState(''); // 5511...
    const [testLoading, setTestLoading] = useState(false);
    const [lastApiResponse, setLastApiResponse] = useState<string>('');
    const [msgText, setMsgText] = useState('Olá! Teste de envio via Console.');
    const [mediaUrl, setMediaUrl] = useState('');
    const [mediaCaption, setMediaCaption] = useState('');
    const [pollQuestion, setPollQuestion] = useState('Qual a melhor plataforma?');
    const [pollOptions, setPollOptions] = useState(['FlowChat', 'Outra', 'Nenhuma']);

    // --- SUPABASE STUDIO STATE ---
    const [sbTable, setSbTable] = useState('profiles');
    const [sbData, setSbData] = useState<any[]>([]);
    const [sbLoading, setSbLoading] = useState(false);
    const [sbModalOpen, setSbModalOpen] = useState(false);
    const [sbEditorMode, setSbEditorMode] = useState<'create' | 'edit'>('create');
    const [sbJsonInput, setSbJsonInput] = useState('{}');
    const [sbSelectedId, setSbSelectedId] = useState<string | null>(null);

    useEffect(() => {
        if (initialTab) setActiveTab(initialTab);
        // Initial Health Check
        testEvolution(true); 
    }, []);

    useEffect(() => {
        if (activeTab === 'supabase') {
            fetchSupabaseData();
        }
    }, [activeTab, sbTable]);

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

    const updateDomains = (key: keyof SystemConfig['domains'], value: string) => {
        setVault((prev) => ({
            ...prev,
            domains: {
                ...prev.domains,
                [key]: value
            }
        }));
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

    const updatePlan = (planKey: 'START' | 'GROWTH' | 'SCALE', field: string, value: any) => {
        setVault(prev => ({
            ...prev,
            plans: {
                ...prev.plans,
                [planKey]: {
                    ...prev.plans[planKey],
                    [field]: value
                }
            }
        }));
    };

    // --- TESTERS ---
    const testEvolution = async (silent = false) => {
        if (!vault.evolution_url) return !silent && showToast('URL não configurada', 'error');
        setStatusChecks(p => ({...p, evolution: 'checking'}));
        if(!silent) addLog(`Ping Evolution API: ${vault.evolution_url}`, 'INFO');
        try {
            const res = await fetch(`${vault.evolution_url}/instance/fetchInstances`, {
                headers: { 'apikey': vault.evolution_key, 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                setStatusChecks(p => ({...p, evolution: 'ok'}));
                if(!silent) {
                    addLog('Evolution API: Online e Autenticada.', 'SUCCESS');
                    const data = await res.json();
                    // Auto-fill instance if available
                    if(data.length > 0 && !testInstance) setTestInstance(data[0].instance.instanceName);
                }
            } else {
                throw new Error(res.statusText);
            }
        } catch (e: any) {
            setStatusChecks(p => ({...p, evolution: 'error'}));
            if(!silent) addLog(`Evolution API Error: ${e.message}`, 'ERROR');
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

    // --- SUPABASE CRUD ACTIONS ---
    const fetchSupabaseData = async () => {
        setSbLoading(true);
        try {
            const { data, error } = await supabase
                .from(sbTable)
                .select('*')
                .limit(50)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            setSbData(data || []);
            addLog(`Supabase: fetched ${data?.length} rows from ${sbTable}`, 'INFO');
        } catch (e: any) {
            addLog(`Supabase Error: ${e.message}`, 'ERROR');
            setSbData([]); // Reset on error
        } finally {
            setSbLoading(false);
        }
    };

    const openSbEditor = (item: any = null) => {
        if (item) {
            setSbEditorMode('edit');
            setSbSelectedId(item.id);
            setSbJsonInput(JSON.stringify(item, null, 4));
        } else {
            setSbEditorMode('create');
            setSbSelectedId(null);
            setSbJsonInput('{\n  "key": "value"\n}');
        }
        setSbModalOpen(true);
    };

    const handleSbSave = async () => {
        try {
            const payload = JSON.parse(sbJsonInput);
            setSbLoading(true);
            
            if (sbEditorMode === 'create') {
                const { error } = await supabase.from(sbTable).insert(payload);
                if (error) throw error;
                addLog(`Supabase: Inserted into ${sbTable}`, 'SUCCESS');
            } else {
                const { error } = await supabase.from(sbTable).update(payload).eq('id', sbSelectedId);
                if (error) throw error;
                addLog(`Supabase: Updated ${sbTable}:${sbSelectedId}`, 'SUCCESS');
            }
            
            setSbModalOpen(false);
            fetchSupabaseData();
            showToast('Operação realizada com sucesso!', 'success');
        } catch (e: any) {
            showToast(e.message || 'Erro ao salvar (JSON Inválido?)', 'error');
            addLog(`Supabase Write Error: ${e.message}`, 'ERROR');
        } finally {
            setSbLoading(false);
        }
    };

    const handleSbDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este registro?')) return;
        setSbLoading(true);
        try {
            const { error } = await supabase.from(sbTable).delete().eq('id', id);
            if (error) throw error;
            addLog(`Supabase: Deleted ${sbTable}:${id}`, 'SUCCESS');
            fetchSupabaseData();
            showToast('Registro excluído.', 'success');
        } catch (e: any) {
            showToast(e.message, 'error');
            addLog(`Supabase Delete Error: ${e.message}`, 'ERROR');
        } finally {
            setSbLoading(false);
        }
    };

    // --- EVOLUTION API PLAYGROUND ACTIONS ---
    const sendEvoRequest = async (endpoint: string, body: any) => {
        if (!testInstance || !testPhone) return showToast('Preencha Instância e Telefone', 'error');
        if (!vault.evolution_url) return showToast('Configure a URL da API primeiro', 'error');

        setTestLoading(true);
        const url = `${vault.evolution_url}/message/${endpoint}/${testInstance}`;
        
        // Formata número para padrão 55...
        const number = testPhone.replace(/\D/g, '');
        const payload = {
            number: number,
            options: { delay: 1200, presence: 'composing' },
            ...body
        };

        addLog(`POST ${url}`, 'INFO');
        
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'apikey': vault.evolution_key, 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            const data = await res.json();
            setLastApiResponse(JSON.stringify(data, null, 2));
            
            if (res.ok) {
                addLog(`Envio realizado: ${endpoint}`, 'SUCCESS');
                showToast('Mensagem enviada!', 'success');
            } else {
                addLog(`Erro API: ${JSON.stringify(data)}`, 'ERROR');
                showToast('Erro no envio.', 'error');
            }
        } catch (e: any) {
            addLog(`Erro de Rede: ${e.message}`, 'ERROR');
            setLastApiResponse(`Error: ${e.message}`);
        } finally {
            setTestLoading(false);
        }
    };

    const convertFileToBase64 = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'document' | 'audio') => {
        if (!e.target.files?.[0]) return;
        const file = e.target.files[0];
        setTestLoading(true);
        try {
            const base64Full = await convertFileToBase64(file);
            const base64Content = base64Full.split(',')[1]; 
            const mimeType = file.type;
            const fileName = file.name;

            let endpoint = 'sendMedia';
            let body: any = {
                media: base64Content,
                mediatype: type === 'document' ? 'document' : type === 'audio' ? 'audio' : 'image',
                mimetype: mimeType,
                fileName: fileName,
                caption: type === 'image' ? mediaCaption : undefined
            };

            if (type === 'audio') {
                endpoint = 'sendWhatsAppAudio'; 
                body = { audio: base64Content };
            }

            await sendEvoRequest(endpoint, body);

        } catch (e) {
            showToast('Erro ao processar arquivo', 'error');
        } finally {
            setTestLoading(false);
        }
    };

    // --- COMPONENTS ---

    const NavItem = ({ id, label, icon: Icon }: any) => (
        <button 
            onClick={() => setActiveTab(id)}
            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-r-xl border-l-2 transition-all ${
                activeTab === id 
                ? 'bg-blue-900/20 text-blue-400 border-blue-500' 
                : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300 border-transparent'
            }`}
        >
            <Icon size={18} />
            {label}
        </button>
    );

    const StatCard = ({ label, value, status, icon: Icon }: any) => (
        <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex items-center gap-4">
            <div className={`p-3 rounded-lg ${status === 'ok' ? 'bg-green-900/30 text-green-500' : status === 'error' ? 'bg-red-900/30 text-red-500' : 'bg-slate-800 text-slate-400'}`}>
                <Icon size={24} />
            </div>
            <div>
                <p className="text-xs text-slate-500 uppercase font-bold">{label}</p>
                <p className="text-lg font-bold text-white">{value}</p>
            </div>
        </div>
    );

    const SecretField = ({ label, objKey, placeholder }: { label: string, objKey: keyof SystemConfig, placeholder?: string }) => (
        <div className="space-y-1">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <Lock size={10} /> {label}
            </label>
            <div className="relative group">
                <input 
                    type={showSecrets[objKey] ? "text" : "password"} 
                    className="w-full pl-3 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-300 font-mono text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all placeholder:text-slate-700"
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

    const ToggleCard = ({ label, desc, checked, onChange, danger = false }: any) => (
        <div className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${checked ? (danger ? 'bg-red-900/10 border-red-900/50' : 'bg-green-900/10 border-green-900/50') : 'bg-slate-900 border-slate-800'}`}>
            <div>
                <h4 className={`text-sm font-bold ${checked ? (danger ? 'text-red-400' : 'text-green-400') : 'text-slate-400'}`}>{label}</h4>
                <p className="text-xs text-slate-500 mt-0.5">{desc}</p>
            </div>
            <button onClick={() => onChange(!checked)} className={`transition-colors ${checked ? (danger ? 'text-red-500' : 'text-green-500') : 'text-slate-600'}`}>
                {checked ? <ToggleRight size={32} fill="currentColor" className="opacity-20"/> : <ToggleLeft size={32} />}
            </button>
        </div>
    );

    const WebhookRow = ({ event, label, objKey }: { event: string, label: string, objKey: keyof SystemConfig }) => (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
                <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-slate-300">{label}</span>
                    <span className="text-[10px] text-slate-500 font-mono">{event}</span>
                </div>
                <input 
                    type="text" 
                    className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-blue-400 font-mono focus:border-purple-500 outline-none placeholder:text-slate-700"
                    placeholder="https://n8n.webhook..."
                    value={vault[objKey] as string}
                    onChange={(e) => updateVal(objKey, e.target.value)}
                />
            </div>
            <button 
                onClick={() => testWebhook(event, vault[objKey] as string)}
                className="bg-slate-800 hover:bg-purple-900/30 text-purple-400 border border-slate-700 hover:border-purple-500/50 px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap h-fit self-end md:self-center"
            >
                <PlayCircle size={14}/> Testar Disparo
            </button>
        </div>
    );

    // --- RENDER ---

    return (
        // FIXED: Removed negative margins (-m-6) and forced h-screen/w-screen to prevent cutoff
        <div className="fixed inset-0 z-[100] flex flex-col bg-slate-950 text-slate-200 font-sans h-screen w-screen overflow-hidden">
            
            {/* Top Bar: Command Center Header */}
            <div className="bg-slate-950 border-b border-slate-800 h-16 flex items-center justify-between px-6 shrink-0">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-red-600 rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(220,38,38,0.5)]">
                        <ShieldCheck size={20} className="text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white tracking-widest uppercase flex items-center gap-2">
                            God Mode <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-[9px] text-slate-400">v3.0</span>
                        </h1>
                        <p className="text-[10px] text-slate-500 font-mono">System Integrity: Stable</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {/* Live Status Indicators */}
                    <div className="hidden md:flex items-center gap-4 mr-4">
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            <span className={`w-2 h-2 rounded-full ${statusChecks.evolution === 'ok' ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-red-500'}`}></span>
                            API Engine
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                            <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></span>
                            Database
                        </div>
                    </div>

                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-lg font-bold text-xs shadow-[0_0_20px_rgba(37,99,235,0.3)] flex items-center gap-2 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Activity className="animate-spin" size={16}/> : <Save size={16}/>}
                        {isSaving ? 'Aplicando...' : 'Aplicar Alterações'}
                    </button>
                    
                    {/* Logout Button */}
                    <button 
                        onClick={onLogout}
                        className="p-2 hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors border border-transparent hover:border-red-900/50 ml-2"
                        title="Sair do God Mode"
                    >
                        <LogOut size={20} />
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                
                {/* Sidebar Navigation */}
                <div className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col py-4 gap-1 overflow-y-auto h-full pb-20">
                    <div className="px-6 py-2 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Monitoramento</div>
                    <NavItem id="dashboard" label="Visão Geral" icon={BarChart2} />
                    <NavItem id="logs" label="System Logs" icon={Terminal} />

                    <div className="px-6 py-2 mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Core</div>
                    <NavItem id="infrastructure" label="Infraestrutura" icon={Server} />
                    <NavItem id="webhooks" label="Webhooks (N8N)" icon={Webhook} />
                    <NavItem id="evolution_api" label="Evolution API" icon={Radio} />
                    <NavItem id="supabase" label="Supabase" icon={Database} />
                    
                    <div className="px-6 py-2 mt-4 text-[10px] font-bold text-slate-600 uppercase tracking-widest">Negócio</div>
                    <NavItem id="system" label="Feature Flags" icon={Cpu} />
                    <NavItem id="whitelabel" label="White Label" icon={Palette} />
                </div>

                {/* Main Viewport */}
                <div className="flex-1 bg-slate-950 overflow-y-auto custom-scrollbar p-8 pb-24">
                    
                    {/* --- DASHBOARD VIEW --- */}
                    {activeTab === 'dashboard' && (
                        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <StatCard label="Evolution API" value={statusChecks.evolution === 'ok' ? 'ONLINE' : 'OFFLINE'} status={statusChecks.evolution} icon={Smartphone} />
                                <StatCard label="Latência Média" value="45ms" status="ok" icon={Wifi} />
                                <StatCard label="Erros (24h)" value="0.02%" status="ok" icon={AlertTriangle} />
                                <StatCard label="Uso de Licença" value="Ativo" status="ok" icon={CreditCard} />
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-6">
                                    <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
                                        <Activity size={16} className="text-blue-500"/> Telemetria em Tempo Real
                                    </h3>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={HEALTH_DATA}>
                                                <defs>
                                                    <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <XAxis dataKey="time" hide />
                                                <YAxis hide />
                                                <RechartsTooltip 
                                                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="latency" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
                                    <h3 className="text-sm font-bold text-slate-300 mb-4">Ações Rápidas</h3>
                                    <div className="space-y-3 flex-1">
                                        <button onClick={() => testEvolution()} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                            <RefreshCw size={14}/> Testar Conexão API
                                        </button>
                                        <button className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 py-2 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-2">
                                            <Database size={14}/> Backup de Configurações
                                        </button>
                                    </div>
                                    <div className="mt-4 pt-4 border-t border-slate-800 text-[10px] text-slate-500 font-mono text-center">
                                        Last sync: {new Date().toLocaleTimeString()}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- INFRASTRUCTURE --- */}
                    {activeTab === 'infrastructure' && (
                        <div className="max-w-4xl space-y-8 animate-in fade-in">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <Server className="text-blue-500"/> Infraestrutura
                            </h2>
                            
                            {/* --- DOMAINS CONFIG CONTAINER --- */}
                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                                <div className="border-b border-slate-800 pb-4">
                                    <h3 className="text-sm font-bold text-white flex items-center gap-2"><Globe size={16}/> Domínios e Subdomínios</h3>
                                    <p className="text-xs text-slate-500">Definição das rotas principais da aplicação.</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Layout size={10}/> Frontend URL (App)</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-blue-500 outline-none placeholder:text-slate-700" 
                                            placeholder="app.seudominio.com"
                                            value={vault.domains.frontend} 
                                            onChange={(e) => updateDomains('frontend', e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Server size={10}/> Backend URL (API)</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-blue-500 outline-none placeholder:text-slate-700" 
                                            placeholder="api.seudominio.com"
                                            value={vault.domains.backend} 
                                            onChange={(e) => updateDomains('backend', e.target.value)} 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1"><Webhook size={10}/> Webhook Base URL</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-blue-500 outline-none placeholder:text-slate-700" 
                                            placeholder="webhook.seudominio.com"
                                            value={vault.domains.webhook} 
                                            onChange={(e) => updateDomains('webhook', e.target.value)} 
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-white">Evolution API</h3>
                                        <p className="text-xs text-slate-500">Motor de processamento WhatsApp</p>
                                    </div>
                                    <div className={`px-2 py-1 rounded text-[10px] font-bold ${statusChecks.evolution === 'ok' ? 'bg-green-900/30 text-green-500' : 'bg-slate-800 text-slate-500'}`}>
                                        {statusChecks.evolution === 'ok' ? 'ONLINE' : 'UNKNOWN'}
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Base URL</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-blue-500 outline-none" value={vault.evolution_url} onChange={(e) => updateVal('evolution_url', e.target.value)} />
                                    </div>
                                    <SecretField label="Global API Key" objKey="evolution_key" />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                                <div className="border-b border-slate-800 pb-4">
                                    <h3 className="text-sm font-bold text-white">Supabase & Database</h3>
                                    <p className="text-xs text-slate-500">Persistência de dados e autenticação</p>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase">Project URL</label>
                                        <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-200 text-xs font-mono focus:border-amber-500 outline-none" value={vault.supabase_url} onChange={(e) => updateVal('supabase_url', e.target.value)} disabled />
                                    </div>
                                    <SecretField label="Service Role Key" objKey="supabase_key" />
                                </div>
                            </div>

                            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
                                <div className="border-b border-slate-800 pb-4">
                                    <h3 className="text-sm font-bold text-white">Stripe Payments</h3>
                                    <p className="text-xs text-slate-500">Gateway de pagamentos</p>
                                </div>
                                <div className="space-y-4">
                                    <SecretField label="Secret Key (sk_live)" objKey="stripe_sk" />
                                    <SecretField label="Publishable Key (pk_live)" objKey="stripe_pk" />
                                    <SecretField label="Webhook Secret (whsec)" objKey="stripe_webhook_secret" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- SUPABASE STUDIO (NEW) --- */}
                    {activeTab === 'supabase' && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in h-full flex flex-col pb-20">
                            <div className="flex justify-between items-center shrink-0">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Database className="text-emerald-500"/> Database Studio Lite
                                </h2>
                                <div className="flex gap-2">
                                    <div className="relative">
                                        <TableProperties className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                                        <select 
                                            value={sbTable} 
                                            onChange={(e) => setSbTable(e.target.value)}
                                            className="pl-9 pr-8 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-200 outline-none focus:border-emerald-500 appearance-none uppercase"
                                        >
                                            {AVAILABLE_TABLES.map(t => <option key={t} value={t}>{t}</option>)}
                                        </select>
                                    </div>
                                    <button onClick={fetchSupabaseData} className="p-2 bg-slate-900 border border-slate-700 hover:border-slate-500 rounded-lg text-slate-400 hover:text-white transition-colors">
                                        <RefreshCw size={16} className={sbLoading ? 'animate-spin' : ''}/>
                                    </button>
                                    <button onClick={() => openSbEditor()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2">
                                        <Plus size={16}/> Novo Registro
                                    </button>
                                </div>
                            </div>

                            {/* Data Grid */}
                            <div className="flex-1 bg-slate-900 border border-slate-800 rounded-xl overflow-hidden flex flex-col relative">
                                {sbLoading && (
                                    <div className="absolute inset-0 bg-slate-950/50 z-20 flex items-center justify-center backdrop-blur-sm">
                                        <div className="text-emerald-500 font-bold flex flex-col items-center gap-2">
                                            <RefreshCw className="animate-spin" size={32}/>
                                            Carregando Dados...
                                        </div>
                                    </div>
                                )}
                                
                                {sbData.length === 0 && !sbLoading ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 p-10">
                                        <Database size={48} className="mb-4 opacity-20"/>
                                        <p className="text-sm font-medium">Tabela vazia ou sem permissão de leitura.</p>
                                    </div>
                                ) : (
                                    <div className="flex-1 overflow-auto custom-scrollbar">
                                        <table className="w-full text-left text-xs whitespace-nowrap">
                                            <thead className="bg-slate-950 text-slate-400 font-mono sticky top-0 z-10 shadow-sm">
                                                <tr>
                                                    <th className="px-4 py-3 w-20 text-center">Actions</th>
                                                    {sbData[0] && Object.keys(sbData[0]).map(key => (
                                                        <th key={key} className="px-4 py-3 border-r border-slate-800 last:border-r-0">{key}</th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                                                {sbData.map((row, idx) => (
                                                    <tr key={idx} className="hover:bg-slate-800/50 transition-colors">
                                                        <td className="px-2 py-2 flex items-center justify-center gap-1 sticky left-0 bg-slate-900 z-10 shadow-lg border-r border-slate-800">
                                                            <button onClick={() => openSbEditor(row)} className="p-1.5 hover:bg-blue-900/30 text-slate-500 hover:text-blue-400 rounded"><Edit size={14}/></button>
                                                            <button onClick={() => handleSbDelete(row.id)} className="p-1.5 hover:bg-red-900/30 text-slate-500 hover:text-red-400 rounded"><Trash2 size={14}/></button>
                                                        </td>
                                                        {Object.values(row).map((val: any, vIdx) => (
                                                            <td key={vIdx} className="px-4 py-2 border-r border-slate-800 last:border-r-0 max-w-xs overflow-hidden text-ellipsis">
                                                                {typeof val === 'object' ? JSON.stringify(val) : String(val)}
                                                            </td>
                                                        ))}
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                                <div className="p-2 bg-slate-950 border-t border-slate-800 text-[10px] text-slate-500 flex justify-between px-4">
                                    <span>Total: {sbData.length} registros</span>
                                    <span>Showing top 50 (desc)</span>
                                </div>
                            </div>

                            {/* JSON Editor Modal */}
                            {sbModalOpen && (
                                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                                    <div className="bg-slate-900 border border-slate-700 w-full max-w-3xl rounded-xl shadow-2xl flex flex-col h-[80vh] overflow-hidden">
                                        <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-950">
                                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                <Code size={16} className="text-emerald-500"/>
                                                {sbEditorMode === 'create' ? 'Novo Registro' : `Editar ${sbTable}:${sbSelectedId}`}
                                            </h3>
                                            <button onClick={() => setSbModalOpen(false)}><X size={20} className="text-slate-500 hover:text-white"/></button>
                                        </div>
                                        <div className="flex-1 p-0 relative">
                                            <textarea 
                                                value={sbJsonInput}
                                                onChange={e => setSbJsonInput(e.target.value)}
                                                className="w-full h-full bg-slate-900 text-green-400 font-mono text-xs p-4 outline-none resize-none"
                                                spellCheck={false}
                                            />
                                        </div>
                                        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-between items-center">
                                            <span className="text-[10px] text-slate-500">Certifique-se de usar JSON válido. IDs automáticos podem ser omitidos na criação.</span>
                                            <div className="flex gap-2">
                                                <button onClick={() => setSbModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-white">Cancelar</button>
                                                <button onClick={handleSbSave} className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-xs font-bold shadow-lg shadow-emerald-900/20">
                                                    {sbEditorMode === 'create' ? 'Criar Registro' : 'Salvar Alterações'}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* --- EVOLUTION API PLAYGROUND --- */}
                    {activeTab === 'evolution_api' && (
                        <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                    <Radio className="text-green-500"/> Evolution API Playground
                                </h2>
                                <span className={`text-[10px] font-bold px-3 py-1 rounded-full ${statusChecks.evolution === 'ok' ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                    {statusChecks.evolution === 'ok' ? 'API CONECTADA' : 'API DESCONECTADA'}
                                </span>
                            </div>

                            {/* Config Header */}
                            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Instância de Envio</label>
                                    <input type="text" placeholder="Nome da Instância" value={testInstance} onChange={e => setTestInstance(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-green-500" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Número Destino (RemoteJid)</label>
                                    <input type="text" placeholder="5511999999999" value={testPhone} onChange={e => setTestPhone(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-white text-xs font-mono outline-none focus:border-green-500" />
                                </div>
                            </div>

                            {/* Actions Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                
                                {/* TEXT */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                                        <MessageSquare size={16} className="text-blue-500"/> Enviar Texto
                                    </div>
                                    <textarea className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white resize-none h-24 outline-none" placeholder="Digite sua mensagem..." value={msgText} onChange={e => setMsgText(e.target.value)}></textarea>
                                    <button onClick={() => sendEvoRequest('sendText', { text: msgText })} disabled={testLoading} className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 rounded-lg mt-auto">Enviar Texto</button>
                                </div>

                                {/* MEDIA URL */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                                        <ImageIcon size={16} className="text-pink-500"/> Mídia (URL)
                                    </div>
                                    <input type="text" placeholder="https://exemplo.com/imagem.png" value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"/>
                                    <input type="text" placeholder="Legenda (Opcional)" value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"/>
                                    <button onClick={() => sendEvoRequest('sendMedia', { media: mediaUrl, mediatype: 'image', caption: mediaCaption })} disabled={testLoading} className="bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold py-2 rounded-lg mt-auto">Enviar Link</button>
                                </div>

                                {/* MEDIA FILE */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                                        <Upload size={16} className="text-orange-500"/> Mídia (Arquivo)
                                    </div>
                                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-4 text-center cursor-pointer hover:bg-slate-800 relative">
                                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'image')} />
                                        <span className="text-xs text-slate-400">Clique para enviar Imagem</span>
                                    </div>
                                    <input type="text" placeholder="Legenda (Opcional)" value={mediaCaption} onChange={e => setMediaCaption(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"/>
                                    <div className="text-[10px] text-slate-500 text-center mt-auto">Converte para Base64 automaticamente</div>
                                </div>

                                {/* AUDIO PTT */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                                        <Mic size={16} className="text-purple-500"/> Áudio Gravado (PTT)
                                    </div>
                                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-800 relative">
                                        <input type="file" accept="audio/*" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'audio')} />
                                        <span className="text-xs text-slate-400">Upload MP3/OGG</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-center mt-auto">Simula gravação na hora</div>
                                </div>

                                {/* PDF DOC */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                                        <FileText size={16} className="text-slate-400"/> Documento PDF
                                    </div>
                                    <div className="border-2 border-dashed border-slate-700 rounded-lg p-8 text-center cursor-pointer hover:bg-slate-800 relative">
                                        <input type="file" accept=".pdf,.doc,.docx" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e) => handleFileUpload(e, 'document')} />
                                        <span className="text-xs text-slate-400">Upload Documento</span>
                                    </div>
                                    <div className="text-[10px] text-slate-500 text-center mt-auto">Mantém nome do arquivo original</div>
                                </div>

                                {/* POLL */}
                                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col gap-4">
                                    <div className="flex items-center gap-2 text-white font-bold text-sm border-b border-slate-800 pb-2">
                                        <ListChecks size={16} className="text-emerald-500"/> Enquete
                                    </div>
                                    <input type="text" placeholder="Pergunta da Enquete" value={pollQuestion} onChange={e => setPollQuestion(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-2 text-xs text-white outline-none"/>
                                    <div className="space-y-1">
                                        {pollOptions.map((opt, idx) => (
                                            <input key={idx} type="text" placeholder={`Opção ${idx+1}`} value={opt} onChange={e => {const n = [...pollOptions]; n[idx] = e.target.value; setPollOptions(n)}} className="w-full bg-slate-950 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white outline-none"/>
                                        ))}
                                    </div>
                                    <button onClick={() => sendEvoRequest('sendPoll', { name: pollQuestion, values: pollOptions, selectableCount: 1 })} disabled={testLoading} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-2 rounded-lg mt-auto">Enviar Enquete</button>
                                </div>

                            </div>

                            {/* Response Log */}
                            <div className="bg-black rounded-lg border border-slate-800 p-4 font-mono text-[10px] text-green-500 h-40 overflow-auto shadow-inner relative">
                                <div className="absolute top-2 right-4 text-slate-600 font-bold uppercase">Última Resposta API</div>
                                <pre>{lastApiResponse || '// Aguardando requisição...'}</pre>
                            </div>
                        </div>
                    )}

                    {/* --- WHITELABEL (ENHANCED SPLIT VIEW) --- */}
                    {activeTab === 'whitelabel' && (
                        <div className="h-full flex flex-col animate-in fade-in">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-xl font-bold text-white flex items-center gap-3"><Palette className="text-amber-500"/> Personalização</h2>
                                
                                {/* Preview Switcher */}
                                <div className="flex bg-slate-900 p-1 rounded-lg border border-slate-800">
                                    <button 
                                        onClick={() => setPreviewMode('login')} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${previewMode === 'login' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <LayoutTemplate size={14}/> Tela de Login
                                    </button>
                                    <button 
                                        onClick={() => setPreviewMode('dashboard')} 
                                        className={`px-3 py-1.5 text-xs font-bold rounded-md flex items-center gap-2 transition-all ${previewMode === 'dashboard' ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                                    >
                                        <Monitor size={14}/> Dashboard
                                    </button>
                                </div>
                            </div>

                            <div className="flex-1 flex gap-6 min-h-0">
                                {/* Editor (Left) */}
                                <div className="w-1/2 overflow-y-auto custom-scrollbar pr-2 space-y-6">
                                    {/* Brand Identity */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Identidade Visual</h3>
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">Nome da Aplicação</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white focus:border-amber-500 outline-none" value={vault.branding.appName} onChange={e => updateBranding('appName', e.target.value)} />
                                        </div>
                                        
                                        {/* Color Picker & Presets */}
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-2">Cor Primária (Tema)</label>
                                            <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
                                                {PRESET_COLORS.map(c => (
                                                    <button 
                                                        key={c.name} 
                                                        onClick={() => updateBranding('primaryColor', c.hex)}
                                                        className={`w-6 h-6 rounded-full border-2 transition-transform hover:scale-110 ${vault.branding.primaryColor === c.hex ? 'border-white' : 'border-transparent'}`}
                                                        style={{ backgroundColor: c.hex }}
                                                        title={c.name}
                                                    />
                                                ))}
                                            </div>
                                            <div className="flex gap-2">
                                                <input type="color" className="h-9 w-9 bg-transparent border-none cursor-pointer rounded overflow-hidden" value={vault.branding.primaryColor} onChange={e => updateBranding('primaryColor', e.target.value)} />
                                                <input type="text" className="flex-1 bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs font-mono text-white outline-none uppercase" value={vault.branding.primaryColor} onChange={e => updateBranding('primaryColor', e.target.value)} />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">URL da Logo (Claro)</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-white focus:border-amber-500 outline-none" value={vault.branding.logoUrlLight} onChange={e => updateBranding('logoUrlLight', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Layout & Login Text */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-4">Tela de Login</h3>
                                        
                                        {/* Layout Selector */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            <button 
                                                onClick={() => updateBranding('loginLayout', 'split')}
                                                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${vault.branding.loginLayout === 'split' ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-950 hover:border-slate-600'}`}
                                            >
                                                <div className="flex w-12 h-8 rounded border border-slate-600 overflow-hidden">
                                                    <div className="w-1/2 bg-slate-700"></div>
                                                    <div className="w-1/2 bg-slate-800"></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-300">Split (Clássico)</span>
                                            </button>
                                            <button 
                                                onClick={() => updateBranding('loginLayout', 'center')}
                                                className={`p-3 rounded-lg border-2 flex flex-col items-center gap-2 transition-all ${vault.branding.loginLayout === 'center' ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700 bg-slate-950 hover:border-slate-600'}`}
                                            >
                                                <div className="w-12 h-8 rounded border border-slate-600 bg-slate-800 flex items-center justify-center">
                                                    <div className="w-6 h-4 bg-slate-700 rounded-sm"></div>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-300">Centralizado</span>
                                            </button>
                                        </div>

                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">Título</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={vault.branding.loginTitle} onChange={e => updateBranding('loginTitle', e.target.value)} />
                                        </div>
                                        <div>
                                            <label className="text-xs font-bold text-slate-300 block mb-1">Subtítulo</label>
                                            <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={vault.branding.loginMessage} onChange={e => updateBranding('loginMessage', e.target.value)} />
                                        </div>
                                    </div>

                                    {/* Landing Page & Plans Configuration */}
                                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-xs font-bold text-slate-400 uppercase">Landing Page & Precificação</h3>
                                            <ToggleCard 
                                                label="" 
                                                desc="" 
                                                checked={vault.branding.showSalesPage} 
                                                onChange={(v: boolean) => updateBranding('showSalesPage', v)} 
                                            />
                                        </div>

                                        <div className="space-y-4">
                                            <div>
                                                <label className="text-xs font-bold text-slate-300 block mb-1">Headline Principal</label>
                                                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={vault.branding.landingPageHeadline} onChange={e => updateBranding('landingPageHeadline', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-300 block mb-1">Subtítulo de Apoio</label>
                                                <textarea rows={2} className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={vault.branding.landingPageSubheadline} onChange={e => updateBranding('landingPageSubheadline', e.target.value)} />
                                            </div>
                                            <div>
                                                <label className="text-xs font-bold text-slate-300 block mb-1">Tag Promocional</label>
                                                <input type="text" className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm text-white" value={vault.branding.landingTag} onChange={e => updateBranding('landingTag', e.target.value)} />
                                            </div>
                                        </div>

                                        <div className="border-t border-slate-800 pt-4">
                                            <h4 className="text-xs font-bold text-blue-400 uppercase mb-3 flex items-center gap-2"><DollarSign size={12}/> Configuração de Planos (Preço & Recursos)</h4>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                                {(['START', 'GROWTH', 'SCALE'] as const).map(planKey => (
                                                    <div key={planKey} className="bg-slate-950 border border-slate-700 rounded-lg p-3 space-y-3">
                                                        <div className="flex justify-between items-center">
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase">{planKey} (R$/mês)</label>
                                                        </div>
                                                        <input 
                                                            type="number" 
                                                            className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-xs text-white focus:border-blue-500 outline-none" 
                                                            value={vault.plans[planKey].price} 
                                                            onChange={e => updatePlan(planKey, 'price', Number(e.target.value))} 
                                                        />
                                                        
                                                        <div>
                                                            <label className="text-[10px] font-bold text-slate-500 uppercase mb-1 block">Incluso (1 por linha)</label>
                                                            <textarea 
                                                                rows={6}
                                                                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1.5 text-[10px] text-slate-300 focus:border-blue-500 outline-none resize-none leading-relaxed"
                                                                value={vault.plans[planKey].features.join('\n')}
                                                                onChange={e => updatePlan(planKey, 'features', e.target.value.split('\n'))}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            <div>
                                                <label className="text-[10px] font-bold text-slate-500 block mb-1 flex items-center gap-1">Desconto Anual (%) <span className="text-green-500 text-[9px]">Aplicado automaticamente</span></label>
                                                <div className="flex items-center gap-2">
                                                    <input type="range" min="0" max="50" step="5" className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer" value={vault.annualDiscountPercentage} onChange={e => updateVal('annualDiscountPercentage', Number(e.target.value))} />
                                                    <span className="text-xs font-bold text-white w-8 text-right">{vault.annualDiscountPercentage}%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Live Preview (Right) */}
                                <div className="w-1/2 bg-slate-900 rounded-2xl border-[10px] border-slate-800 shadow-2xl overflow-hidden relative flex flex-col">
                                    <div className="bg-slate-800 h-6 w-full flex items-center justify-center gap-1">
                                        <div className="w-1 h-1 rounded-full bg-slate-600"></div>
                                        <div className="w-12 h-1 rounded-full bg-slate-700"></div>
                                    </div>
                                    
                                    {previewMode === 'login' ? (
                                        <div className="flex-1 bg-white relative overflow-hidden flex transition-all">
                                            {/* Preview: SPLIT LAYOUT */}
                                            {vault.branding.loginLayout === 'split' && (
                                                <>
                                                    <div className="w-1/2 bg-slate-50 p-6 flex flex-col justify-center gap-4 relative z-10">
                                                        <div>
                                                            <div className="h-8 w-8 mb-4 object-contain" style={{backgroundImage: `url(${vault.branding.logoUrlLight || 'https://via.placeholder.com/32'})`, backgroundSize: 'contain', backgroundRepeat: 'no-repeat'}}></div>
                                                            <h3 className="text-lg font-bold text-slate-800 leading-tight">{vault.branding.landingPageSubheadline}</h3>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {vault.branding.loginBenefits.map((item, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                    <div className="w-6 h-6 rounded bg-white shadow-sm flex items-center justify-center shrink-0 text-blue-500" style={{color: vault.branding.primaryColor}}><Layout size={12}/></div>
                                                                    <div>
                                                                        <p className="text-xs font-bold text-slate-700">{item.title}</p>
                                                                        <p className="text-[10px] text-slate-500">{item.description}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="w-1/2 flex items-center justify-center p-4 bg-white">
                                                        <div className="w-full bg-white rounded-xl shadow-lg p-4 border border-slate-100">
                                                            <h4 className="text-lg font-bold text-slate-900 mb-1">{vault.branding.loginTitle}</h4>
                                                            <p className="text-xs text-slate-500 mb-4">{vault.branding.loginMessage}</p>
                                                            <div className="space-y-2">
                                                                <div className="h-8 bg-slate-100 rounded"></div>
                                                                <div className="h-8 bg-slate-100 rounded"></div>
                                                                <div className="h-8 rounded text-white text-xs font-bold flex items-center justify-center" style={{backgroundColor: vault.branding.primaryColor}}>Entrar</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </>
                                            )}

                                            {/* Preview: CENTER LAYOUT */}
                                            {vault.branding.loginLayout === 'center' && (
                                                <div className="w-full h-full flex items-center justify-center bg-slate-50 relative">
                                                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px'}}></div>
                                                    <div className="w-72 bg-white rounded-xl shadow-xl p-6 border border-slate-100 relative z-10 text-center">
                                                        <div className="h-10 w-10 mx-auto mb-4 bg-contain bg-no-repeat bg-center" style={{backgroundImage: `url(${vault.branding.logoUrlLight || 'https://via.placeholder.com/32'})`}}></div>
                                                        <h4 className="text-lg font-bold text-slate-900 mb-1">{vault.branding.loginTitle}</h4>
                                                        <p className="text-xs text-slate-500 mb-6">{vault.branding.loginMessage}</p>
                                                        <div className="space-y-3 text-left">
                                                            <div className="h-8 bg-slate-50 border border-slate-200 rounded"></div>
                                                            <div className="h-8 bg-slate-50 border border-slate-200 rounded"></div>
                                                            <div className="h-9 rounded text-white text-xs font-bold flex items-center justify-center shadow-md" style={{backgroundColor: vault.branding.primaryColor}}>Acessar Painel</div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        // Preview: DASHBOARD MINIATURE
                                        <div className="flex-1 bg-slate-100 flex overflow-hidden">
                                            {/* Sidebar Mini */}
                                            <div className="w-16 bg-white border-r border-slate-200 flex flex-col items-center py-3 gap-2">
                                                <div className="w-8 h-8 rounded-lg bg-slate-100 mb-2"></div>
                                                <div className="w-8 h-8 rounded-lg" style={{backgroundColor: vault.branding.primaryColor, opacity: 0.1, color: vault.branding.primaryColor}}><div className="w-full h-full flex items-center justify-center"><Layout size={14}/></div></div>
                                                <div className="w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center"><Smartphone size={14}/></div>
                                                <div className="w-8 h-8 rounded-lg text-slate-400 flex items-center justify-center"><Settings size={14}/></div>
                                            </div>
                                            {/* Content Mini */}
                                            <div className="flex-1 p-4">
                                                <div className="flex justify-between mb-4">
                                                    <div>
                                                        <div className="h-3 w-24 bg-slate-300 rounded mb-1"></div>
                                                        <div className="h-2 w-16 bg-slate-200 rounded"></div>
                                                    </div>
                                                    <div className="h-6 w-20 rounded shadow-sm text-[8px] text-white flex items-center justify-center font-bold" style={{backgroundColor: vault.branding.primaryColor}}>Novo Item</div>
                                                </div>
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="h-20 bg-white rounded-lg border border-slate-200 p-2">
                                                        <div className="h-6 w-6 rounded-full mb-2 bg-opacity-20 flex items-center justify-center" style={{backgroundColor: vault.branding.primaryColor + '33', color: vault.branding.primaryColor}}><Activity size={12}/></div>
                                                        <div className="h-2 w-10 bg-slate-200 rounded"></div>
                                                    </div>
                                                    <div className="h-20 bg-white rounded-lg border border-slate-200 p-2"></div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[10px] px-3 py-1 rounded-full shadow-lg opacity-80 pointer-events-none">
                                        Live Preview: {previewMode === 'login' ? `Login (${vault.branding.loginLayout})` : 'Dashboard'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* --- WEBHOOKS & SYSTEM (Keep existing styles but cleaner) --- */}
                    {(activeTab === 'webhooks' || activeTab === 'system') && (
                        <div className="max-w-4xl space-y-6 animate-in fade-in">
                            {activeTab === 'webhooks' ? (
                                <>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><Webhook className="text-purple-500"/> Roteamento de Eventos (N8N)</h2>
                                    <div className="space-y-3">
                                        <WebhookRow event="user.created" label="Novo Cadastro" objKey="webhook_user_signup" />
                                        <WebhookRow event="payment.success" label="Pagamento Aprovado" objKey="webhook_payment_success" />
                                        <WebhookRow event="instance.disconnected" label="Instância Desconectada" objKey="webhook_instance_error" />
                                        <WebhookRow event="ticket.created" label="Ticket Criado" objKey="webhook_ticket_created" />
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2 className="text-xl font-bold text-white flex items-center gap-3"><Settings className="text-red-500"/> System Flags</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <ToggleCard label="Modo Manutenção" desc="Bloqueia acesso geral" checked={vault.system_maintenance_mode} onChange={(v: boolean) => updateVal('system_maintenance_mode', v)} danger />
                                        <ToggleCard label="Novos Cadastros" desc="Permite criação de contas" checked={vault.allow_new_registrations} onChange={(v: boolean) => updateVal('allow_new_registrations', v)} />
                                        <ToggleCard label="Free Trial" desc="3 dias grátis auto" checked={vault.enable_free_trial} onChange={(v: boolean) => updateVal('enable_free_trial', v)} />
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* --- LOGS TERMINAL --- */}
                    {activeTab === 'logs' && (
                        <div className="h-full flex flex-col animate-in fade-in">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-bold text-white flex items-center gap-2"><Terminal className="text-green-500"/> System Logs</h2>
                                <button onClick={() => setLogs([])} className="text-xs text-slate-500 hover:text-white border border-slate-800 px-3 py-1 rounded">Clear Terminal</button>
                            </div>
                            <div className="flex-1 bg-black rounded-lg border border-slate-800 p-4 font-mono text-xs overflow-auto text-green-500 shadow-inner relative">
                                <div className="absolute top-2 right-4 text-[10px] text-slate-700">/var/log/syslog</div>
                                {logs.length === 0 && <span className="text-slate-700 italic">Listening for system events...</span>}
                                {logs.map((log, idx) => (
                                    <div key={idx} className="mb-1 break-all hover:bg-white/5 px-1 rounded">
                                        <span className={log.includes('[ERROR]') ? 'text-red-500' : log.includes('[SUCCESS]') ? 'text-green-400' : 'text-blue-400'}>
                                            {log}
                                        </span>
                                    </div>
                                ))}
                                <div className="mt-2 w-2 h-4 bg-green-500 animate-pulse inline-block align-middle"></div>
                            </div>
                        </div>
                    )}

                </div>
            </div>
        </div>
    );
};

export default MasterConsole;
