
import React, { useState } from 'react';
import { 
  MessageCircle, User, Lock, ArrowRight, 
  CheckCircle, Loader2, Server, Shield
} from 'lucide-react';
import { User as UserType } from '../types';

interface RegisterProps {
  onRegister: (user: UserType) => void;
  onNavigateToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onNavigateToLogin }) => {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Form Data
  const [formData, setFormData] = useState({
    name: '',
    password: '',
    confirmPassword: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
        alert("As senhas não coincidem.");
        return;
    }

    setLoading(true);
    // Simulate setup delay
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    
    // Create Admin User
    onRegister({
        id: 'admin-enterprise',
        name: formData.name,
        email: 'admin@enterprise.com',
        role: 'manager',
        avatar: `https://ui-avatars.com/api/?name=${formData.name.replace(' ','+')}&background=0f172a&color=fff`,
        hasProFeatures: true
    });
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-blue-600 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-600 rounded-full blur-[100px]"></div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-lg overflow-hidden relative z-10 animate-in slide-in-from-bottom-4 duration-500">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-center border-b border-slate-700">
            <div className="inline-flex items-center justify-center p-3 bg-blue-600/20 rounded-2xl mb-4">
                <Server size={32} className="text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-white">Configuração Inicial</h2>
            <p className="text-slate-400 mt-2 text-sm">
                Bem-vindo à sua instância Enterprise dedicada. <br/>Configure o acesso administrativo.
            </p>
        </div>

        <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
                
                <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-4 flex items-center gap-3">
                    <Shield className="text-blue-600 dark:text-blue-400 shrink-0" size={20} />
                    <div>
                        <p className="text-xs font-bold text-blue-800 dark:text-blue-200 uppercase">Licença Ativa</p>
                        <p className="text-sm text-blue-600 dark:text-blue-300">Enterprise - 30 Usuários</p>
                    </div>
                    <CheckCircle className="text-green-500 ml-auto" size={20} />
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Nome do Administrador</label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            required
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Ex: João Silva"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Senha Admin</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="******"
                                value={formData.password}
                                onChange={e => setFormData({...formData, password: e.target.value})}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Confirmar</label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="password" 
                                required
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 dark:text-white rounded-lg outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                placeholder="******"
                                value={formData.confirmPassword}
                                onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                <button 
                    type="submit"
                    disabled={loading || !formData.name || !formData.password}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <>Inicializar Sistema <ArrowRight size={18} /></>}
                </button>

                <p className="text-center text-xs text-slate-500 mt-4">
                    Já configurou? <button type="button" onClick={onNavigateToLogin} className="text-blue-500 hover:underline">Ir para Login</button>
                </p>
            </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
