

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Send, Plus, Calendar, FileText, Upload, CheckCircle, BarChart2, Loader2, X, Target, Clock, User, Download,
  MessageSquare, Mic, Image as ImageIcon, Video, Trash2, ArrowDown, ArrowUp, List, Search, GripVertical, Settings, Hourglass, Filter, ShieldCheck, ShieldAlert, Lock, Zap, Shield, Crown, Link as LinkIcon, ListChecks, File, ArrowLeft, Eye
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
  const { t } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    date: '',
    objective: 'prospecting' as CampaignObjective,
    contactsMode: 'text' as 'text' | 'csv' | 'list',
    contactsInput: '',
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
  const [csvPreviewData, setCsvPreviewData] = useState<{name: string, phone: string}[]>([]);

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
  const [isProcessingFile, setIsProcessingFile] = useState(false);

  useEffect(() => {
    loadCampaigns();
  }, [currentUser]);

  useEffect(() => {
    if (formData.contactsMode === 'list' && availableContacts.length === 0) {
        loadContacts();
    }
  }, [formData.contactsMode]);

  useEffect(() => {
      if (formData.contactsMode === 'list') {
          setFormData(prev => ({ ...prev, contactsCount: selectedContactIds.size }));
      }
  }, [selectedContactIds, formData.contactsMode]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingFile(true);
    
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        if (!text) {
             setIsProcessingFile(false);
             return;
        }

        const lines = text.split(/\r\n|\n/);
        const preview: {name: string, phone: string}[] = [];
        
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
                const delimiter = trimmedLine.includes(';') ? ';' : ',';
                const parts = trimmedLine.split(delimiter);
                
                if (parts.length >= 2) {
                    const name = parts[0].trim().replace(/^["']|["']$/g, '');
                    const phoneRaw = parts[1].trim().replace(/^["']|["']$/g, '');
                    const phone = phoneRaw.replace(/\D/g, '');

                    if (name && phone.length >= 8) {
                        preview.push({ name, phone });
                    }
                }
            }
        });

        if (preview.length > 0) {
             const firstRowName = preview[0].name.toLowerCase();
             if (['name', 'nome', 'nome completo', 'contato', 'full name'].includes(firstRowName)) {
                 preview.shift();
             }
        }

        if (preview.length === 0) {
            alert("Não foi possível identificar contatos válidos no arquivo.");
        }

        setCsvPreviewData(preview);
        setFormData(prev => ({ ...prev, contactsCount: preview.length }));
        setIsProcessingFile(false);
        e.target.value = '';
    };
    
    reader.onerror = () => {
        alert("Erro ao ler o arquivo.");
        setIsProcessingFile(false);
        e.target.value = '';
    };

    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
      const count = text.split('\n').filter(l => l.trim().length > 0).length;
      setFormData(prev => ({ ...prev, contactsInput: text, contactsCount: count }));
  };

  const toggleContactSelection = (id: string) => {
      const newSet = new Set(selectedContactIds);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      setSelectedContactIds(newSet);
  };

  const toggleSelectAll = (filteredContacts: Contact[]) => {
      if (filteredContacts.every(c => selectedContactIds.has(c.id))) {
          const newSet = new Set(selectedContactIds);
          filteredContacts.forEach(c => newSet.delete(c.id));
          setSelectedContactIds(newSet);
      } else {
          const newSet = new Set(selectedContactIds);
          filteredContacts.forEach(c => newSet.add(c.id));
          setSelectedContactIds(newSet);
      }
  };

  const handleCreate = async () => {
    if (!formData.name || !formData.date || formData.contactsCount === 0 || workflowSteps.length === 0) return;

    await campaignService.createCampaign({
        name: formData.name,
        scheduledDate: formData.date,
        objective: formData.objective,
        agentName: currentUser.name,
        ownerId: currentUser.id,
        totalContacts: formData.contactsCount,
        workflow: workflowSteps,
        minDelay: formData.minDelay,
        maxDelay: formData.maxDelay
    });

    setIsCreating(false);
    resetForm();
    loadCampaigns();
  };

  const resetForm = () => {
    setFormData({ 
        name: '', 
        date: '', 
        objective: 'prospecting', 
        contactsMode: 'text', 
        contactsInput: '', 
        contactsCount: 0,
        minDelay: 30,
        maxDelay: 120
    });
    setWorkflowSteps([]);
    resetStepForm();
    setSelectedContactIds(new Set());
    setContactSearchTerm('');
    setFilterTag('all');
    setCsvPreviewData([]);
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
      if (selectedStepType === 'poll') {
          if (!stepContent.trim()) return;
          if (pollOptions.some(o => !o.trim())) return;
      }
      if (['image', 'video', 'audio', 'document'].includes(selectedStepType)) {
          if (mediaMode === 'upload' && !stepFile) return;
          if (mediaMode === 'url' && !stepMediaUrl.trim()) return;
      }

      const newStep: WorkflowStep = {
          id: Math.random().toString(36).substr(2, 9),
          type: selectedStepType,
          content: stepContent, 
          file: stepFile || undefined,
          mediaUrl: stepMediaUrl || undefined,
          delay: stepDelay,
          order: workflowSteps.length + 1,
          pollConfig: selectedStepType === 'poll' ? {
              selectableCount: pollSelectableCount,
              values: pollOptions
          } : undefined
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

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'completed': return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
          case 'processing': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
          default: return 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300';
      }
  };

  const allTags = Array.from(new Set(availableContacts.flatMap(c => c.tags || []))).sort();

  const filteredContacts = availableContacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || 
                            c.phone.includes(contactSearchTerm);
      const matchesTag = filterTag === 'all' || (c.tags && c.tags.includes(filterTag));
      return matchesSearch && matchesTag;
  });

  const insertVariable = (variable: string) => {
      setStepContent(prev => prev + variable);
  };

  return (
    <div className="space-y-8">
      <style>{`
        @keyframes dash-move {
          to {
            stroke-dashoffset: -20;
          }
        }
        .animate-dash-line line {
          stroke-dasharray: 6;
          animation: dash-move 1s linear infinite;
        }
      `}</style>

      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white">{t('campaigns_title')}</h2>
          <p className="text-slate-500 dark:text-slate-400">{t('campaigns_subtitle')}</p>
        </div>
        <button 
          onClick={() => { setIsCreating(true); resetForm(); }}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-shadow shadow-md shadow-blue-600/20"
        >
          <Plus size={18} />
          {t('new_campaign')}
        </button>
      </div>

      {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {campaigns.map(campaign => (
                <div 
                    key={campaign.id} 
                    className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col transition-all`}
                >
                    <div className="p-6 flex-1">
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-2 rounded-lg text-xs font-bold uppercase tracking-wide ${getStatusColor(campaign.status)}`}>
                                {campaign.status === 'completed' ? 'Concluída' : campaign.status === 'processing' ? 'Enviando...' : 'Agendada'}
                            </div>
                            <Target className="text-slate-300 dark:text-slate-600" size={20}/>
                        </div>

                        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1">{campaign.name}</h3>
                        <div className="flex items-center gap-2 mb-4">
                             <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                                  campaign.ownerId === currentUser.id 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800' 
                                  : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                              }`}>
                                  {campaign.ownerId === currentUser.id ? t('my_instance') : t('team_instance')}
                              </span>
                              {campaign.ownerId !== currentUser.id && (
                                  <span className="text-xs text-slate-400">Criado por: {campaign.agentName}</span>
                              )}
                        </div>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-1">
                            <Calendar size={14}/> {new Date(campaign.scheduledDate).toLocaleDateString()}
                        </p>

                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{t('objective')}</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{getObjectiveLabel(campaign.objective)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">{t('safety_level')}</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                                    <ShieldCheck size={12} className="text-green-600 dark:text-green-400"/>
                                    {campaign.minDelay}s - {campaign.maxDelay}s
                                </span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500 dark:text-slate-400">Contatos</span>
                                <span className="font-medium text-slate-700 dark:text-slate-300">{campaign.totalContacts}</span>
                            </div>
                        </div>

                        {campaign.status === 'processing' && (
                            <div className="mt-4 flex items-center gap-2 text-blue-600 dark:text-blue-400 text-sm animate-pulse">
                                <Loader2 size={16} className="animate-spin" />
                                Processando envios...
                            </div>
                        )}

                        {campaign.status === 'completed' && (
                            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-slate-500 dark:text-slate-400">Taxa de Entrega</span>
                                    <span className={`font-bold ${(campaign.deliveryRate || 0) > 90 ? 'text-green-600 dark:text-green-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                        {campaign.deliveryRate}%
                                    </span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 mt-2 mb-4">
                                    <div className="bg-green-500 h-1.5 rounded-full" style={{width: `${campaign.deliveryRate}%`}}></div>
                                </div>
                                <button 
                                    onClick={() => handleDownloadReport(campaign)}
                                    className="w-full bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 text-sm font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    <Download size={16} />
                                    Baixar Relatório
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-[95vw] max-h-[90vh] h-[90vh] shadow-2xl flex flex-col lg:flex-row overflow-hidden border border-slate-200 dark:border-slate-700 transition-colors">
                
                {/* Left Panel: Settings */}
                <div className="w-full lg:w-[450px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full shrink-0">
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center gap-2 bg-white dark:bg-slate-800">
                        <Settings size={20} className="text-slate-400" />
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('settings')}</h3>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-8">
                        {/* Basic Info */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Dados Básicos</h4>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('campaign_name')}</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                                    placeholder="Ex: Oferta de Natal"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('execution_date')}</label>
                                <input 
                                    type="date" 
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-sm"
                                    value={formData.date}
                                    onChange={e => setFormData({...formData, date: e.target.value})}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('objective')}</label>
                                <div className="grid grid-cols-1 gap-2">
                                    {(['prospecting', 'communication', 'promotion', 'sales', 'maintenance'] as const).map((obj) => (
                                        <button
                                            key={obj}
                                            onClick={() => setFormData({...formData, objective: obj})}
                                            className={`py-2 px-3 rounded-lg text-sm font-medium border text-left transition-all ${
                                                formData.objective === obj 
                                                ? 'border-blue-500 bg-white dark:bg-slate-700 text-blue-700 dark:text-blue-300 shadow-md ring-1 ring-blue-500' 
                                                : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700'
                                            }`}
                                        >
                                            {getObjectiveLabel(obj)}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Anti-Ban Settings */}
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                             <div className="flex justify-between items-center">
                                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                    <ShieldCheck size={14} /> {t('safety_level')}
                                </h4>
                             </div>
                             <div className="space-y-2">
                                {[
                                    { id: 'high', label: 'ALTO RISCO DE BANIMENTO', sub: '05 a 30 segundos', min: 5, max: 30, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: Zap },
                                    { id: 'moderate', label: 'RISCO MODERADO DE BANIMENTO', sub: '20 a 60 segundos', min: 20, max: 60, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: Shield },
                                    { id: 'low', label: 'BAIXO RISCO DE BANIMENTO', sub: '30 a 120 segundos', min: 30, max: 120, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: ShieldCheck }
                                ].map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setFormData({...formData, minDelay: option.min, maxDelay: option.max})}
                                        className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                            formData.minDelay === option.min 
                                            ? `${option.border} ${option.bg} ring-1 ring-offset-1 dark:ring-offset-slate-900 ring-transparent shadow-sm` 
                                            : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 opacity-60 hover:opacity-100 hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm ${option.color}`}>
                                                <option.icon size={18} />
                                            </div>
                                            <div className="text-left">
                                                <span className={`block text-xs font-bold ${option.color}`}>{option.label}</span>
                                                <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Intervalo: {option.sub}</span>
                                            </div>
                                        </div>
                                        {formData.minDelay === option.min && (
                                            <CheckCircle size={18} className={option.color.split(' ')[0]} />
                                        )}
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Audience */}
                        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('target_audience')}</h4>
                            
                            <div className="flex bg-white dark:bg-slate-800 p-1 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                                <button 
                                    onClick={() => { setFormData({...formData, contactsMode: 'text'}); setCsvPreviewData([]); }}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${formData.contactsMode === 'text' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {t('paste_numbers')}
                                </button>
                                <button 
                                    onClick={() => setFormData({...formData, contactsMode: 'csv'})}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${formData.contactsMode === 'csv' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {t('csv_file')}
                                </button>
                                <button 
                                    onClick={() => { setFormData({...formData, contactsMode: 'list'}); setCsvPreviewData([]); }}
                                    className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-colors ${formData.contactsMode === 'list' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                                >
                                    {t('contact_list')}
                                </button>
                            </div>

                            {/* Audience inputs */}
                            {formData.contactsMode === 'text' && (
                                <textarea 
                                    className="w-full h-40 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg p-3 text-xs font-mono focus:ring-2 focus:ring-blue-500 outline-none resize-none bg-white shadow-sm"
                                    placeholder="5511999998888&#10;5511999997777"
                                    value={formData.contactsInput}
                                    onChange={e => handleTextChange(e.target.value)}
                                ></textarea>
                            )}

                            {formData.contactsMode === 'csv' && (
                                <>
                                    {csvPreviewData.length > 0 ? (
                                        <div className="border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden flex flex-col h-[300px] shadow-sm animate-in fade-in">
                                            <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 flex justify-between items-center">
                                                <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Pré-visualização ({csvPreviewData.length})</span>
                                                <button 
                                                    onClick={() => { setCsvPreviewData([]); setFormData(prev => ({ ...prev, contactsCount: 0 })); }}
                                                    className="text-xs text-red-500 hover:underline flex items-center gap-1"
                                                >
                                                    <Trash2 size={12}/> Remover
                                                </button>
                                            </div>
                                            <div className="overflow-y-auto flex-1 p-0">
                                                <table className="w-full text-left text-xs">
                                                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400 sticky top-0">
                                                        <tr>
                                                            <th className="px-4 py-2 font-medium">Nome</th>
                                                            <th className="px-4 py-2 font-medium">Telefone</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                                        {csvPreviewData.map((row, idx) => (
                                                            <tr key={idx} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                                                                <td className="px-4 py-2 text-slate-700 dark:text-slate-300 truncate max-w-[150px]">{row.name}</td>
                                                                <td className="px-4 py-2 text-slate-500 dark:text-slate-400 font-mono">{row.phone}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center hover:bg-white dark:hover:bg-slate-700/50 transition-colors relative h-40 flex flex-col items-center justify-center bg-slate-50/50 dark:bg-slate-800/50">
                                            <input 
                                                type="file" 
                                                accept=".csv" 
                                                onChange={handleFileUpload} 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                                            />
                                            <div className="text-slate-500 text-sm">
                                                {isProcessingFile ? <Loader2 className="animate-spin mx-auto mb-2"/> : <Upload className="mx-auto mb-2 text-slate-400" size={24} />}
                                                <p className="font-medium text-slate-700 dark:text-slate-300">{isProcessingFile ? 'Lendo...' : t('drag_csv')}</p>
                                                <p className="text-xs text-slate-400 mt-1">Formato: NOME, TELEFONE</p>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}

                            {formData.contactsMode === 'list' && (
                                <div className="border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 overflow-hidden flex flex-col h-[300px] shadow-sm">
                                    <div className="p-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 space-y-2">
                                        <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-md px-2 py-1.5">
                                            <Search size={14} className="text-slate-400"/>
                                            <input 
                                                type="text" 
                                                placeholder={t('search')} 
                                                className="w-full bg-transparent text-xs outline-none dark:text-white"
                                                value={contactSearchTerm}
                                                onChange={(e) => setContactSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Filter size={14} className="text-slate-400" />
                                            <select 
                                                className="w-full bg-transparent text-xs outline-none border-none p-0 focus:ring-0 text-slate-600 dark:text-slate-300 font-medium"
                                                value={filterTag}
                                                onChange={(e) => setFilterTag(e.target.value)}
                                            >
                                                <option value="all">Todas as Tags</option>
                                                {allTags.map(tag => (
                                                    <option key={tag} value={tag}>{tag}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-2 bg-slate-50/30 dark:bg-slate-700/30">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                            checked={filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.has(c.id))}
                                            onChange={() => toggleSelectAll(filteredContacts)}
                                        />
                                        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{t('select_all')}</span>
                                        {filterTag !== 'all' && <span className="text-xs text-indigo-500 font-bold ml-auto">{filteredContacts.length} na tag</span>}
                                    </div>
                                    <div className="overflow-y-auto flex-1 p-1 space-y-1">
                                        {loadingContacts ? (
                                            <div className="flex justify-center p-4"><Loader2 className="animate-spin text-slate-400" size={16}/></div>
                                        ) : filteredContacts.length === 0 ? (
                                            <div className="p-8 text-center text-sm text-slate-400">Nenhum contato encontrado.</div>
                                        ) : (
                                            filteredContacts.map(contact => (
                                                <label key={contact.id} className={`flex items-center gap-3 p-2.5 rounded cursor-pointer group transition-colors ${selectedContactIds.has(contact.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={selectedContactIds.has(contact.id)}
                                                        onChange={() => toggleContactSelection(contact.id)}
                                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                    />
                                                    <div className="flex-1 overflow-hidden">
                                                        <div className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">{contact.name}</div>
                                                        <div className="text-xs text-slate-400">{contact.phone}</div>
                                                    </div>
                                                </label>
                                            ))
                                        )}
                                    </div>
                                </div>
                            )}

                            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg p-3 flex justify-between items-center shadow-sm">
                                <span className="text-sm text-slate-500 dark:text-slate-400 font-medium">Contatos Selecionados</span>
                                <span className="text-lg font-bold text-slate-800 dark:text-white">{formData.contactsCount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Workflow Builder */}
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
                            <div className="max-w-2xl mx-auto space-y-0 pb-20">
                                {workflowSteps.map((step, index) => {
                                    const isLast = index === workflowSteps.length - 1;
                                    const Icon = step.type === 'text' ? MessageSquare : step.type === 'audio' ? Mic : step.type === 'image' ? ImageIcon : step.type === 'video' ? Video : step.type === 'poll' ? ListChecks : File;
                                    
                                    return (
                                        <div key={step.id} className="relative flex flex-col items-center animate-in slide-in-from-bottom-4 fade-in duration-500">
                                            {/* Step Card */}
                                            <div className="w-full bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-1 relative group hover:shadow-lg hover:border-indigo-200 dark:hover:border-indigo-800 transition-all z-10">
                                                <div className="flex items-stretch">
                                                    
                                                    {/* Drag Handle */}
                                                    <div className="w-10 flex flex-col items-center justify-center text-slate-300 dark:text-slate-600 cursor-grab active:cursor-grabbing border-r border-slate-50 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-700/50 rounded-l-xl hover:bg-indigo-50/30 dark:hover:bg-indigo-900/30 hover:text-indigo-400 transition-colors">
                                                        <GripVertical size={20} />
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 p-5 min-w-0">
                                                        <div className="flex items-start gap-4">
                                                            <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-xl shrink-0 shadow-sm">
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
                                                                    <span className="text-xs text-slate-400 ml-auto flex items-center gap-1 bg-slate-50 dark:bg-slate-700 px-2 py-0.5 rounded">
                                                                        <Hourglass size={10} /> {(step.delay / 1000).toFixed(1)}s delay
                                                                    </span>
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

                                            {!isLast && (
                                                <div className="h-10 w-0.5 border-l-2 border-dashed border-indigo-300 dark:border-indigo-700 my-2 relative overflow-hidden opacity-50">
                                                    <div className="absolute inset-0 w-full h-full bg-indigo-400 animate-[dash-move_1s_linear_infinite]" style={{backgroundSize: '2px 10px', backgroundRepeat: 'repeat-y', backgroundImage: 'linear-gradient(to bottom, transparent 50%, #6366f1 50%)'}}></div>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}

                                {/* Add Step Button */}
                                <div className="flex justify-center mt-8">
                                    <button 
                                        onClick={() => setIsStepModalOpen(true)}
                                        className="group bg-white dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-600 text-slate-500 dark:text-slate-400 px-6 py-3 rounded-full font-bold hover:border-indigo-500 dark:hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
                                    >
                                        <div className="bg-slate-200 dark:bg-slate-700 group-hover:bg-indigo-200 dark:group-hover:bg-indigo-800 rounded-full p-1 transition-colors"><Plus size={16} /></div>
                                        {t('workflow_add_next')}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Step Type Selection Modal (Internal) */}
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
                                                <div className="bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4">
                                                    <div className="p-2 bg-white dark:bg-slate-600 rounded-lg shadow-sm text-slate-500 dark:text-slate-300">
                                                        <Hourglass size={20} />
                                                    </div>
                                                    <div className="flex-1">
                                                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                                                            {t('delay_label')}
                                                        </label>
                                                        <div className="flex items-center gap-2">
                                                            <input 
                                                                type="number" 
                                                                min="1"
                                                                className="w-24 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-700 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500"
                                                                value={stepDelay / 1000}
                                                                onChange={e => setStepDelay(Math.max(1, Number(e.target.value)) * 1000)}
                                                            />
                                                            <span className="text-sm text-slate-500 dark:text-slate-400">{t('seconds')}</span>
                                                        </div>
                                                    </div>
                                                </div>

                                                {selectedStepType === 'text' && (
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Conteúdo da Mensagem</label>
                                                            <div className="flex gap-1">
                                                                <button onClick={() => insertVariable('*')} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs hover:bg-slate-200 font-bold">B</button>
                                                                <button onClick={() => insertVariable('_')} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs hover:bg-slate-200 italic">I</button>
                                                                <button onClick={() => insertVariable('~')} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs hover:bg-slate-200 line-through">S</button>
                                                                <button onClick={() => insertVariable(' ``` ')} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-xs hover:bg-slate-200 font-mono">Code</button>
                                                            </div>
                                                        </div>
                                                        <textarea 
                                                            className="w-full h-40 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-4 text-base focus:ring-2 focus:ring-indigo-500 outline-none resize-none shadow-sm font-sans"
                                                            placeholder="Digite o conteúdo da mensagem aqui..."
                                                            value={stepContent}
                                                            onChange={e => setStepContent(e.target.value)}
                                                            autoFocus
                                                        ></textarea>
                                                        <div className="flex gap-2 mt-1">
                                                            <button onClick={() => insertVariable('{nome}')} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100">{`{nome}`}</button>
                                                            <button onClick={() => insertVariable('{saudação}')} className="text-xs bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 px-2 py-1 rounded border border-indigo-100 dark:border-indigo-800 hover:bg-indigo-100">{`{saudação}`}</button>
                                                        </div>
                                                    </div>
                                                )}

                                                {['image', 'video', 'audio', 'document'].includes(selectedStepType) && (
                                                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
                                                        <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-fit">
                                                            <button onClick={() => setMediaMode('upload')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${mediaMode === 'upload' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>Upload Arquivo</button>
                                                            <button onClick={() => setMediaMode('url')} className={`px-4 py-1.5 text-sm rounded-md transition-all ${mediaMode === 'url' ? 'bg-white dark:bg-slate-600 shadow-sm text-indigo-600 dark:text-white font-bold' : 'text-slate-500 dark:text-slate-400'}`}>Link URL</button>
                                                        </div>

                                                        {mediaMode === 'upload' ? (
                                                            <div className="border-2 border-dashed border-indigo-200 dark:border-indigo-800 rounded-xl p-8 text-center hover:bg-indigo-50/50 dark:hover:bg-indigo-900/30 relative transition-colors bg-indigo-50/20 dark:bg-indigo-900/10 group cursor-pointer">
                                                                <input type="file" accept={selectedStepType === 'image' ? "image/*" : selectedStepType === 'audio' ? "audio/*" : selectedStepType === 'video' ? "video/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt"} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={(e) => { if (e.target.files?.[0]) setStepFile(e.target.files[0]); }} />
                                                                {stepFile ? (
                                                                    <div className="relative z-0">
                                                                        <div className="text-indigo-600 dark:text-indigo-400 font-medium flex flex-col items-center gap-2">
                                                                            <div className="w-12 h-12 bg-white dark:bg-slate-600 rounded-full flex items-center justify-center shadow-sm"><CheckCircle size={24} className="text-green-500" /></div>
                                                                            <span className="text-sm text-slate-800 dark:text-white font-bold truncate max-w-[200px]">{stepFile.name}</span>
                                                                            <span className="text-xs text-indigo-500 dark:text-indigo-400 mt-1 font-bold uppercase tracking-wider">Clique para alterar</span>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <div className="text-slate-500 dark:text-slate-400 py-4">
                                                                        <div className="w-16 h-16 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-500 dark:text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform"><Upload size={32} /></div>
                                                                        <p className="text-lg font-bold text-slate-700 dark:text-slate-300">Faça upload do arquivo</p>
                                                                        <p className="text-sm text-slate-400 mt-1">Suporta {selectedStepType}.</p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">URL do Arquivo</label>
                                                                    <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 bg-white dark:bg-slate-700 focus-within:ring-2 focus-within:ring-indigo-500">
                                                                        <LinkIcon size={18} className="text-slate-400" />
                                                                        <input type="url" className="w-full bg-transparent outline-none text-slate-700 dark:text-white text-sm" placeholder="https://exemplo.com/arquivo" value={stepMediaUrl} onChange={e => setStepMediaUrl(e.target.value)} />
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}

                                                        {selectedStepType !== 'audio' && (
                                                            <div className="space-y-2 pt-2">
                                                                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Legenda (Opcional)</label>
                                                                <input type="text" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Digite uma legenda para a mídia..." value={stepContent} onChange={e => setStepContent(e.target.value)} />
                                                            </div>
                                                        )}
                                                    </div>
                                                )}

                                                {selectedStepType === 'poll' && (
                                                    <div className="space-y-4">
                                                        <div className="space-y-2">
                                                            <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Pergunta da Enquete</label>
                                                            <input type="text" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-3 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ex: Qual o melhor horário?" value={stepContent} onChange={e => setStepContent(e.target.value)} />
                                                        </div>
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Opções de Resposta</label>
                                                                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1"><Plus size={12}/> Adicionar Opção</button>
                                                            </div>
                                                            {pollOptions.map((opt, idx) => (
                                                                <div key={idx} className="flex gap-2">
                                                                    <input type="text" className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder={`Opção ${idx + 1}`} value={opt} onChange={e => { const newOpts = [...pollOptions]; newOpts[idx] = e.target.value; setPollOptions(newOpts); }} />
                                                                    {pollOptions.length > 2 && (<button onClick={() => { const newOpts = pollOptions.filter((_, i) => i !== idx); setPollOptions(newOpts); }} className="text-slate-400 hover:text-red-500 p-2"><Trash2 size={16}/></button>)}
                                                                </div>
                                                            ))}
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
