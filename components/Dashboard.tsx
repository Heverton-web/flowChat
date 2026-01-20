
import React, { useEffect, useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Cell, PieChart, Pie 
} from 'recharts';
import { 
  ArrowUpRight, ArrowDownRight, MessageSquare, Users, Smartphone, Zap, 
  Clock, Server, Activity, Calendar, Filter, MoreHorizontal, AlertTriangle, CheckCircle 
} from 'lucide-react';
import { AgentPlan, UserRole, User, ViewState, LicenseStatus, Contact } from '../types';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';

// --- MOCK DATA FOR CHARTS ---
const VOLUME_DATA = [
  { name: '00:00', sent: 120, received: 40 },
  { name: '04:00', sent: 80, received: 20 },
  { name: '08:00', sent: 850, received: 450 },
  { name: '12:00', sent: 2400, received: 1800 },
  { name: '16:00', sent: 3100, received: 2200 },
  { name: '20:00', sent: 1200, received: 900 },
  { name: '23:59', sent: 400, received: 150 },
];

const STATUS_DATA = [
  { name: 'Entregues', value: 65, color: '#10b981' }, // emerald-500
  { name: 'Lidas', value: 25, color: '#3b82f6' },    // blue-500
  { name: 'Falhas', value: 10, color: '#ef4444' },    // red-500
];

interface KPICardProps {
    title: string;
    value: string;
    trend: number;
    trendLabel: string;
    icon: any;
    color: string;
}

const KPICard = ({ title, value, trend, trendLabel, icon: Icon, color }: KPICardProps) => {
    const isPositive = trend >= 0;
    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${color} bg-opacity-10 dark:bg-opacity-20 text-current`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isPositive ? 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                    {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
            </div>
            <div>
                <h3 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{value}</h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">{title}</p>
                <p className="text-xs text-slate-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">vs {trendLabel}</p>
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

  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [contactCount, setContactCount] = useState(0);
  const [dateFilter, setDateFilter] = useState('7d');

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

  const chartColorSent = "#3b82f6";
  const chartColorRec = "#8b5cf6";

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            {role === 'manager' ? t('welcome_manager') : t('welcome_agent')}
            {role === 'manager' && <span className="px-2 py-0.5 rounded text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800">Admin</span>}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm">
            {role === 'manager' ? 'Visão unificada da operação e infraestrutura.' : 'Suas métricas de performance hoje.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            {['24h', '7d', '30d'].map((filter) => (
                <button
                    key={filter}
                    onClick={() => setDateFilter(filter)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        dateFilter === filter 
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-md' 
                        : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                >
                    {filter.toUpperCase()}
                </button>
            ))}
            <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-1"></div>
            <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Calendar size={16}/></button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
            title={t('stats_messages')} 
            value={role === 'manager' ? (licenseStatus?.usage.usedMessagesThisMonth.toLocaleString() || '0') : "1,240"} 
            trend={12.5} 
            trendLabel="semana passada"
            icon={MessageSquare} 
            color="bg-blue-500" 
        />
        <KPICard 
            title={role === 'manager' ? "Instâncias Online" : "Tempo Médio Resp."}
            value={role === 'manager' ? `${licenseStatus?.usage.usedInstances || 0}/${licenseStatus?.totalSeats || 0}` : "1m 30s"} 
            trend={role === 'manager' ? 0 : -15} // Negative time is good
            trendLabel={role === 'manager' ? "ontem" : "média da equipe"}
            icon={role === 'manager' ? Server : Clock} 
            color="bg-emerald-500" 
        />
        <KPICard 
            title={t('stats_contacts')} 
            value={contactCount.toLocaleString()} 
            trend={5.2} 
            trendLabel="mês anterior"
            icon={Users} 
            color="bg-indigo-500" 
        />
        <KPICard 
            title={role === 'manager' ? "Custo Estimado" : "Satisfação (CSAT)"} 
            value={role === 'manager' ? "R$ 4.500" : "4.9/5.0"} 
            trend={role === 'manager' ? 2.1 : 0.5} 
            trendLabel={role === 'manager' ? "mês anterior" : "últimos 10 chats"}
            icon={role === 'manager' ? Activity : Zap} 
            color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Main Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex justify-between items-center mb-6">
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Fluxo de Mensagens</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Volume de tráfego (Enviadas vs Recebidas)</p>
              </div>
              <div className="flex gap-4">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-blue-500"></span> Enviadas
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300">
                      <span className="w-2 h-2 rounded-full bg-violet-500"></span> Recebidas
                  </div>
              </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={VOLUME_DATA}>
                <defs>
                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColorSent} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartColorSent} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={chartColorRec} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={chartColorRec} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    itemStyle={{color: theme === 'dark' ? '#fff' : '#1e293b'}}
                />
                <Area type="monotone" dataKey="sent" stroke={chartColorSent} strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" />
                <Area type="monotone" dataKey="received" stroke={chartColorRec} strokeWidth={3} fillOpacity={1} fill="url(#colorRec)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Panel: Health & Status */}
        <div className="space-y-6">
            
            {/* System Health */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">Saúde da Operação</h3>
                
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg">
                                <Smartphone size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Instâncias</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">Todas Conectadas</p>
                            </div>
                        </div>
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                <Zap size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Latência API</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">45ms (Ótimo)</p>
                            </div>
                        </div>
                        <span className="text-xs font-bold text-green-500">-2ms</span>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 rounded-lg">
                                <Server size={18} />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 uppercase">Uso de Seats</p>
                                <p className="text-sm font-bold text-slate-800 dark:text-white">{licenseStatus?.usage.usedSeats || 0} / {licenseStatus?.totalSeats || 0}</p>
                            </div>
                        </div>
                        {((licenseStatus?.usage.usedSeats || 0) / (licenseStatus?.totalSeats || 1)) > 0.8 && (
                            <AlertTriangle size={16} className="text-amber-500" />
                        )}
                    </div>
                </div>
            </div>

            {/* Message Status Donut */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center">
                <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide self-start mb-2">Status de Entrega</h3>
                <div className="h-32 w-full flex items-center justify-between">
                    <div className="w-32 h-32 relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={STATUS_DATA}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={35}
                                    outerRadius={50}
                                    dataKey="value"
                                    stroke="none"
                                >
                                    {STATUS_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                            <span className="text-xs font-bold text-slate-400">Total</span>
                            <span className="text-sm font-bold text-slate-800 dark:text-white">12k</span>
                        </div>
                    </div>
                    <div className="flex flex-col gap-2">
                        {STATUS_DATA.map((item) => (
                            <div key={item.name} className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}}></div>
                                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{item.name}</span>
                                <span className="text-xs text-slate-400">({item.value}%)</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Section: Leaderboard (Manager) or History (Agent) */}
      {role === 'manager' && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      <Users size={20} className="text-blue-600"/> Ranking de Performance
                  </h3>
                  <button onClick={() => onNavigate('team')} className="text-sm text-blue-600 font-bold hover:underline">Ver Todos</button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                      <p className="text-slate-400 text-sm py-4">Carregando dados...</p>
                  ) : agents.slice(0, 3).map((agent, index) => (
                      <div key={agent.id} className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 dark:bg-slate-700/30 border border-slate-100 dark:border-slate-700 relative overflow-hidden group">
                          <div className="absolute top-0 right-0 p-3 opacity-10 font-black text-4xl text-slate-400 select-none pointer-events-none">#{index + 1}</div>
                          <div className="w-12 h-12 rounded-full bg-white dark:bg-slate-600 border-2 border-white dark:border-slate-500 shadow-sm flex items-center justify-center font-bold text-slate-600 dark:text-slate-200 text-lg relative z-10">
                              {agent.name.charAt(0)}
                              <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-slate-600 rounded-full"></div>
                          </div>
                          <div className="flex-1 relative z-10">
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm">{agent.name}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{agent.messagesUsed.toLocaleString()} mensagens</p>
                              <div className="w-full bg-slate-200 dark:bg-slate-600 rounded-full h-1.5 overflow-hidden">
                                  <div className="bg-blue-600 h-full rounded-full" style={{width: `${Math.min((agent.messagesUsed / 3000) * 100, 100)}%`}}></div>
                              </div>
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      )}
    </div>
  );
};

export default Dashboard;
