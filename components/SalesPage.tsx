
import React, { useState } from 'react';
import { Check, X, ArrowLeft, MessageCircle, Zap, Shield, Crown, Star, Phone, Users, Server, HelpCircle, ChevronDown, ShieldCheck } from 'lucide-react';
import { PLAN_DEFS } from '../types';
import StripeCheckoutModal from './StripeCheckoutModal';
import { useApp } from '../contexts/AppContext';

interface SalesPageProps {
  onBack: () => void;
  onSuccess: (user: any) => void;
}

const SalesPage: React.FC<SalesPageProps> = ({ onBack, onSuccess }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLAN_DEFS | null>(null);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  const getPrice = (price: number) => billingCycle === 'monthly' ? price : Math.round(price * 0.8);

  const plans = [
    { id: 'START', ...PLAN_DEFS.START, highlight: false },
    { id: 'GROWTH', ...PLAN_DEFS.GROWTH, highlight: true },
    { id: 'SCALE', ...PLAN_DEFS.SCALE, highlight: false },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors overflow-x-hidden">
      
      {/* Navbar */}
      <div className="fixed top-0 w-full z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
              <div className="flex items-center gap-2 cursor-pointer" onClick={onBack}>
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
                      <MessageCircle size={18} fill="currentColor" />
                  </div>
                  <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">FlowChat</span>
              </div>
              <button onClick={onBack} className="text-sm font-medium text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white flex items-center gap-1 transition-colors">
                  <ArrowLeft size={16} /> Voltar para Login
              </button>
          </div>
      </div>

      {/* Hero Section */}
      <div className="pt-32 pb-20 px-6 text-center max-w-4xl mx-auto">
          <span className="inline-block py-1 px-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold uppercase tracking-wide mb-6 animate-in fade-in slide-in-from-bottom-4">
              Enterprise Edition
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 dark:text-white mb-6 leading-tight animate-in fade-in slide-in-from-bottom-6">
              Escalone seu atendimento no <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">WhatsApp</span> hoje.
          </h1>
          <p className="text-lg md:text-xl text-slate-500 dark:text-slate-400 mb-10 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 delay-100">
              Centralize sua equipe, automatize conversas e tenha controle total da sua operação com a plataforma mais robusta do mercado.
          </p>
          
          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 bg-white dark:bg-slate-800 p-1.5 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm relative animate-in fade-in zoom-in delay-200">
              <button 
                onClick={() => setBillingCycle('monthly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  Mensal
              </button>
              <button 
                onClick={() => setBillingCycle('yearly')}
                className={`px-6 py-2 rounded-full text-sm font-bold transition-all relative z-10 ${billingCycle === 'yearly' ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  Anual
              </button>
              <div className="absolute -right-24 top-1/2 -translate-y-1/2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 dark:border-green-700 animate-pulse">
                  Economize 20%
              </div>
          </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-6xl mx-auto px-6 pb-24 grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
          {plans.map((plan, idx) => (
              <div 
                key={plan.id}
                className={`relative bg-white dark:bg-slate-800 rounded-3xl p-8 border transition-all duration-300 flex flex-col h-full hover:-translate-y-2 animate-in fade-in slide-in-from-bottom-8 ${
                    plan.highlight 
                    ? 'border-indigo-500 shadow-2xl z-10 ring-4 ring-indigo-500/10 dark:ring-indigo-500/20' 
                    : 'border-slate-200 dark:border-slate-700 shadow-lg'
                }`}
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                  {plan.highlight && (
                      <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">
                          Mais Popular
                      </div>
                  )}

                  <div className="mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{plan.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm h-10">{plan.description}</p>
                  </div>

                  <div className="mb-8">
                      {billingCycle === 'yearly' && (
                          <span className="text-sm text-slate-400 line-through font-medium block">
                              R$ {plan.price}/mês
                          </span>
                      )}
                      <div className="flex items-end gap-1">
                          <span className="text-4xl font-black text-slate-900 dark:text-white">
                              R$ {getPrice(plan.price)}
                          </span>
                          <span className="text-slate-400 mb-1 font-medium">/mês</span>
                      </div>
                  </div>

                  <button 
                    onClick={() => setSelectedPlan(plan.id as any)}
                    className={`w-full py-4 rounded-xl font-bold mb-8 transition-all shadow-lg ${
                        plan.highlight 
                        ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/30' 
                        : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
                    }`}
                  >
                      Assinar Agora
                  </button>

                  <div className="space-y-4 flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">O que está incluso:</p>
                      
                      {/* Fixed Specs */}
                      <div className="flex items-center gap-3">
                          <div className="p-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600"><Users size={14}/></div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{plan.seats} Usuários (Seats)</span>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="p-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600"><Phone size={14}/></div>
                          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{plan.connections} Conexões WhatsApp</span>
                      </div>

                      {/* Feature List */}
                      {plan.features.slice(2).map((feat, i) => (
                          <div key={i} className="flex items-start gap-3">
                              <div className="mt-0.5"><Check size={16} className="text-slate-400"/></div>
                              <span className="text-sm text-slate-600 dark:text-slate-400">{feat}</span>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {/* Extra Features / Addons Teaser */}
      <div className="bg-slate-100 dark:bg-slate-800 py-20">
          <div className="max-w-6xl mx-auto px-6">
              <div className="text-center mb-16">
                  <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Flexibilidade Total</h2>
                  <p className="text-slate-500 dark:text-slate-400 max-w-2xl mx-auto">
                      Precisa de mais? Adicione recursos extras ao seu plano a qualquer momento dentro da plataforma.
                  </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                      <div className="w-12 h-12 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center text-green-600 mb-4">
                          <Phone size={24}/>
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Conexões Extras</h4>
                      <p className="text-sm text-slate-500">Adicione novos números de WhatsApp por apenas R$ 97/mês.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                      <div className="w-12 h-12 mx-auto bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center text-blue-600 mb-4">
                          <Users size={24}/>
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Usuários Extras</h4>
                      <p className="text-sm text-slate-500">Expanda sua equipe ilimitadamente por R$ 47/seat.</p>
                  </div>
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 text-center">
                      <div className="w-12 h-12 mx-auto bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-600 mb-4">
                          <Zap size={24}/>
                      </div>
                      <h4 className="font-bold text-lg text-slate-800 dark:text-white mb-2">Pacotes de Envios</h4>
                      <p className="text-sm text-slate-500">Compre pacotes de mensagens em massa avulsos conforme demanda.</p>
                  </div>
              </div>
          </div>
      </div>

      {/* Footer */}
      <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 px-6 text-center">
          <p className="text-slate-400 text-sm">© 2024 FlowChat Enterprise. Todos os direitos reservados.</p>
          <div className="flex justify-center gap-4 mt-4">
              <ShieldCheck className="text-slate-300" size={20}/>
              <span className="text-xs text-slate-400">Pagamentos processados via Stripe com criptografia SSL.</span>
          </div>
      </div>

      {/* Checkout Modal */}
      {selectedPlan && (
          <StripeCheckoutModal 
            isOpen={!!selectedPlan}
            onClose={() => setSelectedPlan(null)}
            selectedPlanId={selectedPlan}
            billingCycle={billingCycle}
            onSuccess={onSuccess}
          />
      )}

    </div>
  );
};

export default SalesPage;
