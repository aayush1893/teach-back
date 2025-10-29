
import React from 'react';
import { HelpIcon, DisclaimerIcon, PlayCircleIcon, VideoIcon } from './icons';

interface HeaderProps {
  onHelpClick: () => void;
  onDisclaimerClick: () => void;
  onTourClick: () => void;
  onGenerateVideoClick: () => void;
  isGeneratingVideo: boolean;
}

const Header: React.FC<HeaderProps> = ({ onHelpClick, onDisclaimerClick, onTourClick, onGenerateVideoClick, isGeneratingVideo }) => {
  return (
    <header className="bg-white shadow-md p-4">
      <div className="container mx-auto flex justify-between items-center">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-blue-600">Teach-Back Engine</h1>
          <p className="text-sm text-gray-500">Teach-back for safer understanding.</p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2" title="Video generation is a premium feature and may incur costs.">
            <button onClick={onGenerateVideoClick} className="text-gray-600 hover:text-blue-600 transition-colors disabled:opacity-50 disabled:cursor-wait" aria-label="Generate Demo Video" disabled={isGeneratingVideo}>
              {isGeneratingVideo ? <svg className="animate-spin h-6 w-6 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> : <VideoIcon className="w-6 h-6" />}
            </button>
            <span className="text-xs font-semibold text-amber-600">(Paid)</span>
          </div>
          <button onClick={onTourClick} className="text-gray-600 hover:text-blue-600 transition-colors" aria-label="Start Tour / Demo">
            <PlayCircleIcon className="w-6 h-6" />
          </button>
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