
import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle, Loader2, ShieldCheck, User, Mail, Shield, ExternalLink, ArrowRight } from 'lucide-react';
import { PLAN_DEFS } from '../types';
import * as authService from '../services/authService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import { getSystemConfig } from '../services/configService';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: 'START' | 'GROWTH' | 'SCALE'; // Using generic keys
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (user: any) => void;
}

const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({ isOpen, onClose, selectedPlanId, billingCycle, onSuccess }) => {
  const { showToast } = useApp();
  const config = getSystemConfig();
  const plan = config.plans[selectedPlanId]; // Get from dynamic config
  const [step, setStep] = useState<'register' | 'payment'>('register');
  const [isLoading, setIsLoading] = useState(false);
  
  // Registration State
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });

  if (!isOpen) return null;

  const finalPrice = billingCycle === 'monthly' ? plan.price : Math.round(plan.price * 0.8);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!regData.name || !regData.email || !regData.password) {
          showToast('Preencha todos os campos.', 'error');
          return;
      }
      
      setIsLoading(true);
      try {
          // 1. Create User Account (ROLE SUPER_ADMIN)
          const user = await authService.signUp(regData.name, regData.email, regData.password, 'super_admin');
          // Automatically log them in via context/auth flow usually happens here via Supabase listener
          
          showToast('Conta criada com sucesso!', 'success');
          setStep('payment');
      } catch (error: any) {
          showToast(error.message || 'Erro ao criar conta.', 'error');
      } finally {
          setIsLoading(false);
      }
  };

  const handleRedirectToStripe = async () => {
      setIsLoading(true);
      try {
          // Using PLAN_DEFS keys mapping for backend compatibility if needed, 
          // but here selectedPlanId aligns with config keys
          const { url } = await financialService.createCheckoutSession(selectedPlanId, billingCycle);
          
          if (url) {
              window.location.href = url; // Redireciona para Stripe
          } else {
              // Fallback para Mock Mode
              showToast('Modo Demonstração: Pagamento Simulado com Sucesso!', 'success');
              setTimeout(() => {
                  onSuccess({ id: 'mock', email: regData.email, name: regData.name, role: 'super_admin' });
                  onClose();
              }, 1500);
          }
      } catch (error: any) {
          console.error(error);
          showToast('Erro ao iniciar checkout. Verifique a configuração da API.', 'error');
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Side: Order Summary */}
        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-slate-800 p-8 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" /> {config.branding.appName} Secure
                </h3>
            </div>

            <div className="flex-1">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Você está assinando</p>
                <div className="flex justify-between items-start mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{plan.name} Plan</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Ciclo {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</p>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold text-slate-800 dark:text-white">R$ {finalPrice}</span>
                        <span className="text-xs text-slate-400 block">/mês</span>
                    </div>
                </div>

                <ul className="space-y-3 mb-8">
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle size={16} className="text-green-500" /> {plan.seats} Usuários (Seats)
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle size={16} className="text-green-500" /> {plan.connections} Conexões WhatsApp
                    </li>
                    <li className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                        <CheckCircle size={16} className="text-green-500" /> Cobrança via Stripe
                    </li>
                </ul>
            </div>

            <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between items-center text-sm font-bold text-slate-800 dark:text-white">
                    <span>Total Hoje</span>
                    <span>R$ {finalPrice},00</span>
                </div>
            </div>
        </div>

        {/* Right Side: Flow Steps */}
        <div className="flex-1 p-8 relative flex flex-col">
            <button onClick={onClose} className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                <X size={20} />
            </button>

            {step === 'register' && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex-1 flex flex-col">
                    <div className="mb-6">
                        <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Passo 1 de 2</span>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">Crie sua Conta</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm">Seus dados para acesso administrativo.</p>
                    </div>

                    <form onSubmit={handleRegisterSubmit} className="space-y-4 flex-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome da Empresa / Admin</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="Ex: Tech Solutions"
                                    value={regData.name}
                                    onChange={e => setRegData({...regData, name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="email" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="admin@empresa.com"
                                    value={regData.email}
                                    onChange={e => setRegData({...regData, email: e.target.value})}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Senha de Acesso</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="password" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                                    placeholder="******"
                                    value={regData.password}
                                    onChange={e => setRegData({...regData, password: e.target.value})}
                                />
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={isLoading}
                            className="w-full mt-6 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="animate-spin" /> : 'Criar Conta e Prosseguir'}
                        </button>
                    </form>
                </div>
            )}

            {step === 'payment' && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex-1 flex flex-col justify-center items-center text-center">
                    
                    <div className="mb-8">
                        <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-400">
                            <CreditCard size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">Finalizar Assinatura</h2>
                        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-sm mx-auto mt-2">
                            Você será redirecionado para o ambiente seguro da Stripe para concluir o pagamento com Cartão, Apple Pay ou Google Pay.
                        </p>
                    </div>

                    <div className="w-full max-w-sm space-y-4">
                        <button 
                            onClick={handleRedirectToStripe}
                            disabled={isLoading}
                            className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-2 transform hover:-translate-y-1"
                        >
                            {isLoading ? <Loader2 className="animate-spin" size={20}/> : <>Ir para Pagamento Seguro <ArrowRight size={20}/></>}
                        </button>
                        
                        <div className="flex items-center justify-center gap-4 pt-4 opacity-50 grayscale">
                            {/* Simple badges for trust */}
                            <span className="text-[10px] font-bold border px-1 rounded">VISA</span>
                            <span className="text-[10px] font-bold border px-1 rounded">MASTERCARD</span>
                            <span className="text-[10px] font-bold border px-1 rounded">AMEX</span>
                        </div>
                    </div>

                    <div className="mt-auto flex items-center gap-2 text-xs text-slate-400">
                        <Lock size={12} className="text-green-500"/>
                        Transação criptografada SSL 256-bits
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default StripeCheckoutModal;
