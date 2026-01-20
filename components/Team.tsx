
import React, { useState, useEffect } from 'react';
import { Users, Shield, Package, BookUser, Plus, Trash2, Mail, CheckCircle, Search, Loader2, AlertCircle, Save } from 'lucide-react';
import { AgentPlan, AgentPermissions, GlobalSubscription } from '../types';
import * as teamService from '../services/teamService';

const Team: React.FC = () => {
  const [agents, setAgents] = useState<AgentPlan[]>([]);
  const [subscription, setSubscription] = useState<GlobalSubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Add Agent Modal
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');

  // Delete Agent Modal State
  const [agentToDelete, setAgentToDelete] = useState<AgentPlan | null>(null);

  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const [agentData, subData] = await Promise.all([
        teamService.getAgents(),
        teamService.getGlobalSubscription()
    ]);
    setAgents(agentData);
    setSubscription(subData);
    setLoading(false);
  };

  // Derived Calculations
  const totalPurchasedMsgs = subscription?.totalMessagePacksPurchased || 0;
  const totalDistributedMsgs = agents.reduce((acc, a) => acc + a.extraPacks, 0);
  const availableMsgs = totalPurchasedMsgs - totalDistributedMsgs;

  const totalPurchasedContacts = subscription?.totalContactPacksPurchased || 0;
  const totalDistributedContacts = agents.reduce((acc, a) => acc + a.extraContactPacks, 0);
  const availableContacts = totalPurchasedContacts - totalDistributedContacts;

  const handleCreateAgent = async () => {
      if (!newAgentName || !newAgentEmail || !newAgentPassword) return;
      try {
          await teamService.addAgent({
              name: newAgentName,
              email: newAgentEmail,
              password: newAgentPassword
          });
          setNotification({ msg: 'Atendente criado! Configure os pacotes abaixo.', type: 'success' });
          setIsAddingAgent(false);
          setNewAgentName(''); setNewAgentEmail(''); setNewAgentPassword('');
          loadData();
      } catch (e) {
          setNotification({ msg: 'Erro ao criar atendente', type: 'error' });
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

  const handleDistributePack = async (agentId: string, type: 'message' | 'contact', change: number) => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;

      const currentVal = type === 'message' ? agent.extraPacks : agent.extraContactPacks;
      const newVal = Math.max(0, currentVal + change);

      // Check availability if adding
      if (change > 0) {
          if (type === 'message' && availableMsgs < change) {
              setNotification({ msg: 'Sem pacotes de mensagens disponíveis no saldo global.', type: 'error' });
              return;
          }
          if (type === 'contact' && availableContacts < change) {
              setNotification({ msg: 'Sem pacotes de contatos disponíveis no saldo global.', type: 'error' });
              return;
          }
      }

      try {
          await teamService.assignPackToAgent(agentId, type, newVal);
          loadData(); // Refresh local state totals
      } catch (e: any) {
          setNotification({ msg: e.message, type: 'error' });
      }
  };

  const handlePermissionToggle = async (agentId: string, perm: keyof AgentPermissions) => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      
      const newPerms = { ...agent.permissions, [perm]: !agent.permissions[perm] };
      await teamService.updateAgentPermissions(agentId, newPerms);
      // Optimistic update
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
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Gestão da Equipe e Distribuição</h2>
            <p className="text-slate-500 dark:text-slate-400">Configure permissões e distribua os recursos contratados.</p>
        </div>
        <button 
            onClick={() => setIsAddingAgent(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg"
        >
            <Plus size={18} /> Novo Atendente
        </button>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {notification.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {notification.msg}
            <button onClick={() => setNotification(null)} className="ml-auto opacity-50 hover:opacity-100">X</button>
        </div>
      )}

      {/* Global Pool Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600">
                      <Package size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-blue-900 dark:text-blue-100">Pacotes de Envios Disponíveis</h4>
                      <p className="text-xs text-blue-700 dark:text-blue-300">Para distribuir: {availableMsgs} de {totalPurchasedMsgs}</p>
                  </div>
              </div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">{availableMsgs}</div>
          </div>

          <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 rounded-xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-100 dark:bg-indigo-900/50 rounded-lg text-indigo-600">
                      <BookUser size={24} />
                  </div>
                  <div>
                      <h4 className="font-bold text-indigo-900 dark:text-indigo-100">Pacotes de Contatos Disponíveis</h4>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">Para distribuir: {availableContacts} de {totalPurchasedContacts}</p>
                  </div>
              </div>
              <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">{availableContacts}</div>
          </div>
      </div>

      {/* Search */}
      <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
              type="text" 
              placeholder="Buscar atendente por nome ou email..." 
              className="w-full pl-10 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
          />
      </div>

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
                          
                          {/* Profile */}
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
                              
                              {/* Message Distribution */}
                              <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-1">
                                          <Package size={12}/> Envios ({1000 + (agent.extraPacks * 1000)})
                                      </span>
                                      <span className="text-xs text-blue-600 dark:text-blue-400 font-medium">Base: 1.000</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <button onClick={() => handleDistributePack(agent.id, 'message', -1)} className="w-8 h-8 rounded bg-white dark:bg-slate-800 shadow-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">-</button>
                                      <div className="flex-1 text-center">
                                          <span className="block font-bold text-slate-800 dark:text-white text-lg">{agent.extraPacks}</span>
                                          <span className="text-[10px] text-slate-400 uppercase">Pacotes Extras</span>
                                      </div>
                                      <button onClick={() => handleDistributePack(agent.id, 'message', 1)} className="w-8 h-8 rounded bg-white dark:bg-slate-800 shadow-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20">+</button>
                                  </div>
                              </div>

                              {/* Contact Distribution */}
                              <div className="bg-indigo-50 dark:bg-indigo-900/10 p-3 rounded-lg border border-indigo-100 dark:border-indigo-800">
                                  <div className="flex justify-between items-center mb-2">
                                      <span className="text-xs font-bold text-indigo-800 dark:text-indigo-300 uppercase flex items-center gap-1">
                                          <BookUser size={12}/> Contatos ({500 + (agent.extraContactPacks * 500)})
                                      </span>
                                      <span className="text-xs text-indigo-600 dark:text-indigo-400 font-medium">Base: 500</span>
                                  </div>
                                  <div className="flex items-center gap-3">
                                      <button onClick={() => handleDistributePack(agent.id, 'contact', -1)} className="w-8 h-8 rounded bg-white dark:bg-slate-800 shadow-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">-</button>
                                      <div className="flex-1 text-center">
                                          <span className="block font-bold text-slate-800 dark:text-white text-lg">{agent.extraContactPacks}</span>
                                          <span className="text-[10px] text-slate-400 uppercase">Pacotes Extras</span>
                                      </div>
                                      <button onClick={() => handleDistributePack(agent.id, 'contact', 1)} className="w-8 h-8 rounded bg-white dark:bg-slate-800 shadow-sm font-bold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20">+</button>
                                  </div>
                              </div>

                              {/* Permissions */}
                              <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-100 dark:border-slate-600">
                                  <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-2 flex items-center gap-1">
                                      <Shield size={12} /> Permissões Globais
                                  </h4>
                                  <div className="flex justify-between gap-2">
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

      {/* Add Agent Modal */}
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

      {/* Delete Agent Confirmation Modal */}
      {agentToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 transition-colors">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Remover Atendente?</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Você está prestes a remover <strong>{agentToDelete.name}</strong> da equipe. 
                        Esta ação é irreversível e removerá o acesso imediatamente.
                    </p>
                    
                    <div className="flex gap-3">
                        <button 
                            onClick={() => setAgentToDelete(null)}
                            className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button 
                            onClick={confirmDeleteAgent}
                            className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                        >
                            Sim, Remover
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Team;
