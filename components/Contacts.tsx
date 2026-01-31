
import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Filter, Tag, Trash2, Edit2, Mail, 
  MessageSquare, Save, X, Database, CheckCircle, AlertCircle, Loader2, Download, Upload, UserPlus, ArrowRight, FileDown, ShieldCheck, Lock, Phone, User as UserIcon, FileText, Briefcase, Settings, Copy, Calendar, MoreHorizontal, Layers, CheckSquare, Square, Globe, User, Shield
} from 'lucide-react';
import { Contact, User as UserType, AgentPermissions, Tag as TagType } from '../types';
import * as contactService from '../services/contactService';
import * as teamService from '../services/teamService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface ContactsProps {
    currentUser?: UserType;
}

const Contacts: React.FC<ContactsProps> = ({ currentUser = { id: 'guest', role: 'agent' } as UserType }) => {
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
  
  // Tag Data (Read Only for Selection)
  const [allSystemTags, setAllSystemTags] = useState<TagType[]>([]);

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

  // Permission Checks (Hard Rules)
  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'super_admin';

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
        const [contactsData, agentsData, tagsData] = await Promise.all([
            contactService.getContacts(currentUser.id, currentUser.role),
            teamService.getAgents(),
            contactService.getTags(currentUser.id, currentUser.role)
        ]);
        setContacts(contactsData);
        setAllSystemTags(tagsData);
        
        const agentList = agentsData.map(a => ({ id: a.id, name: a.name }));
        // Mock fallback to ensure owner logic works if teamService returns empty in specific states
        if (!agentList.find(a => a.id === 'manager-1')) {
            agentList.unshift({ id: 'manager-1', name: 'Gestor Admin' });
        }
        setAvailableAgents(agentList);

        // Fetch user specific permissions if not manager (Mock or Real)
        if (currentUser.role !== 'manager' && currentUser.role !== 'super_admin') {
            const myAgentProfile = await teamService.getAgentById(currentUser.id);
            if (myAgentProfile && myAgentProfile.permissions) setUserPermissions(myAgentProfile.permissions);
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
    // Security check
    if (!editingContact && !isManagerOrAdmin && !userPermissions.canCreate) {
        showToast('Permissão negada. Você não pode criar contatos.', 'error');
        return;
    }

    setIsSubmitting(true);
    try {
      const tagsArray = formData.tags.split(',').map(t => t.trim()).filter(t => t);
      
      if (editingContact) {
        if (!isManagerOrAdmin) {
            if (!userPermissions.canEdit) throw new Error('Você não tem permissão para editar contatos.');
            if (editingContact.lockEdit) throw new Error('A edição deste contato foi bloqueada pelo gestor.');
        }
        await contactService.updateContact(editingContact.id, { ...formData, tags: tagsArray });
        showToast('Contato atualizado com sucesso!', 'success');
      } else {
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

  const toggleTagSelection = (tag: string) => {
    const currentTags = formData.tags.split(',').map(t => t.trim()).filter(Boolean);
    const newTags = currentTags.includes(tag) ? currentTags.filter(t => t !== tag) : [...currentTags, tag];
    setFormData({ ...formData, tags: newTags.join(', ') });
  };

  // Actions
  const handleDeleteClick = (contact: Contact) => {
    if (!isManagerOrAdmin) {
        if (!userPermissions.canDelete) { showToast('Sem permissão para deletar.', 'error'); return; }
        if (contact.lockDelete) { showToast('Este contato está protegido contra exclusão.', 'error'); return; }
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
      if (!isManagerOrAdmin && !userPermissions.canDelete) {
          showToast('Permissão negada para exclusão em massa.', 'error');
          return;
      }
      if (!window.confirm(`Tem certeza que deseja excluir ${selectedContacts.size} contatos?`)) return;
      
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
      if (!isManagerOrAdmin) { showToast('Apenas gestores podem transferir contatos.', 'error'); return; }
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
          const text = e.target?.result as string;
          const lines = text.split(/\r\n|\n|\r/).filter(l => l.trim());
          if (lines.length < 2) { showToast('Arquivo inválido ou vazio.', 'error'); setIsProcessingImport(false); return; }
          
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
              const phone = phoneRaw.replace(/\D/g, ''); // Basic clean
              
              return { name, phone, email, tags: tagsStr ? tagsStr.split(/[,;]/).map(t => clean(t)) : [] };
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

  const getAgentName = (id: string) => availableAgents.find(a => a.id === id)?.name || 'Sem Dono';
  
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
            <div className="bg-slate-100 dark:bg-slate-800 p-1 rounded-lg flex overflow-x-auto">
                <button onClick={() => setViewSegment('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${viewSegment === 'all' ? 'bg-white dark:bg-slate-600 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Todos</button>
                <button onClick={() => setViewSegment('mine')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${viewSegment === 'mine' ? 'bg-white dark:bg-slate-600 text-blue-600 dark:text-blue-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Meus</button>
                <button onClick={() => setViewSegment('leads')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${viewSegment === 'leads' ? 'bg-white dark:bg-slate-600 text-green-600 dark:text-green-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>Leads</button>
                <button onClick={() => setViewSegment('vip')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all whitespace-nowrap ${viewSegment === 'vip' ? 'bg-white dark:bg-slate-600 text-amber-600 dark:text-amber-300 shadow-sm' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'}`}>VIP</button>
            </div>

            <button 
                onClick={() => openModal()} 
                disabled={!isManagerOrAdmin && !userPermissions.canCreate}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors text-sm font-bold whitespace-nowrap"
            >
                {(!isManagerOrAdmin && !userPermissions.canCreate) ? <Lock size={16} /> : <Plus size={18} />} 
                {t('add_contact')}
            </button>
        </div>
      </div>

      {/* Toolbar */}
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
                    {allSystemTags.map(tag => <option key={tag.id} value={tag.name}>{tag.name}</option>)}
                </select>
            </div>
        </div>
        
        <div className="flex gap-2 items-center w-full md:w-auto justify-end">
             {filteredContacts.length > 0 && (
                 <button onClick={toggleSelectAll} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors whitespace-nowrap">
                     {selectedContacts.size === filteredContacts.length ? <CheckSquare size={16} className="text-blue-600"/> : <Square size={16}/>}
                     <span className="hidden sm:inline">Selecionar Todos</span>
                 </button>
             )}
             <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>
             <button onClick={contactService.downloadCSVTemplate} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" title="Baixar Modelo CSV">
                <Download size={18} />
             </button>
             <button onClick={() => {contactService.exportContactsToCSV(filteredContacts); showToast('Exportando...', 'success')}} className="p-2 text-slate-500 hover:text-green-600 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg" title="Exportar Lista Atual">
                <FileDown size={18} />
             </button>
        </div>
      </div>

      {/* --- CRM LIST (Card Layout) --- */}
      <div className="space-y-3">
        {loading ? (
            <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
        ) : filteredContacts.length === 0 ? (
            <div className="p-20 text-center text-slate-500 flex flex-col items-center bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 border-dashed">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mb-4">
                    <UserIcon size={32} className="text-slate-400" />
                </div>
                <h3 className="font-bold text-lg mb-1 dark:text-white">Nenhum contato encontrado</h3>
                <p className="text-sm">
                    {isManagerOrAdmin ? 'Tente ajustar seus filtros ou adicione novos contatos.' : 'Você não possui contatos atribuídos.'}
                </p>
            </div>
        ) : (
            filteredContacts.map(contact => {
                const isSelected = selectedContacts.has(contact.id);
                // Permissão para deletar especificamente este item
                const canDeleteThis = isManagerOrAdmin || (userPermissions.canDelete && !contact.lockDelete);
                
                return (
                    <div 
                        key={contact.id} 
                        className={`group bg-white dark:bg-slate-800 rounded-2xl border p-5 shadow-sm hover:shadow-md transition-all flex flex-col lg:flex-row items-start lg:items-center gap-6 relative overflow-hidden ${
                            isSelected 
                            ? 'border-blue-500 ring-1 ring-blue-500 bg-blue-50/10 dark:bg-blue-900/10' 
                            : 'border-slate-200 dark:border-slate-700 hover:border-blue-200 dark:hover:border-blue-600'
                        }`}
                    >
                        {/* Selection Strip */}
                        <div className={`absolute left-0 top-0 bottom-0 w-1.5 transition-colors ${isSelected ? 'bg-blue-600' : 'bg-transparent group-hover:bg-blue-200 dark:group-hover:bg-slate-600'}`}></div>

                        {/* 1. Identity Section */}
                        <div className="flex items-center gap-4 flex-1 min-w-[250px] pl-2 cursor-pointer w-full" onClick={() => toggleSelection(contact.id)}>
                            <div className="relative shrink-0">
                                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-sm border-2 border-white dark:border-slate-700 ${getAvatarColor(contact.name)}`}>
                                    {contact.name.substring(0, 2).toUpperCase()}
                                </div>
                                {isSelected && (
                                    <div className="absolute -top-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 border-2 border-white dark:border-slate-800 shadow-sm">
                                        <CheckCircle size={14} fill="currentColor" />
                                    </div>
                                )}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <h4 className="font-bold text-lg text-slate-800 dark:text-white leading-tight truncate">{contact.name}</h4>
                                    {(contact.lockEdit || contact.lockDelete) && (
                                        <span title="Contato Protegido (Travas Ativas)">
                                            <Lock size={12} className="text-amber-500 shrink-0"/>
                                        </span>
                                    )}
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3 mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                                    <span className="flex items-center gap-1 font-mono cursor-pointer hover:text-blue-500 transition-colors" onClick={(e) => {e.stopPropagation(); copyToClipboard(contact.phone)}}>
                                        <Phone size={12}/> {contact.phone}
                                    </span>
                                    {contact.email && (
                                        <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
                                    )}
                                    {contact.email && (
                                        <span className="flex items-center gap-1 truncate max-w-[150px]" title={contact.email}>
                                            <Mail size={12}/> {contact.email}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 2. Tags Section */}
                        <div className="w-full lg:w-auto flex flex-wrap gap-1.5 pl-2 lg:pl-0 min-w-[200px]">
                            {contact.tags.length > 0 ? (
                                contact.tags.slice(0, 3).map((tag, idx) => (
                                    <span key={idx} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-xs font-bold border border-slate-200 dark:border-slate-600 uppercase tracking-wide">
                                        {tag}
                                    </span>
                                ))
                            ) : (
                                <span className="text-xs text-slate-400 italic pl-1">Sem tags</span>
                            )}
                            {contact.tags.length > 3 && (
                                <span className="px-2 py-1 text-xs text-slate-400 font-bold">+{contact.tags.length - 3}</span>
                            )}
                        </div>

                        {/* 3. Owner & Info */}
                        <div className="w-full lg:w-auto flex items-center justify-between lg:justify-start gap-4 pl-2 lg:pl-0">
                            <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 rounded-lg px-3 py-1.5 border border-slate-100 dark:border-slate-600 w-fit">
                                <div className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-[10px] font-bold">
                                    {getAgentName(contact.ownerId).charAt(0)}
                                </div>
                                <span className="text-xs font-medium text-slate-600 dark:text-slate-300 truncate max-w-[100px]">
                                    {getAgentName(contact.ownerId)}
                                </span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-medium flex flex-col items-end">
                                <span>Criado em</span>
                                <span>{new Date(contact.createdAt).toLocaleDateString()}</span>
                            </div>
                        </div>

                        {/* 4. Actions */}
                        <div className="w-full lg:w-auto flex items-center justify-end gap-2 pl-2 lg:pl-0 border-t lg:border-t-0 border-slate-100 dark:border-slate-700 pt-4 lg:pt-0">
                            {isManagerOrAdmin && (
                                <button 
                                    onClick={() => handleTransferClick(contact)}
                                    className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:border-indigo-300 dark:hover:border-indigo-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all"
                                    title="Transferir Carteira"
                                >
                                    <ArrowRight size={16}/>
                                </button>
                            )}
                            <button 
                                onClick={() => openModal(contact)} 
                                disabled={!isManagerOrAdmin && (!userPermissions.canEdit || contact.lockEdit)}
                                className="bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-300 dark:hover:border-blue-500 px-3 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="Editar"
                            >
                                <Edit2 size={16} />
                            </button>
                            
                            <button 
                                onClick={() => handleDeleteClick(contact)} 
                                disabled={!canDeleteThis}
                                className="bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 px-3 py-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
                                title={canDeleteThis ? "Excluir" : "Exclusão Bloqueada"}
                            >
                                {canDeleteThis ? <Trash2 size={16} /> : <Lock size={16} />}
                            </button>
                        </div>
                    </div>
                );
            })
        )}
      </div>

      {/* Floating Bulk Actions Bar - Mobile Optimized */}
      {selectedContacts.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] md:w-auto max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-3 px-4 md:px-6 flex items-center justify-between gap-4 animate-in slide-in-from-bottom-10 z-40">
              <div className="flex items-center gap-2 md:border-r md:border-slate-200 md:dark:border-slate-700 md:pr-6 shrink-0">
                  <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold">{selectedContacts.size}</div>
                  <span className="text-sm font-bold text-slate-700 dark:text-white hidden md:inline">Selecionados</span>
              </div>
              
              <div className="flex items-center gap-2 flex-1 justify-end md:justify-start">
                  <button onClick={handleBulkDelete} disabled={isSubmitting || (!isManagerOrAdmin && !userPermissions.canDelete)} className="flex items-center gap-2 px-3 py-1.5 hover:bg-red-50 dark:hover:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 whitespace-nowrap">
                      {isSubmitting ? <Loader2 size={16} className="animate-spin"/> : <Trash2 size={16} />}
                      <span className="hidden sm:inline">Excluir</span>
                  </button>
                  <button onClick={() => {contactService.exportContactsToCSV(contacts.filter(c => selectedContacts.has(c.id))); showToast('Exportando seleção...', 'success')}} className="flex items-center gap-2 px-3 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors whitespace-nowrap">
                      <FileDown size={16} /> <span className="hidden sm:inline">Exportar</span>
                  </button>
              </div>

              <button onClick={() => setSelectedContacts(new Set())} className="ml-2 p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full text-slate-400 shrink-0">
                  <X size={16} />
              </button>
          </div>
      )}

      {/* --- MODALS --- */}
      
      {/* Transfer Modal */}
      <Modal isOpen={isTransferModalOpen} onClose={() => setIsTransferModalOpen(false)} title="Transferir Contato">
          <div className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300">
                  Transferir carteira de <strong>{contactToTransfer?.name}</strong> para:
              </p>
              <select className="w-full p-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white" value={targetAgentId} onChange={e => setTargetAgentId(e.target.value)}>
                  <option value="">Selecione um agente...</option>
                  {availableAgents.filter(a => a.id !== contactToTransfer?.ownerId).map(a => (
                      <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
              </select>
              <div className="flex justify-end pt-2">
                  <button onClick={confirmTransfer} disabled={!targetAgentId} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold disabled:opacity-50">Transferir Agora</button>
              </div>
          </div>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={!!contactToDelete} onClose={() => setContactToDelete(null)} title="Excluir Contato" type="danger" footer={<><button onClick={() => setContactToDelete(null)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Cancelar</button><button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-lg">Excluir Definitivamente</button></>}>
          Você está prestes a excluir <strong>{contactToDelete?.name}</strong>. Esta ação não pode ser desfeita.
      </Modal>

      {/* Create/Edit Modal */}
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
                    <div className="flex border-b border-slate-100 dark:border-slate-700 px-6 gap-6 overflow-x-auto">
                        <button onClick={() => setModalMode('create')} className={`py-3 text-sm font-bold border-b-2 whitespace-nowrap ${modalMode === 'create' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Manual</button>
                        <button onClick={() => setModalMode('import')} className={`py-3 text-sm font-bold border-b-2 whitespace-nowrap ${modalMode === 'import' ? 'border-green-600 text-green-600' : 'border-transparent text-slate-500'}`}>Importação CSV</button>
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
                                    <div className="flex flex-wrap gap-1 mt-2">{allSystemTags.map(tag => <button key={tag.id} onClick={() => toggleTagSelection(tag.name)} className={`text-[10px] px-2 py-1 rounded border ${formData.tags.includes(tag.name) ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900 dark:text-blue-300' : 'bg-slate-50 dark:bg-slate-700 text-slate-500 dark:text-slate-400'}`}>{tag.name}</button>)}</div>
                                </div>
                                <div><label className="text-sm font-bold text-slate-700 dark:text-slate-300">Notas</label><textarea rows={3} className="w-full mt-1 px-4 py-2 border rounded-lg dark:bg-slate-700 dark:border-slate-600 dark:text-white resize-none" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})}></textarea></div>
                                
                                {isManagerOrAdmin && (
                                    <div className="pt-2 bg-slate-50 dark:bg-slate-700/30 p-3 rounded-lg border border-slate-100 dark:border-slate-700">
                                        <p className="text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-1"><Shield size={12}/> Travas de Segurança</p>
                                        <div className="flex gap-4">
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="rounded text-blue-600" checked={formData.lockEdit} onChange={e => setFormData({...formData, lockEdit: e.target.checked})}/>
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Bloquear Edição</span>
                                            </label>
                                            <label className="flex items-center gap-2 cursor-pointer">
                                                <input type="checkbox" className="rounded text-blue-600" checked={formData.lockDelete} onChange={e => setFormData({...formData, lockDelete: e.target.checked})}/>
                                                <span className="text-xs text-slate-600 dark:text-slate-300">Bloquear Exclusão</span>
                                            </label>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-8 space-y-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl bg-slate-50 dark:bg-slate-800 relative hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                            <input type="file" accept=".csv" onChange={e => {if(e.target.files?.[0]) setImportFile(e.target.files[0])}} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"/>
                            {importFile ? (
                                <div className="text-center">
                                    <FileText size={32} className="mx-auto text-blue-500 mb-2"/>
                                    <p className="font-bold text-slate-700 dark:text-white">{importFile.name}</p>
                                    <p className="text-xs text-slate-400">Pronto para importar</p>
                                </div>
                            ) : (
                                <div className="text-center">
                                    <Upload size={32} className="mx-auto text-slate-400 mb-2"/>
                                    <p className="font-bold text-slate-700 dark:text-white">Clique para selecionar CSV</p>
                                    <p className="text-xs text-slate-400">Formato: Nome, Telefone, Email, Tags</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 bg-slate-50/50 dark:bg-slate-800">
                    <button onClick={closeModal} className="px-4 py-2 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700 rounded-lg">Cancelar</button>
                    {modalMode === 'create' ? (
                        <button onClick={handleSave} disabled={isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2">{isSubmitting ? <Loader2 className="animate-spin" size={18}/> : <Save size={18}/>} Salvar</button>
                    ) : (
                        <button onClick={processImport} disabled={!importFile || isProcessingImport} className="px-6 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 flex items-center gap-2">{isProcessingImport ? <Loader2 className="animate-spin" size={18}/> : <ArrowRight size={18}/>} Processar Arquivo</button>
                    )}
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
