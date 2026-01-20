
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, Tag, Trash2, Edit2, Mail, 
  MessageSquare, Save, X, Database, CheckCircle, AlertCircle, Loader2, Download, Upload, UserPlus, ArrowRight, FileText, Send, Lock, ShieldAlert, FileDown, ShieldCheck, Hourglass, Calendar, Settings, Zap, Shield
} from 'lucide-react';
import { Contact, User, AgentPlan, CampaignObjective, AgentPermissions } from '../types';
import * as contactService from '../services/contactService';
import * as teamService from '../services/teamService';
import * as campaignService from '../services/campaignService';
import { useApp } from '../contexts/AppContext';

interface ContactsProps {
    currentUser?: User;
}

const Contacts: React.FC<ContactsProps> = ({ currentUser = { id: 'guest', role: 'agent' } as User }) => {
  const { t } = useApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  
  // Agent Selection State
  const [availableAgents, setAvailableAgents] = useState<{id: string, name: string}[]>([]);

  // Permissions State
  const [userPermissions, setUserPermissions] = useState<AgentPermissions>({
      canCreate: true,
      canEdit: true,
      canDelete: true
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'import'>('create');
  const [isCampaignModalOpen, setIsCampaignModalOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Campaign Modal State
  const [campaignForm, setCampaignForm] = useState({
      name: '',
      date: '',
      objective: 'prospecting' as CampaignObjective,
      message: '',
      // Anti-Ban Defaults - Default to Low Risk
      minDelay: 30,
      maxDelay: 120,
      // Typing Simulation Default (seconds)
      typingDelay: 3
  });

  // Transfer Modal
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [contactToTransfer, setContactToTransfer] = useState<Contact | null>(null);
  const [targetAgentId, setTargetAgentId] = useState<string>(currentUser.id);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    tags: '',
    notes: '',
    ownerId: currentUser.id,
    lockEdit: false,
    lockDelete: false
  });

  // Import State
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isProcessingImport, setIsProcessingImport] = useState(false);

  const [notification, setNotification] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

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

        // Build agent list for dropdowns (Manager + Agents)
        const agentList = agentsData.map(a => ({ id: a.id, name: a.name }));
        if (currentUser.role === 'manager') {
            setAvailableAgents([{ id: currentUser.id, name: 'Gestor Admin (Você)' }, ...agentList]);
            // Manager has all permissions
            setUserPermissions({ canCreate: true, canEdit: true, canDelete: true });
        } else {
            setAvailableAgents([{ id: currentUser.id, name: 'Você' }]);
            // Fetch current agent's specific permissions
            const myAgentProfile = await teamService.getAgentById(currentUser.id);
            if (myAgentProfile && myAgentProfile.permissions) {
                setUserPermissions(myAgentProfile.permissions);
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const allTags = Array.from(new Set(contacts.flatMap(c => c.tags)));

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contact.phone.includes(searchTerm) ||
                          contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const handleSave = async () => {
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      
      if (editingContact) {
        // Validation for Agent: check locks
        if (currentUser.role !== 'manager') {
            if (!userPermissions.canEdit) throw new Error('Você não tem permissão global para editar contatos.');
            if (editingContact.lockEdit) throw new Error('A edição deste contato foi bloqueada pelo gestor.');
        }

        await contactService.updateContact(editingContact.id, {
          ...formData,
          tags: tagsArray
        });
        setNotification({ msg: 'Contato atualizado com sucesso!', type: 'success' });
      } else {
        if (currentUser.role !== 'manager' && !userPermissions.canCreate) {
             throw new Error('Você não tem permissão para criar contatos.');
        }

        await contactService.saveContact({
          ...formData,
          tags: tagsArray,
        }, formData.ownerId);
        setNotification({ msg: 'Contato salvo na base!', type: 'success' });
      }
      
      closeModal();
      loadData(); // Reload to reflect changes
    } catch (error: any) {
      setNotification({ msg: error.message || 'Erro ao salvar', type: 'error' });
    }
  };

  const handleDelete = async (contact: Contact) => {
    // Permission check
    if (currentUser.role !== 'manager') {
        if (!userPermissions.canDelete) {
            setNotification({ msg: 'Você não tem permissão global para deletar contatos.', type: 'error' });
            return;
        }
        if (contact.lockDelete) {
            setNotification({ msg: 'A exclusão deste contato foi bloqueada pelo gestor.', type: 'error' });
            return;
        }
    }

    if (confirm('Excluir contato permanentemente?')) {
      await contactService.deleteContact(contact.id);
      loadData();
      if (selectedContacts.has(contact.id)) {
        const newSet = new Set(selectedContacts);
        newSet.delete(contact.id);
        setSelectedContacts(newSet);
      }
    }
  };

  const openModal = (contact?: Contact) => {
    setModalMode('create');
    if (contact) {
      setEditingContact(contact);
      setFormData({
        name: contact.name,
        phone: contact.phone,
        email: contact.email || '',
        tags: contact.tags.join(', '),
        notes: contact.notes || '',
        ownerId: contact.ownerId,
        lockEdit: contact.lockEdit || false,
        lockDelete: contact.lockDelete || false
      });
    } else {
      setEditingContact(null);
      setFormData({ name: '', phone: '', email: '', tags: '', notes: '', ownerId: currentUser.id, lockEdit: false, lockDelete: false });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingContact(null);
    setImportFile(null);
  };

  const handleTransferClick = (contact: Contact) => {
      setContactToTransfer(contact);
      setTargetAgentId(contact.ownerId !== currentUser.id ? currentUser.id : availableAgents[1]?.id || currentUser.id);
      setIsTransferModalOpen(true);
  };

  const confirmTransfer = async () => {
      if (!contactToTransfer) return;
      try {
          await contactService.assignContact(contactToTransfer.id, targetAgentId);
          setNotification({ msg: 'Contato transferido com sucesso!', type: 'success' });
          setIsTransferModalOpen(false);
          setContactToTransfer(null);
          loadData();
      } catch (error: any) {
          setNotification({ msg: error.message, type: 'error' });
      }
  };

  const handleDownloadTemplate = () => {
      contactService.downloadCSVTemplate();
  };
  
  const handleExportContacts = () => {
      // Exports the contacts currently loaded in the view (which are already filtered by role)
      contactService.exportContactsToCSV(contacts);
      setNotification({ msg: 'Lista de contatos exportada com sucesso!', type: 'success' });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setImportFile(e.target.files[0]);
      }
  };

  const processImport = async () => {
      if (!importFile) return;
      if (currentUser.role !== 'manager' && !userPermissions.canCreate) {
           setNotification({ msg: 'Você não tem permissão para importar contatos.', type: 'error' });
           return;
      }
      
      setIsProcessingImport(true);

      const reader = new FileReader();
      reader.onload = async (e) => {
          const text = e.target?.result as string;
          const lines = text.split('\n');
          // Skip header, filter empty lines
          const parsedContacts = lines.slice(1).filter(l => l.trim()).map(line => {
              const [name, phone, email, tagsStr] = line.split(',');
              return {
                  name: name?.trim(),
                  phone: phone?.trim(),
                  email: email?.trim(),
                  tags: tagsStr ? tagsStr.split(';').map(t => t.trim()) : []
              };
          }).filter(c => c.name && c.phone);

          try {
              const count = await contactService.bulkImportContacts(parsedContacts, formData.ownerId);
              setNotification({ msg: `${count} contatos importados com sucesso!`, type: 'success' });
              closeModal();
              loadData();
          } catch (error: any) {
              setNotification({ msg: error.message, type: 'error' });
          } finally {
              setIsProcessingImport(false);
          }
      };
      reader.readAsText(importFile);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedContacts);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedContacts(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedContacts.size === filteredContacts.length) {
      setSelectedContacts(new Set());
    } else {
      setSelectedContacts(new Set(filteredContacts.map(c => c.id)));
    }
  };

  const handleLaunchCampaign = () => {
    // Reset form with default safe values
    setCampaignForm({ 
        name: '', 
        date: '', 
        objective: 'prospecting', 
        message: '',
        minDelay: 30, // Default Low Risk
        maxDelay: 120, // Default Low Risk
        typingDelay: 3
    });
    setIsCampaignModalOpen(true);
  };

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.date || !campaignForm.message.trim()) return;
    
    // Safety validation
    if (campaignForm.minDelay < 5 || campaignForm.maxDelay < campaignForm.minDelay) {
        setNotification({ msg: 'Configuração de intervalo inválida.', type: 'error' });
        return;
    }

    try {
        await campaignService.createCampaign({
            name: campaignForm.name,
            scheduledDate: campaignForm.date,
            objective: campaignForm.objective,
            agentName: currentUser.name,
            ownerId: currentUser.id,
            totalContacts: selectedContacts.size,
            workflow: [{
                id: 'default-1',
                type: 'text',
                content: campaignForm.message,
                order: 1,
                // Convert seconds to ms
                delay: campaignForm.typingDelay * 1000 
            }],
            minDelay: campaignForm.minDelay, 
            maxDelay: campaignForm.maxDelay
        });

        setNotification({ 
            msg: `Campanha "${campaignForm.name}" criada com sucesso! Veja na aba Campanhas.`, 
            type: 'success' 
        });
        
        setIsCampaignModalOpen(false);
        setSelectedContacts(new Set());
    } catch (e) {
        setNotification({ msg: 'Erro ao criar campanha', type: 'error' });
    }
  };

  const getAgentName = (id: string) => availableAgents.find(a => a.id === id)?.name || 'Desconhecido';

  const getObjectiveLabel = (obj: CampaignObjective) => {
      switch(obj) {
          case 'prospecting': return t('prospecting');
          case 'communication': return t('communication');
          case 'promotion': return t('promotion');
          case 'sales': return t('sales');
          case 'maintenance': return t('maintenance');
          default: return obj;
      }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="text-blue-600" size={24}/>
            {t('contacts_base_title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{t('contacts_subtitle')}</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
            <button 
                onClick={handleDownloadTemplate}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                title="Baixar Modelo CSV"
            >
                <Download size={16} />
                {t('download_template')}
            </button>
            
            <button 
                onClick={handleExportContacts}
                className="bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-medium"
                title="Exportar meus contatos"
            >
                <FileDown size={16} />
                Exportar
            </button>

            <div className="bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 h-10 flex items-center">
                {contacts.length} Contatos
            </div>
            
            {userPermissions.canCreate ? (
                <button 
                    onClick={() => openModal()}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-shadow shadow-md"
                >
                    <Plus size={18} />
                    {t('add_contact')}
                </button>
            ) : (
                <button 
                    disabled
                    className="bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500 px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed"
                >
                    <Lock size={16} />
                    {t('add_contact')}
                </button>
            )}
        </div>
      </div>

      {notification && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${notification.type === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'} animate-in slide-in-from-top-2`}>
            {notification.type === 'success' ? <CheckCircle size={18}/> : <AlertCircle size={18}/>}
            {notification.msg}
            <button onClick={() => setNotification(null)} className="ml-auto hover:opacity-75"><X size={16}/></button>
        </div>
      )}

      {/* Filters & Actions */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                    type="text" 
                    placeholder={t('search')} 
                    className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                />
            </div>
            <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select 
                    className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white dark:bg-slate-700 dark:text-white transition-colors"
                    value={selectedTag}
                    onChange={e => setSelectedTag(e.target.value)}
                >
                    <option value="all">Todas as Tags</option>
                    {allTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
            </div>
        </div>

        {selectedContacts.size > 0 && (
            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{selectedContacts.size} selecionados</span>
                <button 
                    onClick={handleLaunchCampaign}
                    className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm"
                >
                    <MessageSquare size={16} />
                    {t('quick_campaign')}
                </button>
            </div>
        )}
      </div>

      {/* Contacts Table */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
        ) : filteredContacts.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-slate-400">
                <Database className="mx-auto mb-3 opacity-20" size={48} />
                <p>Nenhum contato encontrado.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-600">
                        <tr>
                            <th className="px-6 py-4 w-12">
                                <input 
                                    type="checkbox" 
                                    className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                    checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0}
                                    onChange={toggleSelectAll}
                                />
                            </th>
                            <th className="px-6 py-4">{t('name')}</th>
                            <th className="px-6 py-4">{t('tags')}</th>
                            {currentUser.role === 'manager' && <th className="px-6 py-4">Responsável</th>}
                            <th className="px-6 py-4 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredContacts.map(contact => (
                            <tr key={contact.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors ${selectedContacts.has(contact.id) ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
                                <td className="px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                        checked={selectedContacts.has(contact.id)}
                                        onChange={() => toggleSelection(contact.id)}
                                    />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="font-medium text-slate-900 dark:text-white flex items-center gap-2">
                                        {contact.name}
                                        {(contact.lockEdit || contact.lockDelete) && <Lock size={12} className="text-amber-500" title="Restrições aplicadas" />}
                                    </div>
                                    <div className="text-slate-500 dark:text-slate-400 flex items-center gap-2 text-xs mt-1">
                                        <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-1.5 rounded">{contact.phone}</span>
                                        {contact.email && <span className="flex items-center gap-1"><Mail size={10}/> {contact.email}</span>}
                                    </div>
                                    {contact.notes && <div className="text-xs text-slate-400 italic mt-1 truncate max-w-[200px]">{contact.notes}</div>}
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1">
                                        {contact.tags.map(tag => (
                                            <span key={tag} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                                <Tag size={10} /> {tag}
                                            </span>
                                        ))}
                                        {contact.tags.length === 0 && <span className="text-slate-400 text-xs">-</span>}
                                    </div>
                                </td>
                                {currentUser.role === 'manager' && (
                                    <td className="px-6 py-4">
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                            {getAgentName(contact.ownerId)}
                                        </span>
                                    </td>
                                )}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1">
                                        {currentUser.role === 'manager' && (
                                            <button 
                                                onClick={() => handleTransferClick(contact)}
                                                className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                                                title={t('transfer')}
                                            >
                                                <UserPlus size={16} />
                                            </button>
                                        )}
                                        
                                        {(userPermissions.canEdit && !contact.lockEdit) || currentUser.role === 'manager' ? (
                                             <button onClick={() => openModal(contact)} className="p-2 text-slate-400 hover:text-blue-600 transition-colors">
                                                <Edit2 size={16} />
                                             </button>
                                        ) : (
                                            <button disabled className="p-2 text-slate-200 dark:text-slate-600 cursor-not-allowed">
                                                <Edit2 size={16} />
                                            </button>
                                        )}

                                        {(userPermissions.canDelete && !contact.lockDelete) || currentUser.role === 'manager' ? (
                                            <button onClick={() => handleDelete(contact)} className="p-2 text-slate-400 hover:text-red-600 transition-colors">
                                                <Trash2 size={16} />
                                            </button>
                                        ) : (
                                            <button disabled className="p-2 text-slate-200 dark:text-slate-600 cursor-not-allowed">
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-lg shadow-2xl animate-in zoom-in-95 transition-colors">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingContact ? t('edit_contact') : t('add_contacts_modal')}</h3>
                    <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={20}/></button>
                </div>
                
                {/* Tabs */}
                {!editingContact && (
                    <div className="flex border-b border-slate-100 dark:border-slate-700">
                        <button 
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${modalMode === 'create' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            onClick={() => setModalMode('create')}
                        >
                            {t('manual_form')}
                        </button>
                        <button 
                            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${modalMode === 'import' ? 'border-blue-600 text-blue-600 dark:text-blue-400' : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                            onClick={() => setModalMode('import')}
                        >
                            {t('import_csv')}
                        </button>
                    </div>
                )}

                <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                    {/* ... (Existing modal content remains unchanged) ... */}
                    {/* Manager: Select Target Agent */}
                    {currentUser.role === 'manager' && (
                        <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600">
                            <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1 uppercase">
                                {modalMode === 'import' ? 'Importar para a carteira de:' : t('assign_to')}
                            </label>
                            <select 
                                className="w-full bg-white dark:bg-slate-700 dark:text-white border border-slate-300 dark:border-slate-600 rounded px-2 py-1.5 text-sm outline-none focus:ring-1 focus:ring-blue-500"
                                value={formData.ownerId}
                                onChange={e => setFormData({...formData, ownerId: e.target.value})}
                            >
                                {availableAgents.map(agent => (
                                    <option key={agent.id} value={agent.id}>{agent.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {modalMode === 'create' ? (
                        <>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('full_name')}</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('whatsapp_number')}</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    placeholder="Ex: 5511999998888"
                                    value={formData.phone}
                                    onChange={e => setFormData({...formData, phone: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('email')}</label>
                                <input 
                                    type="email" 
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('tags')}</label>
                                <input 
                                    type="text" 
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
                                    placeholder={t('tags_placeholder')}
                                    value={formData.tags}
                                    onChange={e => setFormData({...formData, tags: e.target.value})}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t('obs_label')}</label>
                                <textarea 
                                    className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none h-20 transition-colors"
                                    value={formData.notes}
                                    onChange={e => setFormData({...formData, notes: e.target.value})}
                                ></textarea>
                            </div>

                            {/* Manager Controls: Locks */}
                            {currentUser.role === 'manager' && (
                                <div className="pt-4 mt-2 border-t border-slate-100 dark:border-slate-700">
                                    <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-1">
                                        <ShieldAlert size={14}/> {t('security_locks')}
                                    </h4>
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={formData.lockEdit}
                                                onChange={e => setFormData({...formData, lockEdit: e.target.checked})}
                                            />
                                            {t('lock_edit')}
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
                                            <input 
                                                type="checkbox" 
                                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                checked={formData.lockDelete}
                                                onChange={e => setFormData({...formData, lockDelete: e.target.checked})}
                                            />
                                            {t('lock_delete')}
                                        </label>
                                    </div>
                                </div>
                            )}

                            <div className="pt-2">
                                <button 
                                    onClick={handleSave}
                                    disabled={!formData.name || !formData.phone}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    <Save size={18} />
                                    {t('save')}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg text-sm text-blue-800 dark:text-blue-200 border border-blue-100 dark:border-blue-800 flex gap-2 items-start">
                                <FileText className="shrink-0 mt-0.5" size={16} />
                                <div>
                                    <strong>Importante:</strong> Certifique-se de que o arquivo CSV esteja no formato correto. 
                                    <button onClick={handleDownloadTemplate} className="underline ml-1 font-bold hover:text-blue-900 dark:hover:text-blue-100">Baixar modelo</button>
                                </div>
                            </div>

                            <div className="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl p-8 text-center hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors relative">
                                <input 
                                    type="file" 
                                    accept=".csv" 
                                    onChange={handleFileChange} 
                                    className="absolute inset-0 opacity-0 cursor-pointer" 
                                />
                                {importFile ? (
                                    <div className="flex flex-col items-center text-slate-700 dark:text-slate-200">
                                        <FileText size={32} className="text-blue-500 mb-2"/>
                                        <span className="font-medium">{importFile.name}</span>
                                        <span className="text-xs text-slate-500 dark:text-slate-400">{(importFile.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                ) : (
                                    <div className="text-slate-500 dark:text-slate-400">
                                        <Upload className="mx-auto mb-2" size={32} />
                                        <p className="font-medium">{t('drag_csv')}</p>
                                    </div>
                                )}
                            </div>

                            <button 
                                onClick={processImport}
                                disabled={!importFile || isProcessingImport}
                                className="w-full bg-green-600 text-white py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isProcessingImport ? <Loader2 className="animate-spin" /> : <Upload size={18} />}
                                {t('process_import')}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && contactToTransfer && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl w-full max-w-sm shadow-2xl p-6 transition-colors">
                <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-4">{t('transfer_contact')}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    Transferir <strong>{contactToTransfer.name}</strong> para:
                </p>
                
                <select 
                    className="w-full bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 mb-6 outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                    value={targetAgentId}
                    onChange={e => setTargetAgentId(e.target.value)}
                >
                    {availableAgents.map(agent => (
                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                    ))}
                </select>

                <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">{t('cancel')}</button>
                    <button onClick={confirmTransfer} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2">
                        <ArrowRight size={16} /> {t('transfer')}
                    </button>
                </div>
            </div>
          </div>
      )}

      {/* Quick Campaign Modal (UPDATED LAYOUT) */}
      {isCampaignModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-4xl shadow-2xl animate-in zoom-in-95 transition-colors max-h-[90vh] overflow-y-auto">
                  
                  {/* Header */}
                  <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start">
                      <div>
                          <h3 className="text-xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              <MessageSquare className="text-indigo-600" />
                              {t('quick_campaign')}
                          </h3>
                          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                              {t('quick_campaign_subtitle')}
                          </p>
                      </div>
                      <button onClick={() => setIsCampaignModalOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                          <X size={24}/>
                      </button>
                  </div>

                  <div className="p-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          
                          {/* Left Column: Configuration */}
                          <div className="space-y-6">
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                  <Settings size={16}/> Configurações
                              </h4>

                              <div className="space-y-4">
                                  <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('campaign_name')}</label>
                                    <input 
                                        type="text" 
                                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none transition-colors" 
                                        placeholder="Ex: Aviso Rápido" 
                                        autoFocus
                                        value={campaignForm.name}
                                        onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1">{t('execution_date')}</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18}/>
                                        <input 
                                            type="date" 
                                            className="w-full pl-10 pr-3 py-2.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-colors"
                                            value={campaignForm.date}
                                            onChange={(e) => setCampaignForm({...campaignForm, date: e.target.value})}
                                        />
                                    </div>
                                  </div>

                                  <div>
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2">{t('objective')}</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {(['prospecting', 'communication', 'promotion', 'sales', 'maintenance'] as const).map((obj) => (
                                            <button
                                                key={obj}
                                                onClick={() => setCampaignForm({...campaignForm, objective: obj})}
                                                className={`py-2 px-3 rounded-lg text-xs font-medium border text-left transition-all ${
                                                    campaignForm.objective === obj 
                                                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500' 
                                                    : 'border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                                                }`}
                                            >
                                                {getObjectiveLabel(obj)}
                                            </button>
                                        ))}
                                    </div>
                                  </div>

                                  {/* Anti-Ban & Safety Settings (UPDATED SELECTION) */}
                                  <div className="space-y-3">
                                      <div className="flex justify-between items-center mb-1">
                                          <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-1">
                                              <ShieldCheck size={14} /> Segurança Anti-Ban
                                          </h4>
                                      </div>
                                      
                                      <div className="space-y-2">
                                          {[
                                              { id: 'high', label: 'ALTO RISCO DE BANIMENTO', sub: '05 a 30 segundos', min: 5, max: 30, color: 'text-red-700 dark:text-red-400', bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', icon: Zap },
                                              { id: 'moderate', label: 'RISCO MODERADO DE BANIMENTO', sub: '20 a 60 segundos', min: 20, max: 60, color: 'text-amber-700 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', icon: Shield },
                                              { id: 'low', label: 'BAIXO RISCO DE BANIMENTO', sub: '30 a 120 segundos', min: 30, max: 120, color: 'text-green-700 dark:text-green-400', bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', icon: ShieldCheck }
                                          ].map((option) => (
                                              <button
                                                  key={option.id}
                                                  onClick={() => setCampaignForm({...campaignForm, minDelay: option.min, maxDelay: option.max})}
                                                  className={`w-full flex items-center justify-between p-3 rounded-lg border-2 transition-all ${
                                                      campaignForm.minDelay === option.min 
                                                      ? `${option.border} ${option.bg} ring-1 ring-offset-1 dark:ring-offset-slate-800 ring-transparent` 
                                                      : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 opacity-60 hover:opacity-100'
                                                  }`}
                                              >
                                                  <div className="flex items-center gap-3">
                                                      <div className={`p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm ${option.color}`}>
                                                          <option.icon size={18} />
                                                      </div>
                                                      <div className="text-left">
                                                          <span className={`block text-xs font-bold ${option.color}`}>{option.label}</span>
                                                          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Intervalo: {option.sub}</span>
                                                      </div>
                                                  </div>
                                                  {campaignForm.minDelay === option.min && (
                                                      <CheckCircle size={18} className={option.color.split(' ')[0]} />
                                                  )}
                                              </button>
                                          ))}
                                      </div>
                                  </div>
                              </div>
                          </div>

                          {/* Right Column: Message Content */}
                          <div className="space-y-6 flex flex-col h-full">
                              <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 dark:border-slate-700 pb-2">
                                  <Edit2 size={16}/> Composição
                              </h4>

                              <div className="space-y-4 flex-1 flex flex-col">
                                 <div className="flex justify-between items-end">
                                    <label className="block text-sm font-bold text-slate-700 dark:text-slate-300">{t('message_content')}</label>
                                    <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-1 rounded text-xs text-indigo-700 dark:text-indigo-300 border border-indigo-100 dark:border-indigo-800">
                                        <Hourglass size={12} />
                                        <span className="font-bold">Digitando:</span>
                                        <input 
                                            type="number" 
                                            min="1" 
                                            className="w-8 bg-transparent border-b border-indigo-300 dark:border-indigo-600 text-center outline-none font-bold"
                                            value={campaignForm.typingDelay}
                                            onChange={e => setCampaignForm({...campaignForm, typingDelay: Number(e.target.value)})}
                                        />
                                        <span>s</span>
                                    </div>
                                 </div>
                                
                                <div className="flex-1 relative">
                                    <textarea 
                                        className="w-full h-full min-h-[250px] border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-xl p-4 focus:ring-2 focus:ring-indigo-500 outline-none resize-none text-base leading-relaxed shadow-sm transition-colors"
                                        placeholder={t('type_message_here')}
                                        value={campaignForm.message}
                                        onChange={(e) => setCampaignForm({...campaignForm, message: e.target.value})}
                                    ></textarea>
                                    <div className="absolute bottom-4 right-4 text-xs text-slate-400 bg-white/80 dark:bg-slate-800/80 px-2 py-1 rounded border border-slate-200 dark:border-slate-600">
                                        {campaignForm.message.length} caracteres
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-2">
                                    <span className="font-bold">Variáveis disponíveis:</span>
                                    <code className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">{`{nome}`}</code>
                                    <code className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 px-1.5 py-0.5 rounded text-indigo-600 dark:text-indigo-400 font-mono">{`{telefone}`}</code>
                                </div>
                              </div>
                          </div>
                      </div>

                      <div className="flex gap-4 justify-end pt-6 mt-6 border-t border-slate-100 dark:border-slate-700">
                          <button 
                            onClick={() => setIsCampaignModalOpen(false)} 
                            className="px-6 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl font-medium transition-colors"
                          >
                              {t('cancel')}
                          </button>
                          <button 
                            onClick={handleCreateCampaign} 
                            disabled={!campaignForm.name || !campaignForm.date || !campaignForm.message.trim()}
                            className="px-8 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 shadow-lg shadow-indigo-200 dark:shadow-none transition-all hover:-translate-y-1"
                          >
                              <Send size={18} />
                              {t('start_campaign')}
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Contacts;
