import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import Link from 'next/link';

interface TooltipProps {
  title?: string;
  content: string | React.ReactNode;
  link?: string;
  linkText?: string;
  position?: 'top' | 'right' | 'bottom' | 'left';
  maxWidth?: string;
  children?: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  content,
  link,
  linkText = 'Learn more',
  position = 'top',
  maxWidth = '250px',
  children,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLDivElement>(null);

  // Position mapping for tooltip
  const positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
  };

  // Arrow position classes
  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-gray-800 border-r-transparent border-b-transparent border-l-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-transparent border-r-gray-800 border-b-transparent border-l-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-t-transparent border-r-transparent border-b-gray-800 border-l-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-transparent border-r-transparent border-b-transparent border-l-gray-800',
  };

  // Handle clicks outside the tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isVisible &&
        tooltipRef.current &&
        !tooltipRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);

  return (
    <div className="relative inline-block">
      {/* Tooltip trigger */}
      <div
        ref={triggerRef}
        className="inline-flex items-center cursor-help"
        onClick={() => setIsVisible(!isVisible)}
      >
        {children || (
          <HelpCircle size={16} className="text-gray-500 hover:text-indigo-600" />
        )}
      </div>

      {/* Tooltip content */}
      {isVisible && (
        <div
          ref={tooltipRef}
          className={`absolute ${positionClasses[position]} z-50`}
          style={{ maxWidth }}
        >
          <div className="bg-gray-800 text-white rounded-md shadow-lg p-3 text-sm">
            <div className="flex justify-between items-start mb-1">
              {title && <div className="font-semibold">{title}</div>}
              <button
                onClick={() => setIsVisible(false)}
                className="text-gray-400 hover:text-white ml-2"
                aria-label="Close"
              >
                <X size={14} />
              </button>
            </div>
            <div className="mb-2">{content}</div>
            {link && (
              <Link
                href={link}
                className="text-xs text-indigo-300 hover:text-indigo-200 inline-flex items-center"
              >
                {linkText}
                <svg
                  className="w-3 h-3 ml-1"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14 5l7 7m0 0l-7 7m7-7H3"
                  />
                </svg>
              </Link>
            )}
          </div>
          {/* Arrow */}
          <div
            className={`absolute w-0 h-0 border-4 ${arrowClasses[position]}`}
          />
        </div>
      )}
    </div>
  );
}; 