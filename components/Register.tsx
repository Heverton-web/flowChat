
import React, { useState } from 'react';
import { 
  MessageCircle, User, Mail, Lock, Building, ArrowRight, ArrowLeft, 
  CheckCircle, CreditCard, Package, Users, Shield, Loader2, Briefcase, Zap, Plus, Minus, BookUser, Crown, Info
} from 'lucide-react';
import { User as UserType } from '../types';

interface RegisterProps {
  onRegister: (user: UserType) => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    company: '',
    password: '',
  });

  // Plan Configuration State
  const [teamSize, setTeamSize] = useState(2);
  const [extraMsgPacks, setExtraMsgPacks] = useState(0);
  const [extraContactPacks, setExtraContactPacks] = useState(0);
  const [isPremium, setIsPremium] = useState(false);

  // Constants
  const PRICE_PER_USER = 39.90;
  const PRICE_MSG_PACK = 9.90;
  const PRICE_CONTACT_PACK = 7.90;
  const PRICE_PREMIUM_FEE = 49.90; // Flat fee for the account

  const BASE_MESSAGES = 1000;
  const BASE_CONTACTS = 500;
  const MSG_PACK_SIZE = 1000;
  const CONTACT_PACK_SIZE = 500;

  // Computed Totals
  const costUsers = teamSize * PRICE_PER_USER;
  const costMsgPacks = extraMsgPacks * PRICE_MSG_PACK;
  const costContactPacks = extraContactPacks * PRICE_CONTACT_PACK;
  const costPremium = isPremium ? PRICE_PREMIUM_FEE : 0;
  
  const totalMonthly = costUsers + costMsgPacks + costContactPacks + costPremium;

  // Distribution Logic
  const totalExtraMsgs = extraMsgPacks * MSG_PACK_SIZE;
  const totalExtraContacts = extraContactPacks * CONTACT_PACK_SIZE;
  
  const msgsPerUser = BASE_MESSAGES + Math.floor(totalExtraMsgs / teamSize);
  const contactsPerUser = BASE_CONTACTS + Math.floor(totalExtraContacts / teamSize);

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleSubmit = async () => {
    setLoading(true);
    // Simulate API Call
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    
    // Login User
    onRegister({
        id: 'new-manager-' + Math.random(),
        name: formData.name,
        email: formData.email,
        role: 'manager',
        avatar: `https://ui-avatars.com/api/?name=${formData.name.replace(' ','+')}&background=0D8ABC&color=fff`,
        hasProFeatures: isPremium
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-6xl overflow-hidden flex flex-col lg:flex-row min-h-[700px] animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Left Side - Wizard */}
        <div className="flex-1 p-8 lg:p-12 flex flex-col">
          <div className="mb-8">
            <div className="flex items-center gap-2 text-blue-600 mb-2">
                <MessageCircle size={24} fill="currentColor" />
                <span className="font-bold text-lg tracking-tight">FlowChat</span>
            </div>
            <h2 className="text-3xl font-bold text-slate-800">
                {step === 1 ? 'Crie sua conta' : step === 2 ? 'Configure seu Plano' : 'Pagamento'}
            </h2>
            <p className="text-slate-500 mt-2">
                {step === 1 ? 'Comece a gerenciar suas operações de WhatsApp hoje.' : 
                 step === 2 ? 'Defina o tamanho da equipe e recursos necessários.' : 
                 'Finalize para acessar o painel.'}
            </p>
          </div>

          {/* Steps Indicator */}
          <div className="flex items-center gap-2 mb-8">
            {[1, 2, 3].map(i => (
                <div key={i} className={`h-2 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-600' : 'bg-slate-200'}`} />
            ))}
          </div>

          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {/* STEP 1: ACCOUNT DATA */}
            {step === 1 && (
                <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Nome Completo</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                                    placeholder="Seu nome"
                                    value={formData.name}
                                    onChange={e => setFormData({...formData, name: e.target.value})}
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-slate-600 uppercase">Nome da Empresa</label>
                            <div className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                <input 
                                    type="text" 
                                    className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                                    placeholder="Sua empresa"
                                    value={formData.company}
                                    onChange={e => setFormData({...formData, company: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Email Corporativo</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="email" 
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                                placeholder="nome@empresa.com"
                                value={formData.email}
                                onChange={e => setFormData({...formData, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-600 uppercase">Senha</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50 focus:bg-white transition-all"
                                placeholder="Criar senha segura"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 2: PLAN CONFIG */}
            {step === 2 && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    
                    {/* 1. Team Size */}
                    <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between mb-2">
                            <div>
                                <h3 className="font-bold text-slate-800 text-lg flex items-center gap-2">
                                    <Users size={20} className="text-blue-600"/> Tamanho da Equipe
                                </h3>
                                <p className="text-slate-500 text-sm">Incluindo você (Gestor) e atendentes.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white p-1.5 rounded-lg border border-slate-200 shadow-sm">
                                <button 
                                    onClick={() => setTeamSize(Math.max(2, teamSize - 1))}
                                    className="w-10 h-10 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold transition-colors flex items-center justify-center disabled:opacity-50"
                                    disabled={teamSize <= 2}
                                >
                                    <Minus size={18} />
                                </button>
                                <div className="text-center min-w-[3rem]">
                                    <span className="block text-2xl font-bold text-slate-800">{teamSize}</span>
                                </div>
                                <button 
                                    onClick={() => setTeamSize(teamSize + 1)}
                                    className="w-10 h-10 rounded-md bg-blue-600 hover:bg-blue-500 text-white font-bold transition-colors flex items-center justify-center"
                                >
                                    <Plus size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex items-center gap-2 text-xs text-blue-800 mt-2">
                            <Info size={14} />
                            Cada usuário recebe {BASE_MESSAGES.toLocaleString()} envios e {BASE_CONTACTS} contatos base.
                        </div>
                    </div>

                    {/* 2. Extra Packs */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                            <Package size={16} /> Pacotes Adicionais (Global)
                        </h4>
                        
                        {/* Messages */}
                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <span className="block font-bold text-slate-800">Pacotes de Envios (+1.000 un)</span>
                                    <span className="text-xs text-blue-600 font-bold">R$ 9,90 / pacote</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setExtraMsgPacks(Math.max(0, extraMsgPacks - 1))}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${extraMsgPacks === 0 ? 'text-slate-300 border-slate-200' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-lg font-bold w-6 text-center">{extraMsgPacks}</span>
                                    <button 
                                        onClick={() => setExtraMsgPacks(extraMsgPacks + 1)}
                                        className="w-8 h-8 rounded-full bg-blue-50 text-blue-600 border border-blue-200 hover:bg-blue-100 flex items-center justify-center transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 flex justify-between items-center">
                                <span>Total Extra: <strong>{totalExtraMsgs.toLocaleString()}</strong> envios</span>
                                <span className="bg-white px-2 py-1 rounded border border-slate-200 text-blue-600 font-bold">
                                    +{Math.floor(totalExtraMsgs / teamSize).toLocaleString()} por usuário
                                </span>
                            </div>
                        </div>

                        {/* Contacts */}
                        <div className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:border-indigo-300 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <span className="block font-bold text-slate-800">Pacotes de Contatos (+500 un)</span>
                                    <span className="text-xs text-indigo-600 font-bold">R$ 7,90 / pacote</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <button 
                                        onClick={() => setExtraContactPacks(Math.max(0, extraContactPacks - 1))}
                                        className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors border ${extraContactPacks === 0 ? 'text-slate-300 border-slate-200' : 'text-slate-600 border-slate-300 hover:bg-slate-50'}`}
                                    >
                                        <Minus size={14} />
                                    </button>
                                    <span className="text-lg font-bold w-6 text-center">{extraContactPacks}</span>
                                    <button 
                                        onClick={() => setExtraContactPacks(extraContactPacks + 1)}
                                        className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-200 hover:bg-indigo-100 flex items-center justify-center transition-colors"
                                    >
                                        <Plus size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="bg-slate-50 rounded-lg p-2 text-xs text-slate-600 flex justify-between items-center">
                                <span>Total Extra: <strong>{totalExtraContacts.toLocaleString()}</strong> contatos</span>
                                <span className="bg-white px-2 py-1 rounded border border-slate-200 text-indigo-600 font-bold">
                                    +{Math.floor(totalExtraContacts / teamSize).toLocaleString()} por usuário
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. Premium Resources */}
                    <div 
                        className={`relative p-1 rounded-2xl transition-all duration-300 ${isPremium ? 'bg-gradient-to-r from-amber-300 via-yellow-500 to-amber-300 p-[2px]' : 'bg-slate-200'}`}
                    >
                        <div className="bg-white rounded-xl p-5 relative overflow-hidden">
                            <div className="flex justify-between items-start">
                                <div className="flex gap-4">
                                    <div className={`p-3 rounded-xl ${isPremium ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-400'}`}>
                                        <Crown size={32} fill={isPremium ? "currentColor" : "none"} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">Pacote de Recursos Premium</h3>
                                        <p className="text-sm text-slate-500 max-w-sm">
                                            Libere envios de <strong>Áudio, Imagem, Vídeo, Documentos e Enquetes</strong> nas campanhas.
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className={`text-xl font-bold ${isPremium ? 'text-amber-600' : 'text-slate-400'}`}>R$ {PRICE_PREMIUM_FEE.toFixed(2).replace('.', ',')}</div>
                                    <span className="text-xs text-slate-400 uppercase font-bold">Valor fixo mensal</span>
                                </div>
                            </div>
                            
                            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-between items-center">
                                <div className="flex gap-2">
                                    {['Áudio', 'Vídeo', 'Enquetes', 'Docs'].map(feat => (
                                        <span key={feat} className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${isPremium ? 'bg-amber-50 text-amber-700 border border-amber-100' : 'bg-slate-50 text-slate-400'}`}>
                                            {feat}
                                        </span>
                                    ))}
                                </div>
                                <label className="flex items-center gap-3 cursor-pointer select-none">
                                    <span className={`text-sm font-bold ${isPremium ? 'text-slate-800' : 'text-slate-400'}`}>
                                        {isPremium ? 'ATIVADO' : 'Adicionar ao plano'}
                                    </span>
                                    <div className={`w-12 h-7 rounded-full p-1 transition-colors duration-300 ${isPremium ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                        <div className={`w-5 h-5 bg-white rounded-full shadow-md transform transition-transform duration-300 ${isPremium ? 'translate-x-5' : ''}`}></div>
                                    </div>
                                    <input type="checkbox" className="hidden" checked={isPremium} onChange={e => setIsPremium(e.target.checked)} />
                                </label>
                            </div>
                        </div>
                    </div>

                </div>
            )}

            {/* STEP 3: PAYMENT */}
            {step === 3 && (
                <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex items-start gap-3">
                        <Shield className="text-blue-600 shrink-0" size={20} />
                        <div className="text-sm text-blue-800">
                            <p className="font-bold">Pagamento Seguro</p>
                            <p>Seus dados são criptografados. A cobrança é recorrente mensalmente.</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder="Número do Cartão"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <input 
                                type="text" 
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder="MM/AA"
                            />
                            <input 
                                type="text" 
                                className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                placeholder="CVC"
                            />
                        </div>
                        <input 
                            type="text" 
                            className="w-full px-4 py-3 border border-slate-300 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                            placeholder="Nome no Cartão"
                        />
                    </div>
                </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-8 flex gap-3">
            {step > 1 && (
                <button 
                    onClick={handleBack}
                    className="px-6 py-3 rounded-xl border border-slate-300 text-slate-600 font-bold hover:bg-slate-50 transition-colors flex items-center gap-2"
                >
                    <ArrowLeft size={18} /> Voltar
                </button>
            )}
            
            {step < 3 ? (
                 <button 
                    onClick={handleNext}
                    disabled={step === 1 && (!formData.name || !formData.email || !formData.password)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Continuar <ArrowRight size={18} />
                </button>
            ) : (
                <button 
                    onClick={handleSubmit}
                    disabled={loading}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-green-600/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Finalizar e Acessar'}
                </button>
            )}
          </div>
          
          {step === 1 && (
              <p className="mt-6 text-center text-sm text-slate-500">
                  Já tem uma conta? <button onClick={onNavigateToLogin} className="text-blue-600 font-bold hover:underline">Fazer login</button>
              </p>
          )}

        </div>

        {/* Right Side - Summary */}
        <div className="w-full lg:w-96 bg-slate-900 text-slate-300 p-8 lg:p-12 flex flex-col justify-between shrink-0">
            <div>
                <h3 className="text-white text-xl font-bold mb-6 flex items-center gap-2">
                    <Briefcase className="text-blue-400" /> Resumo do Plano
                </h3>
                
                <div className="space-y-4 mb-8">
                    <div className="flex justify-between items-center py-2 border-b border-slate-800">
                        <span>Usuários ({teamSize})</span>
                        <span className="text-white font-medium">R$ {costUsers.toFixed(2).replace('.', ',')}</span>
                    </div>
                    {extraMsgPacks > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-800 text-sm">
                            <span className="text-slate-400">Pacotes Envios ({extraMsgPacks})</span>
                            <span className="text-white font-medium">R$ {costMsgPacks.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    {extraContactPacks > 0 && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-800 text-sm">
                            <span className="text-slate-400">Pacotes Contatos ({extraContactPacks})</span>
                            <span className="text-white font-medium">R$ {costContactPacks.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                    {isPremium && (
                        <div className="flex justify-between items-center py-2 border-b border-slate-800 text-sm">
                            <span className="text-amber-400 font-bold flex items-center gap-1"><Crown size={12}/> Premium</span>
                            <span className="text-white font-medium">R$ {costPremium.toFixed(2).replace('.', ',')}</span>
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-end mb-8">
                    <span className="font-bold">Total Mensal</span>
                    <span className="text-3xl font-bold text-blue-400">R$ {totalMonthly.toFixed(2).replace('.', ',')}</span>
                </div>

                <div className="bg-slate-800 rounded-xl p-4 space-y-3 text-sm">
                    <div className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-green-400 shrink-0"/>
                        <span className="text-xs">
                            <strong className="text-white text-sm">{msgsPerUser.toLocaleString()}</strong> envios/usuário
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <CheckCircle size={16} className="text-green-400 shrink-0"/>
                        <span className="text-xs">
                            <strong className="text-white text-sm">{contactsPerUser.toLocaleString()}</strong> contatos/usuário
                        </span>
                    </div>
                    {isPremium && (
                        <div className="flex items-center gap-3">
                            <CheckCircle size={16} className="text-amber-400 shrink-0"/>
                            <span className="text-xs text-amber-100">Áudios, Vídeos e Enquetes Liberados</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3">
                         <Zap size={16} className="text-blue-400 shrink-0"/>
                         <span className="text-white text-xs">Setup Imediato</span>
                    </div>
                </div>
            </div>

            <p className="text-xs text-slate-500 mt-8">
                Ao continuar, você concorda com os Termos de Serviço e Política de Privacidade da FlowChat.
            </p>
        </div>

      </div>
    </div>
  );
};

export default Register;
