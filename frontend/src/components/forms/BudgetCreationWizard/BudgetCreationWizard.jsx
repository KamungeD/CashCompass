import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';
import { monthlyBudgetAPI } from '../../../services/api';
import toast from 'react-hot-toast';

// Step Components
import PrioritySelection from './steps/PrioritySelection';
import IncomeCollection from './steps/IncomeCollection';
import PersonalProfile from './steps/PersonalProfile';
import CategorySelection from './steps/CategorySelection';
import RecommendationOffer from './steps/RecommendationOffer';
import BudgetReview from './steps/BudgetReview';
import Confirmation from './steps/Confirmation';

// Progress Indicator Component
import WizardProgress from './WizardProgress';

const BudgetCreationWizard = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState(false);
  const totalSteps = 7;

  // Wizard state
  const [wizardData, setWizardData] = useState({
    priority: null,
    incomes: [],
    profile: {},
    selectedCategories: {},
    useRecommendations: null,
    budget: {
      categories: [],
      totalIncome: 0,
      totalAllocated: 0
    }
  });

  // Save progress to localStorage
  useEffect(() => {
    const saveProgress = () => {
      try {
        const progressData = {
          userId: user?.id,
          currentStep,
          data: wizardData,
          timestamp: new Date().toISOString()
        };
        localStorage.setItem('budgetWizardProgress', JSON.stringify(progressData));
      } catch (error) {
        console.error('Failed to save wizard progress:', error);
      }
    };

    if (currentStep > 1) {
      saveProgress();
    }
  }, [currentStep, wizardData, user?.id]);

  // Load progress from localStorage on mount
  useEffect(() => {
    const loadProgress = () => {
      try {
        const saved = localStorage.getItem('budgetWizardProgress');
        if (saved) {
          const progressData = JSON.parse(saved);
          // Only load if it's recent (within 24 hours) and for the same user
          const hoursSinceLastSave = (new Date() - new Date(progressData.timestamp)) / (1000 * 60 * 60);
          if (hoursSinceLastSave < 24 && progressData.userId === user?.id) {
            setWizardData(progressData.data);
            setCurrentStep(progressData.currentStep);
            toast.success('Resuming your budget creation...');
          }
        }
      } catch (error) {
        console.error('Failed to load wizard progress:', error);
      }
    };

    loadProgress();
  }, [user?.id]);

  const updateWizardData = (key, value) => {
    setWizardData(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const goToNextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const goToPreviousStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const handleAbandonClick = () => {
    setShowAbandonConfirm(true);
  };

  const handleAbandonConfirm = () => {
    // Clear any saved progress
    try {
      localStorage.removeItem('budgetWizardProgress');
    } catch (error) {
      console.error('Failed to clear wizard progress:', error);
    }
    
    setShowAbandonConfirm(false);
    toast.success('Budget creation abandoned');
    onCancel();
  };

  const handleAbandonCancel = () => {
    setShowAbandonConfirm(false);
  };

  const generateRecommendedBudget = async () => {
    try {
      setLoading(true);
      
      // Calculate total annual income
      const totalIncome = wizardData.incomes.reduce((sum, income) => {
        const amount = parseFloat(income.amount) || 0;
        const annualAmount = income.frequency === 'monthly' ? amount * 12 : amount;
        return sum + annualAmount;
      }, 0);

      // Generate recommendations based on user data
      const recommendationRequest = {
        income: totalIncome,
        priority: wizardData.priority,
        profile: wizardData.profile,
        selectedCategories: wizardData.selectedCategories
      };

      const response = await monthlyBudgetAPI.generateRecommendations(recommendationRequest);
      const recommendedBudget = response.data.data;

      // Update wizard data with generated budget
      updateWizardData('budget', {
        categories: recommendedBudget.categories,
        totalIncome,
        totalAllocated: recommendedBudget.totalAllocated
      });

      return recommendedBudget;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      toast.error('Failed to generate budget recommendations');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const completeBudgetCreation = async (finalBudgetData) => {
    try {
      setLoading(true);

      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11

      // Prepare final data for API
      const budgetPayload = {
        year: currentYear,
        month: currentMonth,
        income: {
          monthly: wizardData.budget.totalIncome / 12,
          annual: wizardData.budget.totalIncome,
          sources: wizardData.incomes || []
        },
        categories: finalBudgetData.categories || [],
        creationMethod: 'guided',
        userProfile: wizardData.profile || {},
        priority: wizardData.priority || null
      };

      console.log('📊 Creating monthly budget with payload:', budgetPayload);

      // Save the budget
      const response = await monthlyBudgetAPI.createOrUpdateBudget(budgetPayload);
      
      // Clear progress data
      localStorage.removeItem('budgetWizardProgress');
      
      toast.success('🎉 Your monthly budget has been created successfully!');
      
      // Call completion callback
      onComplete(response.data.data);
      
    } catch (error) {
      console.error('Error creating monthly budget:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to create monthly budget. Please try again.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const renderCurrentStep = () => {
    const commonProps = {
      wizardData,
      updateWizardData,
      goToNextStep,
      goToPreviousStep,
      loading
    };

    switch (currentStep) {
      case 1:
        return <PrioritySelection {...commonProps} />;
      case 2:
        return <IncomeCollection {...commonProps} />;
      case 3:
        return <PersonalProfile {...commonProps} />;
      case 4:
        return <CategorySelection {...commonProps} />;
      case 5:
        return (
          <RecommendationOffer 
            {...commonProps} 
            generateRecommendedBudget={generateRecommendedBudget}
          />
        );
      case 6:
        return <BudgetReview {...commonProps} />;
      case 7:
        return (
          <Confirmation 
            {...commonProps} 
            completeBudgetCreation={completeBudgetCreation}
          />
        );
      default:
        return <PrioritySelection {...commonProps} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto pt-8 pb-16 px-4 relative">
        {/* Close/Abandon Button - Top Right */}
        <button
          onClick={handleAbandonClick}
          className="absolute top-4 right-4 z-10 p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors"
          title="Abandon budget creation"
        >
          <X className="h-6 w-6" />
        </button>

        {/* Progress Indicator */}
        <WizardProgress 
          currentStep={currentStep} 
          totalSteps={totalSteps}
          onStepClick={goToStep}
        />
        
        {/* Main Content */}
        <div className="mt-8">
          {renderCurrentStep()}
        </div>
        
        {/* Cancel Button (always visible) */}
        <div className="fixed bottom-4 left-4">
          <button
            onClick={handleAbandonClick}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm underline"
          >
            Cancel & Exit
          </button>
        </div>
      </div>

      {/* Abandon Confirmation Modal */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                Abandon Budget Creation?
              </h3>
              <button
                onClick={handleAbandonCancel}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Are you sure you want to abandon creating this budget? All your progress will be lost.
              </p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={handleAbandonCancel}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Continue Creating
              </button>
              <button
                onClick={handleAbandonConfirm}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Yes, Abandon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetCreationWizard;
