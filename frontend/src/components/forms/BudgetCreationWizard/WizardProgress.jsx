import React from 'react';
import { Check } from 'lucide-react';

const WizardProgress = ({ currentStep, totalSteps, onStepClick }) => {
  const steps = [
    { number: 1, title: 'Priority', description: 'Your financial goal' },
    { number: 2, title: 'Income', description: 'Income sources' },
    { number: 3, title: 'Profile', description: 'Personal details' },
    { number: 4, title: 'Categories', description: 'Budget categories' },
    { number: 5, title: 'Recommendations', description: 'Expert suggestions' },
    { number: 6, title: 'Review', description: 'Customize budget' },
    { number: 7, title: 'Complete', description: 'Finalize & save' }
  ];

  const getStepStatus = (stepNumber) => {
    if (stepNumber < currentStep) return 'completed';
    if (stepNumber === currentStep) return 'current';
    return 'upcoming';
  };

  const getStepClasses = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500 text-white border-green-500';
      case 'current':
        return 'bg-blue-500 text-white border-blue-500';
      case 'upcoming':
        return 'bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600';
      default:
        return 'bg-gray-200 text-gray-600 border-gray-300 dark:bg-gray-700 dark:text-gray-400 dark:border-gray-600';
    }
  };

  const getConnectorClasses = (stepNumber) => {
    if (stepNumber < currentStep) {
      return 'bg-green-500';
    }
    return 'bg-gray-300 dark:bg-gray-600';
  };

  return (
    <div className="w-full">
      {/* Mobile Progress Bar */}
      <div className="md:hidden mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Step {currentStep} of {totalSteps}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-500">
            {Math.round((currentStep / totalSteps) * 100)}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div 
            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
        <div className="mt-2 text-center">
          <h3 className="font-medium text-gray-900 dark:text-gray-100">
            {steps[currentStep - 1]?.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {steps[currentStep - 1]?.description}
          </p>
        </div>
      </div>

      {/* Desktop Stepper */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const status = getStepStatus(step.number);
            const isClickable = step.number <= currentStep;
            
            return (
              <div key={step.number} className="flex items-center flex-1">
                {/* Step Circle */}
                <div className="flex flex-col items-center">
                  <button
                    onClick={() => isClickable && onStepClick(step.number)}
                    disabled={!isClickable}
                    className={`
                      w-10 h-10 rounded-full border-2 flex items-center justify-center text-sm font-medium
                      transition-all duration-200 relative
                      ${getStepClasses(status)}
                      ${isClickable ? 'cursor-pointer hover:scale-105' : 'cursor-not-allowed'}
                    `}
                  >
                    {status === 'completed' ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      step.number
                    )}
                  </button>
                  
                  {/* Step Title and Description */}
                  <div className="text-center mt-2 min-w-0">
                    <h4 className={`text-sm font-medium ${
                      status === 'current' 
                        ? 'text-blue-600 dark:text-blue-400' 
                        : status === 'completed'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-gray-600 dark:text-gray-400'
                    }`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                      {step.description}
                    </p>
                  </div>
                </div>
                
                {/* Connector Line */}
                {index < steps.length - 1 && (
                  <div className="flex-1 mx-4 mt-[-2rem]">
                    <div className={`h-0.5 w-full transition-all duration-300 ${getConnectorClasses(step.number)}`} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default WizardProgress;
