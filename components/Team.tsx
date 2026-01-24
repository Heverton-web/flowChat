
import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, 
    Edit2, Eye, EyeOff, Key, User as UserIcon, Crown, ArrowRight, RefreshCw, Tag,
    Briefcase, Headset, Star, Activity, ToggleLeft, ToggleRight, MoreVertical, Lock, Unlock, AlertCircle, Terminal, Copy, Check, X,
    FileEdit, Database
} from 'lucide-react';
import { AgentPlan, AgentPermissions, LicenseStatus, ViewState, User, UserRole } from '../types';
import * as teamService from '../services/teamService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface TeamProps {
    onNavigate?: (view: ViewState) => void;
    currentUser: User;
}

const Team: React.FC<TeamProps> = ({ onNavigate, currentUser }) => {
  const { showToast } = useApp();
  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modal States
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<AgentPlan | null>(null);
  
  // Create User State
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      password: '',
      role: 'agent' as UserRole,
      department: 'Suporte',
      permissions: { canCreate: true, canEdit: true, canDelete: false, canCreateTags: true, canEditTags: true, canDeleteTags: false } as AgentPermissions
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checks
  const isSuperAdmin = currentUser.role === 'super_admin';
  const isManager = currentUser.role === 'manager';
  const canManageTeam = isSuperAdmin || isManager;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [agentData, licStatus] = await Promise.all([
        teamService.getAgents(), // This service needs to fetch ALL profiles ideally
        financialService.getLicenseStatus()
    ]);
    setAgents(agentData);
    setLicenseStatus(licStatus);
    setLoading(false);
  };

  const openCreateModal = () => {
      setModalMode('create');
      setSelectedAgent(null);
      setShowPassword(false);
      setFormData({
          name: '',
          email: '',
          password: '',
          role: 'agent', // Default for everyone, Managers can't change this easily
          department: 'Suporte',
          permissions: { canCreate: true, canEdit: true, canDelete: false, canCreateTags: true, canEditTags: true, canDeleteTags: false }
      });
  };

  const openEditModal = (agent: AgentPlan) => {
      setModalMode('edit');
      setSelectedAgent(agent);
      setShowPassword(false);
      setFormData({
          name: agent.name,
          email: agent.email,
          password: '', // Keep empty to not change
          role: agent.role || 'agent',
          department: agent.department || 'Suporte',
          permissions: agent.permissions || { canCreate: true, canEdit: true, canDelete: false, canCreateTags: true, canEditTags: true, canDeleteTags: false }
      });
  };

  const generatePassword = () => {
      const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
      let pass = "";
      for (let i = 0; i < 12; i++) {
          pass += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setFormData({ ...formData, password: pass });
      setShowPassword(true); // Show generated password
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast('Senha copiada!', 'success');
  };

  const handleSubmit = async () => {
      if (!formData.name || !formData.email) {
          showToast('Nome e Email são obrigatórios.', 'error');
          return;
      }
      
      if (modalMode === 'create' && !formData.password) {
          showToast('Senha é obrigatória para criação.', 'error');
          return;
      }

      setIsSubmitting(true);
      try {
          if (modalMode === 'create') {
              // Mock call - in real app, call endpoint to create user in Auth + Profile
              await teamService.addAgent({
                  name: formData.name,
                  email: formData.email,
                  password: formData.password,
                  permissions: formData.permissions
                  // role: formData.role // Pass role to backend
              });
              showToast(`Usuário (${formData.role}) criado e credenciais geradas!`, 'success');
          } else if (modalMode === 'edit' && selectedAgent) {
              await teamService.updateAgent(selectedAgent.id, {
                  name: formData.name,
                  role: formData.role,
                  permissions: formData.permissions,
                  // Email usually cannot be changed easily in Auth providers without re-verification
              });
              showToast('Usuário atualizado com sucesso!', 'success');
          }
          
          closeModal();
          loadData();
      } catch (e: any) {
          showToast(e.message || 'Erro ao salvar usuário.', 'error');
      } finally {
          setIsSubmitting(false);
      }
  };

  const closeModal = () => {
      setModalMode(null);
      setSelectedAgent(null);
  };

  const RoleCard = ({ role, label, desc, icon: Icon, disabled = false }: any) => {
      const isSelected = formData.role === role;
      return (
          <button 
            onClick={() => !disabled && setFormData({...formData, role})}
            disabled={disabled}
            className={`relative flex flex-col items-start p-3 rounded-xl border-2 transition-all duration-200 group w-full text-left h-full ${
                disabled ? 'opacity-50 cursor-not-allowed bg-slate-50 dark:bg-slate-800 border-slate-100 dark:border-slate-700' :
                isSelected 
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-600' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'
            }`}
          >
              <div className="flex items-center gap-2 mb-2">
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                      <Icon size={16} />
                  </div>
                  <h4 className={`font-bold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>{label}</h4>
              </div>
              <p className={`text-[10px] leading-tight ${isSelected ? 'text-blue-600/80 dark:text-blue-300/70' : 'text-slate-500 dark:text-slate-400'}`}>{desc}</p>
              
              {isSelected && (
                  <div className="absolute top-2 right-2 text-blue-600 dark:text-blue-400">
                      <CheckCircle size={14} fill="currentColor" className="text-white dark:text-slate-900" />
                  </div>
              )}
          </button>
      );
  };

  const PermissionToggle = ({ label, checked, onChange, danger = false }: { label: string, checked: boolean, onChange: (v: boolean) => void, danger?: boolean }) => (
    <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-bold border transition-all flex items-center justify-center gap-1.5 ${
            checked 
            ? (danger ? 'bg-red-50 border-red-200 text-red-600 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400' : 'bg-green-50 border-green-200 text-green-600 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400')
            : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-800 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
        }`}
    >
        {checked ? (danger ? <Unlock size={12} /> : <CheckCircle size={12} />) : <Lock size={12} />}
        {label}
    </button>
  );

  const MiniPermissionBadge = ({ label, active, icon: Icon }: any) => (
      <div title={label} className={`w-5 h-5 rounded flex items-center justify-center ${active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-slate-100 text-slate-300 dark:bg-slate-700 dark:text-slate-600'}`}>
          <Icon size={10} />
      </div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                Gestão de Acessos e Equipe
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
                {isSuperAdmin ? 'Controle Global de Ambientes.' : 'Acompanhamento granular de permissões e performance.'}
            </p>
        </div>
        
        {canManageTeam && (
            <button 
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 font-bold"
            >
                <Plus size={18} /> Novo Acesso
            </button>
        )}
      </div>

      {/* Agents Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="p-4 border-b border-slate-100 dark:border-slate-700">
              <input 
                type="text" 
                placeholder="Buscar usuário..." 
                className="w-full md:w-64 px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-700">
                  <tr>
                      <th className="px-6 py-4">Usuário</th>
                      <th className="px-6 py-4">Ambiente</th>
                      <th className="px-6 py-4">Permissões (Granular)</th>
                      <th className="px-6 py-4">Status</th>
                      {canManageTeam && <th className="px-6 py-4 text-right">Ações</th>}
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                      <tr><td colSpan={5} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
                  ) : agents.map((agent) => (
                      <tr key={agent.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                          <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">{agent.name.charAt(0)}</div>
                                  <div>
                                      <div className="font-bold text-slate-800 dark:text-white">{agent.name}</div>
                                      <div className="text-xs text-slate-500">{agent.email}</div>
                                  </div>
                              </div>
                          </td>
                          <td className="px-6 py-4">
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase border ${
                                  agent.role === 'super_admin' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                  agent.role === 'manager' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                  agent.role === 'developer' ? 'bg-slate-800 text-white border-slate-600' :
                                  'bg-green-100 text-green-700 border-green-200'
                              }`}>
                                  {agent.role === 'manager' ? 'Gestão' : agent.role === 'super_admin' ? 'Administrador' : agent.role === 'developer' ? 'Dev' : 'Operacional'}
                              </span>
                          </td>
                          <td className="px-6 py-4">
                              {agent.role === 'agent' ? (
                                  <div className="flex items-center gap-1">
                                      <MiniPermissionBadge label="Criar Contato" active={agent.permissions?.canCreate} icon={Plus} />
                                      <MiniPermissionBadge label="Editar Contato" active={agent.permissions?.canEdit} icon={FileEdit} />
                                      <MiniPermissionBadge label="Deletar Contato" active={agent.permissions?.canDelete} icon={Trash2} />
                                      <div className="w-px h-3 bg-slate-300 mx-1"></div>
                                      <MiniPermissionBadge label="Gerir Tags" active={agent.permissions?.canCreateTags} icon={Tag} />
                                  </div>
                              ) : (
                                  <span className="text-xs text-slate-400 italic">Acesso Irrestrito</span>
                              )}
                          </td>
                          <td className="px-6 py-4"><span className="text-green-600 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">Ativo</span></td>
                          {canManageTeam && (
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-1">
                                      <button 
                                        onClick={() => openEditModal(agent)}
                                        className="text-slate-400 hover:text-blue-600 p-2 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                        title="Editar Usuário"
                                      >
                                          <Edit2 size={16}/>
                                      </button>
                                      <button className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors" title="Excluir Usuário">
                                          <Trash2 size={16}/>
                                      </button>
                                  </div>
                              </td>
                          )}
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* Create/Edit User Modal */}
      <Modal 
        isOpen={!!modalMode} 
        onClose={closeModal} 
        title={modalMode === 'edit' ? "Editar Acesso" : "Criar Credenciais de Acesso"} 
        size="lg"
      >
          <div className="space-y-5">
              
              {/* Role Selection */}
              <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2 block">Defina o Ambiente</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      <RoleCard 
                        role="manager" 
                        label="Gestor" 
                        desc="Controle total equipes/finan." 
                        icon={Briefcase}
                        disabled={!isSuperAdmin}
                      />
                      <RoleCard 
                        role="agent" 
                        label="Atendente" 
                        desc="Foco em chats/contatos." 
                        icon={Headset} 
                      />
                      <RoleCard 
                        role="developer" 
                        label="Dev" 
                        desc="Acesso API/Webhooks." 
                        icon={Terminal}
                        disabled={!isSuperAdmin}
                      />
                  </div>
              </div>

              {/* Form Fields - Redistributed in Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nome</label>
                      <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="text" 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all text-sm" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="João Silva"
                          />
                      </div>
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email</label>
                      <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                          <input 
                            type="email" 
                            className={`w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all text-sm ${modalMode === 'edit' ? 'opacity-70 cursor-not-allowed' : ''}`}
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            placeholder="email@empresa.com"
                            disabled={modalMode === 'edit'}
                          />
                      </div>
                  </div>
              </div>

              <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">
                        {modalMode === 'edit' ? 'Redefinir Senha (Opcional)' : 'Senha'}
                    </label>
                    <button onClick={generatePassword} className="text-[10px] text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded"><RefreshCw size={10}/> Gerar</button>
                  </div>
                  <div className="relative flex gap-2">
                      <div className="relative flex-1">
                        <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input 
                            type={showPassword ? "text" : "password"} 
                            className="w-full pl-9 pr-9 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono transition-all text-sm" 
                            value={formData.password} 
                            onChange={e => setFormData({...formData, password: e.target.value})} 
                            placeholder={modalMode === 'edit' ? "Deixe vazio para manter" : "******"}
                        />
                        <button 
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                            {showPassword ? <EyeOff size={14}/> : <Eye size={14}/>}
                        </button>
                      </div>
                      {formData.password && (
                          <button onClick={() => copyToClipboard(formData.password)} className="px-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors" title="Copiar">
                              <Copy size={16}/>
                          </button>
                      )}
                  </div>
              </div>

              {/* PERMISSIONS LOCKS (Compact Grid) */}
              {(formData.role === 'agent' || formData.role === 'manager') && (
                <div className="bg-slate-50 dark:bg-slate-700/30 p-3 rounded-xl border border-slate-100 dark:border-slate-700">
                    <h5 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                        <Shield size={14} /> Travas de Segurança (CRUD)
                    </h5>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Contact Permissions */}
                        <div>
                            <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Contatos</label>
                            <div className="flex gap-1.5">
                                <PermissionToggle 
                                    label="Criar" 
                                    checked={formData.permissions.canCreate} 
                                    onChange={(v) => setFormData(prev => ({...prev, permissions: {...prev.permissions, canCreate: v}}))} 
                                />
                                <PermissionToggle 
                                    label="Editar" 
                                    checked={formData.permissions.canEdit} 
                                    onChange={(v) => setFormData(prev => ({...prev, permissions: {...prev.permissions, canEdit: v}}))} 
                                />
                                <PermissionToggle 
                                    label="Excluir" 
                                    checked={formData.permissions.canDelete} 
                                    onChange={(v) => setFormData(prev => ({...prev, permissions: {...prev.permissions, canDelete: v}}))} 
                                    danger
                                />
                            </div>
                        </div>

                        {/* Tag Permissions */}
                        <div>
                            <label className="text-[10px] font-semibold text-slate-700 dark:text-slate-300 mb-1.5 block">Tags</label>
                            <div className="flex gap-1.5">
                                <PermissionToggle 
                                    label="Criar" 
                                    checked={formData.permissions.canCreateTags} 
                                    onChange={(v) => setFormData(prev => ({...prev, permissions: {...prev.permissions, canCreateTags: v}}))} 
                                />
                                <PermissionToggle 
                                    label="Editar" 
                                    checked={formData.permissions.canEditTags} 
                                    onChange={(v) => setFormData(prev => ({...prev, permissions: {...prev.permissions, canEditTags: v}}))} 
                                />
                                <PermissionToggle 
                                    label="Excluir" 
                                    checked={formData.permissions.canDeleteTags} 
                                    onChange={(v) => setFormData(prev => ({...prev, permissions: {...prev.permissions, canDeleteTags: v}}))} 
                                    danger
                                />
                            </div>
                        </div>
                    </div>
                </div>
              )}

              {/* Info Box */}
              {modalMode === 'create' && (
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl flex gap-3 items-center border border-blue-100 dark:border-blue-800">
                      <div className="p-1.5 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-200 shrink-0">
                        <Mail size={14}/>
                      </div>
                      <p className="text-[10px] text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                          As credenciais serão enviadas automaticamente para o email informado e WhatsApp.
                      </p>
                  </div>
              )}

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={closeModal} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg mr-2 transition-colors font-medium text-sm">
                      Cancelar
                  </button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed text-sm">
                      {isSubmitting ? <Loader2 className="animate-spin" size={16}/> : <CheckCircle size={16}/>} 
                      {isSubmitting ? 'Salvando...' : (modalMode === 'edit' ? 'Salvar Alterações' : 'Criar Acesso')}
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default Team;
