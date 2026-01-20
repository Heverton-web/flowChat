
import React, { useState, useEffect } from 'react';
import { Crown, Check, X as XIcon, HelpCircle, Shield, Zap, Star, Layout, Users, Smartphone, ArrowRight, Loader2, CreditCard } from 'lucide-react';
import { LicenseStatus } from '../types';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

const Subscription: React.FC = () => {
  const { showToast } = useApp();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    setLoading(true);
    try {
        const data = await financialService.getLicenseStatus();
        setLicenseStatus(data);
    } catch (error) {
        console.error("Failed to load license", error);
    } finally {
        setLoading(false);
    }
  };

  const handleSelectPlan = (planName: string) => {
      setSelectedPlan(planName);
      setUpgradeModalOpen(true);
  };

  const confirmUpgrade = async () => {
      setProcessing(true);
      // Simulate API call
      await new Promise(r => setTimeout(r, 2000));
      setProcessing(false);
      setUpgradeModalOpen(false);
      showToast(`Plano ${selectedPlan} contratado com sucesso!`, 'success');
      loadLicense();
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const currentTier = licenseStatus?.license.tier || 'STANDARD';

  // Pricing Data
  const plans = [
      {
          id: 'STANDARD',
          name: 'Standard',
          price: billingCycle === 'monthly' ? 297 : 237,
          description: 'Essencial para pequenas operações.',
          features: [
              { name: '1 Usuário (Seat)', included: true },
              { name: '1 Conexão WhatsApp', included: true },
              { name: 'Envios Ilimitados', included: true },
              { name: 'Gestão de Contatos', included: true },
              { name: 'Dashboard Básico', included: true },
              { name: 'API de Integração', included: false },
              { name: 'White Label', included: false },
          ],
          highlight: false,
          color: 'blue'
      },
      {
          id: 'PROFESSIONAL',
          name: 'Professional',
          price: billingCycle === 'monthly' ? 497 : 397,
          description: 'Para times em crescimento que precisam de escala.',
          features: [
              { name: '5 Usuários (Seats)', included: true },
              { name: '5 Conexões WhatsApp', included: true },
              { name: 'Envios Ilimitados', included: true },
              { name: 'Gestão de Contatos', included: true },
              { name: 'Dashboard Avançado', included: true },
              { name: 'API de Integração', included: true },
              { name: 'White Label', included: false },
          ],
          highlight: true,
          color: 'indigo'
      },
      {
          id: 'ENTERPRISE',
          name: 'Enterprise',
          price: billingCycle === 'monthly' ? 997 : 797,
          description: 'Potência máxima e controle total da marca.',
          features: [
              { name: '15 Usuários (Seats)', included: true },
              { name: '15 Conexões WhatsApp', included: true },
              { name: 'Envios Ilimitados', included: true },
              { name: 'Gestor de Conta Dedicado', included: true },
              { name: 'Dashboard Customizável', included: true },
              { name: 'API de Integração', included: true },
              { name: 'White Label Completo', included: true },
          ],
          highlight: false,
          color: 'slate' // Dark
      }
  ];

  return (
    <div className="space-y-12 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Current Status */}
      <div className="text-center space-y-4 max-w-2xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Escolha o plano ideal para <span className="text-blue-600">escalar</span> sua operação
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
              Desbloqueie todo o potencial do FlowChat com recursos exclusivos.
          </p>
          
          {/* Current Plan Banner */}
          <div className="inline-flex items-center gap-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full border border-blue-100 dark:border-blue-800 text-sm font-medium mt-4">
              <Crown size={16} fill="currentColor" />
              <span>Seu plano atual: <strong>{currentTier}</strong></span>
          </div>
      </div>

      {/* Toggle Monthly/Yearly */}
      <div className="flex justify-center">
          <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-xl flex items-center relative">
              <button 
                  onClick={() => setBillingCycle('monthly')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
              >
                  Mensal
              </button>
              <button 
                  onClick={() => setBillingCycle('yearly')}
                  className={`px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
              >
                  Anual
              </button>
              
              {/* Discount Badge */}
              <div className="absolute -right-24 top-1/2 -translate-y-1/2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 dark:border-green-700 animate-pulse">
                  Economize 20%
              </div>
          </div>
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto px-4 items-center">
          {plans.map((plan) => (
              <div 
                key={plan.id}
                className={`
                    relative rounded-3xl p-8 border transition-all duration-300 flex flex-col h-full
                    ${plan.highlight 
                        ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-2xl scale-105 z-10 ring-4 ring-indigo-500/10' 
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg hover:border-slate-300 dark:hover:border-slate-600'
                    }
                `}
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

                  <div className="mb-6 flex items-end gap-1">
                      <span className="text-4xl font-black text-slate-900 dark:text-white">R$ {plan.price}</span>
                      <span className="text-slate-400 mb-1 font-medium">/mês</span>
                  </div>

                  <button 
                    onClick={() => handleSelectPlan(plan.name)}
                    className={`
                        w-full py-3 rounded-xl font-bold mb-8 transition-all flex items-center justify-center gap-2
                        ${plan.highlight
                            ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20'
                            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white'
                        }
                    `}
                  >
                      {currentTier === plan.id ? 'Seu Plano Atual' : 'Começar Agora'}
                      {currentTier !== plan.id && <ArrowRight size={18} />}
                  </button>

                  <div className="space-y-4 flex-1">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos Inclusos:</p>
                      {plan.features.map((feature, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                              <div className={`mt-0.5 p-0.5 rounded-full ${feature.included ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>
                                  {feature.included ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}
                              </div>
                              <span className={`text-sm ${feature.included ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 line-through'}`}>
                                  {feature.name}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {/* FAQ & Trust Section */}
      <div className="max-w-4xl mx-auto pt-10 border-t border-slate-200 dark:border-slate-800">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <HelpCircle size={20} className="text-blue-500"/> Perguntas Frequentes
                  </h3>
                  <div className="space-y-4">
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Posso cancelar a qualquer momento?</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Sim, não há fidelidade no plano mensal. No plano anual, o reembolso é proporcional em até 7 dias.</p>
                      </div>
                      <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                          <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Emitem Nota Fiscal?</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Sim, a nota fiscal é emitida automaticamente e enviada para o seu email após a confirmação do pagamento.</p>
                      </div>
                  </div>
              </div>
              
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2">
                      <Shield size={20} className="text-green-500"/> Garantia & Segurança
                  </h3>
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                      <div className="flex justify-center gap-4 mb-4 text-slate-400">
                          <Shield size={32} />
                          <Layout size={32} />
                          <Zap size={32} />
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                          Processamos pagamentos via Stripe com criptografia de ponta a ponta. Seus dados nunca são compartilhados.
                      </p>
                      <button className="text-xs text-blue-600 hover:underline font-bold">Ler Termos de Uso</button>
                  </div>
              </div>
          </div>
      </div>

      {/* Checkout Modal */}
      <Modal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title={`Contratar Plano ${selectedPlan}`}
        footer={
            <>
                <button onClick={() => setUpgradeModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                <button onClick={confirmUpgrade} disabled={processing} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    {processing && <Loader2 className="animate-spin" size={16}/>} Confirmar Assinatura
                </button>
            </>
        }
      >
          <div className="space-y-4">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex items-center gap-4 border border-blue-100 dark:border-blue-800">
                  <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-blue-600">
                      <CreditCard size={24} />
                  </div>
                  <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Resumo do Pedido</p>
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white">Plano {selectedPlan} ({billingCycle === 'monthly' ? 'Mensal' : 'Anual'})</h4>
                  </div>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300">
                  Você será redirecionado para o ambiente seguro de pagamento. O acesso aos novos recursos é liberado imediatamente após a confirmação.
              </p>
          </div>
      </Modal>

    </div>
  );
};

export default Subscription;
