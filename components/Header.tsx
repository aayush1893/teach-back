import React from 'react';
import { HelpIcon, DisclaimerIcon, PlayCircleIcon } from './icons';
import { Logo } from './Logo';
import ThemeToggle from './ThemeToggle';

type Theme = 'light' | 'dark';

interface HeaderProps {
  onHelpClick: () => void;
  onDisclaimerClick: () => void;
  onTourClick: () => void;
  theme: Theme;
  onToggleTheme: () => void;
}

const Header: React.FC<HeaderProps> = ({ onHelpClick, onDisclaimerClick, onTourClick, theme, onToggleTheme }) => {
  return (
    <header className="bg-white dark:bg-gray-800 shadow-md dark:shadow-none dark:border-b dark:border-gray-700 p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <Logo className="w-20 h-10" />
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[#1D5969] dark:text-[#25A2C4]">Teach-Back Engine</h1>
            <p className="text-sm text-[#25A2C4] dark:text-[#52c1de]">Intelligent Communication for Health</p>
          </div>
        </div>
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button onClick={onTourClick} title="Start Tour / Demo" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Start Tour / Demo">
            <PlayCircleIcon className="w-6 h-6" />
          </button>
          <button onClick={onHelpClick} title="Help" className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors" aria-label="Help/Tutorial">
            <HelpIcon className="w-6 h-6" />
          </button>
          <button onClick={onDisclaimerClick} title="Disclaimer" className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-amber-400 transition-colors" aria-label="Disclaimer">
            <DisclaimerIcon className="w-6 h-6" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;