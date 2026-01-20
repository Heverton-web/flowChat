
import React, { useState, useEffect } from 'react';
import { 
  DollarSign, CreditCard, Calendar, Download, Search, TrendingUp, TrendingDown,
  Package, QrCode, Smartphone, CheckCircle, Loader2, ArrowRight, Shield, FileText, BookUser, AlertTriangle, Info, Crown, BarChart2
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, User } from '../types';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';

interface FinancialProps {
  currentUser: User;
}

// Mock data for the chart since backend history might be limited
const CHART_DATA = [
  { month: 'Jun', amount: 4100 },
  { month: 'Jul', amount: 4250 },
  { month: 'Ago', amount: 4150 },
  { month: 'Set', amount: 4400 },
  { month: 'Out', amount: 4350 },
  { month: 'Nov', amount: 4500 },
];

const Financial: React.FC<FinancialProps> = ({ currentUser }) => {
  const { theme } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'history' | 'purchase'>('history');
  
  // Purchase State
  const [productType, setProductType] = useState<'messages' | 'contacts' | 'premium'>('messages');
  const [packQuantity, setPackQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('pix');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Constants
  const PRICE_MSG = 9.90;
  const SIZE_MSG = 1000;
  const PRICE_CONTACT = 7.99;
  const SIZE_CONTACT = 500;
  const PRICE_PREMIUM = 19.90;

  useEffect(() => {
    loadData();
    // Default to purchase tab if agent and history is empty to encourage buying
    if (currentUser.role === 'agent' && transactions.length === 0) {
        setActiveTab('purchase');
    }
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    const data = await financialService.getTransactions(currentUser.id, currentUser.role);
    setTransactions(data);
    setLoading(false);
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    try {
        if (productType === 'premium') {
            await financialService.purchasePremiumSubscription(
                currentUser.id,
                currentUser.name,
                paymentMethod
            );
        } else {
            await financialService.purchaseExtraPack(
                currentUser.id, 
                currentUser.name, 
                packQuantity, 
                paymentMethod,
                productType
            );
        }
        setShowSuccess(true);
        loadData(); // Reload history
    } catch (e) {
        alert('Erro ao processar pagamento');
    } finally {
        setIsProcessing(false);
    }
  };

  const closeSuccess = () => {
      setShowSuccess(false);
      setActiveTab('history');
      setPackQuantity(1);
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  const exportToCSV = () => {
      const headers = ['ID', 'Data', 'Descrição', 'Usuário', 'Método', 'Valor', 'Status'];
      const csvRows = [headers.join(',')];

      transactions.forEach(t => {
          const row = [
              t.id,
              new Date(t.date).toLocaleDateString(),
              `"${t.description}"`,
              t.userName,
              t.paymentMethod,
              t.amount.toFixed(2),
              t.status
          ];
          csvRows.push(row.join(','));
      });

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `extrato_financeiro_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
  };

  const generateReceipt = (transaction: Transaction) => {
    const doc = new jsPDF();

    // Header
    doc.setFillColor(37, 99, 235); // Blue
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text("RECIBO DE PAGAMENTO", 105, 25, { align: "center" });

    // Reset Text
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "normal");
    
    let y = 60;
    const lineHeight = 12;
    const margin = 20;

    // Transaction Details Box
    doc.setDrawColor(200, 200, 200);
    doc.setFillColor(250, 250, 250);
    doc.roundedRect(15, 50, 180, 100, 3, 3, 'FD');

    doc.setFontSize(12);

    // Data
    doc.setFont("helvetica", "bold");
    doc.text("Data:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(transaction.date).toLocaleString('pt-BR'), margin + 40, y);
    y += lineHeight;

    // Descrição
    doc.setFont("helvetica", "bold");
    doc.text("Descrição:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(transaction.description, margin + 40, y);
    y += lineHeight;

    // Nome
    doc.setFont("helvetica", "bold");
    doc.text("Nome:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(transaction.userName, margin + 40, y);
    y += lineHeight;

    // Forma de Pgto
    doc.setFont("helvetica", "bold");
    doc.text("Forma de pgto:", margin, y);
    doc.setFont("helvetica", "normal");
    const method = transaction.paymentMethod === 'credit_card' ? 'Cartão de Crédito' : 'PIX';
    doc.text(method, margin + 40, y);
    y += lineHeight;

    // Valor
    doc.setFont("helvetica", "bold");
    doc.text("Valor:", margin, y);
    doc.setFont("helvetica", "normal");
    doc.text(`R$ ${transaction.amount.toFixed(2).replace('.', ',')}`, margin + 40, y);
    y += lineHeight;

    // Status
    doc.setFont("helvetica", "bold");
    doc.text("Status:", margin, y);
    doc.setTextColor(22, 163, 74); // Green
    doc.setFont("helvetica", "bold");
    doc.text("PAGO", margin + 40, y);
    
    // Reset Color
    doc.setTextColor(0, 0, 0);
    
    // Footer ID
    y = 130;
    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text(`ID da Transação: ${transaction.id}`, 105, y, { align: "center" });
    
    doc.text("Obrigado pela sua preferência.", 105, 180, { align: "center" });
    doc.text("FlowChat Business", 105, 185, { align: "center" });

    doc.save(`recibo_${transaction.id}.pdf`);
  };

  const getPrice = () => {
      if (productType === 'premium') return PRICE_PREMIUM;
      return productType === 'messages' ? PRICE_MSG : PRICE_CONTACT;
  };

  const currentPrice = getPrice();
  const totalPrice = productType === 'premium' ? PRICE_PREMIUM : currentPrice * packQuantity;

  // Chart Styles
  const chartColor = "#3b82f6";
  const tooltipStyle = {
      backgroundColor: theme === 'dark' ? '#1e293b' : '#fff',
      borderColor: theme === 'dark' ? '#334155' : '#e2e8f0',
      color: theme === 'dark' ? '#f1f5f9' : '#1e293b',
      borderRadius: '8px',
      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="text-blue-600 dark:text-blue-400" size={24}/>
                Financeiro
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
                {currentUser.role === 'manager' 
                    ? 'Gestão de custos, faturas e histórico de pagamentos.' 
                    : 'Gerencie seus pacotes e recursos premium.'}
            </p>
        </div>
        
        <div className="flex gap-2">
            {activeTab === 'history' && (
                <button 
                    onClick={exportToCSV}
                    disabled={transactions.length === 0}
                    className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-all shadow-sm"
                >
                    <Download size={18} /> Exportar Extrato
                </button>
            )}
            
            {currentUser.role === 'agent' && activeTab === 'history' && (
                <button 
                    onClick={() => setActiveTab('purchase')}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-sm font-medium transition-all"
                >
                    <Package size={18} />
                    Nova Compra
                </button>
            )}
        </div>
      </div>

      {/* Stats Cards (Manager Only) */}
      {currentUser.role === 'manager' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <DollarSign size={64} />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Custo Total (Mês)</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">R$ 4.500,00</h3>
                  <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <TrendingUp size={12}/> +3.4%
                      </span>
                      <span className="text-xs text-slate-400">vs mês anterior</span>
                  </div>
              </div>
              
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Package size={64} />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Extras Contratados</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">R$ 450,90</h3>
                  <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">
                          45 Pacotes
                      </span>
                      <span className="text-xs text-slate-400">ativos na equipe</span>
                  </div>
              </div>

              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <Calendar size={64} />
                  </div>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Próxima Fatura</p>
                  <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">01/12/2023</h3>
                  <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200 dark:border-slate-600">
                          <CreditCard size={10}/> Final 4242
                      </span>
                      <span className="text-xs text-green-500 font-medium">Agendado</span>
                  </div>
              </div>
          </div>
      )}

      {/* Navigation Tabs (Agent) */}
      {currentUser.role === 'agent' && (
          <div className="flex border-b border-slate-200 dark:border-slate-700">
              <button 
                onClick={() => setActiveTab('history')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  Histórico de Compras
              </button>
              <button 
                onClick={() => setActiveTab('purchase')}
                className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'purchase' ? 'border-green-600 text-green-600 dark:text-green-400 dark:border-green-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
              >
                  Nova Compra / Assinatura
              </button>
          </div>
      )}

      {/* --- CONTENT: HISTORY --- */}
      {activeTab === 'history' && (
          <div className="space-y-6">
              
              {/* Financial Chart (Manager Only) */}
              {currentUser.role === 'manager' && (
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                      <div className="flex justify-between items-center mb-6">
                          <div>
                              <h3 className="text-lg font-bold text-slate-800 dark:text-white">Evolução de Custos</h3>
                              <p className="text-sm text-slate-500 dark:text-slate-400">Histórico de gastos dos últimos 6 meses</p>
                          </div>
                          <div className="bg-slate-100 dark:bg-slate-700 p-1 rounded-lg flex text-xs font-medium">
                              <button className="px-3 py-1 bg-white dark:bg-slate-600 rounded shadow-sm text-slate-800 dark:text-white">Semestral</button>
                              <button className="px-3 py-1 text-slate-500 dark:text-slate-400 hover:text-slate-700">Anual</button>
                          </div>
                      </div>
                      <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <AreaChart data={CHART_DATA}>
                                  <defs>
                                      <linearGradient id="colorCost" x1="0" y1="0" x2="0" y2="1">
                                          <stop offset="5%" stopColor={chartColor} stopOpacity={0.2}/>
                                          <stop offset="95%" stopColor={chartColor} stopOpacity={0}/>
                                      </linearGradient>
                                  </defs>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12}} dy={10} />
                                  <YAxis axisLine={false} tickLine={false} tick={{fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12}} tickFormatter={(value) => `R$${value/1000}k`} />
                                  <Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']} />
                                  <Area type="monotone" dataKey="amount" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                              </AreaChart>
                          </ResponsiveContainer>
                      </div>
                  </div>
              )}

              {/* Transactions Table */}
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                      <h3 className="font-bold text-slate-700 dark:text-slate-200 text-sm flex items-center gap-2">
                          <FileText size={16}/> Extrato de Transações
                      </h3>
                      {currentUser.role === 'manager' && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                placeholder="Filtrar lançamentos..." 
                                className="pl-9 pr-4 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md outline-none focus:ring-1 focus:ring-blue-500"
                            />
                        </div>
                      )}
                  </div>

                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                              <tr>
                                  <th className="px-6 py-4">Data</th>
                                  <th className="px-6 py-4">Descrição</th>
                                  <th className="px-6 py-4">Responsável</th>
                                  <th className="px-6 py-4">Método</th>
                                  <th className="px-6 py-4">Valor</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Recibo</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                              {loading ? (
                                  <tr><td colSpan={7} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
                              ) : transactions.length === 0 ? (
                                  <tr><td colSpan={7} className="p-8 text-center text-slate-500 dark:text-slate-400">Nenhuma transação encontrada.</td></tr>
                              ) : transactions.map((t) => (
                                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(t.date)}</td>
                                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{t.description}</td>
                                      <td className="px-6 py-4">
                                          <div className="flex items-center gap-2">
                                              <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center text-[10px] font-bold text-indigo-600 dark:text-indigo-400">
                                                  {t.userName.charAt(0)}
                                              </div>
                                              <span className="text-slate-600 dark:text-slate-300 whitespace-nowrap text-xs">{t.userName}</span>
                                          </div>
                                      </td>
                                      <td className="px-6 py-4">
                                          <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 capitalize text-xs">
                                              {t.paymentMethod === 'pix' ? <QrCode size={14} className="text-green-500"/> : <CreditCard size={14} className="text-blue-500"/>}
                                              {t.paymentMethod.replace('_', ' ')}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white whitespace-nowrap">R$ {t.amount.toFixed(2).replace('.', ',')}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                              t.status === 'completed' 
                                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                              : 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300'
                                          }`}>
                                              {t.status === 'completed' ? 'Pago' : t.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button 
                                            onClick={() => generateReceipt(t)}
                                            className="text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors opacity-0 group-hover:opacity-100"
                                            title="Baixar Recibo PDF"
                                          >
                                              <FileText size={16} />
                                          </button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: PURCHASE (AGENT ONLY) --- */}
      {activeTab === 'purchase' && currentUser.role === 'agent' && (
          <div className="flex flex-col lg:flex-row gap-8 items-start animate-in slide-in-from-right-4">
              
              {/* Product Selection */}
              <div className="flex-1 space-y-6">
                  
                  {/* Product Type Toggle */}
                  <div className="bg-white dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 inline-flex flex-wrap gap-2 shadow-sm">
                      <button 
                          onClick={() => { setProductType('messages'); setPackQuantity(1); }}
                          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                              productType === 'messages' 
                              ? 'bg-blue-600 text-white shadow-md' 
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                      >
                          <Package size={16} /> Pacotes de Envios
                      </button>
                      <button 
                          onClick={() => { setProductType('contacts'); setPackQuantity(1); }}
                          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                              productType === 'contacts' 
                              ? 'bg-indigo-600 text-white shadow-md' 
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                      >
                          <BookUser size={16} /> Pacotes de Contatos
                      </button>
                      <button 
                          onClick={() => { setProductType('premium'); setPackQuantity(1); }}
                          className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all ${
                              productType === 'premium' 
                              ? 'bg-amber-500 text-white shadow-md' 
                              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                          }`}
                      >
                          <Crown size={16} /> Recursos Premium
                      </button>
                  </div>

                  {productType === 'premium' ? (
                      <div className="rounded-2xl p-8 text-white shadow-xl transition-colors duration-500 bg-gradient-to-br from-amber-500 to-yellow-600 relative overflow-hidden">
                          {/* Decoration */}
                          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                          
                          <div className="flex items-center gap-3 mb-4 relative z-10">
                              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                  <Crown size={32} className="text-white" fill="currentColor" />
                              </div>
                              <div>
                                  <h3 className="text-2xl font-bold">Assinatura Premium (Individual)</h3>
                                  <p className="text-white/80">Desbloqueie todo o potencial da plataforma.</p>
                              </div>
                          </div>
                          
                          <div className="my-8 flex items-end gap-2 relative z-10">
                              <span className="text-5xl font-bold">R$ 19,90</span>
                              <span className="text-white/80 mb-1 font-medium">/ 30 dias</span>
                          </div>

                          <div className="space-y-3 mb-8 relative z-10">
                              <div className="flex items-center gap-2 text-white/90">
                                  <CheckCircle size={18} className="text-white"/> 
                                  <span>Envio de Áudios (PTT)</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/90">
                                  <CheckCircle size={18} className="text-white"/> 
                                  <span>Envio de Vídeos e Imagens</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/90">
                                  <CheckCircle size={18} className="text-white"/> 
                                  <span>Criação de Enquetes Interativas</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/90">
                                  <CheckCircle size={18} className="text-white"/> 
                                  <span>Envio de Documentos (PDF, Doc)</span>
                              </div>
                          </div>

                          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-start gap-3 relative z-10">
                              <Info className="text-white shrink-0" size={20} />
                              <div>
                                  <h4 className="font-bold text-white text-sm mb-1 uppercase">Assinatura Mensal</h4>
                                  <p className="text-xs text-white/90 leading-relaxed">
                                      O acesso premium é válido por 30 dias a partir da confirmação do pagamento. O pagamento é único e não renova automaticamente.
                                  </p>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className={`rounded-2xl p-8 text-white shadow-xl transition-colors duration-500 ${
                          productType === 'messages' 
                          ? 'bg-gradient-to-br from-blue-600 to-blue-800' 
                          : 'bg-gradient-to-br from-indigo-600 to-purple-800'
                      }`}>
                          <div className="flex items-center gap-3 mb-4">
                              <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
                                  {productType === 'messages' ? <Package size={32} className="text-white" /> : <BookUser size={32} className="text-white" />}
                              </div>
                              <div>
                                  <h3 className="text-2xl font-bold">
                                      {productType === 'messages' ? 'Pacote de Envios Adicional' : 'Pacote de Contatos Adicional'}
                                  </h3>
                                  <p className="text-white/80">
                                      {productType === 'messages' ? 'Para quando sua cota de mensagens acabar.' : 'Aumente o limite da sua carteira de clientes.'}
                                  </p>
                              </div>
                          </div>
                          
                          <div className="my-8 flex items-end gap-2">
                              <span className="text-5xl font-bold">R$ {currentPrice.toFixed(2).replace('.', ',')}</span>
                              <span className="text-white/80 mb-1 font-medium">/ cada {(productType === 'messages' ? SIZE_MSG : SIZE_CONTACT).toLocaleString()} {productType === 'messages' ? 'msgs' : 'contatos'}</span>
                          </div>

                          <div className="space-y-3 mb-8">
                              <div className="flex items-center gap-2 text-white/90">
                                  <CheckCircle size={18} className="text-green-400"/> 
                                  <span>Disponível imediatamente após pagamento</span>
                              </div>
                              <div className="flex items-center gap-2 text-white/90">
                                  <CheckCircle size={18} className="text-green-400"/> 
                                  <span>Pagamento único, não renova automaticamente</span>
                              </div>
                          </div>

                          {/* VALIDITY WARNING */}
                          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-4 rounded-xl flex items-start gap-3">
                              <AlertTriangle className="text-amber-400 shrink-0" size={20} />
                              <div>
                                  <h4 className="font-bold text-amber-400 text-sm mb-1 uppercase">Importante: Validade</h4>
                                  <p className="text-xs text-white/90 leading-relaxed">
                                      Os {productType === 'messages' ? 'envios' : 'espaços para contatos'} adicionais adquiridos neste pacote <strong>expiram em 30 dias</strong> após a data da compra. Planeje seu uso.
                                  </p>
                              </div>
                          </div>
                      </div>
                  )}

                  {productType !== 'premium' && (
                      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
                          <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Quantos pacotes você precisa?</label>
                          <div className="flex items-center gap-4">
                              <button 
                                onClick={() => setPackQuantity(Math.max(1, packQuantity - 1))}
                                className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 font-bold text-xl transition-colors"
                              >-</button>
                              <div className="flex-1 text-center">
                                  <span className="block text-3xl font-bold text-slate-800 dark:text-white">{packQuantity}</span>
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                      {(packQuantity * (productType === 'messages' ? SIZE_MSG : SIZE_CONTACT)).toLocaleString()} {productType === 'messages' ? 'mensagens' : 'contatos'}
                                  </span>
                              </div>
                              <button 
                                onClick={() => setPackQuantity(packQuantity + 1)}
                                className={`w-12 h-12 rounded-lg font-bold text-xl transition-colors ${
                                    productType === 'messages' 
                                    ? 'bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/30 dark:text-blue-400' 
                                    : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200 dark:bg-indigo-900/30 dark:text-indigo-400'
                                }`}
                              >+</button>
                          </div>
                      </div>
                  )}
              </div>

              {/* Checkout Form */}
              <div className="w-full lg:w-96 bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-lg sticky top-6 transition-colors">
                  <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                      <CreditCard size={20} className="text-slate-400"/> Pagamento
                  </h3>

                  <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-200 dark:border-slate-600 mb-6 flex items-start gap-2">
                      <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                      <p className="text-xs text-slate-600 dark:text-slate-300">
                          Este pagamento é avulso e <strong>não altera</strong> o valor da sua mensalidade recorrente nem da empresa.
                      </p>
                  </div>

                  <div className="space-y-4 mb-8">
                      <button 
                        onClick={() => setPaymentMethod('pix')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'pix' ? 'border-green-500 bg-green-50 dark:bg-green-900/20 ring-1 ring-green-500' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}
                      >
                          <div className="flex items-center gap-3">
                              <QrCode size={20} className={paymentMethod === 'pix' ? 'text-green-600 dark:text-green-400' : 'text-slate-400'}/>
                              <span className={`font-medium ${paymentMethod === 'pix' ? 'text-green-800 dark:text-green-300' : 'text-slate-600 dark:text-slate-300'}`}>PIX (Instantâneo)</span>
                          </div>
                          {paymentMethod === 'pix' && <CheckCircle size={18} className="text-green-600 dark:text-green-400"/>}
                      </button>

                      <button 
                        onClick={() => setPaymentMethod('credit_card')}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all ${paymentMethod === 'credit_card' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'}`}
                      >
                          <div className="flex items-center gap-3">
                              <CreditCard size={20} className={paymentMethod === 'credit_card' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400'}/>
                              <span className={`font-medium ${paymentMethod === 'credit_card' ? 'text-blue-800 dark:text-blue-300' : 'text-slate-600 dark:text-slate-300'}`}>Cartão de Crédito</span>
                          </div>
                          {paymentMethod === 'credit_card' && <CheckCircle size={18} className="text-blue-600 dark:text-blue-400"/>}
                      </button>

                      {/* Card Form Mock */}
                      {paymentMethod === 'credit_card' && (
                          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg space-y-3 animate-in fade-in slide-in-from-top-2">
                              <input type="text" placeholder="Número do Cartão" className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded outline-none focus:border-blue-500"/>
                              <div className="flex gap-2">
                                  <input type="text" placeholder="MM/AA" className="w-1/2 p-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded outline-none focus:border-blue-500"/>
                                  <input type="text" placeholder="CVC" className="w-1/2 p-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded outline-none focus:border-blue-500"/>
                              </div>
                              <input type="text" placeholder="Nome no Cartão" className="w-full p-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded outline-none focus:border-blue-500"/>
                          </div>
                      )}
                  </div>

                  <div className="border-t border-slate-100 dark:border-slate-700 pt-4 mb-6">
                      <div className="flex justify-between items-center mb-2 text-slate-500 dark:text-slate-400 text-sm">
                          <span>Subtotal</span>
                          <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                      </div>
                      <div className="flex justify-between items-center text-xl font-bold text-slate-900 dark:text-white">
                          <span>Total</span>
                          <span>R$ {totalPrice.toFixed(2).replace('.', ',')}</span>
                      </div>
                  </div>

                  <button 
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="w-full bg-slate-900 dark:bg-slate-700 text-white py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-slate-600 transition-all disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                      {isProcessing ? <Loader2 className="animate-spin" /> : <ArrowRight size={20} />}
                      {isProcessing ? 'Processando...' : 'Confirmar Pagamento'}
                  </button>
                  <p className="text-center text-xs text-slate-400 mt-4 flex items-center justify-center gap-1">
                      <Shield size={12}/> Pagamento 100% Seguro
                  </p>
              </div>
          </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 transition-colors">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <CheckCircle size={32} />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Pagamento Aprovado!</h3>
                  <p className="text-slate-500 dark:text-slate-400 mb-6">
                      {productType === 'premium' 
                        ? 'Sua assinatura Premium foi ativada e é válida pelos próximos 30 dias.' 
                        : `Seu pacote de ${packQuantity * (productType === 'messages' ? SIZE_MSG : SIZE_CONTACT)} ${productType === 'messages' ? 'mensagens' : 'contatos'} já foi adicionado à sua cota.`
                      }
                  </p>
                  <button 
                    onClick={closeSuccess}
                    className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors"
                  >
                      Voltar ao Painel
                  </button>
              </div>
          </div>
      )}

    </div>
  );
};

export default Financial;
