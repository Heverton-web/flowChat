
import React, { useState, useEffect } from 'react';
import { 
    CreditCard, CheckCircle, Zap, Package, AlertTriangle, Loader2, Calendar, 
    BookUser, Crown, Info, Clock, AlertOctagon, Users, Smartphone, ShieldCheck, 
    MessageSquare, Headphones, Server, HardDrive
} from 'lucide-react';
import { License } from '../types';
import * as financialService from '../services/financialService';

const Subscription: React.FC = () => {
  const [license, setLicense] = useState<License | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    setLoading(true);
    try {
        const data = await financialService.getLicenseStatus();
        setLicense(data);
    } catch (error) {
        console.error("Failed to load license", error);
    } finally {
        setLoading(false);
    }
  };

  const handleContactSales = () => {
      // Mock WhatsApp Link for Account Manager
      window.open('https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20falar%20sobre%20expansão%20da%20minha%20licença%20Enterprise.', '_blank');
  };

  if (loading || !license) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const renewalDateObj = new Date(license.renewalDate);
  const daysRemaining = Math.ceil((renewalDateObj.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Visual Helpers
  const calculateProgress = (current: number, max: number) => {
      return Math.min(100, (current / max) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                <Server className="text-blue-600" /> Recursos do Sistema
            </h2>
            <p className="text-slate-500 dark:text-slate-400 mt-1">
                Monitoramento da infraestrutura dedicada e limites da licença.
            </p>
        </div>
        <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase border ${license.status === 'active' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>
                Status: {license.status === 'active' ? 'Operacional' : 'Suspenso'}
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
                      <h3 className="text-3xl font-bold tracking-tight">Licença {license.type.toUpperCase()}</h3>
                  </div>
                  <p className="text-slate-300 max-w-lg text-sm leading-relaxed">
                      Sua organização possui acesso total aos módulos Enterprise com suporte prioritário e infraestrutura dedicada.
                  </p>
                  <div className="mt-4 flex items-center gap-4 text-xs font-mono text-slate-400">
                      <span className="bg-slate-800 px-2 py-1 rounded border border-slate-700">Renovação: {renewalDateObj.toLocaleDateString()}</span>
                      <span>•</span>
                      <span>Ciclo Atual: {daysRemaining} dias restantes</span>
                  </div>
              </div>
              <div className="flex flex-col items-end gap-3">
                  <button onClick={handleContactSales} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/50 flex items-center gap-2">
                      <Headphones size={18} /> Falar com Gerente de Conta
                  </button>
                  <p className="text-xs text-slate-400">Deseja expandir sua operação?</p>
              </div>
          </div>
      </div>

      {/* Resource Usage Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Seats Usage */}
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
              <div className="flex justify-between items-start mb-6">
                  <div className="flex items-center gap-3">
                      <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-xl">
                          <Users size={24} />
                      </div>
                      <div>
                          <h4 className="font-bold text-slate-800 dark:text-white">Ocupação de Seats</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Usuários ativos na plataforma</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">{license.activeUsers}</span>
                      <span className="text-sm text-slate-400"> / {license.maxUsers}</span>
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Utilização</span>
                      <span>{calculateProgress(license.activeUsers, license.maxUsers).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                            calculateProgress(license.activeUsers, license.maxUsers) > 90 ? 'bg-amber-500' : 'bg-indigo-600'
                        }`}
                        style={{width: `${calculateProgress(license.activeUsers, license.maxUsers)}%`}}
                      >
                      </div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                      Você está utilizando {license.activeUsers} de {license.maxUsers} licenças contratadas.
                  </p>
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
                          <h4 className="font-bold text-slate-800 dark:text-white">Conexões API</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400">Instâncias de WhatsApp ativas</p>
                      </div>
                  </div>
                  <div className="text-right">
                      <span className="text-2xl font-bold text-slate-800 dark:text-white">{license.activeInstances}</span>
                      <span className="text-sm text-slate-400"> / {license.maxInstances}</span>
                  </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                  <div className="flex justify-between text-xs font-bold text-slate-500 uppercase">
                      <span>Capacidade</span>
                      <span>{calculateProgress(license.activeInstances, license.maxInstances).toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ${
                            calculateProgress(license.activeInstances, license.maxInstances) > 90 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{width: `${calculateProgress(license.activeInstances, license.maxInstances)}%`}}
                      ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                      Cada atendente possui uma instância dedicada. Limite vinculado ao contrato.
                  </p>
              </div>
          </div>
      </div>

      {/* Modules & Specs */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
              <HardDrive size={20} className="text-slate-500" />
              Especificações Técnicas
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 mb-2">
                      <ShieldCheck className="text-green-500" size={20} />
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">SLA Garantido</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">99.9% Uptime em contrato</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 mb-2">
                      <Zap className="text-amber-500" size={20} />
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">API Rate Limit</h4>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Ilimitado (Tier Enterprise)</p>
              </div>

              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
                  <div className="flex items-center gap-3 mb-2">
                      <Server className="text-blue-500" size={20} />
                      <h4 className="font-bold text-slate-700 dark:text-slate-200 text-sm">Armazenamento</h4>
                      <span className="ml-auto text-xs bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded font-mono">5TB</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mídia e Logs (Retenção 5 anos)</p>
              </div>

          </div>
      </div>

      <div className="flex justify-center pt-8 pb-4">
          <p className="text-xs text-slate-400 flex items-center gap-1">
              <Info size={12} /> ID da Licença: <span className="font-mono bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded select-all">LIC-{license.type.toUpperCase()}-0029384</span>
          </p>
      </div>

    </div>
  );
};

export default Subscription;
