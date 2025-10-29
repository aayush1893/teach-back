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
    style: 'bg-green-50 border-green-400 text-green-800',
  },
  error: {
    icon: <XIcon className="w-6 h-6 text-red-500" />,
    style: 'bg-red-50 border-red-400 text-red-800',
  },
  info: {
    icon: <DisclaimerIcon className="w-6 h-6 text-blue-500" />,
    style: 'bg-blue-50 border-blue-400 text-blue-800',
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
    <div className="fixed top-5 right-5 z-[100] max-w-sm w-full">
        <div className={`relative w-full p-4 border-l-4 rounded-md shadow-lg flex items-start ${config.style}`} role="alert">
            <div className="flex-shrink-0">
                {config.icon}
            </div>
            <div className="ml-3 flex-grow">
                <p className="text-sm font-medium">{message}</p>
            </div>
            <button onClick={onClose} className="ml-4 -mt-1 -mr-1 p-1 rounded-md hover:bg-gray-200" aria-label="Close notification">
                <XIcon className="w-4 h-4" />
            </button>
        </div>
    </div>
  );
};

export default Toast;
