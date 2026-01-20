
import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, 
    Edit2, Eye, EyeOff, Key, User, Crown, ArrowRight, RefreshCw, Tag,
    Briefcase, Headset, Star, Activity, ToggleLeft, ToggleRight, MoreVertical, Lock, AlertCircle
} from 'lucide-react';
import { AgentPlan, AgentPermissions, LicenseStatus, ViewState } from '../types';
import * as teamService from '../services/teamService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface TeamProps {
    onNavigate?: (view: ViewState) => void;
}

// Mock departments for UI demonstration
const DEPARTMENTS = ['Todos', 'Vendas', 'Suporte', 'Financeiro'];

const Team: React.FC<TeamProps> = ({ onNavigate }) => {
  const { showToast } = useApp();
  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDept, setSelectedDept] = useState('Todos');
  
  // Modal States
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentPlan | null>(null);
  
  // Upgrade Modal
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isProcessingUpgrade, setIsProcessingUpgrade] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      department: 'Suporte',
      permissions: { 
          canCreate: true, canEdit: true, canDelete: false,
          canCreateTags: true, canEditTags: true, canDeleteTags: false
      } as AgentPermissions
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [agentToDelete, setAgentToDelete] = useState<AgentPlan | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [agentData, licStatus] = await Promise.all([
        teamService.getAgents(),
        financialService.getLicenseStatus()
    ]);
    // Enrich mock data with random stats for visualization
    const enrichedAgents = agentData.map(a => ({
        ...a,
        department: a.id === 'agent-1' ? 'Suporte' : 'Vendas',
        csat: (Math.random() * (5.0 - 3.5) + 3.5).toFixed(1),
        isOnline: Math.random() > 0.3
    }));
    setAgents(enrichedAgents);
    setLicenseStatus(licStatus);
    setLoading(false);
  };

  const openCreateModal = () => {
      if (licenseStatus && licenseStatus.usage.usedSeats >= licenseStatus.totalSeats) {
          setIsUpgradeModalOpen(true);
          return;
      }

      setModalMode('create');
      setShowPassword(false);
      setFormData({
          name: '',
          email: '',
          password: '',
          department: 'Suporte',
          permissions: { 
              canCreate: true, canEdit: true, canDelete: false,
              canCreateTags: true, canEditTags: true, canDeleteTags: false
          }
      });
  };

  const openEditModal = (agent: AgentPlan) => {
      setSelectedAgent(agent);
      setModalMode('edit');
      setShowPassword(false);
      setFormData({
          name: agent.name,
          email: agent.email,
          password: '',
          department: (agent as any).department || 'Suporte',
          permissions: { ...agent.permissions }
      });
  };

  const closeModal = () => {
      setModalMode(null);
      setSelectedAgent(null);
      setShowPassword(false);
  };

  const generateRandomPassword = () => {
      const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%&";
      let retVal = "";
      for (let i = 0, n = charset.length; i < 12; ++i) {
          retVal += charset.charAt(Math.floor(Math.random() * n));
      }
      setFormData(prev => ({ ...prev, password: retVal }));
      setShowPassword(true);
  };

  const handleSubmit = async () => {
      if (!formData.name || !formData.email) {
          showToast('Preencha nome e email.', 'error');
          return;
      }
      if (modalMode === 'create' && !formData.password) {
          showToast('Senha é obrigatória para novos usuários.', 'error');
          return;
      }

      setIsSubmitting(true);
      try {
          if (modalMode === 'create') {
                if (licenseStatus && licenseStatus.usage.usedSeats >= licenseStatus.totalSeats) {
                    setIsUpgradeModalOpen(true);
                    setIsSubmitting(false);
                    return;
                }
                await teamService.addAgent({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                    permissions: formData.permissions
                });
                showToast('Atendente criado com sucesso!', 'success');
          } else if (modalMode === 'edit' && selectedAgent) {
                const updates: any = {
                    name: formData.name,
                    email: formData.email,
                    permissions: formData.permissions
                };
                if (formData.password) updates.tempPassword = formData.password;
                
                await teamService.updateAgent(selectedAgent.id, updates);
                showToast('Atendente atualizado com sucesso!', 'success');
          }
          closeModal();
          loadData();
      } catch (e: any) {
          showToast(e.message || 'Erro ao salvar atendente', 'error');
      } finally {
          setIsSubmitting(false);
      }
  };

  const confirmDeleteAgent = async () => {
      if (!agentToDelete) return;
      try {
          await teamService.removeAgent(agentToDelete.id);
          showToast('Atendente removido com sucesso.', 'success');
          loadData();
      } catch (error) {
          showToast('Erro ao remover atendente.', 'error');
      } finally {
          setAgentToDelete(null);
      }
  };

  const togglePermission = (key: keyof AgentPermissions) => {
      setFormData(prev => ({
          ...prev,
          permissions: { ...prev.permissions, [key]: !prev.permissions[key] }
      }));
  };

  const handleQuickAddSeat = async () => {
      setIsProcessingUpgrade(true);
      try {
          await financialService.requestAddonSeat(1);
          await loadData();
          setIsUpgradeModalOpen(false);
          showToast('Seat adicional contratado com sucesso!', 'success');
      } catch (error) {
          showToast('Erro ao contratar seat.', 'error');
      } finally {
          setIsProcessingUpgrade(false);
      }
  };

  const filteredAgents = agents.filter(a => {
      const matchesSearch = a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            a.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDept = selectedDept === 'Todos' || (a as any).department === selectedDept;
      return matchesSearch && matchesDept;
  });

  const onlineAgentsCount = (agents as any[]).filter(a => a.isOnline).length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                Gestão da Equipe
            </h2>
            <p className="text-slate-500 dark:text-slate-400">Administre o acesso, funções e desempenho dos seus colaboradores.</p>
        </div>
        <button 
            onClick={openCreateModal}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 font-bold"
        >
            <Plus size={18} /> Novo Usuário
        </button>
      </div>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                  <User size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Total de Agentes</p>
                  <div className="flex items-end gap-2">
                      <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{agents.length}</h3>
                      {licenseStatus && (
                          <span className="text-xs text-slate-400 mb-1">
                              / {licenseStatus.totalSeats} seats
                          </span>
                      )}
                  </div>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-lg">
                  <Activity size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Online Agora</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                      {onlineAgentsCount} <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                  </h3>
              </div>
          </div>
          <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
              <div className="p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-lg">
                  <Star size={24} />
              </div>
              <div>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">CSAT da Equipe</p>
                  <h3 className="text-2xl font-bold text-slate-800 dark:text-white">4.8 <span className="text-sm font-normal text-slate-400">/ 5.0</span></h3>
              </div>
          </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors flex flex-col">
          
          {/* Toolbar */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-50/50 dark:bg-slate-800">
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto">
                    {DEPARTMENTS.map(dept => (
                        <button
                            key={dept}
                            onClick={() => setSelectedDept(dept)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                                selectedDept === dept 
                                ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900' 
                                : 'text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700'
                            }`}
                        >
                            {dept}
                        </button>
                    ))}
                </div>

                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar agente..." 
                        className="w-full pl-10 pr-4 py-2 text-sm bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                      <tr>
                          <th className="px-6 py-4">Agente</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Função & Acesso</th>
                          <th className="px-6 py-4">Performance</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {loading ? (
                          <tr><td colSpan={5} className="p-12 text-center"><Loader2 className="animate-spin mx-auto text-blue-600 mb-2" size={24}/><span className="text-slate-400">Carregando equipe...</span></td></tr>
                      ) : filteredAgents.length === 0 ? (
                          <tr><td colSpan={5} className="p-12 text-center text-slate-500">Nenhum usuário encontrado neste filtro.</td></tr>
                      ) : filteredAgents.map((agent: any) => (
                          <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="relative">
                                          <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center font-bold text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                                              {agent.name.charAt(0)}
                                          </div>
                                          <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-800 ${agent.isOnline ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                              {agent.name}
                                              {agent.department && <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-700 text-[10px] text-slate-500 uppercase font-bold">{agent.department}</span>}
                                          </div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400">{agent.email}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <button className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                                      agent.status === 'active' 
                                      ? 'bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900/30 hover:bg-green-100' 
                                      : 'bg-slate-100 text-slate-500 border border-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:border-slate-600'
                                  }`}>
                                      {agent.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                      {agent.status === 'active' ? 'Ativo' : 'Suspenso'}
                                  </button>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-col gap-1">
                                      <div className="flex items-center gap-1.5 text-xs font-medium text-slate-700 dark:text-slate-300">
                                          <Shield size={12} className="text-blue-500"/>
                                          {agent.permissions.canDelete ? 'Super Admin' : 'Agente Padrão'}
                                      </div>
                                      <div className="flex gap-1">
                                          {agent.permissions.canCreate && <div title="Pode Criar" className="w-1.5 h-1.5 rounded-full bg-blue-400"></div>}
                                          {agent.permissions.canEdit && <div title="Pode Editar" className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>}
                                          {agent.permissions.canDelete && <div title="Pode Excluir" className="w-1.5 h-1.5 rounded-full bg-red-400"></div>}
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="space-y-1">
                                      <div className="flex items-center gap-1 text-xs font-bold text-slate-700 dark:text-slate-300">
                                          <Star size={12} className="text-amber-500 fill-amber-500" /> {agent.csat}
                                      </div>
                                      <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                                          <div className="bg-green-500 h-full rounded-full" style={{width: `${(agent.csat / 5) * 100}%`}}></div>
                                      </div>
                                      <span className="text-[10px] text-slate-400">{agent.messagesUsed.toLocaleString()} msgs</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <button onClick={() => openEditModal(agent)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors" title="Editar Permissões">
                                          <Edit2 size={16} />
                                      </button>
                                      <button onClick={() => setAgentToDelete(agent)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors" title="Remover Acesso">
                                          <Trash2 size={16} />
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={!!modalMode}
        onClose={closeModal}
        title={modalMode === 'create' ? 'Adicionar Novo Membro' : 'Editar Membro'}
      >
          <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Nome Completo</label>
                      <input 
                        type="text"
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        placeholder="Ex: Ana Souza"
                      />
                  </div>
                  <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">Departamento</label>
                      <select 
                        className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm appearance-none bg-white"
                        value={formData.department}
                        onChange={e => setFormData({...formData, department: e.target.value})}
                      >
                          {DEPARTMENTS.filter(d => d !== 'Todos').map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                  </div>
              </div>

              <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase">Email Corporativo</label>
                  <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                      <input 
                        type="email"
                        className="w-full pl-9 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        placeholder="nome@empresa.com"
                      />
                  </div>
              </div>

              <div className="space-y-1.5">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 uppercase">
                        {modalMode === 'edit' ? 'Redefinir Senha' : 'Senha de Acesso'}
                    </label>
                    <button onClick={generateRandomPassword} type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium">
                        <Key size={12}/> Gerar Automática
                    </button>
                  </div>
                  <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono text-sm"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder={modalMode === 'edit' ? "Manter senha atual" : "••••••••"}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                  </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
                  <label className="text-sm font-bold text-slate-800 dark:text-white mb-3 block flex items-center gap-2">
                      <Shield size={16} className="text-indigo-500"/> Nível de Permissão
                  </label>
                  
                  <div className="grid grid-cols-1 gap-3">
                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          formData.permissions.canDelete 
                          ? 'bg-indigo-50 border-indigo-200 dark:bg-indigo-900/20 dark:border-indigo-800' 
                          : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}>
                          <input 
                            type="checkbox" 
                            className="mt-1 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                            checked={formData.permissions.canDelete} 
                            onChange={() => togglePermission('canDelete')} 
                          />
                          <div>
                              <span className="block text-sm font-bold text-slate-800 dark:text-white">Admin (Gestor)</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Acesso total para excluir contatos, gerenciar pagamentos e configurações.</span>
                          </div>
                      </label>

                      <label className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          !formData.permissions.canDelete 
                          ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800' 
                          : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                      }`}>
                          <input 
                            type="checkbox" 
                            className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
                            checked={!formData.permissions.canDelete} 
                            onChange={() => togglePermission('canDelete')} 
                          />
                          <div>
                              <span className="block text-sm font-bold text-slate-800 dark:text-white">Agente Padrão</span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">Pode atender chats, criar contatos e campanhas, mas sem acesso a configurações críticas.</span>
                          </div>
                      </label>
                  </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                  <button onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-70 flex items-center gap-2 text-sm shadow-md shadow-blue-600/20">
                      {isSubmitting && <Loader2 className="animate-spin" size={16} />} 
                      {modalMode === 'create' ? 'Criar Acesso' : 'Salvar Alterações'}
                  </button>
              </div>
          </div>
      </Modal>

      {/* UPGRADE MODAL */}
      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Limite de Seats Atingido"
        type="info"
      >
          <div className="text-center p-4">
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Crown size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Expanda sua Equipe</h4>
              <p className="text-slate-600 dark:text-slate-300 mb-6 text-sm">
                  Sua licença Enterprise atual atingiu o limite de {licenseStatus?.totalSeats} usuários.
                  Adicione um Seat adicional agora para continuar crescendo.
              </p>
              
              <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 mb-6 text-left">
                  <div className="flex justify-between items-center mb-1">
                      <span className="font-bold text-slate-800 dark:text-white">Seat Adicional (Usuário + Instância)</span>
                      <span className="font-bold text-blue-600 dark:text-blue-400">R$ 150,00</span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">Mensal - Cobrado na próxima fatura</p>
              </div>

              <div className="flex gap-3 justify-center">
                  <button onClick={() => setIsUpgradeModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-sm font-medium">Cancelar</button>
                  <button onClick={handleQuickAddSeat} disabled={isProcessingUpgrade} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20 text-sm">
                      {isProcessingUpgrade ? <Loader2 className="animate-spin" size={16} /> : <ArrowRight size={16} />}
                      Contratar Agora
                  </button>
              </div>
          </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        title="Remover Acesso?"
        type="danger"
        footer={
            <>
                <button onClick={() => setAgentToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium">Cancelar</button>
                <button onClick={confirmDeleteAgent} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-bold flex items-center gap-2">
                    <Trash2 size={16}/> Remover Definitivamente
                </button>
            </>
        }
      >
          <div className="space-y-3">
            <p className="text-sm">Tem certeza que deseja remover <strong>{agentToDelete?.name}</strong>?</p>
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 rounded-lg flex gap-3 items-start">
                <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={16} />
                <ul className="text-xs text-red-800 dark:text-red-300 list-disc pl-4 space-y-1">
                    <li>O acesso ao painel será revogado imediatamente.</li>
                    <li>A instância de WhatsApp vinculada será desconectada.</li>
                    <li>Os chats ativos serão transferidos para o Admin.</li>
                </ul>
            </div>
          </div>
      </Modal>

    </div>
  );
};

export default Team;
