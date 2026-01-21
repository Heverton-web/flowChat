
import { Contact } from '../types';
import { supabase } from './supabaseClient';
import { mockStore } from './mockDataStore';

const BASE_CONTACT_LIMIT = 500;

export const formatPhoneForEvolution = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  return clean;
};

export const getContacts = async (userId: string, role: string): Promise<Contact[]> => {
  if (mockStore.isMockMode()) {
      // Mock Delay Simulation
      await new Promise(r => setTimeout(r, 600)); 
      return mockStore.getContacts(userId, role);
  }

  let query = supabase.from('contacts').select('*');
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

export const getTags = async (): Promise<string[]> => {
  if (mockStore.isMockMode()) return ['Lead', 'Vip', 'Novo', 'Boleto', 'Suporte', 'Frio'];
  const { data, error } = await supabase.from('tags').select('name');
  if (error) return [];
  return data.map((t: any) => t.name);
};

export const createTag = async (tagName: string): Promise<string[]> => {
  if (mockStore.isMockMode()) return ['Lead', 'Vip', tagName]; // Simplificado para mock
  const { error } = await supabase.from('tags').insert({ name: tagName, owner_id: (await supabase.auth.getUser()).data.user?.id });
  if (error) throw error;
  return getTags();
};

export const updateTag = async (oldName: string, newName: string): Promise<string[]> => {
  if (mockStore.isMockMode()) return getTags();
  await supabase.from('tags').update({ name: newName }).eq('name', oldName);
  return getTags();
};

export const deleteTag = async (tagName: string): Promise<string[]> => {
  if (mockStore.isMockMode()) return getTags();
  await supabase.from('tags').delete().eq('name', tagName);
  return getTags();
};

export const saveContact = async (
  contact: Omit<Contact, 'id' | 'createdAt' | 'campaignHistory'>, 
  ownerId: string
): Promise<Contact> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 500));
      return mockStore.saveContact({ ...contact, ownerId });
  }

  const { count } = await supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('owner_id', ownerId);
  if ((count || 0) >= BASE_CONTACT_LIMIT) {
      throw new Error(`O limite de ${BASE_CONTACT_LIMIT} contatos foi atingido.`);
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
    ownerId: data.owner_id
  };
};

export const updateContact = async (id: string, updates: Partial<Contact>): Promise<Contact> => {
  if (mockStore.isMockMode()) {
      return mockStore.updateContact(id, updates);
  }

  const payload: any = { ...updates };
  if (updates.phone) payload.phone = formatPhoneForEvolution(updates.phone);
  if (updates.tags) payload.tags = updates.tags;
  if (updates.lockEdit !== undefined) payload.lock_edit = updates.lockEdit;
  if (updates.lockDelete !== undefined) payload.lock_delete = updates.lockDelete;
  
  Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

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

export const assignContact = async (contactId: string, newOwnerId: string): Promise<void> => {
  if (mockStore.isMockMode()) return;
  const { error } = await supabase.from('contacts').update({ owner_id: newOwnerId }).eq('id', contactId);
  if (error) throw error;
};

export const bulkImportContacts = async (
  rawContacts: {name: string, phone: string, email?: string, tags?: string[]}[], 
  ownerId: string
): Promise<number> => {
  if (mockStore.isMockMode()) {
      await new Promise(r => setTimeout(r, 1000));
      rawContacts.forEach(c => mockStore.saveContact({...c, ownerId}));
      return rawContacts.length;
  }

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

// ... (CSV export functions remain the same as they are purely client side logic)
export const downloadCSVTemplate = () => {
    const csvContent = "Nome,Telefone,Email,Tags\nMaria Silva,5511999998888,maria@email.com,Lead;Vip\nJoao Souza,11988887777,,Outubro";
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_contatos_evo.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportContactsToCSV = (contacts: Contact[]) => {
    if (!contacts.length) return;
    const headers = ['Nome', 'Telefone', 'Email', 'Tags', 'Observações', 'Data Criação'];
    const csvRows = [headers.join(',')];
    contacts.forEach(contact => {
        const row = [
            `"${contact.name}"`, `"${contact.phone}"`, `"${contact.email || ''}"`,
            `"${contact.tags.join(';')}"`, `"${contact.notes || ''}"`,
            `"${new Date(contact.createdAt).toLocaleDateString()}"`
        ];
        csvRows.push(row.join(','));
    });
    const csvContent = "\uFEFF" + csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `meus_contatos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
