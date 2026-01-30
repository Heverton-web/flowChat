
import React, { useState, useEffect, useMemo } from 'react';
import { 
    Users, Database, Search, Filter, ArrowRight, Loader2, 
    CheckCircle, Shield, Briefcase, Headphones, Tag as TagIcon, UserPlus, Layers,
    ChevronRight, UserMinus, UserX, LayoutGrid, AlertCircle
} from 'lucide-react';
import { User, Contact, AgentPlan, Tag } from '../types';
import * as contactService from '../services/contactService';
import * as teamService from '../services/teamService';
import { useApp } from '../contexts/AppContext';

interface BaseAssignmentProps {
    currentUser: User;
}

const BaseAssignment: React.FC<BaseAssignmentProps> = ({ currentUser }) => {
    const { showToast } = useApp();
    const [loading, setLoading] = useState(true);
    const [agents, setAgents] = useState<AgentPlan[]>([]);
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [tags, setTags] = useState<Tag[]>([]);

    // View State (The Sidebar Selection)
    const [viewFilterId, setViewFilterId] = useState<string>('unassigned'); // 'all', 'unassigned', or agentId

    // Assignment Target State (The Footer Selection)
    const [targetAgentId, setTargetAgentId] = useState<string>('');

    // Selection States
    const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
    
    // List Filters
    const [searchTerm, setSearchTerm] = useState('');
    const [filterTag, setFilterTag] = useState<string>('all');

    const [isAssigning, setIsAssigning] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [contactsData, agentsData, tagsData] = await Promise.all([
                contactService.getContacts(currentUser.id, currentUser.role),
                teamService.getAgents(),
                contactService.getTags(currentUser.id, currentUser.role)
            ]);
            
            // Add manager manually if not in agents list (mock/safety)
            const fullAgents = [...agentsData];
            const managerExists = fullAgents.find(a => a.id === currentUser.id);
            if (!managerExists && currentUser.role === 'manager') {
                fullAgents.unshift({
                    id: currentUser.id,
                    name: currentUser.name + " (Eu)",
                    email: currentUser.email,
                    role: 'manager',
                    status: 'active',
                    messagesUsed: 0,
                    permissions: {} as any
                });
            }

            setContacts(contactsData);
            setAgents(fullAgents);
            setTags(tagsData);
            
            // Set default target to first agent if available
            if (fullAgents.length > 0) {
                setTargetAgentId(fullAgents[0].id);
            }

        } catch (e) {
            console.error(e);
            showToast('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- LOGIC ---

    const filteredContacts = useMemo(() => {
        return contacts.filter(c => {
            // 1. Sidebar Filter (View Mode)
            let matchesView = true;
            if (viewFilterId === 'unassigned') {
                matchesView = !c.ownerId || c.ownerId === '';
            } else if (viewFilterId === 'all') {
                matchesView = true;
            } else {
                matchesView = c.ownerId === viewFilterId;
            }

            // 2. Search
            const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm);
            
            // 3. Tag Filter
            const matchesTag = filterTag === 'all' || c.tags.includes(filterTag);
            
            return matchesView && matchesSearch && matchesTag;
        });
    }, [contacts, searchTerm, filterTag, viewFilterId]);

    // Calculate distribution stats dynamically based on current contacts state
    const agentStats = useMemo(() => {
        const stats: Record<string, number> = {};
        agents.forEach(a => stats[a.id] = 0);
        
        stats['unassigned'] = 0;
        stats['all'] = contacts.length;

        contacts.forEach(c => {
            if (c.ownerId && stats[c.ownerId] !== undefined) {
                stats[c.ownerId]++;
            } else {
                stats['unassigned']++;
            }
        });
        return stats;
    }, [contacts, agents]);

    const toggleContactSelection = (id: string) => {
        const newSet = new Set(selectedContactIds);
        if (newSet.has(id)) newSet.delete(id); else newSet.add(id);
        setSelectedContactIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedContactIds.size === filteredContacts.length && filteredContacts.length > 0) {
            setSelectedContactIds(new Set());
        } else {
            setSelectedContactIds(new Set(filteredContacts.map(c => c.id)));
        }
    };

    const handleAssign = async () => {
        if (!targetAgentId) {
            showToast('Selecione um agente de destino.', 'error');
            return;
        }
        if (selectedContactIds.size === 0) {
            showToast('Selecione pelo menos um contato.', 'error');
            return;
        }
        
        setIsAssigning(true);
        try {
            const targetAgent = agents.find(a => a.id === targetAgentId);
            await contactService.bulkAssignContacts(Array.from(selectedContactIds), targetAgentId);
            
            showToast(`${selectedContactIds.size} contatos atribuídos para ${targetAgent?.name || 'Agente'}`, 'success');
            
            // Optimistic Update
            const updatedContacts = contacts.map(c => 
                selectedContactIds.has(c.id) ? { ...c, ownerId: targetAgentId } : c
            );
            setContacts(updatedContacts);
            setSelectedContactIds(new Set()); // Clear selection

        } catch (e) {
            console.error(e);
            showToast('Erro ao atribuir contatos.', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    const handleUnassign = async () => {
        if (selectedContactIds.size === 0) {
            showToast('Selecione contatos para desvincular.', 'error');
            return;
        }

        // Removido window.confirm para garantir execução fluida
        setIsAssigning(true);
        try {
            // Pass null to unassign
            await contactService.bulkAssignContacts(Array.from(selectedContactIds), null);
            
            showToast(`${selectedContactIds.size} contatos movidos para 'Sem Responsável'`, 'success');
            
            // Optimistic Update (Set ownerId to empty string for UI logic)
            const updatedContacts = contacts.map(c => 
                selectedContactIds.has(c.id) ? { ...c, ownerId: '' } : c
            );
            setContacts(updatedContacts);
            setSelectedContactIds(new Set()); // Clear selection

        } catch (e) {
            console.error(e);
            showToast('Erro ao desvincular contatos.', 'error');
        } finally {
            setIsAssigning(false);
        }
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Loader2 className="animate-spin text-blue-600" size={40}/></div>;

    // Helper to calc percentage for progress bars
    const getPercentage = (count: number) => {
        if (contacts.length === 0) return 0;
        return (count / contacts.length) * 100;
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500 h-full flex flex-col flex-1">
            
            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <Layers className="text-blue-600" size={24}/>
                        Atribuição de Bases
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Distribua leads e contatos entre sua equipe.</p>
                </div>
            </div>

            {/* Main Content: Split View */}
            <div className="flex flex-col lg:flex-row gap-6 flex-1 overflow-hidden min-h-0">
                
                {/* LEFT: Sidebar Filters (Sources) */}
                <div className="w-full lg:w-80 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                        <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Filter size={12}/> Visualização por Carteira
                        </h3>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                        
                        {/* All Filter */}
                        <button
                            onClick={() => setViewFilterId('all')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
                                viewFilterId === 'all'
                                ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500'
                                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 dark:text-slate-300">
                                <LayoutGrid size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-bold ${viewFilterId === 'all' ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-white'}`}>Todos os Contatos</h4>
                                <p className="text-xs text-slate-500">Base completa</p>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                                {agentStats['all']}
                            </span>
                        </button>

                        {/* Unassigned Filter */}
                        <button
                            onClick={() => setViewFilterId('unassigned')}
                            className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left group ${
                                viewFilterId === 'unassigned'
                                ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 ring-1 ring-amber-500'
                                : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                        >
                            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 dark:text-amber-400">
                                <UserX size={20} />
                            </div>
                            <div className="flex-1">
                                <h4 className={`text-sm font-bold ${viewFilterId === 'unassigned' ? 'text-amber-700 dark:text-amber-300' : 'text-slate-700 dark:text-white'}`}>Sem Responsável</h4>
                                <p className="text-xs text-slate-500">Livres para atribuição</p>
                            </div>
                            <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                                {agentStats['unassigned']}
                            </span>
                        </button>

                        <div className="h-px bg-slate-100 dark:bg-slate-700 my-2 mx-2"></div>
                        <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Carteiras de Agentes</p>

                        {/* Agents List with Quota Visuals */}
                        {agents.map(agent => {
                            const count = agentStats[agent.id] || 0;
                            const percent = getPercentage(count);
                            return (
                                <button
                                    key={agent.id}
                                    onClick={() => setViewFilterId(agent.id)}
                                    className={`w-full flex flex-col gap-2 p-3 rounded-xl border transition-all text-left group ${
                                        viewFilterId === agent.id
                                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-1 ring-blue-500'
                                        : 'bg-transparent border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    <div className="flex items-center gap-3 w-full">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${
                                            agent.role === 'manager' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                        }`}>
                                            {agent.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-center">
                                                <h4 className={`text-sm font-bold truncate ${viewFilterId === agent.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-white'}`}>{agent.name}</h4>
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <span className="text-xs text-slate-500 capitalize">{agent.role === 'manager' ? 'Gestor' : 'Atendente'}</span>
                                            </div>
                                        </div>
                                        <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded-full text-slate-600 dark:text-slate-300">
                                            {count}
                                        </span>
                                    </div>
                                    {/* Mini Quota Bar */}
                                    <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mt-1">
                                        <div 
                                            className={`h-full rounded-full transition-all duration-500 ${viewFilterId === agent.id ? 'bg-blue-500' : 'bg-slate-400 dark:bg-slate-600'}`} 
                                            style={{width: `${percent}%`}}
                                        ></div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* RIGHT: Contacts List & Assignment */}
                <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden h-full">
                    
                    {/* Toolbar */}
                    <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row gap-3 bg-slate-50/50 dark:bg-slate-900/50 shrink-0">
                        <div className="flex items-center gap-2 flex-1 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-3 py-2">
                            <Search size={16} className="text-slate-400"/>
                            <input 
                                type="text" 
                                placeholder="Buscar contato..." 
                                className="bg-transparent outline-none text-sm w-full dark:text-white"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            <div className="relative min-w-[140px]">
                                <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/>
                                <select 
                                    className="w-full pl-9 pr-8 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm outline-none cursor-pointer appearance-none dark:text-white"
                                    value={filterTag}
                                    onChange={e => setFilterTag(e.target.value)}
                                >
                                    <option value="all">Todas Tags</option>
                                    {tags.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Stats Bar (Load Balance) */}
                    <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs shrink-0">
                        <div className="flex items-center gap-4 flex-1 mr-4 overflow-hidden">
                            <span className="text-slate-500 dark:text-slate-400 shrink-0">
                                Exibindo <strong>{filteredContacts.length}</strong> contatos
                            </span>
                            
                            {/* Visual Distribution Summary (Mini Dashboard) */}
                            <div className="flex h-2 rounded-full overflow-hidden flex-1 max-w-xs bg-slate-200 dark:bg-slate-700">
                                {agents.map((agent, i) => {
                                    const p = getPercentage(agentStats[agent.id]);
                                    if(p < 2) return null; // Don't show tiny slices
                                    return (
                                        <div 
                                            key={agent.id} 
                                            className={`${i % 2 === 0 ? 'bg-blue-400' : 'bg-indigo-400'} hover:opacity-80 transition-opacity`} 
                                            style={{width: `${p}%`}} 
                                            title={`${agent.name}: ${Math.round(p)}%`}
                                        ></div>
                                    );
                                })}
                                <div className="bg-amber-400" style={{width: `${getPercentage(agentStats['unassigned'])}%`}} title={`Sem dono: ${Math.round(getPercentage(agentStats['unassigned']))}%`}></div>
                            </div>
                        </div>

                        <button 
                            onClick={toggleSelectAll}
                            className="text-blue-600 font-bold hover:underline"
                        >
                            {selectedContactIds.size === filteredContacts.length && filteredContacts.length > 0 ? 'Desmarcar Todos' : 'Selecionar Todos da Lista'}
                        </button>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                        {filteredContacts.length === 0 ? (
                            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                                <Database size={40} className="mb-2 opacity-20"/>
                                <p>Nenhum contato encontrado nesta visualização.</p>
                            </div>
                        ) : (
                            <div className="space-y-1">
                                {filteredContacts.map(contact => (
                                    <label 
                                        key={contact.id} 
                                        className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                                            selectedContactIds.has(contact.id) 
                                            ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                                            : 'bg-white dark:bg-slate-800 border-transparent hover:bg-slate-50 dark:hover:bg-slate-700'
                                        }`}
                                    >
                                        <input 
                                            type="checkbox" 
                                            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-gray-300"
                                            checked={selectedContactIds.has(contact.id)}
                                            onChange={() => toggleContactSelection(contact.id)}
                                        />
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-2 items-center">
                                            <div>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate">{contact.name}</p>
                                                <p className="text-xs text-slate-500 font-mono">{contact.phone}</p>
                                            </div>
                                            <div className="flex gap-1 flex-wrap">
                                                {contact.tags.slice(0, 2).map(t => (
                                                    <span key={t} className="text-[10px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300">{t}</span>
                                                ))}
                                                {contact.tags.length > 2 && <span className="text-[10px] text-slate-400">+{contact.tags.length - 2}</span>}
                                            </div>
                                            <div className="flex items-center gap-2 justify-end">
                                                <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full border ${
                                                    contact.ownerId 
                                                    ? 'bg-slate-100 dark:bg-slate-700 border-slate-200 dark:border-slate-600' 
                                                    : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
                                                }`}>
                                                    <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold text-white ${contact.ownerId ? 'bg-slate-300 dark:bg-slate-500' : 'bg-amber-400'}`}>
                                                        {contact.ownerId ? agents.find(a => a.id === contact.ownerId)?.name.charAt(0).toUpperCase() : '?'}
                                                    </div>
                                                    <span className={`text-[10px] font-bold truncate max-w-[80px] ${contact.ownerId ? 'text-slate-600 dark:text-slate-300' : 'text-amber-600 dark:text-amber-400'}`}>
                                                        {contact.ownerId ? (agents.find(a => a.id === contact.ownerId)?.name || 'Desconhecido') : 'Sem Dono'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Action Footer */}
                    <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shrink-0 flex flex-col md:flex-row gap-4 justify-between items-center">
                        <div className="text-sm text-slate-600 dark:text-slate-300 font-medium">
                            <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-2 py-0.5 rounded-full font-bold mr-2">{selectedContactIds.size}</span>
                            selecionados
                        </div>
                        
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            {/* Unassign Button */}
                            <button
                                onClick={handleUnassign}
                                disabled={isAssigning || selectedContactIds.size === 0}
                                className="px-4 py-2 rounded-lg font-bold flex items-center gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all text-sm disabled:opacity-50 disabled:text-slate-400 border border-transparent hover:border-red-200 dark:hover:border-red-800"
                                title="Remover responsável"
                            >
                                {isAssigning ? <Loader2 className="animate-spin" size={16}/> : <UserMinus size={16}/>}
                                <span className="hidden sm:inline">Desvincular</span>
                            </button>

                            <div className="h-8 w-px bg-slate-300 dark:bg-slate-600 mx-1 hidden md:block"></div>

                            {/* Assign Controls */}
                            <div className="flex items-center gap-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg px-2 py-1 flex-1 md:flex-none">
                                <span className="text-xs text-slate-400 whitespace-nowrap pl-1">Para:</span>
                                <select 
                                    className="bg-transparent text-sm font-bold text-slate-800 dark:text-white outline-none cursor-pointer w-full md:w-40 py-1"
                                    value={targetAgentId}
                                    onChange={(e) => setTargetAgentId(e.target.value)}
                                >
                                    {agents.map(agent => (
                                        <option key={agent.id} value={agent.id}>{agent.name}</option>
                                    ))}
                                </select>
                            </div>

                            <button 
                                onClick={handleAssign}
                                disabled={isAssigning || selectedContactIds.size === 0 || !targetAgentId}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm whitespace-nowrap"
                            >
                                {isAssigning ? <Loader2 className="animate-spin" size={16}/> : <UserPlus size={16}/>}
                                <span>Atribuir</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BaseAssignment;
