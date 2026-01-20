
export type UserRole = 'manager' | 'agent';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  avatar: string;
  email: string;
  hasProFeatures?: boolean;
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
  extraPacks: number; // Internal quota units allocated by admin
  extraContactPacks: number; // Internal quota units allocated by admin
  status: 'active' | 'pending_invite' | 'suspended';
  messagesUsed: number;
  permissions: AgentPermissions;
  tempPassword?: string;
  personalPremiumExpiry?: string;
}

// Kept for backward compatibility with Team.tsx and Dashboard.tsx
// In the Enterprise model, this reflects the total resource pool available for distribution
export interface GlobalSubscription {
  planType: 'enterprise'; // Fixed to enterprise
  status: 'active';
  renewalDate: string;
  totalMessagePacksPurchased: number; // Legacy name, now represents "Total Message Quota Units"
  totalContactPacksPurchased: number; // Legacy name, now represents "Total Contact Quota Units"
  hasPremiumFeatures: boolean;
}

// NEW: Enterprise License Structure
export type LicenseType = 'standard' | 'enterprise';

export interface License {
  type: LicenseType;
  maxUsers: number;
  maxInstances: number;
  status: 'active' | 'blocked' | 'trial';
  modules: string[]; // e.g. ['crm', 'kanban', 'api_access']
  renewalDate: string;
  
  // Real-time usage data
  activeUsers: number;
  activeInstances: number;
  
  features: {
    canUseApi: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
  };
}

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
  type: 'subscription' | 'extra_pack' | 'upgrade_pro';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: 'credit_card' | 'pix';
  invoiceUrl?: string;
}

export type ViewState = 'dashboard' | 'instances' | 'campaigns' | 'contacts' | 'subscription' | 'team' | 'settings' | 'reports' | 'financial' | 'onboarding';
