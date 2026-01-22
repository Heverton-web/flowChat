
import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'default' | 'danger' | 'success' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  footer?: React.ReactNode;
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, type = 'default', size = 'md', footer, zIndex = 50 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const getHeaderIcon = () => {
    switch (type) {
      case 'danger': return <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600 border border-red-200 dark:border-red-800"><AlertTriangle size={20} /></div>;
      case 'success': return <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600 border border-green-200 dark:border-green-800"><CheckCircle size={20} /></div>;
      case 'info': return <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600 border border-blue-200 dark:border-blue-800"><Info size={20} /></div>;
      default: return null;
    }
  };

  const sizeClasses = {
    sm: 'max-w-md',      // 448px
    md: 'max-w-lg',      // 512px (Default)
    lg: 'max-w-2xl',     // 672px (Wider)
    xl: 'max-w-4xl',     // 896px
    '2xl': 'max-w-6xl',  // 1152px
    full: 'max-w-[95vw]'
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 transition-all duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
      style={{ zIndex }}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop with stronger blur */}
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity duration-300" 
        onClick={onClose}
      ></div>

      {/* Modal Content with sleek animation & Scroll Fix */}
      <div 
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden relative z-10 transform transition-all duration-300 cubic-bezier(0.16, 1, 0.3, 1) border border-slate-200 dark:border-slate-700 flex flex-col max-h-[90vh] ${isOpen ? 'scale-100 translate-y-0 opacity-100' : 'scale-95 translate-y-4 opacity-0'}`}
      >
        {/* Fixed Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              {getHeaderIcon()}
              <div>
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white leading-tight">{title}</h3>
                  {type === 'default' && <div className="h-1 w-8 bg-blue-600 rounded-full mt-1"></div>}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto flex-1 text-slate-600 dark:text-slate-300 custom-scrollbar">
          {children}
        </div>

        {/* Fixed Footer */}
        {footer && (
          <div className="bg-slate-50 dark:bg-slate-900/50 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3 flex-shrink-0">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
