import { useState, useEffect } from 'react';
import type { WidgetComponentProps } from '../../types';
import { api } from '../../services/api';

/**
 * Widget SwitchNeon - Design futuriste avec effet néon
 * Animations fluides et style cyberpunk
 */
export function SwitchNeon({ dashboardWidget }: WidgetComponentProps) {
  const [isOn, setIsOn] = useState(false);
  const [loading, setLoading] = useState(false);

  const devices = dashboardWidget.GenericDevices || [];
  const displayName = dashboardWidget.name || devices.map(d => d.name).join(', ');
  const hasToggleCapability = devices.some(d => d.capabilities?.toggle);

  useEffect(() => {
    loadWidgetState();
  }, [dashboardWidget.id]);

  const loadWidgetState = async () => {
    if (devices.length === 0) return;

    try {
      const { devices: deviceStates } = await api.getWidgetState(dashboardWidget.id);
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
      <div className="p-6 bg-black/80 backdrop-blur-xl rounded-3xl border border-red-500/30">
        <p className="text-red-400">No device connected</p>
      </div>
    );
  }

  return (
    <div className="relative h-full flex flex-col p-8 bg-black/90 backdrop-blur-2xl rounded-3xl border border-white/5 overflow-hidden group">
      {/* Animated background glow */}
      <div className={`absolute inset-0 transition-opacity duration-700 ${
        isOn ? 'opacity-100' : 'opacity-0'
      }`}>
        <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/20 via-blue-500/20 to-purple-500/20 animate-pulse"></div>
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-cyan-400/30 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-blue-400/30 rounded-full blur-3xl animate-pulse"></div>
      </div>

      {/* Scan line effect */}
      {isOn && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-cyan-400/10 to-transparent h-full animate-scan"></div>
        </div>
      )}

      <div className="relative z-10 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-white mb-2 line-clamp-2">
            {displayName}
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40 uppercase tracking-wider">{devices[0].type}</span>
            {devices.length > 1 && (
              <>
                <span className="text-xs text-white/20">•</span>
                <span className="text-xs text-cyan-400 font-bold">{devices.length}x</span>
              </>
            )}
          </div>
        </div>

        {/* Neon Switch Circle */}
        <div className="flex-1 flex flex-col items-center justify-center py-8">
          <button
            onClick={handleToggle}
            disabled={loading || !hasToggleCapability}
            className={`
              relative w-32 h-32 rounded-full transition-all duration-500
              disabled:opacity-30 disabled:cursor-not-allowed
              ${!loading && 'hover:scale-110 active:scale-95'}
            `}
          >
            {/* Outer glow ring */}
            <div className={`
              absolute inset-0 rounded-full transition-all duration-500
              ${isOn
                ? 'bg-gradient-to-br from-cyan-500 to-blue-500 shadow-[0_0_50px_rgba(6,182,212,0.6)] animate-pulse'
                : 'bg-gradient-to-br from-white/10 to-white/5 shadow-[0_0_20px_rgba(255,255,255,0.1)]'
              }
            `}></div>

            {/* Inner circle */}
            <div className={`
              absolute inset-2 rounded-full transition-all duration-500 flex items-center justify-center
              ${isOn
                ? 'bg-gradient-to-br from-cyan-400 to-blue-600 shadow-[inset_0_0_30px_rgba(6,182,212,0.8)]'
                : 'bg-gradient-to-br from-gray-800 to-gray-900 shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]'
              }
            `}>
              {loading ? (
                <div className="w-8 h-8 border-3 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {isOn ? (
                    <svg className="w-12 h-12 text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ) : (
                    <svg className="w-12 h-12 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  )}
                </>
              )}
            </div>

            {/* Rotating ring effect when ON */}
            {isOn && !loading && (
              <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-cyan-400 animate-spin-slow opacity-70"></div>
            )}
          </button>

          {/* Status text */}
          <div className="mt-6 text-center">
            <p className={`text-3xl font-black tracking-wider transition-all duration-500 ${
              isOn
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-400 to-purple-400 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                : 'text-white/30'
            }`}>
              {isOn ? 'ONLINE' : 'OFFLINE'}
            </p>
          </div>
        </div>

        {/* Footer stats */}
        <div className="mt-6 pt-6 border-t border-white/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                isOn
                  ? 'bg-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.8)] animate-pulse'
                  : 'bg-white/20'
              }`}></div>
              <span className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                isOn ? 'text-cyan-400' : 'text-white/40'
              }`}>
                {isOn ? 'Active' : 'Standby'}
              </span>
            </div>
            {hasToggleCapability ? (
              <span className="text-xs text-cyan-400/60 font-mono">READY</span>
            ) : (
              <span className="text-xs text-red-400/60 font-mono">ERROR</span>
            )}
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style>{`
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-scan {
          animation: scan 3s linear infinite;
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
