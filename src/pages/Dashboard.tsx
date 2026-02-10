import { useState, useEffect } from 'react';
import { api } from '../services/api';

interface Device {
  id: string;
  name: string;
  type: string;
  toggleCommandId?: string;
}

export function Dashboard() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [providerId, setProviderId] = useState('');
  const [loading, setLoading] = useState(true);
  const [toggleStates, setToggleStates] = useState<Record<string, boolean>>({});

  useEffect(() => {
    loadProviderAndDevices();
  }, []);

  const loadProviderAndDevices = async () => {
    try {
      // Get providers
      const providersData = await api.getProviders();
      const providers = providersData.providers;

      if (providers && providers.length > 0) {
        const firstProvider = providers[0];
        setProviderId(firstProvider.id);

        // Get devices from first provider
        const devicesData = await api.getDevices(firstProvider.id);
        setDevices(devicesData.devices || []);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (device: Device) => {
    if (!device.toggleCommandId) {
      console.error('No toggle command found for', device.name);
      return;
    }

    setToggleStates(prev => ({ ...prev, [device.id]: true }));

    try {
      // Exécuter la commande toggle avec l'ID de la commande
      await api.executeCommand(providerId, device.id, device.toggleCommandId);

      console.log(`Toggled ${device.name}`);
    } catch (error) {
      console.error('Failed to toggle:', error);
    } finally {
      setToggleStates(prev => ({ ...prev, [device.id]: false }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-xl">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-2">POC - Contrôle lumières Jeedom</p>
      </header>

      <main>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devices.length === 0 ? (
            <p className="text-gray-500">No devices found</p>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="bg-white p-6 rounded-lg shadow-md"
              >
                <h3 className="text-lg font-semibold mb-4">{device.name}</h3>
                <button
                  onClick={() => handleToggle(device)}
                  disabled={toggleStates[device.id] || !device.toggleCommandId}
                  className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50 transition-colors"
                >
                  {toggleStates[device.id] ? 'Toggling...' : device.toggleCommandId ? 'Toggle' : 'No command'}
                </button>
                <p className="text-xs text-gray-500 mt-2">Type: {device.type}</p>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
}
