
import React, { useState, useEffect } from 'react';
import { CreditCard, CheckCircle, Zap, Package, AlertTriangle, Loader2, Calendar, BookUser, Crown, Info, Clock, AlertOctagon } from 'lucide-react';
import { GlobalSubscription, AgentPlan } from '../types';
import * as teamService from '../services/teamService';

const Subscription: React.FC = () => {
  const PRICE_PER_AGENT = 39.90;
  const PRICE_PER_PACK = 9.90; // Messages
  const PRICE_PER_CONTACT_PACK = 7.99; // Contacts
  const PRICE_PREMIUM = 49.90;

  const [subscription, setSubscription] = useState<GlobalSubscription | null>(null);
  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Purchasing State
  const [buyMsgPacks, setBuyMsgPacks] = useState(0);
  const [buyContactPacks, setBuyContactPacks] = useState(0);

  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [subData, agentData] = await Promise.all([
        teamService.getGlobalSubscription(),
        teamService.getAgents()
    ]);
    setSubscription(subData);
    setAgents(agentData);
    setLoading(false);
  };

  const handlePurchase = async () => {
      setProcessing(true);
      // Simulate API delay
      await new Promise(r => setTimeout(r, 1500));
      
      if (buyMsgPacks > 0) await teamService.purchaseGlobalPacks('message', buyMsgPacks);
      if (buyContactPacks > 0) await teamService.purchaseGlobalPacks('contact', buyContactPacks);
      
      setBuyMsgPacks(0);
      setBuyContactPacks(0);
      setProcessing(false);
      setNotification({ msg: 'Pacotes adquiridos com sucesso! Distribua-os na aba Equipe.', type: 'success' });
      setTimeout(() => setNotification(null), 5000);
      loadData();
  };

  const togglePremium = async () => {
      if (!subscription) return;
      setProcessing(true);
      await teamService.togglePremiumFeatures(!subscription.hasPremiumFeatures);
      setProcessing(false);
      loadData();
  };

  if (loading || !subscription) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const totalMonthly = (agents.length * PRICE_PER_AGENT) + 
                       (subscription.totalMessagePacksPurchased * PRICE_PER_PACK) + 
                       (subscription.totalContactPacksPurchased * PRICE_PER_CONTACT_PACK) +
                       (subscription.hasPremiumFeatures ? PRICE_PREMIUM : 0);

  const renewalDateObj = new Date(subscription.renewalDate);
  const daysRemaining = Math.ceil((renewalDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex justify-between items-start">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Assinatura Corporativa</h2>
            <p className="text-slate-500 dark:text-slate-400">Gerencie seus planos globais e aquisição de recursos.</p>
        </div>
        {notification && (
            <div className={`px-4 py-2 rounded-lg text-sm font-medium animate-in fade-in slide-in-from-top-4 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {notification.msg}
            </div>
        )}
      </div>

      {/* WARNING BANNER: 30 DAY RULE */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-4 items-start">
          <AlertOctagon className="text-amber-600 dark:text-amber-400 shrink-0 mt-1" />
          <div className="space-y-1">
              <h4 className="font-bold text-amber-800 dark:text-amber-200 text-sm uppercase">Política de Validade de Serviços</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 leading-relaxed">
                  Todos os serviços contratados (Assinaturas de Atendentes, Pacotes Extras e Premium) possuem <strong>validade de 30 dias</strong>. 
                  Em caso de cancelamento, os serviços permanecerão ativos até o fim do ciclo. A falta de pagamento após o vencimento resultará na <strong>suspensão imediata</strong> de todas as funções.
              </p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT: CURRENT PLAN DETAILS */}
          <div className="lg:col-span-2 space-y-6">
              
              {/* Status Card */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm flex items-center justify-between">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full">
                          <CheckCircle size={24} />
                      </div>
                      <div>
                          <h3 className="text-lg font-bold text-slate-800 dark:text-white">Assinatura Ativa</h3>
                          <p className="text-slate-500 dark:text-slate-400 text-sm flex items-center gap-1">
                              <Calendar size={14} /> Renova em: {renewalDateObj.toLocaleDateString()} ({daysRemaining} dias restantes)
                          </p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="block text-sm text-slate-500 dark:text-slate-400">Total Mensal</span>
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">R$ {totalMonthly.toFixed(2).replace('.', ',')}</span>
                  </div>
              </div>

              {/* Resources Management */}
              <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30">
                      <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Zap size={18} className="text-blue-600" />
                          Aquisição de Recursos Globais
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Adquira pacotes aqui e distribua-os para sua equipe na aba "Equipe".
                      </p>
                  </div>

                  <div className="p-6 space-y-6">
                      
                      {/* Message Packs */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                  <Package size={20} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-700 dark:text-slate-200">Pacotes de Envios</h4>
                                  <p className="text-xs text-slate-500">Saldo Atual: {subscription.totalMessagePacksPurchased} pacotes (Global)</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                                  <button onClick={() => setBuyMsgPacks(Math.max(0, buyMsgPacks - 1))} className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 font-bold">-</button>
                                  <span className="px-2 w-8 text-center text-sm font-bold dark:text-white">{buyMsgPacks}</span>
                                  <button onClick={() => setBuyMsgPacks(buyMsgPacks + 1)} className="px-3 py-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 font-bold">+</button>
                              </div>
                              <div className="text-right min-w-[80px]">
                                  <span className="block text-xs text-slate-400">Add</span>
                                  <span className="font-bold text-blue-600 text-sm">R$ {(buyMsgPacks * PRICE_PER_PACK).toFixed(2).replace('.', ',')}</span>
                              </div>
                          </div>
                      </div>

                      {/* Contact Packs */}
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800">
                          <div className="flex items-center gap-3">
                              <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                  <BookUser size={20} />
                              </div>
                              <div>
                                  <h4 className="font-bold text-slate-700 dark:text-slate-200">Pacotes de Contatos</h4>
                                  <p className="text-xs text-slate-500">Saldo Atual: {subscription.totalContactPacksPurchased} pacotes (Global)</p>
                              </div>
                          </div>
                          <div className="flex items-center gap-3">
                              <div className="flex items-center border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700">
                                  <button onClick={() => setBuyContactPacks(Math.max(0, buyContactPacks - 1))} className="px-3 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-600 font-bold">-</button>
                                  <span className="px-2 w-8 text-center text-sm font-bold dark:text-white">{buyContactPacks}</span>
                                  <button onClick={() => setBuyContactPacks(buyContactPacks + 1)} className="px-3 py-1 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 font-bold">+</button>
                              </div>
                              <div className="text-right min-w-[80px]">
                                  <span className="block text-xs text-slate-400">Add</span>
                                  <span className="font-bold text-indigo-600 text-sm">R$ {(buyContactPacks * PRICE_PER_CONTACT_PACK).toFixed(2).replace('.', ',')}</span>
                              </div>
                          </div>
                      </div>

                      {(buyMsgPacks > 0 || buyContactPacks > 0) && (
                          <div className="pt-4 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                              <button 
                                onClick={handlePurchase}
                                disabled={processing}
                                className="bg-slate-900 dark:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-500 transition-all flex items-center gap-2 shadow-lg"
                              >
                                  {processing ? <Loader2 className="animate-spin" /> : <CreditCard size={18} />}
                                  Confirmar Compra (+ R$ {((buyMsgPacks * PRICE_PER_PACK) + (buyContactPacks * PRICE_PER_CONTACT_PACK)).toFixed(2).replace('.', ',')})
                              </button>
                          </div>
                      )}
                  </div>
              </div>

              {/* Premium Feature */}
              <div className={`rounded-xl border p-6 flex items-center justify-between transition-all ${subscription.hasPremiumFeatures ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/10 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${subscription.hasPremiumFeatures ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                          <Crown size={24} fill={subscription.hasPremiumFeatures ? "currentColor" : "none"} />
                      </div>
                      <div>
                          <h3 className={`font-bold ${subscription.hasPremiumFeatures ? 'text-amber-800 dark:text-amber-200' : 'text-slate-700 dark:text-slate-300'}`}>Pacote Premium</h3>
                          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm">
                              Libera envio de Áudio, Vídeo, Enquetes e Documentos para toda a equipe.
                          </p>
                      </div>
                  </div>
                  <div className="flex items-center gap-4">
                      <span className="text-sm font-bold text-slate-600 dark:text-slate-400">R$ {PRICE_PREMIUM.toFixed(2).replace('.', ',')}/mês</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                          <input type="checkbox" className="sr-only peer" checked={subscription.hasPremiumFeatures} onChange={togglePremium} disabled={processing} />
                          <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 dark:peer-focus:ring-amber-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-amber-500"></div>
                      </label>
                  </div>
              </div>

          </div>

          {/* RIGHT: SUMMARY */}
          <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg p-6 h-fit sticky top-6">
              <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Info size={18} className="text-blue-500" /> Resumo Consolidado
              </h3>

              <div className="space-y-4 mb-6 text-sm">
                  <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Atendentes ({agents.length})</span>
                      <span className="font-medium dark:text-white">R$ {(agents.length * PRICE_PER_AGENT).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Pct. Mensagens ({subscription.totalMessagePacksPurchased})</span>
                      <span className="font-medium dark:text-white">R$ {(subscription.totalMessagePacksPurchased * PRICE_PER_PACK).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                      <span className="text-slate-500 dark:text-slate-400">Pct. Contatos ({subscription.totalContactPacksPurchased})</span>
                      <span className="font-medium dark:text-white">R$ {(subscription.totalContactPacksPurchased * PRICE_PER_CONTACT_PACK).toFixed(2)}</span>
                  </div>
                  {subscription.hasPremiumFeatures && (
                      <div className="flex justify-between text-amber-600 dark:text-amber-400 font-bold">
                          <span>Premium</span>
                          <span>R$ {PRICE_PREMIUM.toFixed(2)}</span>
                      </div>
                  )}
              </div>

              <div className="border-t border-slate-100 dark:border-slate-700 pt-4">
                  <div className="flex justify-between items-end mb-2">
                      <span className="font-bold text-slate-800 dark:text-white">Total Fatura</span>
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">R$ {totalMonthly.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <p className="text-xs text-slate-400 text-center">
                      Renovação automática em {renewalDateObj.toLocaleDateString()}
                  </p>
              </div>
              
              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700">
                  <h4 className="text-xs font-bold text-slate-400 uppercase mb-2">Detalhes de Uso</h4>
                  <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg text-xs space-y-2">
                      <div className="flex justify-between">
                          <span className="text-slate-600 dark:text-slate-300">Msgs Distribuídas:</span>
                          <span className="font-bold">{agents.reduce((acc, a) => acc + a.extraPacks, 0)} / {subscription.totalMessagePacksPurchased}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${(agents.reduce((acc, a) => acc + a.extraPacks, 0) / Math.max(1, subscription.totalMessagePacksPurchased)) * 100}%` }}></div>
                      </div>
                      
                      <div className="flex justify-between pt-1">
                          <span className="text-slate-600 dark:text-slate-300">Contatos Distribuídos:</span>
                          <span className="font-bold">{agents.reduce((acc, a) => acc + a.extraContactPacks, 0)} / {subscription.totalContactPacksPurchased}</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5">
                          <div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${(agents.reduce((acc, a) => acc + a.extraContactPacks, 0) / Math.max(1, subscription.totalContactPacksPurchased)) * 100}%` }}></div>
                      </div>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default Subscription;
