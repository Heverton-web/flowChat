
-- =============================================
-- FLOWCHAT - ESQUEMA DE BANCO DE DADOS (CORRIGIDO)
-- Data: Atualizado para evitar erros de duplicidade
-- =============================================

-- 1. Habilitar extensão para UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABELAS (Estrutura Base)
-- Usamos IF NOT EXISTS para não quebrar se a tabela já existir

CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  name TEXT,
  email TEXT,
  role TEXT DEFAULT 'agent',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS instances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'disconnected',
  phone TEXT,
  last_update TIMESTAMPTZ DEFAULT NOW(),
  battery INTEGER,
  messages_used INTEGER DEFAULT 0,
  messages_limit INTEGER DEFAULT 0,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tags (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contacts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  tags TEXT[] DEFAULT '{}',
  campaign_history TEXT[] DEFAULT '{}',
  notes TEXT,
  lock_edit BOOLEAN DEFAULT FALSE,
  lock_delete BOOLEAN DEFAULT FALSE,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  scheduled_date TIMESTAMPTZ,
  objective TEXT,
  status TEXT DEFAULT 'scheduled',
  agent_name TEXT,
  total_contacts INTEGER DEFAULT 0,
  target_list JSONB DEFAULT '[]'::jsonb, -- Garantido na criação
  delivery_rate NUMERIC,
  executed_at TIMESTAMPTZ,
  workflow JSONB DEFAULT '[]'::jsonb,
  min_delay INTEGER DEFAULT 30,
  max_delay INTEGER DEFAULT 120,
  owner_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- MIGRATION SEGURA: Adiciona target_list caso a tabela campaigns já exista mas sem a coluna
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='campaigns' AND column_name='target_list') THEN
        ALTER TABLE campaigns ADD COLUMN target_list JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS licenses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  tier TEXT DEFAULT 'STANDARD',
  status TEXT DEFAULT 'ACTIVE',
  renewal_date TIMESTAMPTZ,
  limits JSONB DEFAULT '{"maxSeats": 1, "maxMessagesPerMonth": 1000}'::jsonb,
  addon_seats INTEGER DEFAULT 0,
  features JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  date TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  amount NUMERIC,
  type TEXT,
  status TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- SEGURANÇA (RLS - Row Level Security)
-- =============================================

-- Habilita RLS em todas as tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- REMOÇÃO DE POLÍTICAS ANTIGAS (Para evitar erro 42710)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

DROP POLICY IF EXISTS "Users can view own instances" ON instances;
DROP POLICY IF EXISTS "Users can insert own instances" ON instances;
DROP POLICY IF EXISTS "Users can update own instances" ON instances;
DROP POLICY IF EXISTS "Users can delete own instances" ON instances;

DROP POLICY IF EXISTS "Users can view own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can insert own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can update own contacts" ON contacts;
DROP POLICY IF EXISTS "Users can delete own contacts" ON contacts;

DROP POLICY IF EXISTS "Users can view own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can insert own campaigns" ON campaigns;
DROP POLICY IF EXISTS "Users can update own campaigns" ON campaigns;

DROP POLICY IF EXISTS "Users can view own tags" ON tags;
DROP POLICY IF EXISTS "Users can insert own tags" ON tags;
DROP POLICY IF EXISTS "Users can delete own tags" ON tags;

-- CRIAÇÃO DAS NOVAS POLÍTICAS

-- PROFILES
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- INSTANCES
CREATE POLICY "Users can view own instances" ON instances FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own instances" ON instances FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own instances" ON instances FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own instances" ON instances FOR DELETE USING (auth.uid() = owner_id);

-- CONTACTS
CREATE POLICY "Users can view own contacts" ON contacts FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own contacts" ON contacts FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own contacts" ON contacts FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Users can delete own contacts" ON contacts FOR DELETE USING (auth.uid() = owner_id);

-- CAMPAIGNS
CREATE POLICY "Users can view own campaigns" ON campaigns FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own campaigns" ON campaigns FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can update own campaigns" ON campaigns FOR UPDATE USING (auth.uid() = owner_id);

-- TAGS
CREATE POLICY "Users can view own tags" ON tags FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "Users can insert own tags" ON tags FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Users can delete own tags" ON tags FOR DELETE USING (auth.uid() = owner_id);

-- =============================================
-- TRIGGERS E FUNÇÕES
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER 
LANGUAGE plpgsql 
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data ->> 'name', 
    new.email, 
    COALESCE(new.raw_user_meta_data ->> 'role', 'agent'), 
    new.raw_user_meta_data ->> 'avatar'
  );
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
