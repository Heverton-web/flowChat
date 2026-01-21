
import React, { useState, useEffect } from 'react';
import { 
  Crown, Check, X as XIcon, HelpCircle, Shield, Zap, Star, Layout, Users, Smartphone, 
  ArrowRight, Loader2, CreditCard, Plus, Minus, CheckCircle, Server, MessageSquare, ShieldCheck, 
  Package, LayoutList, Layers
} from 'lucide-react';
import { LicenseStatus } from '../types';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

const Subscription: React.FC = () => {
  const { showToast } = useApp();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation State
  const [activeTab, setActiveTab] = useState<'upgrades' | 'extras' | 'comparison' | 'faq'>('upgrades');

  // Pricing State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // Checkout States
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<{name: string, price: number, type: 'plan' | 'addon'} | null>(null);
  const [processing, setProcessing] = useState(false);

  // Addon States
  const [addonQuantities, setAddonQuantities] = useState({
      whatsapp: 0,
      seat: 0,
      contacts: 0
  });

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

  const handleSelectPlan = (plan: any) => {
      setSelectedItem({
          name: `Plano ${plan.name}`,
          price: plan.price,
          type: 'plan'
      });
      setUpgradeModalOpen(true);
  };

  const handleBuyAddon = (name: string, price: number, quantity: number) => {
      if (quantity === 0) return;
      setSelectedItem({
          name: `${quantity}x ${name}`,
          price: price * quantity,
          type: 'addon'
      });
      setUpgradeModalOpen(true);
  };

  const confirmPurchase = async () => {
      setProcessing(true);
      await new Promise(r => setTimeout(r, 2000));
      setProcessing(false);
      setUpgradeModalOpen(false);
      showToast(`${selectedItem?.name} contratado com sucesso!`, 'success');
      loadLicense();
      setAddonQuantities({ whatsapp: 0, seat: 0, contacts: 0 });
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const currentTier = licenseStatus?.license.tier || 'STANDARD';
  const getPrice = (monthly: number) => billingCycle === 'monthly' ? monthly : Math.round(monthly * 0.8);

  // --- DATA ---
  const plans = [
      {
          id: 'STANDARD', name: 'Standard', price: getPrice(297), originalPrice: 297, description: 'Essencial para pequenas operações.',
          features: [ { name: '1 Usuário (Seat)', included: true }, { name: '1 Conexão WhatsApp', included: true }, { name: 'Gestão de Contatos', included: true }, { name: 'API de Integração', included: false } ],
          highlight: false
      },
      {
          id: 'PROFESSIONAL', name: 'Professional', price: getPrice(497), originalPrice: 497, description: 'Para times em crescimento que precisam de escala.',
          features: [ { name: '5 Usuários (Seats)', included: true }, { name: '5 Conexões WhatsApp', included: true }, { name: 'Gestão de Contatos', included: true }, { name: 'API de Integração', included: true } ],
          highlight: true
      },
      {
          id: 'ENTERPRISE', name: 'Enterprise', price: getPrice(997), originalPrice: 997, description: 'Potência máxima e controle total da marca.',
          features: [ { name: '15 Usuários (Seats)', included: true }, { name: '15 Conexões WhatsApp', included: true }, { name: 'Gestor Dedicado', included: true }, { name: 'API & White Label', included: true } ],
          highlight: false
      }
  ];

  const addons = [
      { id: 'whatsapp', name: 'Conexão Extra', icon: Smartphone, price: 97, desc: 'Adicione mais um número de WhatsApp.', key: 'whatsapp' },
      { id: 'seat', name: 'Usuário Extra', icon: Users, price: 47, desc: 'Acesso para mais um atendente.', key: 'seat' },
      { id: 'contacts', name: 'Pack Contatos', icon: Users, price: 29, desc: '+1.000 contatos na sua base.', key: 'contacts' },
  ];

  const comparisonFeatures = [
      { name: 'Conexões WhatsApp', standard: '1', pro: '5', ent: '15' },
      { name: 'Usuários (Seats)', standard: '1', pro: '5', ent: '15' },
      { name: 'Disparos Mensais', standard: 'Ilimitado', pro: 'Ilimitado', ent: 'Ilimitado' },
      { name: 'Chatbot Builder', standard: 'Básico', pro: 'Avançado', ent: 'Ilimitado' },
      { name: 'API REST', standard: false, pro: true, ent: true },
      { name: 'Webhooks', standard: false, pro: true, ent: true },
      { name: 'White Label', standard: false, pro: false, ent: true },
      { name: 'Suporte', standard: 'Email', pro: 'Chat', ent: 'Gerente Dedicado' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Crown className="text-yellow-500" size={24}/> Planos e Recursos
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">Gerencie sua assinatura e expanda sua operação.</p>
          </div>
          
          <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
              {[
                  { id: 'upgrades', label: 'Upgrades', icon: Zap },
                  { id: 'extras', label: 'Extras e Adicionais', icon: Plus },
                  { id: 'comparison', label: 'Compare os Recursos', icon: LayoutList },
                  { id: 'faq', label: 'Perguntas Frequentes', icon: HelpCircle },
              ].map((tab) => (
                  <button 
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                          activeTab === tab.id 
                          ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' 
                          : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                      }`}
                  >
                      <tab.icon size={16} />
                      {tab.label}
                  </button>
              ))}
          </div>
      </div>

      {/* --- CONTENT: UPGRADES --- */}
      {activeTab === 'upgrades' && (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="text-center space-y-4 max-w-2xl mx-auto">
                  <h3 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Escalone sua operação</h3>
                  <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl relative">
                      <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Mensal</button>
                      <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Anual</button>
                      <div className="absolute -right-24 top-1/2 -translate-y-1/2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 text-[10px] font-bold px-2 py-1 rounded-full border border-green-200 dark:border-green-700 animate-pulse">Economize 20%</div>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                  {plans.map((plan) => (
                      <div key={plan.id} className={`relative rounded-3xl p-8 border transition-all duration-300 flex flex-col h-full ${plan.highlight ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-2xl scale-105 z-10 ring-4 ring-indigo-500/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg'}`}>
                          {plan.highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">Mais Popular</div>}
                          <div className="mb-6">
                              <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{plan.name}</h3>
                              <p className="text-slate-500 dark:text-slate-400 text-sm h-10">{plan.description}</p>
                          </div>
                          <div className="mb-6">
                              {billingCycle === 'yearly' && <span className="text-sm text-slate-400 line-through font-medium block">R$ {plan.originalPrice}/mês</span>}
                              <div className="flex items-end gap-1"><span className="text-4xl font-black text-slate-900 dark:text-white">R$ {plan.price}</span><span className="text-slate-400 mb-1 font-medium">/mês</span></div>
                          </div>
                          <button onClick={() => handleSelectPlan(plan)} disabled={currentTier === plan.id} className={`w-full py-3 rounded-xl font-bold mb-8 transition-all flex items-center justify-center gap-2 ${currentTier === plan.id ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default' : plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white'}`}>
                              {currentTier === plan.id ? <><CheckCircle size={18}/> Plano Atual</> : <>Começar Agora <ArrowRight size={18} /></>}
                          </button>
                          <div className="space-y-4 flex-1">
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Recursos Inclusos:</p>
                              {plan.features.map((feature, idx) => (
                                  <div key={idx} className="flex items-start gap-3">
                                      <div className={`mt-0.5 p-0.5 rounded-full ${feature.included ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-700 text-slate-400'}`}>{feature.included ? <Check size={12} strokeWidth={3} /> : <XIcon size={12} strokeWidth={3} />}</div>
                                      <span className={`text-sm ${feature.included ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400 line-through'}`}>{feature.name}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- CONTENT: EXTRAS --- */}
      {activeTab === 'extras' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 max-w-5xl mx-auto">
              <div className="bg-amber-50 dark:bg-amber-900/10 p-6 rounded-2xl border border-amber-100 dark:border-amber-800/50 mb-8 flex items-start gap-4">
                  <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-xl text-amber-600 dark:text-amber-400"><Layers size={24}/></div>
                  <div>
                      <h4 className="text-lg font-bold text-amber-800 dark:text-amber-200 mb-1">Personalize seu Plano</h4>
                      <p className="text-sm text-amber-700 dark:text-amber-300 max-w-xl">
                          Não precisa mudar de plano se só precisa de mais um recurso. Adicione conexões, usuários ou pacotes de contatos avulsos conforme sua necessidade.
                      </p>
                  </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {addons.map((addon) => (
                      <div key={addon.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                          <div className="flex justify-between items-start mb-4">
                              <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300"><addon.icon size={24} /></div>
                              <span className="text-lg font-bold text-slate-900 dark:text-white">R$ {addon.price}<span className="text-xs text-slate-400 font-normal">/mês</span></span>
                          </div>
                          <h4 className="font-bold text-slate-800 dark:text-white mb-1">{addon.name}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mb-6 flex-1">{addon.desc}</p>
                          <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                              <div className="flex items-center gap-3 px-2">
                                  <button onClick={() => setAddonQuantities({...addonQuantities, [addon.key]: Math.max(0, addonQuantities[addon.key as keyof typeof addonQuantities] - 1)})} className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100"><Minus size={14}/></button>
                                  <span className="font-bold text-slate-800 dark:text-white w-4 text-center">{addonQuantities[addon.key as keyof typeof addonQuantities]}</span>
                                  <button onClick={() => setAddonQuantities({...addonQuantities, [addon.key]: addonQuantities[addon.key as keyof typeof addonQuantities] + 1})} className="w-8 h-8 flex items-center justify-center rounded-md bg-white dark:bg-slate-700 shadow-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100"><Plus size={14}/></button>
                              </div>
                              <button onClick={() => handleBuyAddon(addon.name, addon.price, addonQuantities[addon.key as keyof typeof addonQuantities])} disabled={addonQuantities[addon.key as keyof typeof addonQuantities] === 0} className="bg-slate-900 dark:bg-slate-600 text-white px-4 py-1.5 rounded-md text-xs font-bold disabled:opacity-50 hover:bg-slate-800 transition-colors">Contratar</button>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}

      {/* --- CONTENT: COMPARISON --- */}
      {activeTab === 'comparison' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 max-w-5xl mx-auto">
              <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white text-center">Matriz Completa de Recursos</h3>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                          <thead>
                              <tr className="bg-slate-50/50 dark:bg-slate-800">
                                  <th className="p-4 text-left font-medium text-slate-500 dark:text-slate-400 w-1/3">Funcionalidade</th>
                                  <th className="p-4 text-center font-bold text-slate-700 dark:text-slate-300 w-1/5">Standard</th>
                                  <th className="p-4 text-center font-bold text-indigo-600 dark:text-indigo-400 w-1/5 bg-indigo-50/50 dark:bg-indigo-900/10">Professional</th>
                                  <th className="p-4 text-center font-bold text-slate-800 dark:text-white w-1/5">Enterprise</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {comparisonFeatures.map((row, idx) => (
                                  <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                      <td className="p-4 text-slate-600 dark:text-slate-300 font-medium">{row.name}</td>
                                      <td className="p-4 text-center text-slate-500 dark:text-slate-400">
                                          {typeof row.standard === 'boolean' ? (row.standard ? <Check size={18} className="mx-auto text-green-500"/> : <XIcon size={18} className="mx-auto text-slate-300"/>) : row.standard}
                                      </td>
                                      <td className="p-4 text-center text-slate-700 dark:text-slate-200 bg-indigo-50/30 dark:bg-indigo-900/5 font-medium">
                                          {typeof row.pro === 'boolean' ? (row.pro ? <Check size={18} className="mx-auto text-green-500"/> : <XIcon size={18} className="mx-auto text-slate-300"/>) : row.pro}
                                      </td>
                                      <td className="p-4 text-center text-slate-800 dark:text-white font-bold">
                                          {typeof row.ent === 'boolean' ? (row.ent ? <Check size={18} className="mx-auto text-green-500"/> : <XIcon size={18} className="mx-auto text-slate-300"/>) : row.ent}
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: FAQ --- */}
      {activeTab === 'faq' && (
          <div className="animate-in fade-in slide-in-from-bottom-4 max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><HelpCircle size={20} className="text-blue-500"/> Perguntas Frequentes</h3>
                      <div className="space-y-4">
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Posso cancelar a qualquer momento?</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Sim, não há fidelidade no plano mensal. No plano anual, o reembolso é proporcional em até 7 dias.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Emitem Nota Fiscal?</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">Sim, a nota fiscal é emitida automaticamente e enviada para o seu email após a confirmação do pagamento.</p>
                          </div>
                          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                              <h4 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Como funcionam os Add-ons?</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400">São cobrados mensalmente junto com seu plano base. Você pode remover a qualquer momento.</p>
                          </div>
                      </div>
                  </div>
                  <div>
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><Shield size={20} className="text-green-500"/> Garantia & Segurança</h3>
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm text-center">
                          <div className="flex justify-center gap-4 mb-4 text-slate-400"><Shield size={32} /><Layout size={32} /><Zap size={32} /></div>
                          <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">Processamos pagamentos via Stripe com criptografia de ponta a ponta. Seus dados nunca são compartilhados.</p>
                          <button className="text-xs text-blue-600 hover:underline font-bold">Ler Termos de Uso</button>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Checkout Modal */}
      <Modal
        isOpen={upgradeModalOpen}
        onClose={() => setUpgradeModalOpen(false)}
        title={`Confirmar Contratação`}
        footer={
            <>
                <button onClick={() => setUpgradeModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                <button onClick={confirmPurchase} disabled={processing} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    {processing && <Loader2 className="animate-spin" size={16}/>} Pagar Agora
                </button>
            </>
        }
      >
          <div className="space-y-6">
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-xl flex flex-col gap-4 border border-blue-100 dark:border-blue-800">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white dark:bg-slate-700 rounded-full shadow-sm text-blue-600"><CreditCard size={24} /></div>
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 uppercase font-bold tracking-wide">Resumo do Pedido</p>
                        <h4 className="text-xl font-bold text-slate-800 dark:text-white">{selectedItem?.name}</h4>
                        {selectedItem?.type === 'plan' && <span className="text-xs text-slate-500 bg-white dark:bg-slate-700 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-600 mt-1 inline-block">Ciclo: {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</span>}
                    </div>
                  </div>
                  <div className="flex justify-between items-center border-t border-blue-200 dark:border-blue-800 pt-4 mt-2">
                      <span className="text-slate-600 dark:text-slate-300 font-medium">Total a Pagar:</span>
                      <span className="text-2xl font-black text-blue-700 dark:text-blue-400">R$ {selectedItem?.price},00</span>
                  </div>
              </div>
              <div className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-lg">
                  <ShieldCheck className="text-green-600 shrink-0 mt-0.5" size={18}/>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">Ao confirmar, o valor será cobrado no cartão de crédito cadastrado. O acesso aos novos recursos é liberado imediatamente após a aprovação.</p>
              </div>
          </div>
      </Modal>

    </div>
  );
};

export default Subscription;
