
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, QrCode, Battery, Smartphone, BarChart3, Lock, AlertTriangle, X, Loader2 } from 'lucide-react';
import { Instance, User, LicenseStatus } from '../types';
import * as evolutionService from '../services/evolutionService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';

interface InstancesProps {
  currentUser: User;
}

const Instances: React.FC<InstancesProps> = ({ currentUser }) => {
  const { t } = useApp();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [data, licStatus] = await Promise.all([
          evolutionService.fetchInstances(currentUser.id, currentUser.role),
          financialService.getLicenseStatus()
      ]);
      setInstances(data);
      setLicenseStatus(licStatus);
    } catch (error) {
      console.error("Failed to load instances", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCreate = async () => {
    if (!newInstanceName.trim()) return;
    setError(null);

    // Validação de Limite de Licença
    if (licenseStatus) {
        if (licenseStatus.usage.usedInstances >= licenseStatus.totalSeats) {
            setError(`Limite de instâncias atingido (${licenseStatus.totalSeats}). Solicite mais Seats ao gestor.`);
            return;
        }
    }

    try {
      await evolutionService.createInstance(newInstanceName, currentUser.id, currentUser.name);
      setNewInstanceName('');
      setIsCreating(false);
      loadData();
    } catch (e: any) {
      setError(e.message || t('error_create_limit'));
    }
  };

  const requestDelete = (instance: Instance) => {
    if (instance.ownerId !== currentUser.id && currentUser.role !== 'manager') {
        alert('Ação não permitida.');
        return;
    }
    setInstanceToDelete(instance);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!instanceToDelete) return;
    setIsDeleting(true);
    try {
        await evolutionService.deleteInstance(instanceToDelete.id, instanceToDelete.name);
        setIsDeleteModalOpen(false);
        setInstanceToDelete(null);
        loadData();
    } catch (error) {
        alert('Erro ao excluir instância');
    } finally {
        setIsDeleting(false);
    }
  };

  const handleShowQR = async (instance: Instance) => {
    const isOwner = instance.ownerId === currentUser.id;
    if (!isOwner) {
      alert('Apenas o dono da instância pode visualizar o QR Code.');
      return;
    }
    setSelectedInstanceId(instance.id);
    setQrCodeData(null);
    const qr = await evolutionService.getInstanceQRCode(instance.id);
    setQrCodeData(qr);
  };

  const userHasInstance = instances.some(i => i.ownerId === currentUser.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
                {currentUser.role === 'manager' ? t('instances_title') : t('my_connection')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
                {currentUser.role === 'manager' ? t('instances_subtitle') : t('my_connection_sub')}
            </p>
        </div>
        
        {licenseStatus && (
            <div className="flex items-center gap-4">
                {currentUser.role === 'manager' && (
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 hidden md:inline-block">
                        Uso: <strong>{licenseStatus.usage.usedInstances}</strong> / {licenseStatus.totalSeats}
                    </span>
                )}

                {(!userHasInstance || currentUser.role === 'manager') && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        disabled={licenseStatus.usage.usedInstances >= licenseStatus.totalSeats && currentUser.role === 'manager'}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
                    >
                    <Plus size={18} />
                    {t('new_instance')}
                    </button>
                )}
            </div>
        )}
      </div>

      {isCreating && (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-blue-100 dark:border-slate-700 shadow-lg animate-in fade-in slide-in-from-top-4 transition-colors">
          <h3 className="text-lg font-semibold mb-4 text-slate-800 dark:text-white">{t('new_instance')}</h3>
          {error && <div className="mb-4 text-red-600 text-sm bg-red-50 p-2 rounded">{error}</div>}
          <div className="flex gap-4">
            <input 
              type="text" 
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              placeholder={t('instance_name_placeholder')}
              className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
            <button onClick={handleCreate} className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700">
              {t('create')}
            </button>
            <button onClick={() => { setIsCreating(false); setError(null); }} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600">
              {t('cancel')}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full flex justify-center py-20">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
            </div>
        ) : instances.length === 0 && !isCreating ? (
            <div className="col-span-full text-center py-10 text-slate-400">
                <Smartphone size={48} className="mx-auto mb-2 opacity-20" />
                <p>Nenhuma instância encontrada. Crie a sua para começar.</p>
            </div>
        ) : instances.map(instance => {
            const isOwner = instance.ownerId === currentUser.id;
            
            return (
              <div key={instance.id} className={`bg-white dark:bg-slate-800 rounded-xl border shadow-sm overflow-hidden flex flex-col transition-all ${isOwner ? 'border-blue-200 dark:border-blue-900 ring-1 ring-blue-100 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-700 opacity-90'}`}>
                <div className="p-6 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className={`p-3 rounded-full ${instance.status === 'connected' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'}`}>
                        <Smartphone size={24} />
                    </div>
                    
                    <div className="flex gap-2">
                        {isOwner && instance.status !== 'connected' ? (
                            <button 
                                onClick={() => handleShowQR(instance)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" title={t('scan_qr')}>
                                <QrCode size={18} />
                            </button>
                        ) : null}
                        
                        {isOwner || currentUser.role === 'manager' ? (
                            <button 
                                onClick={() => requestDelete(instance)}
                                className="p-2 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 hover:text-red-600 rounded-lg transition-colors" title={t('delete')}>
                                <Trash2 size={18} />
                            </button>
                        ) : null}
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">{instance.name}</h3>
                  <div className="flex items-center gap-2 mb-4 mt-1">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                          isOwner 
                          ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800' 
                          : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                      }`}>
                          {isOwner ? t('my_instance') : t('team_instance')}
                      </span>
                      {!isOwner && <span className="text-xs text-slate-400">{t('owner')}: {instance.ownerName}</span>}
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{t('status')}</span>
                        <span className={`font-medium ${
                            instance.status === 'connected' ? 'text-green-600 dark:text-green-400' : 
                            instance.status === 'connecting' ? 'text-amber-600 dark:text-amber-400' : 'text-slate-400'
                        }`}>
                            {instance.status === 'connected' ? t('connected') : 
                             instance.status === 'connecting' ? t('connecting') : t('disconnected')}
                        </span>
                    </div>
                    {instance.phone && (
                        <div className="flex justify-between text-sm">
                            <span className="text-slate-500 dark:text-slate-400">{t('phone')}</span>
                            <span className="text-slate-700 dark:text-slate-200">{instance.phone}</span>
                        </div>
                    )}
                  </div>
                </div>
              </div>
            );
        })}
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && instanceToDelete && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl max-w-sm w-full shadow-2xl animate-in zoom-in-95 transition-colors">
                <div className="p-6 text-center">
                    <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertTriangle size={32} />
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">Excluir Instância?</h3>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">
                        Você está prestes a excluir a instância <strong>{instanceToDelete.name}</strong>. 
                        Isso desconectará o WhatsApp e é uma ação irreversível.
                    </p>
                    <div className="flex gap-3">
                        <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Cancelar</button>
                        <button onClick={confirmDelete} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Sim, Excluir</button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* QR Code Modal */}
      {selectedInstanceId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative transition-colors">
            <button onClick={() => setSelectedInstanceId(null)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('connect_whatsapp')}</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-6">{t('scan_instruction')}</p>
            <div className="bg-slate-100 p-4 rounded-xl inline-block mb-4">
                {qrCodeData ? (
                    <img src={qrCodeData} alt="QR Code" className="w-64 h-64 object-contain mix-blend-multiply" />
                ) : (
                    <div className="w-64 h-64 flex items-center justify-center"><RefreshCw className="animate-spin text-blue-600" size={32} /></div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instances;
