
import React, { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  type?: 'default' | 'danger' | 'success' | 'info';
  footer?: React.ReactNode;
  zIndex?: number;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, type = 'default', footer, zIndex = 50 }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      document.body.style.overflow = 'hidden';
    } else {
      const timer = setTimeout(() => {
        setIsVisible(false);
        // Only restore scrolling if no other modals are likely open (simplistic check)
        // For nested modals, the parent should ideally manage this, but we'll reset here.
        // If we wanted to be robust we'd check for other z-50 elements.
        // For now, we accept that closing the top modal might re-enable scrolling.
        document.body.style.overflow = 'unset';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  if (!isVisible && !isOpen) return null;

  const getHeaderIcon = () => {
    switch (type) {
      case 'danger': return <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-full text-red-600"><AlertTriangle size={24} /></div>;
      case 'success': return <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full text-green-600"><CheckCircle size={24} /></div>;
      case 'info': return <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full text-blue-600"><Info size={24} /></div>;
      default: return null;
    }
  };

  return (
    <div 
      className={`fixed inset-0 flex items-center justify-center p-4 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
      style={{ zIndex }}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div 
        className={`bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative z-10 transform transition-all duration-300 ${isOpen ? 'scale-100 translate-y-0' : 'scale-95 translate-y-4'}`}
      >
        <div className="p-6">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              {getHeaderIcon()}
              <h3 className="text-xl font-bold text-slate-800 dark:text-white mt-1">{title}</h3>
            </div>
            <button 
              onClick={onClose} 
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="text-slate-600 dark:text-slate-300">
            {children}
          </div>
        </div>

        {footer && (
          <div className="bg-slate-50 dark:bg-slate-700/30 p-4 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

export default Modal;
