
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
    
    let type: any = 'text';
    let attachmentUrl = undefined;

    if (attachment) {
        if (attachment.type.startsWith('image/')) type = 'image';
        else if (attachment.type.startsWith('audio/')) type = 'audio';
        else if (attachment.type.startsWith('video/')) type = 'video';
        else type = 'file';
        
        // Simulating upload
        attachmentUrl = URL.createObjectURL(attachment);
    }

    const newMessage: Message = {
        id: `msg_${Date.now()}`,
        conversationId,
        content: content || (attachment ? attachment.name : ''),
        sender: 'agent',
        senderName: sender.name,
        type: type, 
        isPrivate,
        createdAt: new Date().toISOString(),
        status: 'sent',
        attachmentUrl
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
