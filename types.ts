
export type UserRole = 'super_admin' | 'manager' | 'agent' | 'developer';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
}

export interface AgentPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  // Tag Permissions
  canCreateTags: boolean;
  canEditTags: boolean;
  canDeleteTags: boolean;
}

export interface AgentPlan {
  id: string;
  name: string;
  email: string;
  role?: UserRole; // Added to track role in Team view
  status: 'active' | 'pending_invite' | 'suspended';
  messagesUsed: number;
  permissions: AgentPermissions;
  tempPassword?: string;
  extraContactPacks?: number;
  department?: string; // Optional for UI display
}

// --- ENTERPRISE LICENSE TYPES ---

export type LicenseTier = 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface LicenseLimits {
  maxSeats: number;      // 1 Seat = 1 User + 1 Instance
  maxMessagesPerMonth?: number; 
  maxContacts?: number;  
}

export interface License {
  tier: LicenseTier;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  renewalDate: string;
  limits: LicenseLimits;
  addonSeats: number; // Extra purchased seats
  features: {
    canUseApi: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
  };
}

export interface LicenseUsage {
  usedSeats: number; // Count(Agents) + 1 (Manager)
  usedInstances: number;
  usedMessagesThisMonth: number;
  usedContacts: number;
}

export interface LicenseStatus {
  license: License;
  usage: LicenseUsage;
  totalSeats: number; // Base + Addons
}

// ------------------------------------------------

export interface Instance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  phone?: string;
  lastUpdate: string;
  battery?: number;
  messagesUsed: number;
  messagesLimit: number;
  ownerId: string;
  ownerName: string;
}

export interface TeamMember {
  id: string;
  name: string;
  role: 'admin' | 'agent';
  avatar: string;
  messagesSent: number;
  activeChats: number;
  averageResponseTime: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  email?: string;
  tags: string[];
  campaignHistory: string[];
  notes?: string;
  createdAt: string;
  ownerId: string;
  lockEdit?: boolean; 
  lockDelete?: boolean;
}

// --- CHAT / INBOX TYPES ---

export type MessageType = 'text' | 'image' | 'audio' | 'video' | 'file';
export type MessageSender = 'contact' | 'agent' | 'system';

export interface Message {
  id: string;
  conversationId: string;
  content: string;
  sender: MessageSender;
  senderName?: string; // For agents
  type: MessageType;
  isPrivate: boolean; // For internal notes (Chatwoot feature)
  createdAt: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  attachmentUrl?: string;
}

export interface Conversation {
  id: string;
  contactId: string;
  contactName: string;
  contactPhone: string; // WhatsApp Identifier
  contactAvatar?: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  status: 'open' | 'resolved' | 'pending';
  assignedTo?: string; // Agent ID
  tags: string[];
  channel: 'whatsapp';
}

// ------------------------------------------------

export type CampaignObjective = 'prospecting' | 'communication' | 'promotion' | 'sales' | 'maintenance';
export type CampaignStatus = 'scheduled' | 'processing' | 'completed';

export type WorkflowStepType = 'text' | 'audio' | 'image' | 'video' | 'document' | 'poll';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  content: string;
  file?: File;
  mediaUrl?: string;
  delay: number;
  order: number;
  pollConfig?: {
      selectableCount: number;
      values: string[];
  };
}

export interface Campaign {
  id: string;
  name: string;
  scheduledDate: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  agentName: string;
  ownerId: string;
  totalContacts: number;
  targetList?: string[]; // IDs of contacts to receive the campaign
  deliveryRate?: number;
  executedAt?: string;
  workflow: WorkflowStep[];
  minDelay: number;
  maxDelay: number;
}

export interface DashboardStats {
  totalInstances: number;
  totalMessages: number;
  activeChats: number;
  successRate: number;
}

export interface Transaction {
  id: string;
  userId: string;
  userName: string;
  date: string;
  description: string;
  amount: number;
  type: 'subscription' | 'addon_seat';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: 'invoice' | 'credit_card' | 'pix'; 
  invoiceUrl?: string;
}

export type ViewState = 'dashboard' | 'inbox' | 'instances' | 'campaigns' | 'contacts' | 'financial' | 'reports' | 'team' | 'settings' | 'onboarding' | 'dev_integrations' | 'dev_api' | 'dev_diagnostics';

export interface WebhookConfig {
  event: string;
  url: string;
  active: boolean;
}
