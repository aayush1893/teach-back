
import React from 'react';
import { HelpIcon, DisclaimerIcon } from './icons';

interface HeaderProps {
  onHelpClick: () => void;
  onDisclaimerClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHelpClick, onDisclaimerClick }) => {
  return (
    <header className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Teach-Back Engine</h1>
          <p className="text-sm text-gray-500">Teach-back for safer understanding.</p>
        </div>
        <div className="flex items-center space-x-4">
          <button onClick={onHelpClick} className="text-gray-600 hover:text-blue-600 transition-colors" aria-label="Help/Tutorial">
            <HelpIcon className="w-6 h-6" />
          </button>
          <button onClick={onDisclaimerClick} className="text-gray-600 hover:text-amber-600 transition-colors" aria-label="Disclaimer">
            <DisclaimerIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;