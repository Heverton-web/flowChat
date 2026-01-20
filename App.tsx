
import React, { useState } from 'react';
import { LayoutDashboard, Smartphone, Users, Settings as SettingsIcon, LogOut, Menu, X, CreditCard, Send, MessageCircle, PieChart, DollarSign, Moon, Sun, Globe, PlayCircle } from 'lucide-react';
import { ViewState, UserRole, User } from './types';
import Dashboard from './components/Dashboard';
import Instances from './components/Instances';
import Contacts from './components/Contacts';
import Subscription from './components/Subscription';
import Team from './components/Team'; // New Import
import Campaigns from './components/Campaigns';
import Settings from './components/Settings';
import Reports from './components/Reports';
import Financial from './components/Financial';
import Login from './components/Login';
import Register from './components/Register';
import Onboarding from './components/Onboarding';
import { AppProvider, useApp } from './contexts/AppContext';

// Inner App Component to use the Context
const FlowChatApp: React.FC = () => {
  const { t, theme, toggleTheme, language, setLanguage } = useApp();
  
  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // App Navigation State
  const [activeView, setActiveView] = useState<ViewState>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // --- Auth Handlers ---
  const handleLogin = (user: User) => {
      setCurrentUser(user);
      setIsAuthenticated(true);
      // Redirect to Onboarding on first login
      setActiveView('onboarding');
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setAuthView('login');
  };

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
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
        activeView === view 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' 
          : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
      }`}
    >
      <Icon size={20} />
      <span className="font-medium">{label}</span>
    </button>
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300 overflow-hidden">
      
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 h-full transition-colors duration-300">
        <div className="p-6 border-b border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-blue-200 dark:shadow-none shadow-md">
              <MessageCircle size={20} fill="currentColor" className="text-white" />
            </div>
            <div>
                <h1 className="text-xl font-bold text-slate-800 dark:text-white tracking-tight leading-none">FlowChat</h1>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Business</span>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {/* Onboarding available for everyone now */}
          <div className="mb-6">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">Início</div>
              <NavItem view="onboarding" icon={PlayCircle} label={t('onboarding')} />
          </div>

          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">{t('menu')}</div>
          
          <NavItem view="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
          <NavItem view="campaigns" icon={Send} label={t('campaigns')} />
          <NavItem view="instances" icon={Smartphone} label={t('instances')} />
          <NavItem view="contacts" icon={Users} label={t('contacts')} />
          <NavItem view="financial" icon={DollarSign} label={t('financial')} />
          
          {currentUser.role === 'manager' && (
              <>
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                    <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-4 mb-2">{t('admin')}</div>
                    <NavItem view="reports" icon={PieChart} label={t('reports')} />
                    <NavItem view="subscription" icon={CreditCard} label={t('subscription')} />
                    <NavItem view="team" icon={Users} label="Equipe" />
                    <NavItem view="settings" icon={SettingsIcon} label={t('settings')} />
                </div>
              </>
          )}
        </nav>

        {/* Global Controls & User Profile */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
          
          {/* Explicit Appearance & Language Controls */}
          <div className="flex items-center gap-2 mb-4 bg-white dark:bg-slate-700 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
             {/* Theme Toggle */}
             <button 
                onClick={toggleTheme}
                className="p-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-500 dark:text-slate-300 transition-colors"
                title={theme === 'dark' ? t('light') : t('dark')}
             >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
             </button>

             <div className="w-px h-6 bg-slate-200 dark:bg-slate-600 mx-1"></div>

             {/* Language Dropdown */}
             <div className="flex-1 flex items-center gap-2 px-1 relative">
                <Globe size={16} className="text-slate-400 absolute left-2 pointer-events-none" />
                <select 
                    value={language} 
                    onChange={(e) => setLanguage(e.target.value as any)}
                    className="w-full bg-transparent text-xs font-bold text-slate-600 dark:text-slate-300 pl-7 py-1 outline-none cursor-pointer appearance-none"
                >
                    <option value="pt-BR">🇧🇷 PT-BR</option>
                    <option value="pt-PT">🇵🇹 PT-PT</option>
                    <option value="en-US">🇺🇸 EN-US</option>
                    <option value="es-ES">🇪🇸 ES-ES</option>
                </select>
             </div>
          </div>

          <div className="flex items-center gap-3 px-2 mb-4">
              <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full border border-slate-200 dark:border-slate-600" />
              <div className="truncate min-w-0">
                  <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{currentUser.email}</p>
              </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-700 rounded-lg transition-colors text-sm font-medium"
          >
            <LogOut size={16} />
            <span>{t('logout')}</span>
          </button>
        </div>
      </aside>

      {/* Mobile Header & Sidebar Overlay */}
      <div className="md:hidden absolute top-0 left-0 w-full z-20">
        <div className="bg-white dark:bg-slate-800 p-4 flex justify-between items-center shadow-sm dark:border-b dark:border-slate-700">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                    <MessageCircle size={18} fill="currentColor" />
                 </div>
                 <h1 className="text-lg font-bold text-slate-800 dark:text-white">FlowChat</h1>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-600 dark:text-slate-300 p-2">
                  {mobileMenuOpen ? <X /> : <Menu />}
              </button>
            </div>
        </div>
        {mobileMenuOpen && (
            <div className="absolute top-full left-0 w-full bg-white dark:bg-slate-800 shadow-xl border-b border-slate-200 dark:border-slate-700 p-4 space-y-2 max-h-[85vh] overflow-y-auto">
                 {/* Mobile Controls */}
                 <div className="flex gap-2 mb-4 p-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                    <button 
                        onClick={toggleTheme} 
                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-white dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200"
                    >
                        {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                        {theme === 'dark' ? t('light') : t('dark')}
                    </button>
                    <div className="flex-1 relative">
                         <Globe size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                         <select 
                            value={language} 
                            onChange={(e) => setLanguage(e.target.value as any)}
                            className="w-full h-full bg-white dark:bg-slate-700 pl-9 pr-2 border border-slate-200 dark:border-slate-600 rounded shadow-sm text-sm font-medium text-slate-700 dark:text-slate-200 appearance-none outline-none"
                         >
                            <option value="pt-BR">🇧🇷 PT-BR</option>
                            <option value="pt-PT">🇵🇹 PT-PT</option>
                            <option value="en-US">🇺🇸 EN-US</option>
                            <option value="es-ES">🇪🇸 ES-ES</option>
                         </select>
                    </div>
                 </div>

                 <div className="mb-2">
                     <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">Início</div>
                     <NavItem view="onboarding" icon={PlayCircle} label={t('onboarding')} />
                 </div>

                 <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">{t('menu')}</div>
                 <NavItem view="dashboard" icon={LayoutDashboard} label={t('dashboard')} />
                 <NavItem view="campaigns" icon={Send} label={t('campaigns')} />
                 <NavItem view="instances" icon={Smartphone} label={t('instances')} />
                 <NavItem view="contacts" icon={Users} label={t('contacts')} />
                 <NavItem view="financial" icon={DollarSign} label={t('financial')} />
                 
                 {currentUser.role === 'manager' && (
                     <>
                        <div className="border-t border-slate-100 dark:border-slate-700 my-2 pt-2">
                             <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 mb-1">{t('admin')}</div>
                             <NavItem view="reports" icon={PieChart} label={t('reports')} />
                             <NavItem view="subscription" icon={CreditCard} label={t('subscription')} />
                             <NavItem view="team" icon={Users} label="Equipe" />
                             <NavItem view="settings" icon={SettingsIcon} label={t('settings')} />
                        </div>
                     </>
                 )}
                 
                 <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mt-2">
                    <div className="flex items-center gap-3 px-2 mb-4">
                        <img src={currentUser.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                        <div>
                            <p className="text-sm font-bold text-slate-800 dark:text-white">{currentUser.name}</p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.email}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 text-red-500 bg-red-50 dark:bg-red-900/10 rounded-lg"
                    >
                        <LogOut size={20} />
                        <span className="font-medium">{t('logout')}</span>
                    </button>
                 </div>
            </div>
        )}
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto h-full w-full pt-16 md:pt-0">
        <div className="p-6 md:p-10 max-w-7xl mx-auto min-h-full">
          {activeView === 'dashboard' && <Dashboard role={currentUser.role} onNavigate={setActiveView} />}
          {activeView === 'onboarding' && <Onboarding onNavigate={setActiveView} currentUser={currentUser} />}
          {activeView === 'instances' && <Instances currentUser={currentUser} />}
          {activeView === 'campaigns' && <Campaigns currentUser={currentUser} />}
          {activeView === 'contacts' && <Contacts currentUser={currentUser} />}
          {activeView === 'financial' && <Financial currentUser={currentUser} />}
          {activeView === 'subscription' && currentUser.role === 'manager' && <Subscription />}
          {activeView === 'team' && currentUser.role === 'manager' && <Team />}
          {activeView === 'settings' && currentUser.role === 'manager' && <Settings />}
          {activeView === 'reports' && currentUser.role === 'manager' && <Reports />}
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
