

import React from 'react';
import { XIcon } from './icons';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, videoUrl }) => {
  if (!isOpen || !videoUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Your Video Summary</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close video player">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 flex-grow flex justify-center items-center bg-gray-900">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              className="max-w-full max-h-[75vh] rounded"
            >
              Your browser does not support the video tag.
            </video>
          ) : (
             <p className="text-white">Loading video...</p>
          )}
        </div>
        <div className="p-4 bg-gray-50 dark:bg-gray-900 text-right">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-500">
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;