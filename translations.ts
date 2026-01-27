
export type Language = 'pt-BR' | 'pt-PT' | 'en-US' | 'es-ES';

const ptBase = {
  // Navigation
  menu: 'Menu',
  dashboard: 'Painel',
  inbox: 'Atendimento',
  campaigns: 'Campanhas',
  instances: 'Instâncias',
  contacts: 'Contatos',
  nav_tags: 'Gestão de Tags',
  financial: 'Assinatura e Cobrança',
  reports: 'Relatórios',
  subscription: 'Planos',
  settings: 'Configurações',
  admin: 'Admin',
  logout: 'Sair',
  search: 'Buscar...',
  onboarding: 'Guia Inicial',
  
  // Settings / Theme
  theme: 'Tema',
  language: 'Idioma',
  light: 'Claro',
  dark: 'Escuro',
  general: 'Geral',
  team: 'Equipe',
  integrations: 'Integrações',

  // Dashboard
  welcome_manager: 'Visão Geral da Empresa',
  welcome_agent: 'Meu Painel',
  welcome_sub_manager: 'Acompanhe o desempenho de todas as instâncias e equipe.',
  welcome_sub_agent: 'Acompanhe suas métricas de atendimento.',
  stats_messages: 'Mensagens Enviadas',
  stats_contacts: 'Contatos Ativos',
  stats_instances: 'Instâncias',
  stats_response: 'Tempo Médio Resp.',
  live: 'Ao Vivo',
  volume_chart: 'Volume de Mensagens (7 Dias)',
  team_quota: 'Cotas da Equipe',
  monthly: 'Mensual',
  critical_quota: 'Cota Crítica!',
  near_quota: 'Cota próxima do fim',
  buy_pack: 'Comprar Pacote',
  upgrade: 'Fazer Upgrade',

  // Auth
  login_title: 'Login',
  login_subtitle: 'Plataforma de Gestão de Operações WhatsApp',
  email_label: 'Email Corporativo',
  password_label: 'Senha',
  enter_button: 'Entrar',
  demo_mode: 'Modo Demonstração',
  manager: 'Gestor',
  agent: 'Atendente',

  // Instances
  instances_title: 'Instâncias',
  instances_subtitle: 'Gerencie as conexões de WhatsApp da empresa.',
  my_connection: 'Minha Conexão',
  my_connection_sub: 'Gerencie o status do seu WhatsApp.',
  new_instance: 'Nova Conexão',
  instance_name_placeholder: 'Nome da Instância',
  create: 'Criar',
  cancel: 'Cancelar',
  error_create_limit: 'Limite de instâncias atingido.',
  connected: 'Conectado',
  disconnected: 'Desconectado',
  connect_whatsapp: 'Conectar WhatsApp',
  my_instance: 'Minha Instância',

  // Campaigns
  campaigns_title: 'Campanhas',
  campaigns_subtitle: 'Disparos em massa e automações.',
  new_campaign: 'Nova Campanha',
  start_campaign: 'Iniciar Disparo',
  prospecting: 'Prospecção',
  communication: 'Comunicado',
  promotion: 'Promoção',
  sales: 'Vendas',
  maintenance: 'Manutenção',
  workflow_builder: 'Construtor de Fluxo',
  workflow_empty: 'Fluxo Vazio',
  workflow_add_first: 'Adicionar Primeiro Passo',
  workflow_add_next: 'Adicionar Passo',
  step_text: 'Mensagem de Texto',
  step_audio: 'Áudio (PTT)',
  step_image: 'Imagem',
  step_video: 'Vídeo',
  step_document: 'Documento',
  step_poll: 'Enquete',
  delay_label: 'Aguardar (Delay)',
  seconds: 'segundos',

  // Contacts
  contacts_base_title: 'Base de Contatos',
  contacts_subtitle: 'Gerencie leads e clientes.',
  add_contact: 'Novo Contato',
  name: 'Nome',
  tags: 'Tags',
  actions: 'Ações',

  // Onboarding
  onboarding_title: 'Configuração Inicial',
  onboarding_subtitle: 'Siga os passos para ativar sua operação.',
};

export const translations = {
  'pt-BR': ptBase,
  'pt-PT': ptBase,
  'en-US': ptBase,
  'es-ES': ptBase,
};
