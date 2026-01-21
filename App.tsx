
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Smartphone, Users, Settings as SettingsIcon, LogOut, Menu, X, CreditCard, Send, MessageCircle, PieChart, DollarSign, Moon, Sun, Globe, PlayCircle, ChevronLeft, ChevronRight, HelpCircle, Loader2, Terminal, Plug, Activity, Inbox } from 'lucide-react';
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
import Onboarding from './components/Onboarding';
import DeveloperConsole from './components/DeveloperConsole';
import InboxComponent from './components/Inbox'; // Renamed to avoid conflict
import { AppProvider, useApp } from './contexts/AppContext';
import { supabase } from './services/supabaseClient';
import * as authService from './services/authService';

// Inner App Component to use the Context
const FlowChatApp: React.FC = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Navigation State
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

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
            // Default view based on role
            if (user.role === 'developer') setActiveView('dev_integrations');
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
          if (user.role === 'developer') setActiveView('dev_integrations');
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
      if (user.role === 'developer') setActiveView('dev_integrations');
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

  // --- Role Based Checks ---
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const isAgent = currentUser?.role === 'agent';
  const isDeveloper = currentUser?.role === 'developer';

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
      if (authView === 'login') {
          return <Login onLogin={handleLogin} onNavigateToRegister={() => setAuthView('register')} />;
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
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/20 shrink-0">
              <MessageCircle size={20} fill="currentColor" className="text-white" />
            </div>
            {!isSidebarCollapsed && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300 min-w-0">
                    <h1 className="text-lg font-bold text-slate-800 dark:text-white tracking-tight leading-none">FlowChat</h1>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wider">Enterprise</span>
                </div>
            )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
          
          {/* COMMON FOR EVERYONE EXCEPT DEVELOPER */}
          {!isDeveloper && <NavItem view="onboarding" icon={PlayCircle} label={t('onboarding')} />}

          {/* OPERATIONAL MENU (Agents & Managers) */}
          {(isAgent || isManager) && (
              <>
                <SectionHeader label={t('menu')} />
                <NavItem view="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
                <NavItem view="inbox" icon={Inbox} label="Inbox" />
                <NavItem view="campaigns" icon={Send} label={t('campaigns')} />
                <NavItem view="instances" icon={Smartphone} label={t('instances')} />
                <NavItem view="contacts" icon={Users} label={t('contacts')} />
              </>
          )}

          {/* SUPER ADMIN MENU (Audit & Finance) */}
          {isSuperAdmin && (
              <>
                <SectionHeader label="Gestão Global" />
                <NavItem view="dashboard" icon={LayoutDashboard} label="Auditoria" />
                <NavItem view="financial" icon={DollarSign} label={t('financial')} />
                <NavItem view="reports" icon={PieChart} label={t('reports')} />
                <NavItem view="team" icon={Users} label="Gestão de Acessos" />
                <NavItem view="settings" icon={SettingsIcon} label="Conta" />
              </>
          )}

          {/* MANAGER MENU (Team Management) */}
          {isManager && (
              <>
                <SectionHeader label={t('admin')} />
                <NavItem view="reports" icon={PieChart} label={t('reports')} />
                <NavItem view="team" icon={Users} label="Equipe" />
              </>
          )}

          {/* DEVELOPER MENU (Tech Only) */}
          {isDeveloper && (
              <>
                <SectionHeader label="Developer Zone" />
                <NavItem view="dev_integrations" icon={Plug} label="Integrações" />
                <NavItem view="dev_diagnostics" icon={Activity} label="Diagnóstico" />
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
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate capitalize">{currentUser.role.replace('_', ' ')}</p>
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
        <div className="p-6 md:p-10 max-w-screen-2xl mx-auto min-h-full">
          {activeView === 'dashboard' && <Dashboard role={currentUser.role} onNavigate={setActiveView} />}
          {activeView === 'onboarding' && <Onboarding onNavigate={setActiveView} currentUser={currentUser} />}
          {activeView === 'inbox' && <InboxComponent currentUser={currentUser} />}
          {activeView === 'instances' && <Instances currentUser={currentUser} />}
          {activeView === 'campaigns' && <Campaigns currentUser={currentUser} />}
          {activeView === 'contacts' && <Contacts currentUser={currentUser} />}
          {activeView === 'financial' && isSuperAdmin && <Financial currentUser={currentUser} />}
          {activeView === 'team' && (isSuperAdmin || isManager) && <Team onNavigate={setActiveView} currentUser={currentUser} />}
          {activeView === 'settings' && <Settings currentUser={currentUser} />}
          {activeView === 'reports' && (isSuperAdmin || isManager) && <Reports />}
          
          {/* New Developer Routes */}
          {(activeView === 'dev_integrations' || activeView === 'dev_api' || activeView === 'dev_diagnostics') && isDeveloper && (
              <DeveloperConsole view={activeView === 'dev_integrations' ? 'integrations' : activeView === 'dev_api' ? 'api' : 'diagnostics'} />
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
