
import React from 'react';

interface LogoProps {
  className?: string;
  showText?: boolean;
}

const Logo: React.FC<LogoProps> = ({ className = "h-8", showText = true }) => {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Icon */}
      <svg 
        viewBox="0 0 40 40" 
        fill="none" 
        xmlns="http://www.w3.org/2000/svg" 
        className="h-full w-auto aspect-square text-blue-600 dark:text-blue-500"
      >
        <path 
          d="M34 20C34 27.732 27.732 34 20 34C12.268 34 6 27.732 6 20C6 12.268 12.268 6 20 6C27.732 6 34 12.268 34 20Z" 
          className="fill-current opacity-20"
        />
        <path 
          d="M20 0C8.95431 0 0 8.95431 0 20C0 31.0457 8.95431 40 20 40C31.0457 40 40 31.0457 40 20C40 8.95431 31.0457 0 20 0ZM20 36C11.1634 36 4 28.8366 4 20C4 11.1634 11.1634 4 20 4C28.8366 4 36 11.1634 36 20C36 28.8366 28.8366 36 20 36Z" 
          className="fill-current"
        />
        <path 
          d="M16 12.5L28 20L16 27.5V12.5Z" 
          className="fill-current"
        />
      </svg>
      
      {/* Text */}
      {showText && (
        <span className="font-extrabold tracking-tight text-slate-900 dark:text-white text-xl">
          Disparai
        </span>
      )}
    </div>
  );
};

export default Logo;
