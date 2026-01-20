
import { Campaign, CampaignObjective } from '../types';

// Mock Database acting as Supabase
let MOCK_CAMPAIGNS: Campaign[] = [
  {
    id: '1',
    name: 'Promoção Black Friday',
    scheduledDate: '2023-11-24',
    objective: 'promotion',
    status: 'completed',
    agentName: 'Fernanda Marketing',
    ownerId: 'agent-5', 
    totalContacts: 1500,
    deliveryRate: 98.5,
    executedAt: '2023-11-24T09:00:00Z',
    workflow: [
        { id: 'w1', type: 'text', content: 'Olá! Aproveite nossas ofertas.', delay: 1200, order: 1 },
        { id: 'w2', type: 'image', content: 'Banner Oficial', delay: 2000, order: 2 }
    ],
    minDelay: 20,
    maxDelay: 60
  },
  {
    id: '2',
    name: 'Follow-up Leads Outubro',
    scheduledDate: '2023-10-30',
    objective: 'prospecting',
    status: 'completed',
    agentName: 'Roberto Vendas',
    ownerId: 'agent-2', 
    totalContacts: 340,
    deliveryRate: 88.0,
    executedAt: '2023-10-30T10:00:00Z',
    workflow: [
        { id: 'w3', type: 'text', content: 'Oi, tudo bem? Podemos agendar uma call?', delay: 1200, order: 1 }
    ],
    minDelay: 15,
    maxDelay: 45
  },
  {
    id: '3',
    name: 'Aviso de Manutenção Programada',
    scheduledDate: '2023-12-05',
    objective: 'maintenance',
    status: 'scheduled',
    agentName: 'Carla Suporte',
    ownerId: 'agent-3', 
    totalContacts: 850,
    workflow: [
        { id: 'w4', type: 'text', content: 'Olá {nome}, teremos uma manutenção dia 10.', delay: 2000, order: 1 }
    ],
    minDelay: 30,
    maxDelay: 90
  },
  {
    id: '4',
    name: 'Lançamento Produto X',
    scheduledDate: new Date().toISOString().split('T')[0], // Today
    objective: 'sales',
    status: 'processing',
    agentName: 'Roberto Vendas',
    ownerId: 'agent-2', 
    totalContacts: 5000,
    deliveryRate: 45.2, // In progress
    workflow: [
        { id: 'w5', type: 'video', content: 'Demo do Produto', delay: 5000, order: 1 },
        { id: 'w6', type: 'text', content: 'Compre agora com 10% OFF', delay: 3000, order: 2 }
    ],
    minDelay: 60,
    maxDelay: 180
  },
  {
    id: '5',
    name: 'Cobrança Automática',
    scheduledDate: '2023-12-10',
    objective: 'communication',
    status: 'scheduled',
    agentName: 'Lucas Financeiro',
    ownerId: 'agent-4', 
    totalContacts: 120,
    workflow: [
        { id: 'w7', type: 'text', content: 'Lembrete de fatura em aberto.', delay: 2000, order: 1 }
    ],
    minDelay: 40,
    maxDelay: 80
  }
];

export const getCampaigns = async (userId: string, role: string): Promise<Campaign[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        if (role === 'manager') {
            resolve([...MOCK_CAMPAIGNS]); // Manager sees ALL campaigns
        } else {
            resolve(MOCK_CAMPAIGNS.filter(c => c.ownerId === userId)); // Agent sees ONLY theirs
        }
    }, 500);
  });
};

export const createCampaign = async (
    campaignData: Omit<Campaign, 'id' | 'status' | 'deliveryRate' | 'executedAt'>
): Promise<Campaign> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const newCampaign: Campaign = {
        ...campaignData,
        id: Math.random().toString(36).substr(2, 9),
        status: 'processing', // Starts processing immediately for this demo
        deliveryRate: 0
      };
      
      // Add to beginning of list
      MOCK_CAMPAIGNS = [newCampaign, ...MOCK_CAMPAIGNS];
      
      // Simulate completion in background (mock effect)
      setTimeout(() => {
          const index = MOCK_CAMPAIGNS.findIndex(c => c.id === newCampaign.id);
          if (index !== -1) {
              MOCK_CAMPAIGNS[index].status = 'completed';
              MOCK_CAMPAIGNS[index].deliveryRate = Number((Math.random() * (100 - 85) + 85).toFixed(1));
              MOCK_CAMPAIGNS[index].executedAt = new Date().toISOString();
          }
      }, 8000);

      resolve(newCampaign);
    }, 800);
  });
};

export const downloadCampaignReport = (campaign: Campaign) => {
    // Headers
    let csvContent = "Data Envio,Telefone,Status,Mensagem de Erro\n";
    
    const total = campaign.totalContacts;
    const rate = campaign.deliveryRate || 100;
    const successCount = Math.floor(total * (rate / 100));
    const failCount = total - successCount;
    const baseDate = campaign.executedAt ? new Date(campaign.executedAt) : new Date();

    // Generate Success Rows
    for (let i = 0; i < successCount; i++) {
        // Generate a random phone number for realism
        const randomPhone = `55119${Math.floor(Math.random() * 90000000 + 10000000)}`;
        csvContent += `${baseDate.toLocaleString()},${randomPhone},ENTREGUE,\n`;
    }

    // Generate Fail Rows
    for (let i = 0; i < failCount; i++) {
        const randomPhone = `55119${Math.floor(Math.random() * 90000000 + 10000000)}`;
        csvContent += `${baseDate.toLocaleString()},${randomPhone},FALHA,Número inválido ou bloqueado\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_campanha_${campaign.id}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
