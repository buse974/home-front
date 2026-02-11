import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getWidgetComponent } from '../modules/WidgetRegistry';
import type {
  Dashboard as DashboardType,
  GenericDevice,
  Widget,
} from '../types';

export function Dashboard() {
  const [dashboard, setDashboard] = useState<DashboardType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const { dashboards } = await api.getDashboards();
      if (dashboards.length === 0) {
        console.warn('No dashboard found');
        setLoading(false);
        return;
      }

      const defaultDashboard = dashboards.find((d) => d.isDefault) || dashboards[0];
      const { dashboard: fullDashboard } = await api.getDashboard(defaultDashboard.id);
      setDashboard(fullDashboard);
    } catch (error) {
      console.error('Failed to load dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteCommand = async (deviceId: string, capability: string, params?: any) => {
    try {
      await api.executeCapability(deviceId, capability, params);
    } catch (error) {
      console.error('Failed to execute command:', error);
      throw error;
    }
  };

  const handleWidgetAdded = () => {
    loadDashboard();
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
            <div className="w-20 h-20 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin absolute top-0 left-1/2 -translate-x-1/2" style={{ animationDirection: 'reverse', animationDuration: '1s' }}></div>
          </div>
          <p className="text-xl text-white/80 mt-6 font-light">Loading your smart home...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
          </div>
          <p className="text-xl text-white/80 font-light">No dashboard found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-pink-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                  {dashboard.name}
                </h1>
              </div>
              <p className="text-white/60 ml-[52px] font-light">Control your connected devices</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="group relative px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-500 rounded-xl font-medium text-white shadow-xl shadow-purple-500/50 hover:shadow-2xl hover:shadow-purple-500/60 transition-all duration-300 hover:scale-105 overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Widget</span>
              </div>
            </button>
          </div>
        </header>

        {/* Widgets Grid */}
        <main>
          {!dashboard.DashboardWidgets || dashboard.DashboardWidgets.length === 0 ? (
            <div className="text-center py-20">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/5 backdrop-blur-sm rounded-2xl mb-6 border border-white/10">
                <svg className="w-10 h-10 text-white/40" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-2xl text-white/80 mb-3 font-light">No widgets yet</h3>
              <p className="text-white/50 mb-6">Start by adding your first device</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-2 px-6 py-3 bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-xl text-white font-medium transition-all duration-300 border border-white/10 hover:border-white/20"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add your first widget
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {dashboard.DashboardWidgets.map((dashboardWidget) => {
                const WidgetComponent = getWidgetComponent(
                  dashboardWidget.Widget?.component || ''
                );

                if (!WidgetComponent) {
                  return (
                    <div
                      key={dashboardWidget.id}
                      className="p-6 bg-red-500/10 backdrop-blur-sm rounded-2xl border border-red-500/20"
                    >
                      <p className="text-red-400">
                        Unknown widget: {dashboardWidget.Widget?.component}
                      </p>
                    </div>
                  );
                }

                return (
                  <WidgetComponent
                    key={dashboardWidget.id}
                    dashboardWidget={dashboardWidget}
                    onCommand={(capability, params) =>
                      handleExecuteCommand(
                        dashboardWidget.GenericDevice?.id || '',
                        capability,
                        params
                      )
                    }
                  />
                );
              })}
            </div>
          )}
        </main>
      </div>

      {/* Modal Add Widget */}
      {showAddModal && (
        <AddWidgetModal
          dashboardId={dashboard.id}
          onClose={() => setShowAddModal(false)}
          onSuccess={handleWidgetAdded}
        />
      )}
    </div>
  );
}

/**
 * Modal pour ajouter un widget avec design moderne
 */
interface AddWidgetModalProps {
  dashboardId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddWidgetModal({ dashboardId, onClose, onSuccess }: AddWidgetModalProps) {
  const [step, setStep] = useState<'device' | 'widget'>('device');
  const [availableDevices, setAvailableDevices] = useState<(GenericDevice & { providerId: string })[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<(GenericDevice & { providerId: string }) | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadAllDevices();
  }, []);

  const loadAllDevices = async () => {
    setLoading(true);
    try {
      // Charger tous les providers
      const { providers: providersList } = await api.getProviders();

      // Charger les devices de TOUS les providers en parallèle
      const devicesPromises = providersList.map(async (provider) => {
        try {
          const { devices } = await api.getAvailableDevices(provider.id);
          // Ajouter le providerId à chaque device
          return devices.map(device => ({ ...device, providerId: provider.id }));
        } catch (error) {
          console.error(`Failed to load devices for provider ${provider.name}:`, error);
          return [];
        }
      });

      const devicesArrays = await Promise.all(devicesPromises);
      const allDevices = devicesArrays.flat();

      setAvailableDevices(allDevices);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadWidgets = async () => {
    setLoading(true);
    try {
      const { widgets: widgetsList } = await api.getWidgetsCatalogue();
      setWidgets(widgetsList);
      setStep('widget');
    } catch (error) {
      console.error('Failed to load widgets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddWidget = async () => {
    if (!selectedDevice || !selectedWidget) return;

    setLoading(true);
    try {
      const { device } = await api.createDevice({
        provider_id: selectedDevice.providerId,
        name: selectedDevice.name,
        type: selectedDevice.type,
        capabilities: selectedDevice.capabilities,
        command_mapping: selectedDevice.command_mapping,
      });

      await api.addWidget(dashboardId, {
        widgetId: selectedWidget.id,
        genericDeviceId: device.id,
        config: {},
        position: { x: 0, y: 0, w: 2, h: 1 },
      });

      onSuccess();
    } catch (error) {
      console.error('Failed to add widget:', error);
      alert('Failed to add widget');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden border border-white/10">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-500/10 to-blue-500/10">
          <h2 className="text-2xl font-bold text-white">Add Widget</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-8 gap-3">
            <StepIndicator active={step === 'device'} completed={!!selectedDevice} number="1">
              Device
            </StepIndicator>
            <div className="w-12 h-0.5 bg-gradient-to-r from-purple-500/30 to-blue-500/30" />
            <StepIndicator active={step === 'widget'} completed={!!selectedWidget} number="2">
              Widget
            </StepIndicator>
          </div>

          {/* Step: Device */}
          {step === 'device' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">Select Device</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-white/60 mt-4">Loading devices...</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => {
                        setSelectedDevice(device);
                        loadWidgets();
                      }}
                      className="w-full p-4 text-left rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/50 transition-all group"
                    >
                      <p className="font-medium text-white group-hover:text-purple-400 transition-colors">{device.name}</p>
                      <p className="text-sm text-white/60 mt-1">
                        {device.type} • {Object.keys(device.capabilities).filter((k) => device.capabilities[k]).join(', ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Widget */}
          {step === 'widget' && (
            <div className="space-y-3">
              <h3 className="text-lg font-semibold text-white mb-4">Select Widget Type</h3>
              {loading ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
                  <p className="text-white/60 mt-4">Loading widgets...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {widgets.map((widget) => (
                    <button
                      key={widget.id}
                      onClick={() => setSelectedWidget(widget)}
                      className={`w-full p-4 text-left rounded-xl border transition-all ${
                        selectedWidget?.id === widget.id
                          ? 'bg-purple-500/20 border-purple-500'
                          : 'bg-white/5 hover:bg-white/10 border-white/10 hover:border-purple-500/50'
                      }`}
                    >
                      <p className="font-medium text-white">
                        {widget.icon} {widget.libelle}
                      </p>
                      {widget.description && (
                        <p className="text-sm text-white/60 mt-1">{widget.description}</p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-between bg-slate-900/50">
          <button
            onClick={onClose}
            className="px-6 py-2.5 text-white/60 hover:text-white transition-colors"
          >
            Cancel
          </button>
          {step === 'widget' && selectedWidget && (
            <button
              onClick={handleAddWidget}
              disabled={loading}
              className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-500/50 transition-all"
            >
              {loading ? 'Adding...' : 'Add Widget'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Step indicator moderne
 */
function StepIndicator({
  active,
  completed,
  number,
  children,
}: {
  active: boolean;
  completed: boolean;
  number: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm transition-all ${
          active
            ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50'
            : completed
            ? 'bg-green-500 text-white'
            : 'bg-white/10 text-white/40'
        }`}
      >
        {completed && !active ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        ) : (
          number
        )}
      </div>
      <span
        className={`text-xs font-medium transition-colors ${
          active ? 'text-white' : completed ? 'text-green-400' : 'text-white/40'
        }`}
      >
        {children}
      </span>
    </div>
  );
}
