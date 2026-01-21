
import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, CreditCard, Calendar, Download, Search, TrendingUp, TrendingDown,
  Package, QrCode, Smartphone, CheckCircle, Loader2, ArrowRight, Shield, FileText, 
  BookUser, AlertTriangle, Info, Crown, BarChart2, Wallet, Plus, Trash2, MoreHorizontal,
  Zap, ShoppingBag, LayoutList, Check, X as XIcon, Minus, Users, Tag, ChevronRight, ShieldCheck, ShoppingCart
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, User, LicenseStatus } from '../types';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface FinancialProps {
  currentUser: User;
}

interface CartItem {
    id: string;
    productId: string;
    name: string;
    price: number;
    quantity: number;
    type: 'plan' | 'addon';
    icon?: any;
    billingCycle?: 'monthly' | 'yearly';
}

// Mock data for the chart
const CHART_DATA = [
  { month: 'Jun', amount: 4100 },
  { month: 'Jul', amount: 4250 },
  { month: 'Ago', amount: 4150 },
  { month: 'Set', amount: 4400 },
  { month: 'Out', amount: 4350 },
  { month: 'Nov', amount: 4500 },
];

const Financial: React.FC<FinancialProps> = ({ currentUser }) => {
  const { theme, showToast } = useApp();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Navigation
  const [activeTab, setActiveTab] = useState<'overview' | 'plans_addons' | 'invoices' | 'wallet'>('overview');

  // Plan Display State
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  
  // --- CART STATE ---
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  
  // Payment Logic
  const [paymentMethod, setPaymentMethod] = useState<'credit_card' | 'pix'>('credit_card');
  const [selectedCardId, setSelectedCardId] = useState<string>('card-1'); 
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number} | null>(null);
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Addon Local Counter (for the store view only)
  const [addonQuantities, setAddonQuantities] = useState({
      whatsapp: 0,
      seat: 0,
      contacts: 0
  });

  // Wallet State
  const [savedCards, setSavedCards] = useState([
      { id: 'card-1', brand: 'mastercard', last4: '4242', expiry: '12/25', holder: 'JOAO SILVA', isDefault: true },
      { id: 'card-2', brand: 'visa', last4: '8899', expiry: '08/24', holder: 'JOAO SILVA', isDefault: false }
  ]);
  const [isAddCardModalOpen, setIsAddCardModalOpen] = useState(false);
  const [newCardData, setNewCardData] = useState({ number: '', holder: '', expiry: '', cvc: '' });

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    const [transData, licStatus] = await Promise.all([
        financialService.getTransactions(currentUser.id, currentUser.role),
        financialService.getLicenseStatus()
    ]);
    setTransactions(transData);
    setLicenseStatus(licStatus);
    setLoading(false);
  };

  const getPrice = (monthly: number) => billingCycle === 'monthly' ? monthly : Math.round(monthly * 0.8);

  // --- PLANS DATA ---
  const plans = [
      {
          id: 'STANDARD', name: 'Standard', price: getPrice(297), originalPrice: 297, description: 'Essencial para pequenas operações.',
          features: [ { name: '1 Usuário (Seat)', included: true }, { name: '1 Conexão WhatsApp', included: true }, { name: 'Gestão de Contatos', included: true }, { name: 'API de Integração', included: false } ],
          highlight: false
      },
      {
          id: 'PROFESSIONAL', name: 'Professional', price: getPrice(497), originalPrice: 497, description: 'Para times em crescimento.',
          features: [ { name: '5 Usuários (Seats)', included: true }, { name: '5 Conexões WhatsApp', included: true }, { name: 'Gestão de Contatos', included: true }, { name: 'API de Integração', included: true } ],
          highlight: true
      },
      {
          id: 'ENTERPRISE', name: 'Enterprise', price: getPrice(997), originalPrice: 997, description: 'Potência máxima e controle total.',
          features: [ { name: '15 Usuários (Seats)', included: true }, { name: '15 Conexões WhatsApp', included: true }, { name: 'Gestor Dedicado', included: true }, { name: 'API & White Label', included: true } ],
          highlight: false
      }
  ];

  // --- ADDONS DATA ---
  const recurringAddons = [
      { id: 'whatsapp', name: 'Conexão Extra', icon: Smartphone, price: 97, desc: 'Adicione mais um número de WhatsApp.', key: 'whatsapp' },
      { id: 'seat', name: 'Usuário Extra', icon: Users, price: 47, desc: 'Acesso para mais um atendente.', key: 'seat' },
  ];

  const consumptionPacks = [
      { id: 'pack_contacts', name: 'Pack Contatos', icon: BookUser, price: 29, desc: '+1.000 contatos na sua base.', key: 'contacts', type: 'one_time' },
      { id: 'pack_messages', name: 'Pack Mensagens', icon: Package, price: 49, desc: '+10.000 mensagens extras.', key: 'messages', type: 'one_time' }
  ];

  // --- CART LOGIC ---

  const addToCart = (item: any, type: 'plan' | 'addon', quantity: number = 1) => {
      setCart(prev => {
          // Rule: Only 1 Plan in cart. If adding a plan, remove existing plan.
          let newCart = type === 'plan' ? prev.filter(i => i.type !== 'plan') : [...prev];
          
          // Check if item already exists to update quantity (for addons)
          const existingItemIndex = newCart.findIndex(i => i.productId === item.id);
          
          if (existingItemIndex >= 0) {
              newCart[existingItemIndex].quantity += quantity;
          } else {
              newCart.push({
                  id: Math.random().toString(36).substr(2, 9),
                  productId: item.id,
                  name: item.name,
                  price: item.price,
                  quantity: quantity,
                  type: type,
                  icon: item.icon || (type === 'plan' ? Crown : Package),
                  billingCycle: type === 'plan' ? billingCycle : undefined
              });
          }
          return newCart;
      });
      showToast(`${item.name} adicionado ao carrinho!`, 'success');
      // Reset local counters
      if (type === 'addon') {
          setAddonQuantities(prev => ({...prev, [item.key]: 0}));
      }
  };

  const removeFromCart = (cartId: string) => {
      setCart(prev => prev.filter(i => i.id !== cartId));
  };

  const calculateTotals = useMemo(() => {
      const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
      
      // 1. Coupon Discount
      const couponDiscountVal = appliedCoupon ? subtotal * appliedCoupon.discount : 0;
      const afterCoupon = subtotal - couponDiscountVal;

      // 2. PIX Discount (5% on top of coupon price)
      const pixDiscountVal = paymentMethod === 'pix' ? afterCoupon * 0.05 : 0;
      
      const total = afterCoupon - pixDiscountVal;

      return { subtotal, couponDiscountVal, pixDiscountVal, total };
  }, [cart, appliedCoupon, paymentMethod]);

  const handleApplyCoupon = () => {
      if (couponCode.toUpperCase() === 'FLOW10') {
          setAppliedCoupon({ code: 'FLOW10', discount: 0.10 }); // 10%
          showToast('Cupom FLOW10 aplicado!', 'success');
      } else {
          showToast('Cupom inválido', 'error');
          setAppliedCoupon(null);
      }
  };

  const confirmPurchase = async () => {
      if (cart.length === 0) return;
      setIsProcessing(true);
      await new Promise(r => setTimeout(r, 2000));
      
      // Mock processing cart items
      // In real app, send cart array to backend
      
      setIsProcessing(false);
      setIsCheckoutOpen(false);
      setCart([]); // Clear cart
      setShowSuccess(true);
      loadData();
  };

  const closeSuccess = () => {
      setShowSuccess(false);
      setActiveTab('invoices');
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('pt-BR', {
          day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
      });
  };

  // ... (CSV, PDF, Card Logic kept same) ...
  const exportToCSV = () => {
      const headers = ['ID', 'Data', 'Descrição', 'Valor', 'Status'];
      const rows = transactions.map(t => [t.id, t.date, t.description, t.amount, t.status].join(','));
      const csv = [headers.join(','), ...rows].join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'faturas.csv'; a.click();
  };

  const generateReceipt = (transaction: Transaction) => {
    const doc = new jsPDF();
    doc.text(`Recibo #${transaction.id}`, 20, 20);
    doc.text(`Valor: R$ ${transaction.amount}`, 20, 30);
    doc.save('recibo.pdf');
  };

  const handleAddCard = () => {
      setIsProcessing(true);
      setTimeout(() => {
          setSavedCards([...savedCards, {
              id: `card-${Math.random()}`, brand: 'visa', last4: newCardData.number.slice(-4) || '1234',
              expiry: newCardData.expiry || '10/28', holder: newCardData.holder.toUpperCase() || 'NOVO CARTAO', isDefault: false
          }]);
          setIsProcessing(false);
          setIsAddCardModalOpen(false);
          setNewCardData({ number: '', holder: '', expiry: '', cvc: '' });
          showToast('Cartão adicionado!', 'success');
      }, 1500);
  };

  const removeCard = (id: string) => {
      setSavedCards(savedCards.filter(c => c.id !== id));
      showToast('Cartão removido.', 'success');
  };

  const chartColor = "#3b82f6";
  const currentTier = licenseStatus?.license.tier || 'STANDARD';

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      
      {/* Header & Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="text-blue-600 dark:text-blue-400" size={24}/>
                Assinatura e Cobrança
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Central financeira: planos, upgrades, recursos e pagamentos.
            </p>
        </div>
        
        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl overflow-x-auto max-w-full">
            <button onClick={() => setActiveTab('overview')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'overview' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                <BarChart2 size={16}/> Visão Geral
            </button>
            <button onClick={() => setActiveTab('plans_addons')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'plans_addons' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                <ShoppingBag size={16}/> Planos e Recursos
            </button>
            <button onClick={() => setActiveTab('invoices')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'invoices' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                <FileText size={16}/> Faturas
            </button>
            <button onClick={() => setActiveTab('wallet')} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'wallet' ? 'bg-white dark:bg-slate-600 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>
                <Wallet size={16}/> Carteira
            </button>
        </div>
      </div>

      {/* --- CONTENT: OVERVIEW --- */}
      {activeTab === 'overview' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Cost Card */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={64} /></div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Custo Total (Mês)</p>
                      <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">R$ 4.500,00</h3>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-green-600 dark:text-green-400 font-bold bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full flex items-center gap-1"><TrendingUp size={12}/> +3.4%</span>
                          <span className="text-xs text-slate-400">vs mês anterior</span>
                      </div>
                  </div>
                  
                  {/* Plan Info */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Crown size={64} /></div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Plano Atual</p>
                      <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">{licenseStatus?.license.tier || 'Standard'}</h3>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-bold bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-full flex items-center gap-1">Renova em {new Date(licenseStatus?.license.renewalDate || '').toLocaleDateString()}</span>
                      </div>
                  </div>

                  {/* Next Invoice */}
                  <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Calendar size={64} /></div>
                      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">Próxima Fatura</p>
                      <h3 className="text-3xl font-bold text-slate-800 dark:text-white mt-1">01/12/2023</h3>
                      <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full flex items-center gap-1 border border-slate-200 dark:border-slate-600"><CreditCard size={10}/> Final 4242</span>
                          <span className="text-xs text-green-500 font-medium">Agendado</span>
                      </div>
                  </div>
              </div>

              {/* Chart */}
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-6">Histórico de Custos</h3>
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
                              <Tooltip contentStyle={{backgroundColor: theme === 'dark' ? '#1e293b' : '#fff', borderColor: theme === 'dark' ? '#334155' : '#e2e8f0', borderRadius: '8px'}} formatter={(value: number) => [`R$ ${value.toFixed(2)}`, 'Custo']} />
                              <Area type="monotone" dataKey="amount" stroke={chartColor} strokeWidth={3} fillOpacity={1} fill="url(#colorCost)" />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: PLANS & ADDONS (STORE) --- */}
      {activeTab === 'plans_addons' && (
          <div className="space-y-10 animate-in slide-in-from-bottom-4 mb-24">
              
              {/* Plans Section */}
              <div className="space-y-6">
                  <div className="text-center space-y-4 max-w-2xl mx-auto">
                      <h3 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Planos e Upgrades</h3>
                      <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl relative">
                          <button onClick={() => setBillingCycle('monthly')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${billingCycle === 'monthly' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Mensal</button>
                          <button onClick={() => setBillingCycle('yearly')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all relative z-10 ${billingCycle === 'yearly' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}>Anual</button>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto items-stretch">
                      {plans.map((plan) => (
                          <div key={plan.id} className={`relative rounded-3xl p-8 border transition-all duration-300 flex flex-col h-full ${plan.highlight ? 'bg-white dark:bg-slate-800 border-indigo-500 shadow-xl scale-105 z-10 ring-4 ring-indigo-500/10' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg'}`}>
                              {plan.highlight && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wide shadow-lg">Mais Popular</div>}
                              <div className="mb-6">
                                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{plan.name}</h3>
                                  <p className="text-slate-500 dark:text-slate-400 text-sm h-10">{plan.description}</p>
                              </div>
                              <div className="mb-6">
                                  <div className="flex items-end gap-1"><span className="text-4xl font-black text-slate-900 dark:text-white">R$ {plan.price}</span><span className="text-slate-400 mb-1 font-medium">/mês</span></div>
                              </div>
                              
                              {/* Plan Action Button */}
                              {currentTier === plan.id ? (
                                  <button disabled className="w-full py-3 rounded-xl font-bold mb-8 flex items-center justify-center gap-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-default">
                                      <CheckCircle size={18}/> Plano Atual
                                  </button>
                              ) : cart.some(i => i.productId === plan.id) ? (
                                  <button disabled className="w-full py-3 rounded-xl font-bold mb-8 flex items-center justify-center gap-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 cursor-default">
                                      <ShoppingCart size={18}/> No Carrinho
                                  </button>
                              ) : (
                                  <button 
                                    onClick={() => addToCart(plan, 'plan')} 
                                    className={`w-full py-3 rounded-xl font-bold mb-8 transition-all flex items-center justify-center gap-2 ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-800 dark:text-white'}`}
                                  >
                                      Adicionar ao Carrinho <Plus size={18} />
                                  </button>
                              )}

                              <div className="space-y-4 flex-1">
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

              {/* Add-ons Section */}
              <div className="max-w-5xl mx-auto border-t border-slate-200 dark:border-slate-700 pt-10">
                  <div className="flex items-center gap-3 mb-6">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg text-amber-600 dark:text-amber-400"><Plus size={24} /></div>
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white">Extras e Pacotes</h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400">Adicione recursos avulsos ao seu plano.</p>
                      </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      {/* Recurring */}
                      {recurringAddons.map((addon) => (
                          <div key={addon.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col hover:border-blue-300 dark:hover:border-blue-700 transition-colors">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300"><addon.icon size={24} /></div>
                                  <span className="text-xs font-bold bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300 px-2 py-1 rounded">Mensal</span>
                              </div>
                              <h4 className="font-bold text-slate-800 dark:text-white mb-1">{addon.name}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">{addon.desc}</p>
                              <div className="mt-auto">
                                  <div className="text-lg font-bold text-slate-900 dark:text-white mb-3">R$ {addon.price}<span className="text-xs text-slate-400 font-normal">/mês</span></div>
                                  <div className="flex items-center justify-between bg-slate-50 dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
                                      <div className="flex items-center gap-2 px-2">
                                          <button onClick={() => setAddonQuantities({...addonQuantities, [addon.key]: Math.max(0, (addonQuantities as any)[addon.key] - 1)})} className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 shadow-sm"><Minus size={12}/></button>
                                          <span className="font-bold text-slate-800 dark:text-white w-4 text-center">{(addonQuantities as any)[addon.key]}</span>
                                          <button onClick={() => setAddonQuantities({...addonQuantities, [addon.key]: (addonQuantities as any)[addon.key] + 1})} className="w-6 h-6 flex items-center justify-center rounded bg-white dark:bg-slate-700 shadow-sm"><Plus size={12}/></button>
                                      </div>
                                      <button onClick={() => addToCart(addon, 'addon', (addonQuantities as any)[addon.key])} disabled={(addonQuantities as any)[addon.key] === 0} className="bg-slate-900 dark:bg-slate-600 text-white px-3 py-1 rounded text-xs font-bold disabled:opacity-50">Add</button>
                                  </div>
                              </div>
                          </div>
                      ))}

                      {/* Consumables */}
                      {consumptionPacks.map((pack) => (
                          <div key={pack.id} className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col hover:border-green-300 dark:hover:border-green-700 transition-colors">
                              <div className="flex justify-between items-start mb-4">
                                  <div className="p-3 bg-slate-50 dark:bg-slate-700 rounded-xl text-slate-600 dark:text-slate-300"><pack.icon size={24} /></div>
                                  <span className="text-xs font-bold bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300 px-2 py-1 rounded">Avulso</span>
                              </div>
                              <h4 className="font-bold text-slate-800 dark:text-white mb-1">{pack.name}</h4>
                              <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex-1">{pack.desc}</p>
                              <div className="mt-auto">
                                  <div className="text-lg font-bold text-slate-900 dark:text-white mb-3">R$ {pack.price}<span className="text-xs text-slate-400 font-normal">/único</span></div>
                                  <button onClick={() => addToCart(pack, 'addon', 1)} className="w-full bg-slate-900 dark:bg-slate-600 text-white py-2 rounded-lg text-sm font-bold hover:bg-slate-800 dark:hover:bg-slate-500 transition-colors flex items-center justify-center gap-2">
                                      <Plus size={14}/> Adicionar
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: INVOICES --- */}
      {activeTab === 'invoices' && (
          <div className="animate-in slide-in-from-bottom-4 space-y-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-700/30">
                      <div className="flex gap-2">
                          <button onClick={exportToCSV} className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors">
                              <Download size={14} /> Exportar CSV
                          </button>
                      </div>
                      <div className="relative">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                          <input type="text" placeholder="Filtrar..." className="pl-9 pr-4 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-md outline-none focus:ring-1 focus:ring-blue-500" />
                      </div>
                  </div>
                  <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm">
                          <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                              <tr>
                                  <th className="px-6 py-4">Data</th>
                                  <th className="px-6 py-4">Descrição</th>
                                  <th className="px-6 py-4">Valor</th>
                                  <th className="px-6 py-4">Status</th>
                                  <th className="px-6 py-4 text-right">Recibo</th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                              {loading ? (
                                  <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
                              ) : transactions.length === 0 ? (
                                  <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhuma transação encontrada.</td></tr>
                              ) : transactions.map((t) => (
                                  <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">{formatDate(t.date)}</td>
                                      <td className="px-6 py-4 font-medium text-slate-800 dark:text-white">{t.description}</td>
                                      <td className="px-6 py-4 font-bold text-slate-800 dark:text-white">R$ {t.amount.toFixed(2).replace('.', ',')}</td>
                                      <td className="px-6 py-4">
                                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${t.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'}`}>
                                              {t.status === 'completed' ? 'Pago' : t.status}
                                          </span>
                                      </td>
                                      <td className="px-6 py-4 text-right">
                                          <button onClick={() => generateReceipt(t)} className="text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-2 rounded transition-colors opacity-0 group-hover:opacity-100"><FileText size={16} /></button>
                                      </td>
                                  </tr>
                              ))}
                          </tbody>
                      </table>
                  </div>
              </div>
          </div>
      )}

      {/* --- CONTENT: WALLET --- */}
      {activeTab === 'wallet' && (
          <div className="animate-in slide-in-from-bottom-4">
              <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">Seus Cartões</h3>
                  <button onClick={() => setIsAddCardModalOpen(true)} className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                      <Plus size={16}/> Adicionar Cartão
                  </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {savedCards.map(card => (
                      <div key={card.id} className={`relative h-48 rounded-2xl p-6 flex flex-col justify-between shadow-lg transition-transform hover:-translate-y-1 ${card.brand === 'visa' ? 'bg-gradient-to-br from-blue-600 to-indigo-700' : 'bg-gradient-to-br from-slate-700 to-slate-900'}`}>
                          <div className="flex justify-between items-start">
                              <span className="text-white/80 font-mono text-xs">{card.isDefault ? 'PRINCIPAL' : 'SECUNDÁRIO'}</span>
                              <div className="flex gap-2">
                                  {!card.isDefault && (
                                      <button onClick={() => removeCard(card.id)} className="text-white/50 hover:text-white transition-colors p-1"><Trash2 size={16}/></button>
                                  )}
                              </div>
                          </div>
                          <div className="text-white space-y-4">
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-6 bg-yellow-200/80 rounded-md"></div>
                                  <span className="font-mono text-xl tracking-widest">•••• •••• •••• {card.last4}</span>
                              </div>
                              <div className="flex justify-between items-end">
                                  <div>
                                      <p className="text-[10px] text-white/60 uppercase mb-0.5">Titular</p>
                                      <p className="font-bold text-sm tracking-wide">{card.holder}</p>
                                  </div>
                                  <div className="text-right">
                                      <p className="text-[10px] text-white/60 uppercase mb-0.5">Validade</p>
                                      <p className="font-bold text-sm tracking-wide">{card.expiry}</p>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ))}
                  
                  {/* Add New Card Placeholder */}
                  <button onClick={() => setIsAddCardModalOpen(true)} className="h-48 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:text-blue-500 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-slate-800/50 transition-all gap-3 group">
                      <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 flex items-center justify-center transition-colors">
                          <Plus size={24} className="group-hover:text-blue-600"/>
                      </div>
                      <span className="font-bold text-sm">Adicionar Novo Método</span>
                  </button>
              </div>
          </div>
      )}

      {/* FLOATING CART BAR */}
      {cart.length > 0 && !isCheckoutOpen && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-lg z-40 animate-in slide-in-from-bottom-6">
              <div className="bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-full shadow-2xl p-2 pl-6 flex items-center justify-between mx-4 border border-slate-700 dark:border-slate-200">
                  <div className="flex items-center gap-3">
                      <div className="bg-blue-600 text-white font-bold w-8 h-8 rounded-full flex items-center justify-center text-xs">
                          {cart.reduce((acc, item) => acc + item.quantity, 0)}
                      </div>
                      <div className="flex flex-col">
                          <span className="text-xs font-medium opacity-80">Total Estimado</span>
                          <span className="font-bold">R$ {cart.reduce((acc, item) => acc + (item.price * item.quantity), 0).toFixed(2)}</span>
                      </div>
                  </div>
                  <button 
                    onClick={() => { setIsCheckoutOpen(true); setPaymentMethod('credit_card'); }}
                    className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-full font-bold text-sm transition-colors flex items-center gap-2"
                  >
                      Ver Carrinho <ArrowRight size={16}/>
                  </button>
              </div>
          </div>
      )}

      {/* Add Card Modal */}
      <Modal isOpen={isAddCardModalOpen} onClose={() => setIsAddCardModalOpen(false)} title="Adicionar Cartão">
          <div className="space-y-4">
              <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Número do Cartão</label>
                  <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="0000 0000 0000 0000" value={newCardData.number} onChange={e => setNewCardData({...newCardData, number: e.target.value})}/>
              </div>
              <div>
                  <label className="text-xs font-bold uppercase text-slate-500">Nome no Cartão</label>
                  <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="NOME COMO NO CARTAO" value={newCardData.holder} onChange={e => setNewCardData({...newCardData, holder: e.target.value})}/>
              </div>
              <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label className="text-xs font-bold uppercase text-slate-500">Validade</label>
                      <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="MM/AA" value={newCardData.expiry} onChange={e => setNewCardData({...newCardData, expiry: e.target.value})}/>
                  </div>
                  <div>
                      <label className="text-xs font-bold uppercase text-slate-500">CVC</label>
                      <input type="text" className="w-full p-3 border rounded-lg dark:bg-slate-700 dark:border-slate-600" placeholder="123" value={newCardData.cvc} onChange={e => setNewCardData({...newCardData, cvc: e.target.value})}/>
                  </div>
              </div>
              <button onClick={handleAddCard} disabled={isProcessing} className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold mt-4 flex items-center justify-center gap-2">
                  {isProcessing && <Loader2 className="animate-spin" size={16}/>} Salvar Cartão
              </button>
          </div>
      </Modal>

      {/* CHECKOUT MODAL (MULTI-ITEM) */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[99] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 w-full max-w-5xl rounded-2xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-h-[90vh] animate-in fade-in zoom-in-95 border border-slate-200 dark:border-slate-700">
                
                {/* Left: Cart Items */}
                <div className="w-full md:w-6/12 bg-slate-50 dark:bg-slate-900/50 p-8 border-b md:border-b-0 md:border-r border-slate-100 dark:border-slate-700 flex flex-col overflow-y-auto">
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <ShoppingBag className="text-blue-600"/> Seu Carrinho ({cart.length})
                    </h3>
                    
                    <div className="flex-1 space-y-4">
                        {cart.map((item) => (
                            <div key={item.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex gap-4 relative group">
                                <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 h-fit">
                                    {React.createElement(item.icon, { size: 24 })}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="font-bold text-slate-800 dark:text-white">{item.name}</h4>
                                            <p className="text-xs text-slate-500 dark:text-slate-400 capitalize">{item.type === 'plan' ? `Ciclo ${item.billingCycle}` : 'Item Adicional'}</p>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)} className="text-slate-300 hover:text-red-500 transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <div className="flex justify-between items-end mt-3">
                                        <div className="text-sm font-medium text-slate-600 dark:text-slate-300">
                                            {item.quantity} x R$ {item.price}
                                        </div>
                                        <div className="font-bold text-slate-900 dark:text-white">
                                            R$ {(item.price * item.quantity).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {cart.length === 0 && (
                            <div className="text-center py-10 text-slate-400">
                                Seu carrinho está vazio.
                            </div>
                        )}
                    </div>
                    
                    <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-400 flex items-center gap-2">
                        <ShieldCheck size={14}/> Pagamento seguro processado via Stripe
                    </div>
                </div>

                {/* Right: Payment & Summary */}
                <div className="flex-1 p-8 flex flex-col overflow-y-auto">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-lg font-bold text-slate-800 dark:text-white">Resumo do Pedido</h4>
                        <button onClick={() => setIsCheckoutOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 transition-colors"><XIcon size={20}/></button>
                    </div>

                    <div className="space-y-6 flex-1">
                        {/* Coupon */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-slate-500 uppercase">Cupom de Desconto</label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16}/>
                                    <input 
                                        type="text" 
                                        placeholder="Ex: FLOW10" 
                                        className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                        value={couponCode}
                                        onChange={e => setCouponCode(e.target.value)}
                                        disabled={!!appliedCoupon}
                                    />
                                </div>
                                {appliedCoupon ? (
                                    <button onClick={() => { setAppliedCoupon(null); setCouponCode(''); }} className="px-3 py-2 bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-xs font-bold hover:bg-red-200 transition-colors">Remover</button>
                                ) : (
                                    <button onClick={handleApplyCoupon} className="px-4 py-2 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold hover:bg-slate-200 transition-colors">Aplicar</button>
                                )}
                            </div>
                            {appliedCoupon && <p className="text-xs text-green-600 flex items-center gap-1"><CheckCircle size={10}/> Cupom {appliedCoupon.code} aplicado (-{(appliedCoupon.discount * 100).toFixed(0)}%)</p>}
                        </div>

                        {/* Payment Method Switch */}
                        <div className="bg-slate-50 dark:bg-slate-700/30 p-1 rounded-xl flex">
                            <button 
                                onClick={() => setPaymentMethod('credit_card')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${paymentMethod === 'credit_card' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                <CreditCard size={14}/> Cartão
                            </button>
                            <button 
                                onClick={() => setPaymentMethod('pix')}
                                className={`flex-1 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-2 transition-all ${paymentMethod === 'pix' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}
                            >
                                <QrCode size={14}/> PIX (-5%)
                            </button>
                        </div>

                        {/* Card Selection */}
                        {paymentMethod === 'credit_card' && (
                            <div className="space-y-3">
                                {savedCards.map(card => (
                                    <label key={card.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selectedCardId === card.id ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/10 ring-1 ring-blue-500' : 'border-slate-200 dark:border-slate-700 hover:border-blue-300'}`}>
                                        <input type="radio" name="card_selection" className="text-blue-600 focus:ring-blue-500" checked={selectedCardId === card.id} onChange={() => setSelectedCardId(card.id)} />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={16} className="text-slate-500"/>
                                                <span className="text-sm font-bold text-slate-700 dark:text-white">•••• {card.last4}</span>
                                            </div>
                                            <span className="text-xs text-slate-400 uppercase">{card.brand}</span>
                                        </div>
                                    </label>
                                ))}
                                <button onClick={() => setIsAddCardModalOpen(true)} className="text-xs text-blue-600 dark:text-blue-400 font-bold hover:underline flex items-center gap-1"><Plus size={12}/> Adicionar novo cartão</button>
                            </div>
                        )}

                        {/* PIX Info */}
                        {paymentMethod === 'pix' && (
                            <div className="p-4 bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-800/30 rounded-xl flex items-start gap-3">
                                <QrCode className="text-green-600 shrink-0 mt-0.5" size={18}/>
                                <div>
                                    <p className="text-sm font-bold text-green-800 dark:text-green-200">Desconto de 5% Aplicado!</p>
                                    <p className="text-xs text-green-700 dark:text-green-300 mt-1">O código QR será gerado na próxima tela após a confirmação.</p>
                                </div>
                            </div>
                        )}

                        {/* Totals */}
                        <div className="border-t border-slate-100 dark:border-slate-700 pt-4 space-y-2">
                            <div className="flex justify-between text-sm text-slate-500 dark:text-slate-400">
                                <span>Subtotal</span>
                                <span>R$ {calculateTotals.subtotal.toFixed(2)}</span>
                            </div>
                            {calculateTotals.couponDiscountVal > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Desconto Cupom</span>
                                    <span>- R$ {calculateTotals.couponDiscountVal.toFixed(2)}</span>
                                </div>
                            )}
                            {calculateTotals.pixDiscountVal > 0 && (
                                <div className="flex justify-between text-sm text-green-600">
                                    <span>Desconto PIX (5%)</span>
                                    <span>- R$ {calculateTotals.pixDiscountVal.toFixed(2)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end pt-2">
                                <span className="font-bold text-slate-800 dark:text-white">Total a Pagar</span>
                                <span className="text-3xl font-black text-slate-900 dark:text-white">R$ {calculateTotals.total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        onClick={confirmPurchase}
                        disabled={isProcessing || cart.length === 0}
                        className="w-full bg-slate-900 dark:bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-all flex items-center justify-center gap-2 mt-6 shadow-lg disabled:opacity-50"
                    >
                        {isProcessing ? <Loader2 className="animate-spin" size={20}/> : <span className="flex items-center gap-2">Pagar Agora <ChevronRight size={16}/></span>}
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Success Modal */}
      {showSuccess && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full flex items-center justify-center mx-auto mb-4"><CheckCircle size={32} /></div>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Pagamento Aprovado!</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">Seus novos recursos já foram liberados e estão prontos para uso.</p>
                  <button onClick={closeSuccess} className="w-full bg-green-600 text-white py-3 rounded-xl font-bold hover:bg-green-700 transition-colors">Concluir</button>
              </div>
          </div>
      )}

    </div>
  );
};

export default Financial;
