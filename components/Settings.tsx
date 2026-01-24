
import React, { useState } from 'react';
import { 
  User, Globe, Bell, Shield, Smartphone, Webhook, 
  Save, Upload, Eye, EyeOff, Copy, CheckCircle, AlertTriangle,
  Monitor, Moon, Sun, Key, Plug, Bot, Loader2, Lock, Terminal, Code, Trash2, Server, Plus,
  ChevronDown, ChevronRight, BookOpen, Layers, Activity, Play, XCircle, Mail, MessageSquare, Zap
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { supabase } from '../services/supabaseClient';
import * as authService from '../services/authService';
import { User as UserType } from '../types';

interface SettingsProps {
    currentUser: UserType;
}

const Settings: React.FC<SettingsProps> = ({ currentUser }) => {
  const { t, theme, toggleTheme, language, setLanguage, showToast } = useApp();
  // Default tab standard for non-devs
  const [activeTab, setActiveTab] = useState<'profile' | 'general' | 'notifications'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  
  // Permission Logic: Notifications hidden for Manager and Agent
  const canViewNotifications = currentUser.role === 'super_admin' || currentUser.role === 'developer';
  
  // Profile State
  const [profileData, setProfileData] = useState({ name: currentUser.name, email: currentUser.email, phone: '5511999999999' });
  
  // Notification State
  const [notifications, setNotifications] = useState({ 
      emailAlerts: true, 
      pushDisconnection: true, 
      marketingEmails: false,
      newLead: true,
      ticketAssign: true,
      weeklyReport: false
  });

  const handleSave = () => {
      setIsSaving(true);
      setTimeout(() => { setIsSaving(false); showToast('Configurações salvas!', 'success'); }, 1000);
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

  const ToggleSwitch = ({ checked, onChange }: { checked: boolean, onChange: () => void }) => (
      <button 
          onClick={onChange}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
              checked ? 'bg-blue-600' : 'bg-slate-200 dark:bg-slate-700'
          }`}
      >
          <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  checked ? 'translate-x-6' : 'translate-x-1'
              }`}
          />
      </button>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('settings')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie seu perfil e preferências.</p>
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
                {canViewNotifications && (
                    <SidebarItem id="notifications" label="Notificações" icon={Bell} />
                )}
            </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
            {activeTab === 'profile' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6 animate-in slide-in-from-right-4 fade-in">
                    <div className="flex items-center gap-6 pb-6 border-b border-slate-100 dark:border-slate-700">
                        <div className="relative group cursor-pointer">
                            <img src={currentUser.avatar} alt="Avatar" className="w-24 h-24 rounded-full border-4 border-slate-50 dark:border-slate-700 shadow-sm" />
                            <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <Upload className="text-white" size={24}/>
                            </div>
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-white">{currentUser.name}</h3>
                            <p className="text-slate-500 dark:text-slate-400 text-sm capitalize">{currentUser.role.replace('_', ' ')}</p>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
                            <input type="text" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" value={profileData.name} onChange={e => setProfileData({...profileData, name: e.target.value})} />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label>
                            <input type="email" className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 opacity-70 cursor-not-allowed" value={profileData.email} disabled />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button onClick={handleSave} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2.5 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity">
                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Salvar Alterações
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'general' && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 space-y-6 animate-in slide-in-from-right-4 fade-in">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">Preferências do Sistema</h3>
                    
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                    {theme === 'light' ? <Sun size={20} className="text-amber-500"/> : <Moon size={20} className="text-blue-400"/>}
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200">Tema da Interface</p>
                                    <p className="text-xs text-slate-500">Alternar entre claro e escuro.</p>
                                </div>
                            </div>
                            <button onClick={toggleTheme} className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold shadow-sm hover:bg-slate-50 dark:hover:bg-slate-600">
                                {theme === 'light' ? 'Modo Escuro' : 'Modo Claro'}
                            </button>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-100 dark:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-white dark:bg-slate-700 rounded-lg shadow-sm">
                                    <Globe size={20} className="text-indigo-500"/>
                                </div>
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200">Idioma</p>
                                    <p className="text-xs text-slate-500">Selecione o idioma da plataforma.</p>
                                </div>
                            </div>
                            <select 
                                value={language} 
                                onChange={(e) => setLanguage(e.target.value as any)}
                                className="px-4 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold shadow-sm outline-none"
                            >
                                <option value="pt-BR">Português (BR)</option>
                                <option value="en-US">English (US)</option>
                                <option value="es-ES">Español</option>
                            </select>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'notifications' && canViewNotifications && (
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-right-4 fade-in">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-700">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">Preferências de Notificação</h3>
                        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">Escolha como e quando você quer ser notificado.</p>
                    </div>
                    
                    <div className="divide-y divide-slate-100 dark:divide-slate-700">
                        {/* Group: Email */}
                        <div className="p-6 space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Mail size={14}/> Notificações por Email
                            </h4>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Alertas de Sistema</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Receba avisos sobre desconexões e erros críticos.</p>
                                </div>
                                <ToggleSwitch checked={notifications.emailAlerts} onChange={() => setNotifications({...notifications, emailAlerts: !notifications.emailAlerts})} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Relatório Semanal</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Resumo de performance da sua equipe toda segunda-feira.</p>
                                </div>
                                <ToggleSwitch checked={notifications.weeklyReport} onChange={() => setNotifications({...notifications, weeklyReport: !notifications.weeklyReport})} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Novidades e Dicas</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Atualizações sobre novas funcionalidades do FlowChat.</p>
                                </div>
                                <ToggleSwitch checked={notifications.marketingEmails} onChange={() => setNotifications({...notifications, marketingEmails: !notifications.marketingEmails})} />
                            </div>
                        </div>

                        {/* Group: Push / Realtime */}
                        <div className="p-6 space-y-6">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Bell size={14}/> Notificações Push (Navegador)
                            </h4>
                            
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Desconexão de Instância</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Alerta imediato quando um WhatsApp desconecta.</p>
                                </div>
                                <ToggleSwitch checked={notifications.pushDisconnection} onChange={() => setNotifications({...notifications, pushDisconnection: !notifications.pushDisconnection})} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Novos Leads</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Quando um novo contato inicia uma conversa.</p>
                                </div>
                                <ToggleSwitch checked={notifications.newLead} onChange={() => setNotifications({...notifications, newLead: !notifications.newLead})} />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-bold text-slate-700 dark:text-slate-200 text-sm">Atribuição de Conversa</p>
                                    <p className="text-xs text-slate-500 mt-0.5">Quando um ticket é atribuído a você.</p>
                                </div>
                                <ToggleSwitch checked={notifications.ticketAssign} onChange={() => setNotifications({...notifications, ticketAssign: !notifications.ticketAssign})} />
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                         <button onClick={handleSave} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-6 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 hover:opacity-90 transition-opacity text-sm">
                            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />} Salvar Preferências
                        </button>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
