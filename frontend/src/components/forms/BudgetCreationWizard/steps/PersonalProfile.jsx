import React, { useState } from 'react';
import { 
  User, 
  Home, 
  Users, 
  MapPin, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';
import Button from '../../../common/Button/Button';
import Input from '../../../common/Input/Input';

const PersonalProfile = ({ wizardData, updateWizardData, goToNextStep, goToPreviousStep }) => {
  const [profile, setProfile] = useState(wizardData.profile || {
    ageRange: '',
    livingSituation: '',
    lifeStage: '',
    dependents: 0,
    location: ''
  });

  const ageRanges = [
    { value: '18-25', label: '18-25 years' },
    { value: '26-35', label: '26-35 years' },
    { value: '36-45', label: '36-45 years' },
    { value: '46-55', label: '46-55 years' },
    { value: '56-65', label: '56-65 years' },
    { value: '65+', label: '65+ years' }
  ];

  const livingSituations = [
    { value: 'with-parents', label: 'Living with parents/family' },
    { value: 'renting-alone', label: 'Renting alone' },
    { value: 'renting-shared', label: 'Renting with roommates' },
    { value: 'own-home', label: 'Own home' },
    { value: 'other', label: 'Other arrangement' }
  ];

  const lifeStages = [
    { value: 'student', label: 'Student' },
    { value: 'young-professional', label: 'Young professional' },
    { value: 'family-with-kids', label: 'Family with kids' },
    { value: 'established-career', label: 'Established career' },
    { value: 'approaching-retirement', label: 'Approaching retirement' }
  ];

  const updateProfile = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleContinue = () => {
    updateWizardData('profile', profile);
    goToNextStep();
  };

  const canSkip = () => {
    // Allow skipping if at least age range is provided
    return profile.ageRange || profile.lifeStage;
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
          Tell us about your situation
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
          This helps us provide more accurate budget recommendations tailored to your lifestyle.
        </p>
      </div>

      {/* Profile Form */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 mb-8">
        <div className="space-y-8">
          {/* Age Range */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              <User className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400" />
              Age Range
            </label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {ageRanges.map(range => (
                <button
                  key={range.value}
                  onClick={() => updateProfile('ageRange', range.value)}
                  className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm font-medium ${
                    profile.ageRange === range.value
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>

          {/* Living Situation */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              <Home className="h-5 w-5 mr-2 text-green-600 dark:text-green-400" />
              Living Situation
            </label>
            <div className="space-y-3">
              {livingSituations.map(situation => (
                <button
                  key={situation.value}
                  onClick={() => updateProfile('livingSituation', situation.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    profile.livingSituation === situation.value
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {situation.label}
                </button>
              ))}
            </div>
          </div>

          {/* Life Stage */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              <Users className="h-5 w-5 mr-2 text-purple-600 dark:text-purple-400" />
              Life Stage
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {lifeStages.map(stage => (
                <button
                  key={stage.value}
                  onClick={() => updateProfile('lifeStage', stage.value)}
                  className={`p-4 rounded-lg border-2 transition-all duration-200 text-left ${
                    profile.lifeStage === stage.value
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                      : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {stage.label}
                </button>
              ))}
            </div>
          </div>

          {/* Dependents */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              <Users className="h-5 w-5 mr-2 text-orange-600 dark:text-orange-400" />
              Number of Dependents
            </label>
            <div className="max-w-xs">
              <Input
                type="number"
                min="0"
                max="20"
                placeholder="0"
                value={profile.dependents || 0}
                onChange={(e) => updateProfile('dependents', parseInt(e.target.value) || 0)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Include children, elderly parents, or anyone financially dependent on you
              </p>
            </div>
          </div>

          {/* Location (Optional) */}
          <div>
            <label className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
              <MapPin className="h-5 w-5 mr-2 text-red-600 dark:text-red-400" />
              Location (Optional)
            </label>
            <div className="max-w-md">
              <Input
                placeholder="e.g., Nairobi, Mombasa, Kisumu"
                value={profile.location || ''}
                onChange={(e) => updateProfile('location', e.target.value)}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                This may help with cost-of-living adjustments in future updates
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-8">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          <strong>Privacy Note:</strong> This information is used only to improve your budget recommendations. 
          You can skip any questions you're not comfortable answering.
        </p>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          onClick={goToPreviousStep}
          variant="outline"
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back</span>
        </Button>

        <div className="space-x-4">
          <Button
            onClick={handleContinue}
            variant="outline"
            className="text-gray-600 dark:text-gray-400"
          >
            Skip for now
          </Button>
          
          <Button
            onClick={handleContinue}
            size="lg"
            className="flex items-center space-x-2 px-8"
          >
            <span>Continue</span>
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PersonalProfile;
