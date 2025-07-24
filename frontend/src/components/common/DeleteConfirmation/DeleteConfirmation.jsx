import React, { useState, useEffect } from 'react';
import { 
  AlertTriangle, 
  Trash2, 
  Shield, 
  X, 
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import Button from '../Button/Button';

const DeleteConfirmation = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Delete Item",
  itemName = "this item",
  itemType = "item",
  year,
  isLoading = false,
  customWarnings = []
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [typeConfirmation, setTypeConfirmation] = useState('');
  const [understandCheckboxes, setUnderstandCheckboxes] = useState({
    permanent: false,
    noRestore: false,
    understand: false
  });
  const [countdown, setCountdown] = useState(0);

  const totalSteps = 3;
  const requiredText = `DELETE ${year}`;

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(1);
      setTypeConfirmation('');
      setUnderstandCheckboxes({
        permanent: false,
        noRestore: false,
        understand: false
      });
      setCountdown(0);
    }
  }, [isOpen]);

  // Countdown for final confirmation
  useEffect(() => {
    let interval;
    if (currentStep === 3 && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [currentStep, countdown]);

  if (!isOpen) return null;

  const handleNext = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      if (currentStep === 2) {
        setCountdown(5); // 5 second countdown for final step
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      setCountdown(0);
    }
  };

  const handleCheckboxChange = (checkbox) => {
    setUnderstandCheckboxes(prev => ({
      ...prev,
      [checkbox]: !prev[checkbox]
    }));
  };

  const canProceedStep1 = true;
  const canProceedStep2 = Object.values(understandCheckboxes).every(Boolean);
  const canProceedStep3 = typeConfirmation === requiredText && countdown === 0;

  const handleFinalConfirm = () => {
    console.log('🗑️ DeleteConfirmation: Final confirm clicked');
    console.log('🗑️ DeleteConfirmation: canProceedStep3:', canProceedStep3);
    console.log('🗑️ DeleteConfirmation: isLoading:', isLoading);
    console.log('🗑️ DeleteConfirmation: typeConfirmation:', typeConfirmation);
    console.log('🗑️ DeleteConfirmation: requiredText:', requiredText);
    console.log('🗑️ DeleteConfirmation: countdown:', countdown);
    
    if (canProceedStep3 && !isLoading) {
      console.log('🗑️ DeleteConfirmation: Calling onConfirm...');
      onConfirm();
    } else {
      console.log('🗑️ DeleteConfirmation: Cannot proceed - conditions not met');
    }
  };

  const warnings = [
    "All budget allocations and targets will be permanently removed",
    "Monthly budget breakdowns and progress data will be lost",
    "Historical comparison data for this year will be deleted",
    "Any linked transactions will lose their budget associations",
    ...customWarnings
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
              <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                {title}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Step {currentStep} of {totalSteps}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            disabled={isLoading}
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Progress Bar */}
        <div className="px-6 py-2">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-red-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step 1: Initial Warning */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="text-center">
                <Trash2 className="w-16 h-16 text-red-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Are you sure you want to delete this {itemType}?
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  You're about to delete the <strong>{itemName}</strong> budget.
                </p>
              </div>

              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h5 className="font-medium text-red-900 dark:text-red-100 mb-2">
                      This action cannot be undone
                    </h5>
                    <ul className="text-sm text-red-700 dark:text-red-300 space-y-1">
                      {warnings.slice(0, 2).map((warning, index) => (
                        <li key={index}>• {warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Detailed Warnings & Acknowledgment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="text-center">
                <Shield className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Please acknowledge the consequences
                </h4>
              </div>

              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                <h5 className="font-medium text-orange-900 dark:text-orange-100 mb-3">
                  The following data will be permanently lost:
                </h5>
                <ul className="text-sm text-orange-700 dark:text-orange-300 space-y-2">
                  {warnings.map((warning, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <span className="text-orange-500 mt-1">•</span>
                      <span>{warning}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-3">
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understandCheckboxes.permanent}
                    onChange={() => handleCheckboxChange('permanent')}
                    className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I understand this action is <strong>permanent</strong> and cannot be undone
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understandCheckboxes.noRestore}
                    onChange={() => handleCheckboxChange('noRestore')}
                    className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I understand there is <strong>no way to restore</strong> this data
                  </span>
                </label>

                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={understandCheckboxes.understand}
                    onChange={() => handleCheckboxChange('understand')}
                    className="mt-1 w-4 h-4 text-red-600 bg-gray-100 border-gray-300 rounded focus:ring-red-500 dark:focus:ring-red-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600"
                  />
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    I understand the full impact of this action
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Step 3: Final Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="text-center">
                <AlertTriangle className="w-16 h-16 text-red-600 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                  Final Confirmation Required
                </h4>
                <p className="text-gray-600 dark:text-gray-300">
                  Type <code className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-red-600 dark:text-red-400 font-mono">
                    {requiredText}
                  </code> to confirm deletion
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Confirmation Text
                </label>
                <input
                  type="text"
                  value={typeConfirmation}
                  onChange={(e) => setTypeConfirmation(e.target.value)}
                  placeholder={`Type "${requiredText}" here`}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-red-500 focus:border-red-500 dark:bg-gray-700 dark:text-white font-mono"
                  autoComplete="off"
                  disabled={isLoading}
                />
                {typeConfirmation && typeConfirmation !== requiredText && (
                  <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                    Text doesn't match. Please type exactly: {requiredText}
                  </p>
                )}
              </div>

              {countdown > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 text-center">
                  <p className="text-sm text-yellow-700 dark:text-yellow-300">
                    Please wait {countdown} seconds before confirming...
                  </p>
                </div>
              )}

              {typeConfirmation === requiredText && countdown === 0 && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 text-center">
                  <div className="flex items-center justify-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <p className="text-sm text-green-700 dark:text-green-300 font-medium">
                      Ready to delete
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            {currentStep > 1 && (
              <Button
                variant="secondary"
                onClick={handleBack}
                disabled={isLoading}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </Button>
            )}
          </div>

          <div className="flex space-x-3">
            <Button
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>

            {currentStep < totalSteps ? (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={
                  (currentStep === 1 && !canProceedStep1) ||
                  (currentStep === 2 && !canProceedStep2)
                }
                className="flex items-center space-x-2"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="danger"
                onClick={handleFinalConfirm}
                disabled={!canProceedStep3 || isLoading}
                className="flex items-center space-x-2"
              >
                {isLoading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    <span>Delete Forever</span>
                  </>
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
