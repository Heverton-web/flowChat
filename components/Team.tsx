
import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, AlertCircle, Edit2, Eye, X, Key, User } from 'lucide-react';
import { AgentPlan, AgentPermissions, LicenseStatus } from '../types';
import * as teamService from '../services/teamService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

const Team: React.FC = () => {
  const { showToast } = useApp();
  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentPlan | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      permissions: { canCreate: true, canEdit: true, canDelete: false } as AgentPermissions
  });
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
      setModalMode('create');
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
                    throw new Error(`Limite de Seats atingido (${licenseStatus.totalSeats}).`);
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

  const filteredAgents = agents.filter(a => 
      a.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      a.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão da Equipe</h2>
            <p className="text-slate-500 dark:text-slate-400">Gerencie usuários, permissões e acesso.</p>
        </div>
        <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md transition-colors">
            <Plus size={18} /> Novo Atendente
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-sm">
          {/* Search Bar inside panel could go here */}
          <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-700/30 flex items-center gap-2">
                <Search size={16} className="text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Buscar atendente..." 
                    className="bg-transparent outline-none text-sm w-full dark:text-white"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
          </div>

          {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32} /></div>
          ) : filteredAgents.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Nenhum atendente encontrado.</div>
          ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredAgents.map(agent => (
                      <div key={agent.id} className="p-6 flex flex-col md:flex-row justify-between items-center gap-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                          <div className="flex items-center gap-4 w-full md:w-auto">
                              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                                  {agent.name.charAt(0)}
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800 dark:text-white">{agent.name}</h3>
                                  <span className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1">
                                      <Mail size={12}/> {agent.email}
                                  </span>
                              </div>
                          </div>
                          
                          <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                              <div className="hidden md:flex gap-2 mr-4">
                                  {agent.permissions.canCreate && <span className="text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-1 rounded border border-green-200 dark:border-green-800">Criar</span>}
                                  {agent.permissions.canEdit && <span className="text-[10px] bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2 py-1 rounded border border-blue-200 dark:border-blue-800">Editar</span>}
                                  {agent.permissions.canDelete && <span className="text-[10px] bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-2 py-1 rounded border border-red-200 dark:border-red-800">Deletar</span>}
                              </div>

                              <button 
                                onClick={() => openViewModal(agent)} 
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                title="Visualizar"
                              >
                                  <Eye size={18} />
                              </button>
                              <button 
                                onClick={() => openEditModal(agent)} 
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                                title="Editar"
                              >
                                  <Edit2 size={18} />
                              </button>
                              <button 
                                onClick={() => setAgentToDelete(agent)} 
                                className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                title="Excluir"
                              >
                                  <Trash2 size={18} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={!!agentToDelete} 
        onClose={() => setAgentToDelete(null)} 
        title="Remover Atendente" 
        type="danger" 
        footer={
          <>
            <button onClick={() => setAgentToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Cancelar</button>
            <button onClick={confirmDeleteAgent} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Remover</button>
          </>
        }
      >
          Tem certeza que deseja remover <strong>{agentToDelete?.name}</strong>? Esta ação não pode ser desfeita.
      </Modal>

      {/* Create / Edit Modal */}
      {(modalMode === 'create' || modalMode === 'edit') && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-md shadow-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white">
                          {modalMode === 'create' ? 'Novo Atendente' : 'Editar Atendente'}
                      </h3>
                      <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24}/></button>
                  </div>
                  
                  <div className="space-y-4">
                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nome Completo</label>
                          <div className="relative">
                              <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                              <input 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                                placeholder="Ex: João Silva" 
                                value={formData.name} 
                                onChange={e => setFormData({...formData, name: e.target.value})} 
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email Corporativo</label>
                          <div className="relative">
                              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                              <input 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                                placeholder="nome@empresa.com" 
                                value={formData.email} 
                                onChange={e => setFormData({...formData, email: e.target.value})} 
                              />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Senha de Acesso</label>
                          <div className="relative">
                              <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                              <input 
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white" 
                                placeholder={modalMode === 'edit' ? "Deixe em branco para manter" : "Mínimo 6 caracteres"} 
                                type="password" 
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                              />
                          </div>
                      </div>

                      <div className="pt-4 border-t border-slate-100 dark:border-slate-700">
                          <label className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3 block">Permissões de Acesso</label>
                          <div className="space-y-2">
                              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                  <input type="checkbox" checked={formData.permissions.canCreate} onChange={() => togglePermission('canCreate')} className="rounded text-blue-600 w-4 h-4"/>
                                  <div>
                                      <span className="block text-sm font-bold text-slate-700 dark:text-white">Criar Registros</span>
                                      <span className="block text-xs text-slate-500 dark:text-slate-400">Pode criar contatos e campanhas</span>
                                  </div>
                              </label>
                              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                  <input type="checkbox" checked={formData.permissions.canEdit} onChange={() => togglePermission('canEdit')} className="rounded text-blue-600 w-4 h-4"/>
                                  <div>
                                      <span className="block text-sm font-bold text-slate-700 dark:text-white">Editar Registros</span>
                                      <span className="block text-xs text-slate-500 dark:text-slate-400">Pode modificar contatos existentes</span>
                                  </div>
                              </label>
                              <label className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                                  <input type="checkbox" checked={formData.permissions.canDelete} onChange={() => togglePermission('canDelete')} className="rounded text-blue-600 w-4 h-4"/>
                                  <div>
                                      <span className="block text-sm font-bold text-slate-700 dark:text-white">Excluir Registros</span>
                                      <span className="block text-xs text-slate-500 dark:text-slate-400">Pode remover contatos e campanhas</span>
                                  </div>
                              </label>
                          </div>
                      </div>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                      <button onClick={closeModal} className="px-6 py-2.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl font-bold hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Cancelar</button>
                      <button onClick={handleSubmit} disabled={isSubmitting} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center gap-2">
                          {isSubmitting && <Loader2 className="animate-spin" size={18}/>}
                          {modalMode === 'create' ? 'Criar Atendente' : 'Salvar Alterações'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {/* View Modal */}
      {modalMode === 'view' && selectedAgent && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-end">
                      <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24}/></button>
                  </div>
                  
                  <div className="flex flex-col items-center -mt-4">
                      <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center text-3xl font-bold mb-4">
                          {selectedAgent.name.charAt(0)}
                      </div>
                      <h3 className="text-xl font-bold text-slate-800 dark:text-white text-center">{selectedAgent.name}</h3>
                      <p className="text-slate-500 dark:text-slate-400 text-sm">{selectedAgent.email}</p>
                      
                      <span className="mt-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-bold rounded-full uppercase">
                          {selectedAgent.status === 'active' ? 'Ativo' : 'Inativo'}
                      </span>
                  </div>

                  <div className="mt-8 space-y-4">
                      <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-xl flex justify-between items-center">
                          <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Mensagens Enviadas</span>
                          <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{selectedAgent.messagesUsed}</span>
                      </div>

                      <div>
                          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 text-center">Permissões Ativas</h4>
                          <div className="flex flex-wrap gap-2 justify-center">
                              {selectedAgent.permissions.canCreate ? (
                                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-800">Criar</span>
                              ) : <span className="px-3 py-1 bg-slate-50 dark:bg-slate-700 text-slate-400 text-xs rounded-lg line-through opacity-60">Criar</span>}
                              
                              {selectedAgent.permissions.canEdit ? (
                                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-800">Editar</span>
                              ) : <span className="px-3 py-1 bg-slate-50 dark:bg-slate-700 text-slate-400 text-xs rounded-lg line-through opacity-60">Editar</span>}
                              
                              {selectedAgent.permissions.canDelete ? (
                                  <span className="px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 text-xs rounded-lg border border-blue-100 dark:border-blue-800">Excluir</span>
                              ) : <span className="px-3 py-1 bg-slate-50 dark:bg-slate-700 text-slate-400 text-xs rounded-lg line-through opacity-60">Excluir</span>}
                          </div>
                      </div>
                  </div>

                  <button onClick={() => { closeModal(); openEditModal(selectedAgent); }} className="w-full mt-8 py-3 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white rounded-xl font-bold transition-colors">
                      Editar Perfil
                  </button>
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;
