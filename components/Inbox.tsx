
import React, { useState, useEffect, useRef } from 'react';
import { 
    MessageSquare, Search, Filter, Clock, CheckCircle, User, MoreVertical, 
    Send, Paperclip, Smile, Lock, Image as ImageIcon, Mic, FileText, 
    Check, X, ChevronDown, Tag, Phone, Mail, Archive, Inbox as InboxIcon,
    RefreshCw, AlertCircle, StickyNote, ArrowRight, Loader2, Play, Pause, Video, Copy,
    CornerUpLeft
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
                ? { ...c, lastMessage: file ? (file.type.startsWith('image') ? '📷 Imagem' : '📎 Arquivo') : newMsg.content, lastMessageAt: newMsg.createdAt } 
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
                        <div className="rounded-lg overflow-hidden bg-slate-200 dark:bg-slate-700 max-w-[280px] border border-slate-200 dark:border-slate-600">
                            <img src={msg.attachmentUrl || "https://placehold.co/600x400?text=Imagem"} alt="Attachment" className="w-full h-auto object-cover" />
                        </div>
                        {msg.content && <p className="text-sm mt-1">{msg.content}</p>}
                    </div>
                );
            case 'audio':
                return (
                    <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-700/50 p-2.5 rounded-xl min-w-[220px] border border-slate-200 dark:border-slate-600">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-full flex items-center justify-center shrink-0">
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
                        <div className="rounded-lg overflow-hidden bg-black max-w-[280px] relative flex items-center justify-center aspect-video border border-slate-800">
                            <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                <Play size={24} fill="currentColor" className="text-white ml-1"/>
                            </div>
                        </div>
                        {msg.content && <p className="text-sm mt-1">{msg.content}</p>}
                    </div>
                );
            case 'file':
                return (
                    <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-700/50 p-3 rounded-lg border border-slate-200 dark:border-slate-600 max-w-[250px]">
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

    // --- RENDER ---
    return (
        <div className="flex h-[calc(100vh-140px)] md:h-[calc(100vh-100px)] bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in">
            
            {/* LEFT COLUMN: LIST */}
            <div className={`w-full md:w-80 flex flex-col border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 ${activeConversationId ? 'hidden md:flex' : 'flex'}`}>
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
                <div className={`flex-1 flex flex-col bg-slate-100/50 dark:bg-slate-900/50 relative ${activeConversation ? 'flex' : 'hidden md:flex'}`}>
                    
                    {/* Chat Header */}
                    <div className="h-16 border-b border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 flex items-center justify-between px-4 md:px-6 shrink-0">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setActiveConversationId(null)} className="md:hidden p-2 -ml-2 text-slate-500"><CornerUpLeft size={20}/></button>
                            <div>
                                <div className="flex items-center gap-2">
                                    <h3 className="font-bold text-slate-800 dark:text-white">{activeConversation.contactName}</h3>
                                    <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${activeConversation.status === 'open' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400'}`}>
                                        {activeConversation.status === 'open' ? 'Aberto' : 'Resolvido'}
                                    </div>
                                </div>
                                <span className="text-xs text-slate-400 font-mono hidden md:inline-block">{activeConversation.contactPhone}</span>
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
                    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 custom-scrollbar bg-slate-100/50 dark:bg-[#0b1120]">
                        {messages.map((msg, idx) => {
                            const isMe = msg.sender === 'agent';
                            const isNote = msg.isPrivate;
                            
                            if (isNote) {
                                return (
                                    <div key={msg.id} className="flex justify-center my-4 animate-in fade-in zoom-in-95">
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 text-slate-600 dark:text-slate-300 px-4 py-3 rounded-lg text-xs flex flex-col gap-1 w-[90%] md:w-[80%] shadow-sm relative">
                                            <div className="flex items-center gap-2 mb-1 border-b border-amber-200/50 dark:border-amber-800/30 pb-2">
                                                <Lock size={12} className="text-amber-600 dark:text-amber-500" />
                                                <span className="font-bold text-amber-700 dark:text-amber-500 uppercase tracking-wider text-[10px]">Nota Privada</span>
                                                <span className="ml-auto text-[9px] text-slate-400">{formatTime(msg.createdAt)} • {msg.senderName}</span>
                                            </div>
                                            <p className="leading-relaxed whitespace-pre-wrap font-medium">{msg.content}</p>
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group animate-in slide-in-from-bottom-2`}>
                                    <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl p-3 md:p-4 shadow-sm relative ${
                                        isMe 
                                        ? 'bg-blue-600 text-white rounded-br-none' 
                                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-100 dark:border-slate-700 rounded-bl-none'
                                    }`}>
                                        {/* Sender Name (if agent and not me, or group context) */}
                                        {isMe && <p className="text-[9px] opacity-70 mb-1 text-right font-medium">Você</p>}
                                        {!isMe && msg.senderName && <p className="text-[9px] text-slate-400 mb-1 font-medium">{msg.senderName}</p>}
                                        
                                        {/* Content Render based on Type */}
                                        {renderMessageContent(msg)}
                                        
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

                    {/* Chatwoot-style Composer */}
                    <div className="bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
                        
                        {/* TABS */}
                        <div className="flex px-4 pt-3 gap-1">
                            <button 
                                onClick={() => setIsPrivateNote(false)}
                                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x border-transparent relative -mb-[1px] z-10 ${
                                    !isPrivateNote 
                                    ? 'bg-white dark:bg-slate-800 text-slate-800 dark:text-white border-slate-200 dark:border-slate-700 border-b-white dark:border-b-slate-800' 
                                    : 'text-slate-500 hover:text-slate-700 bg-slate-50 dark:bg-slate-900 border-b-slate-200 dark:border-b-slate-700'
                                }`}
                            >
                                <span className="flex items-center gap-2"><MessageSquare size={14}/> Responder</span>
                            </button>
                            <button 
                                onClick={() => setIsPrivateNote(true)}
                                className={`px-4 py-2 text-xs font-bold rounded-t-lg transition-colors border-t border-x border-transparent relative -mb-[1px] z-10 ${
                                    isPrivateNote 
                                    ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800 border-b-amber-50 dark:border-b-transparent' 
                                    : 'text-slate-500 hover:text-slate-700 bg-slate-50 dark:bg-slate-900 border-b-slate-200 dark:border-b-slate-700'
                                }`}
                            >
                                <span className="flex items-center gap-2"><Lock size={14}/> Nota Privada</span>
                            </button>
                        </div>

                        {/* INPUT AREA */}
                        <div className={`p-4 transition-colors ${isPrivateNote ? 'bg-amber-50 dark:bg-amber-900/10' : 'bg-white dark:bg-slate-800'}`}>
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 transition-shadow shadow-sm">
                                <textarea 
                                    className="w-full bg-transparent border-none outline-none text-sm p-4 min-h-[80px] max-h-48 resize-none dark:text-white placeholder:text-slate-400"
                                    placeholder={isPrivateNote ? "Escreva uma nota interna visível apenas para sua equipe..." : "Digite sua mensagem..."}
                                    value={inputText}
                                    onChange={e => setInputText(e.target.value)}
                                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }}}
                                />
                                
                                {/* TOOLBAR */}
                                <div className="flex items-center justify-between p-2 border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                                    <div className="flex items-center gap-2">
                                        <label className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full cursor-pointer transition-colors">
                                            <Paperclip size={18}/>
                                            <input type="file" className="hidden" onChange={handleFileUpload} ref={fileInputRef}/>
                                        </label>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                            <Smile size={18}/>
                                        </button>
                                        <button className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors">
                                            <Mic size={18}/>
                                        </button>
                                    </div>
                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={isSending || (!inputText.trim())}
                                        className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                                            inputText.trim() 
                                            ? (isPrivateNote ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white') 
                                            : 'bg-slate-200 dark:bg-slate-700 text-slate-400 cursor-not-allowed'
                                        }`}
                                    >
                                        {isSending ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                                        <span className="text-xs font-bold pr-1">{isPrivateNote ? 'Salvar Nota' : 'Enviar'}</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="hidden md:flex flex-1 items-center justify-center bg-slate-50 dark:bg-slate-900/50 text-slate-400 flex-col gap-4">
                    <div className="w-24 h-24 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center">
                        <MessageSquare size={48} className="opacity-20"/>
                    </div>
                    <p className="text-sm font-medium">Selecione uma conversa para iniciar o atendimento.</p>
                </div>
            )}
        </div>
    );
};

export default Inbox;
