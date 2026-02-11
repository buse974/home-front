import { useState } from 'react';
import type { WidgetComponentProps } from '../../types';
import { api } from '../../services/api';

/**
 * Widget ActionButton - Bouton d'action unique
 * Execute une seule action (ON, OFF, etc.) sur plusieurs devices
 */
export function ActionButton({ dashboardWidget }: WidgetComponentProps) {
  const [loading, setLoading] = useState(false);

  const config = dashboardWidget.config || {};
  const action = config.action || 'off'; // 'on' | 'off' | 'toggle'
  const label = config.label || 'Action';
  const color = config.color || 'red'; // 'red' | 'green' | 'blue' | 'purple'

  const allDevices = dashboardWidget.GenericDevices || [];
  const displayName = dashboardWidget.name || allDevices.map(d => d.name).join(', ');

  // Vérifier si les devices ont la capability nécessaire
  const hasCapability = allDevices.some(d => {
    if (action === 'toggle') return d.capabilities?.toggle;
    if (action === 'on' || action === 'off') return d.capabilities?.switch;
    return false;
  });

  const handleAction = async () => {
    if (!hasCapability) {
      console.error('Required capability not available');
      return;
    }

    setLoading(true);
    try {
      await api.executeWidgetCommand(dashboardWidget.id, action);
    } catch (error) {
      console.error('Failed to execute action:', error);
    } finally {
      setLoading(false);
    }
  };

  if (allDevices.length === 0) {
    return (
      <div className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-red-500/20">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  // Color mappings
  const colorClasses = {
    red: {
      bg: 'from-red-500 to-rose-500',
      shadow: 'shadow-red-500/30',
      text: 'text-red-400',
      icon: 'bg-red-500/20'
    },
    green: {
      bg: 'from-emerald-500 to-teal-500',
      shadow: 'shadow-emerald-500/30',
      text: 'text-emerald-400',
      icon: 'bg-emerald-500/20'
    },
    blue: {
      bg: 'from-blue-500 to-cyan-500',
      shadow: 'shadow-blue-500/30',
      text: 'text-blue-400',
      icon: 'bg-blue-500/20'
    },
    purple: {
      bg: 'from-purple-500 to-pink-500',
      shadow: 'shadow-purple-500/30',
      text: 'text-purple-400',
      icon: 'bg-purple-500/20'
    }
  };

  const colors = colorClasses[color as keyof typeof colorClasses] || colorClasses.red;

  return (
    <div className="relative p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.02] group">
      {/* Header avec device name */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1.5 line-clamp-2">
          {displayName}
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">{allDevices[0].type}</span>
          {allDevices.length > 1 && (
            <>
              <span className="text-xs text-white/20">•</span>
              <span className="text-xs text-purple-300 font-medium">{allDevices.length} devices</span>
            </>
          )}
        </div>
      </div>

      {/* Action Button */}
      <button
        onClick={handleAction}
        disabled={loading || !hasCapability}
        className={`
          w-full py-6 rounded-xl transition-all duration-300
          disabled:opacity-30 disabled:cursor-not-allowed
          bg-gradient-to-r ${colors.bg} ${colors.shadow} shadow-lg
          ${!loading && 'hover:scale-105 active:scale-95'}
          flex items-center justify-center gap-3
        `}
      >
        {loading ? (
          <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
        ) : (
          <>
            {action === 'off' && (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {action === 'on' && (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {action === 'toggle' && (
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
            )}
            <span className="text-xl font-bold text-white">{label}</span>
          </>
        )}
      </button>

      {/* Info complémentaire */}
      <div className="mt-4 pt-4 border-t border-white/5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-white/30">Tap to execute</span>
          {hasCapability ? (
            <span className={`${colors.text}/60`}>Ready</span>
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
  );
}
