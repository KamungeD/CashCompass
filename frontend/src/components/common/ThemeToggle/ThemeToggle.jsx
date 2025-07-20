import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { cn } from '../../../utils/helpers';

const ThemeToggle = ({ className, ...props }) => {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-100 dark:focus:ring-offset-gray-800",
        className
      )}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      {...props}
    >
      <Sun className={cn(
        "h-5 w-5 transition-all duration-200",
        isDark ? "rotate-90 scale-0" : "rotate-0 scale-100"
      )} />
      <Moon className={cn(
        "absolute h-5 w-5 transition-all duration-200",
        isDark ? "rotate-0 scale-100" : "-rotate-90 scale-0"
      )} />
    </button>
  );
};

export default ThemeToggle;
