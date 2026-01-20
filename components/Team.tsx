
import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, AlertCircle, Edit2, Eye, EyeOff, X, Key, User, Crown, ArrowRight, RefreshCw } from 'lucide-react';
import { AgentPlan, AgentPermissions, LicenseStatus, ViewState } from '../types';
import * as teamService from '../services/teamService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface TeamProps {
    onNavigate?: (view: ViewState) => void;
}

const Team: React.FC<TeamProps> = ({ onNavigate }) => {
  const { showToast } = useApp();
  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
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
      permissions: { canCreate: true, canEdit: true, canDelete: false } as AgentPermissions
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
    setAgents(agentData);
    setLicenseStatus(licStatus);
    setLoading(false);
  };

  const openCreateModal = () => {
      // Check limits before opening form
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
          permissions: { canCreate: true, canEdit: true, canDelete: false }
      });
  };

  const openEditModal = (agent: AgentPlan) => {
      setSelectedAgent(agent);
      setModalMode('edit');
      setShowPassword(false);
      setFormData({
          name: agent.name,
          email: agent.email,
          password: '', // Don't show existing password
          permissions: { ...agent.permissions }
      });
  };

  const openViewModal = (agent: AgentPlan) => {
      setSelectedAgent(agent);
      setModalMode('view');
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
      setShowPassword(true); // Show the password so user can see/copy it
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
          // Optionally auto-open create modal
          // setModalMode('create'); 
      } catch (error) {
          showToast('Erro ao contratar seat.', 'error');
      } finally {
          setIsProcessingUpgrade(false);
      }
  };

  const filteredAgents = agents.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão da Equipe</h2>
            <p className="text-slate-500 dark:text-slate-400">Gerencie usuários, permissões e acesso.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
            {licenseStatus && (
                <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    <Users size={16} className="text-slate-500 dark:text-slate-400" />
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {licenseStatus.usage.usedSeats} / {licenseStatus.totalSeats} Seats
                    </span>
                    {licenseStatus.usage.usedSeats >= licenseStatus.totalSeats && (
                        <span className="text-xs bg-amber-100 text-amber-600 px-1.5 rounded font-bold">Cheio</span>
                    )}
                </div>
            )}
            <button 
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 whitespace-nowrap"
            >
                <Plus size={18} /> Novo Usuário
            </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-700/30">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nome ou email..." 
                        className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex gap-2">
                    <button onClick={loadData} className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200" title="Atualizar">
                        <RefreshCw size={18} />
                    </button>
                </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                  <thead className="bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                      <tr>
                          <th className="px-6 py-4">Usuário</th>
                          <th className="px-6 py-4">Permissões</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4">Mensagens Enviadas</th>
                          <th className="px-6 py-4 text-right">Ações</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-700">
                      {loading ? (
                          <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
                      ) : filteredAgents.length === 0 ? (
                          <tr><td colSpan={5} className="p-8 text-center text-slate-500">Nenhum usuário encontrado.</td></tr>
                      ) : filteredAgents.map(agent => (
                          <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-3">
                                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center font-bold text-slate-600 dark:text-slate-300">
                                          {agent.name.charAt(0)}
                                      </div>
                                      <div>
                                          <div className="font-bold text-slate-800 dark:text-white">{agent.name}</div>
                                          <div className="text-xs text-slate-500 dark:text-slate-400">{agent.email}</div>
                                      </div>
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex gap-1 flex-wrap">
                                      {agent.permissions.canCreate && <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded text-xs border border-blue-100 dark:border-blue-800">Criar</span>}
                                      {agent.permissions.canEdit && <span className="px-2 py-0.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-300 rounded text-xs border border-indigo-100 dark:border-indigo-800">Editar</span>}
                                      {agent.permissions.canDelete && <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 rounded text-xs border border-red-100 dark:border-red-800">Excluir</span>}
                                  </div>
                              </td>
                              <td className="px-6 py-4">
                                  <span className={`px-2 py-1 rounded-full text-xs font-bold uppercase ${
                                      agent.status === 'active' 
                                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' 
                                      : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                                  }`}>
                                      {agent.status === 'active' ? 'Ativo' : agent.status}
                                  </span>
                              </td>
                              <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-300">
                                  {agent.messagesUsed.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                      <button onClick={() => openEditModal(agent)} className="p-2 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
                                          <Edit2 size={16} />
                                      </button>
                                      <button onClick={() => setAgentToDelete(agent)} className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded hover:bg-slate-100 dark:hover:bg-slate-700">
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
        title={modalMode === 'create' ? 'Novo Usuário' : 'Editar Usuário'}
      >
          <div className="space-y-4">
              <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Nome Completo</label>
                  <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="text"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                  </div>
              </div>

              <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Email Corporativo</label>
                  <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                      <input 
                        type="email"
                        className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                  </div>
              </div>

              <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                        {modalMode === 'edit' ? 'Redefinir Senha (Opcional)' : 'Senha de Acesso'}
                    </label>
                    <button onClick={generateRandomPassword} type="button" className="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
                        <Key size={12}/> Gerar Senha Segura
                    </button>
                  </div>
                  <div className="relative">
                      <input 
                        type={showPassword ? "text" : "password"}
                        className="w-full pl-4 pr-10 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-mono"
                        value={formData.password}
                        onChange={e => setFormData({...formData, password: e.target.value})}
                        placeholder={modalMode === 'edit' ? "Deixe em branco para manter a atual" : "••••••••"}
                      />
                      <button 
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                      >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                  </div>
              </div>

              <div className="pt-2">
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2 block">Permissões de Acesso</label>
                  <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-700/30">
                      <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.permissions.canCreate} onChange={() => togglePermission('canCreate')} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Pode criar novos contatos e instâncias</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.permissions.canEdit} onChange={() => togglePermission('canEdit')} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Pode editar informações existentes</span>
                      </label>
                      <label className="flex items-center gap-3 cursor-pointer">
                          <input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={formData.permissions.canDelete} onChange={() => togglePermission('canDelete')} />
                          <span className="text-sm text-slate-700 dark:text-slate-300">Pode excluir registros (Cuidado)</span>
                      </label>
                  </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                  <button onClick={closeModal} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2 hover:bg-blue-700 disabled:opacity-70">
                      {isSubmitting && <Loader2 className="animate-spin" size={16} />} Salvar
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
              <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Crown size={32} />
              </div>
              <h4 className="text-lg font-bold text-slate-800 dark:text-white mb-2">Expanda sua Equipe</h4>
              <p className="text-slate-600 dark:text-slate-300 mb-6">
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
                  <button onClick={() => setIsUpgradeModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                  <button onClick={handleQuickAddSeat} disabled={isProcessingUpgrade} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-600/20">
                      {isProcessingUpgrade ? <Loader2 className="animate-spin" size={18} /> : <ArrowRight size={18} />}
                      Contratar Agora
                  </button>
              </div>
          </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={!!agentToDelete}
        onClose={() => setAgentToDelete(null)}
        title="Remover Usuário?"
        type="danger"
        footer={
            <>
                <button onClick={() => setAgentToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Cancelar</button>
                <button onClick={confirmDeleteAgent} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Remover</button>
            </>
        }
      >
          <p>Tem certeza que deseja remover <strong>{agentToDelete?.name}</strong>? O acesso será revogado imediatamente e a instância vinculada (se houver) será desconectada.</p>
      </Modal>

    </div>
  );
};

export default Team;
