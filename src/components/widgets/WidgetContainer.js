'use client';

import { useEffect, useRef, useState } from 'react';
import { X, GripVertical, RefreshCw, AlertCircle, Settings, Trash2 } from 'lucide-react';
import StockTable from './StockTable';
import StockChart from './StockChart';
import FinanceCard from './FinanceCard';
import useDashboardStore from '@/store/dashboardStore';
import { fetchFromAPI, transformAPIData } from '@/services/apiService';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function WidgetContainer({ widget, dragListeners }) {
  const { removeWidget, updateWidgetData, setWidgetLoading, updateWidget } = useDashboardStore();
  const intervalRef = useRef(null);
  const [showSettings, setShowSettings] = useState(false);
  const [editConfig, setEditConfig] = useState({
    name: widget.name,
    refreshInterval: widget.refreshInterval,
  });

  // Fetch data from API
  const fetchData = async (skipCache = false) => {
    if (!widget.apiUrl) return;

    setWidgetLoading(widget.id, true);

    // Smart cache duration for finance data:
    // - For fast refresh (< 30s): cache for 3-5 seconds only
    // - For medium refresh (30-120s): cache for 1/4 of refresh interval
    // - For slow refresh (> 120s): cache for max 30 seconds
    // This ensures stock prices stay fresh while reducing API calls
    let cacheDuration;
    if (skipCache) {
      cacheDuration = 0;
    } else if (widget.refreshInterval < 30) {
      cacheDuration = Math.min(5, widget.refreshInterval / 3); // Max 5s for fast refresh
    } else if (widget.refreshInterval < 120) {
      cacheDuration = widget.refreshInterval / 4; // 1/4 of interval for medium
    } else {
      cacheDuration = Math.min(30, widget.refreshInterval / 4); // Max 30s for slow
    }

    const result = await fetchFromAPI(
      widget.apiUrl, 
      {}, 
      !skipCache, 
      cacheDuration
    );

    if (result.success) {
      // Transform data based on selected fields and widget type
      const transformedData = widget.selectedFields && widget.selectedFields.length > 0
        ? transformAPIData(result.data, widget.selectedFields, widget.type)
        : result.data;

      updateWidgetData(widget.id, transformedData, null);
      // Log cache status
      if (result.cached) {
        console.log(`[Widget ${widget.name}] Using cached data (age: ${Math.floor((Date.now() - result.cacheAge) / 1000)}s)`);
      } else {
        console.log(`[Widget ${widget.name}] Fresh API call - data cached for ${cacheDuration}s`);
      }
    } else {
      updateWidgetData(widget.id, null, result.error);
    }
  };

  // Initial fetch and setup auto-refresh
  useEffect(() => {
    fetchData();

    // Setup auto-refresh
    if (widget.refreshInterval && widget.refreshInterval > 0) {
      intervalRef.current = setInterval(() => {
        fetchData();
      }, widget.refreshInterval * 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [widget.id, widget.apiUrl, widget.refreshInterval]);

  const renderWidget = () => {
    if (widget.loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400" />
          <span className="ml-3 text-gray-600 dark:text-gray-400">Loading data...</span>
        </div>
      );
    }

    if (widget.error) {
      return (
        <div className="flex items-center gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800 dark:text-red-200">Error loading data</p>
            <p className="text-xs text-red-700 dark:text-red-300 mt-1">{widget.error}</p>
          </div>
        </div>
      );
    }

    if (!widget.data) {
      return (
        <div className="text-center text-gray-500 py-8">
          No data available
        </div>
      );
    }

    switch (widget.type) {
      case 'table':
        return <StockTable data={widget.data} title={widget.name} />;
      case 'chart':
        return (
          <StockChart
            data={widget.data}
            chartType={widget.chartConfig?.chartType || 'line'}
            xAxisKey={widget.chartConfig?.xAxisField}
            yAxisKey={widget.chartConfig?.yAxisField}
            title={widget.name}
          />
        );
      case 'card':
        return <FinanceCard data={widget.data} />;
      default:
        return <div>Unknown widget type</div>;
    }
  };

  const formatLastFetched = () => {
    if (!widget.lastFetched) return 'Never';
    const date = new Date(widget.lastFetched);
    const now = new Date();
    const diffSeconds = Math.floor((now - date) / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s ago`;
    if (diffSeconds < 3600) return `${Math.floor(diffSeconds / 60)}m ago`;
    return date.toLocaleTimeString();
  };

  const handleDelete = (e) => {
    e.stopPropagation(); // Prevent any parent events
    e.preventDefault();  // Prevent default behavior
    
    const confirmed = window.confirm(`Delete "${widget.name}" widget?`);
    if (confirmed) {
      removeWidget(widget.id);
    }
  };

  const handleSaveSettings = () => {
    updateWidget(widget.id, {
      name: editConfig.name,
      refreshInterval: editConfig.refreshInterval,
    });
    setShowSettings(false);
  };

  return (
    <>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden group">
        {/* Widget Header */}
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div {...dragListeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-5 h-5 text-gray-400 shrink-0" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">
                {widget.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Updated: {formatLastFetched()} • Refresh: {widget.refreshInterval}s
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                fetchData(true); // Skip cache, force fresh fetch
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Refresh now"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 dark:text-gray-300 ${widget.loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowSettings(true);
              }}
              className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Widget settings"
            >
              <Settings className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </button>
            <button
              onClick={handleDelete}
              className="p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
              title="Delete widget"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        </div>

        {/* Widget Content */}
        <div className="p-4">
          {renderWidget()}
        </div>
      </div>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        title="Widget Settings"
        size="medium"
        footer={
          <>
            <Button variant="secondary" onClick={() => setShowSettings(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveSettings}>
              Save Changes
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Widget Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Widget Name
            </label>
            <input
              type="text"
              value={editConfig.name}
              onChange={(e) => setEditConfig({ ...editConfig, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Refresh Interval */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Refresh Interval (seconds)
            </label>
            <input
              type="number"
              min="10"
              max="3600"
              value={editConfig.refreshInterval}
              onChange={(e) => setEditConfig({ ...editConfig, refreshInterval: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
          </div>

          {/* Widget Info */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Widget Information
            </h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Type:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100 capitalize">{widget.type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">API URL:</span>
                <span className="font-mono text-xs text-gray-900 dark:text-gray-100 truncate max-w-xs" title={widget.apiUrl}>
                  {widget.apiUrl}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Selected Fields:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {widget.selectedFields?.length || 0} fields
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Created:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {new Date(widget.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Selected Fields List */}
          {widget.selectedFields && widget.selectedFields.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Selected Fields
              </label>
              <div className="flex flex-wrap gap-2">
                {widget.selectedFields.map((field, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-mono"
                  >
                    {field.displayName}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
