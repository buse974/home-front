import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { getWidgetComponent } from '../modules/WidgetRegistry';
import type {
  Dashboard as DashboardType,
  Provider,
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
      // Charger les dashboards
      const { dashboards } = await api.getDashboards();

      if (dashboards.length === 0) {
        console.warn('No dashboard found');
        setLoading(false);
        return;
      }

      // Prendre le premier dashboard (ou le default)
      const defaultDashboard = dashboards.find((d) => d.isDefault) || dashboards[0];

      // Charger le dashboard complet avec ses widgets
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
    // Recharger le dashboard après ajout d'un widget
    loadDashboard();
    setShowAddModal(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 dark:text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-xl text-gray-600 dark:text-gray-400">No dashboard found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 p-4 md:p-8">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            {dashboard.name}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Home automation dashboard
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium shadow-lg hover:shadow-xl transition-all"
        >
          + Add Widget
        </button>
      </header>

      {/* Widgets Grid */}
      <main>
        {!dashboard.DashboardWidgets || dashboard.DashboardWidgets.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">
              No widgets yet. Add your first widget!
            </p>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium"
            >
              + Add Widget
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {dashboard.DashboardWidgets.map((dashboardWidget) => {
              const WidgetComponent = getWidgetComponent(
                dashboardWidget.Widget?.component || ''
              );

              if (!WidgetComponent) {
                return (
                  <div
                    key={dashboardWidget.id}
                    className="p-4 bg-red-100 dark:bg-red-900 rounded-lg"
                  >
                    <p className="text-red-700 dark:text-red-300">
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
 * Modal pour ajouter un widget
 * Flow: Provider → Device → Widget Type → Dashboard
 */
interface AddWidgetModalProps {
  dashboardId: string;
  onClose: () => void;
  onSuccess: () => void;
}

function AddWidgetModal({ dashboardId, onClose, onSuccess }: AddWidgetModalProps) {
  const [step, setStep] = useState<'provider' | 'device' | 'widget'>('provider');
  const [providers, setProviders] = useState<Provider[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [availableDevices, setAvailableDevices] = useState<GenericDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<GenericDevice | null>(null);
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [selectedWidget, setSelectedWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { providers: providersList } = await api.getProviders();
      setProviders(providersList);

      // Auto-sélectionner si un seul provider
      if (providersList.length === 1) {
        setSelectedProvider(providersList[0]);
        loadDevices(providersList[0].id);
      }
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDevices = async (providerId: string) => {
    setLoading(true);
    try {
      const { devices } = await api.getAvailableDevices(providerId);
      setAvailableDevices(devices);
      setStep('device');
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
    if (!selectedDevice || !selectedWidget || !selectedProvider) return;

    setLoading(true);
    try {
      // 1. Créer le generic_device (lazy creation)
      const { device } = await api.createDevice({
        provider_id: selectedProvider.id,
        name: selectedDevice.name,
        type: selectedDevice.type,
        capabilities: selectedDevice.capabilities,
        command_mapping: selectedDevice.command_mapping,
      });

      // 2. Ajouter le widget au dashboard
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Add Widget</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Step indicator */}
          <div className="flex items-center justify-center mb-6 space-x-2">
            <StepIndicator active={step === 'provider'} completed={!!selectedProvider}>
              1. Provider
            </StepIndicator>
            <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
            <StepIndicator active={step === 'device'} completed={!!selectedDevice}>
              2. Device
            </StepIndicator>
            <div className="w-8 h-0.5 bg-gray-300 dark:bg-gray-600" />
            <StepIndicator active={step === 'widget'} completed={!!selectedWidget}>
              3. Widget
            </StepIndicator>
          </div>

          {/* Step: Provider */}
          {step === 'provider' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Select a Provider
              </h3>
              <div className="space-y-2">
                {providers.map((provider) => (
                  <button
                    key={provider.id}
                    onClick={() => {
                      setSelectedProvider(provider);
                      loadDevices(provider.id);
                    }}
                    className="w-full p-4 text-left border-2 rounded-lg hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-500 transition-colors"
                  >
                    <p className="font-medium text-gray-900 dark:text-white">{provider.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{provider.type}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step: Device */}
          {step === 'device' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Select a Device
              </h3>
              {loading ? (
                <p className="text-center text-gray-500">Loading devices...</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {availableDevices.map((device) => (
                    <button
                      key={device.id}
                      onClick={() => {
                        setSelectedDevice(device);
                        loadWidgets();
                      }}
                      className="w-full p-4 text-left border-2 rounded-lg hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-500 transition-colors"
                    >
                      <p className="font-medium text-gray-900 dark:text-white">{device.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Type: {device.type} • Capabilities:{' '}
                        {Object.keys(device.capabilities).filter((k) => device.capabilities[k]).join(', ')}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step: Widget */}
          {step === 'widget' && (
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
                Select Widget Type
              </h3>
              {loading ? (
                <p className="text-center text-gray-500">Loading widgets...</p>
              ) : (
                <div className="space-y-2">
                  {widgets.map((widget) => (
                    <button
                      key={widget.id}
                      onClick={() => setSelectedWidget(widget)}
                      className={`w-full p-4 text-left border-2 rounded-lg transition-colors ${
                        selectedWidget?.id === widget.id
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900'
                          : 'hover:border-blue-500 dark:border-gray-600 dark:hover:border-blue-500'
                      }`}
                    >
                      <p className="font-medium text-gray-900 dark:text-white">
                        {widget.icon} {widget.libelle}
                      </p>
                      {widget.description && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {widget.description}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t dark:border-gray-700 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            Cancel
          </button>
          {step === 'widget' && selectedWidget && (
            <button
              onClick={handleAddWidget}
              disabled={loading}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50"
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
 * Indicateur d'étape pour le wizard
 */
function StepIndicator({
  active,
  completed,
  children,
}: {
  active: boolean;
  completed: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`px-4 py-2 rounded-lg font-medium text-sm ${
        active
          ? 'bg-blue-500 text-white'
          : completed
          ? 'bg-green-500 text-white'
          : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
      }`}
    >
      {children}
    </div>
  );
}
