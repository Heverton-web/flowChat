
import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, 
    Edit2, Eye, EyeOff, Key, User as UserIcon, Crown, RefreshCw, Tag,
    Briefcase, Headphones, MoreVertical, Lock, Unlock, Terminal, Copy, Check,
    FileEdit, LayoutGrid, List
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
        teamService.getAgents(), 
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
          role: 'agent', 
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
          password: '', 
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
      setShowPassword(true); 
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
              const newAgent = await teamService.addAgent({
                  name: formData.name,
                  email: formData.email,
                  password: formData.password,
                  role: formData.role,
                  permissions: formData.permissions
              });
              setAgents([...agents, newAgent]); // Optimistic update
              showToast(`Usuário (${formData.role}) criado e credenciais geradas!`, 'success');
          } else if (modalMode === 'edit' && selectedAgent) {
              await teamService.updateAgent(selectedAgent.id, {
                  name: formData.name,
                  role: formData.role,
                  permissions: formData.permissions,
              });
              // Local update
              setAgents(prev => prev.map(a => a.id === selectedAgent.id ? { ...a, ...formData } : a));
              showToast('Usuário atualizado com sucesso!', 'success');
          }
          
          closeModal();
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

  const filteredAgents = agents.filter(agent => 
    agent.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    agent.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --- UI COMPONENTS ---

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

  const getRoleBadge = (role: string) => {
      switch(role) {
          case 'super_admin': 
            return <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold w-fit"><Crown size={14}/> Super Admin</div>;
          case 'manager':
            return <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 text-xs font-bold w-fit"><Briefcase size={14}/> Gestor</div>;
          default:
            return <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold w-fit"><Headphones size={14}/> Atendente</div>;
      }
  };

  const PermissionDot = ({ active, label }: { active: boolean, label: string }) => (
      <div title={label} className={`w-2.5 h-2.5 rounded-full ${active ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Users className="text-blue-600" size={24} />
                Gestão de Acessos e Equipe
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
                {isSuperAdmin ? 'Controle Global de Ambientes.' : 'Gerencie sua equipe, atribua cargos e defina permissões.'}
            </p>
        </div>
        
        {canManageTeam && (
            <button 
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 font-bold text-sm"
            >
                <Plus size={18} /> Adicionar Membro
            </button>
        )}
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
          <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou email..." 
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-sm dark:text-white transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
              <Users size={16} /> Total: <span className="font-bold text-slate-800 dark:text-white">{agents.length}</span>
          </div>
      </div>

      {/* Agents List (Visual Refactor: Stacked List / Cards) */}
      <div className="space-y-4">
          {loading ? (
              <div className="p-12 text-center flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
          ) : filteredAgents.map((agent) => (
              <div key={agent.id} className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm hover:shadow-md hover:border-blue-200 dark:hover:border-slate-600 transition-all flex flex-col lg:flex-row items-start lg:items-center gap-6 relative overflow-hidden">
                  
                  {/* Decorative Left Border for Role */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                      agent.role === 'super_admin' ? 'bg-purple-500' : 
                      agent.role === 'manager' ? 'bg-blue-500' : 'bg-emerald-500'
                  }`}></div>

                  {/* 1. User Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-[250px] pl-2">
                      <div className="relative">
                          {agent.avatar ? (
                              <img src={agent.avatar} alt={agent.name} className="w-14 h-14 rounded-full object-cover border-2 border-slate-100 dark:border-slate-700 shadow-sm" />
                          ) : (
                              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-800 flex items-center justify-center font-bold text-slate-500 dark:text-slate-300 text-xl border-2 border-white dark:border-slate-600 shadow-sm">
                                  {agent.name.charAt(0).toUpperCase()}
                              </div>
                          )}
                          <div className={`absolute bottom-0 right-0 w-4 h-4 border-2 border-white dark:border-slate-800 rounded-full ${agent.status === 'active' ? 'bg-green-500' : 'bg-slate-400'}`}></div>
                      </div>
                      <div>
                          <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{agent.name}</h4>
                          <p className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5 mt-0.5">
                              <Mail size={12}/> {agent.email}
                          </p>
                      </div>
                  </div>

                  {/* 2. Role Badge */}
                  <div className="w-full lg:w-auto flex justify-start pl-2 lg:pl-0">
                      {getRoleBadge(agent.role || 'agent')}
                  </div>

                  {/* 3. Permissions Visualizer */}
                  <div className="w-full lg:w-auto flex flex-col gap-2 min-w-[200px] pl-2 lg:pl-0">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Nível de Acesso</span>
                      {agent.role === 'super_admin' || agent.role === 'manager' ? (
                          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-600 w-fit">
                              <Shield size={14} className="text-blue-500"/>
                              Acesso Administrativo Total
                          </div>
                      ) : (
                          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 px-3 py-1.5 rounded-lg border border-slate-100 dark:border-slate-600 w-fit">
                              <div className="flex flex-col gap-1">
                                  <div className="flex items-center gap-1.5" title="Contatos: Criar, Editar, Excluir">
                                      <span className="text-[10px] font-semibold text-slate-500 uppercase w-12">Contatos</span>
                                      <div className="flex gap-1">
                                          <PermissionDot active={agent.permissions?.canCreate} label="Criar" />
                                          <PermissionDot active={agent.permissions?.canEdit} label="Editar" />
                                          <PermissionDot active={agent.permissions?.canDelete} label="Excluir" />
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-1.5" title="Tags: Criar, Editar, Excluir">
                                      <span className="text-[10px] font-semibold text-slate-500 uppercase w-12">Tags</span>
                                      <div className="flex gap-1">
                                          <PermissionDot active={agent.permissions?.canCreateTags} label="Criar" />
                                          <PermissionDot active={agent.permissions?.canEditTags} label="Editar" />
                                          <PermissionDot active={agent.permissions?.canDeleteTags} label="Excluir" />
                                      </div>
                                  </div>
                              </div>
                          </div>
                      )}
                  </div>

                  {/* 4. Actions */}
                  {canManageTeam && (
                      <div className="w-full lg:w-auto flex items-center justify-end gap-2 pl-2 lg:pl-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700 pt-4 lg:pt-0">
                          <button 
                            onClick={() => openEditModal(agent)}
                            className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                          >
                              <Edit2 size={16}/> <span className="lg:hidden xl:inline">Editar</span>
                          </button>
                          
                          {/* Protect Self-Delete if logic requires, otherwise show */}
                          <button 
                            className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg transition-all"
                            title="Desativar Acesso"
                          >
                              <Trash2 size={16}/>
                          </button>
                      </div>
                  )}
              </div>
          ))}
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
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
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
                        icon={Headphones} 
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
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-600"
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
