import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Smartphone, Users, Settings as SettingsIcon, LogOut, Menu, X, CreditCard, Send, MessageCircle, PieChart, DollarSign, Moon, Sun, Globe, PlayCircle, ChevronLeft, ChevronRight, HelpCircle, Loader2, Terminal, Plug, Activity, ShieldCheck, Server, Layers, Tag, Inbox } from 'lucide-react';
import { ViewState, UserRole, User } from './types';
import Dashboard from './components/Dashboard';
import Instances from './components/Instances';
import Contacts from './components/Contacts';
import Tags from './components/Tags';
import Team from './components/Team'; 
import Campaigns from './components/Campaigns';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Financial from './components/Financial';
import InboxComponent from './components/Inbox';
import Login from './components/Login';
import Register from './components/Register';
import SalesPage from './components/SalesPage';
import Onboarding from './components/Onboarding';
import DeveloperConsole from './components/DeveloperConsole';
import BaseAssignment from './components/BaseAssignment';
import Logo from './components/Logo';
import { AppProvider, useApp } from './contexts/AppContext';
import { supabase } from './services/supabaseClient';
import { authService } from './services/authService'; // CORRIGIDO: Caminho de './' e minúsculo

// Inner App Component to use the Context
const FlowChatApp: React.FC = () => {
  const { t, theme, toggleTheme, language, setLanguage, config } = useApp();
  
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
  const isOwner = currentUser?.email === 'owner@disparai.com.br'; 
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const isManager = currentUser?.role === 'manager';
  const isAgent = currentUser?.role === 'agent';
  
  const checkVisibility = (module: string) => {
      if (isOwner) return true;
      if (!currentUser) return false;
      const roleKey = currentUser.role;
      return (config.visibility as any)[roleKey]?.[module] !== false;
  };

  // --- Auth & Session Handling ---
  useEffect(() => {
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        if (event === 'SIGNED_IN') await new Promise(r => setTimeout(r, 500));
        
        try {
            const user = await authService.fetchUserProfile(session.user.id);
            setCurrentUser(user);
            setIsAuthenticated(true);
            
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
                console.warn("Session check timed out");
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
        await authService.signOut();
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

  if (isAuthLoading) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-900 transition-colors gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-slate-500 dark:text-slate-400 text-sm font-medium animate-pulse">Conectando ao servidor...</p>
          </div>
      );
  }

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
    </button>
  );

  const SectionHeader = ({ label }: { label: string }) => {
      if (isSidebarCollapsed) return <div className="h-px w-8 bg-slate-200 dark:bg-slate-700 mx-auto my-2"></div>;
      return (
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-4 mb-2 mt-4">
            {label}
        </div>
      );
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar */}
      <aside className={`${isSidebarCollapsed ? 'w-20' : 'w-64'} hidden md:flex flex-col bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full transition-all duration-300 relative z-30 shadow-sm`}>
        <button 
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className="absolute -right-3 top-9 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 p-1 rounded-full shadow-sm z-50"
        >
            {isSidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className={`p-5 border-b border-slate-100 dark:border-slate-700 flex items-center ${isSidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
            <Logo className="h-8" showText={!isSidebarCollapsed} />
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto custom-scrollbar">
          {!isOwner && checkVisibility('onboarding') && <NavItem view="onboarding" icon={PlayCircle} label={t('onboarding')} />}

          {(isAgent || isManager) && !isOwner && (
              <>
                <SectionHeader label="Operacional" />
                <NavItem view="inbox" icon={Inbox} label={t('inbox')} /> 
                {checkVisibility('contacts') && <NavItem view="contacts" icon={Users} label="Contatos" />}
                {checkVisibility('tags') && <NavItem view="tags" icon={Tag} label={t('nav_tags')} />}
                {checkVisibility('campaigns') && <NavItem view="campaigns" icon={Send} label="Campanhas" />}
                {checkVisibility('instances') && <NavItem view="instances" icon={Smartphone} label="Instância" />}
              </>
          )}

          {(isManager || isSuperAdmin) && !isOwner && (
              <>
                <SectionHeader label="Gestão" />
                {checkVisibility('dashboard') && <NavItem view="dashboard" icon={LayoutDashboard} label="Painel" />}
                {checkVisibility('reports') && <NavItem view="reports" icon={PieChart} label="Relatórios" />}
                {checkVisibility('team') && <NavItem view="team" icon={Users} label="Equipe" />}
                {checkVisibility('base_assignment') && <NavItem view="base_assignment" icon={Layers} label="Bases" />}
              </>
          )}

          {isSuperAdmin && !isOwner && (
              <>
                <SectionHeader label="Admin" />
                {checkVisibility('financial') && <NavItem view="financial" icon={DollarSign} label="Financeiro" />}
              </>
          )}

          {isOwner && (
              <>
                <SectionHeader label="System" />
                <NavItem view="master_console" icon={ShieldCheck} label="Master Console" />
              </>
          )}
        </nav>

        <div className="p-3 border-t border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-3 px-1">
              <img src={currentUser.avatar} alt="Avatar" className="w-9 h-9 rounded-full" />
              {!isSidebarCollapsed && (
                  <div className="truncate flex-1">
                      <p className="text-sm font-bold dark:text-white truncate">{currentUser.name}</p>
                      <button onClick={handleLogout} className="text-xs text-red-500 hover:underline">Sair</button>
                  </div>
              )}
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-hidden h-full bg-slate-50 dark:bg-slate-900">
        <div className={`h-full w-full flex flex-col ${activeView === 'inbox' ? 'p-0' : 'p-6 md:p-10 max-w-screen-2xl mx-auto'}`}>
          {activeView === 'dashboard' && <Dashboard role={currentUser.role} onNavigate={setActiveView} />}
          {activeView === 'onboarding' && <Onboarding onNavigate={setActiveView} currentUser={currentUser} />}
          {activeView === 'inbox' && <InboxComponent currentUser={currentUser} />}
          {activeView === 'instances' && <Instances currentUser={currentUser} />}
          {activeView === 'campaigns' && <Campaigns currentUser={currentUser} />}
          {activeView === 'contacts' && <Contacts currentUser={currentUser} />}
          {activeView === 'tags' && <Tags currentUser={currentUser} />}
          {activeView === 'financial' && isSuperAdmin && <Financial currentUser={currentUser} />}
          {activeView === 'team' && (isSuperAdmin || isManager) && <Team onNavigate={setActiveView} currentUser={currentUser} />}
          {activeView === 'base_assignment' && (isSuperAdmin || isManager) && <BaseAssignment currentUser={currentUser} />}
          {activeView === 'settings' && <Settings currentUser={currentUser} />}
          {activeView === 'reports' && (isSuperAdmin || isManager) && <Reports />}
          {activeView === 'master_console' && isOwner && <DeveloperConsole onLogout={handleLogout} />}
        </div>
      </main>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <FlowChatApp />
    </AppProvider>
  );
};

export default App;
