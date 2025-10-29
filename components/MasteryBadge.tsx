
import React, { useEffect } from 'react';
import { DownloadIcon } from './icons';

interface MasteryBadgeProps {
  onDownload: () => void;
}

const MasteryBadge: React.FC<MasteryBadgeProps> = ({ onDownload }) => {
  useEffect(() => {
    // A simple confetti effect
    const confettiCount = 100;
    const container = document.getElementById('mastery-badge-container');
    if (container) {
      for (let i = 0; i < confettiCount; i++) {
        const confetti = document.createElement('div');
        confetti.className = 'confetti';
        confetti.style.left = `${Math.random() * 100}%`;
        confetti.style.animationDuration = `${Math.random() * 3 + 2}s`;
        confetti.style.animationDelay = `${Math.random() * 2}s`;
        confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 50%)`;
        container.appendChild(confetti);
      }
    }
    
    // Cleanup confetti
    const timer = setTimeout(() => {
      if (container) {
        container.innerHTML = ''; // Clear children
      }
    }, 5000);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <style>{`
        .confetti-container { position: relative; overflow: hidden; }
        .confetti { position: absolute; width: 10px; height: 10px; opacity: 0; animation: fall 5s linear forwards; }
        @keyframes fall {
          0% { transform: translateY(-100px) rotate(0deg); opacity: 1; }
          100% { transform: translateY(150px) rotate(720deg); opacity: 0; }
        }
      `}</style>
      <div id="mastery-badge-container" className="confetti-container bg-green-100 border-l-4 border-green-500 text-green-700 p-6 rounded-lg shadow-md text-center">
        <h2 className="text-2xl font-bold">Mastered!</h2>
        <p className="mt-2">Great job! You've correctly answered all the questions.</p>
        <div className="mt-4">
          <button
            onClick={onDownload}
            className="inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Download Summary
          </button>
        </div>
      </div>
    </>
  );
};

export default MasteryBadge;
