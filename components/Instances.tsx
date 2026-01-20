
import React, { useState, useEffect } from 'react';
import { Plus, RefreshCw, Trash2, QrCode, Smartphone, X, Loader2, CheckCircle } from 'lucide-react';
import { Instance, User, LicenseStatus } from '../types';
import * as evolutionService from '../services/evolutionService';
import * as financialService from '../services/financialService';
import { useApp } from '../contexts/AppContext';
import Modal from './Modal';

interface InstancesProps {
  currentUser: User;
}

const Instances: React.FC<InstancesProps> = ({ currentUser }) => {
  const { t, showToast } = useApp();
  const [instances, setInstances] = useState<Instance[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Creation States
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  
  // Connection Wizard States
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'loading' | 'qr' | 'scanning' | 'success'>('loading');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  
  // Deletion States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);

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
      showToast('Erro ao carregar instâncias', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleCreate = async () => {
    if (!newInstanceName.trim()) return;
    setIsSubmittingCreate(true);

    try {
      await evolutionService.createInstance(newInstanceName, currentUser.id, currentUser.name);
      setNewInstanceName('');
      setIsCreating(false);
      showToast('Instância criada! Conecte seu WhatsApp agora.', 'success');
      loadData();
    } catch (e: any) {
      showToast(e.message || t('error_create_limit'), 'error');
    } finally {
      setIsSubmittingCreate(false);
    }
  };

  const requestDelete = (instance: Instance) => {
    if (instance.ownerId !== currentUser.id && currentUser.role !== 'manager') {
        showToast('Ação não permitida.', 'error');
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
        showToast('Instância excluída com sucesso.', 'success');
        loadData();
    } catch (error) {
        showToast('Erro ao excluir instância', 'error');
    } finally {
        setIsDeleting(false);
    }
  };

  const startConnectionFlow = async (instance: Instance) => {
    const isOwner = instance.ownerId === currentUser.id;
    if (!isOwner) {
      showToast('Apenas o dono da instância pode visualizar o QR Code.', 'error');
      return;
    }
    
    setSelectedInstanceId(instance.id);
    setConnectionModalOpen(true);
    setConnectionStep('loading');
    setQrCodeData(null);

    // Step 1: Request Session (Mock)
    try {
        const qr = await evolutionService.getInstanceQRCode(instance.id);
        setQrCodeData(qr);
        setConnectionStep('qr');
        
        // Start Mock Scanner Simulation after 2s of displaying QR
        setTimeout(() => {
            if (connectionModalOpen) { 
                setConnectionStep('scanning');
                // Simulate "Reading..." for 5s then Success
                setTimeout(async () => {
                    await evolutionService.connectInstance(instance.id);
                    setConnectionStep('success');
                    showToast('Dispositivo pareado com sucesso!', 'success');
                    // Close automatically after 2s
                    setTimeout(() => {
                        setConnectionModalOpen(false);
                        loadData();
                    }, 2000);
                }, 5000);
            }
        }, 4000);

    } catch (e) {
        setConnectionModalOpen(false);
        showToast('Erro ao gerar QR Code', 'error');
    }
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
          <div className="flex gap-4">
            <input 
              type="text" 
              value={newInstanceName}
              onChange={(e) => setNewInstanceName(e.target.value)}
              placeholder={t('instance_name_placeholder')}
              disabled={isSubmittingCreate}
              className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
            <button 
                onClick={handleCreate} 
                disabled={isSubmittingCreate || !newInstanceName}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
            >
              {isSubmittingCreate && <Loader2 className="animate-spin" size={16} />}
              {t('create')}
            </button>
            <button onClick={() => setIsCreating(false)} className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-6 py-2 rounded-lg font-medium hover:bg-slate-200 dark:hover:bg-slate-600">
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
                    <div className={`p-3 rounded-full ${instance.status === 'connected' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                        <Smartphone size={24} />
                    </div>
                    
                    <div className="flex gap-2">
                        {isOwner && instance.status !== 'connected' ? (
                            <button 
                                onClick={() => startConnectionFlow(instance)}
                                className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors flex items-center gap-2" title={t('scan_qr')}>
                                <QrCode size={18} /> <span className="text-xs font-bold uppercase hidden md:inline">Conectar</span>
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
                            'text-amber-600 dark:text-amber-400'
                        }`}>
                            {instance.status === 'connected' ? t('connected') : t('disconnected')}
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
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Excluir Instância?" 
        type="danger"
        footer={
            <>
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Cancelar</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                    {isDeleting && <Loader2 className="animate-spin" size={16}/>} Sim, Excluir
                </button>
            </>
        }
      >
        <p>Você está prestes a excluir a instância <strong>{instanceToDelete?.name}</strong>. Isso desconectará o WhatsApp e é uma ação irreversível.</p>
      </Modal>

      {/* Connection Wizard Modal */}
      {connectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative transition-colors animate-in zoom-in-95">
            <button onClick={() => setConnectionModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X size={24}/></button>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('connect_whatsapp')}</h3>
            
            <div className="h-64 flex flex-col items-center justify-center mb-4">
                {connectionStep === 'loading' && (
                    <div className="text-center space-y-4">
                        <Loader2 className="animate-spin text-blue-600 mx-auto" size={48} />
                        <p className="text-slate-500 font-medium">Solicitando sessão ao WhatsApp...</p>
                    </div>
                )}

                {connectionStep === 'qr' && qrCodeData && (
                    <div className="animate-in fade-in space-y-4">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">{t('scan_instruction')}</p>
                        <div className="bg-white p-2 rounded-xl shadow-inner border border-slate-200 inline-block">
                            <img src={qrCodeData} alt="QR Code" className="w-56 h-56 object-contain" />
                        </div>
                    </div>
                )}

                {connectionStep === 'scanning' && (
                    <div className="text-center space-y-4 animate-in fade-in">
                        <div className="relative w-20 h-20 mx-auto">
                            <Smartphone className="w-full h-full text-slate-300" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Loader2 className="animate-spin text-green-500" size={32} />
                            </div>
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 font-bold">Lendo QR Code...</p>
                        <p className="text-slate-400 text-sm">Mantenha o celular conectado.</p>
                    </div>
                )}

                {connectionStep === 'success' && (
                    <div className="text-center space-y-4 animate-in zoom-in">
                        <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400">
                            <CheckCircle size={40} />
                        </div>
                        <p className="text-green-600 dark:text-green-400 font-bold text-lg">Conectado com Sucesso!</p>
                    </div>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Instances;
