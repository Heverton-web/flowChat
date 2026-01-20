
import React, { useState } from 'react';
import { 
  User, Globe, Bell, Shield, Smartphone, Webhook, 
  Save, Upload, Eye, EyeOff, Copy, CheckCircle, AlertTriangle,
  Monitor, Moon, Sun, Key, Plug, Bot, Loader2, Lock, Terminal, Code, Trash2, Server, Plus,
  ChevronDown, ChevronRight, BookOpen, Layers
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// --- MOCK DOCUMENTATION DATA ---
const API_DOCS = [
    {
        category: 'Mensagens',
        endpoints: [
            {
                method: 'POST',
                path: '/messages/send',
                title: 'Enviar Texto',
                desc: 'Envia uma mensagem de texto simples para um número.',
                body: {
                    number: "5511999998888",
                    text: "Olá! Sua encomenda chegou.",
                    delay: 1200
                },
                response: {
                    id: "msg_123xyz",
                    status: "PENDING",
                    timestamp: "2023-10-27T10:00:00Z"
                }
            },
            {
                method: 'POST',
                path: '/messages/media',
                title: 'Enviar Mídia',
                desc: 'Envia imagem, vídeo ou documento via URL.',
                body: {
                    number: "5511999998888",
                    mediaUrl: "https://exemplo.com/fatura.pdf",
                    mediaType: "document",
                    caption: "Segue sua fatura."
                },
                response: {
                    id: "msg_456abc",
                    status: "PENDING"
                }
            }
        ]
    },
    {
        category: 'Instâncias',
        endpoints: [
            {
                method: 'GET',
                path: '/instances/status',
                title: 'Verificar Status',
                desc: 'Retorna o estado de conexão da instância atual.',
                body: null,
                response: {
                    instanceId: "inst_001",
                    status: "CONNECTED",
                    battery: 85,
                    phone: "5511999998888"
                }
            },
            {
                method: 'POST',
                path: '/instances/restart',
                title: 'Reiniciar Serviço',
                desc: 'Força o reinício do serviço de conexão com o WhatsApp.',
                body: {},
                response: { success: true, message: "Restarting..." }
            }
        ]
    }
];

const Settings: React.FC = () => {
  const { t, theme, toggleTheme, language, setLanguage, showToast } = useApp();
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'notifications' | 'integrations' | 'api'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // Profile State
  const [profileData, setProfileData] = useState({ name: 'Gestor Admin', email: 'admin@enterprise.com', phone: '5511999999999' });
  
  // Integration State
  const [evolutionConfig, setEvolutionConfig] = useState({ url: 'https://api.evolution.com', key: 'global-api-key-secret' });
  const [showKey, setShowKey] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('https://n8n.minhaempresa.com/webhook/whatsapp');

  // API Tab State
  const [apiTokens, setApiTokens] = useState([
      { id: '1', name: 'Integração N8N', prefix: 'sk_live_9283...', created: '20/10/2023', lastUsed: 'Há 2 min' },
      { id: '2', name: 'App Mobile CRM', prefix: 'sk_live_1029...', created: '15/11/2023', lastUsed: 'Há 5 horas' }
  ]);
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);

  // Notification State
  const [notifications, setNotifications] = useState({
      emailAlerts: true,
      pushDisconnection: true,
      marketingEmails: false
  });

  const handleSave = () => {
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => {
          setIsSaving(false);
          showToast('Configurações salvas com sucesso!', 'success');
      }, 1000);
  };

  const handleGenerateToken = () => {
      setIsSaving(true);
      setTimeout(() => {
          const newToken = { id: Math.random().toString(), name: 'Nova Chave API', prefix: `sk_live_${Math.floor(Math.random()*1000)}...`, created: 'Agora', lastUsed: '-' };
          setApiTokens([...apiTokens, newToken]);
          setIsSaving(false);
          showToast('Nova chave de API gerada!', 'success');
      }, 800);
  };

  const handleDeleteToken = (id: string) => {
      setApiTokens(apiTokens.filter(t => t.id !== id));
      showToast('Chave revogada.', 'success');
  };

  const SidebarItem = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
      <button 
          onClick={() => setActiveTab(id)}
          className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all duration-200 ${
              activeTab === id 
              ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
      >
          <Icon size={18} className={activeTab === id ? 'text-blue-600 dark:text-blue-400' : 'opacity-70'} />
          {label}
      </button>
  );

  const MethodBadge = ({ method }: { method: string }) => {
      const colors: any = {
          'GET': 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 border-blue-200 dark:border-blue-800',
          'POST': 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300 border-green-200 dark:border-green-800',
          'DELETE': 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300 border-red-200 dark:border-red-800',
          'PUT': 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 border-amber-200 dark:border-amber-800',
      };
      return (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${colors[method] || 'bg-gray-100'}`}>
              {method}
          </span>
      );
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('settings')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seu perfil, preferências e conexões do sistema.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        
        {/* Sidebar Navigation */}
        <div className="w-full lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-3 flex flex-col gap-1 sticky top-6">
                <div className="px-4 py-3 mb-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Conta</h3>
                </div>
                <SidebarItem id="profile" label="Meu Perfil" icon={User} />
                <SidebarItem id="general" label={t('general')} icon={Globe} />
                <SidebarItem id="notifications" label="Notificações" icon={Bell} />
                
                <div className="px-4 py-3 mb-2 mt-4">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sistema</h3>
                </div>
                <SidebarItem id="integrations" label={t('integrations')} icon={Plug} />
                <SidebarItem id="api" label="Developer API" icon={Terminal} />
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
            
            {/* --- PROFILE TAB --- */}
            {activeTab === 'profile' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        <div className="flex items-start gap-6 mb-8">
                            <div className="relative group cursor-pointer">
                                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 overflow-hidden border-4 border-white dark:border-slate-600 shadow-md">
                                    <img src={`https://ui-avatars.com/api/?name=${profileData.name.replace(' ','+')}&background=0D8ABC&color=fff&size=128`} alt="Profile" className="w-full h-full object-cover" />
                                </div>
                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Upload className="text-white" size={24} />
                                </div>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-slate-800 dark:text-white">{profileData.name}</h3>
                                <p className="text-slate-500 dark:text-slate-400 text-sm">Administrador Global</p>
                                <button className="mt-2 text-sm text-blue-600 font-bold hover:underline">Alterar Foto</button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    value={profileData.name}
                                    onChange={e => setProfileData({...profileData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                                <input 
                                    type="email" 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white disabled:opacity-70 disabled:cursor-not-allowed"
                                    value={profileData.email}
                                    disabled
                                />
                                <p className="text-xs text-slate-400 flex items-center gap-1"><Shield size={10}/> Email gerenciado pela organização</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Telefone</label>
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                                    value={profileData.phone}
                                    onChange={e => setProfileData({...profileData, phone: e.target.value})}
                                />
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700">
                            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                <Lock size={16}/> Segurança
                            </h4>
                            <button className="text-sm text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1">
                                Redefinir Senha
                            </button>
                        </div>

                        <div className="mt-8 pt-6 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                            <button onClick={handleSave} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all hover:-translate-y-0.5">
                                {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} 
                                Salvar Alterações
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    {/* Theme Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Monitor size={20} className="text-blue-500"/> Aparência
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Personalize como o FlowChat se apresenta para você.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <button 
                                onClick={() => theme === 'dark' && toggleTheme()}
                                className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500'}`}
                            >
                                <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-white text-blue-600 shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                    <Sun size={24} />
                                </div>
                                <div className="text-left">
                                    <span className={`block font-bold ${theme === 'light' ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{t('light')}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-500">Claro e nítido</span>
                                </div>
                                {theme === 'light' && <CheckCircle size={20} className="ml-auto text-blue-600" />}
                            </button>

                            <button 
                                onClick={() => theme === 'light' && toggleTheme()}
                                className={`group flex items-center gap-4 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500'}`}
                            >
                                <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-slate-900 text-blue-400 shadow-sm' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                    <Moon size={24} />
                                </div>
                                <div className="text-left">
                                    <span className={`block font-bold ${theme === 'dark' ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{t('dark')}</span>
                                    <span className="text-xs text-slate-500 dark:text-slate-500">Escuro e confortável</span>
                                </div>
                                {theme === 'dark' && <CheckCircle size={20} className="ml-auto text-blue-500" />}
                            </button>
                        </div>
                    </div>

                    {/* Language Section */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Globe size={20} className="text-blue-500"/> Idioma e Região
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400">Selecione o idioma da interface.</p>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {[
                                { code: 'pt-BR', label: 'Português', flag: '🇧🇷' },
                                { code: 'en-US', label: 'English', flag: '🇺🇸' },
                                { code: 'es-ES', label: 'Español', flag: '🇪🇸' },
                                { code: 'pt-PT', label: 'Português (PT)', flag: '🇵🇹' }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code as any)}
                                    className={`flex flex-col items-center justify-center p-4 rounded-xl border transition-all ${language === lang.code ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-700 hover:border-green-300 dark:hover:border-slate-500 bg-slate-50 dark:bg-slate-900'}`}
                                >
                                    <span className="text-2xl mb-2">{lang.flag}</span>
                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{lang.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- NOTIFICATIONS TAB --- */}
            {activeTab === 'notifications' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                            <Bell size={20} className="text-blue-500"/> Preferências de Alerta
                        </h3>
                        
                        <div className="space-y-6">
                            {[
                                { id: 'emailAlerts', label: 'Alertas por Email', desc: 'Receba resumos semanais e alertas críticos via email.' },
                                { id: 'pushDisconnection', label: 'Alerta de Desconexão', desc: 'Notifique imediatamente se uma instância do WhatsApp cair.' },
                                { id: 'marketingEmails', label: 'Novidades e Dicas', desc: 'Receba dicas de uso e novidades sobre atualizações da plataforma.' }
                            ].map((item) => (
                                <div key={item.id} className="flex items-start justify-between pb-6 border-b border-slate-100 dark:border-slate-700 last:border-0 last:pb-0">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm">{item.label}</h4>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md">{item.desc}</p>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input 
                                            type="checkbox" 
                                            className="sr-only peer" 
                                            checked={(notifications as any)[item.id]}
                                            onChange={() => setNotifications(prev => ({ ...prev, [item.id]: !(prev as any)[item.id] }))}
                                        />
                                        <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* --- INTEGRATIONS TAB --- */}
            {activeTab === 'integrations' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    
                    {/* Evolution API Configuration */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <div className="flex justify-between items-start mb-6 relative z-10">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                    <Smartphone size={20} className="text-green-500"/> Evolution API (WhatsApp)
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Configuração da infraestrutura de envio.</p>
                            </div>
                            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full text-xs font-bold flex items-center gap-1">
                                <CheckCircle size={12}/> Conectado
                            </span>
                        </div>

                        <div className="grid grid-cols-1 gap-6 relative z-10">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">URL da API</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full pl-4 pr-10 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm dark:text-white"
                                        value={evolutionConfig.url}
                                        onChange={e => setEvolutionConfig({...evolutionConfig, url: e.target.value})}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                                        <CheckCircle size={16} />
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Global API Key</label>
                                <div className="relative">
                                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                    <input 
                                        type={showKey ? "text" : "password"}
                                        className="w-full pl-10 pr-24 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-green-500 outline-none font-mono text-sm dark:text-white"
                                        value={evolutionConfig.key}
                                        onChange={e => setEvolutionConfig({...evolutionConfig, key: e.target.value})}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                                        <button onClick={() => setShowKey(!showKey)} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors">
                                            {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                        <button className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors" onClick={() => showToast('Copiado!', 'success')}>
                                            <Copy size={16} />
                                        </button>
                                    </div>
                                </div>
                                <p className="text-xs text-slate-400 flex items-center gap-1 mt-1">
                                    <AlertTriangle size={10} /> Não compartilhe esta chave com ninguém.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Webhook Configuration */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        <div className="mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Webhook size={20} className="text-indigo-500"/> Webhooks Globais
                            </h3>
                            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                                Envie eventos de todas as instâncias para um endpoint externo (ex: n8n, Typebot).
                            </p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 font-bold mb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" defaultChecked />
                                    Ativar Webhook Global
                                </label>
                            </div>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-mono text-sm dark:text-white"
                                    value={webhookUrl}
                                    onChange={e => setWebhookUrl(e.target.value)}
                                    placeholder="https://seu-endpoint.com/webhook"
                                />
                            </div>
                            <div className="flex gap-2 text-xs">
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">MESSAGES_UPSERT</span>
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">MESSAGES_UPDATE</span>
                                <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">SEND_MESSAGE</span>
                            </div>
                        </div>
                    </div>

                    {/* External Integrations */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center hover:border-orange-300 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center justify-center text-orange-600 mb-3 group-hover:scale-110 transition-transform">
                                <Bot size={28} />
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-white">Typebot</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Fluxos de conversa avançados e automação visual.</p>
                            <button className="px-4 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold group-hover:bg-orange-600 group-hover:text-white transition-colors">Configurar</button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col items-center text-center hover:border-blue-300 transition-colors cursor-pointer group">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 mb-3 group-hover:scale-110 transition-transform">
                                <Webhook size={28} />
                            </div>
                            <h4 className="font-bold text-slate-800 dark:text-white">n8n / Webhooks</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Integre com milhares de apps via workflows.</p>
                            <button className="px-4 py-1.5 bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">Configurar</button>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-8 py-3 rounded-xl font-bold shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                            {isSaving ? <Loader2 className="animate-spin" size={18}/> : <Save size={18} />} 
                            Salvar Configurações
                        </button>
                    </div>
                </div>
            )}

            {/* --- API & DEVELOPERS TAB --- */}
            {activeTab === 'api' && (
                <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    
                    {/* Header */}
                    <div className="bg-slate-900 dark:bg-slate-800 p-8 rounded-2xl shadow-sm border border-slate-700 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-3 bg-indigo-500/20 rounded-xl text-indigo-400">
                                    <Terminal size={24} />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Centro do Desenvolvedor</h3>
                            </div>
                            <p className="text-slate-300 max-w-2xl text-sm">
                                Gerencie seus tokens de acesso e explore a documentação completa da API REST.
                            </p>
                        </div>
                    </div>

                    {/* Token Management */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Key size={20} className="text-indigo-500"/> Tokens de Acesso
                            </h3>
                            <button 
                                onClick={handleGenerateToken} 
                                disabled={isSaving}
                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                            >
                                {isSaving ? <Loader2 className="animate-spin" size={14}/> : <Plus size={14}/>} Gerar Novo Token
                            </button>
                        </div>

                        <div className="space-y-3">
                            {apiTokens.map((token) => (
                                <div key={token.id} className="flex flex-col md:flex-row items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700 gap-4">
                                    <div className="flex items-center gap-4 w-full md:w-auto">
                                        <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm border border-slate-100 dark:border-slate-600">
                                            <Code size={18} className="text-slate-500 dark:text-slate-300"/>
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white text-sm">{token.name}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="font-mono text-xs text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600">{token.prefix}</span>
                                                <span className="text-[10px] text-slate-400">Criado em: {token.created}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 w-full md:w-auto justify-end">
                                        <span className="text-[10px] text-slate-400 hidden md:block">Último uso: {token.lastUsed}</span>
                                        <button 
                                            onClick={() => handleDeleteToken(token.id)}
                                            className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 p-2 rounded-lg transition-colors text-xs font-bold flex items-center gap-1"
                                        >
                                            <Trash2 size={14}/> Revogar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Interactive Documentation */}
                    <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                            <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <BookOpen size={20} className="text-emerald-500"/> Documentação Interativa
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                                Explore os endpoints, veja exemplos de requisição e teste suas integrações.
                            </p>
                        </div>
                        
                        <div className="flex flex-col md:flex-row">
                            {/* Base URL Info (Sticky on Desktop) */}
                            <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 p-6 bg-white dark:bg-slate-800">
                                <div className="space-y-6 sticky top-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Base URL</label>
                                        <div className="flex items-center gap-2">
                                            <code className="flex-1 bg-slate-100 dark:bg-slate-900 p-2 rounded border border-slate-200 dark:border-slate-700 font-mono text-xs text-slate-600 dark:text-slate-300 overflow-x-auto whitespace-nowrap">
                                                https://api.flowchat.com/v1
                                            </code>
                                            <button 
                                                className="p-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                                                onClick={() => showToast('URL copiada!', 'success')}
                                            >
                                                <Copy size={14} className="text-slate-500 dark:text-slate-300" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Autenticação</label>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                            Todas as requisições devem incluir o cabeçalho <code>Authorization</code> com seu token.
                                        </p>
                                        <div className="bg-slate-900 p-3 rounded-lg text-xs font-mono text-slate-300 border border-slate-800">
                                            Authorization: Bearer sk_live_...
                                        </div>
                                    </div>

                                    <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                                        <button className="text-indigo-600 dark:text-indigo-400 text-xs font-bold flex items-center gap-1 hover:underline">
                                            Ver Referência Completa <Globe size={12}/>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Endpoints List */}
                            <div className="flex-1 bg-slate-50/50 dark:bg-slate-900/20">
                                {API_DOCS.map((section, idx) => (
                                    <div key={idx} className="border-b border-slate-100 dark:border-slate-700 last:border-0">
                                        <div className="px-6 py-3 bg-slate-100/50 dark:bg-slate-800/50 border-y border-slate-100 dark:border-slate-700 first:border-t-0">
                                            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                                                <Layers size={14}/> {section.category}
                                            </h4>
                                        </div>
                                        <div>
                                            {section.endpoints.map((endpoint, eIdx) => {
                                                const isOpen = expandedEndpoint === endpoint.path;
                                                return (
                                                    <div key={eIdx} className="border-b border-slate-100 dark:border-slate-700 last:border-0 bg-white dark:bg-slate-800">
                                                        <button 
                                                            onClick={() => setExpandedEndpoint(isOpen ? null : endpoint.path)}
                                                            className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors text-left"
                                                        >
                                                            <div className="flex items-center gap-4">
                                                                <MethodBadge method={endpoint.method} />
                                                                <span className="font-mono text-xs text-slate-600 dark:text-slate-300">{endpoint.path}</span>
                                                                <span className="text-sm font-medium text-slate-800 dark:text-white">{endpoint.title}</span>
                                                            </div>
                                                            {isOpen ? <ChevronDown size={16} className="text-slate-400"/> : <ChevronRight size={16} className="text-slate-400"/>}
                                                        </button>
                                                        
                                                        {isOpen && (
                                                            <div className="px-6 pb-6 pt-2 animate-in slide-in-from-top-2">
                                                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">{endpoint.desc}</p>
                                                                
                                                                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                                                                    {endpoint.body && (
                                                                        <div className="space-y-2">
                                                                            <div className="flex justify-between items-center">
                                                                                <label className="text-[10px] font-bold text-slate-400 uppercase">Body (JSON)</label>
                                                                                <button onClick={() => {navigator.clipboard.writeText(JSON.stringify(endpoint.body, null, 2)); showToast('JSON Copiado!', 'success')}} className="text-[10px] text-blue-500 hover:underline">Copiar</button>
                                                                            </div>
                                                                            <pre className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg p-3 text-[10px] font-mono text-slate-700 dark:text-slate-300 overflow-x-auto">
                                                                                {JSON.stringify(endpoint.body, null, 2)}
                                                                            </pre>
                                                                        </div>
                                                                    )}
                                                                    
                                                                    <div className="space-y-2">
                                                                        <div className="flex justify-between items-center">
                                                                            <label className="text-[10px] font-bold text-slate-400 uppercase">Exemplo de Resposta</label>
                                                                        </div>
                                                                        <pre className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-[10px] font-mono text-green-400 overflow-x-auto">
                                                                            {JSON.stringify(endpoint.response, null, 2)}
                                                                        </pre>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
