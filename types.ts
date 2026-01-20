
export type UserRole = 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  hasProFeatures?: boolean; // New flag for upgrade status
}

export interface AgentPermissions {
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
}

export interface AgentPlan {
  id: string;
  name: string;
  email: string;
  extraPacks: number; // Number of R$9.90 packs (Messages) assigned to this agent
  extraContactPacks: number; // Number of R$7.99 packs (Contacts) assigned to this agent
  status: 'active' | 'pending_invite' | 'suspended';
  messagesUsed: number; // Current usage in the cycle
  permissions: AgentPermissions; // Global permissions set by manager
  tempPassword?: string; // Optional: Only for display immediately after creation
  personalPremiumExpiry?: string; // ISO Date if agent bought premium personally
}

export interface GlobalSubscription {
  planType: 'basic' | 'business' | 'enterprise';
  status: 'active' | 'suspended' | 'canceled';
  renewalDate: string; // ISO Date
  totalMessagePacksPurchased: number; // Global pool of message packs
  totalContactPacksPurchased: number; // Global pool of contact packs
  hasPremiumFeatures: boolean;
}

export interface Instance {
  id: string;
  name: string;
  status: 'connected' | 'disconnected' | 'connecting';
  phone?: string;
  lastUpdate: string;
  battery?: number;
  messagesUsed: number; // Usage tracking
  messagesLimit: number; // SaaS limit (1000 base + packs)
  ownerId: string; // ID of the user who owns this instance
  ownerName: string; // Name of the owner for display
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
  phone: string; // Evolution API format (only numbers, with country code)
  email?: string;
  tags: string[];
  campaignHistory: string[]; // List of Campaign IDs
  notes?: string;
  createdAt: string;
  ownerId: string; // Which agent owns this contact
  // Specific restrictions set by manager for this contact
  lockEdit?: boolean; 
  lockDelete?: boolean;
}

export type CampaignObjective = 'prospecting' | 'communication' | 'promotion' | 'sales' | 'maintenance';
export type CampaignStatus = 'scheduled' | 'processing' | 'completed';

export type WorkflowStepType = 'text' | 'audio' | 'image' | 'video' | 'document' | 'poll';

export interface WorkflowStep {
  id: string;
  type: WorkflowStepType;
  content: string; // Text content, Caption, or Poll Name
  file?: File; // For upload simulation
  mediaUrl?: string; // For URL option
  delay: number; // Evolution API option: delay in milliseconds
  order: number;
  // Poll Specifics
  pollConfig?: {
      selectableCount: number;
      values: string[]; // Options
  };
}

export interface Campaign {
  id: string;
  name: string;
  scheduledDate: string;
  objective: CampaignObjective;
  status: CampaignStatus;
  agentName: string;
  ownerId: string; // Added to filter visibility
  totalContacts: number;
  deliveryRate?: number; // 0-100
  executedAt?: string;
  workflow: WorkflowStep[];
  // Anti-ban configuration
  minDelay: number; // seconds
  maxDelay: number; // seconds
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
  type: 'subscription' | 'extra_pack' | 'upgrade_pro';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: 'credit_card' | 'pix';
  invoiceUrl?: string;
}

export type ViewState = 'dashboard' | 'instances' | 'campaigns' | 'contacts' | 'subscription' | 'team' | 'settings' | 'reports' | 'financial' | 'onboarding';
