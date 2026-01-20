import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpRight, MessageSquare, Users, Smartphone, Zap, Clock, User as UserIcon, Server } from 'lucide-react';
import { AgentPlan, UserRole, User, ViewState, LicenseStatus, Contact } from '../types';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import * as financialService from '../services/financialService';
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

      if (role === 'manager') {
          promises.push(teamService.getAgents() as any);
      }

      const [contacts, licStatus, agentsData] = await Promise.all(promises);
      
      setContactCount((contacts as Contact[]).length);
      setLicenseStatus(licStatus as LicenseStatus);
      if (agentsData) setAgents(agentsData as AgentPlan[]);
      
      setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
            {role === 'manager' ? t('welcome_manager') : t('welcome_agent')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {role === 'manager' ? 'Visão geral da infraestrutura e uso da licença.' : 'Acompanhe seu desempenho individual.'}
          </p>
        </div>
        {licenseStatus && (
            <div className="flex gap-2">
                <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 border border-blue-200 dark:border-blue-800">
                  <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full animate-pulse"></div> 
                  {licenseStatus.license.tier}
                </span>
            </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
            title={t('stats_messages')} 
            value={role === 'manager' ? licenseStatus?.usage.usedMessagesThisMonth.toLocaleString() : "1,240"} 
            subtext="Envios Totais" 
            icon={MessageSquare} 
            color="bg-blue-600" 
        />
        <StatCard 
            title={t('stats_contacts')} 
            value={contactCount.toLocaleString()} 
            subtext="Cadastrados" 
            icon={Users} 
            color="bg-indigo-600" 
        />
        
        {/* Manager sees License Seats, Agent sees Personal Metrics */}
        {role === 'manager' ? (
           <StatCard 
                title="Ocupação de Seats" 
                value={`${licenseStatus?.usage.usedSeats || 0} / ${licenseStatus?.totalSeats || 0}`} 
                subtext="Usuários Ativos" 
                icon={Server} 
                color="bg-emerald-500" 
            />
        ) : (
           <StatCard 
                title={t('stats_response')} 
                value="2m 30s" 
                subtext="-10s que a média" 
                icon={Clock} 
                color="bg-emerald-500" 
            />
        )}
        
        {role === 'manager' ? (
            <StatCard 
                title="Instâncias Online" 
                value={`${licenseStatus?.usage.usedInstances || 0} / ${licenseStatus?.totalSeats || 0}`} 
                subtext="Conexões ativas" 
                icon={Smartphone} 
                color="bg-amber-500" 
            />
        ) : (
            <StatCard title="Taxa de Entrega" value="98.2%" subtext="Desempenho alto" icon={Zap} color="bg-amber-500" />
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
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
                <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                <Area type="monotone" dataKey="messages" stroke="#2563eb" strokeWidth={3} fillOpacity={1} fill="url(#colorMessages)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Manager Team Summary */}
        {role === 'manager' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex flex-col h-full transition-colors duration-300">
              <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-white">Uso por Seat</h3>
              </div>
              
              <div className="space-y-6 overflow-y-auto flex-1 pr-2">
                  {loading ? (
                      <p className="text-slate-400 text-sm text-center py-4">Carregando dados...</p>
                  ) : agents.slice(0, 5).map((agent) => (
                        <div key={agent.id} className="group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-600">
                                        {agent.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-slate-800 dark:text-white text-sm leading-tight">{agent.name}</h4>
                                        <p className="text-[10px] text-slate-400">Ativo</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                                        {agent.messagesUsed.toLocaleString()} msgs
                                    </span>
                                </div>
                            </div>
                        </div>
                  ))}
              </div>
              
              <button onClick={() => onNavigate('team')} className="w-full mt-6 py-3 border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-300 font-medium hover:bg-slate-50 dark:hover:bg-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2">
                  <Users size={16} />
                  Gerenciar Seats
              </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;