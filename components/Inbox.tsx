
import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Search, Filter, Clock, CheckCircle, User, MoreVertical, 
    Send, Paperclip, Smile, Lock, Image as ImageIcon, Mic, FileText, 
    Check, X, ChevronDown, Tag, Phone, Mail, Archive, Inbox as InboxIcon,
    RefreshCw, AlertCircle, StickyNote, ArrowRight, Loader2
} from 'lucide-react';
import { Conversation, Message, User as UserType } from '../types';
import * as chatService from '../services/chatService';
import * as teamService from '../services/teamService';
import { useApp } from '../contexts/AppContext';

interface InboxProps {
    currentUser: UserType;
}

const Inbox: React.FC<InboxProps> = ({ currentUser }) => {
    const { t, showToast } = useApp();
    
    // --- STATE ---
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [agents, setAgents] = useState<{id: string, name: string}[]>([]);

    // Filters
    const [filterStatus, setFilterStatus] = useState<'open' | 'resolved'>('open');
    const [filterAssignee, setFilterAssignee] = useState<'me' | 'unassigned' | 'all'>('me');
    const [searchTerm, setSearchTerm] = useState('');

    // Composer
    const [inputText, setInputText] = useState('');
    const [isPrivateNote, setIsPrivateNote] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        loadInitialData();
    }, [currentUser]);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        }
    }, [activeConversationId]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [convs, agentList] = await Promise.all([
                chatService.getConversations(currentUser),
                teamService.getAgents()
            ]);
            setConversations(convs);
            setAgents(agentList.map(a => ({ id: a.id, name: a.name })));
            
            // Auto-select first if available
            if (convs.length > 0 && !activeConversationId) {
                // setActiveConversationId(convs[0].id); // Optional: Auto select
            }
        } catch (e) {
            console.error(e);
            showToast('Erro ao carregar conversas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (id: string) => {
        const msgs = await chatService.getMessages(id);
        setMessages(msgs);
        
        // Optimistic read status update
        setConversations(prev => prev.map(c => 
            c.id === id ? { ...c, unreadCount: 0 } : c
        ));
    };

    const handleSendMessage = async () => {
        if (!inputText.trim() || !activeConversationId) return;
        setIsSending(true);
        try {
            const newMsg = await chatService.sendMessage(activeConversationId, inputText, currentUser, isPrivateNote);
            setMessages(prev => [...prev, newMsg]);
            setInputText('');
            
            // Update conversation snippet in list
            setConversations(prev => prev.map(c => 
                c.id === activeConversationId 
                ? { ...c, lastMessage: newMsg.content, lastMessageAt: newMsg.createdAt } 
                : c
            ));
        } catch (e) {
            showToast('Erro ao enviar mensagem', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleStatusChange = async (newStatus: 'open' | 'resolved') => {
        if (!activeConversationId) return;
        try {
            await chatService.updateConversationStatus(activeConversationId, newStatus);
            setConversations(prev => prev.map(c => 
                c.id === activeConversationId ? { ...c, status: newStatus } : c
            ));
            showToast(`Conversa ${newStatus === 'resolved' ? 'resolvida' : 'reaberta'}`, 'success');
        } catch (e) {
            showToast('Erro ao atualizar status', 'error');
        }
    };

    const handleAssign = async (agentId: string) => {
        if (!activeConversationId) return;
        try {
            await chatService.assignAgent(activeConversationId, agentId);
            setConversations(prev => prev.map(c => 
                c.id === activeConversationId ? { ...c, assignedTo: agentId } : c
            ));
            showToast('Atendente atribuído', 'success');
        } catch (e) {
            showToast('Erro ao atribuir', 'error');
        }
    };

    // --- DERIVED STATE ---
    const filteredConversations = conversations.filter(c => {
        const matchesStatus = c.status === filterStatus;
        const matchesSearch = c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) || c.contactPhone.includes(searchTerm);
        
        let matchesAssignee = true;
        if (filterAssignee === 'me') matchesAssignee = c.assignedTo === currentUser.id;
        if (filterAssignee === 'unassigned') matchesAssignee = !c.assignedTo;
        
        return matchesStatus && matchesSearch && matchesAssignee;
    });

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER ---
    return (
        <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
            
            {/* LEFT COLUMN: LIST */}
            <div className="w-full md:w-80 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
                {/* Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-700">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <InboxIcon className="text-blue-600" size={20}/> Inbox
                        </h2>
                        <div className="flex gap-1 bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
                            <button 
                                onClick={() => setFilterStatus('open')}
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${filterStatus === 'open' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500'}`}
                            >
                                Abertos
                            </button>
                            <button 
                                onClick={() => setFilterStatus('resolved')}
                                className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${filterStatus === 'resolved' ? 'bg-white dark:bg-slate-600 shadow text-green-600 dark:text-green-300' : 'text-slate-500'}`}
                            >
                                Resolvidos
                            </button>
                        </div>
                    </div>
                    
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                        <input 
                            type="text" 
                            placeholder="Buscar conversa..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                        {['me', 'unassigned', 'all'].map(t => (
                            <button 
                                key={t}
                                onClick={() => setFilterAssignee(t as any)}
                                className={`px-3 py-1 text-xs font-medium rounded-full border whitespace-nowrap transition-colors ${
                                    filterAssignee === t 
                                    ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-transparent' 
                                    : 'bg-transparent border-slate-200 dark:border-slate-600 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                            >
                                {t === 'me' ? 'Meus' : t === 'unassigned' ? 'Sem Dono' : 'Todos'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-8 text-center text-slate-400 text-sm">
                            Nenhuma conversa encontrada.
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50 dark:divide-slate-700/50">
                            {filteredConversations.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setActiveConversationId(c.id)}
                                    className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors flex gap-3 relative ${activeConversationId === c.id ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="relative shrink-0">
                                        {c.contactAvatar ? (
                                            <img src={c.contactAvatar} className="w-10 h-10 rounded-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm">
                                                {getInitials(c.contactName)}
                                            </div>
                                        )}
                                        {c.channel === 'whatsapp' && (
                                            <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-0.5 border-2 border-white dark:border-slate-800">
                                                <MessageSquare size={10} className="text-white"/>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm truncate ${activeConversationId === c.id ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'}`}>{c.contactName}</span>
                                            <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">{formatTime(c.lastMessageAt)}</span>
                                        </div>
                                        <p className={`text-xs truncate ${c.unreadCount > 0 ? 'font-bold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                            {c.lastMessage}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            {c.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700 rounded text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {c.unreadCount > 0 && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-sm">
                                            {c.unreadCount}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* MIDDLE COLUMN: CHAT */}
            {activeConversation ? (
                <div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-900/50 relative">
                    
                    {/* Chat Header */}
                    <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <h3 className="font-bold text-slate-800 dark:text-white">{activeConversation.contactName}</h3>
                            <span className="text-xs text-slate-400 font-mono hidden md:inline-block">{activeConversation.contactPhone}</span>
                            <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${activeConversation.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                {activeConversation.status === 'open' ? 'Aberto' : 'Resolvido'}
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <button className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-1 hover:bg-slate-100 dark:hover:bg-slate-700 px-2 py-1 rounded transition-colors">
                                    <User size={14}/> 
                                    {activeConversation.assignedTo ? agents.find(a => a.id === activeConversation.assignedTo)?.name.split(' ')[0] : 'Atribuir'}
                                    <ChevronDown size={12}/>
                                </button>
                                <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 hidden group-hover:block z-20">
                                    {agents.map(a => (
                                        <button key={a.id} onClick={() => handleAssign(a.id)} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300">
                                            {a.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div className="h-4 w-px bg-slate-300 dark:bg-slate-600 mx-1"></div>
                            
                            {activeConversation.status === 'open' ? (
                                <button onClick={() => handleStatusChange('resolved')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors" title="Resolver Conversa">
                                    <CheckCircle size={20}/>
                                </button>
                            ) : (
                                <button onClick={() => handleStatusChange('open')} className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-full transition-colors" title="Reabrir Conversa">
                                    <RefreshCw size={20}/>
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Chat Messages */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender === 'agent';
                            const isNote = msg.isPrivate;
                            
                            if (isNote) {
                                return (
                                    <div key={msg.id} className="flex justify-end my-4 animate-in fade-in zoom-in-95">
                                        <div className="bg-yellow-100 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-xl rounded-tr-none text-xs flex flex-col gap-1 max-w-[80%] shadow-sm relative">
                                            <div className="flex items-center gap-2 mb-1 opacity-80 border-b border-yellow-200/50 pb-1">
                                                <Lock size={10} />
                                                <span className="font-bold uppercase tracking-wider text-[10px]">Nota Interna</span>
                                                <span className="ml-auto text-[9px]">{formatTime(msg.createdAt)}</span>
                                            </div>
                                            <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                                            <div className="absolute -top-2 -right-2 bg-yellow-500 text-white rounded-full p-1 shadow-sm">
                                                <StickyNote size={10} fill="currentColor" />
                                            </div>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[70%] rounded-2xl p-3 shadow-sm relative ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                                    }`}>
                                        {/* Sender Name (if agent and not me, or group context) */}
                                        {isMe && <p className="text-[9px] opacity-70 mb-1 text-right">Você</p>}
                                        
                                        <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                        
                                        <div className={`flex items-center gap-1 justify-end mt-1 text-[10px] ${isMe ? 'text-blue-100' : 'text-slate-400'}`}>
                                            {formatTime(msg.createdAt)}
                                            {isMe && (
                                                msg.status === 'read' ? <div className="flex"><Check size={12}/><Check size={12} className="-ml-1"/></div> : 
                                                msg.status === 'delivered' ? <div className="flex"><Check size={12}/><Check size={12} className="-ml-1 opacity-50"/></div> : 
                                                <Check size={12}/>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Composer */}
                    <div className={`p-4 bg-white dark:bg-slate-800 border-t ${isPrivateNote ? 'border-yellow-400 bg-yellow-50/30 dark:bg-yellow-900/10' : 'border-slate-200 dark:border-slate-700'}`}>
                        {isPrivateNote && (
                            <div className="flex items-center gap-2 text-xs font-bold text-yellow-600 mb-2 animate-in slide-in-from-bottom-2">
                                <Lock size={12} /> Modo Nota Privada (Visível apenas para a equipe)
                            </div>
                        )}
                        <div className="flex gap-2 items-end">
                            <button 
                                onClick={() => setIsPrivateNote(!isPrivateNote)}
                                className={`p-2 rounded-lg transition-colors ${isPrivateNote ? 'bg-yellow-100 text-yellow-700' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                                title="Nota Privada"
                            >
                                <StickyNote size={20} />
                            </button>
                            <div className="flex-1 bg-slate-100 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center px-2">
                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Paperclip size={18}/></button>
                                <textarea 
                                    className="flex-1 bg-transparent border-none outline-none text-sm p-3 max-h-32 resize-none dark:text-white"
                                    placeholder={isPrivateNote ? "Escrever nota interna..." : "Digite sua mensagem..."}
                                    rows={1}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                                />
                                <button className="p-2 text-slate-400 hover:text-blue-600 transition-colors"><Smile size={18}/></button>
                            </div>
                            <button 
                                onClick={handleSendMessage}
                                disabled={!inputText.trim() || isSending}
                                className={`p-3 rounded-xl text-white shadow-md transition-all ${
                                    isPrivateNote 
                                    ? 'bg-yellow-500 hover:bg-yellow-600' 
                                    : 'bg-blue-600 hover:bg-blue-700'
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                            >
                                {isSending ? <Loader2 size={20} className="animate-spin"/> : <Send size={20} />}
                            </button>
                        </div>
                    </div>

                </div>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400 bg-slate-50/30 dark:bg-slate-900/30">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
                        <MessageSquare size={40} className="opacity-20"/>
                    </div>
                    <p className="font-medium">Selecione uma conversa para começar</p>
                </div>
            )}

            {/* RIGHT COLUMN: DETAILS (Collapsible on small screens) */}
            {activeConversation && (
                <div className="hidden lg:flex w-72 border-l border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex-col overflow-y-auto">
                    <div className="p-6 text-center border-b border-slate-100 dark:border-slate-700">
                        <div className="w-20 h-20 bg-indigo-100 dark:bg-indigo-900/50 rounded-full flex items-center justify-center mx-auto mb-3 text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                            {getInitials(activeConversation.contactName)}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{activeConversation.contactName}</h3>
                        <p className="text-slate-500 text-sm mt-1">{activeConversation.contactPhone}</p>
                        
                        <div className="flex justify-center gap-2 mt-4">
                            <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"><Phone size={16}/></button>
                            <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"><Mail size={16}/></button>
                            <button className="p-2 bg-slate-100 dark:bg-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 hover:text-blue-600 transition-colors"><Archive size={16}/></button>
                        </div>
                    </div>

                    <div className="p-6 space-y-6">
                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Tag size={12}/> Etiquetas</h4>
                            <div className="flex flex-wrap gap-2">
                                {activeConversation.tags.map(tag => (
                                    <span key={tag} className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded text-xs text-slate-600 dark:text-slate-300">
                                        {tag}
                                    </span>
                                ))}
                                <button className="px-2 py-1 border border-dashed border-slate-300 dark:border-slate-600 rounded text-xs text-slate-400 hover:border-slate-400 hover:text-slate-600 transition-colors">+ Add</button>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2"><Clock size={12}/> Histórico</h4>
                            <ul className="space-y-3">
                                <li className="text-xs">
                                    <span className="block font-bold text-slate-700 dark:text-slate-300">Campanha Black Friday</span>
                                    <span className="text-slate-400">Enviado em 10/11/2023</span>
                                </li>
                                <li className="text-xs">
                                    <span className="block font-bold text-slate-700 dark:text-slate-300">Chamado #4023</span>
                                    <span className="text-slate-400">Resolvido por João</span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Inbox;
