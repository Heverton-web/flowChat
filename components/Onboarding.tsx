
import React, { useEffect, useState } from 'react';
import { CheckCircle, Smartphone, Users, Database, ArrowRight, ShieldCheck, Play, Send, Server, Power, Circle } from 'lucide-react';
import { ViewState, User, LicenseStatus } from '../types';
import * as evolutionService from '../services/evolutionService';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';

interface OnboardingProps {
  onNavigate: (view: ViewState) => void;
  currentUser: User;
}

const Onboarding: React.FC<OnboardingProps> = ({ onNavigate, currentUser }) => {
  const { t } = useApp();
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [progress, setProgress] = useState({
    hasInstance: false,
    hasTeam: false,
    hasContacts: false
  });

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instances, contacts, agents, licData] = await Promise.all([
        evolutionService.fetchInstances(currentUser.id, currentUser.role),
        contactService.getContacts(currentUser.id, currentUser.role),
        currentUser.role === 'manager' ? teamService.getAgents() : Promise.resolve([]),
        financialService.getLicenseStatus()
      ]);

      setLicenseStatus(licData);
      setProgress({
        hasInstance: instances.length > 0 && instances.some(i => i.status === 'connected'),
        hasTeam: (agents as any[]).length >= 2, 
        hasContacts: contacts.length > 0
      });
    } catch (e) {
      console.error("Error checking progress", e);
    } finally {
      setLoading(false);
    }
  };

  const isManager = currentUser.role === 'manager';
  
  const managerSteps = [
      { 
          id: 1, 
          title: 'Conectar WhatsApp', 
          desc: 'Sua licença permite múltiplas conexões. Conecte o primeiro número agora.', 
          icon: Smartphone, 
          completed: progress.hasInstance, 
          action: 'instances', 
          actionLabel: 'Conectar Agora' 
      },
      { 
          id: 2, 
          title: 'Configurar Equipe', 
          desc: 'Cadastre os atendentes e distribua os Seats contratados.', 
          icon: Users, 
          completed: progress.hasTeam, 
          action: 'team', 
          actionLabel: 'Adicionar Usuários' 
      },
      { 
          id: 3, 
          title: 'Importar Base', 
          desc: 'Traga seus contatos para a plataforma segura.', 
          icon: Database, 
          completed: progress.hasContacts, 
          action: 'contacts', 
          actionLabel: 'Importar Contatos' 
      }
  ];

  const agentSteps = [
      { id: 1, title: 'Sua Instância', desc: 'Conecte seu WhatsApp corporativo para começar.', icon: Smartphone, completed: progress.hasInstance, action: 'instances', actionLabel: 'Conectar' },
      { id: 2, title: 'Meus Contatos', desc: 'Importe sua carteira de clientes.', icon: Database, completed: progress.hasContacts, action: 'contacts', actionLabel: 'Importar' },
      { id: 3, title: 'Primeiro Disparo', desc: 'Crie uma campanha de teste.', icon: Send, completed: false, action: 'campaigns', actionLabel: 'Criar Campanha' }
  ];

  const steps = isManager ? managerSteps : agentSteps;
  const totalSteps = steps.length;
  const completedStepsCount = steps.filter(s => s.completed).length;
  const completionPercentage = Math.round((completedStepsCount / totalSteps) * 100);

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-24">
      
      {/* Header Section */}
      <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">{t('onboarding_title')}</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">{t('onboarding_subtitle')}</p>
          
          {/* Progress Bar Card */}
          <div className="bg-slate-900 dark:bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
              
              <div className="relative z-10">
                  <div className="flex justify-between items-end mb-3">
                      <span className="text-sm font-bold text-slate-200">Progresso da Configuração</span>
                      <span className="text-sm font-bold text-blue-400">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-700/50 rounded-full h-3 overflow-hidden backdrop-blur-sm border border-slate-600">
                      <div className="bg-blue-500 h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${completionPercentage}%` }}></div>
                  </div>
              </div>
          </div>
      </div>

      {/* Timeline Steps */}
      <div className="relative space-y-6 pl-4">
        {/* Timeline Vertical Line */}
        <div className="absolute left-[2.4rem] top-8 bottom-12 w-0.5 bg-slate-200 dark:bg-slate-700 z-0"></div>

        {steps.map((step, index) => {
            const StepIcon = step.icon;
            return (
                <div key={step.id} className="relative z-10 group">
                    <div className={`
                        flex flex-col md:flex-row items-start md:items-center gap-6 p-6 rounded-2xl border transition-all duration-300
                        ${step.completed 
                            ? 'bg-slate-900/5 dark:bg-slate-800 border-green-500/30 dark:border-green-500/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-500/50 dark:hover:border-blue-500/50 shadow-sm'
                        }
                    `}>
                        {/* Status Icon (Left Timeline Node) */}
                        <div className="absolute left-[-1.1rem] md:static md:left-auto">
                            <div className={`
                                w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-500
                                ${step.completed 
                                    ? 'bg-green-500 border-white dark:border-slate-900 text-white shadow-lg shadow-green-500/30' 
                                    : 'bg-slate-100 dark:bg-slate-700 border-white dark:border-slate-900 text-slate-400 dark:text-slate-500'
                                }
                            `}>
                                {step.completed ? <CheckCircle size={20} fill="currentColor" className="text-white" /> : <span className="font-bold">{step.id}</span>}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="flex-1 ml-8 md:ml-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className={`text-lg font-bold ${step.completed ? 'text-green-700 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
                                    {step.title}
                                </h3>
                                {step.completed && (
                                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800">
                                        Concluído
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xl">
                                {step.desc}
                            </p>
                        </div>

                        {/* Right Action Area */}
                        <div className="flex items-center gap-4 w-full md:w-auto mt-4 md:mt-0 pl-8 md:pl-0">
                            {/* Decorative Icon */}
                            <div className={`p-3 rounded-xl hidden lg:block transition-colors ${step.completed ? 'bg-green-50 dark:bg-green-900/10 text-green-600 dark:text-green-500' : 'bg-slate-100 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500'}`}>
                                <StepIcon size={24} strokeWidth={1.5} />
                            </div>

                            {/* Button */}
                            <button 
                                onClick={() => onNavigate(step.action as any)}
                                className={`
                                    w-full md:w-auto px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2
                                    ${step.completed 
                                        ? 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 border border-slate-200 dark:border-slate-600' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 hover:-translate-y-0.5'
                                    }
                                `}
                            >
                                {step.completed ? 'Revisar' : step.actionLabel}
                                {!step.completed && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </div>
                </div>
            );
        })}
      </div>

      {/* Security Footer */}
      <div className="mt-12 bg-indigo-900/20 border border-indigo-500/20 rounded-xl p-6 flex flex-col md:flex-row gap-6 items-center justify-between backdrop-blur-sm">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/20 rounded-full text-indigo-400">
                <ShieldCheck size={28} />
            </div>
            <div>
                <h4 className="font-bold text-indigo-900 dark:text-indigo-100 mb-1">Ambiente Dedicado Enterprise</h4>
                <p className="text-sm text-indigo-800 dark:text-indigo-300">
                    Sua infraestrutura é isolada e monitorada 24/7 para garantir máxima performance.
                </p>
            </div>
        </div>
        {licenseStatus && (
            <div className="flex gap-8 text-indigo-900 dark:text-indigo-200 text-sm font-mono border-l border-indigo-500/20 pl-8">
                <div>
                    <span className="block text-xs opacity-60 uppercase">Licença</span>
                    <span className="font-bold">{licenseStatus.license.tier}</span>
                </div>
                <div>
                    <span className="block text-xs opacity-60 uppercase">Seats</span>
                    <span className="font-bold">{licenseStatus.totalSeats}</span>
                </div>
            </div>
        )}
      </div>

    </div>
  );
};

export default Onboarding;
