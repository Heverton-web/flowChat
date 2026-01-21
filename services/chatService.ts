
import { Conversation, Message, User } from '../types';
import { mockStore } from './mockDataStore';
// import { supabase } from './supabaseClient'; // Future real implementation

export const getConversations = async (currentUser: User): Promise<Conversation[]> => {
    // In a real scenario, fetch from Supabase 'conversations' table
    if (mockStore.isMockMode() || true) { // Force mock for now
        await new Promise(r => setTimeout(r, 400));
        return mockStore.getConversations(currentUser.id, currentUser.role);
    }
    return [];
};

export const getMessages = async (conversationId: string): Promise<Message[]> => {
    if (mockStore.isMockMode() || true) {
        await new Promise(r => setTimeout(r, 200));
        return mockStore.getMessages(conversationId);
    }
    return [];
};

export const sendMessage = async (
    conversationId: string, 
    content: string, 
    sender: User, 
    isPrivate: boolean = false,
    attachment?: File
): Promise<Message> => {
    const newMessage: Message = {
        id: `msg_${Date.now()}`,
        conversationId,
        content,
        sender: 'agent',
        senderName: sender.name,
        type: 'text', // Handle attachments later
        isPrivate,
        createdAt: new Date().toISOString(),
        status: 'sent'
    };

    if (mockStore.isMockMode() || true) {
        await new Promise(r => setTimeout(r, 300));
        return mockStore.sendMessage(newMessage);
    }
    return newMessage;
};

export const updateConversationStatus = async (conversationId: string, status: 'open' | 'resolved' | 'pending'): Promise<void> => {
    if (mockStore.isMockMode() || true) {
        mockStore.updateConversation(conversationId, { status });
    }
};

export const assignAgent = async (conversationId: string, agentId: string): Promise<void> => {
    if (mockStore.isMockMode() || true) {
        mockStore.updateConversation(conversationId, { assignedTo: agentId });
    }
};
