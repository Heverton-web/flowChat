
import { Instance } from '../types';
import { supabase } from './supabaseClient';
import * as financialService from './financialService';
import { mockStore } from './mockDataStore';
import { getSystemConfig, hasValidEvolutionConfig } from './configService';

// Helper para headers
const getHeaders = () => {
    const config = getSystemConfig();
    return {
        'apikey': config.evolution_key,
        'Content-Type': 'application/json'
    };
};

export const fetchInstances = async (userId: string, role: string): Promise<Instance[]> => {
  // 1. Tentar buscar da API Real se configurada
  if (hasValidEvolutionConfig()) {
      try {
          const config = getSystemConfig();
          const response = await fetch(`${config.evolution_url}/instance/fetchInstances`, {
              headers: getHeaders()
          });
          
          if (response.ok) {
              const data = await response.json();
              // Mapear retorno real da Evolution para nossa interface
              return data.map((i: any) => ({
                  id: i.instance.instanceName, // Evolution usa instanceName como ID chave
                  name: i.instance.instanceName,
                  status: i.instance.status === 'open' ? 'connected' : 'disconnected',
                  phone: i.instance.owner,
                  lastUpdate: new Date().toISOString(),
                  messagesUsed: 0,
                  messagesLimit: 0,
                  ownerId: userId, // Assume que o user atual é dono para visualização
                  ownerName: 'Evolution Real'
              }));
          }
      } catch (e) {
          console.warn("Falha ao conectar na Evolution Real, usando fallback...", e);
      }
  }

  // 2. Fallback para Mock se não configurado ou falha
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 500));
      return mockStore.getInstances(userId, role);
  }

  // 3. Fallback para Supabase (se houver tabela real)
  let query = supabase.from('instances').select('*');
  if (role !== 'manager' && role !== 'super_admin') {
    query = query.eq('owner_id', userId);
  }

  const { data, error } = await query;
  if (error) {
      // Se der erro no Supabase (ex: tabela nao existe), retorna vazio
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
  // Verificação de Licença (Sempre local/supabase)
  const license = await financialService.getLicenseStatus();
  // Se for mock mode, ignora a contagem real do banco para não bloquear demo
  if (!mockStore.isMockMode()) {
      const { count } = await supabase.from('instances').select('*', { count: 'exact', head: true });
      if ((count || 0) >= license.totalSeats) {
          throw new Error(`Limite global de instâncias atingido (${license.totalSeats}). Expanda sua licença.`);
      }
  }

  // Tenta criar na API Real
  if (hasValidEvolutionConfig()) {
      const config = getSystemConfig();
      try {
          const response = await fetch(`${config.evolution_url}/instance/create`, {
              method: 'POST',
              headers: getHeaders(),
              body: JSON.stringify({ instanceName: name })
          });
          
          if (response.ok) {
              const data = await response.json();
              return {
                  id: data.instance.instanceName,
                  name: data.instance.instanceName,
                  status: 'connecting',
                  lastUpdate: new Date().toISOString(),
                  messagesUsed: 0,
                  messagesLimit: 0,
                  ownerId: ownerId,
                  ownerName
              };
          }
      } catch(e) {
          console.error("Erro criando na Evolution Real", e);
      }
  }

  // Fallback Mock
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 800));
      return mockStore.createInstance(name, ownerId, ownerName);
  }

  // Fallback Supabase
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
  // API Real
  if (hasValidEvolutionConfig()) {
      const config = getSystemConfig();
      await fetch(`${config.evolution_url}/instance/delete/${name}`, {
          method: 'DELETE',
          headers: getHeaders()
      });
      return;
  }

  if (mockStore.isMockMode()) {
      mockStore.deleteInstance(id);
      return;
  }
  const { error } = await supabase.from('instances').delete().eq('id', id);
  if (error) throw error;
};

export const getInstanceQRCode = async (instanceId: string): Promise<string> => {
  // API Real
  if (hasValidEvolutionConfig()) {
      const config = getSystemConfig();
      // Evolution v2 return base64
      const response = await fetch(`${config.evolution_url}/instance/connect/${instanceId}`, {
          headers: getHeaders()
      });
      if (response.ok) {
          const data = await response.json();
          // Ajuste conforme versão da Evolution (pode ser data.base64 ou data.qrcode)
          return data.base64 || data.qrcode || '';
      }
  }

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve('https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=EvolutionAPI_Connection_Test_' + instanceId);
    }, 1500); 
  });
};

export const connectInstance = async (instanceId: string): Promise<void> => {
   // API Real - Geralmente a conexão é automática via QR, esse método é mais para atualizar status local
   if (mockStore.isMockMode()) {
       mockStore.connectInstance(instanceId);
       return;
   }
   const { error } = await supabase.from('instances').update({
       status: 'connected',
       phone: '5511999999999',
       last_update: new Date().toISOString()
   }).eq('id', instanceId);
   
   if (error) throw error; // Ignorar erro se registro não existir no supabase (ex: usando apenas API real)
}
