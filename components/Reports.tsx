
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, ComposedChart, Line 
} from 'recharts';
import { 
  Calendar, Filter, Download, PieChart as PieChartIcon, TrendingUp, 
  Users, MessageCircle, AlertCircle, CheckCircle, BarChart2, Loader2 
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { useApp } from '../contexts/AppContext';

// Mock Data Generators
const generateTimelineData = () => [
  { name: 'Seg', sent: 4000, delivered: 3800, read: 2400 },
  { name: 'Ter', sent: 3000, delivered: 2900, read: 2100 },
  { name: 'Qua', sent: 2000, delivered: 1950, read: 1200 },
  { name: 'Qui', sent: 2780, delivered: 2600, read: 1800 },
  { name: 'Sex', sent: 1890, delivered: 1800, read: 1400 },
  { name: 'Sáb', sent: 2390, delivered: 2300, read: 2000 },
  { name: 'Dom', sent: 3490, delivered: 3400, read: 3100 },
];

const AGENT_DATA = [
  { name: 'Alice Silva', sent: 4500, responseRate: 85, avgTime: 2.5 },
  { name: 'Bob Souza', sent: 3200, responseRate: 65, avgTime: 4.0 },
  { name: 'Carla Dias', sent: 5100, responseRate: 92, avgTime: 1.2 },
  { name: 'David Lee', sent: 2100, responseRate: 70, avgTime: 5.5 },
];

const OBJECTIVE_DATA = [
  { name: 'Prospecção', value: 45, color: '#3b82f6' },
  { name: 'Promoção', value: 30, color: '#8b5cf6' },
  { name: 'Comunicação', value: 15, color: '#10b981' },
  { name: 'Venda', value: 10, color: '#f59e0b' },
];

const CAMPAIGN_PERFORMANCE = [
  { name: 'Black Friday', sent: 1500, delivered: 1480, converted: 320 },
  { name: 'Natal Antecipado', sent: 2200, delivered: 2100, converted: 450 },
  { name: 'Leads Frios', sent: 800, delivered: 750, converted: 40 },
  { name: 'Retenção', sent: 1200, delivered: 1190, converted: 600 },
];

const Reports: React.FC = () => {
  const { theme } = useApp();
  const [dateRange, setDateRange] = useState('7d');
  const [selectedAgent, setSelectedAgent] = useState('all');
  const [selectedObjective, setSelectedObjective] = useState('all');
  const [isExporting, setIsExporting] = useState(false);

  const handleExportPDF = async () => {
    const element = document.getElementById('reports-content');
    if (!element) return;

    setIsExporting(true);

    try {
        // Wait a bit to ensure UI is stable (optional but helps)
        await new Promise(resolve => setTimeout(resolve, 100));

        const canvas = await html2canvas(element, {
            scale: 2, // Higher resolution
            useCORS: true,
            logging: false,
            backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' // Match theme background
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const imgWidth = 210; // A4 width in mm
        const pageHeight = 297; // A4 height
        const imgHeight = (canvas.height * imgWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // First page
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Add extra pages if content is long
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save(`relatorio-flowchat-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
        alert("Não foi possível gerar o PDF. Tente novamente.");
    } finally {
        setIsExporting(false);
    }
  };

  // Chart Styling Helper
  const tooltipStyle = {
      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  const axisStyle = {
      fill: theme === 'dark' ? '#94a3b8' : '#64748b',
      fontSize: 12
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={24} />
            Relatórios de Desempenho
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Análise detalhada de envios, engajamento da equipe e conversão.</p>
        </div>
        <button 
            onClick={handleExportPDF}
            disabled={isExporting}
            className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors font-medium shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {isExporting ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
          {isExporting ? 'Gerando...' : 'Exportar PDF'}
        </button>
      </div>

      {/* Reports Content to Capture */}
      <div id="reports-content" className="space-y-6 bg-slate-50 dark:bg-slate-900 p-2 -m-2 rounded-xl">

        {/* Filters Bar */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center transition-colors" data-html2canvas-ignore>
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 font-medium mr-auto">
                <Filter size={18} /> Filtros:
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full md:w-auto">
                <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                    >
                        <option value="today">Hoje</option>
                        <option value="7d">Últimos 7 dias</option>
                        <option value="30d">Últimos 30 dias</option>
                        <option value="month">Este Mês</option>
                    </select>
                </div>

                <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={selectedAgent}
                        onChange={(e) => setSelectedAgent(e.target.value)}
                    >
                        <option value="all">Todos Atendentes</option>
                        <option value="alice">Alice Silva</option>
                        <option value="bob">Bob Souza</option>
                        <option value="carla">Carla Dias</option>
                    </select>
                </div>

                <div className="relative">
                    <PieChartIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <select 
                        className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 dark:text-white rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none appearance-none"
                        value={selectedObjective}
                        onChange={(e) => setSelectedObjective(e.target.value)}
                    >
                        <option value="all">Todos Objetivos</option>
                        <option value="prospecting">Prospecção</option>
                        <option value="promotion">Promoção</option>
                        <option value="communication">Comunicação</option>
                        <option value="sales">Venda</option>
                        <option value="maintenance">Manutenção</option>
                    </select>
                </div>
            </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Total Envios</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">19,560</h3>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium flex items-center gap-1 mt-1">
                        <TrendingUp size={12}/> +12% vs período anterior
                    </span>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg"><MessageCircle size={24}/></div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de Leitura</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">68.4%</h3>
                    <span className="text-xs text-slate-400 mt-1">Média do setor: 45%</span>
                </div>
                <div className="p-3 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg"><CheckCircle size={24}/></div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Taxa de Resposta</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">15.2%</h3>
                    <span className="text-xs text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1 mt-1">
                        <AlertCircle size={12}/> Atenção necessária
                    </span>
                </div>
                <div className="p-3 bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg"><Users size={24}/></div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between transition-colors">
                <div>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">ROI Estimado</p>
                    <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1">18x</h3>
                    <span className="text-xs text-green-600 dark:text-green-400 font-medium mt-1">Excelente</span>
                </div>
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg"><TrendingUp size={24}/></div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Timeline Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Funil de Entregabilidade (Últimos 7 dias)</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={generateTimelineData()} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorRead" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={axisStyle} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={axisStyle} />
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: theme === 'dark' ? '#cbd5e1' : '#334155' }} />
                            <Legend verticalAlign="top" height={36}/>
                            <Area type="monotone" dataKey="sent" name="Enviadas" stroke="#3b82f6" fillOpacity={1} fill="url(#colorSent)" strokeWidth={2} />
                            <Area type="monotone" dataKey="delivered" name="Entregues" stroke="#818cf8" fillOpacity={0} strokeDasharray="5 5" strokeWidth={2} />
                            <Area type="monotone" dataKey="read" name="Lidas" stroke="#10b981" fillOpacity={1} fill="url(#colorRead)" strokeWidth={2} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Objective Distribution */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Distribuição por Objetivo</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={OBJECTIVE_DATA}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                                stroke={theme === 'dark' ? '#1e293b' : '#fff'}
                            >
                                {OBJECTIVE_DATA.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={tooltipStyle} />
                            <Legend verticalAlign="bottom" height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-3">
                    {OBJECTIVE_DATA.map(item => (
                        <div key={item.name} className="flex justify-between items-center text-sm">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded-full" style={{backgroundColor: item.color}}></div>
                                <span className="text-slate-600 dark:text-slate-300">{item.name}</span>
                            </div>
                            <span className="font-bold text-slate-800 dark:text-white">{item.value}%</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Team Performance */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Desempenho por Atendente</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart layout="vertical" data={AGENT_DATA} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                            <CartesianGrid stroke={theme === 'dark' ? '#334155' : '#f5f5f5'} horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" scale="band" tick={axisStyle} width={100} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={tooltipStyle} itemStyle={{ color: theme === 'dark' ? '#cbd5e1' : '#334155' }} />
                            <Legend />
                            <Bar dataKey="sent" name="Msgs Enviadas" barSize={20} fill="#3b82f6" radius={[0, 4, 4, 0]} />
                            <Bar dataKey="responseRate" name="Taxa Resp (%)" barSize={20} fill="#10b981" radius={[0, 4, 4, 0]} />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Campaign Comparison */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Conversão por Campanha</h3>
                <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={CAMPAIGN_PERFORMANCE} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                            <XAxis dataKey="name" tick={axisStyle} />
                            <YAxis tick={axisStyle} />
                            <Tooltip contentStyle={tooltipStyle} itemStyle={{ color: theme === 'dark' ? '#cbd5e1' : '#334155' }} />
                            <Legend />
                            <Bar dataKey="delivered" name="Entregues" stackId="a" fill={theme === 'dark' ? '#475569' : '#94a3b8'} />
                            <Bar dataKey="converted" name="Conversões" stackId="a" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};

export default Reports;
