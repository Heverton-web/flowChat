
import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, AlertCircle } from 'lucide-react';
import { AgentPlan, AgentPermissions, LicenseStatus } from '../types';
import * as teamService from '../services/teamService';
import * as financialService from '../services/financialService';

const Team: React.FC = () => {
  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');
  const [agentToDelete, setAgentToDelete] = useState<AgentPlan | null>(null);
  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

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

  const handleCreateAgent = async () => {
      if (!newAgentName || !newAgentEmail || !newAgentPassword) return;
      
      if (licenseStatus) {
          if (licenseStatus.usage.usedSeats >= licenseStatus.totalSeats) {
              setNotification({ msg: `Limite de Seats atingido (${licenseStatus.totalSeats}). Solicite mais seats na aba Assinatura.`, type: 'error' });
              return;
          }
      }

      try {
          await teamService.addAgent({
              name: newAgentName,
              email: newAgentEmail,
              password: newAgentPassword
          });
          setNotification({ msg: 'Atendente criado com sucesso!', type: 'success' });
          setIsAddingAgent(false);
          setNewAgentName(''); setNewAgentEmail(''); setNewAgentPassword('');
          loadData();
      } catch (e: any) {
          setNotification({ msg: e.message || 'Erro ao criar atendente', type: 'error' });
      }
  };

  const confirmDeleteAgent = async () => {
      if (!agentToDelete) return;
      try {
          await teamService.removeAgent(agentToDelete.id);
          setNotification({ msg: 'Atendente removido com sucesso.', type: 'success' });
          loadData();
      } catch (error) {
          setNotification({ msg: 'Erro ao remover atendente.', type: 'error' });
      } finally {
          setAgentToDelete(null);
      }
  };

  const handlePermissionToggle = async (agentId: string, perm: keyof AgentPermissions) => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      
      const newPerms = { ...agent.permissions, [perm]: !agent.permissions[perm] };
      await teamService.updateAgentPermissions(agentId, newPerms);
      setAgents(agents.map(a => a.id === agentId ? { ...a, permissions: newPerms } : a));
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
            <p className="text-slate-500 dark:text-slate-400">Gerencie acessos dos seus {licenseStatus?.usage.usedSeats || 0} usuários.</p>
        </div>
        
        {licenseStatus && (
            <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                    Seats: <strong>{licenseStatus.usage.usedSeats}</strong> / {licenseStatus.totalSeats}
                </span>
                
                <button 
                    onClick={() => setIsAddingAgent(true)}
                    disabled={licenseStatus.usage.usedSeats >= licenseStatus.totalSeats}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-colors"
                >
                    <Plus size={18} /> Novo Atendente
                </button>
            </div>
        )}
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {notification.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {notification.msg}
            <button onClick={() => setNotification(null)} className="ml-auto opacity-50 hover:opacity-100">X</button>
        </div>
      )}

      {/* Agents List */}
      <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          {loading ? (
              <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" /></div>
          ) : filteredAgents.length === 0 ? (
              <div className="p-12 text-center text-slate-500">Nenhum atendente encontrado.</div>
          ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                  {filteredAgents.map(agent => (
                      <div key={agent.id} className="p-6 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors flex flex-col xl:flex-row xl:items-center gap-6">
                          <div className="flex items-center gap-4 min-w-[250px]">
                              <div className="w-12 h-12 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold text-lg">
                                  {agent.name.charAt(0)}
                              </div>
                              <div>
                                  <h3 className="font-bold text-slate-800 dark:text-white">{agent.name}</h3>
                                  <div className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400">
                                      <Mail size={12} /> {agent.email}
                                  </div>
                              </div>
                          </div>

                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              <div className="col-span-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                                      <Shield size={12} /> Permissões
                                  </h4>
                                  <div className="flex justify-between gap-2 max-w-md">
                                      <button 
                                        onClick={() => handlePermissionToggle(agent.id, 'canCreate')}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${agent.permissions.canCreate ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400'}`}
                                      >
                                          Criar
                                      </button>
                                      <button 
                                        onClick={() => handlePermissionToggle(agent.id, 'canEdit')}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${agent.permissions.canEdit ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400'}`}
                                      >
                                          Editar
                                      </button>
                                      <button 
                                        onClick={() => handlePermissionToggle(agent.id, 'canDelete')}
                                        className={`flex-1 py-1.5 rounded text-[10px] font-bold uppercase transition-colors ${agent.permissions.canDelete ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' : 'bg-slate-200 text-slate-500 dark:bg-slate-600 dark:text-slate-400'}`}
                                      >
                                          Deletar
                                      </button>
                                  </div>
                              </div>
                          </div>

                          <div className="flex xl:flex-col justify-end">
                              <button 
                                onClick={() => setAgentToDelete(agent)}
                                className="p-2 text-slate-300 hover:text-red-500 transition-colors" title="Remover Atendente"
                              >
                                  <Trash2 size={20} />
                              </button>
                          </div>
                      </div>
                  ))}
              </div>
          )}
      </div>

      {isAddingAgent && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-md shadow-2xl animate-in zoom-in-95 p-6">
                  <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-4">Adicionar Atendente</h3>
                  <div className="space-y-4">
                      <input 
                          type="text" 
                          placeholder="Nome Completo" 
                          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                          value={newAgentName} onChange={e => setNewAgentName(e.target.value)}
                      />
                      <input 
                          type="email" 
                          placeholder="Email Corporativo" 
                          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                          value={newAgentEmail} onChange={e => setNewAgentEmail(e.target.value)}
                      />
                      <input 
                          type="password" 
                          placeholder="Senha Inicial" 
                          className="w-full p-3 border border-slate-300 dark:border-slate-600 rounded-lg dark:bg-slate-700 dark:text-white"
                          value={newAgentPassword} onChange={e => setNewAgentPassword(e.target.value)}
                      />
                      <div className="flex gap-3 pt-2">
                          <button onClick={() => setIsAddingAgent(false)} className="flex-1 py-3 text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                          <button onClick={handleCreateAgent} className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Criar</button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;
