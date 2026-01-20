
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
  extraPacks: number; // Unidades de cota interna alocadas pelo admin
  extraContactPacks: number; // Unidades de cota interna alocadas pelo admin
  status: 'active' | 'pending_invite' | 'suspended';
  messagesUsed: number;
  permissions: AgentPermissions;
  tempPassword?: string;
  personalPremiumExpiry?: string;
}

// --- NOVOS TIPOS DE LICENCIAMENTO ENTERPRISE ---

export type LicenseTier = 'STANDARD' | 'PROFESSIONAL' | 'ENTERPRISE';

export interface LicenseLimits {
  maxUsers: number;      // Seats contratados (Usuários)
  maxInstances: number;  // Slots de WhatsApp (Geralmente 1:1 com Users)
  maxMessagesPerMonth?: number; // Cota global (opcional)
  maxContacts?: number;  // Cota global (opcional)
}

export interface License {
  tier: LicenseTier;
  status: 'ACTIVE' | 'SUSPENDED' | 'TRIAL';
  renewalDate: string;
  
  // Limites Base do Plano
  baseLimits: LicenseLimits;

  // Add-ons Contratados (Expansão de Infra)
  addonSeats: number;      // 1 Seat = +1 User E +1 Instance
  addonMessagePacks: number; // Pacotes extras globais
  addonContactPacks: number; // Pacotes extras globais

  features: {
    canUseApi: boolean;
    whiteLabel: boolean;
    prioritySupport: boolean;
  };
}

export interface LicenseUsage {
  usedUsers: number;
  usedInstances: number;
  usedMessagesThisMonth: number; // Uso agregado
  usedContacts: number; // Uso agregado
}

export interface LicenseStatus {
  license: License;
  usage: LicenseUsage;
  // Helper calculado: Limite Total = Base + Addons
  totalLimits: LicenseLimits; 
}

// Interface legada mantida apenas para compatibilidade se algum componente antigo ainda importar, 
// mas o ideal é migrar tudo para LicenseStatus.
export interface GlobalSubscription {
  planType: 'enterprise'; 
  status: 'active';
  renewalDate: string;
  totalMessagePacksPurchased: number;
  totalContactPacksPurchased: number;
  hasPremiumFeatures: boolean;
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
  type: 'subscription' | 'extra_pack' | 'upgrade_pro' | 'addon_seat';
  status: 'completed' | 'pending' | 'failed';
  paymentMethod: 'credit_card' | 'pix' | 'invoice';
  invoiceUrl?: string;
}

export type ViewState = 'dashboard' | 'instances' | 'campaigns' | 'contacts' | 'subscription' | 'team' | 'settings' | 'reports' | 'financial' | 'onboarding';
