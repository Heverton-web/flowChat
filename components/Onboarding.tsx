
import React, { useEffect, useState } from 'react';
import { 
    CheckCircle, Smartphone, Users, Database, ArrowRight, ShieldCheck, 
    Play, Send, Server, Power, Circle, HelpCircle, BookOpen, Video,
    ExternalLink, Sparkles, Check, MessageCircle
} from 'lucide-react';
import { ViewState, User, LicenseStatus } from '../types';
import * as evolutionService from '../services/evolutionService';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface OnboardingProps {
  onNavigate: (view: ViewState) => void;
  currentUser: User;
}

// Mock Video Data
const TUTORIALS = {
    connection: "https://www.youtube.com/embed/dQw4w9WgXcQ", // Placeholder
    team: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    import: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    campaign: "https://www.youtube.com/embed/dQw4w9WgXcQ"
};

const Onboarding: React.FC<OnboardingProps> = ({ onNavigate, currentUser }) => {
  const { t, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  
  // Progress State
  const [progress, setProgress] = useState({
    hasInstance: false,
    isConnected: false,
    hasTeam: false,
    hasContacts: false
  });

  // Video Modal State
  const [videoModalOpen, setVideoModalOpen] = useState(false);
  const [currentVideo, setCurrentVideo] = useState<{title: string, url: string} | null>(null);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [instances, contacts, agents, licData] = await Promise.all([
        evolutionService.fetchInstances(currentUser.id, currentUser.role),
        contactService.getContacts(currentUser.id, currentUser.role),
        currentUser.role === 'manager' || currentUser.role === 'super_admin' ? teamService.getAgents() : Promise.resolve([]),
        financialService.getLicenseStatus()
      ]);

      setLicenseStatus(licData);
      
      const myInstances = instances.filter(i => i.ownerId === currentUser.id);
      
      setProgress({
        hasInstance: myInstances.length > 0,
        isConnected: myInstances.some(i => i.status === 'connected'),
        hasTeam: (agents as any[]).length >= 2, // At least one other person
        hasContacts: contacts.length > 0
      });
    } catch (e) {
      console.error("Error checking progress", e);
    } finally {
      setLoading(false);
    }
  };

  const openVideo = (title: string, url: string) => {
      setCurrentVideo({ title, url });
      setVideoModalOpen(true);
  };

  const isManager = currentUser.role === 'manager' || currentUser.role === 'super_admin';
  
  // Define Steps based on Role
  const managerSteps = [
      { 
          id: 1, 
          title: 'Conectar Infraestrutura', 
          desc: 'O primeiro passo é conectar seu WhatsApp à API. Isso permitirá o envio e recebimento de mensagens.', 
          icon: Smartphone, 
          completed: progress.isConnected, 
          action: 'instances', 
          actionLabel: 'Conectar WhatsApp',
          videoUrl: TUTORIALS.connection
      },
      { 
          id: 2, 
          title: 'Configurar Equipe', 
          desc: 'Adicione seus atendentes, defina cargos (Gestor/Agente) e distribua as permissões de acesso.', 
          icon: Users, 
          completed: progress.hasTeam, 
          action: 'team', 
          actionLabel: 'Gerenciar Equipe',
          videoUrl: TUTORIALS.team
      },
      { 
          id: 3, 
          title: 'Importar Base de Contatos', 
          desc: 'Importe sua planilha de clientes (CSV) ou cadastre manualmente para iniciar os atendimentos.', 
          icon: Database, 
          completed: progress.hasContacts, 
          action: 'contacts', 
          actionLabel: 'Importar CSV',
          videoUrl: TUTORIALS.import
      }
  ];

  const agentSteps = [
      { 
          id: 1, 
          title: 'Sua Conexão', 
          desc: 'Verifique se sua instância de WhatsApp está conectada e pronta para uso.', 
          icon: Smartphone, 
          completed: progress.isConnected, 
          action: 'instances', 
          actionLabel: 'Verificar Conexão',
          videoUrl: TUTORIALS.connection
      },
      { 
          id: 2, 
          title: 'Sua Carteira', 
          desc: 'Traga seus contatos para o sistema para centralizar seu atendimento.', 
          icon: Database, 
          completed: progress.hasContacts, 
          action: 'contacts', 
          actionLabel: 'Meus Contatos',
          videoUrl: TUTORIALS.import
      },
      { 
          id: 3, 
          title: 'Primeiro Disparo', 
          desc: 'Crie uma campanha simples para testar a entrega das mensagens.', 
          icon: Send, 
          completed: false, // Hard to track individually without complex query, keeping manual
          action: 'campaigns', 
          actionLabel: 'Criar Campanha',
          videoUrl: TUTORIALS.campaign
      }
  ];

  const steps = isManager ? managerSteps : agentSteps;
  const totalSteps = steps.length;
  const completedStepsCount = steps.filter(s => s.completed).length;
  const completionPercentage = Math.round((completedStepsCount / totalSteps) * 100);
  const allCompleted = completionPercentage === 100;

  if (loading) return <div className="flex justify-center items-center h-full"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 pb-24">
      
      {/* Header Section with Gamification */}
      <div className="flex flex-col md:flex-row gap-8 items-stretch">
          {/* Welcome Text */}
          <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                  <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-blue-200 dark:border-blue-800">
                      Passo a Passo
                  </span>
                  {allCompleted && (
                      <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border border-green-200 dark:border-green-800 flex items-center gap-1">
                          <Check size={12} /> Configuração Completa
                      </span>
                  )}
              </div>
              <h2 className="text-3xl font-bold text-slate-800 dark:text-white">
                  Bem-vindo, {currentUser.name.split(' ')[0]}! 🚀
              </h2>
              <p className="text-slate-500 dark:text-slate-400 text-lg leading-relaxed">
                  Vamos configurar seu ambiente de alta performance. Siga os passos abaixo para ativar sua operação.
              </p>
          </div>

          {/* Progress Card */}
          <div className="w-full md:w-80 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-lg relative overflow-hidden flex flex-col justify-center">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
              
              <div className="relative z-10">
                  <div className="flex justify-between items-end mb-2">
                      <span className="text-sm font-bold text-slate-500 dark:text-slate-400">Progresso</span>
                      <span className={`text-2xl font-black ${allCompleted ? 'text-green-500' : 'text-blue-600 dark:text-blue-400'}`}>
                          {completionPercentage}%
                      </span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-1000 ease-out shadow-sm ${allCompleted ? 'bg-green-500' : 'bg-blue-600'}`} 
                        style={{ width: `${completionPercentage}%` }}
                      ></div>
                  </div>
                  <p className="text-xs text-slate-400 mt-3 text-center">
                      {allCompleted 
                        ? 'Tudo pronto! Você já pode operar.' 
                        : `${completedStepsCount} de ${totalSteps} passos concluídos`}
                  </p>
              </div>
          </div>
      </div>

      {/* Steps Timeline */}
      <div className="relative pl-4 md:pl-0">
        {/* Connector Line (Desktop Only logic visual, basically absolute positioned) */}
        <div className="absolute left-[2.4rem] top-8 bottom-12 w-0.5 bg-slate-200 dark:bg-slate-700 z-0 md:hidden"></div>

        <div className="space-y-6">
            {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isCurrent = !step.completed && (index === 0 || steps[index - 1].completed);
                
                return (
                    <div 
                        key={step.id} 
                        className={`
                            relative z-10 flex flex-col md:flex-row items-start gap-6 p-6 rounded-2xl border transition-all duration-300
                            ${step.completed 
                                ? 'bg-slate-50/50 dark:bg-slate-900/30 border-green-200/50 dark:border-green-900/30 opacity-70 hover:opacity-100' 
                                : isCurrent 
                                    ? 'bg-white dark:bg-slate-800 border-blue-500/30 dark:border-blue-500/50 shadow-lg ring-1 ring-blue-500/20 scale-[1.01]'
                                    : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 opacity-90'
                            }
                        `}
                    >
                        {/* Status Icon */}
                        <div className={`
                            w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 shrink-0
                            ${step.completed 
                                ? 'bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-600 dark:text-green-400' 
                                : isCurrent
                                    ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                                    : 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600 text-slate-400'
                            }
                        `}>
                            {step.completed ? <CheckCircle size={24} /> : <span className="font-bold text-lg">{step.id}</span>}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1">
                                <h3 className={`text-xl font-bold ${step.completed ? 'text-slate-500 dark:text-slate-400 line-through' : 'text-slate-800 dark:text-white'}`}>
                                    {step.title}
                                </h3>
                                {isCurrent && (
                                    <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                                        Passo Atual
                                    </span>
                                )}
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-2xl leading-relaxed">
                                {step.desc}
                            </p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto mt-2 md:mt-0">
                            <button 
                                onClick={() => openVideo(step.title, step.videoUrl)}
                                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                            >
                                <Video size={18} /> <span className="hidden sm:inline">Assistir Tutorial</span>
                            </button>

                            <button 
                                onClick={() => onNavigate(step.action as any)}
                                className={`
                                    px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-sm
                                    ${step.completed 
                                        ? 'bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600' 
                                        : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20 hover:-translate-y-0.5'
                                    }
                                `}
                            >
                                {step.completed ? 'Revisar' : step.actionLabel}
                                {!step.completed && <ArrowRight size={16} />}
                            </button>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>

      {/* Help & Support Footer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden group cursor-pointer hover:shadow-xl transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform"></div>
              <div className="relative z-10">
                  <BookOpen className="mb-4" size={32} />
                  <h4 className="font-bold text-lg mb-1">Documentação</h4>
                  <p className="text-white/80 text-sm mb-4">Guia completo de funcionalidades.</p>
                  <span className="text-xs font-bold bg-white/20 px-3 py-1 rounded-full flex items-center gap-2 w-fit">Acessar Docs <ExternalLink size={10}/></span>
              </div>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm hover:border-green-400 dark:hover:border-green-600 transition-colors group cursor-pointer">
              <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                      <MessageCircle size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-slate-800 dark:text-white">Suporte WhatsApp</h4>
                      <p className="text-xs text-slate-500">Atendimento Humanizado</p>
                  </div>
              </div>
              <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Dúvidas técnicas ou problemas? Fale com nosso time de sucesso do cliente.
              </p>
          </div>

          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 shadow-sm flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-2">
                  <ShieldCheck className="text-blue-500" size={24}/>
                  <h4 className="font-bold text-slate-800 dark:text-white">Enterprise Security</h4>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Seus dados estão protegidos em ambiente isolado com criptografia ponta a ponta.
              </p>
              {licenseStatus && (
                  <div className="flex gap-2">
                      <span className="text-[10px] font-mono bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-slate-600 dark:text-slate-300">
                          PLAN: {licenseStatus.license.tier}
                      </span>
                  </div>
              )}
          </div>
      </div>

      {/* Video Modal */}
      <Modal 
        isOpen={videoModalOpen} 
        onClose={() => setVideoModalOpen(false)} 
        title={currentVideo?.title || 'Tutorial'}
        size="2xl"
      >
          <div className="aspect-video w-full bg-black rounded-xl overflow-hidden relative">
              <iframe 
                width="100%" 
                height="100%" 
                src={currentVideo?.url} 
                title="Tutorial Video"
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="absolute inset-0"
              ></iframe>
          </div>
          <div className="mt-4 flex justify-end">
              <button onClick={() => setVideoModalOpen(false)} className="bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white px-4 py-2 rounded-lg font-bold">Fechar</button>
          </div>
      </Modal>

    </div>
  );
};

export default Onboarding;
