import React from 'react';
import { formatCurrency } from '../../../utils/helpers';

const AnalyticsCard = ({ title, value, subtitle, icon: Icon, trend, color = 'blue' }) => {
  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50 dark:bg-blue-900/20',
        border: 'border-blue-200 dark:border-blue-800',
        text: 'text-blue-600 dark:text-blue-400',
        icon: 'text-blue-500 dark:text-blue-400'
      },
      green: {
        bg: 'bg-green-50 dark:bg-green-900/20',
        border: 'border-green-200 dark:border-green-800',
        text: 'text-green-600 dark:text-green-400',
        icon: 'text-green-500 dark:text-green-400'
      },
      red: {
        bg: 'bg-red-50 dark:bg-red-900/20',
        border: 'border-red-200 dark:border-red-800',
        text: 'text-red-600 dark:text-red-400',
        icon: 'text-red-500 dark:text-red-400'
      },
      yellow: {
        bg: 'bg-yellow-50 dark:bg-yellow-900/20',
        border: 'border-yellow-200 dark:border-yellow-800',
        text: 'text-yellow-600 dark:text-yellow-400',
        icon: 'text-yellow-500 dark:text-yellow-400'
      },
      purple: {
        bg: 'bg-purple-50 dark:bg-purple-900/20',
        border: 'border-purple-200 dark:border-purple-800',
        text: 'text-purple-600 dark:text-purple-400',
        icon: 'text-purple-500 dark:text-purple-400'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  const colors = getColorClasses(color);

  return (
    <div className={`${colors.bg} ${colors.border} border rounded-xl p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
            {title}
          </p>
          <p className={`text-2xl font-bold ${colors.text} mb-1`}>
            {typeof value === 'number' ? formatCurrency(value) : value}
          </p>
          {subtitle && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {subtitle}
            </p>
          )}
          {trend && (
            <div className="flex items-center mt-2">
              <span className={`text-sm font-medium ${
                trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 
                trend.direction === 'down' ? 'text-red-600 dark:text-red-400' : 
                'text-gray-600 dark:text-gray-400'
              }`}>
                {trend.direction === 'up' ? '↗' : trend.direction === 'down' ? '↘' : '→'} {trend.value}%
              </span>
              <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                vs {trend.period || 'last period'}
              </span>
            </div>
          )}
        </div>
        {Icon && (
          <div className={`${colors.icon} ml-4`}>
            <Icon className="h-8 w-8" />
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsCard;
