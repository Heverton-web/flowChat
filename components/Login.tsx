
import React, { useState } from 'react';
import { MessageCircle, Mail, Lock, ArrowRight, Loader2, ShieldCheck, AlertTriangle, Crown, Briefcase, Headset, Terminal } from 'lucide-react';
import { User } from '../types';
import { useApp } from '../contexts/AppContext';
import * as authService from '../services/authService';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister }) => {
  const { t, showToast } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAutoFill = (role: 'super' | 'manager' | 'agent' | 'dev') => {
      setPassword('123456');
      switch(role) {
          case 'super': setEmail('super@flowchat.com'); break;
          case 'manager': setEmail('admin@flowchat.com'); break;
          case 'agent': setEmail('agent@flowchat.com'); break;
          case 'dev': setEmail('dev@flowchat.com'); break;
      }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
        setError('Preencha todos os campos');
        return;
    }

    setLoading(true);
    setError('');

    try {
        const user = await authService.signIn(email, password);
        onLogin(user);
    } catch (err: any) {
        console.error(err);
        if (err.message?.includes('Invalid login') || err.message?.includes('credentials')) {
            setError('Email ou senha incorretos.');
        } else {
            setError(err.message || 'Falha no login. Verifique suas credenciais.');
        }
        showToast('Erro ao entrar no sistema', 'error');
    } finally {
        setLoading(false);
    }
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
        
        {/* Quick Access Buttons */}
        <div className="mb-6">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center mb-3">Acesso Rápido (Demo)</p>
            <div className="grid grid-cols-2 gap-2">
                <button onClick={() => handleAutoFill('super')} className="flex items-center justify-center gap-2 p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors border border-purple-100 dark:border-purple-800">
                    <Crown size={14} /> SUPER ADMIN
                </button>
                <button onClick={() => handleAutoFill('manager')} className="flex items-center justify-center gap-2 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-xs font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800">
                    <Briefcase size={14} /> GESTOR
                </button>
                <button onClick={() => handleAutoFill('agent')} className="flex items-center justify-center gap-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-100 dark:border-green-800">
                    <Headset size={14} /> ATENDENTE
                </button>
                <button onClick={() => handleAutoFill('dev')} className="flex items-center justify-center gap-2 p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600">
                    <Terminal size={14} /> DEV
                </button>
            </div>
        </div>

        <h2 className="text-xl font-bold text-slate-800 dark:text-white mb-4 text-center">{t('login_title')}</h2>
        
        {error && (
          <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg mb-4 flex items-start gap-2">
            <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
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
              Setup Admin
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
