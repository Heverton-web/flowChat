
import { Contact, Tag } from '../types';
import { supabase } from './supabaseClient';
import { mockStore } from './mockDataStore';

const BASE_CONTACT_LIMIT = 2000; // Aumentado para produção

// Helper para formatar telefone padrão Evolution (55 + DDD + Numero)
export const formatPhoneForEvolution = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  // Tratamento básico BR
  if (clean.length === 10 || clean.length === 11) {
    // Se não começar com 55, adiciona
    if (!clean.startsWith('55')) {
        clean = '55' + clean;
    }
  }
  return clean;
};

export const getContacts = async (userId: string, role: string): Promise<Contact[]> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 600)); 
      return mockStore.getContacts(userId, role);
  }

  // RLS do Supabase já filtra, mas aplicamos filtro lógico extra se necessário
  let query = supabase.from('contacts').select('*').order('created_at', { ascending: false });
  
  // Se for manager, traz tudo. Se for agent, o RLS do banco já deve bloquear, 
  // mas reforçamos o filtro no client para evitar dados fantasmas em cache
  if (role !== 'manager' && role !== 'super_admin') {
    query = query.eq('owner_id', userId);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data.map((c: any) => ({
    id: c.id,
    name: c.name,
    phone: c.phone,
    email: c.email,
    tags: c.tags || [],
    campaignHistory: c.campaign_history || [],
    notes: c.notes,
    createdAt: c.created_at,
    ownerId: c.owner_id, 
    lockEdit: c.lock_edit,
    lockDelete: c.lock_delete
  }));
};

export const getTags = async (userId: string, role: string): Promise<Tag[]> => {
  if (mockStore.isMockMode()) {
      return mockStore.getTags(userId, role);
  }
  
  const { data, error } = await supabase
    .from('tags')
    .select('*')
    .or(`owner_id.is.null,owner_id.eq.${userId}`); // Globais ou Minhas

  if (error) return [];
  return data.map((t: any) => ({
      id: t.id,
      name: t.name,
      ownerId: t.owner_id ? t.owner_id : 'GLOBAL'
  }));
};

export const createTag = async (tagName: string, userId: string, role: string, isGlobal: boolean = false): Promise<Tag[]> => {
  const canMakeGlobal = role === 'manager' || role === 'super_admin';
  const ownerId = (canMakeGlobal && isGlobal) ? null : userId; // null no banco = GLOBAL

  if (mockStore.isMockMode()) {
      mockStore.addTag(tagName, ownerId ? ownerId : 'GLOBAL');
      return mockStore.getTags(userId, role);
  }

  const { error } = await supabase.from('tags').insert({ name: tagName, owner_id: ownerId });
  if (error) throw error;
  return getTags(userId, role);
};

export const updateTag = async (id: string, newName: string, userId: string, role: string): Promise<Tag[]> => {
  if (mockStore.isMockMode()) {
      mockStore.updateTag(id, newName); // O MockStore já lida com o cascade
      return mockStore.getTags(userId, role);
  }
  
  // 1. Atualiza a tabela de tags
  const { error } = await supabase.from('tags').update({ name: newName }).eq('id', id);
  if (error) throw error;

  // 2. (Opcional/Complexo) Atualizar todos os contatos que tinham a string antiga é difícil via Supabase Client simples 
  // sem saber o nome antigo. Num app real, isso seria uma Edge Function ou Trigger.
  // Aqui, assumimos que o ID da tag é estável, mas como o campo no contato é array de strings, pode desincronizar.
  // Recomendação: Em produção, usar tabela NxN contacts_tags.
  
  return getTags(userId, role);
};

export const deleteTag = async (id: string, userId: string, role: string): Promise<Tag[]> => {
  if (mockStore.isMockMode()) {
      mockStore.deleteTag(id); // O MockStore já remove do array dos contatos
      return mockStore.getTags(userId, role);
  }
  await supabase.from('tags').delete().eq('id', id);
  return getTags(userId, role);
};

export const saveContact = async (
  contact: Omit<Contact, 'id' | 'createdAt' | 'campaignHistory'>, 
  ownerId: string
): Promise<Contact> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 500));
      return mockStore.saveContact({ ...contact, ownerId });
  }

  // Validação de Limite por Licença (Simulada aqui, idealmente no backend/edge function)
  const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true });
  if ((count || 0) >= BASE_CONTACT_LIMIT) {
      throw new Error(`Limite global de ${BASE_CONTACT_LIMIT} contatos atingido.`);
  }

  const { data, error } = await supabase.from('contacts').insert({
    name: contact.name,
    phone: formatPhoneForEvolution(contact.phone),
    email: contact.email,
    tags: contact.tags,
    notes: contact.notes,
    owner_id: ownerId,
    lock_edit: contact.lockEdit,
    lock_delete: contact.lockDelete
  }).select().single();

  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    tags: data.tags || [],
    campaignHistory: data.campaign_history || [],
    notes: data.notes,
    createdAt: data.created_at,
    ownerId: data.owner_id,
    lockEdit: data.lock_edit,
    lockDelete: data.lock_delete
  };
};

export const updateContact = async (id: string, updates: Partial<Contact>): Promise<Contact> => {
  if (mockStore.isMockMode()) {
      return mockStore.updateContact(id, updates);
  }

  const payload: any = { ...updates };
  if (updates.phone) payload.phone = formatPhoneForEvolution(updates.phone);
  
  // Limpeza de campos undefined
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);
  
  // Mapeamento camelCase -> snake_case
  if (updates.lockEdit !== undefined) payload.lock_edit = updates.lockEdit;
  if (updates.lockDelete !== undefined) payload.lock_delete = updates.lockDelete;
  delete payload.lockEdit;
  delete payload.lockDelete;
  delete payload.campaignHistory;
  delete payload.createdAt;

  const { data, error } = await supabase.from('contacts').update(payload).eq('id', id).select().single();
  if (error) throw error;

  return {
    id: data.id,
    name: data.name,
    phone: data.phone,
    email: data.email,
    tags: data.tags || [],
    campaignHistory: data.campaign_history || [],
    notes: data.notes,
    createdAt: data.created_at,
    ownerId: data.owner_id,
    lockEdit: data.lock_edit,
    lockDelete: data.lock_delete
  };
};

export const deleteContact = async (id: string): Promise<void> => {
  if (mockStore.isMockMode()) {
      mockStore.deleteContact(id);
      return;
  }
  const { error } = await supabase.from('contacts').delete().eq('id', id);
  if (error) throw error;
};

// --- MÉTODOS DE BULK / ASSIGNMENT ---

export const assignContact = async (contactId: string, newOwnerId: string): Promise<void> => {
  if (mockStore.isMockMode()) {
      mockStore.updateContact(contactId, { ownerId: newOwnerId });
      return;
  }
  const { error } = await supabase.from('contacts').update({ owner_id: newOwnerId }).eq('id', contactId);
  if (error) throw error;
};

export const bulkAssignContacts = async (contactIds: string[], newOwnerId: string | null): Promise<void> => {
    if (mockStore.isMockMode()) {
        await new Promise(r => setTimeout(r, 800));
        contactIds.forEach(id => mockStore.updateContact(id, { ownerId: newOwnerId || '' }));
        return;
    }
    
    // Supabase suporta update com filtro IN
    const { error } = await supabase
        .from('contacts')
        .update({ owner_id: newOwnerId })
        .in('id', contactIds);
    
    if (error) throw error;
};

export const bulkImportContacts = async (
  rawContacts: {name: string, phone: string, email?: string, tags?: string[]}[], 
  ownerId: string
): Promise<number> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 1500));
      rawContacts.forEach(c => mockStore.saveContact({...c, ownerId}));
      return rawContacts.length;
  }

  // Prepara o payload para inserção em lote (performance muito superior)
  const contactsToInsert = rawContacts.map(c => ({
    name: c.name,
    phone: formatPhoneForEvolution(c.phone),
    email: c.email || null,
    tags: c.tags || [],
    owner_id: ownerId,
    created_at: new Date().toISOString()
  }));

  const { error } = await supabase.from('contacts').insert(contactsToInsert);
  if (error) throw error;

  return contactsToInsert.length;
};

// --- UTILS ---
export const downloadCSVTemplate = () => {
    const csvContent = "Nome;Telefone;Email;Tags\nMaria Silva;5511999998888;maria@email.com;Lead;Vip\nJoao Souza;11988887777;;Novo";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_importacao_disparai.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportContactsToCSV = (contacts: Contact[]) => {
    if (!contacts.length) return;
    const headers = ['Nome', 'Telefone', 'Email', 'Tags', 'Observações', 'Data Criação'];
    const csvRows = [headers.join(';')];
    
    contacts.forEach(contact => {
        const row = [
            `"${contact.name}"`, 
            `"${contact.phone}"`, 
            `"${contact.email || ''}"`,
            `"${(contact.tags || []).join(',')}"`, 
            `"${(contact.notes || '').replace(/\n/g, ' ')}"`,
            `"${new Date(contact.createdAt).toLocaleDateString()}"`
        ];
        csvRows.push(row.join(';'));
    });
    
    const csvContent = "\uFEFF" + csvRows.join('\n'); // BOM para Excel abrir acentos corretamente
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `base_contatos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
