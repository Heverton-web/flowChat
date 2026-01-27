
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
    MessageSquare, Search, Filter, Clock, CheckCircle, User, MoreVertical, 
    Send, Paperclip, Smile, Lock, Image as ImageIcon, Mic, FileText, 
    Check, X, ChevronDown, Tag, Phone, Mail, Archive, Inbox as InboxIcon,
    RefreshCw, AlertCircle, StickyNote, ArrowRight, Loader2, Play, Pause, Video, Copy,
    CornerUpLeft, MoreHorizontal, UserPlus, Star, Trash2, Hash, Command, Sidebar, XCircle, Zap
} from 'lucide-react';
import { Conversation, Message, User as UserType } from '../types';
import * as chatService from '../services/chatService';
import * as teamService from '../services/teamService';
import { useApp } from '../contexts/AppContext';

// --- CHATWOOT-STYLE CANNED RESPONSES ---
const CANNED_RESPONSES = [
    { code: 'ola', text: 'Olá! Como posso ajudar você hoje?' },
    { code: 'preco', text: 'Nossos planos começam a partir de R$ 297/mês.' },
    { code: 'pix', text: 'Nossa chave PIX é o CNPJ: 00.000.000/0001-00' },
    { code: 'obrigado', text: 'Agradecemos o seu contato! Tenha um ótimo dia.' },
    { code: 'espera', text: 'Um momento por favor, vou verificar essa informação.' },
    { code: 'ausente', text: 'No momento não estamos disponíveis. Retornaremos em breve.' }
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
    
    // Canned Responses State
    const [showCannedMenu, setShowCannedMenu] = useState(false);
    const [cannedFilter, setCannedFilter] = useState('');
    const [cannedSelectedIndex, setCannedSelectedIndex] = useState(0);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
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
            setInputText