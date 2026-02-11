import { useState, useEffect } from 'react';
import type { WidgetComponentProps } from '../../types';
import { api } from '../../services/api';

/**
 * Widget Switch - Bouton on/off simple
 * Utilise la nouvelle architecture avec GenericDevice et capabilities
 */
export function Switch({ dashboardWidget, onCommand }: WidgetComponentProps) {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const device = dashboardWidget.GenericDevice;

  // Charger l'état initial du device
  useEffect(() => {
    loadDeviceState();
  }, [device?.id]);

  const loadDeviceState = async () => {
    if (!device?.id) return;

    try {
      const { state } = await api.getDeviceState(device.id);
      if (state.isOn !== undefined) {
        setIsOn(state.isOn);
      }
    } catch (error) {
      console.error('Failed to load device state:', error);
    }
  };

  const handleToggle = async () => {
    if (!device?.capabilities.toggle) {
      console.error('Toggle capability not available for', device?.name);
      return;
    }

    setLoading(true);
    try {
      await onCommand('toggle');
      setIsOn(!isOn);
    } catch (error) {
      console.error('Failed to toggle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!device) {
    return (
      <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
        <p className="text-red-500">No device connected</p>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          {device.name}
        </h3>
        <span className="text-xs text-gray-500 dark:text-gray-400 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded">
          {device.type}
        </span>
      </div>

      <button
        onClick={handleToggle}
        disabled={loading || !device.capabilities.toggle}
        className={`
          w-full px-4 py-3 rounded-lg font-medium transition-all
          ${isOn
            ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-md'
            : 'bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200'
          }
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}
          disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:scale-100
        `}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Loading...
          </span>
        ) : (
          <span className="text-lg">{isOn ? '● ON' : '○ OFF'}</span>
        )}
      </button>

      {!device.capabilities.toggle && (
        <p className="mt-2 text-xs text-red-500">Toggle capability not available</p>
      )}
    </div>
  );
}
