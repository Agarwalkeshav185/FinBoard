'use client';

import { DollarSign } from 'lucide-react';

export default function FinanceCard({ data = [] }) {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        No data available
      </div>
    );
  }

  

  // Get all keys from first data item
  const keys = Object.keys(data[0] || {});
  
  // Limit to first 5 items for card display
  const displayData = data.slice(0, 5);

  const formatValue = (value) => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'number') {
      return value % 1 !== 0 ? value.toFixed(2) : value.toLocaleString();
    }
    return String(value);
  };

  const getValueColor = (value, key) => {
    if (typeof value !== 'number') return 'text-gray-900 dark:text-gray-100';
    
    // Color for change-related fields
    if (key.toLowerCase().includes('change') || key.toLowerCase().includes('percent')) {
      return value > 0 ? 'text-green-600 dark:text-green-400' : 
             value < 0 ? 'text-red-600 dark:text-red-400' : 
             'text-gray-900 dark:text-gray-100';
    }
    
    return 'text-gray-900 dark:text-gray-100';
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4 p-3 rounded-lg bg-blue-100 dark:bg-blue-900/30">
        <div className="text-blue-600">
          <DollarSign className="w-6 h-6" />
        </div>
        <h3 className="font-semibold text-blue-600">
          Summary View
        </h3>
      </div>

      {/* Data Cards */}
      <div className="space-y-3">
        {displayData.map((item, index) => (
          <div 
            key={index}
            className="p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            {/* Display all key-value pairs for this item */}
            <div className="grid grid-cols-2 gap-2">
              {keys.map((key) => (
                <div key={key}>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                    {key}
                  </div>
                  <div className={`text-sm font-medium ${getValueColor(item[key], key)}`}>
                    {formatValue(item[key])}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
