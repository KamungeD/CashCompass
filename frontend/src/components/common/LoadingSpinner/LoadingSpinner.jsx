import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../utils/helpers';

const LoadingSpinner = ({ 
  size = 'md', 
  className,
  fullScreen = false,
  message = 'Loading...',
  showMessage = true,
  ...props 
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const spinner = (
    <div className={cn("flex items-center justify-center", className)} {...props}>
      <div className="flex flex-col items-center space-y-2">
        <Loader2 className={cn(
          "animate-spin text-primary-600 dark:text-primary-400",
          sizes[size]
        )} />
        {showMessage && (
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {message}
          </p>
        )}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
        {spinner}
      </div>
    );
  }

  return spinner;
};

export default LoadingSpinner;
