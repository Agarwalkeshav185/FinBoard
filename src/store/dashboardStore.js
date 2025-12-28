import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useDashboardStore = create(
  persist(
    (set, get) => ({
      widgets: [],
      
      // Add a new widget with dynamic API configuration
      addWidget: (widget) => {
        const newWidget = {
          id: Date.now().toString(),
          ...widget,
          data: null, // Will hold fetched API data
          loading: false,
          error: null,
          lastFetched: null,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          widgets: [...state.widgets, newWidget],
        }));
      },

      // Remove a widget
      removeWidget: (widgetId) => {
        set((state) => ({
          widgets: state.widgets.filter((w) => w.id !== widgetId),
        }));
      },

      // Update widget configuration or data
      updateWidget: (widgetId, updates) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === widgetId ? { ...w, ...updates } : w
          ),
        }));
      },

      // Update widget data after API fetch
      updateWidgetData: (widgetId, data, error = null) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === widgetId
              ? {
                  ...w,
                  data,
                  error,
                  loading: false,
                  lastFetched: new Date().toISOString(),
                }
              : w
          ),
        }));
      },

      // Set widget loading state
      setWidgetLoading: (widgetId, loading) => {
        set((state) => ({
          widgets: state.widgets.map((w) =>
            w.id === widgetId ? { ...w, loading } : w
          ),
        }));
      },

      // Reorder widgets (for drag and drop)
      reorderWidgets: (newOrder) => {
        set({ widgets: newOrder });
      },

      // Clear all widgets
      clearWidgets: () => {
        set({ widgets: [] });
      },
    }),
    {
      name: 'finance-dashboard-storage',
    }
  )
);

export default useDashboardStore;
