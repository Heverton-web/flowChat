
import React, { useState, useEffect } from 'react';
import { Crown, Info, Users, Smartphone, Server, Plus, CreditCard, Loader2 } from 'lucide-react';
import { LicenseStatus } from '../types';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

const Subscription: React.FC = () => {
  const { showToast } = useApp();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  useEffect(() => {
    loadLicense();
  }, []);

  const loadLicense = async () => {
    setLoading(true);
    try {
        const data = await financialService.getLicenseStatus();
        setLicenseStatus(data);
    } catch (error) {
        console.error("Failed to load license", error);
    } finally {
        setLoading(false);
    }
  };

  const handleContactSales = () => {
      window.open('https://wa.me/5511999999999?text=Olá,%20gostaria%20de%20falar%20sobre%20expansão%20da%20minha%20licença%20Enterprise.', '_blank');
  };

  const confirmAddSeat = async () => {
      setIsUpgrading(true);
      await financialService.requestAddonSeat(1);
      await loadLicense();
      setIsUpgrading(false);
      setConfirmModalOpen(false);
      showToast('Solicitação enviada com sucesso!', 'success');
  };

  if (loading || !licenseStatus) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-blue-600" size={32} /></div>;

  const { license, usage, totalSeats } = licenseStatus;
  const renewalDateObj = new Date(license.renewalDate);
  const calculateProgress = (current: number, max: number) => {
      if (max === 0) return 100;
      return Math.min(100, (current / max) * 100);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4">
      {/* ... Header and Cards UI same as before ... */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold dark:text-white">Assinatura</h2>
        <div className="flex gap-2">
            <button onClick={() => setConfirmModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2">
                <Plus size={16}/> Solicitar +1 Seat
            </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-2xl p-8 text-white relative overflow-hidden">
          <div className="relative z-10">
              <h3 className="text-3xl font-bold mb-2">Licença {license.tier}</h3>
              <p className="text-slate-300">Renovação: {renewalDateObj.toLocaleDateString()}</p>
          </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700">
              <h4 className="font-bold dark:text-white mb-4">Utilização de Seats</h4>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 mb-2">
                  <div className="bg-indigo-600 h-full rounded-full" style={{width: `${calculateProgress(usage.usedSeats, totalSeats)}%`}}></div>
              </div>
              <p className="text-right text-sm text-slate-500">{usage.usedSeats} / {totalSeats}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border dark:border-slate-700">
              <h4 className="font-bold dark:text-white mb-4">Utilização de Instâncias</h4>
              <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-4 mb-2">
                  <div className="bg-emerald-500 h-full rounded-full" style={{width: `${calculateProgress(usage.usedInstances, totalSeats)}%`}}></div>
              </div>
              <p className="text-right text-sm text-slate-500">{usage.usedInstances} / {totalSeats}</p>
          </div>
      </div>

      <Modal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        title="Solicitar Seat Adicional?"
        type="info"
        footer={
            <>
                <button onClick={() => setConfirmModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg">Cancelar</button>
                <button onClick={confirmAddSeat} disabled={isUpgrading} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
                    {isUpgrading && <Loader2 className="animate-spin" size={16}/>} Confirmar (R$ 150/mês)
                </button>
            </>
        }
      >
          <p>Deseja adicionar <strong>+1 Seat</strong> (Usuário + Instância) à sua licença Enterprise? O valor será adicionado à sua próxima fatura.</p>
      </Modal>
    </div>
  );
};

export default Subscription;
