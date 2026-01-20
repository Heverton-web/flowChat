
import React, { useState, useEffect } from 'react';
import { Crown, Check, Users, Smartphone, Server, Plus, CreditCard, Loader2, Zap, Shield, Globe, MessageSquare } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { LicenseStatus } from '../types';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

const Subscription: React.FC = () => {
  const { showToast } = useApp();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    setLoading(true);
    try {
        const data = await financialService.getLicenseStatus();
        setLicenseStatus(data);
    } catch (error) {
        console.error("Failed to load license", error);
    } finally {
        setLoading(false);
    }
  };

  const confirmAddSeat = async () => {
      setIsUpgrading(true);
      await financialService.requestAddonSeat(1);
      await loadLicense();
      setIsUpgrading(false);
      setConfirmModalOpen(false);
      showToast('Solicitação enviada com sucesso!', 'success');
  };

  if (loading || !licenseStatus) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const { license, usage, totalSeats } = licenseStatus;
  const renewalDateObj = new Date(license.renewalDate);

  // Data for Radial Charts
  const seatsData = [
      { name: 'Used', value: usage.usedSeats, color: '#3b82f6' }, // Blue
      { name: 'Free', value: totalSeats - usage.usedSeats, color: '#e2e8f0' }
  ];
  
  const instanceData = [
      { name: 'Used', value: usage.usedInstances, color: '#10b981' }, // Emerald
      { name: 'Free', value: totalSeats - usage.usedInstances, color: '#e2e8f0' }
  ];

  const features = [
      { name: 'Acesso à Evolution API v2', included: true },
      { name: 'Múltiplas Instâncias (WhatsApp)', included: true },
      { name: 'Envios Ilimitados', included: true },
      { name: 'White Label (Marca Própria)', included: license.features.whiteLabel },
      { name: 'Suporte Prioritário 24/7', included: license.features.prioritySupport },
      { name: 'Gestor de Conta Dedicado', included: license.tier === 'ENTERPRISE' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Crown className="text-amber-500" size={24} fill="currentColor" />
                Assinatura & Plano
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Gerencie sua licença, limites e método de pagamento.</p>
        </div>
        <div className="flex gap-2">
            <button className="text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium px-4 py-2">
                Ver faturas anteriores
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Plan Details Card */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              {/* Background Decor */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-[80px] pointer-events-none"></div>
              
              <div className="relative z-10 flex justify-between items-start">
                  <div>
                      <span className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-3 inline-block">
                          {license.status}
                      </span>
                      <h3 className="text-3xl font-bold mb-1">Plano {license.tier}</h3>
                      <p className="text-slate-400 text-sm">Renovação automática em {renewalDateObj.toLocaleDateString()}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                      <p className="text-sm text-slate-400">Valor Mensal</p>
                      <p className="text-3xl font-bold text-white">R$ 4.500<span className="text-lg text-slate-400 font-normal">,00</span></p>
                  </div>
              </div>

              <div className="relative z-10 mt-8">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {features.map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                              <div className={`p-1 rounded-full ${feature.included ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                                  <Check size={14} />
                              </div>
                              <span className={`text-sm ${feature.included ? 'text-slate-200' : 'text-slate-500 line-through'}`}>
                                  {feature.name}
                              </span>
                          </div>
                      ))}
                  </div>
              </div>
          </div>

          {/* Payment Method Card */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 flex flex-col shadow-sm">
              <h4 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <CreditCard size={18} className="text-blue-600"/> Método de Pagamento
              </h4>
              
              <div className="flex-1 flex flex-col items-center justify-center mb-6">
                  {/* Credit Card Visual */}
                  <div className="w-full aspect-[1.586/1] rounded-xl bg-gradient-to-tr from-slate-700 to-slate-900 p-6 flex flex-col justify-between text-white shadow-lg relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
                      <div className="flex justify-between items-start">
                          <div className="w-10 h-6 rounded bg-white/20 backdrop-blur-sm"></div> {/* Chip */}
                          <span className="font-mono font-bold text-lg italic opacity-80">VISA</span>
                      </div>
                      <div className="font-mono text-lg tracking-widest mt-4">
                          •••• •••• •••• 4242
                      </div>
                      <div className="flex justify-between items-end text-xs opacity-70">
                          <div>
                              <p className="uppercase text-[8px]">Titular</p>
                              <p className="font-bold tracking-wide">GESTOR ADMIN</p>
                          </div>
                          <div>
                              <p className="uppercase text-[8px]">Validade</p>
                              <p className="font-bold">12/28</p>
                          </div>
                      </div>
                  </div>
              </div>

              <button className="w-full py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                  Alterar Cartão
              </button>
          </div>
      </div>

      <h3 className="text-lg font-bold text-slate-800 dark:text-white pt-4">Consumo de Recursos</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Seats Usage */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Users size={18} className="text-blue-500"/> Seats (Usuários)
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Acesso ao painel administrativo</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs font-bold px-2 py-1 rounded">
                      {usage.usedSeats} / {totalSeats}
                  </div>
              </div>
              
              <div className="flex items-center justify-center py-6 relative">
                  <div className="w-32 h-32 relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={seatsData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={55}
                                  dataKey="value"
                                  stroke="none"
                                  startAngle={90}
                                  endAngle={-270}
                              >
                                  {seatsData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-slate-800 dark:text-white">{Math.round((usage.usedSeats / totalSeats) * 100)}%</span>
                      </div>
                  </div>
              </div>

              <button 
                onClick={() => setConfirmModalOpen(true)}
                className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all mt-auto"
              >
                  <Plus size={18}/> Adicionar Seat
              </button>
              <p className="text-center text-xs text-slate-400 mt-2">+ R$ 150,00 / mês por usuário</p>
          </div>

          {/* Instances Usage */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <Smartphone size={18} className="text-emerald-500"/> Instâncias
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Conexões WhatsApp ativas</p>
                  </div>
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-2 py-1 rounded">
                      {usage.usedInstances} / {totalSeats}
                  </div>
              </div>
              
              <div className="flex items-center justify-center py-6 relative">
                  <div className="w-32 h-32 relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={instanceData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={55}
                                  dataKey="value"
                                  stroke="none"
                                  startAngle={90}
                                  endAngle={-270}
                              >
                                  {instanceData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-xl font-bold text-slate-800 dark:text-white">{Math.round((usage.usedInstances / totalSeats) * 100)}%</span>
                      </div>
                  </div>
              </div>

              <div className="mt-auto bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 text-center">
                  Cada Seat adicionado libera automaticamente +1 Instância de WhatsApp.
              </div>
          </div>

          {/* Messages Volume */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col">
              <div className="flex justify-between items-start mb-2">
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                          <MessageSquare size={18} className="text-indigo-500"/> Volume de Envios
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ciclo mensal atual</p>
                  </div>
                  <div className="bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold px-2 py-1 rounded">
                      Ilimitado
                  </div>
              </div>
              
              <div className="flex-1 flex flex-col justify-center items-center py-6 text-center">
                  <div className="mb-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-indigo-600 dark:text-indigo-400">
                      <Zap size={32} fill="currentColor" />
                  </div>
                  <h5 className="text-2xl font-bold text-slate-800 dark:text-white">{usage.usedMessagesThisMonth.toLocaleString()}</h5>
                  <p className="text-sm text-slate-500">mensagens enviadas</p>
              </div>

              <div className="mt-auto flex items-center gap-2 text-xs text-green-600 dark:text-green-400 justify-center bg-green-50 dark:bg-green-900/10 p-2 rounded-lg">
                  <Shield size={12} />
                  <span>Sua cota é ilimitada no plano Enterprise</span>
              </div>
          </div>

      </div>

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Expandir Licença Enterprise"
        type="info"
        footer={
            <>
                <button onClick={() => setConfirmModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-medium rounded-lg">Cancelar</button>
                <button onClick={confirmAddSeat} disabled={isUpgrading} className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg flex items-center gap-2 hover:bg-blue-700">
                    {isUpgrading && <Loader2 className="animate-spin" size={16}/>} Confirmar Contratação
                </button>
            </>
        }
      >
          <div className="text-slate-600 dark:text-slate-300 space-y-4">
              <p>Você está prestes a adicionar <strong>+1 Seat</strong> à sua licença.</p>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800">
                  <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2"><Check size={14} className="text-blue-600"/> +1 Acesso para Usuário/Atendente</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-blue-600"/> +1 Conexão de WhatsApp (Instância)</li>
                      <li className="flex items-center gap-2"><Check size={14} className="text-blue-600"/> Suporte e Manutenção inclusos</li>
                  </ul>
              </div>
              <p className="text-sm font-medium">Valor adicional: <span className="text-slate-900 dark:text-white font-bold">R$ 150,00 / mês</span></p>
              <p className="text-xs text-slate-500">O valor será cobrado proporcionalmente na próxima fatura.</p>
          </div>
      </Modal>
    </div>
  );
};

export default Subscription;
