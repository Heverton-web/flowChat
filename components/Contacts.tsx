
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, Tag, Trash2, Edit2, Mail, 
  MessageSquare, Save, X, Database, CheckCircle, AlertCircle, Loader2, Download, Upload, UserPlus, ArrowRight, FileDown, ShieldCheck, Lock, Phone, User as UserIcon, FileText, Briefcase, AlertTriangle
} from 'lucide-react';
import { Contact, User, CampaignObjective, AgentPermissions } from '../types';
import * as contactService from '../services/contactService';
import * as teamService from '../services/teamService';
import * as campaignService from '../services/campaignService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface ContactsProps {
    currentUser?: User;
}

const Contacts: React.FC<ContactsProps> = ({ currentUser = { id: 'guest', role: 'agent' } as User }) => {
  const { t, showToast } = useApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [availableAgents, setAvailableAgents] = useState<{id: string, name: string}[]>([]);
  const [userPermissions, setUserPermissions] = useState<AgentPermissions>({
      canCreate: true, canEdit: true, canDelete: true
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'import'>('create');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Delete Modal
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

  // Campaign Modal State
  const [campaignForm, setCampaignForm] = useState({
      name: '', date: '', objective: 'prospecting' as CampaignObjective, message: '',
      minDelay: 30, maxDelay: 120, typingDelay: 3
  });

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [contactToTransfer, setContactToTransfer] = useState<Contact | null>(null);
  const [targetAgentId, setTargetAgentId] = useState<string>('');

  // Form State
  const [formData, setFormData] = useState({
    name: '', phone: '', email: '', tags: '', notes: '',
    ownerId: currentUser.id, lockEdit: false, lockDelete: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [contactsData, agentsData] = await Promise.all([
            contactService.getContacts(currentUser.id, currentUser.role),
            teamService.getAgents()
        ]);
        setContacts(contactsData);
        
        // Setup Agents List for Transfer
        const agentList = agentsData.map(a => ({ id: a.id, name: a.name }));
        // Add Manager manually if not in list (mock scenario)
        if (!agentList.find(a => a.id === 'manager-1')) {
            agentList.unshift({ id: 'manager-1', name: 'Gestor Admin' });
        }
        setAvailableAgents(agentList);

        if (currentUser.role !== 'manager') {
            const myAgentProfile = await teamService.getAgentById(currentUser.id);
            if (myAgentProfile && myAgentProfile.permissions) setUserPermissions(myAgentProfile.permissions);
        } else {
            setUserPermissions({ canCreate: true, canEdit: true, canDelete: true });
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags))).filter(Boolean);
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contact.phone.includes(searchTerm) ||
                          contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      
      if (editingContact) {
        if (currentUser.role !== 'manager') {
            if (!userPermissions.canEdit) throw new Error('Você não tem permissão global para editar contatos.');
            if (editingContact.lockEdit) throw new Error('A edição deste contato foi bloqueada pelo gestor.');
        }
        await contactService.updateContact(editingContact.id, { ...formData, tags: tagsArray });
        showToast('Contato atualizado com sucesso!', 'success');
      } else {
        if (currentUser.role !== 'manager' && !userPermissions.canCreate) throw new Error('Você não tem permissão para criar contatos.');
        await contactService.saveContact({ ...formData, tags: tagsArray }, formData.ownerId);
        showToast('Contato salvo na base!', 'success');
      }
      closeModal();
      loadData();
    } catch (error: any) {
      showToast(error.message || 'Erro ao salvar', 'error');
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteClick = (contact: Contact) => {
    if (currentUser.role !== 'manager') {
        if (!userPermissions.canDelete) {
            showToast('Você não tem permissão global para deletar contatos.', 'error');
            return;
        }
        if (contact.lockDelete) {
            showToast('A exclusão deste contato foi bloqueada pelo gestor.', 'error');
            return;
        }
    }
    setContactToDelete(contact);
  };

  const confirmDelete = async () => {
      if (!contactToDelete) return;
      await contactService.deleteContact(contactToDelete.id);
      loadData();
      if (selectedContacts.has(contactToDelete.id)) {
        const newSet = new Set(selectedContacts);
        newSet.delete(contactToDelete.id);
        setSelectedContacts(newSet);
      }
      setContactToDelete(null);
      showToast('Contato excluído.', 'success');
  };

  const openModal = (contact?: Contact) => {
    setModalMode('create');
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name, phone: contact.phone, email: contact.email || '',
        tags: contact.tags.join(', '), notes: contact.notes || '',
        ownerId: contact.ownerId, lockEdit: contact.lockEdit || false, lockDelete: contact.lockDelete || false
      });
    } else {
      setEditingContact(null);
      setFormData({ name: '', phone: '', email: '', tags: '', notes: '', ownerId: currentUser.id, lockEdit: false, lockDelete: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => { setIsModalOpen(false); setEditingContact(null); setImportFile(null); };

  const handleTransferClick = (contact: Contact) => {
      setContactToTransfer(contact);
      // Set default target to the first agent that is NOT the current owner
      const defaultTarget = availableAgents.find(a => a.id !== contact.ownerId);
      setTargetAgentId(defaultTarget ? defaultTarget.id : '');
      setIsTransferModalOpen(true);
  };

  const confirmTransfer = async () => {
      if (!contactToTransfer || !targetAgentId) {
          showToast('Selecione um atendente de destino.', 'error');
          return;
      }
      try {
          await contactService.assignContact(contactToTransfer.id, targetAgentId);
          showToast('Contato transferido com sucesso!', 'success');
          setIsTransferModalOpen(false);
          setContactToTransfer(null);
          loadData();
      } catch (error: any) {
          showToast(error.message, 'error');
      }
  };

  const handleDownloadTemplate = () => contactService.downloadCSVTemplate();
  const handleExportContacts = () => { contactService.exportContactsToCSV(contacts); showToast('Lista exportada com sucesso!', 'success'); };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files?.[0]) setImportFile(e.target.files[0]); };

  const processImport = async () => {
      if (!importFile) return;
      if (currentUser.role !== 'manager' && !userPermissions.canCreate) {
           showToast('Você não tem permissão para importar contatos.', 'error');
           return;
      }
      setIsProcessingImport(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result as string;
          
          // 1. Split lines handling different OS line breaks
          const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim());

          if (lines.length < 2) {
              showToast('Arquivo vazio ou inválido.', 'error');
              setIsProcessingImport(false);
              return;
          }

          // 2. Detect delimiter (Comma or Semicolon) based on header
          const header = lines[0];
          const delimiter = header.includes(';') ? ';' : ',';

          // 3. Process lines
          const parsedContacts = lines.slice(1).map(line => {
              if (!line.trim()) return null;

              const parts = line.split(delimiter);
              
              // Helper to clean quotes and whitespace
              const clean = (val: string) => val ? val.trim().replace(/^["']|["']$/g, '') : '';

              const name = clean(parts[0]);
              const phoneRaw = clean(parts[1]);
              const email = clean(parts[2]);
              const tagsStr = clean(parts[3]);

              if (!name || !phoneRaw) return null;

              // Basic validation
              const phone = phoneRaw.replace(/\D/g, '');
              if (phone.length < 8) return null;

              return { 
                  name, 
                  phone, 
                  email, 
                  tags: tagsStr ? tagsStr.split(';').map(t => clean(t)) : [] 
              };
          }).filter((c): c is NonNullable<typeof c> => c !== null);

          if (parsedContacts.length === 0) {
              showToast('Nenhum contato válido encontrado.', 'error');
              setIsProcessingImport(false);
              return;
          }

          try {
              const count = await contactService.bulkImportContacts(parsedContacts, formData.ownerId);
              showToast(`${count} contatos importados com sucesso!`, 'success');
              closeModal();
              loadData();
          } catch (error: any) {
              showToast(error.message, 'error');
          } finally { setIsProcessingImport(false); }
      };
      reader.readAsText(importFile);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
    setSelectedContacts(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) setSelectedContacts(new Set());
    else setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
  };

  const handleLaunchCampaign = () => {
    setCampaignForm({ 
        name: '', date: '', objective: 'prospecting', message: '',
        minDelay: 30, maxDelay: 120, typingDelay: 3
    });
    setIsCampaignModalOpen(true);
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.date || !campaignForm.message.trim()) return;
    if (campaignForm.minDelay < 5 || campaignForm.maxDelay < campaignForm.minDelay) {
        showToast('Configuração de intervalo inválida.', 'error');
        return;
    }
    try {
        await campaignService.createCampaign({
            name: campaignForm.name, scheduledDate: campaignForm.date, objective: campaignForm.objective,
            agentName: currentUser.name, ownerId: currentUser.id, totalContacts: selectedContacts.size,
            workflow: [{ id: 'default-1', type: 'text', content: campaignForm.message, order: 1, delay: campaignForm.typingDelay * 1000 }],
            minDelay: campaignForm.minDelay, maxDelay: campaignForm.maxDelay
        });
        showToast(`Campanha "${campaignForm.name}" criada com sucesso!`, 'success');
        setIsCampaignModalOpen(false);
        setSelectedContacts(new Set());
    } catch (e) { showToast('Erro ao criar campanha', 'error'); }
  };

  const getAgentName = (id: string) => availableAgents.find(a => a.id === id)?.name || 'Desconhecido';

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="text-blue-600" size={24}/>
            {t('contacts_base_title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{t('contacts_subtitle')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            <button onClick={handleDownloadTemplate} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                <Download size={16} /> {t('download_template')}
            </button>
            <button onClick={handleExportContacts} className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors">
                <FileDown size={16} /> Exportar
            </button>
            {userPermissions.canCreate ? (
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors">
                    <Plus size={18} /> {t('add_contact')}
                </button>
            ) : (
                <button disabled className="bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed">
                    <Lock size={16} /> {t('add_contact')}
                </button>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder={t('search')} className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white dark:bg-slate-700 dark:text-white" value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
                    <option value="all">Todas as Tags</option>
                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
            </div>
        </div>
        {selectedContacts.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{selectedContacts.size} selecionados</span>
                <button onClick={handleLaunchCampaign} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm transition-colors">
                    <MessageSquare size={16} /> {t('quick_campaign')}
                </button>
            </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
        ) : filteredContacts.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhum contato encontrado.</div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-600">
                        <tr>
                            <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0} onChange={toggleSelectAll} /></th>
                            <th className="px-6 py-4">{t('name')}</th>
                            <th className="px-6 py-4">{t('tags')}</th>
                            <th className="px-6 py-4">Responsável</th>
                            <th className="px-6 py-4 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredContacts.map(contact => (
                            <tr key={contact.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedContacts.has(contact.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500" checked={selectedContacts.has(contact.id)} onChange={() => toggleSelection(contact.id)} /></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="font-medium text-slate-900 dark:text-white">{contact.name}</div>
                                        {contact.lockEdit && <div className="text-amber-500" title="Edição Bloqueada"><Edit2 size={12} className="line-through"/></div>}
                                        {contact.lockDelete && <div className="text-red-500" title="Exclusão Bloqueada"><Lock size={12}/></div>}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs mt-1 font-mono">
                                        <Phone size={10} /> {contact.phone}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {contact.tags.map((tag, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded text-xs border border-slate-200 dark:border-slate-600">{tag}</span>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                                            {getAgentName(contact.ownerId).charAt(0)}
                                        </div>
                                        <span className="text-xs text-slate-600 dark:text-slate-300">{getAgentName(contact.ownerId)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {currentUser.role === 'manager' && (
                                            <button 
                                                onClick={() => handleTransferClick(contact)} 
                                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition-colors"
                                                title="Transferir Responsável"
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        )}
                                        <button 
                                            onClick={() => openModal(contact)} 
                                            disabled={!userPermissions.canEdit && !currentUser.role && contact.lockEdit} 
                                            className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={16} />
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteClick(contact)} 
                                            disabled={!userPermissions.canDelete && !currentUser.role && contact.lockDelete} 
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* --- MODALS --- */}

      {/* Delete Confirmation Modal */}
      <Modal isOpen={!!contactToDelete} onClose={() => setContactToDelete(null)} title="Excluir Contato?" type="danger" footer={
          <><button onClick={() => setContactToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Cancelar</button><button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Excluir</button></>
      }>
          Tem certeza que deseja excluir <strong>{contactToDelete?.name}</strong>?
      </Modal>

      {/* Transfer Modal - Fixed Logic */}
      <Modal 
        isOpen={isTransferModalOpen} 
        onClose={() => { setIsTransferModalOpen(false); setContactToTransfer(null); }} 
        title="Atribuir Contato"
        footer={
            <>
                <button onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-medium">Cancelar</button>
                <button onClick={confirmTransfer} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">Confirmar Transferência</button>
            </>
        }
      >
          <div className="space-y-4">
              <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800 flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold text-lg">
                      {contactToTransfer?.name.charAt(0)}
                  </div>
                  <div>
                      <p className="font-bold text-slate-800 dark:text-white">{contactToTransfer?.name}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Atual Responsável: {getAgentName(contactToTransfer?.ownerId || '')}</p>
                  </div>
              </div>

              <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Novo Responsável</label>
                  <select 
                    className="w-full p-3 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 text-slate-700 dark:text-white transition-all"
                    value={targetAgentId}
                    onChange={(e) => setTargetAgentId(e.target.value)}
                  >
                      <option value="" disabled>Selecione um atendente...</option>
                      {availableAgents.map(agent => (
                          <option key={agent.id} value={agent.id} disabled={agent.id === contactToTransfer?.ownerId}>
                              {agent.name} {agent.id === contactToTransfer?.ownerId ? '(Atual)' : ''}
                          </option>
                      ))}
                  </select>
              </div>
          </div>
      </Modal>

      {/* Main Create/Edit/Import Modal - Redesigned */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700 transition-colors">
                
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editingContact ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400' : 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'}`}>
                            {editingContact ? <Edit2 size={20} /> : <UserPlus size={20} />}
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                                {editingContact ? 'Editar Contato' : 'Novo Contato'}
                            </h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {modalMode === 'create' ? 'Preencha os dados do cliente.' : 'Importe múltiplos contatos via CSV.'}
                            </p>
                        </div>
                    </div>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
                        <X size={20}/>
                    </button>
                </div>

                {/* Tabs (Only for Create Mode) */}
                {!editingContact && (
                    <div className="flex border-b border-slate-100 dark:border-slate-700 px-6 gap-6">
                        <button 
                            className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${modalMode === 'create' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`} 
                            onClick={() => setModalMode('create')}
                        >
                            <FileText size={16}/> Formulário Manual
                        </button>
                        <button 
                            className={`py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 ${modalMode === 'import' ? 'border-green-600 text-green-600 dark:text-green-400' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`} 
                            onClick={() => setModalMode('import')}
                        >
                            <Upload size={16}/> Importação em Massa
                        </button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto flex-1">
                    {modalMode === 'create' ? (
                        <div className="space-y-6">
                            {/* Grid Layout */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                
                                {/* Left Column: Basic Info */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <UserIcon size={12}/> Dados Pessoais
                                    </h4>
                                    
                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nome Completo <span className="text-red-500">*</span></label>
                                        <input 
                                            type="text" 
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                            placeholder="Ex: Carlos Oliveira"
                                            value={formData.name}
                                            onChange={e => setFormData({...formData, name: e.target.value})}
                                        />
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">WhatsApp <span className="text-red-500">*</span></label>
                                        <div className="relative">
                                            <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                            <input 
                                                type="text" 
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all font-mono"
                                                placeholder="5511999998888"
                                                value={formData.phone}
                                                onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})}
                                            />
                                        </div>
                                        <p className="text-[10px] text-slate-400 pl-1">Apenas números, com DDD.</p>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email (Opcional)</label>
                                        <div className="relative">
                                            <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                            <input 
                                                type="email" 
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                                placeholder="cliente@email.com"
                                                value={formData.email}
                                                onChange={e => setFormData({...formData, email: e.target.value})}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Right Column: Organization & Security */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                        <Briefcase size={12}/> Organização
                                    </h4>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Etiquetas (Tags)</label>
                                        <div className="relative">
                                            <Tag size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                            <input 
                                                type="text" 
                                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all"
                                                placeholder="Separe por vírgula (Ex: Vip, Lead)"
                                                value={formData.tags}
                                                onChange={e => setFormData({...formData, tags: e.target.value})}
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Anotações Internas</label>
                                        <textarea 
                                            className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all resize-none text-sm"
                                            rows={3}
                                            placeholder="Detalhes sobre o cliente..."
                                            value={formData.notes}
                                            onChange={e => setFormData({...formData, notes: e.target.value})}
                                        ></textarea>
                                    </div>

                                    {/* Security Locks - Manager Only */}
                                    {currentUser.role === 'manager' && (
                                        <div className="pt-2">
                                            <div className="bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-xl p-3">
                                                <h4 className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                                                    <ShieldCheck size={12}/> Área de Risco (Gestor)
                                                </h4>
                                                <div className="space-y-2">
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <div className="relative">
                                                            <input type="checkbox" className="sr-only peer" checked={formData.lockEdit} onChange={e => setFormData({...formData, lockEdit: e.target.checked})} />
                                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Bloquear Edição pelo Atendente</span>
                                                    </label>
                                                    <label className="flex items-center gap-2 cursor-pointer group">
                                                        <div className="relative">
                                                            <input type="checkbox" className="sr-only peer" checked={formData.lockDelete} onChange={e => setFormData({...formData, lockDelete: e.target.checked})} />
                                                            <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-red-300 dark:peer-focus:ring-red-800 rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-red-600"></div>
                                                        </div>
                                                        <span className="text-sm font-medium text-slate-700 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Bloquear Deleção pelo Atendente</span>
                                                    </label>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-6">
                            <div className="w-full max-w-md border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-10 text-center hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors relative bg-slate-50/50 dark:bg-slate-800/50 cursor-pointer group">
                                <input type="file" accept=".csv" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
                                <div className="flex flex-col items-center gap-3">
                                    <div className="p-4 bg-white dark:bg-slate-700 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                                        <Upload size={32} className="text-blue-600 dark:text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-lg">Clique ou arraste o arquivo CSV</p>
                                        <p className="text-sm text-slate-500 dark:text-slate-400">Tamanho máx: 5MB</p>
                                    </div>
                                </div>
                            </div>
                            
                            {importFile && (
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-blue-700 dark:text-blue-300 w-full max-w-md animate-in fade-in">
                                    <FileText size={20} />
                                    <span className="font-medium truncate flex-1">{importFile.name}</span>
                                    <CheckCircle size={20} className="text-green-500" />
                                </div>
                            )}

                            <div className="w-full max-w-md bg-slate-50 dark:bg-slate-700/30 p-4 rounded-xl text-sm text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
                                <p className="font-bold mb-2 flex items-center gap-2"><AlertCircle size={16}/> Formato Esperado:</p>
                                <code className="block bg-slate-100 dark:bg-slate-800 p-2 rounded border border-slate-200 dark:border-slate-600 font-mono text-xs mb-2">
                                    Nome, Telefone, Email, Tags
                                </code>
                                <p className="text-xs text-slate-500">A primeira linha deve ser o cabeçalho. Aceita CSV (,) ou Excel (;).</p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-end gap-3">
                    <button onClick={closeModal} className="px-6 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors">
                        Cancelar
                    </button>
                    
                    {modalMode === 'create' ? (
                        <button 
                            onClick={handleSave} 
                            disabled={isSubmitting || !formData.name || !formData.phone}
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
                            Salvar Contato
                        </button>
                    ) : (
                        <button 
                            onClick={processImport} 
                            disabled={!importFile || isProcessingImport}
                            className="px-8 py-2.5 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-600/20 flex items-center gap-2 transition-all hover:-translate-y-0.5"
                        >
                            {isProcessingImport ? <Loader2 className="animate-spin" size={20} /> : <ArrowRight size={20} />}
                            Iniciar Importação
                        </button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
