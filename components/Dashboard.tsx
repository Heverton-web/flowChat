
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { 
  MessageSquare, Users, Smartphone, Calendar, 
  TrendingUp, AlertTriangle
} from 'lucide-react';
import { AgentPlan, UserRole, User, ViewState, LicenseStatus, Contact } from '../types';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';

// --- MOCK DATA FOR CHARTS ---
const HOURLY_DATA = [
  { name: '06:00', sent: 120 },
  { name: '08:00', sent: 850 },
  { name: '10:00', sent: 1400 },
  { name: '12:00', sent: 2400 },
  { name: '14:00', sent: 3100 },
  { name: '16:00', sent: 2200 },
  { name: '18:00', sent: 1200 },
  { name: '20:00', sent: 800 },
  { name: '22:00', sent: 400 },
];

// Componente Visual para Barra de Progresso de Saúde
const HealthProgress = ({ current, total, colorClass, label, icon: Icon }: { current: number, total: number, colorClass: string, label: string, icon: any }) => {
    const percentage = Math.min((current / (total || 1)) * 100, 100);
    const isCritical = percentage >= 90;

    return (
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-2.5 rounded-xl ${colorClass} bg-opacity-10 dark:bg-opacity-20 text-current`}>
                    <Icon size={20} className={colorClass.replace('bg-', 'text-')} />
                </div>
                {isCritical && (
                    <div className="flex items-center gap-1 text-xs font-bold text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-1 rounded-full animate-pulse">
                        <AlertTriangle size={12} /> Crítico
                    </div>
                )}
            </div>
            
            <div>
                <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">{label}</p>
                <div className="flex items-end gap-1 mb-3">
                    <span className="text-2xl font-bold text-slate-800 dark:text-white">{current.toLocaleString()}</span>
                    <span className="text-sm text-slate-400 font-medium mb-1">/ {total.toLocaleString()}</span>
                </div>
                
                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                    <div 
                        className={`h-full rounded-full transition-all duration-1000 ${isCritical ? 'bg-red-500' : colorClass.replace('bg-', 'bg-')}`} 
                        style={{ width: `${percentage}%` }}
                    ></div>
                </div>
                <p className="text-right text-[10px] font-bold text-slate-400 mt-1.5">{percentage.toFixed(1)}% utilizado</p>
            </div>
        </div>
    );
};

interface DashboardProps {
  role: UserRole;
  currentUser?: User;
  onNavigate: (view: ViewState) => void;
}

const Dashboard: React.FC<DashboardProps> = ({ role, onNavigate }) => {
  const { t, theme } = useApp();
  const currentUserId = role === 'agent' ? 'agent-1' : 'manager-1'; 
  const isManagerOrAdmin = role === 'manager' || role === 'super_admin';

  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    loadData();
  }, [role]);

  const loadData = async () => {
      setLoading(true);
      const promises: Promise<any>[] = [
          contactService.getContacts(currentUserId, role),
          financialService.getLicenseStatus()
      ];

      if (isManagerOrAdmin) {
          promises.push(teamService.getAgents() as any);
      }

      const [contacts, licStatus, agentsData] = await Promise.all(promises);
      
      setContactCount((contacts as Contact[]).length);
      setLicenseStatus(licStatus as LicenseStatus);
      if (agentsData) setAgents(agentsData as AgentPlan[]);
      
      setLoading(false);
  };

  // Cálculo de Datas do Ciclo
  const getCycleDates = () => {
      if (!licenseStatus) return { start: '-', end: '-' };
      const renewal = new Date(licenseStatus.license.renewalDate);
      const start = new Date(renewal);
      start.setMonth(start.getMonth() - 1);
      
      return {
          start: start.toLocaleDateString('pt-BR'),
          end: renewal.toLocaleDateString('pt-BR')
      };
  };

  const cycle = getCycleDates();
  const chartColorSent = "#3b82f6";

  // Ordenar agentes por mensagens enviadas para o ranking
  const topAgents = [...agents].sort((a, b) => b.messagesUsed - a.messagesUsed).slice(0, 3);

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {isManagerOrAdmin ? 'Painel de Controle' : 'Meu Desempenho'}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            Visão unificada da operação e saúde da conta.
          </p>
        </div>
        
        {/* Date Display (Read Only for context) */}
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-sm font-medium text-slate-600 dark:text-slate-300 shadow-sm">
            <Calendar size={16} className="text-blue-600"/>
            <span>Ciclo Atual: </span>
            <span className="font-bold text-slate-900 dark:text-white">{cycle.start} - {cycle.end}</span>
        </div>
      </div>

      {/* SEÇÃO 01: SAÚDE DA OPERAÇÃO */}
      <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Saúde da Operação
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1: Instâncias */}
              <HealthProgress 
                  label="Instâncias Conectadas"
                  current={licenseStatus?.usage.usedInstances || 0}
                  total={licenseStatus?.totalSeats || 0} // Assumindo 1 seat = 1 instância neste contexto visual
                  colorClass="bg-emerald-500"
                  icon={Smartphone}
              />

              {/* Card 2: Envios (Mensagens) */}
              <HealthProgress 
                  label="Envios no Ciclo"
                  current={licenseStatus?.usage.usedMessagesThisMonth || 0}
                  total={licenseStatus?.license.limits.maxMessagesPerMonth || 5000}
                  colorClass="bg-blue-500"
                  icon={MessageSquare}
              />

              {/* Card 3: Contatos */}
              <HealthProgress 
                  label="Base de Contatos"
                  current={contactCount}
                  total={licenseStatus?.license.limits.maxContacts || 1000}
                  colorClass="bg-purple-500"
                  icon={Users}
              />
          </div>
      </section>

      {/* SEÇÃO 02: FLUXO DE ENVIOS */}
      <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              Fluxo de Envios (Hora a Hora)
          </h3>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={HOURLY_DATA}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColorSent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={chartColorSent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    itemStyle={{color: theme === 'dark' ? '#fff' : '#1e293b'}}
                    formatter={(value) => [value, "Mensagens Enviadas"]}
                />
                <Area type="monotone" dataKey="sent" stroke={chartColorSent} strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
      </section>

      {/* SEÇÃO 03: RANKING DE ENVIOS */}
      {isManagerOrAdmin && (
          <section>
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                      Ranking de Envios (Top 3)
                  </h3>
                  <button onClick={() => onNavigate('team')} className="text-xs text-blue-600 font-bold hover:underline flex items-center gap-1">
                      Ver Equipe Completa <TrendingUp size={12}/>
                  </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {loading ? (
                      <p className="text-slate-400 text-sm py-4 col-span-3 text-center">Carregando dados...</p>
                  ) : topAgents.length === 0 ? (
                      <div className="col-span-3 text-center py-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                          <p className="text-slate-500">Nenhum dado de envio registrado.</p>
                      </div>
                  ) : (
                      topAgents.map((agent, index) => (
                          <div key={agent.id} className="flex items-center gap-4 p-5 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-blue-300 dark:hover:border-blue-600 transition-colors">
                              <div className="absolute top-0 right-0 p-3 opacity-10 font-black text-5xl text-slate-400 select-none pointer-events-none group-hover:text-blue-500 transition-colors">
                                  #{index + 1}
                              </div>
                              
                              <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-700 border-2 border-white dark:border-slate-600 shadow-md flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 text-xl relative z-10 shrink-0">
                                  {agent.name.charAt(0)}
                                  <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-slate-700 rounded-full ${index === 0 ? 'bg-yellow-400' : index === 1 ? 'bg-slate-300' : 'bg-amber-700'}`}></div>
                              </div>
                              
                              <div className="flex-1 relative z-10 min-w-0">
                                  <h4 className="font-bold text-slate-800 dark:text-white text-base truncate">{agent.name}</h4>
                                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2 truncate">{agent.email}</p>
                                  
                                  <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-slate-100 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                                          <div className="bg-blue-600 h-full rounded-full" style={{width: `${Math.min((agent.messagesUsed / 2000) * 100, 100)}%`}}></div>
                                      </div>
                                      <span className="text-xs font-bold text-blue-600 dark:text-blue-400">{agent.messagesUsed.toLocaleString()}</span>
                                  </div>
                              </div>
                          </div>
                      ))
                  )}
              </div>
          </section>
    </div>
  );
};

export default Dashboard;
