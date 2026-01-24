
import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Search, Filter, Clock, CheckCircle, User, MoreVertical, 
    Send, Paperclip, Smile, Lock, Image as ImageIcon, Mic, FileText, 
    Check, X, ChevronDown, Tag, Phone, Mail, Archive, Inbox as InboxIcon,
    RefreshCw, AlertCircle, StickyNote, ArrowRight, Loader2, Play, Pause, Video, Copy,
    CornerUpLeft, MoreHorizontal, UserPlus, Star, Trash2
} from 'lucide-react';
import { Conversation, Message, User as UserType, MessageType } from '../types';
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

    // Filters
    const [filterStatus, setFilterStatus] = useState<'open' | 'resolved'>('open');
    const [filterAssignee, setFilterAssignee] = useState<'me' | 'unassigned' | 'all'>('me');
    const [searchTerm, setSearchTerm] = useState('');

    // Composer
    const [inputText, setInputText] = useState('');
    const [isPrivateNote, setIsPrivateNote] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
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
            
            // Update conversation snippet in list
            setConversations(prev => prev.map(c => 
                c.id === activeConversationId 
                ? { ...c, lastMessage: file ? (file.type.startsWith('image') ? '📷 Imagem' : '📎 Arquivo') : (isPrivateNote ? '🔒 Nota interna' : newMsg.content), lastMessageAt: newMsg.createdAt } 
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
    });

    const activeConversation = conversations.find(c => c.id === activeConversationId);

    const getInitials = (name: string) => name.substring(0, 2).toUpperCase();
    const formatTime = (iso: string) => {
        const date = new Date(iso);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // --- RENDER HELPERS ---
    const renderMessageContent = (msg: Message) => {
        switch (msg.type) {
            case 'image':
                return (
                    <div className="space-y-1">
                        <div className="rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 max-w-[280px] border border-slate-200 dark:border-slate-600 cursor-pointer hover:opacity-90 transition-opacity">
                            <img src={msg.attachmentUrl || "https://placehold.co/600x400?text=Imagem"} alt="Attachment" className="w-full h-auto object-cover" />
                        </div>
                        {msg.content && <p className="text-sm mt-1">{msg.content}</p>}
                    </div>
                );
            case 'audio':
                return (
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 p-2.5 rounded-xl min-w-[220px] border border-slate-200 dark:border-slate-600">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center shrink-0 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-800">
                            <Play size={14} fill="currentColor" />
                        </div>
                        <div className="flex-1 space-y-1">
                            <div className="h-1 bg-slate-300 dark:bg-slate-600 rounded-full overflow-hidden w-full">
                                <div className="h-full w-1/3 bg-blue-500"></div>
                            </div>
                            <div className="flex justify-between text-[9px] text-slate-500 dark:text-slate-400 font-mono">
                                <span>0:05</span>
                                <span>0:15</span>
                            </div>
                        </div>
                    </div>
                );
            case 'video':
                 return (
                    <div className="space-y-1">
                        <div className="rounded-lg overflow-hidden bg-black max-w-[280px] relative flex items-center justify-center aspect-video border border-slate-800 cursor-pointer">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors">
                                <Play size={24} fill="currentColor" className="text-white ml-1"/>
                            </div>
                        </div>
                        {msg.content && <p className="text-sm mt-1">{msg.content}</p>}
                    </div>
                );
            case 'file':
                return (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 max-w-[250px] cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700">
                        <div className="p-2 bg-red-100 dark:bg-red-900/20 text-red-600 rounded-lg">
                            <FileText size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 truncate">Documento.pdf</p>
                            <p className="text-xs text-slate-400">1.2 MB</p>
                        </div>
                    </div>
                );
            default:
                return <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>;
        }
    }

    return (
        <div className="flex h-full w-full bg-white dark:bg-slate-900 overflow-hidden">
            
            {/* COLUMN 1: CONVERSATION LIST */}
            <div className={`flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 w-full md:w-80 lg:w-[350px] shrink-0 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
                {/* Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
                            <InboxIcon className="text-blue-600" size={20}/> Inbox
                        </h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                            <button onClick={() => setFilterStatus('open')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterStatus === 'open' ? 'bg-white dark:bg-slate-600 shadow text-blue-600 dark:text-blue-300' : 'text-slate-500'}`}>Abertos</button>
                            <button onClick={() => setFilterStatus('resolved')} className={`px-3 py-1 text-xs font-bold rounded-md transition-all ${filterStatus === 'resolved' ? 'bg-white dark:bg-slate-600 shadow text-green-600 dark:text-green-300' : 'text-slate-500'}`}>Resolvidos</button>
                        </div>
                    </div>
                    
                    <div className="space-y-3">
                        {/* Search */}
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14}/>
                            <input 
                                type="text" 
                                placeholder="Buscar conversa..." 
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Quick Filters */}
                        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                            {[
                                { id: 'me', label: 'Meus' },
                                { id: 'unassigned', label: 'Sem Dono' },
                                { id: 'all', label: 'Todos' }
                            ].map(filter => (
                                <button 
                                    key={filter.id}
                                    onClick={() => setFilterAssignee(filter.id as any)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border whitespace-nowrap transition-colors ${
                                        filterAssignee === filter.id 
                                        ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 border-transparent' 
                                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-700'
                                    }`}
                                >
                                    {filter.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="p-8 flex justify-center"><Loader2 className="animate-spin text-slate-400"/></div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="p-10 text-center flex flex-col items-center justify-center h-64">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4">
                                <InboxIcon size={32} className="text-slate-400 opacity-50"/>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhuma conversa encontrada.</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredConversations.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => setActiveConversationId(c.id)}
                                    className={`w-full text-left p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all flex gap-3 relative group ${activeConversationId === c.id ? 'bg-blue-50/60 dark:bg-blue-900/10 border-l-4 border-blue-600' : 'border-l-4 border-transparent'}`}
                                >
                                    <div className="relative shrink-0">
                                        {c.contactAvatar ? (
                                            <img src={c.contactAvatar} className="w-10 h-10 rounded-full object-cover shadow-sm" alt="" />
                                        ) : (
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-blue-100 dark:from-indigo-900 dark:to-blue-900 text-indigo-600 dark:text-indigo-300 flex items-center justify-center font-bold text-sm shadow-sm">
                                                {getInitials(c.contactName)}
                                            </div>
                                        )}
                                        {c.channel === 'whatsapp' && (
                                            <div className="absolute -bottom-1 -right-1 bg-[#25D366] rounded-full p-0.5 border-2 border-white dark:border-slate-900 shadow-sm">
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
                                        <div className="flex gap-1.5 mt-2 overflow-hidden">
                                            {c.tags.slice(0, 2).map(tag => (
                                                <span key={tag} className="text-[9px] px-1.5 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-md text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 uppercase font-bold tracking-wide">{tag}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {c.unreadCount > 0 && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-md animate-in zoom-in">
                                            {c.unreadCount}
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* COLUMN 2: CHAT AREA */}
            <div className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-[#0b1120] relative min-w-0 ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                {activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex items-center justify-between px-4 md:px-6 shrink-0 shadow-sm z-20">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setActiveConversationId(null)} className="md:hidden p-2 -ml-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full"><CornerUpLeft size={20}/></button>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-bold text-slate-800 dark:text-white text-base">{activeConversation.contactName}</h3>
                                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${activeConversation.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                                            {activeConversation.status === 'open' ? 'Aberto' : 'Resolvido'}
                                        </div>
                                    </div>
                                    <span className="text-xs text-slate-400 font-mono hidden md:inline-block tracking-wide">{activeConversation.contactPhone}</span>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-3">
                                <div className="relative group">
                                    <button className="text-xs font-bold text-slate-600 dark:text-slate-300 flex items-center gap-2 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1.5 rounded-lg transition-colors border border-slate-200 dark:border-slate-700">
                                        <User size={14}/> 
                                        {activeConversation.assignedTo ? agents.find(a => a.id === activeConversation.assignedTo)?.name.split(' ')[0] : 'Sem Dono'}
                                        <ChevronDown size={12}/>
                                    </button>
                                    <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-xl border border-slate-200 dark:border-slate-700 hidden group-hover:block z-50 animate-in fade-in slide-in-from-top-2">
                                        <div className="p-2 border-b border-slate-100 dark:border-slate-700 text-[10px] font-bold text-slate-400 uppercase">Atribuir para</div>
                                        <div className="max-h-60 overflow-y-auto">
                                            {agents.map(a => (
                                                <button key={a.id} onClick={() => handleAssign(a.id)} className="w-full text-left px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-slate-700 dark:text-slate-300 rounded-md flex items-center justify-between group/item">
                                                    {a.name}
                                                    {activeConversation.assignedTo === a.id && <Check size={12} className="text-blue-600"/>}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 mx-1"></div>
                                
                                {activeConversation.status === 'open' ? (
                                    <button onClick={() => handleStatusChange('resolved')} className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors border border-transparent hover:border-green-200 dark:hover:border-green-900" title="Resolver Conversa">
                                        <CheckCircle size={20}/>
                                    </button>
                                ) : (
                                    <button onClick={() => handleStatusChange('open')} className="p-2 text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition-colors border border-transparent hover:border-amber-200 dark:hover:border-amber-900" title="Reabrir Conversa">
                                        <RefreshCw size={20}/>
                                    </button>
                                )}

                                <button onClick={() => setShowContactInfo(!showContactInfo)} className={`p-2 rounded-lg transition-colors border ${showContactInfo ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400' : 'text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                    <MoreHorizontal size={20}/>
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages Area */}
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar scroll-smooth">
                            {messages.map((msg, idx) => {
                                const isMe = msg.sender === 'agent';
                                const isNote = msg.isPrivate;
                                
                                if (isNote) {
                                    return (
                                        <div key={msg.id} className="flex justify-center my-6 animate-in fade-in zoom-in-95 duration-300">
                                            <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 text-slate-600 dark:text-slate-300 px-4 py-3 rounded-xl text-xs flex flex-col gap-1 w-[85%] md:w-[70%] shadow-sm relative group">
                                                <div className="flex items-center gap-2 mb-1 border-b border-amber-200/50 dark:border-amber-800/30 pb-2">
                                                    <div className="bg-amber-100 dark:bg-amber-900/50 p-1 rounded">
                                                        <Lock size={10} className="text-amber-700 dark:text-amber-500" />
                                                    </div>
                                                    <span className="font-bold text-amber-800 dark:text-amber-500 uppercase tracking-wider text-[10px]">Nota Privada (Interna)</span>
                                                    <span className="ml-auto text-[9px] text-slate-400 opacity-70">{formatTime(msg.createdAt)} • {msg.senderName}</span>
                                                </div>
                                                <p className="leading-relaxed whitespace-pre-wrap font-medium text-slate-700 dark:text-slate-300">{msg.content}</p>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2 duration-300`}>
                                        <div className={`max-w-[85%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                            <div className={`rounded-2xl p-3 md:p-4 shadow-sm relative text-sm ${
                                                isMe 
                                                ? 'bg-blue-600 text-white rounded-br-none' 
                                                : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-800 rounded-bl-none'
                                            }`}>
                                                {/* Reply Context / Name */}
                                                {!isMe && msg.senderName && <p className="text-[10px] text-slate-400 mb-1 font-bold uppercase tracking-wider">{msg.senderName}</p>}
                                                
                                                {renderMessageContent(msg)}
                                            </div>
                                            
                                            <div className={`flex items-center gap-1 mt-1 text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity ${isMe ? 'text-slate-400' : 'text-slate-400'}`}>
                                                {formatTime(msg.createdAt)}
                                                {isMe && (
                                                    msg.status === 'read' ? <div className="flex text-blue-500"><Check size={12}/><Check size={12} className="-ml-1"/></div> : 
                                                    msg.status === 'delivered' ? <div className="flex text-slate-400"><Check size={12}/><Check size={12} className="-ml-1 opacity-50"/></div> : 
                                                    <Check size={12} className="text-slate-300"/>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} className="h-2" />
                        </div>

                        {/* Composer */}
                        <div className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 z-20">
                            <div className={`rounded-2xl border transition-colors shadow-sm overflow-hidden ${
                                isPrivateNote 
                                ? 'bg-amber-50/50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 focus-within:border-blue-400 dark:focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-400'
                            }`}>
                                {/* Tabs */}
                                <div className="flex border-b border-slate-200 dark:border-slate-800">
                                    <button 
                                        onClick={() => setIsPrivateNote(false)}
                                        className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${!isPrivateNote ? 'text-slate-800 dark:text-white bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-800' : 'text-slate-400 hover:text-slate-600'}`}
                                    >
                                        <MessageSquare size={14}/> Responder
                                    </button>
                                    <button 
                                        onClick={() => setIsPrivateNote(true)}
                                        className={`px-4 py-2 text-xs font-bold flex items-center gap-2 transition-colors ${isPrivateNote ? 'text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800'}`}
                                    >
                                        <Lock size={14}/> Nota Privada
                                    </button>
                                </div>

                                <textarea 
                                    className="w-full bg-transparent border-none outline-none text-sm p-4 min-h-[80px] max-h-48 resize-none dark:text-white placeholder:text-slate-400"
                                    placeholder={isPrivateNote ? "Escreva uma nota interna visível apenas para sua equipe..." : "Digite sua mensagem..."}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                                />
                                
                                <div className="flex items-center justify-between p-2 px-3 bg-slate-50/50 dark:bg-slate-800/50">
                                    <div className="flex items-center gap-1">
                                        <label className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg cursor-pointer transition-colors" title="Anexar Arquivo">
                                            <Paperclip size={18}/>
                                            <input type="file" className="hidden" onChange={handleFileUpload} ref={fileInputRef}/>
                                        </label>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                            <Smile size={18}/>
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors">
                                            <Mic size={18}/>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={isSending || (!inputText.trim())}
                                        className={`px-4 py-2 rounded-lg transition-all flex items-center gap-2 shadow-sm font-bold text-sm ${
                                            inputText.trim() 
                                            ? (isPrivateNote ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white') 
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isSending ? <Loader2 className="animate-spin" size={16}/> : (isPrivateNote ? <Lock size={14}/> : <Send size={14}/>)}
                                        {isPrivateNote ? 'Salvar Nota' : 'Enviar'}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-4 animate-in fade-in">
                        <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm">
                            <MessageSquare size={32} className="opacity-20"/>
                        </div>
                        <div className="text-center">
                            <h3 className="font-bold text-slate-600 dark:text-slate-300 text-lg">Nenhuma conversa selecionada</h3>
                            <p className="text-sm text-slate-500 dark:text-slate-500 max-w-xs mt-1">Selecione um contato na lista à esquerda para iniciar o atendimento.</p>
                        </div>
                    </div>
                )}
            </div>

            {/* COLUMN 3: RIGHT SIDEBAR (CONTEXT) */}
            {activeConversation && showContactInfo && (
                <div className="w-80 border-l border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 hidden xl:flex flex-col overflow-y-auto animate-in slide-in-from-right-4">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 mb-4 overflow-hidden border-4 border-slate-50 dark:border-slate-800 shadow-md">
                            {activeConversation.contactAvatar ? (
                                <img src={activeConversation.contactAvatar} alt="" className="w-full h-full object-cover"/>
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-2xl">
                                    {getInitials(activeConversation.contactName)}
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-lg text-slate-800 dark:text-white leading-tight">{activeConversation.contactName}</h3>
                        <p className="text-slate-500 text-sm mt-1 mb-3">{activeConversation.contactPhone}</p>
                        
                        <div className="flex gap-2 w-full">
                            <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1">
                                <UserPlus size={14}/> Editar
                            </button>
                            <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors flex items-center justify-center gap-1">
                                <Mail size={14}/> Email
                            </button>
                        </div>
                    </div>

                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Etiquetas</h4>
                        <div className="flex flex-wrap gap-2">
                            {activeConversation.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-full text-xs font-medium text-slate-600 dark:text-slate-300 flex items-center gap-1">
                                    <Tag size={10}/> {tag}
                                </span>
                            ))}
                            <button className="px-2.5 py-1 bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 rounded-full text-xs text-slate-400 hover:text-blue-500 hover:border-blue-400 transition-colors flex items-center gap-1">
                                <Plus size={10}/> Add
                            </button>
                        </div>
                    </div>

                    <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Notas</h4>
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/30 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300 italic">
                            "Cliente prefere contato no período da manhã. Interessado no plano anual."
                        </div>
                        <button className="w-full mt-2 text-xs text-slate-400 hover:text-blue-500 font-medium text-left flex items-center gap-1">
                            <Plus size={12}/> Adicionar nota
                        </button>
                    </div>

                    <div className="p-6 flex-1">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Histórico</h4>
                        <div className="space-y-4 relative pl-4 border-l border-slate-200 dark:border-slate-800">
                            {[1,2].map(i => (
                                <div key={i} className="relative">
                                    <div className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700 ring-4 ring-white dark:ring-slate-900"></div>
                                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">Ticket #{9000-i} Resolvido</p>
                                    <p className="text-[10px] text-slate-400">12 Out, 2023 por João Silva</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper Icon
function Plus({size}: {size: number}) {
    return <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>;
}

export default Inbox;
