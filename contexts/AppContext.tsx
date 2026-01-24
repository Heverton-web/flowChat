
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CheckCircle, AlertCircle, X, Info } from 'lucide-react';
import { Language, translations } from '../translations';
import { getSystemConfig, BrandingConfig } from '../services/configService';

type Theme = 'light' | 'dark';
type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface AppContextType {
  theme: Theme;
  language: Language;
  branding: BrandingConfig;
  toggleTheme: () => void;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof translations['pt-BR']) => string;
  showToast: (message: string, type?: ToastType) => void;
  refreshBranding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Helper para converter Hex para RGB (para uso no Tailwind com opacidade)
const hexToRgb = (hex: string) => {
    let c: any;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return `${(c>>16)&255} ${(c>>8)&255} ${c&255}`;
    }
    return '59 130 246'; // Default fallback
}

// Helper para gerar paleta (simplificada)
// Na prática, apenas mudamos a matiz principal, mantendo a luminosidade padrão do Tailwind
const applyThemeColors = (primaryHex: string) => {
    const root = document.documentElement;
    const rgb = hexToRgb(primaryHex);
    
    // Define a cor primária base (usada pelo Tailwind configurado no index.html)
    // Estamos sobrescrevendo o que seria o "blue-600" padrão
    root.style.setProperty('--color-primary-500', rgb);
    
    // Para simplificar, usamos a mesma base RGB para todos, mas em um sistema real
    // calcularíamos a luminosidade para 50, 100, etc.
    // Aqui confiamos que o Tailwind usará a opacidade ou o mix-blend se configurado,
    // ou simplesmente aceitamos que o White Label muda o tom principal.
    // Uma abordagem melhor é setar variáveis específicas se tivermos o algoritmo de lighten/darken.
    
    // Fallback simples: setar a variável global que o index.html vai ler
    root.style.setProperty('--primary-rgb', rgb);
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Initialize Theme
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('flowchat_theme');
    if (saved === 'dark' || saved === 'light') return saved;
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  // Initialize Language
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('flowchat_lang');
    if (saved === 'pt-BR' || saved === 'pt-PT' || saved === 'en-US' || saved === 'es-ES') return saved;
    return 'pt-BR';
  });

  // Branding State
  const [branding, setBranding] = useState<BrandingConfig>(getSystemConfig().branding);

  // Toast State
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Apply Theme Side Effects
  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('flowchat_theme', theme);
  }, [theme]);

  // Persist Language
  useEffect(() => {
    localStorage.setItem('flowchat_lang', language);
  }, [language]);

  // Apply Branding Colors & Favicon
  useEffect(() => {
      applyThemeColors(branding.primaryColor);
      
      // Update Title
      document.title = branding.appName;
      
      // Update Favicon dynamically
      if (branding.faviconUrl) {
          const link = document.querySelector("link[rel*='icon']") || document.createElement('link');
          (link as any).type = 'image/x-icon';
          (link as any).rel = 'shortcut icon';
          (link as any).href = branding.faviconUrl;
          document.getElementsByTagName('head')[0].appendChild(link);
      }
  }, [branding]);

  // Listen for config changes from God Mode
  useEffect(() => {
      const handleConfigUpdate = () => {
          setBranding(getSystemConfig().branding);
      };
      window.addEventListener('flowchat_config_updated', handleConfigUpdate);
      return () => window.removeEventListener('flowchat_config_updated', handleConfigUpdate);
  }, []);

  const refreshBranding = () => {
      setBranding(getSystemConfig().branding);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const t = (key: keyof typeof translations['pt-BR']) => {
    return translations[language][key] || key;
  };

  const showToast = (message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  return (
    <AppContext.Provider value={{ theme, language, branding, toggleTheme, setLanguage, t, showToast, refreshBranding }}>
      {children}
      
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border animate-in slide-in-from-right-full transition-all max-w-sm ${
              toast.type === 'success' ? 'bg-white dark:bg-slate-800 border-green-500 text-green-700 dark:text-green-400' :
              toast.type === 'error' ? 'bg-white dark:bg-slate-800 border-red-500 text-red-700 dark:text-red-400' :
              'bg-white dark:bg-slate-800 border-blue-500 text-blue-700 dark:text-blue-400' // Dynamic blue handled by CSS variables implicitly if using primary class, but here hardcoded classes might need check.
            }`}
            // Note: For toast specifically, we kept hardcoded colors for semantic meaning (green=success, red=error). 
            // The default info toast uses blue, which will naturally align if we change blue definition in index.html.
          >
            {toast.type === 'success' && <CheckCircle size={20} className="shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={20} className="shrink-0" />}
            {toast.type === 'info' && <Info size={20} className="shrink-0" />}
            
            <p className="text-sm font-medium text-slate-800 dark:text-white">{toast.message}</p>
            
            <button onClick={() => removeToast(toast.id)} className="ml-auto text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
