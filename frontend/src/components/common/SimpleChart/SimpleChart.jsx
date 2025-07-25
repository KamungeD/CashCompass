import React from 'react';
import { formatCurrency } from '../../../utils/helpers';

const SimpleChart = ({ data, type = 'bar', title, showLegend = true }) => {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          {title}
        </h3>
        <div className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      </div>
    );
  }

  // Find the maximum value for scaling
  const maxValue = Math.max(...data.map(item => item.value || item.amount || item.totalAmount || 0));
  
  // Color palette
  const colors = [
    'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-red-500', 'bg-purple-500',
    'bg-indigo-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
  ];

  const renderBarChart = () => (
    <div className="space-y-4">
      {data.slice(0, 10).map((item, index) => {
        const value = item.value || item.amount || item.totalAmount || 0;
        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
        const label = item.label || item.category || item.name || item.source || `Item ${index + 1}`;
        
        return (
          <div key={index} className="flex items-center space-x-4">
            <div className="w-24 text-sm text-gray-600 dark:text-gray-400 truncate">
              {label}
            </div>
            <div className="flex-1 flex items-center space-x-2">
              <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
                <div 
                  className={`h-full ${colors[index % colors.length]} transition-all duration-300`}
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <div className="w-20 text-sm font-medium text-gray-900 dark:text-gray-100 text-right">
                {formatCurrency(value)}
              </div>
              {item.percentage && (
                <div className="w-12 text-xs text-gray-500 dark:text-gray-400 text-right">
                  {item.percentage}%
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderPieChart = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Simple pie representation using stacked bars */}
      <div className="space-y-3">
        {data.slice(0, 8).map((item, index) => {
          const value = item.value || item.amount || item.totalAmount || 0;
          const percentage = item.percentage || ((value / maxValue) * 100);
          const label = item.label || item.category || item.name || item.source || `Item ${index + 1}`;
          
          return (
            <div key={index} className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className={`w-4 h-4 rounded-full ${colors[index % colors.length]}`} />
                <span className="text-sm text-gray-900 dark:text-gray-100">{label}</span>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(value)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  {typeof percentage === 'number' ? percentage.toFixed(1) : percentage}%
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {/* Visual pie representation */}
      <div className="flex items-center justify-center">
        <div className="relative w-48 h-48">
          <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {data.slice(0, 8).map((item, index) => {
              const value = item.value || item.amount || item.totalAmount || 0;
              const percentage = item.percentage || ((value / data.reduce((sum, d) => sum + (d.value || d.amount || d.totalAmount || 0), 0)) * 100);
              const startAngle = data.slice(0, index).reduce((sum, d) => {
                const prevValue = d.value || d.amount || d.totalAmount || 0;
                const prevPercentage = d.percentage || ((prevValue / data.reduce((s, item) => s + (item.value || item.amount || item.totalAmount || 0), 0)) * 100);
                return sum + (prevPercentage * 3.6);
              }, 0);
              const endAngle = startAngle + (percentage * 3.6);
              
              // Simple circle segments (approximation)
              const radius = 40;
              const x1 = 50 + radius * Math.cos((startAngle * Math.PI) / 180);
              const y1 = 50 + radius * Math.sin((startAngle * Math.PI) / 180);
              const x2 = 50 + radius * Math.cos((endAngle * Math.PI) / 180);
              const y2 = 50 + radius * Math.sin((endAngle * Math.PI) / 180);
              
              const largeArcFlag = percentage > 50 ? 1 : 0;
              const pathData = [
                `M 50 50`,
                `L ${x1} ${y1}`,
                `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                `Z`
              ].join(' ');
              
              return (
                <path
                  key={index}
                  d={pathData}
                  fill={`var(--color-${colors[index % colors.length].split('-')[1]}-500)`}
                  className={colors[index % colors.length].replace('bg-', 'fill-')}
                />
              );
            })}
          </svg>
        </div>
      </div>
    </div>
  );

  const renderLineChart = () => (
    <div className="space-y-4">
      <div className="h-64 flex items-end space-x-2">
        {data.map((item, index) => {
          const value = item.value || item.amount || item.totalAmount || 0;
          const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
          const label = item.label || item.month || item.category || `Point ${index + 1}`;
          
          return (
            <div key={index} className="flex-1 flex flex-col items-center space-y-2">
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {formatCurrency(value)}
              </div>
              <div 
                className={`w-full ${colors[index % colors.length]} rounded-t transition-all duration-300`}
                style={{ height: `${height}%`, minHeight: '2px' }}
              />
              <div className="text-xs text-gray-600 dark:text-gray-400 text-center truncate w-full">
                {label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-6">
          {title}
        </h3>
      )}
      
      {type === 'pie' && renderPieChart()}
      {type === 'bar' && renderBarChart()}
      {type === 'line' && renderLineChart()}
      
      {showLegend && data.length > 0 && (
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Total: {formatCurrency(data.reduce((sum, item) => sum + (item.value || item.amount || item.totalAmount || 0), 0))}
            {data.length > 10 && ` • Showing top ${Math.min(data.length, 10)} items`}
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleChart;
