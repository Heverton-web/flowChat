
import React, { useState, useEffect } from 'react';
import { 
    Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, 
    Edit2, Eye, EyeOff, Key, User as UserIcon, Crown, ArrowRight, RefreshCw, Tag,
    Briefcase, Headset, Star, Activity, ToggleLeft, ToggleRight, MoreVertical, Lock, AlertCircle, Terminal, Copy, Check
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
      if (!formData.name || !formData.email || !formData.password) {
          showToast('Todos os campos são obrigatórios.', 'error');
          return;
      }
      setIsSubmitting(true);
      try {
          // Mock call - in real app, call endpoint to create user in Auth + Profile
          await teamService.addAgent({
              name: formData.name,
              email: formData.email,
              password: formData.password,
              // role: formData.role // Pass role to backend
          });
          showToast(`Usuário (${formData.role}) criado e credenciais geradas!`, 'success');
          closeModal();
          loadData();
      } catch (e: any) {
          showToast('Erro ao criar usuário.', 'error');
      } finally {
          setIsSubmitting(false);
      }
  };

  const closeModal = () => {
      setModalMode(null);
  };

  const RoleCard = ({ role, label, desc, icon: Icon }: any) => {
      const isSelected = formData.role === role;
      return (
          <button 
            onClick={() => setFormData({...formData, role})}
            className={`relative flex flex-col items-start p-4 rounded-xl border-2 transition-all duration-200 group w-full text-left ${
                isSelected 
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20 shadow-md ring-1 ring-blue-600' 
                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-sm'
            }`}
          >
              <div className={`p-2 rounded-lg mb-3 ${isSelected ? 'bg-blue-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 group-hover:text-blue-600 dark:group-hover:text-blue-400'}`}>
                  <Icon size={20} />
              </div>
              <h4 className={`font-bold text-sm ${isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>{label}</h4>
              <p className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-blue-600/80 dark:text-blue-300/70' : 'text-slate-500 dark:text-slate-400'}`}>{desc}</p>
              
              {isSelected && (
                  <div className="absolute top-3 right-3 text-blue-600 dark:text-blue-400">
                      <CheckCircle size={18} fill="currentColor" className="text-white dark:text-slate-900" />
                  </div>
              )}
          </button>
      );
  };

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
                {isSuperAdmin ? 'Crie e gerencie todos os acessos ao sistema.' : 'Visualize os membros da equipe.'}
            </p>
        </div>
        
        {isSuperAdmin && (
            <button 
                onClick={openCreateModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-600/20 font-bold"
            >
                <Plus size={18} /> Criar Novo Usuário
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
                      <th className="px-6 py-4">Função (Role)</th>
                      <th className="px-6 py-4">Status</th>
                      {isSuperAdmin && <th className="px-6 py-4 text-right">Ações</th>}
                  </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {loading ? (
                      <tr><td colSpan={4} className="p-8 text-center"><Loader2 className="animate-spin mx-auto text-blue-600"/></td></tr>
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
                              <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${
                                  agent.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                                  agent.role === 'manager' ? 'bg-indigo-100 text-indigo-700' :
                                  agent.role === 'developer' ? 'bg-slate-800 text-white' :
                                  'bg-green-100 text-green-700'
                              }`}>
                                  {agent.role || 'Agent'}
                              </span>
                          </td>
                          <td className="px-6 py-4"><span className="text-green-600 font-bold text-xs bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full border border-green-200 dark:border-green-800">Ativo</span></td>
                          {isSuperAdmin && (
                              <td className="px-6 py-4 text-right">
                                  <button className="text-slate-400 hover:text-red-500 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 size={16}/></button>
                              </td>
                          )}
                      </tr>
                  ))}
              </tbody>
          </table>
      </div>

      {/* Create User Modal */}
      <Modal isOpen={!!modalMode} onClose={closeModal} title="Criar Credenciais de Acesso">
          <div className="space-y-6">
              
              {/* Role Selection */}
              <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3 block">Nível de Acesso</label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <RoleCard 
                        role="manager" 
                        label="Gestor" 
                        desc="Controle total de equipes, campanhas e financeiro." 
                        icon={Briefcase} 
                      />
                      <RoleCard 
                        role="agent" 
                        label="Atendente" 
                        desc="Acesso focado em chats, contatos e tags." 
                        icon={Headset} 
                      />
                      <RoleCard 
                        role="developer" 
                        label="Developer" 
                        desc="Acesso técnico a API, Webhooks e Logs." 
                        icon={Terminal} 
                      />
                  </div>
              </div>

              {/* Form Fields */}
              <div className="grid gap-4">
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nome Completo</label>
                      <div className="relative">
                          <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="text" 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all" 
                            value={formData.name} 
                            onChange={e => setFormData({...formData, name: e.target.value})} 
                            placeholder="Ex: João Silva"
                          />
                      </div>
                  </div>
                  
                  <div className="space-y-1">
                      <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Email Corporativo</label>
                      <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                          <input 
                            type="email" 
                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all" 
                            value={formData.email} 
                            onChange={e => setFormData({...formData, email: e.target.value})} 
                            placeholder="nome@empresa.com"
                          />
                      </div>
                  </div>

                  <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Senha de Acesso</label>
                        <button onClick={generatePassword} className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1"><RefreshCw size={10}/> Gerar Senha</button>
                      </div>
                      <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white font-mono transition-all" 
                                value={formData.password} 
                                onChange={e => setFormData({...formData, password: e.target.value})} 
                                placeholder="******"
                            />
                            <button 
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                            </button>
                          </div>
                          {formData.password && (
                              <button onClick={() => copyToClipboard(formData.password)} className="px-3 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-500 hover:text-blue-600 hover:border-blue-300 transition-colors" title="Copiar Senha">
                                  <Copy size={18}/>
                              </button>
                          )}
                      </div>
                  </div>
              </div>

              {/* Info Box */}
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl flex gap-3 items-start border border-blue-100 dark:border-blue-800">
                  <div className="p-2 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-200 shrink-0">
                    <Mail size={16}/>
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-blue-800 dark:text-blue-200 mb-1">Envio Automático</h5>
                    <p className="text-xs text-blue-700/80 dark:text-blue-300/80 leading-relaxed">
                        Ao criar o acesso, as credenciais serão enviadas automaticamente para o email informado e uma cópia será enviada para o seu WhatsApp conectado.
                    </p>
                  </div>
              </div>

              {/* Footer */}
              <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-700">
                  <button onClick={closeModal} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg mr-2 transition-colors font-medium">
                      Cancelar
                  </button>
                  <button onClick={handleSubmit} disabled={isSubmitting} className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 shadow-lg shadow-blue-600/20 transition-all disabled:opacity-70 disabled:cursor-not-allowed">
                      {isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <CheckCircle size={18}/>} 
                      {isSubmitting ? 'Criando...' : 'Criar Acesso'}
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};

export default Team;
