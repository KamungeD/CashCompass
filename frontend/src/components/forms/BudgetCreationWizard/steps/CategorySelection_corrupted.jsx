import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Check, ChevronRight, ChevronLeft, Info, Grid3X3, List } from 'luci  const toggleCategory = useCallback((categoryName) => {
    // Immediate flag check to prevent double execution
    if (isProcessingRef.current) {
      console.log('🚫 Already processing, ignoring category toggle:', categoryName);
      return;
    }
    
    isProcessingRef.current = true;
    console.log('🔄 Toggling category:', categoryName);;
import Button from '../../../common/Button/Button';

// Default categories and subcategories based on the template
const DEFAULT_CATEGORIES = [
  {
    name: 'Housing',
    description: 'Rent, utilities, and home maintenance',
    isEssential: true,
    subcategories: [
      { name: 'Rent/Mortgage', essential: true },
      { name: 'Utilities', essential: true },
      { name: 'Phone', essential: true },
      { name: 'Internet', essential: true },
      { name: 'Supplies Shopping', essential: false },
      { name: 'Rental Management', essential: false }
    ]
  },
  {
    name: 'Transportation',
    description: 'Vehicle costs, fuel, and public transport',
    isEssential: true,
    subcategories: [
      { name: 'Fuel', essential: true },
      { name: 'Bus/taxi fare', essential: true },
      { name: 'Insurance', essential: true },
      { name: 'Licensing', essential: false }
    ]
  },
  {
    name: 'Food',
    description: 'Groceries and dining expenses',
    isEssential: true,
    subcategories: [
      { name: 'Groceries Shopping', essential: true },
      { name: 'Water', essential: true },
      { name: 'Dining out', essential: false },
      { name: 'Office lunch', essential: false },
      { name: 'Energy drinks', essential: false }
    ]
  },
  {
    name: 'Personal Care',
    description: 'Health, grooming, and clothing',
    isEssential: true,
    subcategories: [
      { name: 'Medical', essential: true },
      { name: 'Grooming Shopping', essential: true },
      { name: 'Hair/nails', essential: false },
      { name: 'Clothing', essential: false },
      { name: 'Haircare Products', essential: false },
      { name: 'Skincare Products', essential: false }
    ]
  },
  {
    name: 'Insurance',
    description: 'Health and other insurance coverage',
    isEssential: true,
    subcategories: [
      { name: 'Health', essential: true }
    ]
  },
  {
    name: 'Loans',
    description: 'Loan payments and debt service',
    isEssential: true,
    subcategories: [
      { name: 'Mortgage', essential: false },
      { name: 'Personal Loans', essential: false },
      { name: 'Student Loans', essential: false }
    ]
  },
  {
    name: 'Entertainment',
    description: 'Leisure activities and subscriptions',
    isEssential: false,
    subcategories: [
      { name: 'Streaming Services', essential: false },
      { name: 'Dates', essential: false },
      { name: 'Cinema', essential: false },
      { name: 'Hobbies', essential: false },
      { name: 'Music Subscriptions', essential: false }
    ]
  },
  {
    name: 'Pets',
    description: 'Pet care and maintenance',
    isEssential: false,
    subcategories: [
      { name: 'Food', essential: false },
      { name: 'Medical', essential: false },
      { name: 'Grooming', essential: false },
      { name: 'Toys', essential: false }
    ]
  },
  {
    name: 'Savings/Investments',
    description: 'Emergency fund and investment accounts',
    isEssential: true,
    subcategories: [
      { name: 'Emergency Fund', essential: true },
      { name: 'Retirement account', essential: true },
      { name: 'Investment account', essential: false },
      { name: 'Annual Payments Fund', essential: false }
    ]
  }
];

const CategorySelection = ({ 
  wizardData, 
  updateWizardData, 
  goToNextStep, 
  goToPreviousStep 
}) => {
  const [selectedCategories, setSelectedCategories] = useState({});
  const [expandedCategories, setExpandedCategories] = useState({});
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' or 'list'
  const isProcessingRef = useRef(false);

  // Initialize selected categories from wizard data or set defaults
  useEffect(() => {
    if (wizardData.selectedCategories && Object.keys(wizardData.selectedCategories).length > 0) {
      setSelectedCategories(wizardData.selectedCategories);
    } else {
      // Default to all essential categories and subcategories
      const defaults = {};
      DEFAULT_CATEGORIES.forEach(category => {
        defaults[category.name] = {
          selected: category.isEssential,
          subcategories: {}
        };
        category.subcategories.forEach(subcategory => {
          defaults[category.name].subcategories[subcategory.name] = subcategory.essential;
        });
      });
      setSelectedCategories(defaults);
    }

    // Expand essential categories by default
    const expanded = {};
    DEFAULT_CATEGORIES.forEach(category => {
      if (category.isEssential) {
        expanded[category.name] = true;
      }
    });
    setExpandedCategories(expanded);
  }, [wizardData.selectedCategories]);

  const toggleCategory = useCallback((categoryName) => {
    const now = Date.now();
    if (now - lastToggleTime.current < 500) { // Prevent rapid successive calls
      console.log('� Preventing rapid toggle for category:', categoryName);
      return;
    }
    lastToggleTime.current = now;
    
    console.log('🔄 Toggling category:', categoryName);
    
    setSelectedCategories(prev => {
      const newSelected = { ...prev };
      const isCurrentlySelected = newSelected[categoryName]?.selected || false;
      console.log('📊 Current state for', categoryName, ':', isCurrentlySelected);
      
      if (!newSelected[categoryName]) {
        newSelected[categoryName] = { selected: false, subcategories: {} };
      }
      
      newSelected[categoryName].selected = !isCurrentlySelected;
      
      // If deselecting category, deselect all subcategories
      if (!newSelected[categoryName].selected) {
        Object.keys(newSelected[categoryName].subcategories).forEach(subcat => {
          newSelected[categoryName].subcategories[subcat] = false;
        });
      } else {
        // If selecting category, select essential subcategories
        const category = DEFAULT_CATEGORIES.find(c => c.name === categoryName);
        if (category) {
          category.subcategories.forEach(subcategory => {
            if (subcategory.essential) {
              newSelected[categoryName].subcategories[subcategory.name] = true;
            }
          });
        }
      }
      
      console.log('✅ New state for', categoryName, ':', newSelected[categoryName]);
      return newSelected;
    });
  }, []);

  const toggleSubcategory = useCallback((categoryName, subcategoryName) => {
    const now = Date.now();
    if (now - lastToggleTime.current < 500) { // Prevent rapid successive calls
      console.log('� Preventing rapid toggle for subcategory:', categoryName, '->', subcategoryName);
      return;
    }
    lastToggleTime.current = now;
    
    console.log('🔄 Toggling subcategory:', categoryName, '->', subcategoryName);
    
    setSelectedCategories(prev => {
      const newSelected = { ...prev };
      
      if (!newSelected[categoryName]) {
        newSelected[categoryName] = { selected: false, subcategories: {} };
      }
      
      const currentValue = newSelected[categoryName].subcategories[subcategoryName] || false;
      newSelected[categoryName].subcategories[subcategoryName] = !currentValue;
      
      // Check if any subcategories are selected to determine category selection
      const hasSelectedSubcategories = Object.values(newSelected[categoryName].subcategories).some(selected => selected);
      newSelected[categoryName].selected = hasSelectedSubcategories;
      
      console.log('✅ New subcategory state:', subcategoryName, '=', !currentValue);
      return newSelected;
    });
  }, []);

  const toggleCategoryExpansion = (categoryName) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryName]: !prev[categoryName]
    }));
  };

  const getSelectedCount = () => {
    let categoryCount = 0;
    let subcategoryCount = 0;
    
    Object.values(selectedCategories).forEach(category => {
      if (category.selected) categoryCount++;
      subcategoryCount += Object.values(category.subcategories || {}).filter(Boolean).length;
    });
    
    return { categories: categoryCount, subcategories: subcategoryCount };
  };

  const handleNext = () => {
    updateWizardData('selectedCategories', selectedCategories);
    goToNextStep();
  };

  const selectAllEssential = () => {
    const newSelected = {};
    DEFAULT_CATEGORIES.forEach(category => {
      newSelected[category.name] = {
        selected: category.isEssential,
        subcategories: {}
      };
      category.subcategories.forEach(subcategory => {
        newSelected[category.name].subcategories[subcategory.name] = subcategory.essential;
      });
    });
    setSelectedCategories(newSelected);
  };

  const selectAll = () => {
    const newSelected = {};
    DEFAULT_CATEGORIES.forEach(category => {
      newSelected[category.name] = {
        selected: true,
        subcategories: {}
      };
      category.subcategories.forEach(subcategory => {
        newSelected[category.name].subcategories[subcategory.name] = true;
      });
    });
    setSelectedCategories(newSelected);
  };

  const deselectAll = () => {
    const newSelected = {};
    DEFAULT_CATEGORIES.forEach(category => {
      newSelected[category.name] = {
        selected: false,
        subcategories: {}
      };
      category.subcategories.forEach(subcategory => {
        newSelected[category.name].subcategories[subcategory.name] = false;
      });
    });
    setSelectedCategories(newSelected);
  };

  const counts = getSelectedCount();
  const canProceed = counts.categories > 0 && counts.subcategories > 0;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          Customize Your Budget Categories
        </h2>
        <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
          Choose which categories and subcategories you want to include in your budget recommendations. 
          Essential categories are pre-selected, but you can customize based on your lifestyle.
        </p>
      </div>

      {/* Selection Summary */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            <span className="text-blue-800 dark:text-blue-200 font-medium">
              Selected: {counts.categories} categories, {counts.subcategories} subcategories
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'grouped' ? 'list' : 'grouped')}
              className="p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded-lg transition-colors"
              title={`Switch to ${viewMode === 'grouped' ? 'list' : 'grouped'} view`}
            >
              {viewMode === 'grouped' ? <List className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={selectAllEssential}
          className="px-4 py-2 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
        >
          Essential Only
        </button>
        <button
          onClick={selectAll}
          className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
        >
          Select All
        </button>
        <button
          onClick={deselectAll}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          Deselect All
        </button>
      </div>

      {/* Categories */}
      <div className="space-y-4 mb-8">
        {DEFAULT_CATEGORIES.map((category) => {
          const isSelected = selectedCategories[category.name]?.selected || false;
          const isExpanded = expandedCategories[category.name] || false;
          const selectedSubcategories = Object.values(selectedCategories[category.name]?.subcategories || {}).filter(Boolean).length;

          return (
            <div
              key={category.name}
              className={`border-2 rounded-lg transition-all duration-200 ${
                isSelected
                  ? 'border-blue-300 dark:border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800'
              }`}
            >
              {/* Category Header */}
              <div className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    {/* Category Checkbox */}
                    <div 
                      className="flex items-center cursor-pointer"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                      }}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        e.nativeEvent.stopImmediatePropagation();
                        toggleCategory(category.name);
                      }}
                    >
                      <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                          isSelected
                            ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                        }`}
                      >
                        {isSelected && <Check className="h-3 w-3 stroke-2" />}
                      </div>
                    </div>
                    
                    {/* Category Info */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => toggleCategoryExpansion(category.name)}
                    >
                      <h3 className="font-semibold text-gray-900 dark:text-white flex items-center space-x-2">
                        <span>{category.name}</span>
                        {category.isEssential && (
                          <span className="px-2 py-1 text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 rounded-full">
                            Essential
                          </span>
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {category.description}
                        {selectedSubcategories > 0 && (
                          <span className="ml-2 text-blue-600 dark:text-blue-400 font-medium">
                            ({selectedSubcategories} selected)
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  
                  {/* Expand/Collapse Button */}
                  <button
                    onClick={() => toggleCategoryExpansion(category.name)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight
                      className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Subcategories */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-200 dark:border-gray-700 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {category.subcategories.map((subcategory) => {
                      const isSubSelected = selectedCategories[category.name]?.subcategories[subcategory.name] || false;

                      return (
                        <div
                          key={subcategory.name}
                          className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer group transition-colors"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                          }}
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            e.nativeEvent.stopImmediatePropagation();
                            toggleSubcategory(category.name, subcategory.name);
                          }}
                        >
                          {/* Subcategory Checkbox */}
                          <div
                            className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all duration-200 ${
                              isSubSelected
                                ? 'bg-blue-600 border-blue-600 text-white shadow-sm'
                                : 'border-gray-300 dark:border-gray-600 group-hover:border-blue-400 group-hover:bg-blue-50 dark:group-hover:bg-blue-900/20'
                            }`}
                          >
                            {isSubSelected && <Check className="h-2.5 w-2.5 stroke-2" />}
                          </div>
                          
                          {/* Subcategory Label */}
                          <div className="flex-1">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center space-x-2">
                              <span>{subcategory.name}</span>
                              {subcategory.essential && (
                                <span className="px-1.5 py-0.5 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">
                                  Essential
                                </span>
                              )}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <Button
          variant="outline"
          onClick={goToPreviousStep}
          className="flex items-center space-x-2"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Previous</span>
        </Button>

        <Button
          onClick={handleNext}
          disabled={!canProceed}
          className="flex items-center space-x-2"
        >
          <span>Continue to Recommendations</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {!canProceed && (
        <p className="text-center text-sm text-amber-600 dark:text-amber-400 mt-4">
          Please select at least one category and subcategory to continue
        </p>
      )}
    </div>
  );
};

export default CategorySelection;
