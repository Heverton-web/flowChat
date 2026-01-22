
import { Transaction, LicenseStatus, PLAN_DEFS } from '../types';
import { supabase } from './supabaseClient';
import { mockStore } from './mockDataStore';

// Default mock adjusted to match new START plan logic as base
const MOCK_LIC_DEFAULT: LicenseStatus = {
    license: {
        tier: 'START', 
        status: 'ACTIVE',
        renewalDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(),
        limits: { maxSeats: PLAN_DEFS.START.seats, maxMessagesPerMonth: 5000, maxContacts: 1000 },
        addonSeats: 0,
        features: { canUseApi: false, whiteLabel: false, prioritySupport: false }
    },
    usage: { usedSeats: 1, usedInstances: 0, usedMessagesThisMonth: 0, usedContacts: 0 },
    get totalSeats() { return this.license.limits.maxSeats + this.license.addonSeats; }
};

export const getTransactions = async (userId: string, role: string): Promise<Transaction[]> => {
  if (mockStore.isMockMode()) {
      return mockStore.getTransactions(userId);
  }

  const { data, error } = await supabase.from('transactions').select('*').order('date', { ascending: false });
  if (error) {
      console.error(error);
      return [];
  }
  return data.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      userName: 'Usuário',
      date: t.date,
      description: t.description,
      amount: t.amount,
      type: t.type,
      status: t.status,
      paymentMethod: t.payment_method
  }));
};

export const getLicenseStatus = async (): Promise<LicenseStatus> => {
    // Modo Mock retorna sempre uma licença ativa e cheia de dados
    if (mockStore.isMockMode()) {
        const base = { ...MOCK_LIC_DEFAULT };
        base.usage.usedInstances = 1;
        base.usage.usedSeats = 3;
        return base;
    }

    const { data: licenseData, error } = await supabase.from('licenses').select('*').single();
    
    let baseLicense = MOCK_LIC_DEFAULT;
    
    if (licenseData) {
        baseLicense = {
            license: {
                tier: licenseData.tier,
                status: licenseData.status,
                renewalDate: licenseData.renewal_date,
                limits: licenseData.limits,
                addonSeats: licenseData.addon_seats,
                features: licenseData.features
            },
            usage: { ...MOCK_LIC_DEFAULT.usage },
            get totalSeats() { return this.license.limits.maxSeats + this.license.addonSeats; }
        };
    }

    const { count: agentCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'agent');
    const { count: instanceCount } = await supabase.from('instances').select('*', { count: 'exact', head: true });
    
    baseLicense.usage.usedSeats = (agentCount || 0) + 1; 
    baseLicense.usage.usedInstances = instanceCount || 0;

    return baseLicense;
};

export const requestAddonSeat = async (quantity: number): Promise<void> => {
    if (mockStore.isMockMode()) return;

    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;

    await supabase.from('transactions').insert({
        user_id: user.id,
        description: `Solicitação: +${quantity} Seat(s) Adicionais`,
        amount: quantity * 47.00, // Updated Price from Addon list
        type: 'addon_seat',
        status: 'completed',
        payment_method: 'credit_card'
    });

    const { data: lic } = await supabase.from('licenses').select('id, addon_seats').single();
    if (lic) {
        await supabase.from('licenses').update({ addon_seats: lic.addon_seats + quantity }).eq('id', lic.id);
    }
};
