
import { Contact } from '../types';
import * as teamService from './teamService';

// Mock Database mimicking Supabase
// Generated 30 Realistic Contacts with 5+ distinct Tags
let MOCK_DB_CONTACTS: Contact[] = [
  // Manager Contacts
  { id: '1', name: 'Carlos Cliente', phone: '5511999998888', email: 'carlos@email.com', tags: ['Vip', 'Outubro/23'], campaignHistory: ['Promoção Black Friday'], notes: 'Cliente prefere contato pela manhã.', createdAt: '2023-10-01T10:00:00Z', ownerId: 'manager-1' },
  { id: '4', name: 'Ana Souza', phone: '5511987654321', email: 'ana.souza@gmail.com', tags: ['Novo Lead'], campaignHistory: [], notes: '', createdAt: '2023-11-01T14:20:00Z', ownerId: 'manager-1' },
  { id: '5', name: 'Marcos Pereira', phone: '5511912345678', email: 'marcos.dev@tech.com', tags: ['Vip', 'Tecnologia'], campaignHistory: ['Promoção Black Friday'], notes: 'Interessado em API.', createdAt: '2023-09-15T09:00:00Z', ownerId: 'manager-1' },
  { id: '6', name: 'Julia Roberts', phone: '5521998765432', email: 'juju@hollywood.com', tags: ['Internacional'], campaignHistory: [], notes: '', createdAt: '2023-11-10T11:00:00Z', ownerId: 'manager-1' },
  { id: '7', name: 'Pedro Alvares', phone: '5531987654321', email: 'pedro@descobrimento.com', tags: ['Cliente Antigo'], campaignHistory: ['Promoção Black Friday'], notes: 'Cliente desde 2020.', createdAt: '2020-04-22T10:00:00Z', ownerId: 'manager-1' },

  // Agent 1 (Atendente Demo)
  { id: '2', name: 'Mariana Lead', phone: '5511988887777', email: 'mariana@site.com.br', tags: ['Novo Lead', 'Interessado'], campaignHistory: [], notes: '', createdAt: '2023-11-12T15:30:00Z', ownerId: 'agent-1' },
  { id: '3', name: 'Roberto Silva', phone: '5521977776666', email: 'beto@uol.com.br', tags: ['Vip'], campaignHistory: ['Promoção Black Friday'], notes: 'Já comprou 3 vezes.', createdAt: '2023-08-20T16:45:00Z', ownerId: 'agent-1' },
  { id: '8', name: 'Fernanda Lima', phone: '5541999887766', email: 'fer.lima@modelo.com', tags: ['Interessado'], campaignHistory: [], notes: '', createdAt: '2023-11-14T09:15:00Z', ownerId: 'agent-1' },
  { id: '9', name: 'Ricardo Oliveira', phone: '5551988776655', email: 'rick@poa.com', tags: ['Novo Lead'], campaignHistory: [], notes: 'Veio pelo Instagram.', createdAt: '2023-11-15T10:20:00Z', ownerId: 'agent-1' },
  { id: '10', name: 'Camila Pitanga', phone: '5521977665544', email: 'camila@globo.com', tags: ['Vip', 'Rio'], campaignHistory: ['Promoção Black Friday'], notes: '', createdAt: '2023-10-05T14:00:00Z', ownerId: 'agent-1' },

  // Agent 2 (Roberto Vendas) - Sales Focus
  { id: '11', name: 'João da Silva', phone: '5511966554433', email: 'joao@silva.com', tags: ['Negociação', 'Quente'], campaignHistory: ['Follow-up Leads Outubro'], notes: 'Aguardando aprovação do gerente.', createdAt: '2023-10-25T11:30:00Z', ownerId: 'agent-2' },
  { id: '12', name: 'Maria Clara', phone: '5511955443322', email: 'maria@clara.com', tags: ['Negociação'], campaignHistory: ['Lançamento Produto X'], notes: '', createdAt: '2023-10-28T09:45:00Z', ownerId: 'agent-2' },
  { id: '13', name: 'Lucas Neto', phone: '5521944332211', email: 'lucas@yt.com', tags: ['Quente', 'Influencer'], campaignHistory: ['Lançamento Produto X'], notes: 'Parceria potencial.', createdAt: '2023-11-01T16:00:00Z', ownerId: 'agent-2' },
  { id: '14', name: 'Beatriz Reis', phone: '5511933221100', email: 'bia@bras.com', tags: ['Frio'], campaignHistory: [], notes: 'Não atende ligações.', createdAt: '2023-09-10T10:00:00Z', ownerId: 'agent-2' },
  { id: '15', name: 'Gabriel Medina', phone: '5513922110099', email: 'gabriel@surf.com', tags: ['Vip', 'Esporte'], campaignHistory: ['Lançamento Produto X'], notes: '', createdAt: '2023-10-15T14:30:00Z', ownerId: 'agent-2' },

  // Agent 3 (Carla Suporte) - Support Focus
  { id: '16', name: 'Empresa ABC Ltda', phone: '5511911009988', email: 'contato@abc.com', tags: ['Suporte', 'Urgente'], campaignHistory: ['Aviso de Manutenção Programada'], notes: 'Problema no login.', createdAt: '2023-11-18T08:00:00Z', ownerId: 'agent-3' },
  { id: '17', name: 'Tech Solutions', phone: '5511900998877', email: 'admin@techsol.com', tags: ['Suporte'], campaignHistory: ['Aviso de Manutenção Programada'], notes: '', createdAt: '2023-11-18T09:15:00Z', ownerId: 'agent-3' },
  { id: '18', name: 'Padaria do Zé', phone: '5511999887766', email: 'ze@padaria.com', tags: ['Suporte', 'Resolvido'], campaignHistory: [], notes: 'Dúvida sobre fatura.', createdAt: '2023-11-17T15:00:00Z', ownerId: 'agent-3' },
  { id: '19', name: 'Oficina Mecânica', phone: '5511988776655', email: 'mecanica@oficina.com', tags: ['Manutenção'], campaignHistory: ['Aviso de Manutenção Programada'], notes: '', createdAt: '2023-11-16T11:30:00Z', ownerId: 'agent-3' },
  { id: '20', name: 'Salão de Beleza VIP', phone: '5511977665544', email: 'salao@vip.com', tags: ['Suporte'], campaignHistory: [], notes: '', createdAt: '2023-11-18T14:45:00Z', ownerId: 'agent-3' },

  // Agent 4 (Lucas Financeiro) - Finance Focus
  { id: '21', name: 'Devedor 01', phone: '5511966554433', email: 'divida@email.com', tags: ['Cobrança', 'Atrasado'], campaignHistory: ['Cobrança Automática'], notes: 'Prometeu pagar dia 15.', createdAt: '2023-10-01T09:00:00Z', ownerId: 'agent-4' },
  { id: '22', name: 'Construtora X', phone: '5511955443322', email: 'fin@construtora.com', tags: ['Faturamento'], campaignHistory: [], notes: 'Enviar NF.', createdAt: '2023-11-01T10:00:00Z', ownerId: 'agent-4' },
  { id: '23', name: 'Escola Y', phone: '5511944332211', email: 'dir@escola.com', tags: ['Cobrança'], campaignHistory: ['Cobrança Automática'], notes: '', createdAt: '2023-10-15T11:00:00Z', ownerId: 'agent-4' },
  { id: '24', name: 'Restaurante Bom Sabor', phone: '5511933221100', email: 'fin@restaurante.com', tags: ['Em dia'], campaignHistory: [], notes: '', createdAt: '2023-09-01T14:00:00Z', ownerId: 'agent-4' },
  { id: '25', name: 'Academia Fit', phone: '5511922110099', email: 'recepcao@fit.com', tags: ['Cobrança', 'Negociação'], campaignHistory: ['Cobrança Automática'], notes: 'Quer parcelar.', createdAt: '2023-10-20T16:00:00Z', ownerId: 'agent-4' },

  // Agent 5 (Fernanda Marketing) - Marketing Focus
  { id: '26', name: 'Lead Site A', phone: '5511911002233', email: 'leadA@site.com', tags: ['Marketing', 'Topo de Funil'], campaignHistory: ['Promoção Black Friday'], notes: '', createdAt: '2023-11-19T09:00:00Z', ownerId: 'agent-5' },
  { id: '27', name: 'Lead Site B', phone: '5511922334455', email: 'leadB@site.com', tags: ['Marketing', 'Topo de Funil'], campaignHistory: ['Promoção Black Friday'], notes: '', createdAt: '2023-11-19T09:30:00Z', ownerId: 'agent-5' },
  { id: '28', name: 'Lead Instagram', phone: '5511933445566', email: 'insta@user.com', tags: ['Marketing', 'Meio de Funil'], campaignHistory: [], notes: 'Interagiu no stories.', createdAt: '2023-11-18T18:00:00Z', ownerId: 'agent-5' },
  { id: '29', name: 'Lead LinkedIn', phone: '5511944556677', email: 'linkedin@user.com', tags: ['Marketing', 'B2B'], campaignHistory: [], notes: '', createdAt: '2023-11-17T10:00:00Z', ownerId: 'agent-5' },
  { id: '30', name: 'Newsletter Sub', phone: '5511955667788', email: 'news@sub.com', tags: ['Marketing', 'Newsletter'], campaignHistory: ['Promoção Black Friday'], notes: '', createdAt: '2023-11-01T08:00:00Z', ownerId: 'agent-5' }
];

const BASE_CONTACT_LIMIT = 500;
const CONTACT_PACK_SIZE = 500;

export const formatPhoneForEvolution = (phone: string): string => {
  // Remove non-digits
  let clean = phone.replace(/\D/g, '');
  // Simple heuristic: if length is 10 or 11 (BR format without country code), add 55
  if (clean.length === 10 || clean.length === 11) {
    clean = '55' + clean;
  }
  return clean;
};

// Retrieve contacts based on role and ID
export const getContacts = async (userId: string, role: string): Promise<Contact[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      if (role === 'manager') {
        resolve([...MOCK_DB_CONTACTS]); // Manager sees all
      } else {
        resolve(MOCK_DB_CONTACTS.filter(c => c.ownerId === userId)); // Agent sees their own
      }
    }, 500);
  });
};

export const saveContact = async (
  contact: Omit<Contact, 'id' | 'createdAt' | 'campaignHistory'>, 
  ownerId: string
): Promise<Contact> => {
  return new Promise(async (resolve, reject) => {
    
    // Check limit for this specific owner
    const ownerCount = MOCK_DB_CONTACTS.filter(c => c.ownerId === ownerId).length;
    
    // Fetch Agent Plan to check for extra packs
    let limit = BASE_CONTACT_LIMIT;
    try {
        const agent = await teamService.getAgentById(ownerId);
        if (agent) {
            limit = BASE_CONTACT_LIMIT + (agent.extraContactPacks * CONTACT_PACK_SIZE);
        }
    } catch (e) {
        console.error("Failed to fetch agent limits", e);
    }

    if (ownerCount >= limit) {
      setTimeout(() => {
          reject(new Error(`O limite de ${limit} contatos foi atingido para este atendente. Adquira mais pacotes de contatos.`));
      }, 300);
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
      
      MOCK_DB_CONTACTS = [newContact, ...MOCK_DB_CONTACTS];
      resolve(newContact);
    }, 600);
  });
};

export const updateContact = async (id: string, updates: Partial<Contact>): Promise<Contact> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_DB_CONTACTS = MOCK_DB_CONTACTS.map(c => 
        c.id === id ? { ...c, ...updates, phone: updates.phone ? formatPhoneForEvolution(updates.phone) : c.phone } : c
      );
      resolve(MOCK_DB_CONTACTS.find(c => c.id === id)!);
    }, 400);
  });
};

export const deleteContact = async (id: string): Promise<void> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      MOCK_DB_CONTACTS = MOCK_DB_CONTACTS.filter(c => c.id !== id);
      resolve();
    }, 400);
  });
};

export const assignContact = async (contactId: string, newOwnerId: string): Promise<void> => {
  return new Promise(async (resolve, reject) => {
    
    // Check limit for new owner
    const newOwnerCount = MOCK_DB_CONTACTS.filter(c => c.ownerId === newOwnerId).length;
    
    // Fetch Agent Plan to check for extra packs
    let limit = BASE_CONTACT_LIMIT;
    try {
        const agent = await teamService.getAgentById(newOwnerId);
        if (agent) {
            limit = BASE_CONTACT_LIMIT + (agent.extraContactPacks * CONTACT_PACK_SIZE);
        }
    } catch (e) {
        console.error("Failed to fetch agent limits", e);
    }

    if (newOwnerCount >= limit) {
      setTimeout(() => {
          reject(new Error(`O atendente destino atingiu o limite de ${limit} contatos.`));
      }, 300);
      return;
    }

    setTimeout(() => {
      MOCK_DB_CONTACTS = MOCK_DB_CONTACTS.map(c => 
        c.id === contactId ? { ...c, ownerId: newOwnerId } : c
      );
      resolve();
    }, 500);
  });
};

export const bulkImportContacts = async (
  rawContacts: {name: string, phone: string, email?: string, tags?: string[]}[], 
  ownerId: string
): Promise<number> => {
  return new Promise(async (resolve, reject) => {
    
    // Check limit
    const ownerCount = MOCK_DB_CONTACTS.filter(c => c.ownerId === ownerId).length;
    let limit = BASE_CONTACT_LIMIT;
    try {
        const agent = await teamService.getAgentById(ownerId);
        if (agent) {
            limit = BASE_CONTACT_LIMIT + (agent.extraContactPacks * CONTACT_PACK_SIZE);
        }
    } catch (e) {
        console.error("Failed to fetch agent limits", e);
    }

    const remainingSlots = limit - ownerCount;
    
    if (remainingSlots <= 0) {
        setTimeout(() => {
            reject(new Error(`Limite de contatos excedido para este usuário. Limite atual: ${limit}`));
        }, 500);
        return;
    }

    setTimeout(() => {
      // Slice to fit available slots
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

      MOCK_DB_CONTACTS = [...toAdd, ...MOCK_DB_CONTACTS];
      
      resolve(toAdd.length);
    }, 1000);
  });
};

export const downloadCSVTemplate = () => {
    const csvHeader = "Nome,Telefone,Email,Tags\n";
    const csvExample = "Maria Silva,5511999998888,maria@email.com,Lead;Vip\nJoao Souza,11988887777,,Outubro";
    const csvContent = csvHeader + csvExample;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'modelo_contatos_evo.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const exportContactsToCSV = (contacts: Contact[]) => {
    if (!contacts.length) return;

    // Header
    const headers = ['Nome', 'Telefone', 'Email', 'Tags', 'Observações', 'Data Criação'];
    const csvRows = [headers.join(',')];

    // Data
    contacts.forEach(contact => {
        const row = [
            `"${contact.name}"`,
            `"${contact.phone}"`,
            `"${contact.email || ''}"`,
            `"${contact.tags.join(';')}"`, // Join tags with semicolon
            `"${contact.notes || ''}"`,
            `"${new Date(contact.createdAt).toLocaleDateString()}"`
        ];
        csvRows.push(row.join(','));
    });

    const csvContent = "\uFEFF" + csvRows.join('\n'); // Add BOM for UTF-8 Excel compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    const fileName = `meus_contatos_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};
