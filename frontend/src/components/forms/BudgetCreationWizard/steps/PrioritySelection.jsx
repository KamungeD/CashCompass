import React, { useState } from 'react';
import { 
  Target, 
  PiggyBank, 
  FileText, 
  Heart, 
  BarChart3, 
  Zap,
  ChevronRight
} from 'lucide-react';
import Button from '../../../common/Button/Button';

const PrioritySelection = ({ wizardData, updateWizardData, goToNextStep }) => {
  const [selectedPriority, setSelectedPriority] = useState(wizardData.priority || null);
  const [customPriority, setCustomPriority] = useState('');

  const priorities = [
    {
      id: 'live-within-means',
      title: 'Live within your means',
      description: 'Build a sustainable budget that matches your lifestyle',
      icon: Target,
      color: 'blue'
    },
    {
      id: 'increase-savings',
      title: 'Increase your savings',
      description: 'Maximize your savings rate for future financial security',
      icon: PiggyBank,
      color: 'green'
    },
    {
      id: 'detailed-tracking',
      title: 'Keep detailed records accurately',
      description: 'Track every expense to understand your spending patterns',
      icon: FileText,
      color: 'purple'
    },
    {
      id: 'healthy-lifestyle',
      title: 'Restructure into a healthier lifestyle',
      description: 'Prioritize health, wellness, and life balance in your budget',
      icon: Heart,
      color: 'red'
    },
    {
      id: 'responsible-spending',
      title: 'Create more responsible spending',
      description: 'Develop better spending habits and eliminate waste',
      icon: BarChart3,
      color: 'yellow'
    },
    {
      id: 'specific-goal',
      title: 'Work towards a specific goal',
      description: 'Focus your budget on achieving a particular objective',
      icon: Zap,
      color: 'indigo'
    }
  ];

  const handlePrioritySelect = (priorityId) => {
    setSelectedPriority(priorityId);
    if (priorityId !== 'custom') {
      setCustomPriority('');
    }
  };

  const handleCustomPriorityChange = (value) => {
    setCustomPriority(value);
    if (value.trim()) {
      setSelectedPriority('custom');
    }
  };

  const handleContinue = () => {
    if (selectedPriority) {
      const priorityValue = selectedPriority === 'custom' ? customPriority : selectedPriority;
      updateWizardData('priority', priorityValue);
      goToNextStep();
    }
  };

  const getColorClasses = (color, isSelected) => {
    const baseClasses = `border-2 transition-all duration-200 cursor-pointer`;
    
    if (isSelected) {
      switch (color) {
        case 'blue': return `${baseClasses} border-blue-500 bg-blue-50 dark:bg-blue-900/20`;
        case 'green': return `${baseClasses} border-green-500 bg-green-50 dark:bg-green-900/20`;
        case 'purple': return `${baseClasses} border-purple-500 bg-purple-50 dark:bg-purple-900/20`;
        case 'red': return `${baseClasses} border-red-500 bg-red-50 dark:bg-red-900/20`;
        case 'yellow': return `${baseClasses} border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20`;
        case 'indigo': return `${baseClasses} border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20`;
        default: return `${baseClasses} border-gray-500 bg-gray-50 dark:bg-gray-900/20`;
      }
    } else {
      return `${baseClasses} border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 bg-white dark:bg-gray-800`;
    }
  };

  const getIconColorClasses = (color, isSelected) => {
    if (isSelected) {
      switch (color) {
        case 'blue': return 'text-blue-600 dark:text-blue-400';
        case 'green': return 'text-green-600 dark:text-green-400';
        case 'purple': return 'text-purple-600 dark:text-purple-400';
        case 'red': return 'text-red-600 dark:text-red-400';
        case 'yellow': return 'text-yellow-600 dark:text-yellow-400';
        case 'indigo': return 'text-indigo-600 dark:text-indigo-400';
        default: return 'text-gray-600 dark:text-gray-400';
      }
    } else {
      return 'text-gray-500 dark:text-gray-400';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          What's your main financial priority?
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          This will help us create a personalized budget that aligns with your goals and lifestyle.
        </p>
      </div>

      {/* Priority Options */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {priorities.map((priority) => {
          const Icon = priority.icon;
          const isSelected = selectedPriority === priority.id;
          
          return (
            <div
              key={priority.id}
              onClick={() => handlePrioritySelect(priority.id)}
              className={`p-6 rounded-xl ${getColorClasses(priority.color, isSelected)}`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm`}>
                  <Icon className={`h-6 w-6 ${getIconColorClasses(priority.color, isSelected)}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {priority.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {priority.description}
                  </p>
                </div>
                {isSelected && (
                  <div className="text-green-500">
                    <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                      <div className="w-2 h-2 bg-white rounded-full" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Custom Priority Option */}
      <div className="mb-8">
        <div
          className={`p-6 rounded-xl ${getColorClasses('gray', selectedPriority === 'custom')}`}
        >
          <div className="flex items-start space-x-4">
            <div className="p-3 rounded-lg bg-white dark:bg-gray-800 shadow-sm">
              <FileText className="h-6 w-6 text-gray-500 dark:text-gray-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                Other (Custom Goal)
              </h3>
              <input
                type="text"
                placeholder="Describe your financial priority..."
                value={customPriority}
                onChange={(e) => handleCustomPriorityChange(e.target.value)}
                onClick={() => setSelectedPriority('custom')}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-800 
                         dark:text-gray-100 text-gray-900 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
            {selectedPriority === 'custom' && customPriority.trim() && (
              <div className="text-green-500">
                <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Continue Button */}
      <div className="flex justify-center">
        <Button
          onClick={handleContinue}
          disabled={!selectedPriority || (selectedPriority === 'custom' && !customPriority.trim())}
          size="lg"
          className="flex items-center space-x-2 px-8 py-4 text-lg"
        >
          <span>Continue</span>
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};

export default PrioritySelection;
