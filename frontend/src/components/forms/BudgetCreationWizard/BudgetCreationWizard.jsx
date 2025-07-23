import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { annualBudgetAPI } from '../../../services/api';
import toast from 'react-hot-toast';

// Step Components
import PrioritySelection from './steps/PrioritySelection';
import IncomeCollection from './steps/IncomeCollection';
import PersonalProfile from './steps/PersonalProfile';
import RecommendationOffer from './steps/RecommendationOffer';
import BudgetReview from './steps/BudgetReview';
import Confirmation from './steps/Confirmation';

// Progress Indicator Component
import WizardProgress from './WizardProgress';

const BudgetCreationWizard = ({ onComplete, onCancel }) => {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const totalSteps = 6;

  // Wizard state
  const [wizardData, setWizardData] = useState({
    priority: null,
    incomes: [],
    profile: {},
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
        profile: wizardData.profile
      };

      const response = await annualBudgetAPI.generateRecommendations(recommendationRequest);
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

      // Prepare final data for API
      const budgetPayload = {
        year: new Date().getFullYear(),
        income: {
          annual: wizardData.budget.totalIncome,
          monthly: wizardData.budget.totalIncome / 12,
          sources: wizardData.incomes
        },
        categories: finalBudgetData.categories,
        creationMethod: 'guided',
        userProfile: wizardData.profile,
        priority: wizardData.priority
      };

      // Save the budget
      const response = await annualBudgetAPI.createOrUpdateBudget(budgetPayload);
      
      // Clear progress data
      localStorage.removeItem('budgetWizardProgress');
      
      toast.success('🎉 Your annual budget has been created successfully!');
      
      // Call completion callback
      onComplete(response.data.data);
      
    } catch (error) {
      console.error('Error creating annual budget:', error);
      toast.error('Failed to create annual budget. Please try again.');
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
        return (
          <RecommendationOffer 
            {...commonProps} 
            generateRecommendedBudget={generateRecommendedBudget}
          />
        );
      case 5:
        return <BudgetReview {...commonProps} />;
      case 6:
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
      <div className="max-w-4xl mx-auto pt-8 pb-16 px-4">
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
            onClick={onCancel}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm underline"
          >
            Cancel & Exit
          </button>
        </div>
      </div>
    </div>
  );
};

export default BudgetCreationWizard;
