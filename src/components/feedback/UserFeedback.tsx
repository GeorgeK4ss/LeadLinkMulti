"use client";

import React, { useState } from 'react';
import { MessageSquare, X, ThumbsUp, ThumbsDown, Send } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Button } from "@/components/ui/button";

type FeedbackType = 'bug' | 'feature' | 'general';

interface UserFeedbackProps {
  onFeedbackSubmit?: (feedback: {
    type: FeedbackType;
    message: string;
    rating: number;
    page: string;
  }) => Promise<void>;
  customStyles?: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    primaryColor?: string;
  };
}

export const UserFeedback: React.FC<UserFeedbackProps> = ({
  onFeedbackSubmit,
  customStyles = {
    position: 'bottom-right',
    primaryColor: '#4f46e5',
  },
}) => {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('general');
  const [message, setMessage] = useState('');
  const [rating, setRating] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const positionClasses = {
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
  };

  // Use the position directly from customStyles
  const feedbackPosition = positionClasses[customStyles.position || 'bottom-right'];
  
  const primaryColor = customStyles.primaryColor || '#4f46e5';

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast({
        title: 'Missing information',
        description: 'Please provide feedback before submitting',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const feedbackData = {
        type: feedbackType,
        message: message.trim(),
        rating: rating || 0,
        page: window.location.pathname,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
      };
      
      // In a real implementation, this would send data to the backend
      if (onFeedbackSubmit) {
        await onFeedbackSubmit({
          type: feedbackType,
          message: message.trim(),
          rating: rating || 0,
          page: window.location.pathname,
        });
      } else {
        // Mock submission delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Feedback submitted:', feedbackData);
      }

      toast({
        title: 'Thank you for your feedback!',
        description: 'Your input helps us improve the LeadLink CRM system.',
      });

      // Reset form
      setFeedbackType('general');
      setMessage('');
      setRating(null);
      setIsOpen(false);
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast({
        title: 'Something went wrong',
        description: 'Unable to submit feedback. Please try again later.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Feedback button */}
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="icon"
        className={`fixed ${feedbackPosition} z-[9998] flex items-center justify-center p-3 rounded-full shadow-lg group`}
        style={{ 
          backgroundColor: isOpen ? primaryColor : 'white',
          color: isOpen ? 'white' : primaryColor,
          border: '1px solid var(--border)'
        }}
        aria-label="Provide feedback"
      >
        <MessageSquare size={20} />
        <span className="absolute opacity-0 group-hover:opacity-100 whitespace-nowrap left-12 px-2 py-1 text-xs bg-gray-800 text-white rounded transition-opacity duration-300">
          Provide feedback
        </span>
      </Button>

      {/* Feedback modal */}
      {isOpen && (
        <>
          <div 
            className="fixed inset-0 bg-black/20 z-40"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed bottom-16 right-4 md:right-6 w-80 md:w-96 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b" style={{ backgroundColor: primaryColor }}>
              <h3 className="font-semibold text-white flex items-center gap-2">
                <MessageSquare size={16} />
                Provide Feedback
              </h3>
              <Button 
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="sm"
                className="text-white/80 hover:text-white h-auto p-1"
              >
                <X size={18} />
              </Button>
            </div>

            <div className="p-4">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Feedback Type
                </label>
                <div className="flex gap-2">
                  {[
                    { value: 'general', label: 'General' },
                    { value: 'bug', label: 'Report Bug' },
                    { value: 'feature', label: 'Feature Request' },
                  ].map((option) => (
                    <Button
                      key={option.value}
                      type="button"
                      onClick={() => setFeedbackType(option.value as FeedbackType)}
                      variant={feedbackType === option.value ? "default" : "secondary"}
                      className={`px-3 py-1.5 text-sm h-auto`}
                      style={{
                        backgroundColor: feedbackType === option.value ? primaryColor : '',
                        color: feedbackType === option.value ? 'white' : '',
                      }}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1">
                  Your Feedback
                </label>
                <textarea
                  id="feedback-message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    feedbackType === 'bug'
                      ? 'Please describe the issue you encountered...'
                      : feedbackType === 'feature'
                      ? 'What feature would you like to see?'
                      : 'Tell us what you think...'
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rate your experience
                </label>
                <div className="flex gap-2 items-center">
                  <Button
                    type="button"
                    onClick={() => setRating(1)}
                    variant="ghost"
                    className={`p-2 h-auto ${
                      rating === 1 ? 'bg-red-100 text-red-600' : 'text-gray-400 hover:text-red-600'
                    }`}
                  >
                    <ThumbsDown size={18} />
                  </Button>
                  {[2, 3, 4].map((value) => (
                    <Button
                      key={value}
                      type="button"
                      onClick={() => setRating(value)}
                      variant="ghost"
                      className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        rating === value
                          ? 'bg-gray-200 text-gray-800'
                          : 'text-gray-400 hover:bg-gray-100'
                      }`}
                    >
                      {value}
                    </Button>
                  ))}
                  <Button
                    type="button"
                    onClick={() => setRating(5)}
                    variant="ghost"
                    className={`p-2 h-auto ${
                      rating === 5 ? 'bg-green-100 text-green-600' : 'text-gray-400 hover:text-green-600'
                    }`}
                  >
                    <ThumbsUp size={18} />
                  </Button>
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="gap-1.5"
                  style={{ backgroundColor: isSubmitting ? '' : primaryColor }}
                >
                  {isSubmitting ? 'Submitting...' : (
                    <>
                      <Send size={14} /> 
                      Submit Feedback
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}; 