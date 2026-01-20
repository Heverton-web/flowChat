
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, Tag, Trash2, Edit2, Mail, 
  MessageSquare, Save, X, Database, CheckCircle, AlertCircle, Loader2, Download, Upload, UserPlus, ArrowRight, FileDown, ShieldCheck, Lock, Phone, User as UserIcon, FileText, Briefcase, Settings, Copy, Calendar, MoreHorizontal, Layers
} from 'lucide-react';
import { Contact, User, CampaignObjective, AgentPermissions } from '../types';
import * as contactService from '../services/contactService';
import * as teamService from '../services/teamService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface ContactsProps {
    currentUser?: User;
}

const Contacts: React.FC<ContactsProps> = ({ currentUser = { id: 'guest', role: 'agent' } as User }) => {
  const { t, showToast } = useApp();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtering & View States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [viewSegment, setViewSegment] = useState<'all' | 'mine' | 'leads' | 'vip'>('all');
  
  const [selectedContacts, setSelectedContacts] = useState<Set<string>>(new Set());
  const [availableAgents, setAvailableAgents] = useState<{id: string, name: string}[]>([]);
  const [userPermissions, setUserPermissions] = useState<AgentPermissions>({
      canCreate: true, canEdit: true, canDelete: true,
      canCreateTags: true, canEditTags: true, canDeleteTags: true
  });

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'import'>('create');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  
  // Tag Manager Modal State
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [allSystemTags, setAllSystemTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [editingTag, setEditingTag] = useState<{old: string, new: string} | null>(null);
  const [tagToDelete, setTagToDelete] = useState<string | null>(null);

  // Delete Modal
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);

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
        const [contactsData, agentsData, tagsData] = await Promise.all([
            contactService.getContacts(currentUser.id, currentUser.role),
            teamService.getAgents(),
            contactService.getTags()
        ]);
        setContacts(contactsData);
        setAllSystemTags(tagsData);
        
        const agentList = agentsData.map(a => ({ id: a.id, name: a.name }));
        if (!agentList.find(a => a.id === 'manager-1')) {
            agentList.unshift({ id: 'manager-1', name: 'Gestor Admin' });
        }
        setAvailableAgents(agentList);

        if (currentUser.role !== 'manager') {
            const myAgentProfile = await teamService.getAgentById(currentUser.id);
            if (myAgentProfile && myAgentProfile.permissions) setUserPermissions(myAgentProfile.permissions);
        } else {
            setUserPermissions({ 
                canCreate: true, canEdit: true, canDelete: true,
                canCreateTags: true, canEditTags: true, canDeleteTags: true
            });
        }
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  // --- Filtering Logic ---
  const filteredContacts = contacts.filter(contact => {
    // 1. Text Search
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          contact.phone.includes(searchTerm) ||
                          contact.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    // 2. Tag Filter (Dropdown)
    const matchesTag = selectedTag === 'all' || contact.tags.includes(selectedTag);

    // 3. Segment Tabs
    let matchesSegment = true;
    if (viewSegment === 'mine') matchesSegment = contact.ownerId === currentUser.id;
    if (viewSegment === 'leads') matchesSegment = contact.tags.some(t => t.toLowerCase().includes('lead') || t.toLowerCase().includes('novo'));
    if (viewSegment === 'vip') matchesSegment = contact.tags.some(t => t.toLowerCase().includes('vip'));

    return matchesSearch && matchesTag && matchesSegment;
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

  // ... (Tag Management functions preserved) ...
  const handleCreateTag = async () => {
      if (!newTagInput.trim()) return;
      try {
          await contactService.createTag(newTagInput.trim());
          setNewTagInput('');
          setAllSystemTags(await contactService.getTags());
          showToast('Tag criada!', 'success');
      } catch (e: any) { showToast(e.message, 'error'); }
  };
  const handleRenameTag = async () => {
      if (!editingTag || !editingTag.new.trim()) return;
      try {
          await contactService.updateTag(editingTag.old, editingTag.new.trim());
          setEditingTag(null);
          loadData();
          showToast('Tag renomeada!', 'success');
      } catch (e: any) { showToast(e.message, 'error'); }
  };
  const confirmDeleteTag = async () => {
      if (!tagToDelete) return;
      try {
          setAllSystemTags(await contactService.deleteTag(tagToDelete));
          setContacts(await contactService.getContacts(currentUser.id, currentUser.role));
          showToast('Tag excluída!', 'success');
          setTagToDelete(null);
      } catch (e: any) { showToast(e.message, 'error'); }
  };
  const toggleTagSelection = (tag: string) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
    setFormData({ ...formData, tags: newTags.join(', ') });
  };

  // Actions
  const handleDeleteClick = (contact: Contact) => {
    if (currentUser.role !== 'manager') {
        if (!userPermissions.canDelete || contact.lockDelete) {
            showToast('Ação não permitida.', 'error');
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

  const handleBulkDelete = async () => {
      // In a real app, this would be a bulk API call
      // For mock simplicity, we loop (not efficient for production but ok for demo)
      setIsSubmitting(true);
      for (const id of selectedContacts) {
          await contactService.deleteContact(id);
      }
      setIsSubmitting(false);
      setSelectedContacts(new Set());
      loadData();
      showToast(`${selectedContacts.size} contatos excluídos.`, 'success');
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
      const defaultTarget = availableAgents.find(a => a.id !== contact.ownerId);
      setTargetAgentId(defaultTarget ? defaultTarget.id : '');
      setIsTransferModalOpen(true);
  };

  const confirmTransfer = async () => {
      if (!contactToTransfer || !targetAgentId) return;
      try {
          await contactService.assignContact(contactToTransfer.id, targetAgentId);
          showToast('Transferido com sucesso!', 'success');
          setIsTransferModalOpen(false);
          setContactToTransfer(null);
          loadData();
      } catch (error: any) { showToast(error.message, 'error'); }
  };

  const processImport = async () => {
      if (!importFile) return;
      setIsProcessingImport(true);
      const reader = new FileReader();
      reader.onload = async (e) => {
          // ... (existing import logic preserved) ...
          const text = e.target?.result as string;
          const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim());
          if (lines.length < 2) { showToast('Arquivo inválido.', 'error'); setIsProcessingImport(false); return; }
          const header = lines[0];
          const delimiter = header.includes(';') ? ';' : ',';
          const parsedContacts = lines.slice(1).map(line => {
              if (!line.trim()) return null;
              const parts = line.split(delimiter);
              const clean = (val: string) => val ? val.trim().replace(/^["']|["']$/g, '') : '';
              const name = clean(parts[0]);
              const phoneRaw = clean(parts[1]);
              const email = clean(parts[2]);
              const tagsStr = clean(parts[3]);
              if (!name || !phoneRaw) return null;
              const phone = phoneRaw.replace(/\D/g, '');
              if (phone.length < 8) return null;
              return { name, phone, email, tags: tagsStr ? tagsStr.split(';').map(t => clean(t)) : [] };
          }).filter((c): c is NonNullable<typeof c> => c !== null);

          try {
              const count = await contactService.bulkImportContacts(parsedContacts, formData.ownerId);
              showToast(`${count} importados!`, 'success');
              closeModal();
              loadData();
          } catch (error: any) { showToast(error.message, 'error'); } 
          finally { setIsProcessingImport(false); }
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

  const getAgentName = (id: string) => availableAgents.find(a => a.id === id)?.name || 'Desconhecido';
  const getAvatarColor = (name: string) => {
      const colors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      showToast('Copiado!', 'success');
  };

  return (
    <div className="space-y-6 pb-24 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Database className="text-blue-600" size={24}/>
            {t('contacts_base_title')}
          </h2>
          <p className="text-slate-500 dark:text-slate-400">{t('contacts_subtitle')}</p>
        </div>
        
        <div className="flex gap-2">
            {/* Quick Filter Tabs */}
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex">
                <button onClick={() => setViewSegment('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewSegment === 'all' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Todos</button>
                <button onClick={() => setViewSegment('mine')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewSegment === 'mine' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Meus</button>
                <button onClick={() => setViewSegment('leads')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewSegment === 'leads' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Leads</button>
                <button onClick={() => setViewSegment('vip')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${viewSegment === 'vip' ? 'bg-white dark:bg-slate-600 text-amber-600 dark:text-amber-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>VIP</button>
            </div>

            {userPermissions.canCreate ? (
                <button onClick={() => openModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors text-sm font-bold">
                    <Plus size={18} /> {t('add_contact')}
                </button>
            ) : (
                <button disabled className="bg-slate-200 dark:bg-slate-700 text-slate-400 px-4 py-2 rounded-lg flex items-center gap-2 cursor-not-allowed">
                    <Lock size={16} /> {t('add_contact')}
                </button>
            )}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between transition-colors">
        <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input type="text" placeholder="Nome, email ou telefone..." className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="relative flex items-center gap-2">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                <select className="pl-9 pr-8 py-2 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white dark:bg-slate-700 dark:text-white text-sm" value={selectedTag} onChange={e => setSelectedTag(e.target.value)}>
                    <option value="all">Todas as Tags</option>
                    {allSystemTags.map(tag => <option key={tag} value={tag}>{tag}</option>)}
                </select>
                <button onClick={() => setIsTagManagerOpen(true)} className="p-2 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors" title="Gerenciar Tags">
                    <Settings size={18} />
                </button>
            </div>
        </div>
        
        <div className="flex gap-2">
             <button onClick={contactService.downloadCSVTemplate} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" title="Baixar Modelo">
                <Download size={18} />
             </button>
             <button onClick={() => {contactService.exportContactsToCSV(filteredContacts); showToast('Exportando...', 'success')}} className="p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" title="Exportar Lista">
                <FileDown size={18} />
             </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden transition-colors">
        {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
        ) : filteredContacts.length === 0 ? (
            <div className="p-20 text-center text-slate-500 flex flex-col items-center">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <UserIcon size={32} className="text-slate-400" />
                </div>
                <h3 className="font-bold text-lg mb-1">Nenhum contato encontrado</h3>
                <p className="text-sm">Tente ajustar seus filtros ou adicione novos contatos.</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-300 font-semibold border-b border-slate-100 dark:border-slate-600">
                        <tr>
                            <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" checked={selectedContacts.size === filteredContacts.length && filteredContacts.length > 0} onChange={toggleSelectAll} /></th>
                            <th className="px-6 py-4">{t('name')}</th>
                            <th className="px-6 py-4">{t('tags')}</th>
                            <th className="px-6 py-4 hidden md:table-cell">Responsável</th>
                            <th className="px-6 py-4 hidden lg:table-cell">Criado em</th>
                            <th className="px-6 py-4 text-right">{t('actions')}</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {filteredContacts.map(contact => (
                            <tr key={contact.id} className={`hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group ${selectedContacts.has(contact.id) ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                                <td className="px-6 py-4"><input type="checkbox" className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 w-4 h-4" checked={selectedContacts.has(contact.id)} onChange={() => toggleSelection(contact.id)} /></td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${getAvatarColor(contact.name)}`}>
                                            {contact.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                                                {contact.name}
                                                {contact.lockEdit && <Lock size={10} className="text-amber-500" />}
                                            </div>
                                            <div className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-2 font-mono mt-0.5">
                                                <Phone size={10} /> {contact.phone}
                                                <button onClick={() => copyToClipboard(contact.phone)} className="opacity-0 group-hover:opacity-100 hover:text-blue-500 transition-opacity"><Copy size={10}/></button>
                                            </div>
                                            {contact.email && <div className="text-slate-400 text-[10px] flex items-center gap-1 mt-0.5"><Mail size={10}/> {contact.email}</div>}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex flex-wrap gap-1.5 max-w-[200px]">
                                        {contact.tags.slice(0, 3).map((tag, idx) => (
                                            <span key={idx} className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-md text-[10px] font-bold border border-slate-200 dark:border-slate-600 uppercase tracking-wide">{tag}</span>
                                        ))}
                                        {contact.tags.length > 3 && <span className="text-xs text-slate-400 self-center">+{contact.tags.length - 3}</span>}
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden md:table-cell">
                                    <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-full pr-3 pl-1 py-1 w-fit border border-slate-100 dark:border-slate-600">
                                        <div className="w-6 h-6 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                                            {getAgentName(contact.ownerId).charAt(0)}
                                        </div>
                                        <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px]">{getAgentName(contact.ownerId)}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 hidden lg:table-cell text-xs text-slate-500">
                                    <div className="flex items-center gap-1">
                                        <Calendar size={12}/>
                                        {new Date(contact.createdAt).toLocaleDateString()}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={() => openModal(contact)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"><Edit2 size={16} /></button>
                                        <button onClick={() => handleDeleteClick(contact)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"><Trash2 size={16} /></button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
      </div>

      {/* Floating Bulk Actions Bar */}
      {selectedContacts.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-slate-800 rounded-full shadow-2xl border border-slate-200 dark:border-slate-700 py-3 px-6 flex items-center gap-6 animate-in slide-in-from-bottom-10 z-40">
              <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-700 pr-6">
                  <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{selectedContacts.size}</div>
                  <span className="text-sm font-bold text-slate-700 dark:text-white">Selecionados</span>
              </div>
              
              <div className="flex items-center gap-2">
                  <button onClick={handleBulkDelete} disabled={isSubmitting} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                      Excluir
                  </button>
                  <button onClick={() => {contactService.exportContactsToCSV(contacts.filter(c => selectedContacts.has(c.id))); showToast('Exportando seleção...', 'success')}} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors">
                      <FileDown size={16} /> Exportar
                  </button>
                  <button className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm ml-2">
                      <MessageSquare size={16} /> Campanha
                  </button>
              </div>

              <button onClick={() => setSelectedContacts(new Set())} className="ml-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400">
                  <X size={16} />
              </button>
          </div>
      )}

      {/* --- MODALS (Reused/Improved) --- */}
      <Modal isOpen={isTagManagerOpen} onClose={() => setIsTagManagerOpen(false)} title="Gestão de Tags" footer={<button onClick={() => setIsTagManagerOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Fechar</button>}>
          <div className="space-y-4">
              <div className="flex gap-2">
                  <input type="text" placeholder="Nova tag..." className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none" value={newTagInput} onChange={e => setNewTagInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateTag()} />
                  <button onClick={handleCreateTag} className="bg-blue-600 text-white p-2 rounded-lg"><Plus/></button>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                  {allSystemTags.map(tag => (
                      <div key={tag} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded hover:bg-slate-100">
                          {editingTag?.old === tag ? (
                              <div className="flex flex-1 gap-2"><input autoFocus value={editingTag.new} onChange={e => setEditingTag({...editingTag, new: e.target.value})} className="flex-1 text-sm bg-white dark:bg-slate-600 border rounded px-1"/><button onClick={handleRenameTag} className="text-green-500"><CheckCircle size={14}/></button></div>
                          ) : (
                              <span className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200"><Tag size={14}/> {tag}</span>
                          )}
                          <div className="flex gap-1">
                              {!editingTag && <button onClick={() => setEditingTag({old: tag, new: tag})} className="p-1 text-blue-500"><Edit2 size={14}/></button>}
                              {!editingTag && <button onClick={() => setTagToDelete(tag)} className="p-1 text-red-500"><Trash2 size={14}/></button>}
                          </div>
                      </div>
                  ))}
              </div>
          </div>
      </Modal>

      <Modal isOpen={!!tagToDelete} onClose={() => setTagToDelete(null)} title="Excluir Tag?" type="danger" zIndex={60} footer={<><button onClick={() => setTagToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Cancelar</button><button onClick={confirmDeleteTag} className="px-4 py-2 bg-red-600 text-white rounded-lg">Excluir</button></>}>
          Tem certeza? A tag <strong>{tagToDelete}</strong> será removida de todos os contatos.
      </Modal>

      <Modal isOpen={!!contactToDelete} onClose={() => setContactToDelete(null)} title="Excluir Contato" type="danger" footer={<><button onClick={() => setContactToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Cancelar</button><button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Excluir Definitivamente</button></>}>
          Você está prestes a excluir <strong>{contactToDelete?.name}</strong>. Esta ação não pode ser desfeita.
      </Modal>

      {/* Main Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-700">
                <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${editingContact ? 'bg-indigo-100 text-indigo-600' : 'bg-blue-100 text-blue-600'}`}>
                            {editingContact ? <Edit2 size={20} /> : <UserPlus size={20} />}
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white">{editingContact ? 'Editar Contato' : 'Novo Contato'}</h3>
                    </div>
                    <button onClick={closeModal}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
                </div>

                {!editingContact && (
                    <div className="flex border-b border-slate-100 dark:border-slate-700 px-6 gap-6">
                        <button onClick={() => setModalMode('create')} className={`py-3 text-sm font-bold border-b-2 ${modalMode === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Manual</button>
                        <button onClick={() => setModalMode('import')} className={`py-3 text-sm font-bold border-b-2 ${modalMode === 'import' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500'}`}>Importação CSV</button>
                    </div>
                )}

                <div className="p-6 overflow-y-auto flex-1">
                    {modalMode === 'create' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300">Nome</label><input type="text" className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="Nome completo" /></div>
                                <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300">WhatsApp</label><input type="text" className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white font-mono" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="5511999998888" /></div>
                                <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300">Email</label><input type="email" className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /></div>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm font-bold text-slate-700 dark:text-slate-300">Tags</label>
                                    <input type="text" className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={formData.tags} onChange={e => setFormData({...formData, tags: e.target.value})} placeholder="Ex: Vip, Lead" />
                                    <div className="flex flex-wrap gap-1 mt-2">{allSystemTags.map(tag => <button key={tag} onClick={() => toggleTagSelection(tag)} className={`text-[10px] px-2 py-1 rounded border ${formData.tags.includes(tag) ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-slate-50 text-slate-500'}`}>{tag}</button>)}</div>
                                </div>
                                <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300">Notas</label><textarea rows={3} className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                                {currentUser.role === 'manager' && (
                                    <div className="pt-2 space-y-2">
                                        <label className="flex items-center gap-2"><input type="checkbox" checked={formData.lockEdit} onChange={e => setFormData({...formData, lockEdit: e.target.checked})}/><span className="text-sm text-slate-600 dark:text-slate-300">Bloquear Edição</span></label>
                                        <label className="flex items-center gap-2"><input type="checkbox" checked={formData.lockDelete} onChange={e => setFormData({...formData, lockDelete: e.target.checked})}/><span className="text-sm text-slate-600 dark:text-slate-300">Bloquear Exclusão</span></label>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 relative">
                            <input type="file" accept=".csv" onChange={e => {if(e.target.files?.[0]) setImportFile(e.target.files[0])}} className="absolute inset-0 opacity-0 cursor-pointer"/>
                            {importFile ? <div className="text-center"><FileText size={32} className="mx-auto text-blue-500 mb-2"/><p className="font-bold text-slate-700 dark:text-white">{importFile.name}</p></div> : <div className="text-center"><Upload size={32} className="mx-auto text-slate-400 mb-2"/><p className="font-bold text-slate-700 dark:text-white">Clique para selecionar CSV</p></div>}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800">
                    <button onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                    {modalMode === 'create' ? (
                        <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar</button>
                    ) : (
                        <button onClick={processImport} disabled={!importFile || isProcessingImport} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">{isProcessingImport ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18}/>} Importar</button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
