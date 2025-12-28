'use client';

import { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import JSONFieldExplorer from './JSONFieldExplorer';
import { testAPIEndpoint } from '@/services/apiService';
import { Loader2, CheckCircle, AlertCircle, ExternalLink } from 'lucide-react';

export default function AddWidgetModal({ isOpen, onClose, onAdd }) {
  const [widgetConfig, setWidgetConfig] = useState({
    name: '',
    type: 'table', // table, chart, card
    apiUrl: '',
    refreshInterval: 60, // seconds
    selectedFields: [],
    chartConfig: {
      chartType: 'line', // line, area, bar
      xAxisField: '',
      yAxisField: '',
    },
  });

  const [apiTest, setApiTest] = useState({
    loading: false,
    tested: false,
    success: false,
    data: null,
    paths: [],
    error: null,
  });

  const handleTestAPI = async () => {
    if (!widgetConfig.apiUrl) {
      return;
    }

    setApiTest({ ...apiTest, loading: true, tested: false });

    const result = await testAPIEndpoint(widgetConfig.apiUrl);

    setApiTest({
      loading: false,
      tested: true,
      success: result.success,
      data: result.data,
      paths: result.paths || [],
      error: result.error,
    });
  };

  const handleFieldToggle = (path, displayName, type) => {
    const existing = widgetConfig.selectedFields.find(f => f.path === path);
    
    if (existing) {
      setWidgetConfig({
        ...widgetConfig,
        selectedFields: widgetConfig.selectedFields.filter(f => f.path !== path),
      });
    } else {
      setWidgetConfig({
        ...widgetConfig,
        selectedFields: [
          ...widgetConfig.selectedFields,
          { path, displayName, type },
        ],
      });
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!widgetConfig.name.trim() || !widgetConfig.apiUrl || widgetConfig.selectedFields.length === 0) {
      alert('Please fill in all required fields and select at least one data field');
      return;
    }

    onAdd(widgetConfig);
    
    // Reset form
    setWidgetConfig({
      name: '',
      type: 'table',
      apiUrl: '',
      refreshInterval: 60,
      selectedFields: [],
      chartConfig: {
        chartType: 'line',
        xAxisField: '',
        yAxisField: '',
      },
    });
    setApiTest({
      loading: false,
      tested: false,
      success: false,
      data: null,
      paths: [],
      error: null,
    });
    onClose();
  };


  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Widget"
      size="large"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleSubmit}
            disabled={!widgetConfig.name || !widgetConfig.apiUrl || widgetConfig.selectedFields.length === 0}
          >
            Add Widget
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        {/* Widget Name */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Widget Name *
          </label>
          <input
            type="text"
            value={widgetConfig.name}
            onChange={(e) => setWidgetConfig({ ...widgetConfig, name: e.target.value })}
            placeholder="My Widget Title"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* Widget Type */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Widget Type
          </label>
          <select
            value={widgetConfig.type}
            onChange={(e) => setWidgetConfig({ ...widgetConfig, type: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="table">Table</option>
            <option value="chart">Chart</option>
            <option value="card">Card</option>
          </select>
          
          {/* Chart Info */}
          {widgetConfig.type === 'chart' && (
            <div className="mt-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-amber-800 dark:text-amber-200">
                <strong>📊 Chart Tips:</strong> For single-value APIs (like Coinbase), select <strong>multiple currency fields</strong> (e.g., BTC, ETH, EUR). 
                Each field will become a bar/point in the chart showing their values.
              </p>
            </div>
          )}
        </div>

        {/* API URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            API URL *
          </label>
          <div className="flex gap-2">
            <input
              type="url"
              value={widgetConfig.apiUrl}
              onChange={(e) => setWidgetConfig({ ...widgetConfig, apiUrl: e.target.value })}
              placeholder="https://api.coinbase.com/v2/exchange-rates?currency=USD"
              className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
            />
            <Button
              variant="primary"
              onClick={handleTestAPI}
              disabled={!widgetConfig.apiUrl || apiTest.loading}
            >
              {apiTest.loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {apiTest.loading ? 'Testing...' : 'Test'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Example: https://api.coinbase.com/v2/exchange-rates?currency=USD
          </p>
        </div>

        {/* API Test Result */}
        {apiTest.tested && (
          <div className={`p-3 rounded-lg ${
            apiTest.success
              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
              : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
          }`}>
            <div className="flex items-start gap-2">
              {apiTest.success ? (
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              )}
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  apiTest.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
                }`}>
                  {apiTest.success ? 'Connection Successful!' : 'Connection Failed'}
                </p>
                {apiTest.error && (
                  <p className="text-xs text-red-700 dark:text-red-300 mt-1">{apiTest.error}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Refresh Interval */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Refresh Interval (seconds)
          </label>
          <input
            type="number"
            min="10"
            max="3600"
            value={widgetConfig.refreshInterval}
            onChange={(e) => setWidgetConfig({ ...widgetConfig, refreshInterval: parseInt(e.target.value) || 60 })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          />
        </div>

        {/* JSON Field Explorer - Shows after successful API test */}
        {apiTest.success && apiTest.data && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Select Fields to Display *
            </label>
            
            <JSONFieldExplorer
              jsonData={apiTest.data}
              selectedFields={widgetConfig.selectedFields}
              onFieldToggle={handleFieldToggle}
            />

            {/* Selected Fields Summary */}
            {widgetConfig.selectedFields.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Selected: {widgetConfig.selectedFields.length} field(s)
                </p>
                <div className="flex flex-wrap gap-2">
                  {widgetConfig.selectedFields.map((field) => (
                    <span
                      key={field.path}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded text-xs font-mono"
                    >
                      {field.displayName}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chart Configuration - Only show if type is chart and fields are selected */}
        {widgetConfig.type === 'chart' && widgetConfig.selectedFields.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Chart Configuration</h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Chart Type
              </label>
              <select
                value={widgetConfig.chartConfig.chartType}
                onChange={(e) => setWidgetConfig({
                  ...widgetConfig,
                  chartConfig: { ...widgetConfig.chartConfig, chartType: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="line">Line Chart</option>
                <option value="area">Area Chart</option>
                <option value="bar">Bar Chart</option>
              </select>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

