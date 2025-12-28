'use client';

import { useState } from 'react';
import { ChevronRight, ChevronDown, Check } from 'lucide-react';

export default function JSONFieldExplorer({ jsonData, selectedFields = [], onFieldToggle }) {
  const [expandedPaths, setExpandedPaths] = useState(new Set());

  const toggleExpand = (path) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const renderValue = (value) => {
    if (value === null) return <span className="text-gray-400">null</span>;
    if (value === undefined) return <span className="text-gray-400">undefined</span>;
    if (typeof value === 'boolean') return <span className="text-blue-600">{value.toString()}</span>;
    if (typeof value === 'number') return <span className="text-green-600">{value}</span>;
    if (typeof value === 'string') return <span className="text-orange-600">"{value}"</span>;
    return value;
  };

  const renderJSON = (data, path = '') => {
    if (data === null || data === undefined) {
      return (
        <div className="ml-4 text-sm text-gray-500">
          {renderValue(data)}
        </div>
      );
    }

    if (Array.isArray(data)) {
      return (
        <div className="ml-4">
          <div className="text-xs text-gray-500 mb-1">Array ({data.length} items)</div>
          {data.length > 0 && (
            <div className="border-l-2 border-gray-200 dark:border-gray-700 pl-2">
              <div className="text-xs text-gray-500 mb-1">[0]:</div>
              {renderJSON(data[0], `${path}[0]`)}
            </div>
          )}
        </div>
      );
    }

    if (typeof data === 'object') {
      return (
        <div className="ml-4 space-y-1">
          {Object.keys(data).map((key) => {
            const value = data[key];
            const currentPath = path ? `${path}.${key}` : key;
            const isExpandable = typeof value === 'object' && value !== null;
            const isExpanded = expandedPaths.has(currentPath);
            const isSelected = selectedFields.some(f => f.path === currentPath);

            return (
              <div key={currentPath} className="text-sm">
                <div className="flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700/50 p-1 rounded group">
                  {isExpandable ? (
                    <button
                      onClick={() => toggleExpand(currentPath)}
                      className="p-0.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      )}
                    </button>
                  ) : (
                    <div className="w-5" />
                  )}

                  <button
                    onClick={() => !isExpandable && onFieldToggle(currentPath, key, typeof value)}
                    className={`flex items-center gap-2 flex-1 ${
                      !isExpandable ? 'cursor-pointer' : 'cursor-default'
                    }`}
                    disabled={isExpandable}
                  >
                    <span className="font-mono text-blue-700 dark:text-blue-400">{key}:</span>
                    
                    {!isExpandable && (
                      <>
                        <span className="flex-1 text-left truncate">
                          {renderValue(value)}
                        </span>
                        {isSelected && (
                          <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                        )}
                        {!isSelected && (
                          <span className="text-xs text-gray-400 opacity-0 group-hover:opacity-100">
                            Click to select
                          </span>
                        )}
                      </>
                    )}
                    
                    {isExpandable && (
                      <span className="text-xs text-gray-500">
                        {Array.isArray(value) ? `Array(${value.length})` : 'Object'}
                      </span>
                    )}
                  </button>
                </div>

                {isExpanded && isExpandable && (
                  <div className="border-l-2 border-gray-200 dark:border-gray-700 ml-2">
                    {renderJSON(value, currentPath)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      );
    }

    return <div className="ml-4 text-sm">{renderValue(data)}</div>;
  };

  if (!jsonData) {
    return (
      <div className="text-center text-gray-500 py-8">
        No data available. Test the API endpoint first.
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 max-h-96 overflow-auto border border-gray-200 dark:border-gray-700">
      <div className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
        JSON Structure (Click on fields to select)
      </div>
      {renderJSON(jsonData)}
    </div>
  );
}
