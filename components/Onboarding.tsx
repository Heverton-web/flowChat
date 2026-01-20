
import React, { useEffect, useState } from 'react';
import { 
  CheckCircle, Circle, Smartphone, Users, Database, ArrowRight, 
  ShieldCheck, AlertTriangle, Play, Send 
} from 'lucide-react';
import { ViewState, User } from '../types';
import * as evolutionService from '../services/evolutionService';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import * as campaignService from '../services/campaignService';
import { useApp } from '../contexts/AppContext';

interface OnboardingProps {
  onNavigate: (view: ViewState) => void;
  currentUser: User;
}

const Onboarding: React.FC<OnboardingProps> = ({ onNavigate, currentUser }) => {
  const { t } = useApp();
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState({
    hasInstance: false,
    hasTeam: false,
    hasContacts: false,
    hasCampaigns: false,
    hasExecutedCampaigns: false
  });

  useEffect(() => {
    checkProgress();
  }, [currentUser]);

  const checkProgress = async () => {
    setLoading(true);
    try {
      const promises = [
        evolutionService.fetchInstances(currentUser.id, currentUser.role),
        contactService.getContacts(currentUser.id, currentUser.role)
      ];

      // Only fetch team if manager
      if (currentUser.role === 'manager') {
          promises.push(teamService.getAgents() as any);
      } else {
          promises.push(Promise.resolve([])); // Dummy for agent
      }

      // Fetch campaigns for everyone (needed for agent step 3 & 4)
      promises.push(campaignService.getCampaigns(currentUser.id, currentUser.role) as any);

      const [instances, contacts, agents, campaigns] = await Promise.all(promises);

      const castedCampaigns = campaigns as any[];

      setProgress({
        hasInstance: instances.length > 0 && instances.some(i => i.status === 'connected'),
        hasTeam: (agents as any[]).length >= 2, // At least manager + 1 agent
        hasContacts: contacts.length > 0,
        hasCampaigns: castedCampaigns.length > 0,
        hasExecutedCampaigns: castedCampaigns.some(c => c.status === 'completed' || c.status === 'processing')
      });
    } catch (e) {
      console.error("Error checking progress", e);
    } finally {
      setLoading(false);
    }
  };

  // Define steps based on Role
  const isManager = currentUser.role === 'manager';
  
  const steps = isManager ? [
      { id: 1, titleKey: 'step_1_title', descKey: 'step_1_desc', icon: Smartphone, completed: progress.hasInstance, action: 'instances', actionLabel: 'action_go_instances' },
      { id: 2, titleKey: 'step_2_title', descKey: 'step_2_desc', icon: Users, completed: progress.hasTeam, action: 'subscription', actionLabel: 'action_go_team' },
      { id: 3, titleKey: 'step_3_title', descKey: 'step_3_desc', icon: Database, completed: progress.hasContacts, action: 'contacts', actionLabel: 'action_go_contacts' }
  ] : [
      { id: 1, titleKey: 'step_1_title', descKey: 'agent_step_1_desc', icon: Smartphone, completed: progress.hasInstance, action: 'instances', actionLabel: 'action_go_instances' },
      { id: 2, titleKey: 'agent_step_2_title', descKey: 'agent_step_2_desc', icon: Database, completed: progress.hasContacts, action: 'contacts', actionLabel: 'action_go_contacts' },
      { id: 3, titleKey: 'agent_step_3_title', descKey: 'agent_step_3_desc', icon: Send, completed: progress.hasCampaigns, action: 'campaigns', actionLabel: 'action_go_campaigns' },
      { id: 4, titleKey: 'agent_step_4_title', descKey: 'agent_step_4_desc', icon: Play, completed: progress.hasExecutedCampaigns, action: 'campaigns', actionLabel: 'action_go_campaigns' }
  ];

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
      
      {/* Connector Line */}
      {stepNumber < totalSteps && (
        <div className="absolute left-[2.25rem] top-[4.5rem] bottom-[-2.5rem] w-0.5 bg-slate-200 dark:bg-slate-700 hidden md:block z-0" />
      )}

      {/* Icon/Status */}
      <div className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0 text-xl font-bold transition-colors ${
        isCompleted 
        ? 'bg-green-500 text-white shadow-lg shadow-green-500/30' 
        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
      }`}>
        {isCompleted ? <CheckCircle size={24} /> : stepNumber}
      </div>

      {/* Content */}
      <div className="flex-1">
        <h3 className={`text-lg font-bold mb-1 flex items-center gap-2 ${isCompleted ? 'text-green-800 dark:text-green-400' : 'text-slate-800 dark:text-white'}`}>
          {title}
          {isCompleted && <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-full uppercase tracking-wide">{t('completed')}</span>}
        </h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm mb-4 leading-relaxed max-w-2xl">
          {description}
        </p>
        
        {/* Action Button */}
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

      {/* Illustration Icon */}
      <div className={`p-4 rounded-xl hidden md:block ${isCompleted ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-50 dark:bg-slate-700/50 text-slate-400 dark:text-slate-500'}`}>
        <Icon size={32} strokeWidth={1.5} />
      </div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center justify-center p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-2xl mb-4 shadow-sm">
          <Play size={32} fill="currentColor" />
        </div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-3">{t('onboarding_title')}</h2>
        <p className="text-slate-500 dark:text-slate-400 text-lg max-w-xl mx-auto">
          {t('onboarding_subtitle')}
        </p>
      </div>

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
              title={t(step.titleKey as any)}
              description={t(step.descKey as any)}
              icon={step.icon}
              isCompleted={step.completed}
              actionLabel={t(step.actionLabel as any)}
              onAction={() => onNavigate(step.action as any)}
            />
        ))}

      </div>

      {/* Security Note - Only relevant for steps involving contacts */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-6 flex gap-4 items-start mt-8">
        <ShieldCheck className="text-blue-600 dark:text-blue-400 shrink-0" size={24} />
        <div>
          <h4 className="font-bold text-blue-800 dark:text-blue-200 mb-1">Dica de Segurança</h4>
          <p className="text-sm text-blue-700 dark:text-blue-300 leading-relaxed">
            Ao importar contatos ou editar manualmente, {isManager ? 'você pode utilizar as Travas de Segurança para impedir que atendentes excluam dados.' : 'lembre-se que o gestor pode ter definido travas de segurança para proteger contatos importantes.'}
          </p>
        </div>
      </div>

    </div>
  );
};

export default Onboarding;
