import React, { useEffect } from 'react';
import { CheckIcon, XIcon, DisclaimerIcon } from './icons';

interface ToastProps {
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}

const toastConfig = {
  success: {
    icon: <CheckIcon className="w-6 h-6 text-green-500" />,
    style: 'bg-green-50 border-green-400 text-green-800 dark:bg-green-900/50 dark:border-green-700 dark:text-green-200',
  },
  error: {
    icon: <XIcon className="w-6 h-6 text-red-500" />,
    style: 'bg-red-50 border-red-400 text-red-800 dark:bg-red-900/50 dark:border-red-700 dark:text-red-200',
  },
  info: {
    icon: <DisclaimerIcon className="w-6 h-6 text-blue-500" />,
    style: 'bg-blue-50 border-blue-400 text-blue-800 dark:bg-blue-900/50 dark:border-blue-700 dark:text-blue-200',
  },
};

const Toast: React.FC<ToastProps> = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000); // Auto-dismiss after 4 seconds

    return () => clearTimeout(timer);
  }, [onClose]);
  
  const config = toastConfig[type];

  return (
    <div
      className="fixed top-5 right-5 z-[100] max-w-sm w-full"
      role="alert"
      aria-live="assertive"
    >
        <div className={`relative w-full p-4 border-l-4 rounded-md shadow-lg flex items-start ${config.style}`}>
            <div className="flex-shrink-0">
                {config.icon}
            </div>
            <div className="ml-3 flex-grow">
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 -mt-1 -mr-1 p-1 rounded-md hover:bg-white/60 dark:hover:bg-black/20" aria-label="Close notification">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
  );
};

export default Toast;