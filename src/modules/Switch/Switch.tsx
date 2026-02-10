import { useState } from 'react';
import { ModuleProps } from '../base/ModuleInterface';

/**
 * Module Switch - Bouton on/off simple
 * MVP: Affiche le nom du device et un bouton toggle
 */
export function Switch({ device, onCommand }: ModuleProps) {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleToggle = async () => {
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

  return (
    <div className="p-4 bg-white dark:bg-gray-800 rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-2">{device.name}</h3>
      <button
        onClick={handleToggle}
        disabled={loading}
        className={`
          px-4 py-2 rounded-lg transition-colors
          ${isOn ? 'bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700'}
          ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}
        `}
      >
        {loading ? 'Loading...' : isOn ? 'ON' : 'OFF'}
      </button>
    </div>
  );
}
