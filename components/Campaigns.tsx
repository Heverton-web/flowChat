
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Send, Plus, Calendar, FileText, Upload, CheckCircle, BarChart2, Loader2, X, Target, Clock, Download,
  MessageSquare, Mic, Image as ImageIcon, Video, Trash2, Hourglass, ShieldCheck, Shield, Zap, Link as LinkIcon, ListChecks, File, ArrowLeft, Bold, Italic, Strikethrough, Code, Settings, Activity, Play
} from 'lucide-react';
import { 
  ReactFlow, 
  Background, 
  Controls, 
  MiniMap, 
  useNodesState, 
  useEdgesState, 
  addEdge,
  Handle, 
  Position,
  Connection,
  Edge,
  Node,
  MarkerType,
  BaseEdge,
  EdgeLabelRenderer,
  getSmoothStepPath,
  useReactFlow
} from '@xyflow/react';

import { Campaign, CampaignObjective, WorkflowStep, WorkflowStepType, Contact, User as UserType } from '../types';
import * as campaignService from '../services/campaignService';
import * as contactService from '../services/contactService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

// --- CUSTOM EDGE WITH DELETE BUTTON ---
const CustomEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style = {},
  markerEnd,
}: any) => {
  const { setEdges } = useReactFlow();
  const [edgePath, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const onEdgeClick = (evt: React.MouseEvent) => {
    evt.stopPropagation();
    setEdges((edges) => edges.filter((e) => e.id !== id));
  };

  return (
    <>
      <BaseEdge path={edgePath} markerEnd={markerEnd} style={style} />
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            fontSize: 12,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <button
            className="w-5 h-5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-red-500 hover:text-red-700 hover:border-red-500 rounded-full flex items-center justify-center shadow-sm transition-all text-[10px]"
            onClick={onEdgeClick}
            title="Remover conexão"
          >
            <X size={10} strokeWidth={3} />
          </button>
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

// --- React Flow Custom Node Component ---
const CustomWorkflowNode = ({ data }: { data: any }) => {
    const { step, onDelete, onEdit } = data;
    
    const getIcon = () => {
        switch (step.type) {
            case 'text': return <MessageSquare size={16} className="text-blue-500" />;
            case 'audio': return <Mic size={16} className="text-purple-500" />;
            case 'image': return <ImageIcon size={16} className="text-pink-500" />;
            case 'video': return <Video size={16} className="text-orange-500" />;
            case 'document': return <File size={16} className="text-slate-500" />;
            case 'poll': return <ListChecks size={16} className="text-emerald-500" />;
            default: return <FileText size={16} />;
        }
    };

    const getLabel = () => {
        switch (step.type) {
            case 'text': return 'Mensagem de Texto';
            case 'audio': return 'Áudio (PTT)';
            case 'image': return 'Imagem';
            case 'video': return 'Vídeo';
            case 'document': return 'Documento';
            case 'poll': return 'Enquete';
            default: return 'Mensagem';
        }
    };

    return (
        <div className="w-64 bg-white dark:bg-slate-800 rounded-xl border-2 border-slate-200 dark:border-slate-700 shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all group relative overflow-hidden">
            {/* Handles */}
            <Handle type="target" position={Position.Top} className="w-3 h-3 !bg-slate-400 dark:!bg-slate-500" />
            
            {/* Header */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-md bg-white dark:bg-slate-700 shadow-sm border border-slate-100 dark:border-slate-600">
                        {getIcon()}
                    </span>
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">
                        {getLabel()}
                    </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => {e.stopPropagation(); onEdit(step)}} className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">
                        <Settings size={12} />
                    </button>
                    <button onClick={(e) => {e.stopPropagation(); onDelete(step.id)}} className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        <Trash2 size={12} />
                    </button>
                </div>
            </div>

            {/* Content Preview */}
            <div className="p-3 text-xs text-slate-500 dark:text-slate-400 h-16 overflow-hidden relative">
                {step.content || <em className="opacity-50">Sem conteúdo definido...</em>}
                <div className="absolute bottom-0 left-0 w-full h-6 bg-gradient-to-t from-white dark:from-slate-800 to-transparent"></div>
            </div>

            {/* Delay Indicator */}
            <div className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-700 flex items-center justify-center gap-1.5 text-[10px] font-mono text-slate-400">
                <Hourglass size={10} /> {(step.delay / 1000).toFixed(1)}s delay
            </div>

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-blue-500" />
        </div>
    );
};

// --- Start Node (Trigger) ---
const StartNode = () => {
    return (
        <div className="w-48 bg-green-600 rounded-full shadow-lg shadow-green-500/20 py-2 px-4 flex items-center justify-center gap-2 text-white font-bold text-sm relative">
            <Play size={16} fill="currentColor" /> Disparo Inicial
            <Handle type="source" position={Position.Bottom} className="w-3 h-3 !bg-green-600 border-2 border-white" />
        </div>
    );
}

// Define nodeTypes and edgeTypes
const nodeTypes = {
    customStep: CustomWorkflowNode,
    startNode: StartNode
};

const edgeTypes = {
    custom: CustomEdge,
};

interface CampaignsProps {
    currentUser?: UserType;
}

const Campaigns: React.FC<CampaignsProps> = ({ currentUser = { id: 'guest', role: 'agent' } as UserType }) => {
  const { t, showToast, theme } = useApp();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  
  // React Flow States
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);

  // Mobile Tab State
  const [mobileTab, setMobileTab] = useState<'settings' | 'workflow'>('settings');

  // Delete Modal States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<Campaign | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // View State
  const [activeTab, setActiveTab] = useState<'all' | 'processing' | 'scheduled' | 'completed'>('all');

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    date: new Date().toISOString().split('T')[0], 
    objective: 'prospecting' as CampaignObjective,
    contactsCount: 0,
    minDelay: 30,
    maxDelay: 120
  });

  // Contact Selection State
  const [availableContacts, setAvailableContacts] = useState<Contact[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [contactSearchTerm, setContactSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState<string>('all');
  const [loadingContacts, setLoadingContacts] = useState(false);

  // Workflow State
  const [isStepModalOpen, setIsStepModalOpen] = useState(false);
  const [selectedStepType, setSelectedStepType] = useState<WorkflowStepType | null>(null);
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

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

  useEffect(() => {
    if (isCreating) {
        loadContacts();
        // Initialize Flow with Start Node
        setNodes([
            {
                id: 'start',
                type: 'startNode',
                position: { x: 250, y: 50 },
                data: { label: 'Início' },
                draggable: false
            }
        ]);
        setEdges([]);
        setMobileTab('settings'); // Reset tab on new creation
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

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ 
        ...params, 
        type: 'custom', // Use our custom edge
        animated: true, 
        style: { stroke: '#3b82f6', strokeWidth: 2 } 
    }, eds)),
    [setEdges],
  );

  const handleDuplicate = (campaign: Campaign) => {
      setFormData({
          name: `${campaign.name} (Cópia)`,
          date: new Date().toISOString().split('T')[0],
          objective: campaign.objective,
          contactsCount: 0,
          minDelay: campaign.minDelay,
          maxDelay: campaign.maxDelay
      });
      
      const newNodes: Node[] = [
          { id: 'start', type: 'startNode', position: { x: 250, y: 50 }, data: { label: 'Início' }, draggable: false }
      ];
      const newEdges: Edge[] = [];
      let previousId = 'start';

      campaign.workflow.forEach((step, index) => {
          const nodeId = step.id;
          newNodes.push({
              id: nodeId,
              type: 'customStep',
              position: { x: 200, y: 150 + (index * 150) },
              data: { 
                  step, 
                  index: index + 1,
                  onDelete: removeNode,
                  onEdit: (s: WorkflowStep) => openEditModal(s, nodeId)
              }
          });
          newEdges.push({
              id: `e-${previousId}-${nodeId}`,
              source: previousId,
              target: nodeId,
              type: 'custom',
              animated: true,
              style: { stroke: '#3b82f6', strokeWidth: 2 }
          });
          previousId = nodeId;
      });

      setNodes(newNodes);
      setEdges(newEdges);
      setIsCreating(true);
      showToast('Campanha duplicada. Configure o público.', 'success');
  };

  const handleDeleteCampaign = (id: string) => {
      const campaign = campaigns.find(c => c.id === id);
      if (campaign) {
          setCampaignToDelete(campaign);
          setIsDeleteModalOpen(true);
      }
  };

  const confirmDelete = async () => {
      if (!campaignToDelete) return;
      setIsDeleting(true);
      try {
          await new Promise(resolve => setTimeout(resolve, 500));
          const newCampaigns = campaigns.filter(c => c.id !== campaignToDelete.id);
          setCampaigns(newCampaigns);
          showToast('Campanha excluída.', 'success');
          setIsDeleteModalOpen(false);
          setCampaignToDelete(null);
      } catch (e) {
          showToast('Erro ao excluir.', 'error');
      } finally {
          setIsDeleting(false);
      }
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

  const toggleContactSelection = (id: string) => {
      const newSet = new Set(selectedContactIds);
      if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
      setSelectedContactIds(newSet);
  };

  // --- NODE MANAGEMENT ---

  const openEditModal = (step: WorkflowStep, nodeId: string) => {
      setEditingNodeId(nodeId);
      setSelectedStepType(step.type);
      setStepContent(step.content);
      setStepFile(step.file || null);
      setStepMediaUrl(step.mediaUrl || '');
      setStepDelay(step.delay);
      
      if(step.type === 'poll' && step.pollConfig) {
          setPollOptions(step.pollConfig.values);
          setPollSelectableCount(step.pollConfig.selectableCount);
      }
      
      setIsStepModalOpen(true);
  };

  const removeNode = (id: string) => {
      setNodes((nds: Node[]) => nds.filter((node) => node.id !== id));
      setEdges((eds: Edge[]) => eds.filter((edge) => edge.source !== id && edge.target !== id));
  };

  const serializeWorkflow = (): WorkflowStep[] => {
      // Logic to traverse graph. For simplicity in this demo, we do a pseudo-sort by Y position
      // Real implementation should traverse edges from Start node.
      
      const sortedNodes = [...nodes]
        .filter(n => n.id !== 'start')
        .sort((a,b) => a.position.y - b.position.y);

      return sortedNodes.map(n => n.data.step as WorkflowStep);
  };

  const handleCreate = async () => {
    const finalContactCount = selectedContactIds.size;
    const workflow = serializeWorkflow();

    if (!formData.name || finalContactCount === 0 || workflow.length === 0) return;

    await campaignService.createCampaign({
        name: formData.name,
        scheduledDate: formData.date ? new Date(formData.date).toISOString() : new Date().toISOString(),
        objective: formData.objective,
        agentName: currentUser.name,
        ownerId: currentUser.id,
        totalContacts: finalContactCount,
        targetList: Array.from(selectedContactIds),
        workflow: workflow,
        minDelay: formData.minDelay,
        maxDelay: formData.maxDelay
    });

    setIsCreating(false);
    resetForm();
    loadCampaigns();
    showToast('Campanha iniciada com sucesso!', 'success');
  };

  const resetForm = () => {
    setFormData({ 
        name: '', 
        date: new Date().toISOString().split('T')[0], 
        objective: 'prospecting', 
        contactsCount: 0, 
        minDelay: 30, 
        maxDelay: 120 
    });
    setNodes([]);
    setEdges([]);
    resetStepForm();
    setSelectedContactIds(new Set());
    setContactSearchTerm('');
    setFilterTag('all');
  };

  const resetStepForm = () => {
    setSelectedStepType(null);
    setEditingNodeId(null);
    setStepContent('');
    setStepFile(null);
    setStepMediaUrl('');
    setStepDelay(1200);
    setMediaMode('upload');
    setPollOptions(['', '']);
    setPollSelectableCount(1);
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
      
      // Update Existing Node
      if (editingNodeId) {
          setNodes(nds => nds.map(node => {
              if (node.id === editingNodeId) {
                  const updatedStep = {
                      ...node.data.step as WorkflowStep,
                      content: stepContent,
                      file: stepFile || undefined,
                      mediaUrl: stepMediaUrl || undefined,
                      delay: stepDelay,
                      pollConfig: selectedStepType === 'poll' ? { selectableCount: pollSelectableCount, values: pollOptions } : undefined
                  };
                  return {
                      ...node,
                      data: {
                          ...node.data,
                          step: updatedStep
                      }
                  };
              }
              return node;
          }));
      } 
      // Create New Node
      else {
          const newNodeId = Math.random().toString(36).substr(2, 9);
          const newStep: WorkflowStep = {
              id: newNodeId,
              type: selectedStepType,
              content: stepContent, 
              file: stepFile || undefined,
              mediaUrl: stepMediaUrl || undefined,
              delay: stepDelay,
              order: nodes.length, // Rough order
              pollConfig: selectedStepType === 'poll' ? { selectableCount: pollSelectableCount, values: pollOptions } : undefined
          };

          const lastNode = [...nodes].sort((a,b) => b.position.y - a.position.y)[0];
          
          const newNode: Node = {
              id: newNodeId,
              type: 'customStep',
              position: { x: lastNode ? lastNode.position.x : 250, y: lastNode ? lastNode.position.y + 150 : 150 },
              data: { 
                  step: newStep, 
                  onDelete: removeNode,
                  onEdit: (s: WorkflowStep) => openEditModal(s, newNodeId)
              }
          };

          setNodes((nds) => nds.concat(newNode));
          
          if (lastNode) {
              setEdges((eds) => addEdge({
                  id: `e-${lastNode.id}-${newNodeId}`,
                  source: lastNode.id,
                  target: newNodeId,
                  type: 'custom',
                  animated: true,
                  style: { stroke: '#3b82f6', strokeWidth: 2 }
              }, eds));
          }
      }

      setIsStepModalOpen(false);
      resetStepForm();
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

  const insertVariable = (variable: string) => setStepContent(prev => prev + variable);

  const activeCampaignsCount = campaigns.filter(c => c.status === 'processing' || c.status === 'scheduled').length;
  const totalSent = campaigns.reduce((acc, c) => acc + (c.status === 'completed' ? c.totalContacts : 0), 0);
  const filteredCampaigns = campaigns.filter(c => activeTab === 'all' || c.status === activeTab);
  const filteredContacts = availableContacts.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(contactSearchTerm.toLowerCase()) || c.phone.includes(contactSearchTerm);
      const matchesTag = filterTag === 'all' || (c.tags && c.tags.includes(filterTag));
      return matchesSearch && matchesTag;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
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

      {/* List */}
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
                    return (
                    <div 
                        key={campaign.id} 
                        className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all group flex flex-col"
                    >
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
                            
                            <div className="flex items-center gap-1">
                                <button onClick={() => handleDuplicate(campaign)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><div className="rotate-90"><Code size={18} /></div></button>
                                <button onClick={() => handleDeleteCampaign(campaign.id)} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>

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
                        </div>

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
                                    <button onClick={() => campaignService.downloadCampaignReport(campaign)} className="w-full py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2">
                                        <Download size={14}/> Relatório Detalhado
                                    </button>
                                </div>
                            ) : campaign.status === 'processing' ? (
                                <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-blue-500 h-1.5 rounded-full w-[45%] animate-pulse"></div>
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

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Campanha" type="danger" footer={
            <>
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold">Cancelar</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-2">
                    {isDeleting && <Loader2 className="animate-spin" size={16}/>} Sim, Excluir
                </button>
            </>
        }>
        <p>Esta ação é irreversível.</p>
      </Modal>

      {/* --- Campaign Creation Modal (REACT FLOW INTEGRATION) --- */}
      {isCreating && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[90] p-0 overflow-hidden">
            <div className="bg-white dark:bg-slate-800 w-full h-full flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-300">
                
                {/* Mobile Tab Header - Visible only on mobile */}
                <div className="md:hidden flex border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 shrink-0">
                    <button 
                        onClick={() => setMobileTab('settings')}
                        className={`flex-1 py-3 text-sm font-bold ${mobileTab === 'settings' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Configurações
                    </button>
                    <button 
                        onClick={() => setMobileTab('workflow')}
                        className={`flex-1 py-3 text-sm font-bold ${mobileTab === 'workflow' ? 'text-blue-600 border-b-2 border-blue-600 dark:text-blue-400 dark:border-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
                    >
                        Fluxo ({nodes.length})
                    </button>
                </div>

                {/* Left Panel: Settings */}
                <div className={`w-full md:w-[350px] bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col h-full shrink-0 z-20 shadow-xl overflow-y-auto ${mobileTab === 'settings' ? 'flex' : 'hidden md:flex'}`}>
                    <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 sticky top-0 z-10">
                        <div className="flex items-center gap-3 mb-1">
                            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                                <Settings size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">{t('settings')}</h3>
                        </div>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Defina o público e os parâmetros.</p>
                    </div>

                    <div className="p-6 space-y-8">
                        {/* 1. Basic Info */}
                        <section className="space-y-4">
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Nome da Campanha</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white"
                                        placeholder="Ex: Oferta Black Friday"
                                        value={formData.name}
                                        onChange={e => setFormData({...formData, name: e.target.value})}
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Objetivo</label>
                                    <select 
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white cursor-pointer"
                                        value={formData.objective}
                                        onChange={e => setFormData({...formData, objective: e.target.value as CampaignObjective})}
                                    >
                                        <option value="prospecting">Prospecção</option>
                                        <option value="communication">Comunicado</option>
                                        <option value="promotion">Promoção</option>
                                        <option value="sales">Vendas</option>
                                        <option value="maintenance">Manutenção</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Agendamento</label>
                                    <input 
                                        type="date"
                                        className="w-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 dark:text-white"
                                        value={formData.date}
                                        onChange={e => setFormData({...formData, date: e.target.value})}
                                    />
                                </div>
                            </div>
                        </section>

                        {/* Cadence Section */}
                        <section className="space-y-2 pt-4 border-t border-slate-200 dark:border-slate-700">
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cadência e Segurança</label>
                            
                            <div className="bg-white dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className={`p-1.5 rounded-lg ${getSafetyInfo(formData.minDelay).color.replace('text-', 'bg-').replace('600', '100').replace('400', '900/30')} ${getSafetyInfo(formData.minDelay).color}`}>
                                        {React.createElement(getSafetyInfo(formData.minDelay).icon, { size: 16 })}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-700 dark:text-white">Nível de Risco: {getSafetyInfo(formData.minDelay).label}</p>
                                        <p className="text-[10px] text-slate-400">Intervalos curtos aumentam risco de bloqueio.</p>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Mínimo (seg)</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none text-center font-mono dark:text-white"
                                            value={formData.minDelay}
                                            onChange={e => setFormData({...formData, minDelay: Number(e.target.value)})}
                                        />
                                    </div>
                                    <div>
                                        <label className="text-[10px] text-slate-500 mb-1 block">Máximo (seg)</label>
                                        <input 
                                            type="number" 
                                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded px-2 py-1 text-sm outline-none text-center font-mono dark:text-white"
                                            value={formData.maxDelay}
                                            onChange={e => setFormData({...formData, maxDelay: Number(e.target.value)})}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* 2. Audience */}
                        <section className="space-y-2">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Público Alvo</label>
                                <span className="text-[10px] font-bold bg-slate-200 dark:bg-slate-700 px-2 py-0.5 rounded text-slate-600 dark:text-slate-300">{formData.contactsCount} selecionados</span>
                            </div>
                            
                            <div className="h-60 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 overflow-hidden flex flex-col">
                                <div className="p-2 border-b border-slate-100 dark:border-slate-700 flex gap-2">
                                    <input type="text" placeholder="Buscar..." className="w-full bg-slate-50 dark:bg-slate-900 border-none rounded px-2 py-1 text-xs outline-none dark:text-white" value={contactSearchTerm} onChange={e => setContactSearchTerm(e.target.value)} />
                                    <button onClick={() => toggleSelectAll(filteredContacts)} className="text-[10px] font-bold text-blue-600 whitespace-nowrap">Todos</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-1 space-y-0.5 custom-scrollbar">
                                    {filteredContacts.map(contact => (
                                        <label key={contact.id} className={`flex items-center gap-2 p-2 rounded cursor-pointer ${selectedContactIds.has(contact.id) ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'}`}>
                                            <input type="checkbox" checked={selectedContactIds.has(contact.id)} onChange={() => toggleContactSelection(contact.id)} className="rounded text-blue-600" />
                                            <div className="flex-1 overflow-hidden">
                                                <div className="text-xs font-bold truncate dark:text-white">{contact.name}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{contact.phone}</div>
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right Panel: React Flow Canvas */}
                <div className={`flex-1 bg-slate-100 dark:bg-slate-900 flex flex-col h-full min-w-0 relative ${mobileTab === 'workflow' ? 'flex' : 'hidden md:flex'}`}>
                    
                    {/* Header Overlay */}
                    <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-start pointer-events-none">
                        <div className="bg-white/90 dark:bg-slate-800/90 backdrop-blur-md p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 pointer-events-auto">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                <Target size={18} className="text-indigo-600"/>
                                {t('workflow_builder')}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Arraste e conecte os blocos. Delete conexões clicando no X.</p>
                        </div>
                        <div className="flex gap-2 pointer-events-auto">
                            <button onClick={() => setIsCreating(false)} className="p-3 bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-full shadow-lg hover:shadow-xl transition-all">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    {/* Canvas Area */}
                    <div className="flex-1 w-full h-full">
                        <ReactFlow
                            nodes={nodes}
                            edges={edges}
                            onNodesChange={onNodesChange}
                            onEdgesChange={onEdgesChange}
                            onConnect={onConnect}
                            nodeTypes={nodeTypes}
                            edgeTypes={edgeTypes}
                            defaultEdgeOptions={{ type: 'custom' }}
                            deleteKeyCode={['Backspace', 'Delete']}
                            fitView
                            className="bg-slate-50 dark:bg-slate-900"
                        >
                            <Background color={theme === 'dark' ? '#334155' : '#cbd5e1'} gap={20} size={1} />
                            <Controls className="bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-lg text-slate-600 dark:text-slate-200" />
                            <MiniMap className="dark:bg-slate-800 border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden shadow-lg" nodeColor={theme === 'dark' ? '#475569' : '#e2e8f0'} maskColor={theme === 'dark' ? 'rgba(15, 23, 42, 0.7)' : 'rgba(241, 245, 249, 0.7)'} />
                        </ReactFlow>
                    </div>

                    {/* Footer Actions Overlay */}
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex gap-4 pointer-events-auto w-full justify-center px-4">
                        <button 
                            onClick={() => setIsStepModalOpen(true)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 md:px-6 py-3 rounded-full font-bold shadow-lg shadow-indigo-600/30 flex items-center gap-2 hover:scale-105 transition-transform text-sm md:text-base whitespace-nowrap"
                        >
                            <Plus size={20} /> <span className="hidden md:inline">Adicionar Passo</span><span className="md:hidden">Add</span>
                        </button>
                        <button 
                            onClick={handleCreate}
                            disabled={!formData.name || formData.contactsCount === 0 || nodes.length <= 1}
                            className="bg-green-600 hover:bg-green-700 text-white px-4 md:px-8 py-3 rounded-full font-bold shadow-lg shadow-green-600/30 flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed text-sm md:text-base whitespace-nowrap"
                        >
                            <Send size={20} /> <span className="hidden md:inline">Iniciar Disparo</span><span className="md:hidden">Enviar</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* Step Modal */}
      {isStepModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in transition-colors">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
                {/* ... (Existing Modal Content) ... */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
                    <h4 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        {selectedStepType ? (
                            <>
                                <button onClick={() => resetStepForm()} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors flex items-center gap-1 text-sm font-medium">
                                    <ArrowLeft size={16}/> Voltar
                                </button>
                                <span className="text-slate-300">/</span>
                                <span className="uppercase text-indigo-600 dark:text-indigo-400 flex items-center gap-2">
                                    {t(`step_${selectedStepType}` as any)}
                                </span>
                            </>
                        ) : (
                            'Adicionar Novo Passo'
                        )}
                    </h4>
                    <button onClick={() => {setIsStepModalOpen(false); resetStepForm();}} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-all">
                        <X size={20}/>
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
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
                            {/* Delay Setting */}
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
                                        <div className="flex items-center gap-1 p-2 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/50 overflow-x-auto no-scrollbar">
                                            <button onClick={() => insertVariable('*')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 shrink-0" title="Negrito"><Bold size={16}/></button>
                                            <button onClick={() => insertVariable('_')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 shrink-0" title="Itálico"><Italic size={16}/></button>
                                            <button onClick={() => insertVariable('~')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 shrink-0" title="Riscado"><Strikethrough size={16}/></button>
                                            <button onClick={() => insertVariable(' ``` ')} className="p-1.5 hover:bg-slate-200 dark:hover:bg-slate-600 rounded text-slate-600 dark:text-slate-300 shrink-0" title="Monoespaçado"><Code size={16}/></button>
                                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-2 shrink-0"></div>
                                            <button onClick={() => insertVariable('{nome}')} className="px-2 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 transition-colors shrink-0">{`{nome}`}</button>
                                            <button onClick={() => insertVariable('{telefone}')} className="px-2 py-1 text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 rounded hover:bg-indigo-200 transition-colors shrink-0">{`{telefone}`}</button>
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
                                    <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg w-fit">
                                        <button onClick={() => setMediaMode('upload')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mediaMode === 'upload' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            <Upload size={14}/> Upload
                                        </button>
                                        <button onClick={() => setMediaMode('url')} className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${mediaMode === 'url' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                                            <LinkIcon size={14}/> Link
                                        </button>
                                    </div>

                                    {stepFile || stepMediaUrl ? (
                                        <div className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800">
                                            <div className="p-4 flex items-center justify-center min-h-[160px]">
                                                {/* Reusing existing simplified preview for editor */}
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="text-green-500" size={32} />
                                                    <span className="text-sm font-bold text-slate-700 dark:text-slate-200">
                                                        {stepFile ? stepFile.name : 'Mídia via Link'}
                                                    </span>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={() => { setStepFile(null); setStepMediaUrl(''); }}
                                                className="absolute top-2 right-2 p-2 bg-white/90 dark:bg-slate-800/90 text-red-500 rounded-full shadow-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                            >
                                                <Trash2 size={16}/>
                                            </button>
                                        </div>
                                    ) : (
                                        mediaMode === 'upload' ? (
                                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 relative transition-colors cursor-pointer group">
                                                <input type="file" accept={selectedStepType === 'image' ? "image/*" : selectedStepType === 'audio' ? "audio/*" : selectedStepType === 'video' ? "video/*" : ".pdf,.doc,.docx,.xls,.xlsx,.txt"} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={(e) => { if (e.target.files?.[0]) setStepFile(e.target.files[0]); }} />
                                                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                                                    {selectedStepType === 'audio' ? <Mic size={28} className="text-purple-500"/> : <Upload size={28} className="text-blue-500"/>}
                                                </div>
                                                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Clique para carregar arquivo</p>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-2 border border-slate-300 dark:border-slate-600 rounded-xl px-4 py-3 bg-white dark:bg-slate-800 focus-within:ring-2 focus-within:ring-indigo-500">
                                                <LinkIcon size={18} className="text-slate-400" />
                                                <input type="url" className="w-full bg-transparent outline-none text-slate-700 dark:text-white text-sm" placeholder="https://exemplo.com/arquivo" value={stepMediaUrl} onChange={e => setStepMediaUrl(e.target.value)} />
                                            </div>
                                        )
                                    )}

                                    {selectedStepType !== 'audio' && (
                                        <div>
                                            <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 block">Legenda (Opcional)</label>
                                            <input type="text" className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Digite uma legenda..." value={stepContent} onChange={e => setStepContent(e.target.value)} />
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* --- POLL EDITOR --- */}
                            {selectedStepType === 'poll' && (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-1 block">Pergunta</label>
                                        <input type="text" className="w-full px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" placeholder="Ex: Qual o melhor horário?" value={stepContent} onChange={e => setStepContent(e.target.value)} />
                                    </div>
                                    <div>
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 block">Opções</label>
                                        <div className="space-y-2">
                                            {pollOptions.map((opt, idx) => (
                                                <input key={idx} type="text" className="w-full px-3 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm" placeholder={`Opção ${idx + 1}`} value={opt} onChange={e => { const newOpts = [...pollOptions]; newOpts[idx] = e.target.value; setPollOptions(newOpts); }} />
                                            ))}
                                            <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-xs text-blue-600 font-bold hover:underline">+ Adicionar Opção</button>
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
                        <button onClick={handleConfirmStep} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-transform hover:-translate-y-0.5">
                            {editingNodeId ? 'Salvar Alterações' : 'Adicionar ao Fluxo'}
                        </button>
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default Campaigns;
