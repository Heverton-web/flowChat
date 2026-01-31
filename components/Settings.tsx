
import React, { useState, useEffect } from 'react';
import { 
  User, Globe, Bell, Shield, Smartphone, Webhook, 
  Save, Upload, Eye, EyeOff, Copy, CheckCircle, AlertTriangle,
  Monitor, Moon, Sun, Key, Plug, Bot, Loader2, Lock, Terminal, Code, Trash2, Server, Plus,
  ChevronDown, ChevronRight, BookOpen, Layers, Activity, Play, XCircle, Mail, MessageSquare, Zap,
  LogOut, Laptop, Smartphone as MobileIcon, Hash, RefreshCw, Settings as SettingsIcon
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../services/supabaseClient';
import * as authService from '../services/authService';
import { User as UserType } from '../types';

interface SettingsProps {
    currentUser: UserType;
}

// Mock Data for Active Sessions
const MOCK_SESSIONS = [
    { id: 1, device: 'Chrome no Windows', ip: '201.10.120.33', location: 'São Paulo, BR', current: true, icon: Laptop },
    { id: 2, device: 'Safari no iPhone 14', ip: '187.32.10.5', location: 'Rio de Janeiro, BR', current: false, icon: MobileIcon },
];

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const { t, theme, toggleTheme, language, setLanguage, showToast, config } = useApp();
  
  // Permission Logic
  const roleVis = (config.visibility as any)[currentUser.role] || config.visibility.super_admin;
  
  // Navigation State (Default to first available tab)
  const getDefaultTab = () => {
      if (roleVis.settings_profile) return 'profile';
      if (roleVis.settings_security) return 'security';
      if (roleVis.settings_notifications) return 'notifications';
      if (roleVis.settings_integrations) return 'integrations';
      return 'profile';
  };

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'notifications' | 'integrations'>(getDefaultTab());
  
  // Loading States
  const [isSaving, setIsSaving] = useState(false);
  const [isRevoking, setIsRevoking] = useState<number | null>(null);

  // Forms State
  const [profileData, setProfileData] = useState({ name: currentUser.name, email: currentUser.email, phone: '5511999999999', bio: 'Gerente de Atendimento' });
  const [securityData, setSecurityData] = useState({ currentPass: '', newPass: '', confirmPass: '', twoFactor: false });
  const [notifications, setNotifications] = useState({ 
      emailAlerts: true, pushDisconnection: true, marketingEmails: false, newLead: true, ticketAssign: true, weeklyReport: false 
  });
  
  // API Key State
  const [apiKey, setApiKey] = useState('sk_live_51M...');
  const [showKey, setShowKey] = useState(false);

  // Handlers
  const handleSave = () => {
      setIsSaving(true);
      // Simulate API call
      setTimeout(() => { setIsSaving(false); showToast('Configurações salvas com sucesso!', 'success'); }, 1000);
  };

  const handleRevokeSession = (id: number) => {
      setIsRevoking(id);
      setTimeout(() => {
          setIsRevoking(null);
          showToast('Sessão desconectada.', 'success');
          // In real app, remove from list
      }, 800);
  };

  const regenerateKey = () => {
      if(!window.confirm('Tem certeza? Isso invalidará a chave anterior em todas as integrações.')) return;
      setApiKey(`sk_live_${Math.random().toString(36).substr(2, 18)}`);
      showToast('Nova chave de API gerada.', 'success');
  };

  // Components
  const SidebarItem = ({ id, label, icon: Icon, description }: { id: typeof activeTab, label: string, icon: any, description?: string }) => (
      <button 
          onClick={() => setActiveTab(id)}
          className={`w-full flex items-center gap-3 px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group text-left relative overflow-hidden ${
              activeTab === id 
              ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
          }`}
      >
          <Icon size={20} className={`shrink-0 ${activeTab === id ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`} />
          <div className="flex flex-col">
              <span>{label}</span>
              {description && activeTab !== id && <span className="text-[10px] opacity-70 font-normal hidden lg:block">{description}</span>}
          </div>
          {activeTab === id && <div className="absolute right-0 top-0 bottom-0 w-1 bg-white/20"></div>}
      </button>
  );

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
      <button 
          onClick={onChange}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
          }`}
      >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-6' : 'translate-x-1'}`}/>
      </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-24">
      
      {/* Header */}
      <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <SettingsIcon className="text-blue-600" size={24}/>
              {t('settings')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie suas preferências, segurança e integrações.</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* SIDEBAR NAVIGATION */}
        <div className="w-full lg:w-72 flex-shrink-0">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden sticky top-6">
                
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                            {currentUser.name.charAt(0)}
                        </div>
                        <div className="overflow-hidden">
                            <h4 className="font-bold text-slate-800 dark:text-white truncate text-sm">{currentUser.name}</h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{currentUser.role.replace('_', ' ')}</p>
                        </div>
                    </div>
                </div>

                <div className="p-2 space-y-1">
                    {(roleVis.settings_profile || roleVis.settings_security || roleVis.settings_notifications) && (
                        <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Minha Conta</p>
                    )}
                    
                    {roleVis.settings_profile && <SidebarItem id="profile" label="Perfil & Aparência" icon={User} description="Dados pessoais e tema" />}
                    {roleVis.settings_security && <SidebarItem id="security" label="Login & Segurança" icon={Shield} description="Senha e sessões" />}
                    {roleVis.settings_notifications && <SidebarItem id="notifications" label="Notificações" icon={Bell} description="Emails e alertas" />}
                    
                    {roleVis.settings_integrations && (
                        <>
                            <div className="my-2 border-t border-slate-100 dark:border-slate-700 mx-2"></div>
                            <p className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Espaço de Trabalho</p>
                            <SidebarItem id="integrations" label="Integrações & API" icon={Plug} description="Chaves e webhooks" />
                        </>
                    )}
                </div>
            </div>
        </div>

        {/* CONTENT AREA */}
        <div className="flex-1 min-w-0 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
            
            {/* --- TAB: PROFILE --- */}
            {activeTab === 'profile' && roleVis.settings_profile && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Perfil Público</h3>
                        <button onClick={handleSave} disabled={isSaving} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                            {isSaving ? <Loader2 className="animate-spin" size={16}/> : <Save size={16}/>} Salvar
                        </button>
                    </div>
                    
                    <div className="p-8 space-y-8">
                        {/* Avatar Upload */}
                        <div className="flex items-center gap-6">
                            <div className="relative group cursor-pointer">
                                <img src={currentUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100 dark:border-slate-700 group-hover:opacity-70 transition-opacity" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-black/50 text-white p-2 rounded-full"><Upload size={20}/></div>
                                </div>
                            </div>
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white">Sua Foto</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">Isso será exibido no seu perfil.</p>
                                <div className="flex gap-2">
                                    <button className="px-3 py-1.5 border border-slate-200 dark:border-slate-600 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700">Alterar</button>
                                    <button className="px-3 py-1.5 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">Remover</button>
                                </div>
                            </div>
                        </div>

                        {/* Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Nome Completo</label>
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Cargo / Função</label>
                                <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={profileData.bio} onChange={e => setProfileData({...profileData, bio: e.target.value})} />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Email (Login)</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <input type="email" className="w-full pl-10 pr-4 py-2.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none text-slate-500 cursor-not-allowed" value={profileData.email} disabled />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">Telefone</label>
                                <div className="relative">
                                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" value={profileData.phone} onChange={e => setProfileData({...profileData, phone: e.target.value})} />
                                </div>
                            </div>
                        </div>

                        {/* Appearance */}
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-6">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Aparência do Sistema</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button onClick={() => theme === 'dark' && toggleTheme()} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                    <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm text-amber-500"><Sun size={20}/></div>
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-slate-800 dark:text-white">Modo Claro</span>
                                        <span className="text-xs text-slate-500">Visual padrão, alto brilho.</span>
                                    </div>
                                    {theme === 'light' && <CheckCircle size={18} className="ml-auto text-blue-600"/>}
                                </button>
                                <button onClick={() => theme === 'light' && toggleTheme()} className={`p-4 rounded-xl border flex items-center gap-3 transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                    <div className="p-2 bg-slate-800 rounded-lg shadow-sm text-blue-400"><Moon size={20}/></div>
                                    <div className="text-left">
                                        <span className="block text-sm font-bold text-slate-800 dark:text-white">Modo Escuro</span>
                                        <span className="text-xs text-slate-500">Conforto visual para noite.</span>
                                    </div>
                                    {theme === 'dark' && <CheckCircle size={18} className="ml-auto text-blue-600"/>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: SECURITY --- */}
            {activeTab === 'security' && roleVis.settings_security && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Segurança e Login</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Proteja sua conta e gerencie acessos.</p>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* Change Password */}
                        <div className="max-w-2xl">
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Key size={18} className="text-slate-400"/> Alterar Senha</h4>
                            <div className="space-y-4">
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <input type="password" placeholder="Senha Atual" className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm" value={securityData.currentPass} onChange={e => setSecurityData({...securityData, currentPass: e.target.value})} />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <input type="password" placeholder="Nova Senha" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm" value={securityData.newPass} onChange={e => setSecurityData({...securityData, newPass: e.target.value})} />
                                    <input type="password" placeholder="Confirmar Nova Senha" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white text-sm" value={securityData.confirmPass} onChange={e => setSecurityData({...securityData, confirmPass: e.target.value})} />
                                </div>
                                <button onClick={handleSave} className="text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 dark:bg-slate-700 dark:hover:bg-slate-600 px-4 py-2 rounded-lg transition-colors">Atualizar Senha</button>
                            </div>
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                        {/* 2FA */}
                        <div className="flex items-start justify-between">
                            <div>
                                <h4 className="font-bold text-slate-800 dark:text-white mb-1">Autenticação de Dois Fatores (2FA)</h4>
                                <p className="text-sm text-slate-500 dark:text-slate-400 max-w-md">Adicione uma camada extra de segurança. Exigiremos um código do seu app autenticador ao entrar.</p>
                            </div>
                            <ToggleSwitch checked={securityData.twoFactor} onChange={() => setSecurityData({...securityData, twoFactor: !securityData.twoFactor})} />
                        </div>

                        <div className="h-px bg-slate-100 dark:bg-slate-700"></div>

                        {/* Active Sessions */}
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4">Sessões Ativas</h4>
                            <div className="space-y-3">
                                {MOCK_SESSIONS.map(session => (
                                    <div key={session.id} className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-700 rounded-xl">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-slate-500">
                                                <session.icon size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                                    {session.device}
                                                    {session.current && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Atual</span>}
                                                </p>
                                                <p className="text-xs text-slate-500">{session.location} • {session.ip}</p>
                                            </div>
                                        </div>
                                        {!session.current && (
                                            <button onClick={() => handleRevokeSession(session.id)} className="text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                                {isRevoking === session.id ? <Loader2 size={12} className="animate-spin"/> : <LogOut size={12}/>}
                                                Sair
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: NOTIFICATIONS --- */}
            {activeTab === 'notifications' && roleVis.settings_notifications && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Preferências de Notificação</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Escolha o que é importante para você.</p>
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        <div className="p-6 space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Mail size={14}/> Notificações por Email
                            </h4>
                            <div className="flex items-center justify-between">
                                <div><p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Alertas de Sistema</p><p className="text-xs text-slate-500">Avisos sobre desconexões e erros.</p></div>
                                <ToggleSwitch checked={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div><p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Relatório Semanal</p><p className="text-xs text-slate-500">Resumo de performance da equipe.</p></div>
                                <ToggleSwitch checked={notifications.weeklyReport} onChange={() => setNotifications({...notifications, weeklyReport: !notifications.weeklyReport})} />
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Bell size={14}/> Notificações Push
                            </h4>
                            <div className="flex items-center justify-between">
                                <div><p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Novos Leads</p><p className="text-xs text-slate-500">Quando um novo contato inicia conversa.</p></div>
                                <ToggleSwitch checked={notifications.newLead} onChange={() => setNotifications({...notifications, newLead: !notifications.newLead})} />
                            </div>
                            <div className="flex items-center justify-between">
                                <div><p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Atribuição de Ticket</p><p className="text-xs text-slate-500">Quando uma conversa é atribuída a você.</p></div>
                                <ToggleSwitch checked={notifications.ticketAssign} onChange={() => setNotifications({...notifications, ticketAssign: !notifications.ticketAssign})} />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- TAB: INTEGRATIONS (MANAGER ONLY OR ALLOWED) --- */}
            {activeTab === 'integrations' && roleVis.settings_integrations && (
                <div className="animate-in slide-in-from-right-4 fade-in">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Integrações & API</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Conecte o Disparai a ferramentas externas (Zapier, n8n, Typebot).</p>
                    </div>

                    <div className="p-8 space-y-8">
                        {/* API Key Card */}
                        <div className="bg-slate-900 text-white p-6 rounded-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-2 mb-4">
                                    <div className="p-2 bg-blue-500/20 rounded-lg"><Terminal size={20} className="text-blue-400"/></div>
                                    <h4 className="font-bold text-lg">Chave de API Pessoal</h4>
                                </div>
                                <p className="text-slate-400 text-sm mb-4 max-w-lg">Use esta chave para autenticar requisições na nossa API REST. Mantenha-a segura e não compartilhe em código client-side.</p>
                                
                                <div className="flex items-center gap-2 bg-black/30 p-2 rounded-lg border border-white/10">
                                    <code className="flex-1 font-mono text-xs text-green-400 px-2 truncate">
                                        {showKey ? apiKey : '•'.repeat(32)}
                                    </code>
                                    <button onClick={() => setShowKey(!showKey)} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"><Eye size={16}/></button>
                                    <button onClick={() => {navigator.clipboard.writeText(apiKey); showToast('Copiado!', 'success')}} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-slate-400 hover:text-white"><Copy size={16}/></button>
                                </div>
                                
                                <div className="mt-4 flex gap-4">
                                    <button onClick={regenerateKey} className="text-xs font-bold text-red-400 hover:text-red-300 flex items-center gap-1"><RefreshCw size={12}/> Redefinir Chave</button>
                                    <a href="#" className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1"><BookOpen size={12}/> Documentação da API</a>
                                </div>
                            </div>
                        </div>

                        {/* Webhooks Config */}
                        <div>
                            <h4 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Webhook size={18} className="text-purple-500"/> Webhooks Globais</h4>
                            <div className="space-y-4">
                                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-sm text-slate-700 dark:text-white">Recebimento de Mensagens</p>
                                            <p className="text-xs text-slate-500">Evento: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-purple-600">message.created</code></p>
                                        </div>
                                        <ToggleSwitch checked={true} onChange={() => {}} />
                                    </div>
                                    <input type="text" placeholder="https://seu-endpoint.com/webhook" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono outline-none focus:border-purple-500" />
                                </div>
                                <div className="p-4 border border-slate-200 dark:border-slate-700 rounded-xl bg-slate-50 dark:bg-slate-900/30 opacity-60">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <p className="font-bold text-sm text-slate-700 dark:text-white">Status de Instância</p>
                                            <p className="text-xs text-slate-500">Evento: <code className="bg-slate-200 dark:bg-slate-800 px-1 rounded text-purple-600">instance.update</code></p>
                                        </div>
                                        <ToggleSwitch checked={false} onChange={() => {}} />
                                    </div>
                                    <input type="text" disabled placeholder="https://seu-endpoint.com/webhook" className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2 text-xs font-mono outline-none" />
                                </div>
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
