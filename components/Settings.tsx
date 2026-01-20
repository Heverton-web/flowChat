
import React, { useState } from 'react';
import { Smartphone, Moon, Sun, Monitor, Globe } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

const Settings: React.FC = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  const [activeTab, setActiveTab] = useState<'general' | 'integrations'>('general');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('settings')}</h2>
          <p className="text-slate-500 dark:text-slate-400">Gerencie preferências da conta e integrações do sistema.</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col md:flex-row min-h-[600px] transition-colors duration-300">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-50 dark:bg-slate-850 border-r border-slate-200 dark:border-slate-700 p-4 flex flex-col gap-1">
            <button 
                onClick={() => setActiveTab('general')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'general' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <Globe size={18} />
                {t('general')}
            </button>
            <button 
                onClick={() => setActiveTab('integrations')}
                className={`flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-lg transition-colors ${activeTab === 'integrations' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm ring-1 ring-slate-200 dark:ring-slate-600' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'}`}
            >
                <Smartphone size={18} />
                {t('integrations')}
            </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 p-6 md:p-8 overflow-y-auto">
            
            {/* --- GENERAL TAB --- */}
            {activeTab === 'general' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                    
                    {/* Appearance Section */}
                    <section>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                             <Monitor size={20} className="text-blue-600"/> {t('theme')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button 
                                onClick={() => theme === 'dark' && toggleTheme()}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${theme === 'light' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500'}`}
                            >
                                <div className={`p-3 rounded-full ${theme === 'light' ? 'bg-white text-blue-600' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                    <Sun size={24} />
                                </div>
                                <div className="text-left">
                                    <span className={`block font-bold ${theme === 'light' ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{t('light')}</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-500">Aparência clara padrão</span>
                                </div>
                            </button>

                            <button 
                                onClick={() => theme === 'light' && toggleTheme()}
                                className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${theme === 'dark' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-slate-500'}`}
                            >
                                <div className={`p-3 rounded-full ${theme === 'dark' ? 'bg-slate-800 text-blue-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                    <Moon size={24} />
                                </div>
                                <div className="text-left">
                                    <span className={`block font-bold ${theme === 'dark' ? 'text-blue-800 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}`}>{t('dark')}</span>
                                    <span className="text-sm text-slate-500 dark:text-slate-500">Modo escuro para conforto</span>
                                </div>
                            </button>
                        </div>
                    </section>

                    {/* Language Section */}
                    <section>
                         <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 border-b border-slate-100 dark:border-slate-700 pb-2 flex items-center gap-2">
                             <Globe size={20} className="text-blue-600"/> {t('language')}
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {[
                                { code: 'pt-BR', label: 'PT-BR', flag: '🇧🇷' },
                                { code: 'pt-PT', label: 'PT-PT', flag: '🇵🇹' },
                                { code: 'en-US', label: 'EN-US', flag: '🇺🇸' },
                                { code: 'es-ES', label: 'ES-ES', flag: '🇪🇸' }
                            ].map((lang) => (
                                <button
                                    key={lang.code}
                                    onClick={() => setLanguage(lang.code as any)}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-all ${language === lang.code ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-700 hover:border-green-300'}`}
                                >
                                    <span className="flex items-center gap-3 font-medium text-slate-700 dark:text-slate-300">
                                        <span className="text-2xl">{lang.flag}</span> {lang.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </section>
                </div>
            )}

            {/* --- INTEGRATIONS TAB --- */}
            {activeTab === 'integrations' && (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 animate-in fade-in">
                    <Smartphone size={48} className="mb-4 opacity-20" />
                    <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Configurações de API</h3>
                    <p className="text-sm text-center max-w-md mt-2">
                        Gerencie suas chaves da Evolution API, Webhooks para eventos de mensagens e integrações com Typebot ou N8N aqui.
                    </p>
                    <button className="mt-6 px-6 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors font-medium text-sm">
                        Adicionar Integração
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
