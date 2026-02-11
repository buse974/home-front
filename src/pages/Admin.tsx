import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import type { GenericDevice, Dashboard as DashboardType, Provider } from '../types';

export function Admin() {
  const [activeTab, setActiveTab] = useState<'devices' | 'dashboards' | 'providers'>('devices');

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 p-6 md:p-8 lg:p-12">
        {/* Header */}
        <header className="mb-12">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/dashboard"
                className="w-10 h-10 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/10"
              >
                <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Administration
                  </h1>
                </div>
                <p className="text-white/60 ml-[52px] font-light">Manage your smart home</p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 inline-flex">
            <button
              onClick={() => setActiveTab('devices')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'devices'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Devices
            </button>
            <button
              onClick={() => setActiveTab('dashboards')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'dashboards'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Dashboards
            </button>
            <button
              onClick={() => setActiveTab('providers')}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === 'providers'
                  ? 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              Providers
            </button>
          </div>
        </div>

        {/* Content */}
        <main>
          {activeTab === 'devices' && <DevicesSection />}
          {activeTab === 'dashboards' && <DashboardsSection />}
          {activeTab === 'providers' && <ProvidersSection />}
        </main>
      </div>
    </div>
  );
}

/**
 * Section Devices - Liste des generic_devices
 */
function DevicesSection() {
  const [devices, setDevices] = useState<GenericDevice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDevices();
  }, []);

  const loadDevices = async () => {
    setLoading(true);
    try {
      const { devices: devicesList } = await api.getDevices();
      setDevices(devicesList);
    } catch (error) {
      console.error('Failed to load devices:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (deviceId: string) => {
    if (!confirm('Delete this device? This will remove it from all dashboards.')) return;

    try {
      await api.deleteDevice(deviceId);
      loadDevices();
    } catch (error) {
      console.error('Failed to delete device:', error);
      alert('Failed to delete device');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-white/60 mt-4">Loading devices...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Generic Devices</h2>
        <span className="text-white/60">{devices.length} device(s)</span>
      </div>

      {devices.length === 0 ? (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <p className="text-white/60">No devices created yet</p>
          <p className="text-white/40 text-sm mt-2">Add widgets to your dashboard to create devices</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white mb-2">{device.name}</h3>
                  <div className="flex items-center gap-4 text-sm text-white/60">
                    <span>Type: {device.type}</span>
                    <span>•</span>
                    <span>Provider: {device.Provider?.name || 'Unknown'}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(device.capabilities).map(([key, value]) => (
                      value && (
                        <span
                          key={key}
                          className="px-2.5 py-1 bg-white/10 rounded-lg text-xs text-white/80"
                        >
                          {key}
                        </span>
                      )
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => handleDelete(device.id)}
                  className="ml-4 w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Section Dashboards
 */
function DashboardsSection() {
  const [dashboards, setDashboards] = useState<DashboardType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const { dashboards: dashboardsList } = await api.getDashboards();
      setDashboards(dashboardsList);
    } catch (error) {
      console.error('Failed to load dashboards:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-white/60 mt-4">Loading dashboards...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboards</h2>
        <span className="text-white/60">{dashboards.length} dashboard(s)</span>
      </div>

      <div className="grid gap-4">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-white">{dashboard.name}</h3>
                  {dashboard.isDefault && (
                    <span className="px-2.5 py-1 bg-green-500/20 rounded-lg text-xs text-green-400 border border-green-500/30">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-sm text-white/60 mt-2">
                  Created {new Date(dashboard.createdAt).toLocaleDateString()}
                </p>
              </div>
              <Link
                to="/dashboard"
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
              >
                View
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Section Providers
 */
function ProvidersSection() {
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { providers: providersList } = await api.getProviders();
      setProviders(providersList);
    } catch (error) {
      console.error('Failed to load providers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-white/60 mt-4">Loading providers...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Providers</h2>
        <span className="text-white/60">{providers.length} provider(s)</span>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">{provider.name}</h3>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-2.5 py-1 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
                    {provider.type}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
