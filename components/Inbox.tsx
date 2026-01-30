
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    MessageSquare, Search, Filter, Clock, CheckCircle, User, MoreVertical, 
    Send, Paperclip, Smile, Lock, Image as ImageIcon, Mic, FileText, 
    Check, X, ChevronDown, Tag, Phone, Mail, Archive, Inbox as InboxIcon,
    RefreshCw, AlertCircle, StickyNote, ArrowRight, Loader2, Play, Pause, Video, Copy,
    CornerUpLeft, MoreHorizontal, UserPlus, Star, Trash2, Hash, Command, Sidebar, XCircle, Zap, Shield, ChevronLeft, ChevronRight, MessageCircle, Plus
} from 'lucide-react';
import { Conversation, Message, User as UserType, Tag as TagType } from '../types';
import * as chatService from '../services/chatService';
import * as teamService from '../services/teamService';
import * as contactService from '../services/contactService';
import { useApp } from '../contexts/AppContext';

// --- CHATWOOT-STYLE CANNED RESPONSES (MOCK) ---
const CANNED_RESPONSES = [
    { code: 'ola', text: 'Olá! Como posso ajudar você hoje?' },
    { code: 'preco', text: 'Nossos planos começam a partir de R$ 297/mês.' },
    { code: 'pix', text: 'Nossa chave PIX é o CNPJ: 00.000.000/0001-00' },
    { code: 'obrigado', text: 'Agradecemos o seu contato! Tenha um ótimo dia.' },
    { code: 'espera', text: 'Um momento por favor, vou verificar essa informação.' }
];

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
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    const [agents, setAgents] = useState<{id: string, name: string}[]>([]);
    const [availableTags, setAvailableTags] = useState<TagType[]>([]);
    
    // View Filters
    const [filterStatus, setFilterStatus] = useState<'open' | 'resolved'>('open');
    const [filterAssignee, setFilterAssignee] = useState<'me' | 'unassigned' | 'all'>('me');
    const [searchTerm, setSearchTerm] = useState('');

    // Context Sidebar
    const [showRightSidebar, setShowRightSidebar] = useState(true);

    // Composer
    const [inputText, setInputText] = useState('');
    const [isPrivateNote, setIsPrivateNote] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [showCannedMenu, setShowCannedMenu] = useState(false);

    // Refs for auto-scroll
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // --- EFFECTS ---
    useEffect(() => {
        loadInitialData();
    }, [currentUser]);

    useEffect(() => {
        if (activeConversationId) {
            loadMessages(activeConversationId);
        }
    }, [activeConversationId]);

    // Scroll to bottom on new messages
    useEffect(() => {
        scrollToBottom();
    }, [messages, activeConversationId]);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    };

    const loadInitialData = async () => {
        setLoading(true);
        try {
            const [convs, agentList, tagsData] = await Promise.all([
                chatService.getConversations(currentUser),
                teamService.getAgents(),
                contactService.getTags(currentUser.id, currentUser.role)
            ]);
            setConversations(convs);
            setAgents(agentList.map(a => ({ id: a.id, name: a.name })));
            setAvailableTags(tagsData);
        } catch (e) {
            console.error(e);
            showToast('Erro ao carregar conversas', 'error');
        } finally {
            setLoading(false);
        }
    };

    const loadMessages = async (id: string) => {
        setLoadingMessages(true);
        const msgs = await chatService.getMessages(id);
        setMessages(msgs);
        setLoadingMessages(false);
        
        // Optimistic read status update
        setConversations(prev => prev.map(c => 
            c.id === id ? { ...c, unreadCount: 0 } : c
        ));
    };

    // --- LOGIC: FILTERS ---
    const filteredConversations = useMemo(() => {
        return conversations.filter(c => {
            // 1. Status Filter
            if (c.status !== filterStatus) return false;

            // 2. Assignee Filter
            if (filterAssignee === 'me' && c.assignedTo !== currentUser.id) return false;
            if (filterAssignee === 'unassigned' && c.assignedTo) return false;
            // 'all' includes everyone (typically for managers)

            // 3. Search
            if (searchTerm) {
                const term = searchTerm.toLowerCase();
                return (
                    c.contactName.toLowerCase().includes(term) || 
                    c.contactPhone.includes(term) ||
                    c.lastMessage.toLowerCase().includes(term)
                );
            }

            return true;
        }).sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
    }, [conversations, filterStatus, filterAssignee, searchTerm, currentUser.id]);

    const activeConversation = useMemo(() => 
        conversations.find(c => c.id === activeConversationId), 
    [conversations, activeConversationId]);

    // --- ACTIONS ---

    const handleSendMessage = async (file?: File) => {
        if ((!inputText.trim() && !file) || !activeConversationId) return;
        setIsSending(true);
        try {
            const newMsg = await chatService.sendMessage(activeConversationId, inputText, currentUser, isPrivateNote, file);
            setMessages(prev => [...prev, newMsg]);
            
            // Update conversation list snippet
            setConversations(prev => prev.map(c => 
                c.id === activeConversationId 
                ? { ...c, lastMessage: isPrivateNote ? 'Nota interna adicionada' : (inputText || 'Arquivo enviado'), lastMessageAt: new Date().toISOString() } 
                : c
            ));

            setInputText('');
            setShowCannedMenu(false);
            if (file) showToast('Arquivo enviado!', 'success');
        } catch (e) {
            showToast('Erro ao enviar mensagem', 'error');
        } finally {
            setIsSending(false);
            // Don't reset private note toggle, user might want to write multiple
        }
    };

    const handleResolve = async () => {
        if (!activeConversationId) return;
        await chatService.updateConversationStatus(activeConversationId, 'resolved');
        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, status: 'resolved' } : c));
        showToast('Conversa resolvida!', 'success');
        if (filterStatus === 'open') setActiveConversationId(null);
    };

    const handleReopen = async () => {
        if (!activeConversationId) return;
        await chatService.updateConversationStatus(activeConversationId, 'open');
        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, status: 'open' } : c));
        showToast('Conversa reaberta!', 'success');
    };

    const handleAssign = async (agentId: string) => {
        if (!activeConversationId) return;
        await chatService.assignAgent(activeConversationId, agentId);
        setConversations(prev => prev.map(c => c.id === activeConversationId ? { ...c, assignedTo: agentId } : c));
        showToast('Atendente alterado.', 'success');
    };

    const insertCanned = (text: string) => {
        setInputText(text);
        setShowCannedMenu(false);
        textareaRef.current?.focus();
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
        // Slash command trigger
        if (e.key === '/') {
            setShowCannedMenu(true);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getAvatarColor = (name: string) => {
        const colors = ['bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500', 'bg-pink-500'];
        let hash = 0;
        for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
        return colors[Math.abs(hash) % colors.length];
    };

    return (
        <div className="flex h-full w-full bg-white dark:bg-slate-900 overflow-hidden relative">
            
            {/* 1. LEFT SIDEBAR: CONVERSATION LIST */}
            <div className="w-80 md:w-96 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 z-10">
                
                {/* Header / Filter Tabs */}
                <div className="p-3 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2">
                    <div className="flex items-center justify-between px-1">
                        <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            <InboxIcon size={20} className="text-blue-600"/> Atendimento
                        </h2>
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5">
                            <button onClick={() => setFilterStatus('open')} className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${filterStatus === 'open' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Abertos</button>
                            <button onClick={() => setFilterStatus('resolved')} className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${filterStatus === 'resolved' ? 'bg-white dark:bg-slate-600 shadow text-slate-800 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>Resolvidos</button>
                        </div>
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                        <button onClick={() => setFilterAssignee('me')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filterAssignee === 'me' ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 border-blue-200 dark:border-blue-800' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}>Meus Tickets</button>
                        <button onClick={() => setFilterAssignee('unassigned')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filterAssignee === 'unassigned' ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-600 border-amber-200 dark:border-amber-800' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}>Não Atribuídos</button>
                        <button onClick={() => setFilterAssignee('all')} className={`whitespace-nowrap px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${filterAssignee === 'all' ? 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}>Todos</button>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="Buscar cliente, mensagem..." 
                            className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 transition-all dark:text-white"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="animate-spin text-blue-500"/></div>
                    ) : filteredConversations.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
                                <InboxIcon size={32}/>
                            </div>
                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Nenhuma conversa encontrada.</p>
                        </div>
                    ) : (
                        filteredConversations.map(conv => (
                            <div 
                                key={conv.id}
                                onClick={() => setActiveConversationId(conv.id)}
                                className={`p-4 border-b border-slate-50 dark:border-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors relative group ${activeConversationId === conv.id ? 'bg-blue-50/50 dark:bg-blue-900/10 border-l-4 border-l-blue-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 ${getAvatarColor(conv.contactName)}`}>
                                        {conv.contactName.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-baseline mb-1">
                                            <h4 className={`text-sm font-bold truncate ${activeConversationId === conv.id ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-white'}`}>
                                                {conv.contactName}
                                            </h4>
                                            <span className="text-[10px] text-slate-400 shrink-0">{formatTime(conv.lastMessageAt)}</span>
                                        </div>
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate pr-4">
                                            {conv.lastMessage}
                                        </p>
                                        
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className="flex items-center gap-1 text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                                                <MessageCircle size={10}/> WhatsApp
                                            </div>
                                            {conv.assignedTo ? (
                                                <div className="flex items-center gap-1 text-[10px] text-slate-500 dark:text-slate-400" title={`Atribuído a ${agents.find(a => a.id === conv.assignedTo)?.name}`}>
                                                    <User size={10}/> {agents.find(a => a.id === conv.assignedTo)?.name.split(' ')[0]}
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-1 text-[10px] text-amber-600 bg-amber-50 dark:bg-amber-900/20 px-1.5 py-0.5 rounded">
                                                    <AlertCircle size={10}/> Sem Dono
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {conv.unreadCount > 0 && (
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                                            {conv.unreadCount}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* 2. CENTER: CHAT AREA */}
            <div className="flex-1 flex flex-col min-w-0 bg-slate-50/50 dark:bg-slate-900/50 relative">
                {activeConversationId && activeConversation ? (
                    <>
                        {/* Chat Header */}
                        <div className="h-16 px-6 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center shrink-0 shadow-sm z-20">
                            <div className="flex items-center gap-3">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${getAvatarColor(activeConversation.contactName)}`}>
                                    {activeConversation.contactName.substring(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                                        {activeConversation.contactName}
                                        {activeConversation.status === 'resolved' && <span className="text-[10px] bg-green-100 text-green-700 px-2 rounded-full border border-green-200">Resolvido</span>}
                                    </h3>
                                    <p className="text-xs text-slate-500 dark:text-slate-400">via WhatsApp • +{activeConversation.contactPhone}</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3">
                                {/* Assignment Dropdown */}
                                <div className="relative group">
                                    <button className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 transition-colors border border-slate-200 dark:border-slate-700">
                                        <User size={14}/>
                                        {activeConversation.assignedTo ? agents.find(a => a.id === activeConversation.assignedTo)?.name.split(' ')[0] : 'Atribuir'}
                                        <ChevronDown size={12}/>
                                    </button>
                                    <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden hidden group-hover:block z-50">
                                        {agents.map(agent => (
                                            <button 
                                                key={agent.id} 
                                                onClick={() => handleAssign(agent.id)}
                                                className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center gap-2"
                                            >
                                                <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center text-[10px] font-bold">{agent.name.charAt(0)}</div>
                                                {agent.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Status Toggle */}
                                {activeConversation.status === 'open' ? (
                                    <button onClick={handleResolve} className="flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
                                        <CheckCircle size={14}/> Resolver
                                    </button>
                                ) : (
                                    <button onClick={handleReopen} className="flex items-center gap-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-bold shadow-sm transition-colors">
                                        <RefreshCw size={14}/> Reabrir
                                    </button>
                                )}

                                <div className="h-6 w-px bg-slate-200 dark:bg-slate-700 mx-1"></div>

                                <button onClick={() => setShowRightSidebar(!showRightSidebar)} className={`p-2 rounded-lg transition-colors ${showRightSidebar ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 'text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                    <Sidebar size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Chat Messages */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth bg-[#f0f2f5] dark:bg-[#0b1120]" ref={scrollContainerRef}>
                            {/* Encryption Notice */}
                            <div className="flex justify-center mb-6">
                                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 px-3 py-1.5 rounded-lg text-[10px] text-yellow-700 dark:text-yellow-500 flex items-center gap-2 shadow-sm">
                                    <Lock size={10}/> As mensagens são protegidas com criptografia de ponta a ponta.
                                </div>
                            </div>

                            {loadingMessages ? (
                                <div className="flex justify-center py-10"><Loader2 className="animate-spin text-slate-400"/></div>
                            ) : messages.map((msg, idx) => {
                                const isMe = msg.sender === 'agent';
                                const isPrivate = msg.isPrivate;
                                
                                // Grouping logic could go here (check if previous msg same sender)

                                if (isPrivate) {
                                    return (
                                        <div key={msg.id} className="flex flex-col items-center animate-in fade-in slide-in-from-bottom-2">
                                            <div className="bg-amber-100 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3 max-w-2xl w-full text-center relative">
                                                <div className="flex items-center justify-center gap-2 mb-1 text-amber-700 dark:text-amber-500 font-bold text-xs uppercase tracking-wide">
                                                    <Lock size={10}/> Nota Interna • {msg.senderName}
                                                </div>
                                                <p className="text-sm text-slate-800 dark:text-slate-200">{msg.content}</p>
                                                <span className="text-[10px] text-amber-600/60 absolute bottom-1 right-2">{formatTime(msg.createdAt)}</span>
                                            </div>
                                        </div>
                                    );
                                }

                                return (
                                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 group`}>
                                        <div className={`max-w-[70%] rounded-2xl p-3.5 shadow-sm relative ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-bl-none border border-slate-100 dark:border-slate-700'}`}>
                                            {/* Media Rendering */}
                                            {msg.type === 'image' && msg.attachmentUrl && (
                                                <img src={msg.attachmentUrl} alt="anexo" className="rounded-lg mb-2 max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity" />
                                            )}
                                            {msg.type === 'audio' && msg.attachmentUrl && (
                                                <audio controls src={msg.attachmentUrl} className="w-64 mb-2" />
                                            )}

                                            <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                            
                                            <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-blue-200' : 'text-slate-400'}`}>
                                                <span>{formatTime(msg.createdAt)}</span>
                                                {isMe && (
                                                    <span className={msg.status === 'read' ? 'text-blue-200' : 'text-blue-300/70'}>
                                                        {msg.status === 'read' ? <CheckCircle size={10}/> : <Check size={10}/>}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Composer Area */}
                        <div className={`p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0 relative transition-colors ${isPrivateNote ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                            
                            {/* Private Note Toggle Indicator */}
                            {isPrivateNote && (
                                <div className="absolute top-0 left-0 right-0 h-1 bg-amber-400 animate-pulse"></div>
                            )}

                            {/* Canned Responses Menu */}
                            {showCannedMenu && (
                                <div className="absolute bottom-full left-4 mb-2 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in slide-in-from-bottom-2 z-30">
                                    <div className="p-2 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-100 dark:border-slate-700 text-xs font-bold text-slate-500 uppercase tracking-wider">Respostas Rápidas</div>
                                    <div className="max-h-60 overflow-y-auto">
                                        {CANNED_RESPONSES.map(canned => (
                                            <button 
                                                key={canned.code} 
                                                onClick={() => insertCanned(canned.text)}
                                                className="w-full text-left px-4 py-2.5 text-sm hover:bg-blue-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-b border-slate-50 dark:border-slate-800 last:border-0"
                                            >
                                                <span className="font-bold text-blue-600 block text-xs mb-0.5">/{canned.code}</span>
                                                <span className="line-clamp-1">{canned.text}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex flex-col gap-3">
                                {/* Toolbar */}
                                <div className="flex items-center justify-between">
                                    <div className="flex gap-1">
                                        <button 
                                            onClick={() => setIsPrivateNote(!isPrivateNote)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${isPrivateNote ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'}`}
                                        >
                                            {isPrivateNote ? <Lock size={12}/> : <MessageSquare size={12}/>}
                                            {isPrivateNote ? 'Nota Privada' : 'Público'}
                                        </button>
                                        {!isPrivateNote && (
                                            <>
                                                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-600 transition-colors" title="Anexar Arquivo"><Paperclip size={16}/></button>
                                                <button className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-600 transition-colors" title="Emojis"><Smile size={16}/></button>
                                                <button onClick={() => setShowCannedMenu(!showCannedMenu)} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-400 hover:text-blue-600 transition-colors font-bold text-xs" title="Respostas Rápidas">/ </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="text-[10px] text-slate-400 hidden sm:block">
                                        <strong>Shift + Enter</strong> nova linha
                                    </div>
                                </div>

                                {/* Input */}
                                <div className={`flex gap-2 items-end p-2 rounded-xl border transition-colors focus-within:ring-2 focus-within:ring-blue-500/20 ${isPrivateNote ? 'bg-amber-50 dark:bg-amber-900/10 border-amber-200 dark:border-amber-800' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                    <textarea
                                        ref={textareaRef}
                                        value={inputText}
                                        onChange={e => setInputText(e.target.value)}
                                        onKeyDown={handleKeyDown}
                                        placeholder={isPrivateNote ? "Escreva uma nota interna para a equipe..." : "Digite sua mensagem... (Use / para respostas rápidas)"}
                                        className="w-full bg-transparent border-none outline-none text-sm resize-none max-h-32 min-h-[40px] py-2 px-2 text-slate-800 dark:text-white placeholder:text-slate-400"
                                        rows={1}
                                        style={{ height: 'auto' }} // Auto-grow logic would go here
                                    />
                                    <button 
                                        onClick={() => handleSendMessage()}
                                        disabled={!inputText.trim() || isSending}
                                        className={`p-3 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${isPrivateNote ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                                    >
                                        {isSending ? <Loader2 className="animate-spin" size={18}/> : <Send size={18}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    /* Empty State */
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-900/50">
                        <div className="w-32 h-32 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-sm animate-in zoom-in duration-500">
                            <MessageSquare size={64} className="text-slate-300 dark:text-slate-600"/>
                        </div>
                        <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Nenhuma conversa selecionada</h2>
                        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
                            Selecione um contato na lista à esquerda para iniciar o atendimento ou ver o histórico.
                        </p>
                    </div>
                )}
            </div>

            {/* 3. RIGHT SIDEBAR: CONTEXT (Collapsible) */}
            {activeConversationId && activeConversation && showRightSidebar && (
                <div className="w-72 bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shrink-0 animate-in slide-in-from-right-10 z-10 overflow-y-auto custom-scrollbar">
                    
                    {/* Profile Header */}
                    <div className="p-6 flex flex-col items-center text-center border-b border-slate-100 dark:border-slate-800">
                        <div className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg ${getAvatarColor(activeConversation.contactName)}`}>
                            {activeConversation.contactName.substring(0, 2).toUpperCase()}
                        </div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">{activeConversation.contactName}</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-mono">{activeConversation.contactPhone}</p>
                        
                        <div className="flex gap-2 mt-4 w-full">
                            <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors">
                                Editar
                            </button>
                            <button className="flex-1 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors">
                                Ver CRM
                            </button>
                        </div>
                    </div>

                    {/* Tags Section */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                            Etiquetas <button className="hover:text-blue-500"><Plus size={14}/></button>
                        </h4>
                        <div className="flex flex-wrap gap-2">
                            {activeConversation.tags && activeConversation.tags.length > 0 ? activeConversation.tags.map(tag => (
                                <span key={tag} className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-1">
                                    <Tag size={10}/> {tag}
                                </span>
                            )) : (
                                <span className="text-xs text-slate-400 italic">Sem etiquetas</span>
                            )}
                        </div>
                    </div>

                    {/* Contact Info (Details) */}
                    <div className="p-5 border-b border-slate-100 dark:border-slate-800 space-y-4">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalhes</h4>
                        
                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Mail size={14}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Email</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300 truncate">cliente@exemplo.com</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                                <Clock size={14}/>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] text-slate-400 uppercase font-bold">Primeiro Contato</p>
                                <p className="text-xs text-slate-700 dark:text-slate-300">12 Out, 2023</p>
                            </div>
                        </div>
                    </div>

                    {/* Notes (Read Only Mock) */}
                    <div className="p-5 bg-slate-50/50 dark:bg-slate-900/50 flex-1">
                        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Últimas Notas</h4>
                        <div className="space-y-3">
                            <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-800/30 p-3 rounded-lg text-xs text-slate-600 dark:text-slate-300 relative">
                                <p>Cliente interessado no plano Enterprise. Agendar demo.</p>
                                <div className="mt-2 flex items-center gap-2 text-[10px] text-slate-400">
                                    <div className="w-4 h-4 rounded-full bg-slate-300"></div>
                                    <span>Você • Há 2 dias</span>
                                </div>
                            </div>
                        </div>
                    </div>

                </div>
            )}

        </div>
    );
};

export default Inbox;
