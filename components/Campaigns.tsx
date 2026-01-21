
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, Plus, Calendar, FileText, Upload, CheckCircle, BarChart2, Loader2, X, Target, Clock, User, Download,
  MessageSquare, Mic, Image as ImageIcon, Video, Trash2, ArrowDown, ArrowUp, List, Search, GripVertical, Settings, Hourglass, Filter, ShieldCheck, ShieldAlert, Lock, Zap, Shield, Crown, Link as LinkIcon, ListChecks, File, ArrowLeft, Eye, Copy, MoreVertical, Play, Pause, AlertTriangle, Activity, Rocket, DollarSign, RefreshCw, Smartphone, Users, Bold, Italic, Strikethrough, Code, Music, Paperclip, ExternalLink
} from 'lucide-react';
import { Campaign, CampaignObjective, WorkflowStep, WorkflowStepType, Contact, User as UserType } from '../types';
import * as campaignService from '../services/campaignService';
import * as contactService from '../services/contactService';
import { useApp } from '../contexts/AppContext';

// --- Subcomponent: Media Preview ---
const StepMediaPreview = ({ step }: { step: WorkflowStep }) => {
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        if (step.mediaUrl) {
            setPreviewUrl(step.mediaUrl);
            return;
        }
        if (step.file) {
            const url = URL.createObjectURL(step.file);
            setPreviewUrl(url);
            return () => URL.revokeObjectURL(url);
        }
        setPreviewUrl(null);
    }, [step.file, step.mediaUrl]);

    if (!['image', 'video', 'audio', 'document'].includes(step.type)) return null;

    if (!previewUrl) return (
        <div className="flex items-center justify-center h-16 w-full bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-dashed border-slate-300 dark:border-slate-600 text-slate-400 text-xs gap-2">
            <span className="w-2 h-2 bg-slate-400 rounded-full"></span> Mídia pendente
        </div>
    );

    const getIcon = () => {
        switch (step.type) {
            case 'image': return <ImageIcon size={20} className="text-pink-500" />;
            case 'video': return <Video size={20} className="text-orange-500" />;
            case 'audio': return <Mic size={20} className="text-purple-500" />;
            default: return <FileText size={20} className="text-indigo-500 dark:text-indigo-400" />;
        }
    };

    const getTitle = () => {
        if (step.file?.name) return step.file.name;
        if (step.mediaUrl) {
            const parts = step.mediaUrl.split('/');
            return parts[parts.length - 1] || 'Arquivo via URL';
        }
        switch (step.type) {
            case 'image': return 'Imagem sem título';
            case 'video': return 'Vídeo sem título';
            case 'audio': return 'Áudio sem título';
            default: return 'Documento sem título';
        }
    };

    const getSize = () => {
        if (step.file) return `${(step.file.size / 1024 / 1024).toFixed(2)} MB`;
        return 'Link Externo';
    };

    const renderModalContent = () => {
        if (!previewUrl) return null;
        const mediaClass = "w-auto h-auto min-w-[200px] min-h-[200px] max-w-[600px] max-h-[600px] object-contain rounded-lg shadow-sm";

        switch (step.type) {
            case 'image':
                return <img src={previewUrl} alt="Preview" className={mediaClass} />;
            case 'video':
                return <video src={previewUrl} controls className={mediaClass} />;
            case 'audio':
                return (
                    <div className="w-full min-w-[300px] max-w-[600px] bg-slate-100 dark:bg-slate-700 p-6 rounded-xl flex flex-col items-center gap-4">
                        <div className="p-4 bg-purple-100 dark:bg-purple-900/30 rounded-full text-purple-600">
                            <Mic size={32} />
                        </div>
                        <audio src={previewUrl} controls className="w-full" />
                    </div>
                );
            case 'document':
                return (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-100 dark:bg-slate-700 rounded-lg min-w-[300px] max-w-[600px]">
                        <FileText size={48} className="text-slate-400 mb-4" />
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-center break-all">{getTitle()}</p>
                        {step.mediaUrl && (
                            <a href={step.mediaUrl} target="_blank" rel="noreferrer" className="mt-4 text-blue-600 hover:underline text-sm">
                                Abrir em nova aba
                            </a>
                        )}
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            <div className="flex items-center gap-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 group hover:border-slate-300 dark:hover:border-slate-600 transition-colors w-full">
                <div className="p-2 bg-white dark:bg-slate-600 rounded shadow-sm shrink-0 border border-slate-100 dark:border-slate-500">
                    {getIcon()}
                </div>
                <div className="min-w-0 flex-1">
                    <p className="font-bold truncate text-slate-800 dark:text-white text-xs">{getTitle()}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-medium">{getSize()}</p>
                </div>
                <button 
                    onClick={(e) => { e.stopPropagation(); setShowModal(true); }} 
                    className="p-2 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-full transition-colors text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300"
                    title="Visualizar"
                >
                    <Eye size={16} />
                </button>
            </div>

            {showModal && createPortal(
                <div className="fixed inset-0 z-[9999] bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" onClick={() => setShowModal(false)}>
                    <div className="relative bg-white dark:bg-slate-800 p-2 rounded-2xl shadow-2xl max-w-4xl max-h-[90vh] flex flex-col w-auto" onClick={e => e.stopPropagation()}>
                        <div className="absolute -top-12 right-0 flex gap-2">
                            <button onClick={() => setShowModal(false)} className="bg-white/10 hover:bg-white/20 text-white p-2 rounded-full backdrop-blur-md transition-colors">
                                <X size={24}/>
                            </button>
                        </div>
                        <div className="overflow-auto rounded-xl bg-black/5 dark:bg-black/20 flex items-center justify-center p-4 min-w-[300px]">
                            {renderModalContent()}
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </>
    );
};

interface CampaignsProps {
    currentUser?: UserType;
}

const Campaigns: React.FC<CampaignsProps> = ({ currentUser = { id: 'guest', role: 'agent' } as UserType }) => {
  const { t, showToast } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // View State
  const [activeTab, setActiveTab] = useState<'all' | 'processing' | 'scheduled' | 'completed'>('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    objective: 'prospecting' as CampaignObjective,
    contactsCount: 0,
    minDelay: 30, // Default Low Risk
    maxDelay: 120 // Default Low Risk
  });

  // Contact Selection State
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Workflow State
  const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<WorkflowStepType | null>(null);
  
  // Step Configuration States
  const [stepContent, setStepContent] = useState('');
  const [stepFile, setStepFile] = useState<File | null>(null);
  const [stepMediaUrl, setStepMediaUrl] = useState('');
  const [stepDelay, setStepDelay] = useState<number>(1200);
  const [mediaMode, setMediaMode] = useState<'upload' | 'url'>('upload');
  const [pollOptions, setPollOptions] = useState<string[]>(['', '']);
  const [pollSelectableCount, setPollSelectableCount] = useState(1);

  useEffect(() => {
    loadCampaigns();
  }, [currentUser]);

  // Load contacts whenever creation starts to ensure fresh data
  useEffect(() => {
    if (isCreating) {
        loadContacts();
    }
  }, [isCreating]);

  useEffect(() => {
      setFormData(prev => ({ ...prev, contactsCount: selectedContactIds.size }));
  }, [selectedContactIds]);

  const loadCampaigns = async () => {
    setLoading(true);
    const data = await campaignService.getCampaigns(currentUser.id, currentUser.role);
    setCampaigns(data);
    setLoading(false);
  };

  const loadContacts = async () => {
      setLoadingContacts(true);
      try {
          const contacts = await contactService.getContacts(currentUser.id, currentUser.role);
          setAvailableContacts(contacts);
      } catch (e) {
          console.error(e);
      } finally {
          setLoadingContacts(false);
      }
  };

  const handleDuplicate = (campaign: Campaign) => {
      setFormData({
          name: `${campaign.name} (Cópia)`,
          date: new Date().toISOString().split('T')[0],
          objective: campaign.objective,
          contactsCount: 0,
          minDelay: campaign.minDelay,
          maxDelay: campaign.maxDelay
      });
      setWorkflowSteps([...campaign.workflow]);
      setIsCreating(true);
      showToast('Configurações da campanha duplicadas. Selecione o público.', 'success');
  };

  const handleDeleteCampaign = (id: string) => {
      // In real app, call API
      const newCampaigns = campaigns.filter(c => c.id !== id);
      setCampaigns(newCampaigns);
      showToast('Campanha excluída.', 'success');
  };

  const toggleContactSelection = (id: string) => {
      const newSet = new Set(selectedContactIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedContactIds(newSet);
  };

  const toggleSelectAll = (filteredList: Contact[]) => {
      const allSelected = filteredList.length > 0 && filteredList.every(c => selectedContactIds.has(c.id));
      const newSet = new Set(selectedContactIds);
      
      if (allSelected) {
          filteredList.forEach(c => newSet.delete(c.id));
      } else {
          filteredList.forEach(c => newSet.add(c.id));
      }
      setSelectedContactIds(newSet);
  };

  const handleCreate = async () => {
    const finalContactCount = selectedContactIds.size;

    if (!formData.name || !formData.date || finalContactCount === 0 || workflowSteps.length === 0) return;

    await campaignService.createCampaign({
        name: formData.name,
        scheduledDate: formData.date,
        objective: formData.objective,
        agentName: currentUser.name,
        ownerId: currentUser.id,
        totalContacts: finalContactCount,
        targetList: Array.from(selectedContactIds), // CRITICAL: Sending the actual list of IDs
        workflow: workflowSteps,
        minDelay: formData.minDelay,
        maxDelay: formData.maxDelay
    });

    setIsCreating(false);
    resetForm();
    loadCampaigns();
    showToast('Campanha criada com sucesso!', 'success');
  };

  const resetForm = () => {
    setFormData({ name: '', date: '', objective: 'prospecting', contactsCount: 0, minDelay: 30, maxDelay: 120 });
    setWorkflowSteps([]);
    resetStepForm();
    setSelectedContactIds(new Set());
    setContactSearchTerm('');
    setFilterTag('all');
  };

  const resetStepForm = () => {
    setSelectedStepType(null);
    setStepContent('');
    setStepFile(null);
    setStepMediaUrl('');
    setStepDelay(1200);
    setMediaMode('upload');
    setPollOptions(['', '']);
    setPollSelectableCount(1);
  };

  const handleDownloadReport = (campaign: Campaign) => {
      campaignService.downloadCampaignReport(campaign);
      showToast('Relatório baixado.', 'success');
  };

  const handleAddStepClick = (type: WorkflowStepType) => {
      setSelectedStepType(type);
      setStepContent('');
      setStepFile(null);
      setStepDelay(1200); 
      if (type === 'video') setStepDelay(3000);
      if (type === 'image') setStepDelay(2000);
      if (type === 'audio') setStepDelay(3000);
  };

  const handleConfirmStep = () => {
      if (!selectedStepType) return;
      if (selectedStepType === 'text' && !stepContent.trim()) return;
      
      const newStep: WorkflowStep = {
          id: Math.random().toString(36).substr(2, 9),
          type: selectedStepType,
          content: stepContent, 
          file: stepFile || undefined,
          mediaUrl: stepMediaUrl || undefined,
          delay: stepDelay,
          order: workflowSteps.length + 1,
          pollConfig: selectedStepType === 'poll' ? { selectableCount: pollSelectableCount, values: pollOptions } : undefined
      };

      setWorkflowSteps([...workflowSteps, newStep]);
      setIsStepModalOpen(false);
      resetStepForm();
  };

  const removeStep = (id: string) => {
      const filtered = workflowSteps.filter(s => s.id !== id);
      const reordered = filtered.map((s, index) => ({ ...s, order: index + 1 }));
      setWorkflowSteps(reordered);
  };

  const moveStep = (index: number, direction: 'up' | 'down') => {
      if (direction === 'up' && index === 0) return;
      if (direction === 'down' && index === workflowSteps.length - 1) return;
      const newSteps = [...workflowSteps];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      [newSteps[index], newSteps[targetIndex]] = [newSteps[targetIndex], newSteps[index]];
      const reordered = newSteps.map((step, idx) => ({ ...step, order: idx + 1 }));
      setWorkflowSteps(reordered);
  };

  const getObjectiveLabel = (obj: CampaignObjective) => {
      switch(obj) {
          case 'prospecting': return t('prospecting');
          case 'communication': return t('communication');
          case 'promotion': return t('promotion');
          case 'sales': return t('sales');
          case 'maintenance': return t('maintenance');
          default: return obj;
      }
  };

  const getSafetyInfo = (min: number) => {
      if (min < 15) return { icon: Zap, color: 'text-red-600 dark:text-red-400', label: 'Alto Risco' };
      if (min < 30) return { icon: Shield, color: 'text-amber-600 dark:text-amber-400', label: 'Moderado' };
      return { icon: ShieldCheck, color: 'text-green-600 dark:text-green-400', label: 'Seguro' };
  };

  const allTags = Array.from(new Set(availableContacts.flatMap(c => c.tags || []))).sort();
  const filteredContacts = availableContacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || c.phone.includes(contactSearchTerm);
      const matchesTag = filterTag === 'all' || (c.tags && c.tags.includes(filterTag));
      return matchesSearch && matchesTag;
  });
  const insertVariable = (variable: string) => setStepContent(prev => prev + variable);

  // --- DERIVED STATS ---
  const activeCampaignsCount = campaigns.filter(c => c.status === 'processing' || c.status === 'scheduled').length;
  const completedCampaignsCount = campaigns.filter(c => c.status === 'completed').length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.status === 'completed' ? c.totalContacts : 0), 0);
  
  const filteredCampaigns = campaigns.filter(c => {
      if (activeTab === 'all') return true;
      return c.status === activeTab;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <style>{`
        @keyframes dash-move { to { stroke-dashoffset: -20; } }
        .animate-dash-line line { stroke-dasharray: 6; animation: dash-move 1s linear infinite; }
      `}</style>

      {/* Top Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
              <Send className="text-blue-600" size={24}/>
              {t('campaigns_title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{t('campaigns_subtitle')}</p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); resetForm(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-shadow shadow-md shadow-blue-600/20 font-bold"
        >
          <Plus size={18} />
          {t('new_campaign')}
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                  <Activity size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Campanhas Ativas</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{activeCampaignsCount}</h3>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <CheckCircle size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Envios Concluídos</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{totalSent.toLocaleString()}</h3>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <BarChart2 size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Taxa Média Entrega</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">98.2%</h3>
              </div>
          </div>
      </div>

      {/* Tabs & List */}
      <div className="space-y-4">
          <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700 pb-2 overflow-x-auto">
              {[
                  { id: 'all', label: 'Todas' },
                  { id: 'processing', label: 'Em Andamento' },
                  { id: 'scheduled', label: 'Agendadas' },
                  { id: 'completed', label: 'Concluídas' }
              ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-4 py-2 text-sm font-bold rounded-lg transition-all whitespace-nowrap ${
                        activeTab === tab.id 
                        ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' 
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                      {tab.label}
                  </button>
              ))}
          </div>

          {loading ? (
              <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
          ) : filteredCampaigns.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <Target className="mx-auto text-slate-300 mb-4" size={48} />
                  <h3 className="text-lg font-medium text-slate-600 dark:text-slate-300">Nenhuma campanha encontrada</h3>
                  <p className="text-slate-400 text-sm">Crie uma nova campanha para começar.</p>
              </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredCampaigns.map(campaign => {
                    const safetyInfo = getSafetyInfo(campaign.minDelay);
                    const SafetyIcon = safetyInfo.icon;
                    return (
                    <div 
                        key={campaign.id} 
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col"
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                            <div>
                                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider mb-2 ${
                                    campaign.status === 'completed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    campaign.status === 'processing' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                                }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${
                                        campaign.status === 'processing' ? 'bg-blue-500 animate-pulse' : 
                                        campaign.status === 'completed' ? 'bg-green-500' : 'bg-slate-400'
                                    }`}></span>
                                    {campaign.status === 'completed' ? 'Concluída' : campaign.status === 'processing' ? 'Enviando...' : 'Agendada'}
                                </span>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{campaign.name}</h3>
                            </div>
                            
                            <div className="relative group/menu">
                                <button className="p-1.5 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                    <MoreVertical size={18} />
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-32 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 overflow-hidden hidden group-hover/menu:block z-20">
                                    <button onClick={() => handleDuplicate(campaign)} className="w-full text-left px-3 py-2 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                        <Copy size={12}/> Duplicar
                                    </button>
                                    {campaign.status === 'processing' && (
                                        <button className="w-full text-left px-3 py-2 text-xs font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2">
                                            <Pause size={12}/> Pausar
                                        </button>
                                    )}
                                    <button onClick={() => handleDeleteCampaign(campaign.id)} className="w-full text-left px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 border-t border-slate-100 dark:border-slate-700">
                                        <Trash2 size={12}/> Excluir
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-5 space-y-4 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Agendado para</p>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        <Calendar size={14} className="text-blue-500" />
                                        {new Date(campaign.scheduledDate).toLocaleDateString()}
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-slate-400 mb-1">Objetivo</p>
                                    <div className="flex items-center gap-1.5 text-sm font-medium text-slate-700 dark:text-slate-200">
                                        <Target size={14} className="text-indigo-500" />
                                        {getObjectiveLabel(campaign.objective)}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/30 rounded-lg border border-slate-100 dark:border-slate-700">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Público</span>
                                    <span className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-1">
                                        <User size={14}/> {campaign.totalContacts}
                                    </span>
                                </div>
                                <div className="h-8 w-px bg-slate-200 dark:bg-slate-600"></div>
                                <div className="flex flex-col items-end">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase">Segurança</span>
                                    <span className={`text-sm font-bold flex items-center gap-1 ${safetyInfo.color}`}>
                                        {safetyInfo.label} <SafetyIcon size={14} />
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Footer / Progress */}
                        <div className="px-5 pb-5 pt-0 mt-auto">
                            {campaign.status === 'completed' ? (
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-slate-500">Taxa de Entrega</span>
                                        <span className={`text-sm font-bold ${(campaign.deliveryRate || 0) > 90 ? 'text-green-600' : 'text-amber-500'}`}>{campaign.deliveryRate}%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mb-4">
                                        <div className="bg-green-500 h-1.5 rounded-full" style={{width: `${campaign.deliveryRate}%`}}></div>
                                    </div>
                                    <button 
                                        onClick={() => handleDownloadReport(campaign)}
                                        className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                                    >
                                        <Download size={14}/> Relatório Detalhado
                                    </button>
                                </div>
                            ) : campaign.status === 'processing' ? (
                                <div>
                                    <div className="flex justify-between items-end mb-2">
                                        <span className="text-xs font-bold text-blue-600 animate-pulse">Enviando mensagens...</span>
                                        <span className="text-xs font-bold text-slate-500">~45%</span>
                                    </div>
                                    <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-blue-500 h-1.5 rounded-full w-[45%] animate-[dash-move_1s_linear_infinite]" style={{backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem'}}></div>
                                    </div>
                                </div>
                            ) : (
                                <button className="w-full py-2 bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 text-sm font-medium rounded-lg cursor-not-allowed flex items-center justify-center gap-2">
                                    <Clock size={14}/> Aguardando Horário
                                </button>
                            )}
                        </div>
                    </div>
                    );
                })}
            </div>
          )}
      </div>

      {/* Campaign Creation Modal */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-[95vw] max-h-[90vh] h-[90vh] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                
                {/* Left Panel: Settings */}
                <div className="w-full lg:w-[400px] xl:w-[450px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full shrink-0 z-20 shadow-xl">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Settings size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('settings')}</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Defina o público e os parâmetros de envio.</p>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-8 custom-scrollbar">
                        {/* 1. Basic Info */}
                        <section className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <FileText size={14}/> Dados do Lançamento
                            </label>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Nome Interno</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="Ex: Oferta Black Friday"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-500 mb-1">Agendar Início</label>
                                    <input 
                                        type="datetime-local" 
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* 2. Objective - Visual Grid */}
                        <section className="space-y-4">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <Target size={14}/> Objetivo da Campanha
                            </label>
                            <div className="grid grid-cols-2 gap-2">
                                {[
                                    { id: 'prospecting', label: 'Prospecção', icon: Target },
                                    { id: 'sales', label: 'Vendas', icon: DollarSign },
                                    { id: 'communication', label: 'Avisos', icon: MessageSquare },
                                    { id: 'promotion', label: 'Promoção', icon: Zap }, 
                                    { id: 'maintenance', label: 'Retenção', icon: RefreshCw },
                                ].map((obj) => (
                                    <button
                                        key={obj.id}
                                        onClick={() => setFormData({...formData, objective: obj.id as any})}
                                        className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                                            formData.objective === obj.id 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 shadow-sm ring-1 ring-blue-200 dark:ring-blue-800' 
                                            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:border-blue-300 dark:hover:border-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                    >
                                        <obj.icon size={20} className="mb-2 opacity-80" />
                                        <span className="text-xs font-bold">{obj.label}</span>
                                    </button>
                                ))}
                            </div>
                        </section>

                        {/* 3. Audience - Database List ONLY */}
                        <section className="space-y-4">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <Users size={14}/> Selecionar Contatos
                                </label>
                                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">
                                    {formData.contactsCount} selecionados
                                </span>
                            </div>
                            
                            {/* List Selector */}
                            <div className="min-h-[250px]">
                                <div className="border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 overflow-hidden flex flex-col h-[300px] shadow-sm">
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 space-y-2">
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1.5">
                                            <Search size={14} className="text-slate-400"/>
                                            <input type="text" placeholder={t('search')} className="w-full bg-transparent text-xs outline-none dark:text-white" value={contactSearchTerm} onChange={(e) => setContactSearchTerm(e.target.value)} />
                                        </div>
                                        <div className="flex items-center gap-2 justify-between">
                                            <div className="flex items-center gap-2 flex-1">
                                                <Filter size={12} className="text-slate-400" />
                                                <select className="w-full bg-transparent text-[10px] outline-none border-none p-0 text-slate-600 dark:text-slate-300 font-bold uppercase cursor-pointer" value={filterTag} onChange={(e) => setFilterTag(e.target.value)}>
                                                    <option value="all">Todas as Tags</option>
                                                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                                                </select>
                                            </div>
                                            <button 
                                                onClick={() => toggleSelectAll(filteredContacts)}
                                                className="text-[10px] text-blue-600 font-bold hover:underline"
                                            >
                                                {filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.has(c.id)) ? 'Desmarcar Todos' : 'Selecionar Todos'}
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="overflow-y-auto flex-1 p-1 space-y-0.5 custom-scrollbar">
                                        {loadingContacts ? (
                                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" size={16}/></div>
                                        ) : filteredContacts.length === 0 ? (
                                            <div className="p-8 text-center flex flex-col items-center">
                                                <p className="text-xs text-slate-400 mb-2">Nenhum contato encontrado.</p>
                                                <a href="#" className="text-[10px] text-blue-500 hover:underline flex items-center gap-1">
                                                    Ir para Contatos <ExternalLink size={10}/>
                                                </a>
                                            </div>
                                        ) : (
                                            filteredContacts.map(contact => (
                                                <label key={contact.id} className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer group transition-colors ${selectedContactIds.has(contact.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                                    <input type="checkbox" checked={selectedContactIds.has(contact.id)} onChange={() => toggleContactSelection(contact.id)} className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4 cursor-pointer" />
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{contact.name}</div>
                                                        <div className="flex items-center gap-2 mt-0.5">
                                                            <span className="text-[10px] text-slate-400 font-mono">{contact.phone}</span>
                                                            {contact.tags.slice(0, 1).map(tag => (
                                                                <span key={tag} className="px-1.5 py-0.5 rounded text-[8px] bg-slate-100 dark:bg-slate-700 text-slate-500 border border-slate-200 dark:border-slate-600">{tag}</span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                    <div className="p-2 bg-yellow-50 dark:bg-yellow-900/10 border-t border-yellow-100 dark:border-yellow-800/30 text-[10px] text-yellow-700 dark:text-yellow-400 text-center">
                                        Para importar novos contatos, acesse o menu <strong>Contatos</strong>.
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 4. Safety - Speedometer Cards */}
                        <section className="space-y-4">
                             <label className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                <ShieldCheck size={14}/> Velocidade de Disparo
                            </label>
                            <div className="space-y-2">
                                {[
                                    { id: 'low', label: 'Seguro (Recomendado)', sub: '30-120s delay', min: 30, max: 120, color: 'text-green-600', icon: ShieldCheck, border: 'border-green-200 hover:border-green-400', bg: 'bg-green-50 dark:bg-green-900/10' },
                                    { id: 'moderate', label: 'Moderado', sub: '20-60s delay', min: 20, max: 60, color: 'text-amber-600', icon: Shield, border: 'border-amber-200 hover:border-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/10' },
                                    { id: 'high', label: 'Turbo (Alto Risco)', sub: '5-30s delay', min: 5, max: 30, color: 'text-red-600', icon: Zap, border: 'border-red-200 hover:border-red-400', bg: 'bg-red-50 dark:bg-red-900/10' }
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setFormData({...formData, minDelay: option.min, maxDelay: option.max})}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${
                                            formData.minDelay === option.min 
                                            ? `${option.border} ${option.bg} border-2 shadow-sm scale-[1.02]` 
                                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 opacity-70 hover:opacity-100'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full bg-white dark:bg-slate-700 shadow-sm ${option.color}`}>
                                                <option.icon size={16} />
                                            </div>
                                            <div className="text-left">
                                                <span className={`block text-xs font-bold ${option.color} dark:text-slate-200`}>{option.label}</span>
                                                <span className="text-[10px] text-slate-500 font-mono">{option.sub}</span>
                                            </div>
                                        </div>
                                        {formData.minDelay === option.min && <div className={`w-3 h-3 rounded-full ${option.color.replace('text-', 'bg-')}`}></div>}
                                    </button>
                                ))}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right Panel: Workflow Builder (Identical to previous, preserved) */}
                <div className="flex-1 bg-white dark:bg-slate-800 flex flex-col h-full min-w-0 transition-colors">
                    
                    {/* Header */}
                    <div className="px-8 py-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-10 shrink-0">
                        <div>
                            <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                                <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg text-indigo-600 dark:text-indigo-400"><Target size={24} /></div>
                                {t('workflow_builder')}
                            </h3>
                            <p className="text-slate-500 dark:text-slate-400 mt-1 pl-1">Monte a sequência de mensagens que será enviada.</p>
                        </div>
                        <button onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                            <X size={28} />
                        </button>
                    </div>

                    {/* Canvas */}
                    <div className="flex-1 overflow-y-auto p-10 bg-slate-50/50 dark:bg-slate-900/50 relative scroll-smooth">
                        <div className="absolute inset-0 pointer-events-none opacity-[0.03] dark:opacity-[0.05]" 
                             style={{backgroundImage: 'radial-gradient(#6366f1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                        </div>

                        {workflowSteps.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400 dark:text-slate-500 animate-in fade-in zoom-in-95 duration-500">
                                <div className="w-24 h-24 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center mb-6 shadow-sm border border-slate-100 dark:border-slate-600">
                                    <Target size={40} className="opacity-30 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h4 className="text-xl font-bold text-slate-600 dark:text-slate-300 mb-2">{t('workflow_empty')}</h4>
                                <p className="text-slate-500 dark:text-slate-400 mb-8 max-w-sm text-center">Comece adicionando o primeiro passo da sua sequência de mensagens.</p>
                                <button 
                                    onClick={() => setIsStepModalOpen(true)}
                                    className="bg-indigo-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-200 dark:shadow-none flex items-center gap-3 transition-transform hover:scale-105"
                                >
                                    <Plus size={24} /> {t('workflow_add_first')}
                                </button>
                            </div>
                        ) : (
                            <div className="max-w-xl mx-auto space-y-0 pb-20 relative">
                                {/* Trigger Start Node */}
                                <div className="flex flex-col items-center mb-0 animate-in slide-in-from-top-4">
                                    <div className="bg-green-600 text-white px-4 py-2 rounded-full font-bold text-sm shadow-md flex items-center gap-2 z-10 relative">
                                        <Rocket size={16}/> Início: Disparo Agendado
                                    </div>
                                    <div className="h-8 w-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                                </div>

                                {workflowSteps.map((step, index) => {
                                    const isLast = index === workflowSteps.length - 1;
                                    const Icon = step.type === 'text' ? MessageSquare : step.type === 'audio' ? Mic : step.type === 'image' ? ImageIcon : step.type === 'video' ? Video : step.type === 'poll' ? ListChecks : File;
                                    
                                    return (
                                        <div key={step.id} className="relative flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500 group/node">
                                            
                                            {/* Visual Delay Indicator */}
                                            {index >= 0 && (
                                                <div className="absolute -top-4 z-20 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-300 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm">
                                                    <Hourglass size={10} /> {(step.delay / 1000).toFixed(1)}s
                                                </div>
                                            )}

                                            {/* Step Card */}
                                            <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 relative hover:shadow-xl hover:border-indigo-300 dark:hover:border-indigo-600 transition-all z-10">
                                                <div className="flex items-stretch">
                                                    
                                                    {/* Drag Handle */}
                                                    <div className="w-10 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing border-r border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-l-xl hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 hover:text-indigo-400 transition-colors">
                                                        <GripVertical size={20} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 p-5 min-w-0">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 shadow-sm border border-indigo-100 dark:border-indigo-900/50">
                                                                <Icon size={24} />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <div className="flex items-center gap-2 mb-2">
                                                                    <span className="bg-slate-800 dark:bg-slate-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                                                                        PASSO {step.order}
                                                                    </span>
                                                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                        {t(`step_${step.type}` as any)}
                                                                    </h4>
                                                                </div>
                                                                
                                                                {step.type === 'text' ? (
                                                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                                                                        "{step.content}"
                                                                    </div>
                                                                ) : step.type === 'poll' ? (
                                                                    <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                                                        <div className="font-bold text-sm text-slate-800 dark:text-white mb-2">{step.content}</div>
                                                                        <ul className="space-y-1">
                                                                            {step.pollConfig?.values.map((opt, i) => (
                                                                                <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex items-center gap-2">
                                                                                    <div className="w-3 h-3 rounded-full border border-slate-300"></div>
                                                                                    {opt}
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    </div>
                                                                ) : (
                                                                    <div className="flex flex-col gap-2">
                                                                        <StepMediaPreview step={step} />
                                                                        {step.content && step.type !== 'audio' && (
                                                                             <div className="text-xs text-slate-500 italic px-2 flex items-start gap-1">
                                                                                <span className="font-bold not-italic">Legenda:</span> 
                                                                                <span className="truncate">{step.content}</span>
                                                                             </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex flex-col border-l border-slate-100 dark:border-slate-700">
                                                        <button 
                                                            disabled={index === 0}
                                                            onClick={() => moveStep(index, 'up')}
                                                            className="flex-1 px-3 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-tr-xl disabled:opacity-0 transition-colors flex items-center justify-center"
                                                            title="Mover para cima"
                                                        >
                                                            <ArrowUp size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => removeStep(step.id)}
                                                            className="flex-1 px-3 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors flex items-center justify-center border-y border-slate-50 dark:border-slate-700"
                                                            title="Excluir passo"
                                                        >
                                                            <Trash2 size={18} />
                                                        </button>
                                                        <button 
                                                            disabled={isLast}
                                                            onClick={() => moveStep(index, 'down')}
                                                            className="flex-1 px-3 text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-br-xl disabled:opacity-0 transition-colors flex items-center justify-center"
                                                            title="Mover para baixo"
                                                        >
                                                            <ArrowDown size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Connector Line */}
                                            {!isLast ? (
                                                <div className="h-12 w-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-600 relative"></div>
                                            ) : (
                                                <div className="h-8 w-0.5 border-l-2 border-dashed border-slate-300 dark:border-slate-600"></div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Add Step Button */}
                                <div className="flex justify-center">
                                    <button 
                                        onClick={() => setIsStepModalOpen(true)}
                                        className="group bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-6 py-3 rounded-full font-bold hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2 shadow-sm hover:shadow-md z-10 relative"
                                    >
                                        <div className="bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 rounded-full p-1 transition-colors"><Plus size={16} /></div>
                                        {t('workflow_add_next')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step Type Selection Modal (Same as before) */}
                        {isStepModalOpen && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in transition-colors">
                                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                                    <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                                        <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                            {selectedStepType ? (
                                                <>
                                                    <button onClick={() => resetStepForm()} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-sm font-medium">
                                                        <ArrowLeft size={16}/> Tipos
                                                    </button>
                                                    <span className="text-slate-300">/</span>
                                                    <span className="uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                                        {selectedStepType === 'image' && <ImageIcon size={18}/>}
                                                        {selectedStepType === 'video' && <Video size={18}/>}
                                                        {selectedStepType === 'audio' && <Mic size={18}/>}
                                                        {selectedStepType === 'document' && <File size={18}/>}
                                                        {selectedStepType === 'text' && <MessageSquare size={18}/>}
                                                        {selectedStepType === 'poll' && <ListChecks size={18}/>}
                                                        {t(`step_${selectedStepType}` as any)}
                                                    </span>
                                                </>
                                            ) : (
                                                'Adicionar Passo'
                                            )}
                                        </h4>
                                        <button onClick={() => {setIsStepModalOpen(false); resetStepForm();}} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                                            <X size={20}/>
                                        </button>
                                    </div>

                                    <div className="p-6 overflow-y-auto flex-1">
                                        {!selectedStepType ? (
                                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                                                {[
                                                    { id: 'text', label: t('step_text'), desc: 'Envie textos simples ou longos', icon: MessageSquare, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/30', border: 'hover:border-blue-500' },
                                                    { id: 'audio', label: t('step_audio'), desc: 'Envie arquivos de áudio PTT', icon: Mic, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/30', border: 'hover:border-purple-500' },
                                                    { id: 'image', label: t('step_image'), desc: 'Envie fotos promocionais', icon: ImageIcon, color: 'text-pink-600', bg: 'bg-pink-50 dark:bg-pink-900/30', border: 'hover:border-pink-500' },
                                                    { id: 'video', label: t('step_video'), desc: 'Envie vídeos explicativos', icon: Video, color: 'text-orange-600', bg: 'bg-orange-50 dark:bg-orange-900/30', border: 'hover:border-orange-500' },
                                                    { id: 'document', label: t('step_document'), desc: 'PDFs, Docs e Arquivos', icon: File, color: 'text-gray-600', bg: 'bg-gray-50 dark:bg-gray-800', border: 'hover:border-gray-500' },
                                                    { id: 'poll', label: t('step_poll'), desc: 'Enquetes Interativas', icon: ListChecks, color: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-900/30', border: 'hover:border-emerald-500' },
                                                ].map((type) => (
                                                    <button 
                                                        key={type.id}
                                                        onClick={() => handleAddStepClick(type.id as any)}
                                                        className={`flex flex-col items-start p-4 rounded-xl border border-slate-200 dark:border-slate-700 ${type.border} hover:shadow-md transition-all group text-left dark:hover:bg-slate-700 relative overflow-hidden`}
                                                    >
                                                        <div className={`p-3 rounded-lg ${type.bg} ${type.color} mb-3 group-hover:scale-110 transition-transform relative`}>
                                                            <type.icon size={24} />
                                                        </div>
                                                        <span className="font-bold text-slate-800 dark:text-white block mb-1">{type.label}</span>
                                                        <span className="text-xs text-slate-500 dark:text-slate-400">{type.desc}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-6">
                                                {/* Common Delay Settings */}
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                                    <div className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm text-slate-500 dark:text-slate-300">
                                                        <Hourglass size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex justify-between mb-1">
                                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                                                {t('delay_label')}
                                                            </label>
                                                            <span className="text-xs font-bold text-indigo-500">{stepDelay / 1000} {t('seconds')}</span>
                                                        </div>
                                                        <input 
                                                            type="range"
                                                            min="1"
                                                            max="60"
                                                            className="w-full h-2 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-indigo-600"
                                                            value={stepDelay / 1000}
                                                            onChange={e => setStepDelay(Math.max(1, Number(e.target.value)) * 1000)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* --- TEXT EDITOR --- */}
                                                {selectedStepType === 'text' && (
                                                    <div className="space-y-2">
                                                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-all shadow-sm">
                                                            {/* Toolbar */}
                                                            <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50">
                                                                <button onClick={() => insertVariable('*')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300" title="Negrito"><Bold size={16}/></button>
                                                                <button onClick={() => insertVariable('_')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300" title="Itálico"><Italic size={16}/></button>
                                                                <button onClick={() => insertVariable('~')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300" title="Riscado"><Strikethrough size={16}/></button>
                                                                <button onClick={() => insertVariable(' ``` ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300" title="Monoespaçado"><Code size={16}/></button>
                                                                <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-2"></div>
                                                                <button onClick={() => insertVariable('{nome}')} className="px-2 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 transition-colors">{`{nome}`}</button>
                                                                <button onClick={() => insertVariable('{telefone}')} className="px-2 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 transition-colors">{`{telefone}`}</button>
                                                            </div>
                                                            <textarea 
                                                                className="w-full h-40 p-4 text-base bg-transparent border-none outline-none resize-none font-sans text-slate-800 dark:text-white"
                                                                placeholder="Digite o conteúdo da mensagem aqui..."
                                                                value={stepContent}
                                                                onChange={e => setStepContent(e.target.value)}
                                                                autoFocus
                                                            ></textarea>
                                                            <div className="p-2 text-right text-xs text-slate-400 border-t border-slate-50 dark:border-slate-700/50">
                                                                {stepContent.length} caracteres
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* --- MEDIA UPLOADER (Image/Video/Doc/Audio) --- */}
                                                {['image', 'video', 'audio', 'document'].includes(selectedStepType) && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                        
                                                        {/* Toggle Mode */}
                                                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-fit">
                                                            <button onClick={() => setMediaMode('upload')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mediaMode === 'upload' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                <Upload size={14}/> Upload
                                                            </button>
                                                            <button onClick={() => setMediaMode('url')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mediaMode === 'url' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                                                <LinkIcon size={14}/> Link
                                                            </button>
                                                        </div>

                                                        {/* Preview Area or Dropzone */}
                                                        {stepFile || stepMediaUrl ? (
                                                            <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                                                <div className="p-4 flex items-center justify-center min-h-[160px]">
                                                                    {selectedStepType === 'audio' ? (
                                                                        <div className="w-full flex items-center gap-4 bg-white dark:bg-slate-700 p-4 rounded-xl shadow-sm">
                                                                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center text-purple-600">
                                                                                <Play size={20} fill="currentColor"/>
                                                                            </div>
                                                                            <div className="flex-1 space-y-2">
                                                                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-600 rounded-full overflow-hidden">
                                                                                    <div className="h-full w-1/3 bg-purple-500"></div>
                                                                                </div>
                                                                                <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                                                                                    <span>0:00</span>
                                                                                    <span>0:15</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ) : selectedStepType === 'document' ? (
                                                                        <div className="flex items-center gap-4">
                                                                            <FileText size={48} className="text-slate-400"/>
                                                                            <div>
                                                                                <p className="font-bold text-slate-700 dark:text-white">{stepFile?.name || 'documento.pdf'}</p>
                                                                                <p className="text-xs text-slate-500 uppercase">Documento</p>
                                                                            </div>
                                                                        </div>
                                                                    ) : (
                                                                        <StepMediaPreview step={{
                                                                            id: 'temp-preview',
                                                                            type: selectedStepType!,
                                                                            content: stepContent,
                                                                            delay: 0,
                                                                            order: 0,
                                                                            file: stepFile || undefined,
                                                                            mediaUrl: stepMediaUrl || undefined
                                                                        }} />
                                                                    )}
                                                                </div>
                                                                
                                                                {/* Remove Button */}
                                                                <button 
                                                                    onClick={() => { setStepFile(null); setStepMediaUrl(''); }}
                                                                    className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-slate-800/90 text-red-500 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                                >
                                                                    <Trash2 size={16}/>
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            /* Empty State / Dropzone */
                                                            mediaMode === 'upload' ? (
                                                                <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 relative transition-colors cursor-pointer group">
                                                                    <input type="file" accept={selectedStepType === 'image' ? "image/*" : selectedStepType === 'audio' ? "audio/*" : selectedStepType === 'video' ? "video/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt"} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={(e) => { if (e.target.files?.[0]) setStepFile(e.target.files[0]); }} />
                                                                    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                                        {selectedStepType === 'audio' ? <Mic size={28} className="text-purple-500"/> : <Upload size={28} className="text-blue-500"/>}
                                                                    </div>
                                                                    <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Clique para carregar {selectedStepType === 'image' ? 'uma imagem' : selectedStepType === 'video' ? 'um vídeo' : selectedStepType === 'audio' ? 'um áudio' : 'um documento'}</p>
                                                                    <p className="text-xs text-slate-400 mt-1">Tamanho máx: 16MB</p>
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">
                                                                    <LinkIcon size={18} className="text-slate-400" />
                                                                    <input type="url" className="w-full bg-transparent outline-none text-slate-700 dark:text-white text-sm" placeholder="https://exemplo.com/arquivo" value={stepMediaUrl} onChange={e => setStepMediaUrl(e.target.value)} />
                                                                </div>
                                                            )
                                                        )}

                                                        {/* Caption Field (Not for audio) */}
                                                        {selectedStepType !== 'audio' && (
                                                            <div>
                                                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Legenda (Opcional)</label>
                                                                <input type="text" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Digite uma legenda..." value={stepContent} onChange={e => setStepContent(e.target.value)} />
                                                            </div>
                                                        )}

                                                        {/* PTT Toggle for Audio */}
                                                        {selectedStepType === 'audio' && (
                                                            <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-100 dark:border-purple-800">
                                                                <div className="p-2 bg-white dark:bg-purple-900/50 rounded-full text-purple-600">
                                                                    <Mic size={18} />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <p className="text-sm font-bold text-purple-900 dark:text-purple-100">Simular Gravação (PTT)</p>
                                                                    <p className="text-xs text-purple-600 dark:text-purple-300">O áudio aparecerá como "gravado agora" no WhatsApp.</p>
                                                                </div>
                                                                <input type="checkbox" className="w-5 h-5 text-purple-600 rounded border-purple-300 focus:ring-purple-500" defaultChecked />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {/* --- POLL EDITOR --- */}
                                                {selectedStepType === 'poll' && (
                                                    <div className="space-y-4">
                                                        <div>
                                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 block">Pergunta da Enquete</label>
                                                            <div className="relative">
                                                                <div className="absolute top-3 left-3 text-slate-400"><ListChecks size={18}/></div>
                                                                <input type="text" className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 outline-none font-medium" placeholder="Ex: Qual o melhor horário?" value={stepContent} onChange={e => setStepContent(e.target.value)} />
                                                            </div>
                                                        </div>
                                                        
                                                        <div>
                                                            <div className="flex justify-between items-center mb-2">
                                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Opções</label>
                                                                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-emerald-600 font-bold hover:underline flex items-center gap-1 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded"><Plus size={12}/> Adicionar</button>
                                                            </div>
                                                            <div className="space-y-2">
                                                                {pollOptions.map((opt, idx) => (
                                                                    <div key={idx} className="flex gap-2 items-center group">
                                                                        <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-xs font-bold text-slate-500">{idx + 1}</div>
                                                                        <input type="text" className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500 outline-none" placeholder={`Opção ${idx + 1}`} value={opt} onChange={e => { const newOpts = [...pollOptions]; newOpts[idx] = e.target.value; setPollOptions(newOpts); }} />
                                                                        {pollOptions.length > 2 && (<button onClick={() => { const newOpts = pollOptions.filter((_, i) => i !== idx); setPollOptions(newOpts); }} className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>)}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-sm text-slate-600 dark:text-slate-300">Respostas permitidas</span>
                                                                <div className="flex items-center gap-3">
                                                                    <button onClick={() => setPollSelectableCount(Math.max(1, pollSelectableCount - 1))} className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 font-bold hover:bg-slate-200">-</button>
                                                                    <span className="font-bold text-slate-800 dark:text-white w-4 text-center">{pollSelectableCount}</span>
                                                                    <button onClick={() => setPollSelectableCount(Math.min(pollOptions.length, pollSelectableCount + 1))} className="w-8 h-8 rounded bg-slate-100 dark:bg-slate-700 text-slate-600 font-bold hover:bg-slate-200">+</button>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {selectedStepType && (
                                        <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex justify-end gap-3 shrink-0">
                                            <button onClick={() => {setIsStepModalOpen(false); resetStepForm();}} className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                                            <button onClick={handleConfirmStep} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform hover:-translate-y-0.5">Confirmar e Adicionar</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 z-20 shrink-0 transition-colors">
                        <div className="flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300"></span> {workflowSteps.length} Passos</div>
                             <div className="hidden md:flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-blue-300"></span> {formData.contactsCount} Destinatários</div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setIsCreating(false)} className="px-6 py-3 rounded-xl text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 font-bold transition-colors">{t('cancel')}</button>
                            <button onClick={handleCreate} disabled={!formData.name || !formData.date || formData.contactsCount === 0 || workflowSteps.length === 0} className="px-8 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-1"><Send size={20} /> {t('start_campaign')}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
