
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line 
} from 'recharts';
import { 
  Calendar, Filter, Download, PieChart as PieChartIcon, TrendingUp, TrendingDown,
  Users, MessageCircle, AlertCircle, CheckCircle, BarChart2, Loader2, Clock, ThumbsUp
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useApp } from '../contexts/AppContext';

// --- MOCK DATA ---

const TIMELINE_DATA = [
  { name: '06:00', sent: 120, read: 80 },
  { name: '08:00', sent: 850, read: 600 },
  { name: '10:00', sent: 1400, read: 1100 },
  { name: '12:00', sent: 900, read: 750 },
  { name: '14:00', sent: 2100, read: 1800 },
  { name: '16:00', sent: 1800, read: 1600 },
  { name: '18:00', sent: 1200, read: 900 },
  { name: '20:00', sent: 400, read: 300 },
];

const AGENT_LEADERBOARD = [
  { id: 1, name: 'Alice Silva', role: 'Vendas', avatar: 'AS', sent: 4500, tmr: '1m 30s', csat: 4.8, status: 'excellent' },
  { id: 2, name: 'Bob Souza', role: 'Suporte', avatar: 'BS', sent: 3200, tmr: '4m 10s', csat: 4.2, status: 'warning' },
  { id: 3, name: 'Carla Dias', role: 'Vendas', avatar: 'CD', sent: 5100, tmr: '0m 45s', csat: 4.9, status: 'excellent' },
  { id: 4, name: 'David Lee', role: 'Suporte', avatar: 'DL', sent: 2100, tmr: '8m 20s', csat: 3.5, status: 'critical' },
];

const CAMPAIGN_CONVERSION = [
  { name: 'Black Friday', rate: 12.5 },
  { name: 'Natal Antecipado', rate: 18.2 },
  { name: 'Retenção Jan', rate: 8.4 },
  { name: 'Leads Frios', rate: 2.1 },
];

const OBJECTIVE_DATA = [
  { name: 'Venda', value: 45, color: '#10b981' }, // emerald
  { name: 'Suporte', value: 30, color: '#3b82f6' }, // blue
  { name: 'Cobrança', value: 15, color: '#f59e0b' }, // amber
  { name: 'Outros', value: 10, color: '#64748b' }, // slate
];

const Reports: React.FC = () => {
  const { theme } = useApp();
  const [dateRange, setDateRange] = useState('7d');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    const element = document.getElementById('reports-container');
    if (!element) return;

    setIsExporting(true);
    // Add temporary padding for print
    element.style.padding = "20px";
    element.style.backgroundColor = theme === 'dark' ? '#0f172a' : '#f8fafc';

    try {
        await new Promise(resolve => setTimeout(resolve, 500)); // Wait for charts to stabilize
        
        const canvas = await html2canvas(element, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc'
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
        
        const imgWidth = 210;
        const pageHeight = 297;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save('relatorio-performance.pdf');
    } catch (error) {
        console.error('Export failed', error);
    } finally {
        element.style.padding = ""; // Reset
        setIsExporting(false);
    }
  };

  const KPICard = ({ title, value, change, icon: Icon, color }: any) => (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden group hover:border-slate-300 dark:hover:border-slate-600 transition-all">
          <div className={`absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity ${color.text}`}>
              <Icon size={80} />
          </div>
          <div className="relative z-10">
              <div className="flex justify-between items-start mb-4">
                  <div className={`p-3 rounded-xl ${color.bg} ${color.text}`}>
                      <Icon size={24} />
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1 ${change >= 0 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                      {change >= 0 ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
                      {Math.abs(change)}%
                  </span>
              </div>
              <h3 className="text-3xl font-bold text-slate-800 dark:text-white mb-1">{value}</h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">{title}</p>
          </div>
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header Controls */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={28} />
            Analytics & Performance
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Dados consolidados da operação nos últimos {dateRange === '7d' ? '7 dias' : '30 dias'}.</p>
        </div>
        
        <div className="flex flex-wrap gap-3">
            <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="pl-10 pr-8 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-medium text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500 appearance-none shadow-sm cursor-pointer"
                >
                    <option value="today">Hoje</option>
                    <option value="7d">Últimos 7 Dias</option>
                    <option value="30d">Últimos 30 Dias</option>
                    <option value="month">Este Mês</option>
                </select>
            </div>
            
            <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-slate-900/10 disabled:opacity-70"
            >
                {isExporting ? <Loader2 className="animate-spin" size={18}/> : <Download size={18}/>}
                {isExporting ? 'Gerando PDF...' : 'Exportar Relatório'}
            </button>
        </div>
      </div>

      {/* Report Container (Target for PDF Export) */}
      <div id="reports-container" className="space-y-8">
          
          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <KPICard 
                  title="Total de Envios" 
                  value="19,560" 
                  change={12.5} 
                  icon={MessageCircle} 
                  color={{bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-600 dark:text-blue-400'}} 
              />
              <KPICard 
                  title="Taxa de Leitura" 
                  value="68.4%" 
                  change={3.2} 
                  icon={CheckCircle} 
                  color={{bg: 'bg-indigo-100 dark:bg-indigo-900/30', text: 'text-indigo-600 dark:text-indigo-400'}} 
              />
              <KPICard 
                  title="Tempo Médio Resp." 
                  value="2m 15s" 
                  change={-8.4} // Negative implies faster time (good)
                  icon={Clock} 
                  color={{bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-600 dark:text-emerald-400'}} 
              />
              <KPICard 
                  title="CSAT (Satisfação)" 
                  value="4.8/5" 
                  change={0.5} 
                  icon={ThumbsUp} 
                  color={{bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-600 dark:text-amber-400'}} 
              />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Hourly Activity Chart */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Atividade por Hora (Pico)</h3>
                      <div className="flex gap-2">
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><div className="w-2 h-2 rounded-full bg-blue-500"></div> Envios</span>
                          <span className="flex items-center gap-1 text-xs font-medium text-slate-500"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Leituras</span>
                      </div>
                  </div>
                  <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={TIMELINE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                              <defs>
                                  <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                  </linearGradient>
                                  <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                  </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                              <Tooltip 
                                contentStyle={{backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                                itemStyle={{color: theme === 'dark' ? '#fff' : '#1e293b'}}
                              />
                              <Area type="monotone" dataKey="sent" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSent)" activeDot={{r: 6}} />
                              <Area type="monotone" dataKey="read" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRead)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>

              {/* Conversion by Campaign */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Taxa de Conversão (%)</h3>
                  <div className="space-y-5">
                      {CAMPAIGN_CONVERSION.map((camp, idx) => (
                          <div key={idx}>
                              <div className="flex justify-between items-center mb-2">
                                  <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{camp.name}</span>
                                  <span className="text-sm font-bold text-slate-900 dark:text-white">{camp.rate}%</span>
                              </div>
                              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                                  <div 
                                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-600" 
                                    style={{width: `${(camp.rate / 20) * 100}%`}} // Normalized for visual
                                  ></div>
                              </div>
                          </div>
                      ))}
                  </div>
                  <div className="mt-8 p-4 bg-slate-50 dark:bg-slate-700/30 rounded-xl border border-slate-100 dark:border-slate-700/50">
                      <div className="flex items-center gap-2 mb-2">
                          <PieChartIcon size={16} className="text-slate-400"/>
                          <span className="text-xs font-bold text-slate-500 uppercase">Insight do Dia</span>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                          A campanha <strong>"Natal Antecipado"</strong> tem a maior taxa de conversão (18.2%), sugerindo alta receptividade para ofertas sazonais neste momento.
                      </p>
                  </div>
              </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Agent Leaderboard Table */}
              <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                      <h3 className="text-lg font-bold text-slate-800 dark:text-white">Desempenho da Equipe</h3>
                      <button className="text-sm text-blue-600 font-bold hover:underline">Ver Todos</button>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                              <tr>
                                  <th className="px-6 py-4">Agente</th>
                                  <th className="px-6 py-4">Volume</th>
                                  <th className="px-6 py-4">TMR (Médio)</th>
                                  <th className="px-6 py-4 text-right">CSAT</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                              {AGENT_LEADERBOARD.map((agent) => (
                                  <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-slate-500">
                                                  {agent.avatar}
                                              </div>
                                              <div>
                                                  <div className="font-bold text-slate-800 dark:text-white">{agent.name}</div>
                                                  <div className="text-xs text-slate-500">{agent.role}</div>
                                              </div>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                                          {agent.sent.toLocaleString()}
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                              agent.status === 'excellent' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                              agent.status === 'warning' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                                              'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                                          }`}>
                                              {agent.tmr}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <div className="flex items-center justify-end gap-1 font-bold text-slate-800 dark:text-white">
                                              <TrendingUp size={14} className="text-green-500" />
                                              {agent.csat}
                                          </div>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>

              {/* Objective Distribution Donut */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-2 self-start w-full">Distribuição por Objetivo</h3>
                  <div className="h-64 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={OBJECTIVE_DATA}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={70}
                                  outerRadius={90}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {OBJECTIVE_DATA.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                              <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                          </PieChart>
                      </ResponsiveContainer>
                      {/* Centered Total */}
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-3xl font-bold text-slate-800 dark:text-white">100%</span>
                          <span className="text-xs text-slate-400 uppercase">Volume</span>
                      </div>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4 mt-4 w-full">
                      {OBJECTIVE_DATA.map((item) => (
                          <div key={item.name} className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shadow-sm" style={{backgroundColor: item.color}}></div>
                              <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">{item.name} ({item.value}%)</span>
                          </div>
                      ))}
                  </div>
              </div>

          </div>
      </div>
    </div>
  );
};

export default Reports;
