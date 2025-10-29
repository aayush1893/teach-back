
import React from 'react';
import { XIcon, DownloadIcon } from './icons';

interface VideoPlayerModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string | null;
}

const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({ isOpen, onClose, videoUrl }) => {
  if (!isOpen || !videoUrl) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-bold text-blue-600">App Tutorial Video</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800" aria-label="Close video player">
            <XIcon className="w-6 h-6" />
          </button>
        </div>
        <div className="p-4 flex-grow overflow-hidden">
          <video src={videoUrl} controls autoPlay className="w-full h-full object-contain">
            Your browser does not support the video tag.
          </video>
        </div>
        <div className="p-4 bg-gray-50 flex flex-col sm:flex-row justify-between items-center sticky bottom-0 border-t">
          <div className="text-xs text-gray-500 mb-2 sm:mb-0 text-center sm:text-left">
            <p className="font-semibold text-amber-700">Video generation is a paid feature and may incur costs.</p>
            <p>The video link requires your API key for access and will eventually expire.</p>
          </div>
          <a
            href={videoUrl}
            download="teach-back-engine-demo.mp4"
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 mt-2 sm:mt-0 flex-shrink-0"
          >
            <DownloadIcon className="w-5 h-5 mr-2" />
            Download Video
          </a>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayerModal;