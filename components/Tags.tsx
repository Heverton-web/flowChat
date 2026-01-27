
import React, { useState, useEffect } from 'react';
import { 
  Tag, Search, Plus, Filter, Edit2, Trash2, Globe, User, 
  Lock, Loader2, CheckCircle, ToggleRight, ToggleLeft 
} from 'lucide-react';
import { User as UserType, Tag as TagType } from '../types';
import * as contactService from '../services/contactService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface TagsProps {
    currentUser: UserType;
}

const Tags: React.FC<TagsProps> = ({ currentUser }) => {
  const { t, showToast } = useApp();
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<TagType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'global' | 'personal'>('all');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<TagType | null>(null);
  const [tagToDelete, setTagToDelete] = useState<TagType | null>(null);

  // Form State
  const [tagName, setTagName] = useState('');
  const [isGlobal, setIsGlobal] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Permission Checks
  const isManagerOrAdmin = currentUser.role === 'manager' || currentUser.role === 'super_admin';

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const loadData = async () => {
    setLoading(true);
    try {
        const data = await contactService.getTags(currentUser.id, currentUser.role);
        setTags(data);
        
        // Defaults for form
        setIsGlobal(isManagerOrAdmin);
    } catch (e) {
        console.error(e);
        showToast('Erro ao carregar tags.', 'error');
    } finally {
        setLoading(false);
    }
  };

  const canModify = (tag: TagType) => {
      if (isManagerOrAdmin) return true; // Manager can edit all
      return tag.ownerId === currentUser.id; // Agent can edit only theirs
  };

  const filteredTags = tags.filter(tag => {
      const matchesSearch = tag.name.toLowerCase().includes(searchTerm.toLowerCase());
      const isGlobalTag = tag.ownerId === 'GLOBAL';
      
      let matchesFilter = true;
      if (filterType === 'global') matchesFilter = isGlobalTag;
      if (filterType === 'personal') matchesFilter = !isGlobalTag;

      return matchesSearch && matchesFilter;
  });

  const openCreateModal = () => {
      setEditingTag(null);
      setTagName('');
      setIsGlobal(isManagerOrAdmin);
      setIsModalOpen(true);
  };

  const openEditModal = (tag: TagType) => {
      setEditingTag(tag);
      setTagName(tag.name);
      setIsGlobal(tag.ownerId === 'GLOBAL');
      setIsModalOpen(true);
  };

  const handleDeleteClick = (tag: TagType) => {
      setTagToDelete(tag);
      setIsDeleteModalOpen(true);
  };

  const handleSave = async () => {
      if (!tagName.trim()) {
          showToast('Nome da tag é obrigatório.', 'error');
          return;
      }

      setIsSubmitting(true);
      try {
          if (editingTag) {
              await contactService.updateTag(editingTag.id, tagName, currentUser.id, currentUser.role);
              showToast('Tag atualizada!', 'success');
          } else {
              await contactService.createTag(tagName, currentUser.id, currentUser.role, isGlobal);
              showToast('Tag criada!', 'success');
          }
          setIsModalOpen(false);
          loadData();
      } catch (e: any) {
          showToast(e.message || 'Erro ao salvar tag.', 'error');
      } finally {
          setIsSubmitting(false);
      }
  };

  const confirmDelete = async () => {
      if (!tagToDelete) return;
      setIsSubmitting(true);
      try {
          await contactService.deleteTag(tagToDelete.id, currentUser.id, currentUser.role);
          showToast('Tag excluída.', 'success');
          setIsDeleteModalOpen(false);
          setTagToDelete(null);
          loadData();
      } catch (e: any) {
          showToast(e.message || 'Erro ao excluir tag.', 'error');
      } finally {
          setIsSubmitting(false);
      }
  };

  return (
    <div className="space-y-6 pb-24 relative animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
            <Tag className="text-blue-600" size={24}/>
            Gestão de Tags
          </h2>
          <p className="text-slate-500 dark:text-slate-400">Organize seus contatos com etiquetas globais ou pessoais.</p>
        </div>
        
        <button onClick={openCreateModal} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 shadow-md transition-colors text-sm font-bold">
            <Plus size={18} /> Nova Tag
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative flex-1 w-full md:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="Buscar tags..." 
                className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm" 
                value={searchTerm} 
                onChange={e => setSearchTerm(e.target.value)} 
              />
          </div>
          
          <div className="flex bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button 
                onClick={() => setFilterType('all')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'all' ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  Todas
              </button>
              <button 
                onClick={() => setFilterType('global')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'global' ? 'bg-white dark:bg-slate-600 shadow-sm text-blue-600 dark:text-blue-300' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  Globais
              </button>
              <button 
                onClick={() => setFilterType('personal')} 
                className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${filterType === 'personal' ? 'bg-white dark:bg-slate-600 shadow-sm text-purple-600 dark:text-purple-300' : 'text-slate-500 dark:text-slate-400'}`}
              >
                  Pessoais
              </button>
          </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32}/></div>
          ) : filteredTags.length === 0 ? (
              <div className="col-span-full text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-200 dark:border-slate-700">
                  <Tag size={32} className="text-slate-300 mx-auto mb-4"/>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">Nenhuma tag encontrada.</p>
              </div>
          ) : (
              filteredTags.map(tag => {
                  const isOwner = canModify(tag);
                  const isGlobalTag = tag.ownerId === 'GLOBAL';
                  
                  return (
                      <div key={tag.id} className="group bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex flex-col justify-between h-32 relative overflow-hidden">
                          <div className={`absolute top-0 left-0 w-1.5 h-full ${isGlobalTag ? 'bg-blue-500' : 'bg-purple-500'}`}></div>
                          
                          <div>
                              <div className="flex justify-between items-start mb-2 pl-2">
                                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 w-fit ${
                                      isGlobalTag 
                                      ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300' 
                                      : 'bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300'
                                  }`}>
                                      {isGlobalTag ? <Globe size={10}/> : <User size={10}/>}
                                      {isGlobalTag ? 'Global' : 'Pessoal'}
                                  </span>
                                  {isOwner ? (
                                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <button onClick={() => openEditModal(tag)} className="p-1.5 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"><Edit2 size={14}/></button>
                                          <button onClick={() => handleDeleteClick(tag)} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"><Trash2 size={14}/></button>
                                      </div>
                                  ) : (
                                      <Lock size={12} className="text-slate-300 mt-1"/>
                                  )}
                              </div>
                              <h3 className="font-bold text-slate-800 dark:text-white text-lg pl-2 truncate" title={tag.name}>{tag.name}</h3>
                          </div>
                          
                          <div className="pl-2 text-xs text-slate-400">
                              {isGlobalTag ? 'Visível para todos' : 'Visível apenas para você'}
                          </div>
                      </div>
                  );
              })
          )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTag ? "Editar Tag" : "Nova Tag"}>
          <div className="space-y-6">
              <div>
                  <label className="text-sm font-bold text-slate-700 dark:text-slate-300 block mb-1">Nome da Tag</label>
                  <input 
                    type="text" 
                    className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="Ex: Cliente VIP"
                    value={tagName}
                    onChange={e => setTagName(e.target.value)}
                    autoFocus
                  />
              </div>

              {isManagerOrAdmin && (
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-700">
                      <div>
                          <p className="text-sm font-bold text-slate-800 dark:text-white flex items-center gap-2">
                              {isGlobal ? <Globe size={16} className="text-blue-500"/> : <User size={16} className="text-purple-500"/>}
                              {isGlobal ? 'Tag Global' : 'Tag Pessoal'}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              {isGlobal ? 'Visível para toda a equipe.' : 'Visível apenas para você.'}
                          </p>
                      </div>
                      <button onClick={() => setIsGlobal(!isGlobal)} className={`transition-colors ${isGlobal ? 'text-blue-600' : 'text-slate-400'}`}>
                          {isGlobal ? <ToggleRight size={32} /> : <ToggleLeft size={32} />}
                      </button>
                  </div>
              )}

              {!isManagerOrAdmin && (
                  <div className="p-3 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 text-xs rounded-lg flex items-center gap-2">
                      <User size={14}/> Esta tag será privada (apenas você pode ver).
                  </div>
              )}

              <div className="flex justify-end pt-2">
                  <button onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg mr-2">Cancelar</button>
                  <button onClick={handleSave} disabled={isSubmitting || !tagName.trim()} className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50">
                      {isSubmitting && <Loader2 className="animate-spin" size={16}/>} Salvar
                  </button>
              </div>
          </div>
      </Modal>

      {/* Delete Confirmation */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Tag?" type="danger" footer={
          <>
            <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">Cancelar</button>
            <button onClick={confirmDelete} disabled={isSubmitting} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 flex items-center gap-2">
                {isSubmitting && <Loader2 className="animate-spin" size={16}/>} Excluir
            </button>
          </>
      }>
          <p>Tem certeza que deseja excluir a tag <strong>{tagToDelete?.name}</strong>? Ela será removida de todos os contatos que a possuem.</p>
      </Modal>

    </div>
  );
};

export default Tags;
