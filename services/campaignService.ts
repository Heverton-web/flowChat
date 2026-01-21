
import { Campaign } from '../types';
import { supabase } from './supabaseClient';
import { mockStore } from './mockDataStore';

export const getCampaigns = async (userId: string, role: string): Promise<Campaign[]> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 600));
      return mockStore.getCampaigns(userId, role);
  }

  let query = supabase.from('campaigns').select('*');
  if (role !== 'manager' && role !== 'super_admin') {
    query = query.eq('owner_id', userId);
  }

  const { data, error } = await query;
  if (error) {
      console.error(error);
      return [];
  }

  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    scheduledDate: c.scheduled_date,
    objective: c.objective,
    status: c.status,
    agentName: c.agent_name || 'Desconhecido',
    ownerId: c.owner_id,
    totalContacts: c.total_contacts,
    deliveryRate: c.delivery_rate,
    executedAt: c.executed_at,
    workflow: c.workflow || [],
    minDelay: c.min_delay,
    maxDelay: c.max_delay
  }));
};

export const createCampaign = async (
    campaignData: Omit<Campaign, 'id' | 'status' | 'deliveryRate' | 'executedAt'>
): Promise<Campaign> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 800));
      return mockStore.createCampaign(campaignData);
  }

  const { data, error } = await supabase.from('campaigns').insert({
    name: campaignData.name,
    scheduled_date: campaignData.scheduledDate,
    objective: campaignData.objective,
    owner_id: campaignData.ownerId,
    agent_name: campaignData.agentName,
    total_contacts: campaignData.totalContacts,
    workflow: campaignData.workflow,
    min_delay: campaignData.minDelay,
    max_delay: campaignData.maxDelay,
    status: 'processing'
  }).select().single();

  if (error) throw error;

  simulateCampaignProcessing(data.id);

  return {
    id: data.id,
    name: data.name,
    scheduledDate: data.scheduled_date,
    objective: data.objective,
    status: data.status,
    agentName: data.agent_name,
    ownerId: data.owner_id,
    totalContacts: data.total_contacts,
    workflow: data.workflow,
    minDelay: data.min_delay,
    maxDelay: data.max_delay
  };
};

const simulateCampaignProcessing = (campaignId: string) => {
    setTimeout(async () => {
        const rate = Number((Math.random() * (100 - 85) + 85).toFixed(1));
        
        if (!mockStore.isMockMode()) {
            await supabase.from('campaigns').update({
                status: 'completed',
                delivery_rate: rate,
                executed_at: new Date().toISOString()
            }).eq('id', campaignId);
        }
        // Em modo mock, não precisamos atualizar o "banco", o front apenas renderiza
    }, 8000);
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
