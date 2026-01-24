import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    MessageSquare, Search, Filter, Clock, CheckCircle, User, MoreVertical, 
    Send, Paperclip, Smile, Lock, Image as ImageIcon, Mic, FileText, 
    Check, X, ChevronDown, Tag, Phone, Mail, Archive, Inbox as InboxIcon,
    RefreshCw, AlertCircle, StickyNote, ArrowRight, Loader2, Play, Pause, Video, Copy,
    CornerUpLeft, MoreHorizontal, UserPlus, Star, Trash2, Hash, Command, Sidebar, XCircle
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
    
    // UI Toggles
    const [showContactInfo, setShowContactInfo] = useState(true);
    const [filterStatus, setFilterStatus] = useState<'open' | 'resolved'>('open');
    const [filterAssignee, setFilterAssignee] = useState<'me' | 'unassigned' | 'all'>('me');
    const [searchTerm, setSearchTerm] = useState('');

    // Composer
    const [inputText, setInputText] = useState('');
    const [isPrivateNote, setIsPrivateNote] = useState(false);
    const [isSending, setIsSending] = useState(false);
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        loadInitialData();
    }, [currentUser]);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        }
    }, [activeConversationId]);

    // Auto-scroll on new messages
    useEffect(() => {
        if (scrollContainerRef.current) {
            const { scrollHeight, clientHeight } = scrollContainerRef.current;
            scrollContainerRef.current.scrollTo({ top: scrollHeight - clientHeight, behavior: 'smooth' });
        }
    }, [messages, activeConversationId]);

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [convs, agentList] = await Promise.all([
                chatService.getConversations(currentUser),
                teamService.getAgents()
            ]);
            setConversations(convs);
            setAgents(agentList.map(a => ({ id: a.id, name: a.name })));
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

    const handleSendMessage = async (file?: File) => {
        if ((!inputText.trim() && !file) || !activeConversationId) return;
        setIsSending(true);
        try {
            const newMsg = await chatService.sendMessage(activeConversationId, inputText, currentUser, isPrivateNote, file);
            setMessages(prev => [...prev, newMsg]);
            setInputText('');
            if(isPrivateNote) setIsPrivateNote(false); // Reset to public after sending note? Maybe better to keep it. keeping for flow.
            
            // Update conversation snippet
            setConversations(prev => prev.map(c => 
                c.id === activeConversationId 
                ? { 
                    ...c, 
                    lastMessage: file ? (file.type.startsWith('image') ? '📷 Imagem' : '📎 Arquivo') : (isPrivateNote ? '🔒 Nota interna' : newMsg.content), 
                    lastMessageAt: newMsg.createdAt,
                    status: 'open' // Reopen if replying
                  } 
                : c
            ));
        } catch (e) {
            showToast('Erro ao enviar mensagem', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            handleSendMessage(e.target.files[0]);
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
    }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    // Group Messages by Date
    const groupedMessages = useMemo(() => {
        const groups: { [key: string]: Message[] } = {};
        messages.forEach(msg => {
            const date = new Date(msg.createdAt).toLocaleDateString();
            if (!groups[date]) groups[date] = [];
            groups[date].push(msg);
        });
        return groups;
    }, [messages]);

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
    
    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getDateLabel = (dateStr: string) => {
        const today = new Date().toLocaleDateString();
        const yesterday = new Date(Date.now() - 86400000).toLocaleDateString();
        if (dateStr === today) return 'Hoje';
        if (dateStr === yesterday) return 'Ontem';
        return dateStr;
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-slate-900 overflow-hidden border-t border-slate-200 dark:border-slate-800 md:border-t-0">
            
            {/* COLUMN 1: CONVERSATION LIST */}
            <div className={`flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full md:w-80 lg:w-[360px] shrink-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                {/* Header & Filters */}
                <div className="flex flex-col border-b border-slate-200 dark:border-slate-800">
                    <div className="p-4 pb-2">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-xl text-slate-800 dark:text-white flex items-center gap-2">
                                <InboxIcon className="text-blue-600" size={24}/> Conversas
                            </h2>
                            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                                <button onClick={() => setFilterStatus('open')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'open' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Abertas</button>
                                <button onClick={() => setFilterStatus('resolved')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${filterStatus === 'resolved' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 hover:text-slate-700'}`}>Resolvidas</button>
                            </div>
                        </div>
                        
                        <div className="relative mb-3">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                            <input 
                                type="text" 
                                placeholder="Buscar contato, telefone..." 
                                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all placeholder:text-slate-400"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Secondary Filters */}
                    <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                        <button onClick={() => setFilterAssignee('me')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filterAssignee === 'me' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}>Meus Tickets</button>
                        <button onClick={() => setFilterAssignee('unassigned')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filterAssignee === 'unassigned' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}>Sem Dono</button>
                        <button onClick={() => setFilterAssignee('all')} className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap ${filterAssignee === 'all' ? 'bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-200' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}>Todos</button>
                    </div>
                </div>

                {/* Conversation List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/50 dark:bg-slate-900/50">
                    {loading ? (
                        <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-slate-400" size={24}/></div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-6 text-center">
                            <InboxIcon size={48} strokeWidth={1} className="mb-4 opacity-50"/>
                            <p className="text-sm font-medium">Nenhuma conversa encontrada.</p>
                            <p className="text-xs mt-1 opacity-70">Tente ajustar os filtros.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredConversations.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setActiveConversationId(c.id)}
                                    className={`w-full text-left p-4 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all flex gap-3 relative group ${activeConversationId === c.id ? 'bg-white dark:bg-slate-800 border-l-4 border-blue-600 shadow-sm z-10' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="relative shrink-0">
                                        {c.contactAvatar ? (
                                            <img src={c.contactAvatar} className="w-12 h-12 rounded-full object-cover shadow-sm border border-slate-100 dark:border-slate-700" alt="" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-sm shadow-sm border border-white dark:border-slate-600">
                                                {getInitials(c.contactName)}
                                            </div>
                                        )}
                                        {c.channel === 'whatsapp' && (
                                            <div className="absolute -bottom-1 -right-1 bg-[#25D366] rounded-full p-1 border-2 border-white dark:border-slate-900 shadow-sm">
                                                <MessageSquare size={10} className="text-white" fill="currentColor"/>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <span className={`font-bold text-sm truncate ${c.unreadCount > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>{c.contactName}</span>
                                            <span className={`text-[10px] whitespace-nowrap ml-2 ${c.unreadCount > 0 ? 'text-blue-600 font-bold' : 'text-slate-400'}`}>{formatTime(c.lastMessageAt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <p className={`text-xs truncate max-w-[80%] ${c.unreadCount > 0 ? 'font-semibold text-slate-800 dark:text-slate-200' : 'text-slate-500 dark:text-slate-400'}`}>
                                                {c.lastMessage}
                                            </p>
                                            {c.unreadCount > 0 && (
                                                <div className="w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                                                    {c.unreadCount}
                                                </div>
                                            )}
                                        </div>
                                        {c.tags.length > 0 && (
                                            <div className="flex gap-1 mt-2">
                                                {c.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-700/50 rounded text-slate-500 dark:text-slate-400 font-bold tracking-wide border border-slate-200 dark:border-slate-700">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMN 2: CHAT AREA */}
            <div className={`flex-1 flex flex-col bg-[#F3F4F6] dark:bg-[#0b1120] relative min-w-0 ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                {activeConversation ? (
                    <>
                        {/* 1. Top Bar */}
                        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 shadow-sm z-20">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversationId(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><CornerUpLeft size={20}/></button>
                                
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 dark:text-white text-sm md:text-base">{activeConversation.contactName}</h3>
                                        {activeConversation.status === 'resolved' && (
                                            <span className="bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-slate-200 dark:border-slate-700">Resolvido</span>
                                        )}
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500"></div> Online via WhatsApp
                                    </span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                                {/* Assignee Dropdown */}
                                <div className="relative group hidden sm:block">
                                    <button className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors">
                                        <User size={14} className={activeConversation.assignedTo ? 'text-blue-500' : 'text-slate-400'}/> 
                                        {activeConversation.assignedTo ? agents.find(a => a.id === activeConversation.assignedTo)?.name.split(' ')[0] : 'Atribuir'}
                                        <ChevronDown size={12}/>
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-1">
                                        <div className="p-2 text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 dark:border-slate-700">Equipe</div>
                                        <div className="max-h-48 overflow-y-auto p-1">
                                            {agents.map(a => (
                                                <button key={a.id} onClick={() => handleAssign(a.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-200 rounded-md flex items-center justify-between">
                                                    {a.name}
                                                    {activeConversation.assignedTo === a.id && <Check size={12} className="text-blue-600"/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-2 hidden sm:block"></div>
                                
                                {activeConversation.status === 'open' ? (
                                    <button onClick={() => handleStatusChange('resolved')} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-xs font-bold shadow-sm shadow-green-600/20">
                                        <CheckCircle size={14}/> <span className="hidden sm:inline">Resolver</span>
                                    </button>
                                ) : (
                                    <button onClick={() => handleStatusChange('open')} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 dark:bg-slate-800 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-xs font-bold">
                                        <RefreshCw size={14}/> <span className="hidden sm:inline">Reabrir</span>
                                    </button>
                                )}

                                <button 
                                    onClick={() => setShowContactInfo(!showContactInfo)} 
                                    className={`p-2 rounded-lg transition-colors border ml-2 ${showContactInfo ? 'bg-slate-100 border-slate-200 text-slate-700 dark:bg-slate-800 dark:border-slate-700 dark:text-white' : 'border-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
                                >
                                    <Sidebar size={18}/>
                                </button>
                            </div>
                        </div>

                        {/* 2. Chat Feed */}
                        <div 
                            className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth bg-[#eef0f3] dark:bg-[#0b1120]" 
                            ref={scrollContainerRef}
                        >
                            {Object.keys(groupedMessages).map((date) => (
                                <div key={date} className="space-y-6">
                                    <div className="flex justify-center sticky top-0 z-10">
                                        <span className="bg-slate-200/80 dark:bg-slate-800/80 backdrop-blur text-slate-600 dark:text-slate-400 text-[10px] font-bold px-3 py-1 rounded-full shadow-sm uppercase tracking-wide border border-white/20">
                                            {getDateLabel(date)}
                                        </span>
                                    </div>
                                    
                                    {groupedMessages[date].map((msg) => {
                                        const isMe = msg.sender === 'agent';
                                        const isSystem = msg.sender === 'system';
                                        const isPrivate = msg.isPrivate;

                                        if (isSystem) {
                                            return (
                                                <div key={msg.id} className="flex justify-center my-4 animate-in fade-in">
                                                    <div className="text-slate-400 text-xs flex items-center gap-2 bg-slate-100/50 dark:bg-slate-800/50 px-3 py-1 rounded-full border border-slate-200 dark:border-slate-700">
                                                        <AlertCircle size={12}/> {msg.content}
                                                    </div>
                                                </div>
                                            );
                                        }

                                        if (isPrivate) {
                                            return (
                                                <div key={msg.id} className="flex justify-center my-4 animate-in fade-in zoom-in-95">
                                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/40 text-slate-700 dark:text-slate-300 p-4 rounded-xl text-sm flex flex-col gap-2 w-[85%] shadow-sm relative group max-w-2xl">
                                                        <div className="flex items-center justify-between border-b border-amber-200/50 dark:border-amber-800/30 pb-2 mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-amber-100 dark:bg-amber-900/40 p-1.5 rounded-lg text-amber-700 dark:text-amber-500">
                                                                    <Lock size={12} />
                                                                </div>
                                                                <span className="font-bold text-amber-800 dark:text-amber-500 text-xs uppercase tracking-wide">Nota Interna</span>
                                                            </div>
                                                            <span className="text-[10px] text-slate-400">{formatTime(msg.createdAt)} • {msg.senderName}</span>
                                                        </div>
                                                        <p className="leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                                    </div>
                                                </div>
                                            );
                                        }

                                        return (
                                            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2`}>
                                                <div className={`max-w-[85%] md:max-w-[70%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                                    <div 
                                                        className={`rounded-2xl p-3 md:p-4 shadow-sm relative text-sm leading-relaxed ${
                                                            isMe 
                                                            ? 'bg-blue-600 text-white rounded-br-none' 
                                                            : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                                                        }`}
                                                    >
                                                        {!isMe && msg.senderName && <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">{msg.senderName}</p>}
                                                        
                                                        {msg.type === 'image' && (
                                                            <div className="mb-2 rounded-lg overflow-hidden bg-black/5 dark:bg-white/5 border border-white/10">
                                                                <img src={msg.attachmentUrl} alt="Anexo" className="max-w-full h-auto max-h-64 object-contain" />
                                                            </div>
                                                        )}
                                                        
                                                        {msg.type === 'audio' && (
                                                            <div className="flex items-center gap-3 p-2 bg-white/10 rounded-lg min-w-[200px]">
                                                                <button className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center shrink-0 shadow-sm"><Play size={14} fill="currentColor"/></button>
                                                                <div className="flex-1 h-8 flex items-center gap-0.5 opacity-80">
                                                                    {[...Array(15)].map((_,i) => <div key={i} className="w-1 bg-current rounded-full" style={{height: `${Math.random() * 16 + 4}px`}}></div>)}
                                                                </div>
                                                            </div>
                                                        )}

                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] font-medium text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity px-1">
                                                        {formatTime(msg.createdAt)}
                                                        {isMe && (
                                                            msg.status === 'read' ? <div className="flex text-blue-500"><Check size={12}/><Check size={12} className="-ml-1"/></div> : 
                                                            <Check size={12}/>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ))}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* 3. Composer */}
                        <div className={`p-4 border-t transition-colors z-30 ${isPrivateNote ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                            <div className={`rounded-xl border shadow-sm bg-white dark:bg-slate-800 overflow-hidden transition-all ${isPrivateNote ? 'border-amber-300 dark:border-amber-700 ring-2 ring-amber-100 dark:ring-amber-900/30' : 'border-slate-200 dark:border-slate-700 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-400'}`}>
                                
                                {/* Mode Switcher */}
                                <div className="flex border-b border-slate-100 dark:border-slate-700">
                                    <button 
                                        onClick={() => setIsPrivateNote(false)}
                                        className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors border-r border-slate-100 dark:border-slate-700 ${!isPrivateNote ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <MessageSquare size={14}/> Responder
                                    </button>
                                    <button 
                                        onClick={() => setIsPrivateNote(true)}
                                        className={`flex-1 py-2 text-xs font-bold flex items-center justify-center gap-2 transition-colors ${isPrivateNote ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400' : 'bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <Lock size={14}/> Nota Privada
                                    </button>
                                </div>

                                <textarea 
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if(e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handleSendMessage() }}
                                    className="w-full max-h-48 min-h-[80px] p-4 text-sm bg-transparent outline-none resize-none dark:text-white placeholder:text-slate-400"
                                    placeholder={isPrivateNote ? "Escreva uma nota interna visível apenas para a equipe..." : "Digite sua mensagem... (Cmd+Enter para enviar)"}
                                />

                                <div className="flex items-center justify-between p-2 bg-slate-50/50 dark:bg-slate-800/50 border-t border-slate-100 dark:border-slate-700">
                                    <div className="flex items-center gap-1">
                                        <label className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg cursor-pointer transition-colors">
                                            <Paperclip size={18}/>
                                            <input type="file" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                                        </label>
                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Smile size={18}/></button>
                                        <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"><Hash size={18}/></button>
                                    </div>
                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={isSending || !inputText.trim()}
                                        className={`px-4 py-2 rounded-lg font-bold text-sm shadow-sm flex items-center gap-2 transition-all ${
                                            isPrivateNote 
                                            ? 'bg-amber-500 hover:bg-amber-600 text-white' 
                                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                    >
                                        {isSending ? <Loader2 className="animate-spin" size={16}/> : (isPrivateNote ? <Lock size={14}/> : <Send size={14}/>)}
                                        {isPrivateNote ? 'Salvar Nota' : 'Enviar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8 text-center bg-slate-50 dark:bg-slate-900">
                        <div className="w-24 h-24 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center shadow-sm mb-6">
                            <MessageSquare size={40} className="text-slate-300 dark:text-slate-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-700 dark:text-slate-200 mb-2">Selecione uma conversa</h3>
                        <p className="text-slate-500 dark:text-slate-500 max-w-sm">
                            Escolha um contato da lista à esquerda para visualizar o histórico e iniciar o atendimento.
                        </p>
                        <div className="mt-8 flex gap-4 text-xs font-mono text-slate-400 opacity-70">
                            <span className="flex items-center gap-1"><Command size={10}/> K para buscar</span>
                            <span className="flex items-center gap-1">↑ ↓ para navegar</span>
                        </div>
                    </div>
                )}
            </div>

            {/* COLUMN 3: RIGHT CONTEXT SIDEBAR */}
            {activeConversation && showContactInfo && (
                <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 hidden xl:flex flex-col overflow-y-auto animate-in slide-in-from-right-4 duration-300">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                        <div className="relative">
                            {activeConversation.contactAvatar ? (
                                <img src={activeConversation.contactAvatar} className="w-24 h-24 rounded-full object-cover shadow-lg border-4 border-slate-50 dark:border-slate-800" alt="" />
                            ) : (
                                <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-3xl font-bold text-slate-500 border-4 border-slate-50 dark:border-slate-800">
                                    {getInitials(activeConversation.contactName)}
                                </div>
                            )}
                            <div className="absolute bottom-1 right-1 bg-white dark:bg-slate-800 p-1.5 rounded-full shadow-sm">
                                <div className="bg-[#25D366] rounded-full p-1"><MessageSquare size={12} className="text-white" fill="currentColor"/></div>
                            </div>
                        </div>
                        
                        <h3 className="font-bold text-xl text-slate-800 dark:text-white mt-4 mb-1">{activeConversation.contactName}</h3>
                        <p className="text-slate-500 font-mono text-sm mb-4">{activeConversation.contactPhone}</p>
                        
                        <div className="grid grid-cols-2 gap-3 w-full">
                            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 group">
                                <UserPlus size={18} className="text-slate-500 group-hover:text-blue-500"/>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Editar</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700 group">
                                <Mail size={18} className="text-slate-500 group-hover:text-blue-500"/>
                                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">Email</span>
                            </button>
                        </div>
                    </div>

                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Etiquetas</h4>
                            <button className="text-blue-600 hover:text-blue-700 text-xs font-bold flex items-center gap-1"><Plus size={12}/> Adicionar</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {activeConversation.tags.map(tag => (
                                <span key={tag} className="px-3 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-full text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1 group cursor-pointer hover:border-blue-300">
                                    <Tag size={10} className="text-slate-400 group-hover:text-blue-500"/> {tag}
                                </span>
                            ))}
                            {activeConversation.tags.length === 0 && <p className="text-xs text-slate-400 italic">Sem etiquetas.</p>}
                        </div>
                    </div>

                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Atributos do Contato</h4>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Empresa</span>
                                <span className="font-medium text-slate-800 dark:text-white">Acme Corp</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Localização</span>
                                <span className="font-medium text-slate-800 dark:text-white">São Paulo, BR</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-500">Plano</span>
                                <span className="font-medium text-green-600 bg-green-50 dark:bg-green-900/20 px-2 rounded text-xs">Enterprise</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-6 flex-1 bg-slate-50/50 dark:bg-slate-800/20">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Conversas Anteriores</h4>
                        <div className="space-y-4 relative pl-4 border-l-2 border-slate-200 dark:border-slate-700 ml-1">
                            {[1, 2].map(i => (
                                <div key={i} className="relative group cursor-pointer">
                                    <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-slate-300 dark:bg-slate-600 border-2 border-white dark:border-slate-900 group-hover:bg-blue-500 transition-colors"></div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300 group-hover:text-blue-600 transition-colors">Ticket #{9420-i} - Suporte</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">Resolvido em 12 Out, 2023</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon Component
function Plus({size}: {size: number}) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}

export default Inbox;