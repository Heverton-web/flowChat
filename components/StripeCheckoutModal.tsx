import React, { useState } from 'react';
import { X, CreditCard, Lock, CheckCircle, Loader2, ShieldCheck, User, Mail, Shield } from 'lucide-react';
import { PLAN_DEFS } from '../types';
import * as authService from '../services/authService';
import { useApp } from '../contexts/AppContext';

interface StripeCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedPlanId: keyof typeof PLAN_DEFS;
  billingCycle: 'monthly' | 'yearly';
  onSuccess: (user: any) => void;
}

const StripeCheckoutModal: React.FC<StripeCheckoutModalProps> = ({ isOpen, onClose, selectedPlanId, billingCycle, onSuccess }) => {
  const { showToast } = useApp();
  const plan = PLAN_DEFS[selectedPlanId];
  const [step, setStep] = useState<'register' | 'payment' | 'processing'>('register');
  
  // Registration State
  const [regData, setRegData] = useState({ name: '', email: '', password: '' });
  
  // Fake Card State
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });

  if (!isOpen) return null;

  const finalPrice = billingCycle === 'monthly' ? plan.price : Math.round(plan.price * 0.8);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!regData.name || !regData.email || !regData.password) {
          showToast('Preencha todos os campos.', 'error');
          return;
      }
      setStep('payment');
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setStep('processing');
      
      try {
          // 1. Simulate Stripe Processing
          await new Promise(resolve => setTimeout(resolve, 2500));
          
          // 2. Create User Account (ROLE SUPER_ADMIN as Account Owner)
          // O usuário que compra é o dono da conta (Super Admin) que criará os outros usuários (Gestores, Atendentes, Devs).
          const user = await authService.signUp(regData.name, regData.email, regData.password, 'super_admin');
          
          showToast('Pagamento aprovado e conta criada!', 'success');
          
          // 3. Callback to parent to log user in
          onSuccess(user);
      } catch (error: any) {
          setStep('payment');
          showToast('Erro no processamento. Tente novamente.', 'error');
      }
  };

  // Masking Functions
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').substring(0, 16);
    const parts = [];
    for (let i = 0; i < v.length; i += 4) {
      parts.push(v.substring(i, i + 4));
    }
    setCardData({ ...cardData, number: parts.join(' ') });
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (v.length >= 2) {
      v = v.substring(0, 2) + '/' + v.substring(2);
    }
    setCardData({ ...cardData, expiry: v });
  };

  const handleCvcChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value.replace(/\D/g, '').substring(0, 3); // Limit to 3 digits
    setCardData({ ...cardData, cvc: v });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="bg-white dark:bg-slate-900 w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
        
        {/* Left Side: Order Summary */}
        <div className="w-full md:w-5/12 bg-slate-50 dark:bg-slate-800 p-8 border-r border-slate-200 dark:border-slate-700 flex flex-col">
            <div className="mb-8">
                <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <ShieldCheck className="text-blue-600" /> FlowChat Secure
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
                        <CheckCircle size={16} className="text-green-500" /> Acesso Imediato
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

                        <button type="submit" className="w-full mt-6 bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all shadow-lg">
                            Continuar para Pagamento
                        </button>
                    </form>
                </div>
            )}

            {step === 'payment' && (
                <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex-1 flex flex-col">
                    <div className="mb-6">
                        <button onClick={() => setStep('register')} className="text-xs text-slate-400 hover:text-slate-600 mb-2 hover:underline">Voltar</button>
                        <div className="flex justify-between items-center">
                            <div>
                                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">Passo 2 de 2</span>
                                <h2 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">Dados de Pagamento</h2>
                            </div>
                            <div className="flex gap-2">
                                <div className="h-6 w-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-slate-500">VISA</div>
                                <div className="h-6 w-10 bg-slate-200 dark:bg-slate-700 rounded flex items-center justify-center text-[10px] font-bold text-slate-500">MC</div>
                            </div>
                        </div>
                    </div>

                    <form onSubmit={handlePaymentSubmit} className="space-y-4 flex-1">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome no Cartão</label>
                            <input 
                                type="text" 
                                required
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white uppercase"
                                placeholder="COMO NO CARTAO"
                                value={cardData.name}
                                onChange={e => setCardData({...cardData, name: e.target.value})}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Número do Cartão</label>
                            <div className="relative">
                                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white font-mono"
                                    placeholder="0000 0000 0000 0000"
                                    maxLength={19}
                                    value={cardData.number}
                                    onChange={handleCardNumberChange}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Validade</label>
                                <input 
                                    type="text" 
                                    required
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white text-center"
                                    placeholder="MM/AA"
                                    maxLength={5}
                                    value={cardData.expiry}
                                    onChange={handleExpiryChange}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CVC</label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                                    <input 
                                        type="text" 
                                        required
                                        className="w-full pl-8 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white text-center"
                                        placeholder="123"
                                        maxLength={3}
                                        value={cardData.cvc}
                                        onChange={handleCvcChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800 rounded-lg text-xs text-slate-500 mt-4">
                            <Lock size={14} className="shrink-0 text-green-500"/>
                            <p>Pagamento processado de forma segura e criptografada (SSL 256-bit).</p>
                        </div>

                        <button type="submit" className="w-full mt-4 bg-green-600 text-white py-4 rounded-xl font-bold hover:bg-green-700 transition-all shadow-lg shadow-green-600/20">
                            Pagar R$ {finalPrice},00
                        </button>
                    </form>
                </div>
            )}

            {step === 'processing' && (
                <div className="animate-in fade-in duration-500 flex-1 flex flex-col items-center justify-center text-center space-y-6">
                    <div className="relative">
                        <div className="w-20 h-20 border-4 border-slate-100 dark:border-slate-700 rounded-full"></div>
                        <div className="w-20 h-20 border-4 border-blue-600 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
                        <Shield className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-blue-600" size={24}/>
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 dark:text-white">Processando Pagamento...</h3>
                        <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm max-w-xs mx-auto">
                            Estamos validando suas informações e criando seu ambiente exclusivo. Não feche esta janela.
                        </p>
                    </div>
                </div>
            )}

        </div>
      </div>
    </div>
  );
};

export default StripeCheckoutModal;
