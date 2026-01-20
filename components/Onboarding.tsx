
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, Smartphone, Users, Database, ArrowRight, 
  ShieldCheck, Play, Send, Server, Power
} from 'lucide-react';
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
          actionLabel: 'Conectar Instância' 
      },
      { 
          id: 2, 
          title: 'Configurar Equipe', 
          desc: 'Cadastre os atendentes e distribua os Seats contratados.', 
          icon: Users, 
          completed: progress.hasTeam, 
          action: 'team', 
          actionLabel: 'Gerenciar Equipe' 
      },
      { 
          id: 3, 
          title: 'Importar Base', 
          desc: 'Traga seus contatos para a plataforma segura.', 
          icon: Database, 
          completed: progress.hasContacts, 
          action: 'contacts', 
          actionLabel: 'Importar CSV' 
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

  const StepCard = ({ 
    stepNumber, 
    title, 
    description, 
    icon: Icon, 
    isCompleted, 
    actionLabel, 
    onAction 
  }: any) => (
    <div className={`relative p-6 rounded-2xl border transition-all duration-300 flex flex-col md:flex-row gap-6 items-start md:items-center group ${isCompleted ? 'bg-green-50/50 dark:bg-green-900/10 border-green-200 dark:border-green-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md'}`}>
      
      {stepNumber < totalSteps && (
        <div className="absolute left-[2.25rem] top-[4.5rem] bottom-[-2.5rem] w-0.5 bg-slate-200 dark:bg-slate-700 hidden md:block z-0" />
      )}

      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl font-bold transition-colors ${
        isCompleted 
        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
      }`}>
        {isCompleted ? <CheckCircle size={24} /> : stepNumber}
      </div>

      <div className="flex-1">
        <h3 className={`text-lg font-bold mb-1 flex items-center gap-2 ${isCompleted ? 'text-green-800 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
          {title}
          {isCompleted && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full uppercase tracking-wide">{t('completed')}</span>}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed max-w-2xl">
          {description}
        </p>
        
        <button 
          onClick={onAction}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
            isCompleted
            ? 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-600'
            : 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20'
          }`}
        >
          {isCompleted ? 'Revisar' : actionLabel}
          {!isCompleted && <ArrowRight size={16} />}
        </button>
      </div>

      <div className={`p-4 rounded-xl hidden md:block ${isCompleted ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500'}`}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
    </div>
  );

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Enterprise Header */}
      {isManager && licenseStatus && (
          <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
              
              <div className="flex items-center gap-3 mb-6 relative z-10">
                  <div className="p-3 bg-white/10 rounded-xl backdrop-blur-md">
                      <Server size={32} className="text-blue-400" />
                  </div>
                  <div>
                      <h2 className="text-2xl font-bold">Bem-vindo à sua Instância Enterprise</h2>
                      <p className="text-slate-400">Licença Ativa: {licenseStatus.license.tier}</p>
                  </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 relative z-10">
                  <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Seats Contratados</p>
                      <p className="text-2xl font-bold text-white">{licenseStatus.totalSeats}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Conexões WhatsApp</p>
                      <p className="text-2xl font-bold text-white">{licenseStatus.totalSeats}</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4 backdrop-blur-sm border border-white/10">
                      <p className="text-xs text-slate-400 uppercase font-bold mb-1">Status</p>
                      <div className="flex items-center gap-2 text-green-400 font-bold">
                          <Power size={16} /> Ativo
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Progress Bar */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Progresso da Configuração</span>
          <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{completionPercentage}%</span>
        </div>
        <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-blue-600 h-full rounded-full transition-all duration-1000 ease-out" 
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </div>

      {/* Steps Container */}
      <div className="space-y-6 relative">
        {steps.map((step) => (
            <StepCard 
              key={step.id}
              stepNumber={step.id}
              title={step.title}
              description={step.desc}
              icon={step.icon}
              isCompleted={step.completed}
              actionLabel={step.actionLabel}
              onAction={() => onNavigate(step.action as any)}
            />
        ))}
      </div>

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6 flex gap-4 items-start mt-8">
        <ShieldCheck className="text-blue-600 dark:text-blue-400 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-1">Ambiente Dedicado</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            Sua infraestrutura é isolada e monitorada 24/7. Em caso de dúvidas técnicas, acesse o canal de suporte prioritário no menu de Configurações.
          </p>
        </div>
      </div>

    </div>
  );
};

export default Onboarding;
