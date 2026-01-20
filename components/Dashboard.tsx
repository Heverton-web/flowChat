
import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, MessageSquare, Users, Smartphone, Zap, Clock, TrendingUp, AlertTriangle, PlusCircle, Crown, CheckCircle, BarChart3, Lock, CreditCard, Loader2 } from 'lucide-react';
import { AgentPlan, UserRole, User, GlobalSubscription, ViewState } from '../types';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import { useApp } from '../contexts/AppContext';

const data = [
  { name: 'Seg', messages: 4000 },
  { name: 'Ter', messages: 3000 },
  { name: 'Qua', messages: 2000 },
  { name: 'Qui', messages: 2780 },
  { name: 'Sex', messages: 1890 },
  { name: 'Sáb', messages: 2390 },
  { name: 'Dom', messages: 3490 },
];

const StatCard = ({ title, value, subtext, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex items-start justify-between transition-colors duration-300">
    <div>
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
      <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-2">{value}</h3>
      <div className="flex items-center mt-1 text-green-600 dark:text-green-400 text-sm">
        <ArrowUpRight size={16} className="mr-1" />
        <span>{subtext}</span>
      </div>
    </div>
    <div className={`p-3 rounded-lg ${color}`}>
      <Icon className="text-white" size={24} />
    </div>
  </div>
);

interface DashboardProps {
  role: UserRole;
  currentUser?: User;
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate }) => {
  const { t } = useApp();
  const currentUserId = role === 'agent' ? 'agent-1' : 'manager-1'; 

  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [loadingAgents, setLoadingAgents] = useState(true);
  
  // Agent Specific Data
  const [myPlan, setMyPlan] = useState<AgentPlan | null>(null);
  const [myContactCount, setMyContactCount] = useState(0);
  
  // Manager Specific Data
  const [totalTeamContacts, setTotalTeamContacts] = useState(0);

  const [globalSub, setGlobalSub] = useState<GlobalSubscription | null>(null);
  const [buyingPremium, setBuyingPremium] = useState(false);

  useEffect(() => {
    if (role === 'manager') {
        loadTeamData();
    } else {
        loadAgentData();
    }
  }, [role]);

  const loadTeamData = async () => {
      setLoadingAgents(true);
      const [agentsData, subData, allContacts] = await Promise.all([
          teamService.getAgents(),
          teamService.getGlobalSubscription(),
          contactService.getContacts(currentUserId, 'manager')
      ]);
      setAgents(agentsData);
      setGlobalSub(subData);
      setTotalTeamContacts(allContacts.length);
      setLoadingAgents(false);
  };

  const loadAgentData = async () => {
      setLoadingAgents(true);
      const [agent, sub, contacts] = await Promise.all([
          teamService.getAgentById(currentUserId),
          teamService.getGlobalSubscription(),
          contactService.getContacts(currentUserId, 'agent')
      ]);
      setMyPlan(agent || null);
      setGlobalSub(sub);
      setMyContactCount(contacts.length);
      setLoadingAgents(false);
  };

  const handleBuyPremium = async () => {
      if (role === 'manager') {
          onNavigate('subscription');
          return;
      }

      if (!myPlan) return;
      if (!confirm('Confirmar compra de Premium por R$ 19,90 (Válido por 30 dias)?')) return;
      
      setBuyingPremium(true);
      await new Promise(r => setTimeout(r, 1500)); // Sim delay
      await teamService.activateAgentPremium(myPlan.id);
      await loadAgentData(); // Refresh
      setBuyingPremium(false);
      alert('Premium ativado com sucesso!');
  };

  // Helper to calculate quotas based on role
  const getQuotaData = () => {
      if (role === 'manager') {
          const used = agents.reduce((acc, a) => acc + a.messagesUsed, 0);
          const limit = agents.reduce((acc, a) => acc + (1000 + (a.extraPacks * 1000)), 0);
          const contactLimit = agents.reduce((acc, a) => acc + (500 + (a.extraContactPacks * 500)), 0);
          const extraPacksTotal = agents.reduce((acc, a) => acc + a.extraPacks, 0);
          const extraContactPacksTotal = agents.reduce((acc, a) => acc + a.extraContactPacks, 0);
          
          return {
              msgUsed: used,
              msgLimit: limit,
              msgExtraPacks: extraPacksTotal,
              contactUsed: totalTeamContacts,
              contactLimit: contactLimit,
              contactExtraPacks: extraContactPacksTotal
          };
      } else {
          // Agent
          if (!myPlan) return null;
          const msgLimit = 1000 + (myPlan.extraPacks * 1000);
          const contactLimit = 500 + (myPlan.extraContactPacks * 500);
          return {
              msgUsed: myPlan.messagesUsed,
              msgLimit: msgLimit,
              msgExtraPacks: myPlan.extraPacks,
              contactUsed: myContactCount,
              contactLimit: contactLimit,
              contactExtraPacks: myPlan.extraContactPacks
          };
      }
  };

  const quotaData = getQuotaData();

  // Premium Status Logic
  const isCompanyPremium = globalSub?.hasPremiumFeatures;
  const isPersonalPremium = myPlan?.personalPremiumExpiry && new Date(myPlan.personalPremiumExpiry) > new Date();
  const isPremiumActive = isCompanyPremium || isPersonalPremium;
  
  const getPremiumStatusText = () => {
      if (isCompanyPremium) return { text: 'Premium Corporativo', sub: 'Fornecido pela empresa', color: 'text-indigo-600', bg: 'bg-indigo-100' };
      if (isPersonalPremium && role === 'agent') {
          const daysLeft = Math.ceil((new Date(myPlan!.personalPremiumExpiry!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
          return { text: 'Premium Pessoal', sub: `Expira em ${daysLeft} dias`, color: 'text-amber-600', bg: 'bg-amber-100' };
      }
      return { text: 'Premium Inativo', sub: 'Recursos limitados', color: 'text-slate-500', bg: 'bg-slate-100' };
  };

  const premiumStatus = getPremiumStatusText();

  const calculateQuota = (agent: AgentPlan) => {
    const baseLimit = 1000;
    const packSize = 1000;
    const totalLimit = baseLimit + (agent.extraPacks * packSize);
    const percentage = Math.min(100, (agent.messagesUsed / Math.max(1, totalLimit)) * 100);
    return { percentage, totalLimit };
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {role === 'manager' ? t('welcome_manager') : t('welcome_agent')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {role === 'manager' ? 'Acompanhe o desempenho de todas as instâncias e equipe.' : 'Acompanhe suas métricas de atendimento e cotas.'}
          </p>
        </div>
        <div className="flex gap-2">
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-blue-200 dark:border-blue-800">
              <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div> Live
            </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title={t('stats_messages')} value={role === 'manager' ? "124,592" : myPlan?.messagesUsed.toLocaleString() || "0"} subtext={role === 'manager' ? "+12% essa semana" : "Envios realizados"} icon={MessageSquare} color="bg-blue-600" />
        <StatCard title={t('stats_contacts')} value={role === 'manager' ? totalTeamContacts.toLocaleString() : myContactCount.toLocaleString() || "0"} subtext="Contatos na base" icon={Users} color="bg-indigo-600" />
        
        {/* Conditional Cards based on Role */}
        {role === 'manager' ? (
           <StatCard title={t('stats_instances')} value="3/5" subtext="Conectadas" icon={Smartphone} color="bg-emerald-500" />
        ) : (
           <StatCard title={t('stats_response')} value="2m 30s" subtext="-10s que a média" icon={Clock} color="bg-emerald-500" />
        )}
        
        <StatCard title="Taxa de Entrega" value="98.2%" subtext="Desempenho alto" icon={Zap} color="bg-amber-500" />
      </div>

      {/* SHARED SECTION: QUOTAS & PREMIUM (NOW FOR BOTH ROLES) */}
      {quotaData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4">
              
              {/* Message Quota Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                              <MessageSquare size={18} className="text-blue-500" /> {role === 'manager' ? 'Cota Global de Envios' : 'Cota de Envios'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Mensagens enviadas no ciclo</p>
                      </div>
                      <span className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded">
                          {quotaData.msgExtraPacks > 0 ? `+${quotaData.msgExtraPacks} Pcts` : 'Básico'}
                      </span>
                  </div>
                  
                  {(() => {
                      const percentage = Math.min(100, (quotaData.msgUsed / Math.max(1, quotaData.msgLimit)) * 100);
                      return (
                          <div className="space-y-2">
                              <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-white">
                                  <span>{quotaData.msgUsed.toLocaleString()}</span>
                                  <span>{quotaData.msgLimit.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${percentage > 90 ? 'bg-red-500' : 'bg-blue-500'}`} style={{width: `${percentage}%`}}></div>
                              </div>
                              <div className="flex justify-between text-xs text-slate-400">
                                  <span>Utilizado</span>
                                  <span>{percentage.toFixed(1)}%</span>
                              </div>
                          </div>
                      );
                  })()}
              </div>

              {/* Contacts Quota Card */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-4">
                      <div>
                          <h4 className="font-bold text-slate-700 dark:text-white flex items-center gap-2">
                              <Users size={18} className="text-indigo-500" /> {role === 'manager' ? 'Base Global de Contatos' : 'Base de Contatos'}
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Capacidade da agenda</p>
                      </div>
                      <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-bold px-2 py-1 rounded">
                          {quotaData.contactExtraPacks > 0 ? `+${quotaData.contactExtraPacks} Pcts` : 'Básico'}
                      </span>
                  </div>
                  
                  {(() => {
                      const percentage = Math.min(100, (quotaData.contactUsed / Math.max(1, quotaData.contactLimit)) * 100);
                      return (
                          <div className="space-y-2">
                              <div className="flex justify-between text-sm font-bold text-slate-800 dark:text-white">
                                  <span>{quotaData.contactUsed.toLocaleString()}</span>
                                  <span>{quotaData.contactLimit.toLocaleString()}</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                                  <div className={`h-full rounded-full transition-all duration-1000 ${percentage > 90 ? 'bg-red-500' : 'bg-indigo-500'}`} style={{width: `${percentage}%`}}></div>
                              </div>
                              <div className="flex justify-between text-xs text-slate-400">
                                  <span>Cadastrados</span>
                                  <span>{percentage.toFixed(1)}%</span>
                              </div>
                          </div>
                      );
                  })()}
              </div>

              {/* Premium Status Card */}
              <div className={`p-6 rounded-xl shadow-sm border transition-all relative overflow-hidden ${isPremiumActive ? 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/50' : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                  {isPremiumActive && <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-amber-200/40 to-transparent rounded-bl-full pointer-events-none"></div>}
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                          <h4 className={`font-bold flex items-center gap-2 ${isPremiumActive ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-300'}`}>
                              <Crown size={18} fill={isPremiumActive ? "currentColor" : "none"} /> 
                              Recursos Premium
                          </h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Áudio, Vídeo, Enquetes, Docs</p>
                      </div>
                      <span className={`text-[10px] font-bold px-2 py-1 rounded border uppercase tracking-wider ${isPremiumActive ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-200 text-slate-500 border-slate-300'}`}>
                          {isPremiumActive ? 'ATIVADO' : 'BLOQUEADO'}
                      </span>
                  </div>

                  <div className="mt-4 relative z-10">
                      <div className={`p-3 rounded-lg flex items-center gap-3 ${premiumStatus.bg} ${premiumStatus.color} mb-3`}>
                          {isPremiumActive ? <CheckCircle size={20}/> : <Lock size={20}/>}
                          <div>
                              <div className="font-bold text-sm">{premiumStatus.text}</div>
                              <div className="text-xs opacity-80">{premiumStatus.sub}</div>
                          </div>
                      </div>

                      {!isPremiumActive && (
                          <button 
                            onClick={handleBuyPremium}
                            disabled={buyingPremium}
                            className={`w-full font-bold py-2 rounded-lg text-sm shadow-md transition-all flex items-center justify-center gap-2 ${role === 'manager' ? 'bg-slate-900 dark:bg-slate-600 text-white hover:bg-slate-800' : 'bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 text-white'}`}
                          >
                              {buyingPremium ? <Loader2 className="animate-spin" size={16}/> : <CreditCard size={16} />}
                              {role === 'manager' ? 'Ir para Assinatura' : 'Ativar por R$ 19,90'}
                          </button>
                      )}
                      
                      {!isCompanyPremium && !isPremiumActive && role === 'agent' && (
                          <p className="text-[10px] text-center text-slate-400 mt-2">
                              Válido por 30 dias. Pagamento pessoal.
                          </p>
                      )}
                  </div>
              </div>

          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Chart - Full width for Agents, or shared for Managers */}
        <div className={`${role === 'manager' ? 'lg:col-span-2' : 'lg:col-span-3'} bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 transition-colors duration-300`}>
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white mb-6">Volume de Mensagens (7 Dias)</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data}>
                <defs>
                  <linearGradient id="colorMessages" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#2563eb" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.3} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                />
                <Area type="monotone" dataKey="messages" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Team Performance & Quota - ONLY FOR MANAGER */}
        {role === 'manager' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Cotas Individuais</h3>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">Mensal</span>
              </div>
              
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                  {loadingAgents ? (
                      <p className="text-slate-400 text-sm text-center py-4">Carregando dados...</p>
                  ) : agents.map((agent) => {
                      const { percentage } = calculateQuota(agent);
                      const { totalLimit } = calculateQuota(agent);
                      const isCritical = percentage >= 90;
                      const isWarning = percentage >= 75 && percentage < 90;

                      return (
                        <div key={agent.id} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-600">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-800 dark:text-white text-sm leading-tight">{agent.name}</h4>
                                        <p className="text-[10px] text-slate-400">
                                            {agent.extraPacks > 0 ? `+${agent.extraPacks} Pacotes` : 'Plano Básico'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className={`text-xs font-bold ${isCritical ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-slate-600 dark:text-slate-400'}`}>
                                        {agent.messagesUsed.toLocaleString()}
                                    </span>
                                    <span className="text-[10px] text-slate-400"> / {totalLimit.toLocaleString()}</span>
                                </div>
                            </div>
                            
                            {/* Progress Bar */}
                            <div className="relative w-full h-2 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mb-1">
                                <div 
                                    className={`absolute left-0 top-0 h-full rounded-full transition-all duration-500 ${
                                        isCritical ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-blue-500'
                                    }`}
                                    style={{ width: `${percentage}%` }}
                                ></div>
                            </div>

                            {/* Upgrade Warning/Action */}
                            {isWarning && (
                                <div className="flex items-center justify-between mt-1 animate-in fade-in">
                                    <span className="text-[10px] text-amber-600 dark:text-amber-400 flex items-center gap-1 font-medium">
                                        <AlertTriangle size={10} /> Cota próxima do fim
                                    </span>
                                    <button className="text-[10px] text-blue-600 dark:text-blue-400 hover:text-blue-800 font-bold flex items-center gap-1 hover:underline">
                                        <PlusCircle size={10} /> Fazer Upgrade
                                    </button>
                                </div>
                            )}
                            {isCritical && (
                                <div className="flex items-center justify-between mt-1 animate-in fade-in">
                                    <span className="text-[10px] text-red-600 dark:text-red-400 flex items-center gap-1 font-bold">
                                        <AlertTriangle size={10} /> Cota Crítica!
                                    </span>
                                    <button className="text-[10px] bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 px-2 py-0.5 rounded border border-red-100 dark:border-red-800 hover:bg-red-100 font-bold transition-colors">
                                        Comprar Pacote
                                    </button>
                                </div>
                            )}
                        </div>
                      );
                  })}
              </div>
              
              <button 
                onClick={() => onNavigate('reports')}
                className="w-full mt-6 py-3 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                  <TrendingUp size={16} />
                  Ver Relatório Completo
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
