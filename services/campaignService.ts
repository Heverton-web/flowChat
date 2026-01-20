
import { Campaign } from '../types';

const STORAGE_KEY = 'flowchat_campaigns';

const MOCK_DEFAULTS: Campaign[] = [
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
    ],
    minDelay: 20,
    maxDelay: 60
  }
];

const loadData = (): Campaign[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DEFAULTS));
  return MOCK_DEFAULTS;
};

const saveData = (data: Campaign[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

export const getCampaigns = async (userId: string, role: string): Promise<Campaign[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        const campaigns = loadData();
        if (role === 'manager') {
            resolve(campaigns); 
        } else {
            resolve(campaigns.filter(c => c.ownerId === userId));
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
        status: 'processing',
        deliveryRate: 0
      };
      
      const campaigns = loadData();
      saveData([newCampaign, ...campaigns]);
      
      // Simulate Processing -> Completed in background (mocking simpler here)
      setTimeout(() => {
          const currentCampaigns = loadData();
          const index = currentCampaigns.findIndex(c => c.id === newCampaign.id);
          if (index !== -1) {
              currentCampaigns[index].status = 'completed';
              currentCampaigns[index].deliveryRate = Number((Math.random() * (100 - 85) + 85).toFixed(1));
              currentCampaigns[index].executedAt = new Date().toISOString();
              saveData(currentCampaigns);
          }
      }, 8000);

      resolve(newCampaign);
    }, 800);
  });
};

export const downloadCampaignReport = (campaign: Campaign) => {
    let csvContent = "Data Envio,Telefone,Status,Mensagem de Erro\n";
    const total = campaign.totalContacts;
    const rate = campaign.deliveryRate || 100;
    const successCount = Math.floor(total * (rate / 100));
    const failCount = total - successCount;
    const baseDate = campaign.executedAt ? new Date(campaign.executedAt) : new Date();

    for (let i = 0; i < successCount; i++) {
        const randomPhone = `55119${Math.floor(Math.random() * 90000000 + 10000000)}`;
        csvContent += `${baseDate.toLocaleString()},${randomPhone},ENTREGUE,\n`;
    }
    for (let i = 0; i < failCount; i++) {
        const randomPhone = `55119${Math.floor(Math.random() * 90000000 + 10000000)}`;
        csvContent += `${baseDate.toLocaleString()},${randomPhone},FALHA,Número inválido ou bloqueado\n`;
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_campanha_${campaign.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
