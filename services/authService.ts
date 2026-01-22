
import { supabase } from './supabaseClient';
import { User, UserRole } from '../types';
import { mockStore } from './mockDataStore';

// Credenciais MOCK para Fallback (Modo Demonstração)
const MOCK_USERS = [
    { id: 'mock-super', email: 'super@flowchat.com', password: '123456', name: 'Super Admin', role: 'super_admin' as UserRole },
    { id: 'mock-manager', email: 'admin@flowchat.com', password: '123456', name: 'Gestor Mock', role: 'manager' as UserRole },
    { id: 'mock-agent', email: 'agent@flowchat.com', password: '123456', name: 'Agente Mock', role: 'agent' as UserRole },
    { id: 'mock-dev', email: 'dev@flowchat.com', password: '123456', name: 'Dev Mock', role: 'developer' as UserRole }
];

export const signIn = async (email: string, password: string): Promise<User> => {
  // 1. Verificação MOCK (Prioritária para garantir a demo)
  const mockUser = MOCK_USERS.find(u => u.email === email && u.password === password);
  
  if (mockUser) {
      console.log("🔐 MOCK MODE ACTIVATED: Using local cache storage.");
      mockStore.setMockMode(true); // Ativa o modo mock globalmente
      
      // Persistir sessão mock no localStorage para sobreviver ao refresh
      localStorage.setItem('flowchat_mock_session', JSON.stringify(mockUser));

      return {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          avatar: `https://ui-avatars.com/api/?name=${mockUser.name.replace(' ','+')}&background=0D8ABC&color=fff`
      };
  }

  // 2. Se não for mock, tenta Supabase real
  mockStore.setMockMode(false); // Garante que está desligado
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (!error && data.user) {
      return fetchUserProfile(data.user.id, data.user.email);
  }

  if (error) throw error;
  throw new Error('Usuário não encontrado');
};

export const signUp = async (name: string, email: string, password: string, role: UserRole = 'manager'): Promise<User> => {
  // Se estivermos tentando criar um dos mocks, apenas fingimos sucesso
  const isMockEmail = MOCK_USERS.some(u => u.email === email);
  if (isMockEmail) {
      return { id: 'mock-new', name, email, role, avatar: '' };
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { name, role, avatar: `https://ui-avatars.com/api/?name=${name.replace(' ','+')}&background=0D8ABC&color=fff` }
    }
  });

  if (error) throw error;
  if (data.user && !data.session) {
      // Email confirmation required case, or session handling different
      return { id: data.user.id, name, email, role, avatar: '' };
  }
  if (!data.user) throw new Error('Erro ao criar usuário');

  // Retry logic para aguardar trigger de criação de perfil no banco
  let retries = 5;
  while (retries > 0) {
      try {
          const profile = await fetchUserProfile(data.user.id);
          // Se encontrou o perfil, retorna.
          return profile;
      } catch (e) {
          retries--;
          // Se esgotou as tentativas, retorna um objeto User otimista com o ROLE CORRETO
          // Isso evita que o fetchUserProfile use o fallback que define como 'agent'
          if (retries === 0) {
             return { 
                 id: data.user.id, 
                 name: name, 
                 email: email, 
                 role: role, // IMPORTANTE: Força o role solicitado
                 avatar: `https://ui-avatars.com/api/?name=${name.replace(' ','+')}&background=0D8ABC&color=fff` 
             };
          }
          await new Promise(resolve => setTimeout(resolve, 1000));
      }
  }
  
  // Fallback final
  return { 
     id: data.user.id, 
     name: name, 
     email: email, 
     role: role, 
     avatar: '' 
  };
};

export const signOut = async () => {
  await supabase.auth.signOut();
  localStorage.removeItem('flowchat_mock_session');
  mockStore.setMockMode(false); // Desativa modo mock ao sair
};

export const fetchUserProfile = async (userId: string, emailContext?: string): Promise<User> => {
  // 1. Fallback Mock via ID ou Email
  const mockUser = MOCK_USERS.find(u => u.id === userId || u.email === emailContext);
  if (mockUser) {
      return {
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email,
          role: mockUser.role,
          avatar: `https://ui-avatars.com/api/?name=${mockUser.name.replace(' ','+')}&background=random`
      };
  }

  // 2. Busca Real
  const { data: profile, error } = await supabase.from('profiles').select('*').eq('id', userId).single();

  if (error || !profile) {
      if (emailContext) {
          // Fallback temporário para quando o perfil ainda não existe no banco
          // Mas cuidado: isso pode sobrescrever roles importantes se chamado isoladamente.
          // O ideal é que o signUp lide com a criação otimista.
          let derivedRole: UserRole = 'agent';
          if (emailContext.includes('admin') || emailContext.includes('super')) derivedRole = 'manager';
          
          return { id: userId, name: emailContext.split('@')[0], email: emailContext, role: derivedRole, avatar: '' };
      }
      throw error || new Error("Perfil não encontrado.");
  }

  return {
    id: profile.id,
    name: profile.name,
    email: profile.email,
    role: profile.role as UserRole,
    avatar: profile.avatar_url || '',
  };
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Prioridade: Sessão Mock (localStorage)
  const mockSession = localStorage.getItem('flowchat_mock_session');
  if (mockSession) {
      try {
          const user = JSON.parse(mockSession);
          mockStore.setMockMode(true); // Reativa flags se deu refresh
          return {
              id: user.id,
              name: user.name,
              email: user.email,
              role: user.role,
              avatar: `https://ui-avatars.com/api/?name=${user.name.replace(' ','+')}&background=0D8ABC&color=fff`
          };
      } catch (e) {
          localStorage.removeItem('flowchat_mock_session');
      }
  }

  // Se não tem mock, tenta Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    try {
      mockStore.setMockMode(false);
      return await fetchUserProfile(session.user.id, session.user.email);
    } catch (error) {
      console.error("Erro ao recuperar sessão real:", error);
    }
  }

  return null;
};
