
import { Contact } from '../types';
import * as teamService from './teamService';

const STORAGE_KEY = 'flowchat_contacts';
const STORAGE_TAGS_KEY = 'flowchat_tags';

const MOCK_DEFAULTS: Contact[] = [
  { id: '1', name: 'Carlos Cliente', phone: '5511999998888', email: 'carlos@email.com', tags: ['Vip', 'Outubro/23'], campaignHistory: [], notes: 'Cliente prefere contato pela manhã.', createdAt: '2023-10-01T10:00:00Z', ownerId: 'manager-1' },
  { id: '2', name: 'Mariana Lead', phone: '5511988887777', email: 'mariana@site.com.br', tags: ['Novo Lead'], campaignHistory: [], notes: '', createdAt: '2023-11-12T15:30:00Z', ownerId: 'agent-1' },
];

const loadData = (): Contact[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) return JSON.parse(stored);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_DEFAULTS));
  return MOCK_DEFAULTS;
};

const saveData = (data: Contact[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
};

// --- TAGS MANAGEMENT START ---

const loadTags = (): string[] => {
    const stored = localStorage.getItem(STORAGE_TAGS_KEY);
    if (stored) return JSON.parse(stored);
    
    // Initial Seed from contacts if empty
    const contacts = loadData();
    const unique = Array.from(new Set(contacts.flatMap(c => c.tags)));
    localStorage.setItem(STORAGE_TAGS_KEY, JSON.stringify(unique));
    return unique;
};

const saveTagsData = (tags: string[]) => {
    localStorage.setItem(STORAGE_TAGS_KEY, JSON.stringify(tags));
};

export const getTags = async (): Promise<string[]> => {
    return new Promise(resolve => setTimeout(() => resolve(loadTags()), 300));
};

export const createTag = async (tagName: string): Promise<string[]> => {
    return new Promise((resolve, reject) => {
        const tags = loadTags();
        if (tags.includes(tagName)) {
            reject(new Error('Tag já existe.'));
            return;
        }
        const newTags = [...tags, tagName];
        saveTagsData(newTags);
        setTimeout(() => resolve(newTags), 400);
    });
};

export const updateTag = async (oldName: string, newName: string): Promise<string[]> => {
    return new Promise((resolve) => {
        // 1. Update List
        const tags = loadTags();
        const newTags = tags.map(t => t === oldName ? newName : t);
        saveTagsData(newTags);

        // 2. Update All Contacts
        const contacts = loadData();
        const updatedContacts = contacts.map(c => ({
            ...c,
            tags: c.tags.map(t => t === oldName ? newName : t)
        }));
        saveData(updatedContacts);

        setTimeout(() => resolve(newTags), 500);
    });
};

export const deleteTag = async (tagName: string): Promise<string[]> => {
    return new Promise((resolve) => {
         // 1. Remove from List
        const tags = loadTags();
        const newTags = tags.filter(t => t !== tagName);
        saveTagsData(newTags);

        // 2. Remove from All Contacts
        const contacts = loadData();
        const updatedContacts = contacts.map(c => ({
            ...c,
            tags: (c.tags || []).filter(t => t !== tagName)
        }));
        saveData(updatedContacts);

        setTimeout(() => resolve(newTags), 500);
    });
};

// --- TAGS MANAGEMENT END ---

const BASE_CONTACT_LIMIT = 500;
const CONTACT_PACK_SIZE = 500;

export const formatPhoneForEvolution = (phone: string): string => {
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  return clean;
};

export const getContacts = async (userId: string, role: string): Promise<Contact[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const contacts = loadData();
      if (role === 'manager') {
        resolve(contacts);
      } else {
        resolve(contacts.filter(c => c.ownerId === userId));
      }
    }, 500);
  });
};

export const saveContact = async (
  contact: Omit<Contact, 'id' | 'createdAt' | 'campaignHistory'>, 
  ownerId: string
): Promise<Contact> => {
  return new Promise(async (resolve, reject) => {
    
    const contacts = loadData();
    const ownerCount = contacts.filter(c => c.ownerId === ownerId).length;
    
    let limit = BASE_CONTACT_LIMIT;
    try {
        const agent = await teamService.getAgentById(ownerId);
        if (agent) {
            limit = BASE_CONTACT_LIMIT + ((agent.extraContactPacks || 0) * CONTACT_PACK_SIZE);
        }
    } catch (e) { console.error(e); }

    if (ownerCount >= limit) {
      setTimeout(() => reject(new Error(`O limite de ${limit} contatos foi atingido.`)), 300);
      return;
    }

    setTimeout(() => {
      const newContact: Contact = {
        ...contact,
        id: Math.random().toString(36).substr(2, 9),
        campaignHistory: [],
        createdAt: new Date().toISOString(),
        phone: formatPhoneForEvolution(contact.phone),
        ownerId: ownerId
      };
      
      saveData([newContact, ...contacts]);
      
      // Sync tags if new ones introduced
      const currentTags = loadTags();
      const newTagsFromContact = contact.tags.filter(t => !currentTags.includes(t));
      if (newTagsFromContact.length > 0) {
          saveTagsData([...currentTags, ...newTagsFromContact]);
      }

      resolve(newContact);
    }, 600);
  });
};

export const updateContact = async (id: string, updates: Partial<Contact>): Promise<Contact> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const contacts = loadData();
      const updatedContacts = contacts.map(c => 
        c.id === id ? { ...c, ...updates, phone: updates.phone ? formatPhoneForEvolution(updates.phone) : c.phone } : c
      );
      saveData(updatedContacts);

      // Sync tags if new ones introduced
      if (updates.tags) {
        const currentTags = loadTags();
        const newTagsFromContact = updates.tags.filter(t => !currentTags.includes(t));
        if (newTagsFromContact.length > 0) {
            saveTagsData([...currentTags, ...newTagsFromContact]);
        }
      }

      resolve(updatedContacts.find(c => c.id === id)!);
    }, 400);
  });
};

export const deleteContact = async (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const contacts = loadData();
      saveData(contacts.filter(c => c.id !== id));
      resolve();
    }, 400);
  });
};

export const assignContact = async (contactId: string, newOwnerId: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    const contacts = loadData();
    const newOwnerCount = contacts.filter(c => c.ownerId === newOwnerId).length;
    
    let limit = BASE_CONTACT_LIMIT;
    try {
        const agent = await teamService.getAgentById(newOwnerId);
        if (agent) {
            limit = BASE_CONTACT_LIMIT + ((agent.extraContactPacks || 0) * CONTACT_PACK_SIZE);
        }
    } catch (e) { console.error(e); }

    if (newOwnerCount >= limit) {
      setTimeout(() => reject(new Error(`O atendente destino atingiu o limite de ${limit} contatos.`)), 300);
      return;
    }

    setTimeout(() => {
      const updatedContacts = contacts.map(c => 
        c.id === contactId ? { ...c, ownerId: newOwnerId } : c
      );
      saveData(updatedContacts);
      resolve();
    }, 500);
  });
};

export const bulkImportContacts = async (
  rawContacts: {name: string, phone: string, email?: string, tags?: string[]}[], 
  ownerId: string
): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    const contacts = loadData();
    const ownerCount = contacts.filter(c => c.ownerId === ownerId).length;
    let limit = BASE_CONTACT_LIMIT;
    try {
        const agent = await teamService.getAgentById(ownerId);
        if (agent) limit = BASE_CONTACT_LIMIT + ((agent.extraContactPacks || 0) * CONTACT_PACK_SIZE);
    } catch (e) { console.error(e); }

    const remainingSlots = limit - ownerCount;
    if (remainingSlots <= 0) {
        setTimeout(() => reject(new Error(`Limite excedido. Atual: ${limit}`)), 500);
        return;
    }

    setTimeout(() => {
      const toAdd = rawContacts.slice(0, remainingSlots).map(c => ({
        id: Math.random().toString(36).substr(2, 9),
        name: c.name,
        phone: formatPhoneForEvolution(c.phone),
        email: c.email || '',
        tags: c.tags || [],
        campaignHistory: [],
        notes: '',
        createdAt: new Date().toISOString(),
        ownerId: ownerId
      }));

      // Sync tags from import
      const currentTags = loadTags();
      const allNewTags = toAdd.flatMap(c => c.tags);
      const uniqueNewTags = Array.from(new Set(allNewTags)).filter(t => !currentTags.includes(t));
      if (uniqueNewTags.length > 0) {
          saveTagsData([...currentTags, ...uniqueNewTags]);
      }

      saveData([...toAdd, ...contacts]);
      resolve(toAdd.length);
    }, 1000);
  });
};

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
