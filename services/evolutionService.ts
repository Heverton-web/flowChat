
import { Instance } from '../types';
import { supabase } from './supabaseClient';
import * as financialService from './financialService';
import { mockStore } from './mockDataStore';

export const fetchInstances = async (userId: string, role: string): Promise<Instance[]> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 500));
      return mockStore.getInstances(userId, role);
  }

  let query = supabase.from('instances').select('*');
  if (role !== 'manager' && role !== 'super_admin') {
    query = query.eq('owner_id', userId);
  }

  const { data, error } = await query;
  if (error) {
      console.error(error);
      return [];
  }

  return data.map((i: any) => ({
    id: i.id,
    name: i.name,
    status: i.status as Instance['status'],
    phone: i.phone,
    lastUpdate: i.last_update,
    battery: i.battery,
    messagesUsed: i.messages_used,
    messagesLimit: i.messages_limit,
    ownerId: i.owner_id,
    ownerName: 'Usuário' 
  }));
};

export const createInstance = async (name: string, ownerId: string, ownerName: string): Promise<Instance> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 800));
      return mockStore.createInstance(name, ownerId, ownerName);
  }

  const license = await financialService.getLicenseStatus();
  const { count } = await supabase.from('instances').select('*', { count: 'exact', head: true });
  
  if ((count || 0) >= license.totalSeats) {
      throw new Error(`Limite global de instâncias atingido (${license.totalSeats}). Expanda sua licença.`);
  }

  const { data: existing } = await supabase.from('instances').select('id').eq('owner_id', ownerId).single();
  if (existing) {
      throw new Error("Você já possui uma instância ativa (Limite 1 por usuário).");
  }

  const { data, error } = await supabase.from('instances').insert({
    name,
    owner_id: ownerId,
    status: 'connecting',
    messages_used: 0,
    messages_limit: 0
  }).select().single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    status: data.status as Instance['status'],
    lastUpdate: data.created_at,
    messagesUsed: 0,
    messagesLimit: 0,
    ownerId: data.owner_id,
    ownerName
  };
};

export const deleteInstance = async (id: string, name: string): Promise<void> => {
  if (mockStore.isMockMode()) {
      mockStore.deleteInstance(id);
      return;
  }
  const { error } = await supabase.from('instances').delete().eq('id', id);
  if (error) throw error;
};

export const getInstanceQRCode = async (instanceId: string): Promise<string> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_Connection_Test_' + instanceId);
    }, 1500); 
  });
};

export const connectInstance = async (instanceId: string): Promise<void> => {
   if (mockStore.isMockMode()) {
       mockStore.connectInstance(instanceId);
       return;
   }
   const { error } = await supabase.from('instances').update({
       status: 'connected',
       phone: '5511999999999',
       last_update: new Date().toISOString()
   }).eq('id', instanceId);
   
   if (error) throw error;
}