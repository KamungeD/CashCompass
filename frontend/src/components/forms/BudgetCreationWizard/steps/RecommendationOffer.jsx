import React, { useState } from 'react';
import { 
  Lightbulb, 
  TrendingUp, 
  Shield, 
  Target, 
  CheckCircle,
  ChevronRight, 
  ChevronLeft,
  Loader2
} from 'lucide-react';
import Button from '../../../common/Button/Button';
import { formatCurrency } from '../../../../utils/helpers';

const RecommendationOffer = ({ 
  wizardData, 
  updateWizardData, 
  goToNextStep, 
  goToPreviousStep,
  generateRecommendedBudget,
  loading 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);

  const calculateTotalIncome = () => {
    return wizardData.incomes.reduce((total, income) => {
      const amount = parseFloat(income.amount) || 0;
      const annualAmount = income.frequency === 'monthly' ? amount * 12 : amount;
      return total + annualAmount;
    }, 0);
  };

  const getPriorityText = () => {
    if (typeof wizardData.priority === 'string') {
      const priorityMap = {
        'live-within-means': 'live within your means',
        'increase-savings': 'increase your savings',
        'detailed-tracking': 'keep detailed records accurately',
        'healthy-lifestyle': 'restructure into a healthier lifestyle',
        'responsible-spending': 'create more responsible spending',
        'specific-goal': 'work towards a specific goal'
      };
      return priorityMap[wizardData.priority] || wizardData.priority;
    }
    return wizardData.priority;
  };

  const handleGetRecommendations = async () => {
    try {
      setIsGenerating(true);
      updateWizardData('useRecommendations', true);
      await generateRecommendedBudget();
      goToNextStep();
    } catch (error) {
      console.error('Failed to generate recommendations:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCreateOwn = () => {
    updateWizardData('useRecommendations', false);
    // Create a basic empty budget structure
    const totalIncome = calculateTotalIncome();
    updateWizardData('budget', {
      categories: [],
      totalIncome,
      totalAllocated: 0
    });
    goToNextStep();
  };

  const totalIncome = calculateTotalIncome();

  const benefits = [
    {
      icon: Target,
      title: 'Accounts for your income level',
      description: `Tailored to your ${formatCurrency(totalIncome)} annual income`,
      color: 'blue'
    },
    {
      icon: TrendingUp,
      title: 'Aligned with your financial priority',
      description: `Optimized to help you ${getPriorityText()}`,
      color: 'green'
    },
    {
      icon: Shield,
      title: 'Based on your personal profile',
      description: 'Considers your life stage and living situation',
      color: 'purple'
    },
    {
      icon: CheckCircle,
      title: 'Follows expert recommendations',
      description: 'Uses proven financial planning principles like the 50/30/20 rule',
      color: 'indigo'
    }
  ];

  const getColorClasses = (color) => {
    switch (color) {
      case 'blue': return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/20';
      case 'green': return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/20';
      case 'purple': return 'text-purple-600 dark:text-purple-400 bg-purple-100 dark:bg-purple-900/20';
      case 'indigo': return 'text-indigo-600 dark:text-indigo-400 bg-indigo-100 dark:bg-indigo-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
            <Lightbulb className="h-12 w-12 text-yellow-600 dark:text-yellow-400" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Get a personalized budget recommendation?
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Based on your income of <span className="font-semibold text-blue-600 dark:text-blue-400">
          {formatCurrency(totalIncome)}</span> and your goal to <span className="font-semibold text-green-600 dark:text-green-400">
          {getPriorityText()}</span>, we can create a personalized budget using proven financial planning principles.
        </p>
      </div>

      {/* Benefits Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {benefits.map((benefit, index) => {
          const Icon = benefit.icon;
          return (
            <div 
              key={index}
              className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6"
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${getColorClasses(benefit.color)}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {benefit.description}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recommendation Preview */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 
                      border border-blue-200 dark:border-blue-800 rounded-xl p-8 mb-12">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-4 text-center">
          What you'll get:
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">50%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Essential Expenses</div>
            <div className="text-xs text-gray-500 mt-1">Housing, food, transport</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-2">30%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Lifestyle & Wants</div>
            <div className="text-xs text-gray-500 mt-1">Entertainment, dining out</div>
          </div>
          <div>
            <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">20%</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Savings & Goals</div>
            <div className="text-xs text-gray-500 mt-1">Emergency fund, investments</div>
          </div>
        </div>
        <p className="text-center text-sm text-gray-600 dark:text-gray-400 mt-4">
          *Adjusted based on your priority and personal situation
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col md:flex-row gap-4 justify-center mb-8">
        <Button
          onClick={handleGetRecommendations}
          disabled={isGenerating || loading}
          size="lg"
          className="flex items-center justify-center space-x-2 px-8 py-4 text-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating recommendations...</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-5 w-5" />
              <span>Yes, give me recommendations</span>
            </>
          )}
        </Button>

        <Button
          onClick={handleCreateOwn}
          variant="outline"
          size="lg"
          className="flex items-center justify-center space-x-2 px-8 py-4 text-lg"
          disabled={isGenerating || loading}
        >
          <span>I'll create my own budget</span>
        </Button>
      </div>

      {/* Help Text */}
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-8">
        <p className="text-sm text-yellow-800 dark:text-yellow-200 text-center">
          <strong>Don't worry:</strong> You can always customize and adjust the recommendations in the next step. 
          This is just a starting point to make budgeting easier.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={goToPreviousStep}
          variant="outline"
          className="flex items-center space-x-2"
          disabled={isGenerating || loading}
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>

        {/* Skip option */}
        <Button
          onClick={handleCreateOwn}
          variant="ghost"
          className="text-gray-500 dark:text-gray-400"
          disabled={isGenerating || loading}
        >
          Skip recommendations →
        </Button>
      </div>
    </div>
  );
};

export default RecommendationOffer;
