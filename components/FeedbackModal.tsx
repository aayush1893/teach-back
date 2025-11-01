

import React, { useState } from 'react';
import { XIcon, StarIcon, CheckIcon } from './icons';
import { FeedbackData } from '../types';

// --- INSTRUCTIONS FOR THE DEVELOPER ---
// 1. Create a Google Form with short answer fields for: Rating, Accuracy, Helpfulness, Features, and Comment.
// 2. Click the "Send" button, go to the "Send via link" tab, and get the form link.
// 3. Open the form using the link and get a "pre-filled" link.
// 4. From the pre-filled link URL, extract the form's action URL and the 'entry.XXXXXXXXX' IDs for each question.
// 5. Replace the placeholder values below with your actual form URL and entry IDs.

// These values have been configured based on the provided Google Form link.
const GOOGLE_FORM_URL = 'https://docs.google.com/forms/d/e/1FAIpQLSdmdbVWPh5kPrGUoRY9i9A1m_Q4tK08Qm7IManvJG37BiRaww/formResponse'; 
const RATING_ENTRY_ID = 'entry.1018873919';
const ACCURACY_ENTRY_ID = 'entry.1119597011';
const HELPFULNESS_ENTRY_ID = 'entry.146869584';
const FEATURES_ENTRY_ID = 'entry.1448981258';
const COMMENT_ENTRY_ID = 'entry.1052697810';


interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [feedback, setFeedback] = useState<FeedbackData>({
    rating: 0,
    accuracy: '',
    helpfulness: '',
    features: [],
    comment: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  const resetForm = () => {
    setIsSubmitted(false);
    setIsSubmitting(false);
    setFeedback({ rating: 0, accuracy: '', helpfulness: '', features: [], comment: '' });
  };
  
  const handleClose = () => {
    onClose();
    // Delay reset to avoid flash of content during closing animation
    setTimeout(resetForm, 300); 
  };
  
  const handleFeatureChange = (feature: string) => {
    setFeedback(prev => {
        const newFeatures = prev.features.includes(feature)
            ? prev.features.filter(f => f !== feature)
            : [...prev.features, feature];
        return {...prev, features: newFeatures};
    });
  };

  const handleSubmit = async () => {
    // FIX: Removed an obsolete check for a placeholder GOOGLE_FORM_URL.
    // This was causing a TypeScript error because the URL has been configured,
    // making the comparison always false.
    
    setIsSubmitting(true);
    
    const formData = new FormData();
    formData.append(RATING_ENTRY_ID, feedback.rating.toString());
    formData.append(ACCURACY_ENTRY_ID, feedback.accuracy);
    formData.append(HELPFULNESS_ENTRY_ID, feedback.helpfulness);
    formData.append(FEATURES_ENTRY_ID, feedback.features.join(', '));
    formData.append(COMMENT_ENTRY_ID, feedback.comment);

    try {
        await fetch(GOOGLE_FORM_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors' // Important for submitting to Google Forms
        });
        setIsSubmitted(true);
        setTimeout(handleClose, 2500);
    } catch (error) {
        console.error('Feedback submission error:', error);
        alert('Sorry, there was an issue submitting your feedback. Please try again.');
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center z-50 p-4" role="dialog" aria-modal="true">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-lg transition-all transform max-h-[90vh] flex flex-col">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center sticky top-0 bg-white dark:bg-gray-800">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Share Your Feedback</h2>
          <button onClick={handleClose} className="text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200" aria-label="Close feedback modal">
            <XIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="overflow-y-auto">
            {isSubmitted ? (
              <div className="p-8 text-center">
                <CheckIcon className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Thank You!</h3>
                <p className="text-gray-600 dark:text-gray-300 mt-2">Your feedback helps us improve the Teach-Back Engine.</p>
              </div>
            ) : (
                <div className="p-6 space-y-6">
                  {/* Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">1. Overall, how was your experience?</label>
                    <div className="flex items-center space-x-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button key={star} onClick={() => setFeedback(prev => ({...prev, rating: star}))} aria-label={`Rate ${star} out of 5 stars`}>
                          <StarIcon className={`w-8 h-8 cursor-pointer transition-colors ${feedback.rating >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'}`} />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Accuracy */}
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">2. How accurate was the simplified text?</legend>
                    <div className="space-y-2">
                        {['very_accurate', 'mostly_accurate', 'somewhat_accurate', 'not_accurate'].map(val => (
                            <label key={val} className="flex items-center">
                                <input type="radio" name="accuracy" value={val} checked={feedback.accuracy === val} onChange={e => setFeedback(prev => ({...prev, accuracy: e.target.value as any}))} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{val.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </label>
                        ))}
                    </div>
                  </fieldset>

                  {/* Helpfulness */}
                   <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">3. How helpful was the quiz for checking your understanding?</legend>
                    <div className="space-y-2">
                        {['very_helpful', 'somewhat_helpful', 'not_helpful'].map(val => (
                            <label key={val} className="flex items-center">
                                <input type="radio" name="helpfulness" value={val} checked={feedback.helpfulness === val} onChange={e => setFeedback(prev => ({...prev, helpfulness: e.target.value as any}))} className="h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500" />
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{val.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                            </label>
                        ))}
                    </div>
                  </fieldset>

                  {/* Features */}
                  <fieldset>
                    <legend className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">4. Which features did you find most useful? (Check all that apply)</legend>
                     <div className="space-y-2">
                        {['Simplified Text', 'Quiz', 'Chat Helper', 'Live Q&A', 'Audio Translation'].map(feature => (
                           <label key={feature} className="flex items-center">
                                <input type="checkbox" checked={feedback.features.includes(feature)} onChange={() => handleFeatureChange(feature)} className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"/>
                                <span className="ml-2 text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                           </label>
                        ))}
                     </div>
                  </fieldset>

                  {/* Comment */}
                  <div>
                    <label htmlFor="feedback-comment" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                      5. Any other comments or suggestions? (Optional)
                    </label>
                    <textarea
                      id="feedback-comment"
                      rows={3}
                      value={feedback.comment}
                      onChange={(e) => setFeedback(prev => ({...prev, comment: e.target.value}))}
                      placeholder="Tell us what you liked or where we can improve..."
                      className="mt-1 block w-full p-2 bg-white dark:bg-gray-700 dark:text-gray-200 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    />
                  </div>
                </div>
            )}
        </div>
        
        {!isSubmitted && (
            <div className="p-4 bg-gray-50 dark:bg-gray-900 flex justify-end space-x-3 rounded-b-lg sticky bottom-0 border-t dark:border-gray-700">
              <button onClick={handleClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-500 dark:hover:bg-gray-600">
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={feedback.rating === 0 || isSubmitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 disabled:bg-gray-400 dark:disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;