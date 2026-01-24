
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Smartphone, Users, Settings as SettingsIcon, LogOut, Menu, X, CreditCard, Send, MessageCircle, PieChart, DollarSign, Moon, Sun, Globe, PlayCircle, ChevronLeft, ChevronRight, HelpCircle, Loader2, Terminal, Plug, Activity, ShieldCheck, Inbox as InboxIcon, Server } from 'lucide-react';
import { ViewState, UserRole, User } from './types';
import Dashboard from './components/Dashboard';
import Instances from './components/Instances';
import Contacts from './components/Contacts';
import Team from './components/Team'; 
import Campaigns from './components/Campaigns';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Financial from './components/Financial';
import Login from './components/Login';
import Register from './components/Register';
import SalesPage from './components/SalesPage';
import Onboarding from './components/Onboarding';
import DeveloperConsole from './components/DeveloperConsole';
import Inbox from './components/Inbox';
import Logo from './components/Logo';
import { AppProvider, useApp } from './contexts/AppContext';
import { supabase } from './services/supabaseClient';
import * as authService from './services/authService';

// Inner App Component to use the Context
const FlowChatApp: React.FC = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register' | 'sales'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Navigation State
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // --- Role Constants ---
  const isOwner = currentUser?.email === 'owner@disparai.com.br'; // CRITICAL: Only this specific email sees the hidden zone
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const isAgent = currentUser?.role === 'agent';
  const isDeveloper = currentUser?.role === 'developer'; // Keeping this for role structure but restricting view

  // --- Auth & Session Handling ---
  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Small delay to ensure DB triggers have finished if it's a new signup
        if (event === 'SIGNED_IN') await new Promise(r => setTimeout(r, 500));
        
        try {
            const user = await authService.fetchUserProfile(session.user.id);
            setCurrentUser(user);
            setIsAuthenticated(true);
            
            // Redirect Owner directly to their console
            if (user.email === 'owner@disparai.com.br') setActiveView('master_console');
            else setActiveView('dashboard');
            
        } catch (e) {
            console.error("Error fetching profile on auth change", e);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const checkSession = async () => {
    setIsAuthLoading(true);
    try {
        const userPromise = authService.getCurrentUser();
        const timeoutPromise = new Promise<null>((resolve) => 
            setTimeout(() => {
                console.warn("Session check timed out - defaulting to login");
                resolve(null);
            }, 8000)
        );

        const user = await Promise.race([userPromise, timeoutPromise]);
        
        if (user) {
          setCurrentUser(user);
          setIsAuthenticated(true);
          if (user.email === 'owner@disparai.com.br') setActiveView('master_console');
        }
    } catch (error) {
        console.error("Session check failed:", error);
        setCurrentUser(null);
        setIsAuthenticated(false);
    } finally {
        setIsAuthLoading(false);
    }
  };

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setIsAuthenticated(true);
      if (user.email === 'owner@disparai.com.br') setActiveView('master_console');
      else setActiveView('dashboard');
  };

  const handleLogout = async () => {
      setIsAuthLoading(true); 
      try {
        const signOutPromise = authService.signOut();
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 3000));
        await Promise.race([signOutPromise, timeoutPromise]);
        
        setCurrentUser(null);
        setIsAuthenticated(false);
        setAuthView('login');
      } catch (error) {
        console.error("Erro no logout:", error);
        setCurrentUser(null);
        setIsAuthenticated(false);
        setAuthView('login');
      } finally {
        setIsAuthLoading(false);
      }
  };

  // --- Loading Screen ---
  if (isAuthLoading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Conectando ao servidor...</p>
          </div>
      );
  }

  // --- Render Auth Views ---
  if (!isAuthenticated || !currentUser) {
      if (authView === 'sales') {
          return <SalesPage onBack={() => setAuthView('login')} onSuccess={handleLogin} />;
      }
      if (authView === 'login') {
          return <Login onLogin={handleLogin} onNavigateToRegister={() => setAuthView('register')} onNavigateToSales={() => setAuthView('sales')} />;
      } else {
          return <Register onRegister={handleLogin} onNavigateToLogin={() => setAuthView('login')} />;
      }
  }

  // --- Main Application ---
  
  const NavItem = ({ view, icon: Icon, label }: { view: ViewState, icon: any, label: string }) => (
    <button
      onClick={() => {
        setActiveView(view);
        setMobileMenuOpen(false);
      }}
      title={isSidebarCollapsed ? label : ''}
      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative ${
        activeView === view 
          ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700/50 hover:text-slate-900 dark:hover:text-white'
      } ${isSidebarCollapsed ? 'justify-center' : ''}`}
    >
      <Icon size={20} className={`${activeView === view ? 'text-white' : ''} shrink-0`} />
      
      {!isSidebarCollapsed && (
        <span className="font-medium text-sm whitespace-nowrap overflow-hidden transition-all duration-300 origin-left">
            {label}
        </span>
      )}

      {/* Mini Sidebar Active Indicator */}
      {isSidebarCollapsed && activeView === view && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white/20 rounded-r-full"></div>
      )}
    </button>
  );

  const SectionHeader = ({ label }: { label: string }) => {
      if (isSidebarCollapsed) return <div className="h-px w-8 bg-slate-200 dark:bg-slate-700 mx-auto my-2"></div>;
      return (
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-4 animate-in fade-in">
            {label}
        </div>
      );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar - Desktop (Collapsible) */}
      <aside 
        className={`${
            isSidebarCollapsed ? 'w-20' : 'w-64'
        } hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full transition-all duration-300 ease-in-out relative z-30 shadow-sm`}
      >
        {/* Toggle Button */}
        <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-9 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 p-1 rounded-full shadow-sm hover:text-blue-600 dark:hover:text-blue-400 transition-colors z-50"
        >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* Brand Header */}
        <div className={`p-5 border-b border-slate-100 dark:border-slate-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            {!isSidebarCollapsed ? (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                    <Logo className="h-8" />
                </div>
            ) : (
                <Logo className="h-8 w-8" showText={false} />
            )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {/* COMMON FOR EVERYONE EXCEPT OWNER (Owner needs clean nav) */}
          {!isOwner && <NavItem view="onboarding" icon={PlayCircle} label={t('onboarding')} />}

          {/* AMBIENTE OPERACIONAL (Atendentes & Gestores) */}
          {(isAgent || isManager) && !isOwner && (
              <>
                <SectionHeader label="Operacional" />
                <NavItem view="inbox" icon={InboxIcon} label="Atendimento" />
                <NavItem view="contacts" icon={Users} label="Contatos" />
                <NavItem view="campaigns" icon={Send} label="Campanhas" />
                <NavItem view="instances" icon={Smartphone} label="Minha Instância" />
              </>
          )}

          {/* AMBIENTE DE GESTÃO (Apenas Gestores & Super Admin) */}
          {(isManager || isSuperAdmin) && !isOwner && (
              <>
                <SectionHeader label="Gestão da Operação" />
                <NavItem view="dashboard" icon={LayoutDashboard} label="Painel de Controle" />
                <NavItem view="reports" icon={PieChart} label="Relatórios" />
                <NavItem view="team" icon={Users} label="Gestão de Equipe" />
              </>
          )}

          {/* AMBIENTE ADMINISTRATIVO (Apenas Super Admin) */}
          {isSuperAdmin && !isOwner && (
              <>
                <SectionHeader label="Admin Global" />
                <NavItem view="financial" icon={DollarSign} label="Assinatura & Custos" />
                <NavItem view="instances" icon={Server} label="Todas Instâncias" />
              </>
          )}

          {/* SETTINGS FOR AGENTS & MANAGERS */}
          {(isManager || isAgent) && !isOwner && (
              <>
                <SectionHeader label="Sistema" />
                <NavItem view="settings" icon={SettingsIcon} label={t('settings')} />
              </>
          )}

          {/* OWNER ONLY MENU - SINGLE ENTRY POINT */}
          {isOwner && (
              <>
                <SectionHeader label="System" />
                <NavItem view="master_console" icon={ShieldCheck} label="Master Console" />
              </>
          )}
        </nav>

        {/* Footer / User Profile */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          
          {/* Controls (Theme/Lang) - Only show if expanded or cleverly collapsed */}
          <div className={`flex items-center gap-2 mb-3 bg-white dark:bg-slate-700/50 p-1 rounded-lg border border-slate-200 dark:border-slate-600 ${isSidebarCollapsed ? 'flex-col' : ''}`}>
             <button 
                onClick={toggleTheme}
                className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors flex-1 w-full flex justify-center"
                title={theme === 'dark' ? t('light') : t('dark')}
             >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
             </button>

             {!isSidebarCollapsed && <div className="w-px h-4 bg-slate-200 dark:bg-slate-600 mx-1"></div>}
             {isSidebarCollapsed && <div className="h-px w-4 bg-slate-200 dark:bg-slate-600 my-1"></div>}

             {!isSidebarCollapsed ? (
                 <div className="flex-1 flex items-center gap-1 px-1 relative">
                    <Globe size={14} className="text-slate-400 absolute left-1 pointer-events-none" />
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value as any)}
                        className="w-full bg-transparent text-[10px] font-bold text-slate-600 dark:text-slate-300 pl-6 py-1 outline-none cursor-pointer appearance-none"
                    >
                        <option value="pt-BR">PT</option>
                        <option value="en-US">EN</option>
                        <option value="es-ES">ES</option>
                    </select>
                 </div>
             ) : (
                 <button className="p-1.5 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 flex-1 w-full flex justify-center text-[10px] font-bold" onClick={() => setIsSidebarCollapsed(false)}>
                     {language.split('-')[0].toUpperCase()}
                 </button>
             )}
          </div>

          {/* User Profile */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'justify-center flex-col gap-2' : 'gap-3'} px-1`}>
              <div className="relative group cursor-pointer">
                  <img src={currentUser.avatar} alt="Avatar" className="w-9 h-9 rounded-full border-2 border-white dark:border-slate-600 shadow-sm" />
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-slate-800 rounded-full"></div>
              </div>
              
              {!isSidebarCollapsed ? (
                  <div className="truncate min-w-0 flex-1 animate-in fade-in slide-in-from-left-2">
                      <p className="text-sm font-bold text-slate-800 dark:text-white truncate leading-tight">{currentUser.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate capitalize">{currentUser.role.replace('_', ' ')}</p>
                  </div>
              ) : null}

              {!isSidebarCollapsed ? (
                  <button 
                    onClick={handleLogout}
                    className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    title={t('logout')}
                  >
                    <LogOut size={18} />
                  </button>
              ) : (
                  <button 
                    onClick={handleLogout}
                    className="mt-1 p-1.5 text-slate-400 hover:text-red-500 transition-colors"
                    title={t('logout')}
                  >
                    <LogOut size={16} />
                  </button>
              )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-full w-full pt-16 md:pt-0 bg-slate-50 dark:bg-slate-900">
        <div className={`h-full ${activeView === 'inbox' ? 'p-0' : 'p-6 md:p-10'} max-w-screen-2xl mx-auto min-h-full flex flex-col`}>
          {activeView === 'dashboard' && <Dashboard role={currentUser.role} onNavigate={setActiveView} />}
          {activeView === 'onboarding' && <Onboarding onNavigate={setActiveView} currentUser={currentUser} />}
          
          {/* Inbox takes full height if active */}
          {activeView === 'inbox' && <Inbox currentUser={currentUser} />}
          
          {activeView === 'instances' && <Instances currentUser={currentUser} />}
          {activeView === 'campaigns' && <Campaigns currentUser={currentUser} />}
          {activeView === 'contacts' && <Contacts currentUser={currentUser} />}
          
          {/* Financial Restrict to Super Admin */}
          {(activeView === 'financial' && isSuperAdmin) && <Financial currentUser={currentUser} />}
          
          {activeView === 'team' && (isSuperAdmin || isManager) && <Team onNavigate={setActiveView} currentUser={currentUser} />}
          {activeView === 'settings' && <Settings currentUser={currentUser} />}
          {activeView === 'reports' && (isSuperAdmin || isManager) && <Reports />}
          
          {/* Master Console - STRICTLY Restricted to Owner Email */}
          {activeView === 'master_console' && isOwner && (
              <DeveloperConsole />
          )}
        </div>
      </main>
    </div>
  );
};

// Root App Component
const App: React.FC = () => {
  return (
    <AppProvider>
      <FlowChatApp />
    </AppProvider>
  );
};

export default App;
