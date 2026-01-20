
import React, { useState, useEffect } from 'react';
import { 
    CreditCard, CheckCircle, Zap, Package, AlertTriangle, Loader2, Calendar, 
    BookUser, Crown, Info, Clock, AlertOctagon, Users, Smartphone, ShieldCheck, 
    MessageSquare, Headphones, Server, HardDrive, Plus, ArrowRight
} from 'lucide-react';
import { LicenseStatus } from '../types';
import * as financialService from '../services/financialService';

const Subscription: React.FC = () => {
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);

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

  const handleContactSales = () => {
      window.open('https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20falar%20sobre%20expansão%20da%20minha%20licença%20Enterprise.', '_blank');
  };

  const handleAddSeat = async () => {
      if (confirm("Deseja contratar +1 Seat (Usuário + Instância) automaticamente? Isso será adicionado à sua próxima fatura.")) {
          setIsUpgrading(true);
          await financialService.requestAddonSeat(1);
          await loadLicense();
          setIsUpgrading(false);
          alert("Seat adicionado com sucesso!");
      }
  };

  if (loading || !licenseStatus) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const { license, usage, totalLimits } = licenseStatus;
  const renewalDateObj = new Date(license.renewalDate);
  const daysRemaining = Math.ceil((renewalDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  const calculateProgress = (current: number, max: number) => {
      if (max === 0) return 100;
      return Math.min(100, (current / max) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <Server className="text-blue-600" /> Gestão da Licença Corporativa
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Monitoramento da infraestrutura dedicada e limites contratados.
            </p>
        </div>
        <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${license.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                Status: {license.status === 'ACTIVE' ? 'Operacional' : 'Suspenso'}
            </span>
        </div>
      </div>

      {/* Main License Card */}
      <div className="bg-slate-900 rounded-2xl p-8 shadow-xl relative overflow-hidden text-white">
          {/* Background Pattern */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20 pointer-events-none transform translate-x-20 -translate-y-20"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                  <div className="flex items-center gap-3 mb-2">
                      <div className="bg-white/10 p-2 rounded-lg"><Crown size={24} className="text-amber-400" fill="currentColor"/></div>
                      <h3 className="text-3xl font-bold tracking-tight">Licença {license.tier}</h3>
                  </div>
                  <p className="text-slate-300 max-w-lg text-sm leading-relaxed">
                      Infraestrutura dedicada com paridade 1:1 (Seats).
                      <br/>
                      Renovação automática agendada para: <strong>{renewalDateObj.toLocaleDateString()}</strong>.
                  </p>
              </div>
              <div className="flex flex-col items-end gap-3">
                  <div className="text-right">
                      <span className="block text-xs uppercase font-bold text-white/60">Fatura Mensal</span>
                      <span className="text-2xl font-bold">R$ 2.500,00</span>
                  </div>
                  <button onClick={handleContactSales} className="bg-white/10 hover:bg-white/20 text-white border border-white/20 px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2">
                      <CreditCard size={14} /> Histórico de Faturas
                  </button>
              </div>
          </div>
      </div>

      {/* Resource Usage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Seats Usage (Users) */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <Users size={24} />
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">Atendentes (Seats)</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Usuários ativos na plataforma</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">{usage.usedUsers}</span>
                      <span className="text-sm text-slate-400"> / {totalLimits.maxUsers}</span>
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Utilização</span>
                      <span>{calculateProgress(usage.usedUsers, totalLimits.maxUsers).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                            calculateProgress(usage.usedUsers, totalLimits.maxUsers) > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{width: `${calculateProgress(usage.usedUsers, totalLimits.maxUsers)}%`}}
                      ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2 flex justify-between">
                      <span>Base: {license.baseLimits.maxUsers}</span>
                      <span>Add-ons: +{license.addonSeats}</span>
                  </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                  <button 
                    onClick={handleAddSeat}
                    disabled={isUpgrading}
                    className="flex-1 py-2.5 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-sm font-bold rounded-lg border border-blue-200 dark:border-blue-800 transition-colors flex items-center justify-center gap-2"
                  >
                      {isUpgrading ? <Loader2 className="animate-spin" size={16}/> : <Plus size={16} />}
                      Contratar +1 Seat
                  </button>
              </div>
          </div>

          {/* Instances Usage */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-xl">
                          <Smartphone size={24} />
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">Instâncias WhatsApp</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Conexões API ativas</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">{usage.usedInstances}</span>
                      <span className="text-sm text-slate-400"> / {totalLimits.maxInstances}</span>
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Ocupação da Infra</span>
                      <span>{calculateProgress(usage.usedInstances, totalLimits.maxInstances).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                            calculateProgress(usage.usedInstances, totalLimits.maxInstances) > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{width: `${calculateProgress(usage.usedInstances, totalLimits.maxInstances)}%`}}
                      ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                      Paridade 1:1. Cada Seat inclui uma instância dedicada.
                  </p>
              </div>

              <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-700 flex gap-3">
                  <div className="flex-1 py-2.5 bg-slate-50 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-sm font-bold rounded-lg border border-slate-200 dark:border-slate-600 flex items-center justify-center gap-2 cursor-help" title="Aumente o número de Seats para ganhar mais instâncias">
                      <Info size={16} />
                      Vinculado aos Seats
                  </div>
              </div>
          </div>
      </div>

      {/* Add-ons and Extras */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <Package size={20} className="text-blue-600" />
              Add-ons de Volume
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Extra Message Packs */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col justify-between">
                  <div className="mb-4">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Saldo de Mensagens</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Consumo Mensal: {usage.usedMessagesThisMonth.toLocaleString()}
                      </p>
                  </div>
                  <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">+{license.addonMessagePacks} Pcts</span>
                      <button onClick={handleContactSales} className="text-xs font-bold text-blue-600 hover:underline">Solicitar Mais</button>
                  </div>
              </div>

              {/* Extra Contact Packs */}
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex flex-col justify-between">
                  <div className="mb-4">
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Capacidade de Contatos</h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Cadastrados: {usage.usedContacts.toLocaleString()}
                      </p>
                  </div>
                  <div className="flex items-end justify-between">
                      <span className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">+{license.addonContactPacks} Pcts</span>
                      <button onClick={handleContactSales} className="text-xs font-bold text-indigo-600 hover:underline">Solicitar Mais</button>
                  </div>
              </div>

              {/* Support/Upgrade Call to Action */}
              <div className="p-4 rounded-xl border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-900/20 flex flex-col justify-center items-center text-center">
                  <h4 className="font-bold text-blue-800 dark:text-blue-200 text-sm mb-2">Upgrade Enterprise?</h4>
                  <p className="text-xs text-blue-600 dark:text-blue-300 mb-4">
                      Precisa de mais de 30 seats ou volume ilimitado?
                  </p>
                  <button 
                    onClick={handleContactSales}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2"
                  >
                      <MessageSquare size={14} /> Falar com Consultor
                  </button>
              </div>

          </div>
      </div>

      <div className="flex justify-center pt-8">
          <p className="text-xs text-slate-400 flex items-center gap-1">
              <Info size={12} /> ID da Licença: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-1 rounded">LIC-{license.tier}-0029384</span>
          </p>
      </div>

    </div>
  );
};

export default Subscription;
