
import React, { useState } from 'react';
import { MessageCircle, Mail, Lock, ArrowRight, Loader2, ShieldCheck, Play } from 'lucide-react';
import { User } from '../types';
import { useApp } from '../contexts/AppContext';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const { t } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = (demoType?: 'manager' | 'agent') => {
      setLoading(true);
      setError('');
      
      const isDemoManager = demoType === 'manager';
      const isDemoAgent = demoType === 'agent';
      
      // If manual login, check values (Mock)
      if (!demoType && !email) {
          setError('Digite seu email');
          setLoading(false);
          return;
      }

      setTimeout(() => {
          setLoading(false);
          
          if (isDemoManager || email.includes('admin') || email.includes('gestor')) {
              onLogin({
                  id: 'manager-1',
                  name: 'Gestor Admin',
                  role: 'manager',
                  email: isDemoManager ? 'admin@enterprise.com' : email,
                  avatar: 'https://ui-avatars.com/api/?name=Gestor+Admin&background=0D8ABC&color=fff'
              });
          } else if (isDemoAgent || email.includes('agente') || email.includes('atendente')) {
              onLogin({
                  id: 'agent-1',
                  name: 'Atendente 01',
                  role: 'agent',
                  email: isDemoAgent ? 'agent@enterprise.com' : email,
                  avatar: 'https://ui-avatars.com/api/?name=Atendente+01&background=10B981&color=fff'
              });
          } else {
              // Fallback for custom emails
              onLogin({
                  id: 'manager-1',
                  name: 'Novo Usuário',
                  role: 'manager',
                  email: email,
                  avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=0D8ABC&color=fff`
              });
          }
      }, 1000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleAuth();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col items-center justify-center p-4 transition-colors duration-300">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-600/30 mb-4">
          <MessageCircle size={32} fill="currentColor" />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">FlowChat</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm font-medium uppercase tracking-wider">Enterprise Edition</p>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-300 transition-colors">
        
        {/* Demo Mode Actions */}
        <div className="mb-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
                <button 
                    onClick={() => handleAuth('manager')}
                    className="flex flex-col items-center justify-center p-3 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 border border-indigo-200 dark:border-indigo-800 rounded-xl transition-colors text-indigo-700 dark:text-indigo-300 gap-1 group"
                >
                    <div className="bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Play size={14} fill="currentColor"/></div>
                    <span className="text-xs font-bold">Admin Demo</span>
                </button>
                <button 
                    onClick={() => handleAuth('agent')}
                    className="flex flex-col items-center justify-center p-3 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800 rounded-xl transition-colors text-emerald-700 dark:text-emerald-300 gap-1 group"
                >
                    <div className="bg-white dark:bg-slate-700 p-1.5 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Play size={14} fill="currentColor"/></div>
                    <span className="text-xs font-bold">Agent Demo</span>
                </button>
            </div>
            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
                <span className="flex-shrink-0 mx-4 text-slate-300 text-xs uppercase">Acesso Corporativo</span>
                <div className="flex-grow border-t border-slate-100 dark:border-slate-700"></div>
            </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 text-center">{t('login_title')}</h2>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('email_label')}</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="email" 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="nome@empresa.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('password_label')}</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="password" 
                className="w-full pl-10 pr-4 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
              <span className="text-slate-600 dark:text-slate-400">Lembrar de mim</span>
            </label>
            <a href="#" className="text-blue-600 hover:underline font-medium">Esqueceu a senha?</a>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin" /> : <>{t('enter_button')} <ArrowRight size={18} /></>}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 text-center">
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Primeiro acesso?{' '}
            <button onClick={onNavigateToRegister} className="text-blue-600 font-bold hover:underline">
              Configurar Admin
            </button>
          </p>
        </div>
      </div>

      <div className="mt-8 flex items-center gap-2 text-slate-400 text-sm">
        <ShieldCheck size={16} />
        <span>Ambiente 100% Seguro e Criptografado</span>
      </div>
    </div>
  );
};

export default Login;
