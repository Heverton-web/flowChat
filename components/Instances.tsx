
import React, { useState, useEffect } from 'react';
import { 
  Plus, RefreshCw, Trash2, QrCode, Smartphone, X, Loader2, CheckCircle, 
  Search, Filter, Battery, BatteryCharging, Signal, Power, MoreVertical, Wifi
} from 'lucide-react';
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
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'connected' | 'disconnected'>('all');

  // Creation States
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [newInstanceName, setNewInstanceName] = useState('');
  
  // Connection Wizard States
  const [connectionModalOpen, setConnectionModalOpen] = useState(false);
  const [connectionStep, setConnectionStep] = useState<'loading' | 'qr' | 'scanning' | 'success'>('loading');
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  
  // Delete States
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [instanceToDelete, setInstanceToDelete] = useState<Instance | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Restart State
  const [restartingId, setRestartingId] = useState<string | null>(null);

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
    if (instance.ownerId !== currentUser.id) {
        showToast('Apenas o dono pode excluir a instância.', 'error');
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

  const handleRestart = async (id: string) => {
      setRestartingId(id);
      // Simulate restart
      await new Promise(resolve => setTimeout(resolve, 2000));
      setRestartingId(null);
      showToast('Serviço de conexão reiniciado.', 'success');
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

    try {
        const qr = await evolutionService.getInstanceQRCode(instance.id);
        setQrCodeData(qr);
        setConnectionStep('qr');
        
        setTimeout(() => {
            if (connectionModalOpen) { 
                setConnectionStep('scanning');
                setTimeout(async () => {
                    await evolutionService.connectInstance(instance.id);
                    setConnectionStep('success');
                    showToast('Dispositivo pareado com sucesso!', 'success');
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

  const getBatteryIcon = (level?: number) => {
      if (level === undefined) return <Battery className="text-slate-300" size={16} />;
      if (level > 90) return <div className="text-green-500 flex items-center gap-1"><BatteryCharging size={16}/><span className="text-xs font-bold">{level}%</span></div>;
      if (level > 20) return <div className="text-green-500 flex items-center gap-1"><Battery size={16}/><span className="text-xs font-bold">{level}%</span></div>;
      return <div className="text-red-500 flex items-center gap-1"><Battery size={16}/><span className="text-xs font-bold">{level}%</span></div>;
  };

  const filteredInstances = instances.filter(i => {
      const matchesSearch = i.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'connected' && i.status === 'connected') ||
                            (statusFilter === 'disconnected' && i.status !== 'connected');
      return matchesSearch && matchesStatus;
  });

  const userHasInstance = instances.some(i => i.ownerId === currentUser.id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Smartphone className="text-blue-600" size={24} />
                {currentUser.role === 'manager' ? t('instances_title') : t('my_connection')}
            </h2>
            <p className="text-slate-500 dark:text-slate-400">
                {currentUser.role === 'manager' ? t('instances_subtitle') : t('my_connection_sub')}
            </p>
        </div>
        
        {licenseStatus && (
            <div className="flex items-center gap-4">
                {currentUser.role === 'manager' && (
                    <div className="flex items-center gap-2 text-sm bg-white dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
                        <span className="text-slate-500 dark:text-slate-400">Ocupação:</span>
                        <div className="flex items-center gap-1">
                            <span className={`font-bold ${licenseStatus.usage.usedInstances >= licenseStatus.totalSeats ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                {licenseStatus.usage.usedInstances}
                            </span>
                            <span className="text-slate-400">/ {licenseStatus.totalSeats}</span>
                        </div>
                    </div>
                )}

                {!userHasInstance && (
                    <button 
                        onClick={() => setIsCreating(true)}
                        disabled={licenseStatus.usage.usedInstances >= licenseStatus.totalSeats}
                        className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all shadow-md shadow-blue-600/20"
                    >
                    <Plus size={18} />
                    {t('new_instance')}
                    </button>
                )}
            </div>
        )}
      </div>

      {/* Toolbar */}
      {currentUser.role === 'manager' && !isCreating && (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
              <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input 
                      type="text" 
                      placeholder="Buscar instância..." 
                      className="w-full pl-10 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                  />
              </div>
              <div className="flex items-center gap-2 w-full md:w-auto">
                  <Filter className="text-slate-400" size={16} />
                  <select 
                      className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-sm rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500"
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                  >
                      <option value="all">Todos os Status</option>
                      <option value="connected">Conectados</option>
                      <option value="disconnected">Desconectados</option>
                  </select>
                  <button onClick={loadData} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-700 rounded-lg transition-colors ml-auto md:ml-0">
                      <RefreshCw size={18} />
                  </button>
              </div>
          </div>
      )}

      {/* Creation Form */}
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
              className="flex-1 border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-colors"
            />
            <button 
                onClick={handleCreate} 
                disabled={isSubmittingCreate || !newInstanceName}
                className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-green-600/20"
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

      {/* Instances Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
            <div className="col-span-full flex justify-center py-20">
                <RefreshCw className="animate-spin text-blue-600" size={32} />
            </div>
        ) : filteredInstances.length === 0 && !isCreating ? (
            <div className="col-span-full text-center py-20 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Smartphone size={32} className="text-slate-400" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-white">Nenhuma Instância Encontrada</h3>
                <p className="text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-2">
                    {currentUser.role === 'manager' 
                        ? 'Crie instâncias ou aguarde sua equipe conectar seus números.' 
                        : 'Crie sua instância para começar a usar o sistema.'}
                </p>
                {currentUser.role === 'agent' && !userHasInstance && (
                    <button onClick={() => setIsCreating(true)} className="mt-6 text-blue-600 font-bold hover:underline">Criar Agora</button>
                )}
            </div>
        ) : filteredInstances.map(instance => {
            const isOwner = instance.ownerId === currentUser.id;
            const isConnected = instance.status === 'connected';
            const isRestarting = restartingId === instance.id;
            
            return (
              <div key={instance.id} className={`group bg-white dark:bg-slate-800 rounded-2xl border shadow-sm overflow-hidden flex flex-col transition-all relative ${isOwner ? 'border-blue-200 dark:border-blue-900 ring-1 ring-blue-100 dark:ring-blue-900/30' : 'border-slate-200 dark:border-slate-700'}`}>
                
                {/* Header */}
                <div className="p-5 pb-4">
                    <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${isConnected ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400'}`}>
                                <Smartphone size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">{instance.name}</h3>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border ${
                                        isOwner 
                                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 border-blue-100 dark:border-blue-800' 
                                        : 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 border-slate-200 dark:border-slate-600'
                                    }`}>
                                        {isOwner ? t('my_instance') : 'Equipe'}
                                    </span>
                                    {!isOwner && <span className="text-xs text-slate-400 truncate max-w-[100px]">{instance.ownerName}</span>}
                                </div>
                            </div>
                        </div>
                        {isOwner && (
                            <div className="relative">
                                <button 
                                    onClick={() => requestDelete(instance)}
                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 my-4">
                        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${
                            isConnected 
                            ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800' 
                            : 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-800'
                        }`}>
                            {isConnected && <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>}
                            {!isConnected && <div className="w-2 h-2 rounded-full bg-amber-500"></div>}
                            {isConnected ? t('connected') : t('disconnected')}
                        </div>
                        {isConnected && (
                            <span className="text-xs font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600">
                                {instance.phone}
                            </span>
                        )}
                    </div>
                </div>

                {/* Metrics Bar */}
                <div className="px-5 py-3 bg-slate-50 dark:bg-slate-700/30 border-y border-slate-100 dark:border-slate-700 flex justify-between items-center text-xs">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1.5" title="Nível de Bateria">
                            {getBatteryIcon(isConnected ? instance.battery : undefined)}
                        </div>
                        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400" title="Qualidade do Sinal">
                            <Signal size={14} className={isConnected ? 'text-green-500' : 'text-slate-300'} />
                            <span className="font-medium">{isConnected ? 'Bom' : '-'}</span>
                        </div>
                    </div>
                    <div className="text-slate-400 font-medium">
                        ID: <span className="font-mono">{instance.id.substring(0,6)}</span>
                    </div>
                </div>

                {/* Actions Footer */}
                <div className="p-4 flex gap-2">
                    {isOwner && !isConnected && (
                        <button 
                            onClick={() => startConnectionFlow(instance)}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2"
                        >
                            <QrCode size={18} />
                            Conectar
                        </button>
                    )}
                    
                    {isOwner && isConnected && (
                        <>
                            <button 
                                onClick={() => handleRestart(instance.id)}
                                disabled={isRestarting}
                                className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2"
                            >
                                {isRestarting ? <Loader2 className="animate-spin" size={18}/> : <RefreshCw size={18} />}
                                Reiniciar
                            </button>
                            <button 
                                className="px-3 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-all flex items-center justify-center"
                                title="Desconectar"
                                onClick={() => requestDelete(instance)} // Reusing delete for logic simplification
                            >
                                <Power size={18} />
                            </button>
                        </>
                    )}

                    {!isOwner && (
                        <div className="flex-1 text-center py-2 text-xs text-slate-400 italic">
                            Gerenciado por {instance.ownerName}
                        </div>
                    )}
                </div>
              </div>
            );
        })}
      </div>

      {/* Delete Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)} 
        title="Desconectar Instância?" 
        type="danger"
        footer={
            <>
                <button onClick={() => setIsDeleteModalOpen(false)} className="px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg">Cancelar</button>
                <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2">
                    {isDeleting && <Loader2 className="animate-spin" size={16}/>} Sim, Desconectar
                </button>
            </>
        }
      >
        <p>Você está prestes a remover a instância <strong>{instanceToDelete?.name}</strong>. Isso encerrará a sessão do WhatsApp imediatamente.</p>
      </Modal>

      {/* Connection Wizard Modal */}
      {connectionModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl max-w-md w-full text-center relative transition-colors animate-in zoom-in-95 border border-slate-200 dark:border-slate-700">
            <button onClick={() => setConnectionModalOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"><X size={24}/></button>
            
            <h3 className="text-xl font-bold text-slate-800 dark:text-white mb-2">{t('connect_whatsapp')}</h3>
            
            <div className="h-72 flex flex-col items-center justify-center mb-4 relative">
                {connectionStep === 'loading' && (
                    <div className="text-center space-y-4">
                        <div className="relative">
                            <div className="w-16 h-16 border-4 border-slate-200 dark:border-slate-700 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
                            <Smartphone className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-400" size={24}/>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 font-medium">Iniciando sessão segura...</p>
                    </div>
                )}

                {connectionStep === 'qr' && qrCodeData && (
                    <div className="animate-in fade-in space-y-4 w-full">
                        <div className="bg-white p-3 rounded-xl shadow-inner border border-slate-200 inline-block relative group">
                            <img src={qrCodeData} alt="QR Code" className="w-56 h-56 object-contain mix-blend-multiply" />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm rounded-xl">
                                <span className="text-xs font-bold text-slate-800">Aguardando leitura...</span>
                            </div>
                        </div>
                        <p className="text-slate-500 dark:text-slate-400 text-xs px-4">
                            1. Abra o WhatsApp > Menu > Aparelhos Conectados<br/>
                            2. Toque em <strong>Conectar um aparelho</strong><br/>
                            3. Aponte a câmera para este código
                        </p>
                    </div>
                )}

                {connectionStep === 'scanning' && (
                    <div className="text-center space-y-4 animate-in fade-in">
                        <div className="relative w-24 h-24 mx-auto">
                            <Smartphone className="w-full h-full text-slate-300 dark:text-slate-600" />
                            <div className="absolute inset-0 flex items-center justify-center">
                                <Wifi className="animate-ping text-blue-500" size={32} />
                            </div>
                        </div>
                        <div>
                            <p className="text-slate-800 dark:text-white font-bold text-lg">Lendo QR Code...</p>
                            <p className="text-slate-400 text-sm">Mantenha o celular conectado à internet.</p>
                        </div>
                    </div>
                )}

                {connectionStep === 'success' && (
                    <div className="text-center space-y-4 animate-in zoom-in">
                        <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto text-green-600 dark:text-green-400 shadow-lg shadow-green-100 dark:shadow-none">
                            <CheckCircle size={48} />
                        </div>
                        <div>
                            <p className="text-green-600 dark:text-green-400 font-bold text-xl">Conectado!</p>
                            <p className="text-slate-400 text-sm">Sincronizando conversas...</p>
                        </div>
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
