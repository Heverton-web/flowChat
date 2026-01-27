
import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { 
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { 
  Calendar, Download, Users, MessageCircle, BarChart2, TrendingUp, 
  Target, Star, Megaphone, Send, User, Award, FileText, Loader2
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';

// --- MOCK DATA ---

const GENERAL_STATS = {
  totalSent: 45230,
  totalCampaigns: 24,
  csatScore: 4.8
};

const CAMPAIGNS_BY_OBJECTIVE = [
  { name: 'Vendas', value: 45, color: '#10b981' }, // Emerald
  { name: 'Prospecção', value: 25, color: '#3b82f6' }, // Blue
  { name: 'Comunicado', value: 20, color: '#f59e0b' }, // Amber
  { name: 'Retenção', value: 10, color: '#6366f1' }, // Indigo
];

const TOP_CAMPAIGNS = [
  { name: 'Oferta Black Friday', sent: 12500 },
  { name: 'Lançamento V2', sent: 8400 },
  { name: 'Renovação Mensal', sent: 5100 },
];

const AGENT_PERFORMANCE = [
  { id: 1, name: 'Alice Silva', role: 'Vendas', avatar: 'AS', campaigns: 8, sent: 15400, clients: 340, csat: 4.9 },
  { id: 2, name: 'Bob Souza', role: 'Suporte', avatar: 'BS', campaigns: 2, sent: 8200, clients: 150, csat: 4.5 },
  { id: 3, name: 'Carla Dias', role: 'Vendas', avatar: 'CD', campaigns: 12, sent: 18100, clients: 410, csat: 4.8 },
  { id: 4, name: 'David Lee', role: 'Suporte', avatar: 'DL', campaigns: 0, sent: 4100, clients: 90, csat: 4.2 },
  { id: 5, name: 'Elena K.', role: 'CS', avatar: 'EK', campaigns: 2, sent: 3200, clients: 120, csat: 5.0 },
];

const Reports: React.FC = () => {
  const { theme } = useApp();
  const [dateRange, setDateRange] = useState('7d');
  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // --- PDF EXPORT LOGIC ---
  const handleExportPDF = async () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    try {
        // Captura o elemento do relatório
        const canvas = await html2canvas(reportRef.current, {
            scale: 2, // Melhor resolução
            backgroundColor: theme === 'dark' ? '#0f172a' : '#f8fafc', // Garante cor de fundo correta
            useCORS: true, // Para imagens externas se houver
            ignoreElements: (element) => element.hasAttribute('data-html2canvas-ignore') // Ignora botões marcados
        });

        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4');
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = pdf.internal.pageSize.getHeight();
        
        const imgWidth = pdfWidth;
        const imgHeight = (canvas.height * pdfWidth) / canvas.width;
        
        let heightLeft = imgHeight;
        let position = 0;

        // Primeira página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pdfHeight;

        // Páginas subsequentes (se o relatório for longo)
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight; // Ajuste de posição para próxima página
            // Correção padrão para multipage jspdf:
            position -= pdfHeight; 
            
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, - (pdfHeight - heightLeft) /* Ajuste visual aproximado */, imgWidth, imgHeight); 
            // Nota: Lógica simples de corte. Para precisão perfeita em tabelas longas, seria necessário lógica mais complexa de HTML-to-PDF.
            // Para "canvas screenshot", isso imprime tudo que foi renderizado.
            
            // Simplesmente adicionando nova página e subindo a imagem:
            // O loop correto para 'cortar' a imagem longa:
            // A cada iteração, a imagem é desenhada deslocada para cima (Y negativo).
        }
        
        // Reiniciando para lógica simples de 1 página longa ajustada ou múltiplas
        // Se preferir ajuste simples (fit width, multiple pages):
        const pdfSimple = new jsPDF('p', 'mm', 'a4');
        const pageHeight = 295;
        let heightLeftState = imgHeight;
        let positionState = 0;

        pdfSimple.addImage(imgData, 'PNG', 0, positionState, imgWidth, imgHeight);
        heightLeftState -= pageHeight;

        while (heightLeftState >= 0) {
          positionState -= pageHeight;
          pdfSimple.addPage();
          pdfSimple.addImage(imgData, 'PNG', 0, positionState, imgWidth, imgHeight);
          heightLeftState -= pageHeight;
        }

        pdfSimple.save(`relatorio_performance_${dateRange}_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
        console.error("Erro ao gerar PDF:", error);
    } finally {
        setIsExporting(false);
    }
  };

  const KPICard = ({ title, value, sub, icon: Icon, colorClass }: any) => (
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.01]">
          <div className={`p-4 rounded-xl ${colorClass}`}>
              <Icon size={28} />
          </div>
          <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
              <h3 className="text-3xl font-black text-slate-800 dark:text-white">{value}</h3>
              {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
          </div>
      </div>
  );

  return (
    <div ref={reportRef} className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <BarChart2 className="text-blue-600" size={28} />
            Central de Relatórios
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Análise detalhada de performance e engajamento.</p>
        </div>
        
        <div className="flex flex-wrap gap-3 items-center">
            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <Calendar className="text-slate-400 ml-2" size={16} />
                <select 
                    value={dateRange}
                    onChange={(e) => setDateRange(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-700 dark:text-slate-200 outline-none py-2 pr-4 cursor-pointer"
                >
                    <option value="today">Hoje</option>
                    <option value="7d">Últimos 7 dias</option>
                    <option value="15d">Últimos 15 dias</option>
                    <option value="30d">Últimos 30 dias</option>
                </select>
            </div>
            
            {/* Export Button (PDF) */}
            <button 
                onClick={handleExportPDF}
                disabled={isExporting}
                data-html2canvas-ignore="true" // Importante: Ignora este botão na captura
                className="bg-red-600 hover:bg-red-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-red-600/20 disabled:opacity-70 disabled:cursor-not-allowed"
            >
                {isExporting ? <Loader2 size={18} className="animate-spin"/> : <FileText size={18}/>}
                {isExporting ? 'Gerando...' : 'Baixar PDF'}
            </button>
        </div>
      </div>

      {/* SEÇÃO 01: ANÁLISE GERAL */}
      <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              Análise Geral
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <KPICard 
                  title="Total de Envios" 
                  value={GENERAL_STATS.totalSent.toLocaleString()} 
                  sub="Mensagens entregues no período"
                  icon={Send} 
                  colorClass="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" 
              />
              <KPICard 
                  title="Campanhas Disparadas" 
                  value={GENERAL_STATS.totalCampaigns} 
                  sub="Disparos em massa executados"
                  icon={Megaphone} 
                  colorClass="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" 
              />
              <KPICard 
                  title="Nota CSAT (Média)" 
                  value={GENERAL_STATS.csatScore} 
                  sub="Satisfação do Cliente (0-5)"
                  icon={Star} 
                  colorClass="bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400" 
              />
          </div>
      </section>

      {/* SEÇÃO 02: ANÁLISE DE CAMPANHAS */}
      <section>
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-indigo-500"></div>
              Análise de Campanhas
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Distribuição por Objetivo (Donut) */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center">
                  <div className="w-full flex justify-between items-center mb-2">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Target size={20} className="text-slate-400"/> Distribuição por Objetivo
                      </h4>
                  </div>
                  <div className="h-64 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={CAMPAIGNS_BY_OBJECTIVE}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={60}
                                  outerRadius={80}
                                  paddingAngle={5}
                                  dataKey="value"
                                  stroke="none"
                              >
                                  {CAMPAIGNS_BY_OBJECTIVE.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                              <Tooltip contentStyle={{borderRadius: '12px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                              <Legend verticalAlign="bottom" height={36} iconType="circle"/>
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                          <span className="text-3xl font-bold text-slate-800 dark:text-white">{GENERAL_STATS.totalCampaigns}</span>
                          <span className="text-[10px] text-slate-400 uppercase font-bold">Total</span>
                      </div>
                  </div>
              </div>

              {/* Top 3 Campanhas (Bar Chart) */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <div className="w-full flex justify-between items-center mb-6">
                      <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Award size={20} className="text-yellow-500"/> Top 3 - Maior Volume
                      </h4>
                  </div>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={TOP_CAMPAIGNS} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={100} tick={{fill: theme === 'dark' ? '#cbd5e1' : '#475569', fontSize: 11, fontWeight: 'bold'}} />
                              <Tooltip 
                                  cursor={{fill: 'transparent'}}
                                  contentStyle={{borderRadius: '8px', border: 'none', backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                              />
                              <Bar dataKey="sent" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={32}>
                                  {TOP_CAMPAIGNS.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={index === 0 ? '#3b82f6' : index === 1 ? '#60a5fa' : '#93c5fd'} />
                                  ))}
                              </Bar>
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      </section>

      {/* SEÇÃO 03: ANÁLISE POR ATENDENTE */}
      <section>
          <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                  Análise por Atendente
              </h3>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-bold border-b border-slate-100 dark:border-slate-700">
                          <tr>
                              <th className="px-6 py-4">Atendente</th>
                              <th className="px-6 py-4 text-center">Qtd Campanhas</th>
                              <th className="px-6 py-4 text-center">Qtd Envios</th>
                              <th className="px-6 py-4 text-center">Qtd Clientes</th>
                              <th className="px-6 py-4 text-right">Nota CSAT</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                          {AGENT_PERFORMANCE.map((agent) => (
                              <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                                  <td className="px-6 py-4">
                                      <div className="flex items-center gap-3">
                                          <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                              {agent.avatar}
                                          </div>
                                          <div>
                                              <div className="font-bold text-slate-800 dark:text-white">{agent.name}</div>
                                              <div className="text-xs text-slate-500">{agent.role}</div>
                                          </div>
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <span className="inline-block px-2.5 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg text-xs font-bold border border-purple-100 dark:border-purple-800">
                                          {agent.campaigns}
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-center font-mono text-slate-600 dark:text-slate-300">
                                      {agent.sent.toLocaleString()}
                                  </td>
                                  <td className="px-6 py-4 text-center">
                                      <div className="flex items-center justify-center gap-1 text-slate-600 dark:text-slate-300">
                                          <Users size={14} className="text-slate-400"/>
                                          {agent.clients}
                                      </div>
                                  </td>
                                  <td className="px-6 py-4 text-right">
                                      <div className="flex items-center justify-end gap-1 font-bold text-slate-800 dark:text-white">
                                          <Star size={14} className="text-amber-400 fill-amber-400" />
                                          {agent.csat.toFixed(1)}
                                      </div>
                                  </td>
                              </tr>
                          ))}
                      </tbody>
                  </table>
              </div>
              <div className="p-4 bg-slate-50 dark:bg-slate-700/20 border-t border-slate-100 dark:border-slate-700 text-center">
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                      Mostrando {AGENT_PERFORMANCE.length} atendentes ativos. Para ver inativos, acesse o menu Equipe.
                  </p>
              </div>
          </div>
      </section>

    </div>
  );
};

export default Reports;
