
import React, { useState } from 'react';
import { 
    MessageCircle, Mail, Lock, ArrowRight, Loader2, ShieldCheck, AlertTriangle, 
    Crown, Briefcase, Headphones, Terminal, Rocket, Sparkles, CheckCircle, Bot,
    Layout, Smartphone, Users, Zap, Play
} from 'lucide-react';
import { User } from '../types';
import { useApp } from '../contexts/AppContext';
import * as authService from '../services/authService';
import Logo from './Logo';

interface LoginProps {
  onLogin: (user: User) => void;
  onNavigateToRegister: () => void;
  onNavigateToSales?: () => void;
}

const SalesPromoCard = ({ branding, onNavigate }: { branding: any, onNavigate: () => void }) => (
    <div 
        className="relative group cursor-pointer w-full max-w-md h-full min-h-[550px] lg:h-[650px] flex flex-col perspective-1000"
        onClick={(e) => { e.stopPropagation(); onNavigate(); }}
    >
        {/* Animated Background Blur - Glow Effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 rounded-[2.5rem] blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200 will-change-transform"></div>
        
        <div className="relative h-full bg-slate-950 rounded-[2.4rem] overflow-hidden border border-white/10 shadow-2xl flex flex-col transform transition-all duration-300 group-hover:-translate-y-2 group-hover:shadow-indigo-500/20">
            
            {/* Background Elements */}
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 z-0"></div>
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-blue-600/20 rounded-full blur-[100px] translate-y-1/3 -translate-x-1/3"></div>
            
            {/* Pattern Overlay */}
            <div className="absolute inset-0 opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] z-0 pointer-events-none"></div>

            <div className="relative z-10 p-10 flex flex-col h-full justify-between">
                <div>
                    {/* Badge */}
                    <div className="flex justify-start mb-8">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md shadow-sm group-hover:bg-white/10 transition-all">
                            <Sparkles size={12} className="text-yellow-400 fill-yellow-400" />
                            <span className="text-[10px] font-bold text-slate-200 tracking-widest uppercase">{branding.landingTag || 'Enterprise'}</span>
                        </div>
                    </div>

                    {/* Text Content */}
                    <h3 className="text-3xl lg:text-4xl font-extrabold text-white mb-6 leading-tight drop-shadow-sm">
                        {branding.landingPageHeadline}
                    </h3>
                    <p className="text-indigo-200/80 text-base leading-relaxed mb-8">
                        {branding.landingPageSubheadline}
                    </p>
                    
                    {/* Features List as Cards */}
                    <div className="space-y-3 mt-4">
                        {branding.landingFeatures.slice(0, 3).map((feat: any, i: number) => (
                            <div key={i} className="flex items-center gap-4 p-3 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group/item backdrop-blur-sm">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white shadow-lg shrink-0 group-hover/item:scale-110 transition-transform">
                                    <CheckCircle size={18} className="text-white" strokeWidth={2.5} />
                                </div>
                                <div>
                                    <h4 className="text-white font-bold text-sm tracking-wide group-hover/item:text-indigo-200 transition-colors">{feat.title}</h4>
                                    {feat.description && (
                                        <p className="text-slate-400 text-xs mt-0.5 line-clamp-1">{feat.description}</p>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer CTA */}
                <div className="mt-8 pt-6 border-t border-white/5">
                    <button className="w-full group/btn relative overflow-hidden bg-white text-slate-900 py-4 px-6 rounded-2xl font-bold text-sm shadow-[0_0_25px_rgba(255,255,255,0.15)] transition-transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-between">
                        <span className="relative z-10 flex items-center gap-2">
                            Ver Planos e Preços
                        </span>
                        <div className="bg-slate-100 p-2 rounded-full group-hover/btn:bg-indigo-50 transition-colors relative z-10">
                            <ArrowRight size={16} className="text-slate-900 group-hover/btn:translate-x-1 transition-transform"/>
                        </div>
                        <div className="absolute inset-0 bg-gradient-to-r from-white via-indigo-50 to-white opacity-0 group-hover/btn:opacity-100 transition-opacity z-0"></div>
                    </button>
                    <p className="text-center text-[10px] text-slate-500 mt-4 opacity-60">
                        Clique para conhecer todas as funcionalidades
                    </p>
                </div>
            </div>
        </div>
    </div>
);

const Login: React.FC<LoginProps> = ({ onLogin, onNavigateToRegister, onNavigateToSales }) => {
  const { t, showToast, branding } = useApp();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Fallback defaults if new config keys don't exist yet
  const showBrand = branding.layoutVisibility?.showBrandContainer ?? true;
  const showLogin = branding.layoutVisibility?.showLoginContainer ?? true;
  const showLanding = branding.layoutVisibility?.showLandingContainer ?? true;
  const showQuickAccess = branding.layoutVisibility?.showQuickAccess ?? true;

  const handleAutoFill = (role: 'super' | 'manager' | 'agent') => {
      setPassword('123456');
      switch(role) {
          case 'super': setEmail('super@disparai.com.br'); break;
          case 'manager': setEmail('admin@disparai.com.br'); break;
          case 'agent': setEmail('agent@disparai.com.br'); break;
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

  // Helper icons for dynamic benefits
  const icons = [Layout, Smartphone, Users];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col justify-center p-4 lg:p-8 transition-colors duration-300 relative overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-40 dark:opacity-20">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/20 rounded-full blur-[120px]"></div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 items-center relative z-10">
        
        {/* COLUMN 1: BRAND IDENTITY & BENEFITS */}
        {showBrand && (
            <div className="hidden lg:flex flex-col justify-center h-full p-8 relative z-10 order-1 animate-in slide-in-from-left-10 duration-700">
                
                {/* Decorative blur */}
                <div className="absolute top-1/3 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px] pointer-events-none"></div>

                <div className="mb-12">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/20 text-white">
                        <Logo className="h-8 w-8" showText={false} /> 
                        </div>
                        <span className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{branding.appName}</span>
                    </div>
                    
                    <p className="text-xl text-slate-600 dark:text-slate-300 leading-relaxed font-medium max-w-sm">
                        {branding.landingPageSubheadline}
                    </p>
                </div>

                <div className="space-y-8">
                    {branding.loginBenefits.map((item, idx) => {
                        const Icon = icons[idx % icons.length];
                        return (
                            <div key={idx} className="flex gap-5 group">
                                <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:border-blue-200 dark:group-hover:border-blue-900/50 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/10 shadow-sm transition-all duration-300 shrink-0 transform group-hover:scale-105">
                                    <Icon size={26} strokeWidth={1.5} />
                                </div>
                                <div className="flex flex-col justify-center">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg mb-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">{item.title}</h4>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 leading-snug font-medium opacity-90">{item.description}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-16 flex items-center gap-3 text-slate-400 text-[10px] font-bold uppercase tracking-widest opacity-80 pl-1">
                    <ShieldCheck size={16} className="text-slate-500 dark:text-slate-400"/>
                    <span>Ambiente 100% Criptografado</span>
                </div>
            </div>
        )}

        {/* COLUMN 2: LOGIN FORM */}
        {showLogin && (
            <div className={`flex items-center justify-center order-2 relative z-20 ${(!showBrand && !showLanding) ? 'col-span-1 lg:col-span-3' : ''}`}>
                {/* Glow effect behind the card */}
                <div className="absolute inset-0 bg-blue-600/20 blur-[100px] rounded-full pointer-events-none"></div>
                
                <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border border-white/20 dark:border-slate-700 p-8 w-full max-w-[420px] animate-in fade-in zoom-in-95 duration-500 relative overflow-hidden">
                    
                    {/* Decorator top line */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

                    {/* Header Login */}
                    <div className="mb-8 text-center">
                        <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">{branding.loginTitle}</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">{branding.loginMessage}</p>
                    </div>

                    {/* Quick Access Buttons (DEMO ONLY) */}
                    {showQuickAccess && (
                        <div className="mb-8 bg-slate-50 dark:bg-slate-800/50 p-1.5 rounded-2xl border border-slate-100 dark:border-slate-700/50">
                            <div className="flex items-center justify-between px-2 mb-1.5">
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Acesso Rápido (Demo)</p>
                            </div>
                            <div className="grid grid-cols-3 gap-1">
                                <button onClick={() => handleAutoFill('super')} className="flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition-all hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-600 dark:text-slate-300" title="Super Admin">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-1"><Crown size={14} /></div>
                                    SUPER
                                </button>
                                <button onClick={() => handleAutoFill('manager')} className="flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition-all hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-600 dark:text-slate-300" title="Gestor">
                                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-1"><Briefcase size={14} /></div>
                                    GESTOR
                                </button>
                                <button onClick={() => handleAutoFill('agent')} className="flex flex-col items-center justify-center py-2 rounded-xl text-[10px] font-bold transition-all hover:bg-white dark:hover:bg-slate-700 hover:shadow-sm text-slate-600 dark:text-slate-300" title="Atendente">
                                    <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center mb-1"><Headphones size={14} /></div>
                                    AGENT
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-bold p-3 rounded-xl mb-6 flex items-start gap-2 animate-in slide-in-from-top-2">
                        <AlertTriangle size={16} className="mt-0.5 shrink-0"/>
                        <span>{error}</span>
                    </div>
                    )}

                    <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">{t('email_label')}</label>
                        <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all placeholder:text-slate-400 text-sm font-medium"
                            placeholder="nome@empresa.com"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 ml-1">{t('password_label')}</label>
                        <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors pointer-events-none">
                            <Lock size={18} />
                        </div>
                        <input 
                            type="password" 
                            className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 dark:text-white transition-all placeholder:text-slate-400 text-sm font-medium"
                            placeholder="••••••••"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        </div>
                    </div>

                    <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer hover:text-slate-700 dark:hover:text-slate-300 transition-colors">
                        <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 bg-slate-100 dark:bg-slate-700 border-none" />
                        <span>Lembrar-me</span>
                        </label>
                        <a href="#" className="text-blue-600 hover:text-blue-500 hover:underline">Esqueceu a senha?</a>
                    </div>

                    <button 
                        type="submit" 
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed transform active:scale-[0.98]"
                    >
                        {loading ? <Loader2 className="animate-spin" /> : <>{t('enter_button')} <ArrowRight size={18} /></>}
                    </button>
                    </form>
                </div>
            </div>
        )}

        {/* COLUMN 3: PLANS CTA (Enhanced Card) */}
        {branding.showSalesPage && showLanding && (
            <div className="flex items-center justify-center animate-in slide-in-from-right-8 duration-700 order-3">
                <SalesPromoCard branding={branding} onNavigate={onNavigateToSales || (() => {})} />
            </div>
        )}

      </div>
    </div>
  );
};

export default Login;
