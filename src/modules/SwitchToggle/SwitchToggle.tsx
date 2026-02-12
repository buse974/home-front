import { useState, useEffect } from 'react';
import type { WidgetComponentProps } from '../../types';
import { api } from '../../services/api';

/**
 * Widget SwitchToggle - Design minimaliste avec toggle horizontal
 * Supporte plusieurs devices (tous contrôlés ensemble)
 */
export function SwitchToggle({ dashboardWidget }: WidgetComponentProps) {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const devices = dashboardWidget.GenericDevices || [];

  // Nom d'affichage : custom ou concaténation
  const displayName = dashboardWidget.name || devices.map(d => d.name).join(', ');

  // Vérifier si au moins un device a la capability toggle
  const hasToggleCapability = devices.some(d => d.capabilities?.toggle);

  // Log capability error with full device details
  useEffect(() => {
    if (devices.length > 0 && !hasToggleCapability) {
      console.error('❌ Widget capability error:', {
        widgetId: dashboardWidget.id,
        widgetName: displayName,
        widgetComponent: dashboardWidget.Widget?.component,
        reason: 'No device has toggle capability',
        devices: devices.map(d => ({
          id: d.id,
          name: d.name,
          type: d.type,
          capabilities: d.capabilities || null
        }))
      });
    }
  }, [devices, hasToggleCapability, dashboardWidget.id, displayName, dashboardWidget.Widget?.component]);

  useEffect(() => {
    loadWidgetState();
  }, [dashboardWidget.id]);

  const loadWidgetState = async () => {
    if (devices.length === 0) return;

    try {
      const { devices: deviceStates } = await api.getWidgetState(dashboardWidget.id);

      // Si au moins UN device est ON, le widget est ON
      const anyOn = deviceStates.some(d => d.state?.isOn);
      setIsOn(anyOn);
    } catch (error) {
      console.error('Failed to load widget state:', error);
    }
  };

  const handleToggle = async () => {
    if (!hasToggleCapability) {
      console.error('Toggle capability not available');
      return;
    }

    setLoading(true);
    try {
      await api.executeWidgetCommand(dashboardWidget.id, 'toggle');
      setIsOn(!isOn);
    } catch (error) {
      console.error('Failed to toggle:', error);
    } finally {
      setLoading(false);
    }
  };

  if (devices.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] group">
      {/* Background gradient subtle */}
      <div className={`absolute inset-0 rounded-2xl transition-all duration-500 ${
        isOn ? 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10' : ''
      }`}></div>

      <div className="relative flex-1 flex flex-col">
        {/* Header avec device name */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-white mb-1.5 line-clamp-2">
            {displayName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">{devices[0].type}</span>
            {devices.length > 1 && (
              <>
                <span className="text-xs text-white/20">•</span>
                <span className="text-xs text-purple-300 font-medium">{devices.length} devices</span>
              </>
            )}
            <span className="text-xs text-white/20">•</span>
            <div className="flex items-center gap-1.5">
              <div className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                isOn ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-white/20'
              }`}></div>
              <span className={`text-xs font-medium transition-colors ${
                isOn ? 'text-emerald-400' : 'text-white/40'
              }`}>
                {isOn ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Toggle Switch horizontal */}
        <div className="flex-1 flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <span className={`text-sm font-medium transition-colors ${
              isOn ? 'text-white' : 'text-white/50'
            }`}>
              Power
            </span>
            <span className={`text-2xl font-bold transition-colors ${
              isOn ? 'text-emerald-400' : 'text-white/30'
            }`}>
              {isOn ? 'ON' : 'OFF'}
            </span>
          </div>

          {/* Toggle Button */}
          <button
            onClick={handleToggle}
            disabled={loading || !hasToggleCapability}
            className={`
              relative w-20 h-10 rounded-full transition-all duration-300
              disabled:opacity-30 disabled:cursor-not-allowed
              ${isOn
                ? 'bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg shadow-emerald-500/30'
                : 'bg-white/10 border border-white/20'
              }
              ${!loading && 'hover:scale-105 active:scale-95'}
            `}
          >
            {/* Toggle circle */}
            <div
              className={`
                absolute top-1 w-8 h-8 rounded-full transition-all duration-300
                ${isOn
                  ? 'right-1 bg-white shadow-lg'
                  : 'left-1 bg-white/80'
                }
              `}
            >
              {loading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-4 h-4 border-2 border-gray-400 border-t-gray-600 rounded-full animate-spin"></div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  {isOn ? (
                    <svg className="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </div>
              )}
            </div>
          </button>
        </div>

        {/* Info complémentaire */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/30">Tap to {isOn ? 'turn off' : 'turn on'}</span>
            {hasToggleCapability ? (
              <span className="text-emerald-400/60">Ready</span>
            ) : (
              <span className="text-red-400/60 flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Unavailable
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
