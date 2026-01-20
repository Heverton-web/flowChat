
import { Campaign } from '../types';

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
  }
];

export const getCampaigns = async (userId: string, role: string): Promise<Campaign[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
        if (role === 'manager') {
            resolve([...MOCK_CAMPAIGNS]); 
        } else {
            resolve(MOCK_CAMPAIGNS.filter(c => c.ownerId === userId));
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
      
      MOCK_CAMPAIGNS = [newCampaign, ...MOCK_CAMPAIGNS];
      
      setTimeout(() => {
          const index = MOCK_CAMPAIGNS.findIndex(c => c.id === newCampaign.id);
          if (index !== -1) {
              MOCK_CAMPAIGNS[index].status = 'completed';
              MOCK_CAMPAIGNS[index].deliveryRate = Number((Math.random() * (100 - 85) + 85).toFixed(1));
              MOCK_CAMPAIGNS[index].executedAt = new Date().toISOString();
          }
      }, 5000);

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
