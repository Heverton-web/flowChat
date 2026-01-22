
import React, { useState } from 'react';
import { MessageCircle, Mail, Lock, ArrowRight, Loader2, ShieldCheck, AlertTriangle, Crown, Briefcase, Headset, Terminal, Rocket, Sparkles, CheckCircle, Bot } from 'lucide-react';
import { User } from '../types';
import { useApp } from '../contexts/AppContext';
import * as authService from '../services/authService';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
  onNavigateToSales?: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister, onNavigateToSales }) => {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center p-4 lg:p-8 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch relative z-10">
        
        {/* COLUMN 1: BRAND IDENTITY */}
        <div className="flex flex-col justify-center space-y-8 p-4 lg:p-8 animate-in slide-in-from-left-8 duration-700 order-1">
            <div>
                <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-blue-600/30 mb-6">
                    <MessageCircle size={32} fill="currentColor" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight mb-4 leading-tight">
                    FlowChat <span className="text-blue-600">Enterprise</span>
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-sm">
                    Centralize atendimento, automação e gestão do WhatsApp em uma única plataforma poderosa.
                </p>
            </div>
            
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-green-500 shadow-sm border border-slate-100 dark:border-slate-700"><CheckCircle size={20} /></div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Múltiplos Atendentes</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-blue-500 shadow-sm border border-slate-100 dark:border-slate-700"><Rocket size={20} /></div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Disparos em Massa</span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white dark:bg-slate-800 flex items-center justify-center text-purple-500 shadow-sm border border-slate-100 dark:border-slate-700"><Bot size={20} /></div>
                    <span className="font-bold text-slate-700 dark:text-slate-200">Chatbot Inteligente</span>
                </div>
            </div>

            <div className="pt-4 flex items-center gap-2 text-slate-400 text-xs font-bold uppercase tracking-wider">
                <ShieldCheck size={16} />
                <span>Ambiente Criptografado</span>
            </div>
        </div>

        {/* COLUMN 2: LOGIN FORM */}
        <div className="flex items-center justify-center order-2">
            <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 p-8 w-full max-w-md animate-in fade-in zoom-in-95 duration-500 relative">
                
                {/* Header Login */}
                <div className="mb-6">
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Acessar Sistema</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Entre com suas credenciais corporativas.</p>
                </div>

                {/* Quick Access Buttons */}
                <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Acesso Rápido (Demo)</p>
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                        <button onClick={() => handleAutoFill('super')} className="flex flex-col items-center justify-center gap-1 p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-[10px] font-bold hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors border border-purple-100 dark:border-purple-800" title="Super Admin">
                            <Crown size={14} /> SUPER
                        </button>
                        <button onClick={() => handleAutoFill('manager')} className="flex flex-col items-center justify-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-[10px] font-bold hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors border border-blue-100 dark:border-blue-800" title="Gestor">
                            <Briefcase size={14} /> GESTOR
                        </button>
                        <button onClick={() => handleAutoFill('agent')} className="flex flex-col items-center justify-center gap-1 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-[10px] font-bold hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border border-green-100 dark:border-green-800" title="Atendente">
                            <Headset size={14} /> AGENT
                        </button>
                        <button onClick={() => handleAutoFill('dev')} className="flex flex-col items-center justify-center gap-1 p-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-[10px] font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors border border-slate-200 dark:border-slate-600" title="Desenvolvedor">
                            <Terminal size={14} /> DEV
                        </button>
                    </div>
                </div>
                
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
                      <span className="text-slate-600 dark:text-slate-400">Lembrar</span>
                    </label>
                    <a href="#" className="text-blue-600 hover:underline font-medium">Esqueceu?</a>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 dark:hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
        </div>

        {/* COLUMN 3: PLANS CTA */}
        <div className="flex items-center justify-center animate-in slide-in-from-right-8 duration-700 order-3">
            <div 
                className="bg-gradient-to-br from-blue-600 via-indigo-700 to-violet-800 p-1 rounded-3xl shadow-2xl w-full max-w-md h-auto lg:h-[500px] cursor-pointer group hover:scale-[1.02] transition-all duration-300 relative overflow-hidden flex flex-col"
                onClick={onNavigateToSales}
            >
                <div className="absolute top-0 right-0 p-0 opacity-10 group-hover:opacity-20 transition-opacity">
                    <Rocket size={200} className="text-white transform rotate-12 translate-x-10 -translate-y-10"/>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md p-8 rounded-[22px] flex-1 flex flex-col justify-between relative z-10 border border-white/10">
                    <div>
                        <div className="inline-flex items-center gap-2 bg-white/20 px-3 py-1 rounded-full text-xs font-bold text-white mb-6 backdrop-blur-md border border-white/20 shadow-sm">
                            <Sparkles size={12} className="text-yellow-300"/> Nova Era do Atendimento
                        </div>
                        <h3 className="text-3xl font-bold text-white mb-4 leading-tight">Potencialize suas Vendas</h3>
                        <p className="text-blue-100 text-base leading-relaxed mb-6 font-medium">
                            Planos Enterprise com API Ilimitada, Suporte Prioritário e White Label para sua marca.
                        </p>
                        <ul className="space-y-4 mb-8 text-blue-50 text-sm font-medium">
                            <li className="flex gap-3 items-center"><CheckCircle size={18} className="text-green-300"/> Setup Instantâneo</li>
                            <li className="flex gap-3 items-center"><CheckCircle size={18} className="text-green-300"/> Sem Fidelidade</li>
                            <li className="flex gap-3 items-center"><CheckCircle size={18} className="text-green-300"/> Teste Grátis 7 Dias</li>
                        </ul>
                    </div>
                    
                    <button onClick={(e) => { e.stopPropagation(); onNavigateToSales && onNavigateToSales(); }} className="bg-white text-blue-700 hover:bg-blue-50 px-6 py-4 rounded-xl font-bold text-base shadow-lg transition-all w-full flex items-center justify-center gap-2 group-hover:shadow-blue-900/30">
                        Ver Planos e Preços <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform"/>
                    </button>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default Login;
