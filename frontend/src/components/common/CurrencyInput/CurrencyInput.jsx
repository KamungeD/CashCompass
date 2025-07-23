import React, { useState, useEffect } from 'react';
import { cn } from '../../../utils/helpers';

const CurrencyInput = React.forwardRef(({ 
  label,
  error,
  helperText,
  className,
  value,
  onChange,
  placeholder = "Enter amount",
  currency = "KES",
  ...props 
}, ref) => {
  const [displayValue, setDisplayValue] = useState('');

  // Format number with commas for display
  const formatDisplayValue = (num) => {
    if (!num) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  // Remove commas and parse to number
  const parseValue = (str) => {
    if (!str) return '';
    const cleaned = str.replace(/,/g, '');
    return cleaned;
  };

  useEffect(() => {
    if (value !== undefined && value !== null) {
      setDisplayValue(formatDisplayValue(value));
    }
  }, [value]);

  const handleChange = (e) => {
    const input = e.target.value;
    
    // Remove currency symbol, commas, and non-numeric characters except for digits
    const cleanedInput = input.replace(/[^\d]/g, '');
    
    // If empty, handle as empty
    if (!cleanedInput) {
      setDisplayValue('');
      if (onChange) {
        onChange({ ...e, target: { ...e.target, value: '' } });
      }
      return;
    }

    // Format for display
    const formatted = formatDisplayValue(cleanedInput);
    setDisplayValue(formatted);

    // Call onChange with the numeric value
    if (onChange) {
      onChange({ ...e, target: { ...e.target, value: cleanedInput } });
    }
  };

  const handleBlur = (e) => {
    // Ensure proper formatting on blur
    if (displayValue) {
      const numericValue = parseValue(displayValue);
      if (numericValue) {
        setDisplayValue(formatDisplayValue(numericValue));
      }
    }
    
    if (props.onBlur) {
      props.onBlur(e);
    }
  };

  return (
    <div className="space-y-1">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">
            {currency}
          </span>
        </div>
        
        <input
          ref={ref}
          type="text"
          inputMode="numeric"
          pattern="[0-9,]*"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder={placeholder}
          className={cn(
            "block w-full rounded-lg border border-gray-300 pl-14 pr-3 py-2 text-sm transition-colors",
            "placeholder:text-gray-400 focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500",
            "dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100 dark:placeholder:text-gray-500",
            "dark:focus:border-primary-400 dark:focus:ring-primary-400",
            error && "border-red-500 focus:border-red-500 focus:ring-red-500",
            "disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </div>
      
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
      
      {helperText && !error && (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {helperText}
        </p>
      )}
    </div>
  );
});

CurrencyInput.displayName = 'CurrencyInput';

export default CurrencyInput;
