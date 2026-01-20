
import React, { useState, useEffect } from 'react';
import { Users, Shield, Plus, Trash2, Mail, CheckCircle, Search, Loader2, AlertCircle } from 'lucide-react';
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
  
  const [isAddingAgent, setIsAddingAgent] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentEmail, setNewAgentEmail] = useState('');
  const [newAgentPassword, setNewAgentPassword] = useState('');
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

  const handleCreateAgent = async () => {
      if (!newAgentName || !newAgentEmail || !newAgentPassword) return;
      if (licenseStatus && licenseStatus.usage.usedSeats >= licenseStatus.totalSeats) {
          showToast(`Limite de Seats atingido (${licenseStatus.totalSeats}).`, 'error');
          return;
      }
      try {
          await teamService.addAgent({ name: newAgentName, email: newAgentEmail, password: newAgentPassword });
          showToast('Atendente criado com sucesso!', 'success');
          setIsAddingAgent(false);
          setNewAgentName(''); setNewAgentEmail(''); setNewAgentPassword('');
          loadData();
      } catch (e: any) {
          showToast(e.message || 'Erro ao criar atendente', 'error');
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

  const handlePermissionToggle = async (agentId: string, perm: keyof AgentPermissions) => {
      const agent = agents.find(a => a.id === agentId);
      if (!agent) return;
      const newPerms = { ...agent.permissions, [perm]: !agent.permissions[perm] };
      await teamService.updateAgentPermissions(agentId, newPerms);
      setAgents(agents.map(a => a.id === agentId ? { ...a, permissions: newPerms } : a));
  };

  const filteredAgents = agents.filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="space-y-8 animate-in fade-in">
      <div className="flex justify-between items-center">
        <div><h2 className="text-2xl font-bold dark:text-white">Gestão da Equipe</h2></div>
        <button onClick={() => setIsAddingAgent(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2"><Plus size={18} /> Novo Atendente</button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
          {filteredAgents.map(agent => (
              <div key={agent.id} className="p-6 border-b dark:border-slate-700 flex justify-between items-center">
                  <div><h3 className="font-bold dark:text-white">{agent.name}</h3><span className="text-sm text-slate-500">{agent.email}</span></div>
                  <div className="flex gap-4 items-center">
                      <div className="flex gap-2">
                          <button onClick={() => handlePermissionToggle(agent.id, 'canCreate')} className={`px-2 py-1 text-xs rounded ${agent.permissions.canCreate ? 'bg-green-100 text-green-700' : 'bg-slate-200'}`}>Criar</button>
                          <button onClick={() => handlePermissionToggle(agent.id, 'canEdit')} className={`px-2 py-1 text-xs rounded ${agent.permissions.canEdit ? 'bg-blue-100 text-blue-700' : 'bg-slate-200'}`}>Editar</button>
                      </div>
                      <button onClick={() => setAgentToDelete(agent)} className="text-red-500"><Trash2 size={20} /></button>
                  </div>
              </div>
          ))}
      </div>

      <Modal isOpen={!!agentToDelete} onClose={() => setAgentToDelete(null)} title="Remover Atendente" type="danger" footer={
          <><button onClick={() => setAgentToDelete(null)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button><button onClick={confirmDeleteAgent} className="px-4 py-2 bg-red-600 text-white rounded">Remover</button></>
      }>
          Tem certeza que deseja remover <strong>{agentToDelete?.name}</strong>?
      </Modal>

      {isAddingAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <div className="bg-white dark:bg-slate-800 p-6 rounded-xl w-full max-w-md">
                  <h3 className="text-xl font-bold mb-4 dark:text-white">Novo Atendente</h3>
                  <input className="w-full p-2 border mb-2 rounded dark:bg-slate-700" placeholder="Nome" value={newAgentName} onChange={e => setNewAgentName(e.target.value)} />
                  <input className="w-full p-2 border mb-2 rounded dark:bg-slate-700" placeholder="Email" value={newAgentEmail} onChange={e => setNewAgentEmail(e.target.value)} />
                  <input className="w-full p-2 border mb-4 rounded dark:bg-slate-700" placeholder="Senha" type="password" value={newAgentPassword} onChange={e => setNewAgentPassword(e.target.value)} />
                  <div className="flex justify-end gap-2">
                      <button onClick={() => setIsAddingAgent(false)} className="px-4 py-2 bg-slate-100 rounded">Cancelar</button>
                      <button onClick={handleCreateAgent} className="px-4 py-2 bg-blue-600 text-white rounded">Criar</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Team;
