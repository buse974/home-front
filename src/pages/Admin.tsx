import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../services/api";
import type {
  DashboardWidget,
  Dashboard as DashboardType,
  Provider,
} from "../types";

export function Admin() {
  const [activeTab, setActiveTab] = useState<
    "widgets" | "dashboards" | "providers"
  >("widgets");

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
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
              </Link>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-pink-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/50">
                    <svg
                      className="w-6 h-6 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
                    Administration
                  </h1>
                </div>
                <p className="text-white/60 ml-[52px] font-light">
                  Manage your smart home
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Tabs */}
        <div className="mb-8">
          <div className="flex gap-2 p-1 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 inline-flex">
            <button
              onClick={() => setActiveTab("widgets")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === "widgets"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Widgets
            </button>
            <button
              onClick={() => setActiveTab("dashboards")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === "dashboards"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Dashboards
            </button>
            <button
              onClick={() => setActiveTab("providers")}
              className={`px-6 py-2.5 rounded-lg font-medium transition-all ${
                activeTab === "providers"
                  ? "bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/50"
                  : "text-white/60 hover:text-white hover:bg-white/10"
              }`}
            >
              Providers
            </button>
          </div>
        </div>

        {/* Content */}
        <main>
          {activeTab === "widgets" && <WidgetsSection />}
          {activeTab === "dashboards" && <DashboardsSection />}
          {activeTab === "providers" && <ProvidersSection />}
        </main>
      </div>
    </div>
  );
}

/**
 * Section Widgets - Liste des DashboardWidgets avec suppression en cascade
 */
function WidgetsSection() {
  const [widgets, setWidgets] = useState<DashboardWidget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadWidgets();
  }, []);

  const loadWidgets = async () => {
    setLoading(true);
    try {
      const { dashboardWidgets } = await api.getAllDashboardWidgets();
      setWidgets(dashboardWidgets);
    } catch (error) {
      console.error("Failed to load widgets:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (widgetId: string, widgetName: string) => {
    if (
      !confirm(
        `Supprimer "${widgetName}" ?\n\nLes devices non utilisés seront automatiquement supprimés.`,
      )
    )
      return;

    try {
      await api.deleteWidget(widgetId);
      loadWidgets();
    } catch (error) {
      console.error("Failed to delete widget:", error);
      alert("Failed to delete widget");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mx-auto"></div>
        <p className="text-white/60 mt-4">Loading widgets...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white">Dashboard Widgets</h2>
        <span className="text-white/60">{widgets.length} widget(s)</span>
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-12 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
          <p className="text-white/60">Aucun widget créé</p>
          <p className="text-white/40 text-sm mt-2">
            Ajoutez des widgets à vos dashboards pour les voir ici
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {widgets.map((widget) => (
            <div
              key={widget.id}
              className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Nom du widget */}
                  <div className="flex items-center gap-3 mb-2">
                    {widget.Widget?.icon && (
                      <span className="text-2xl">{widget.Widget.icon}</span>
                    )}
                    <h3 className="text-lg font-semibold text-white">
                      {widget.name || widget.Widget?.libelle}
                    </h3>
                  </div>

                  {/* Dashboard */}
                  <div className="flex items-center gap-4 text-sm text-white/60 mb-3">
                    <span>Dashboard: {widget.Dashboard?.name}</span>
                    <span>•</span>
                    <span>Type: {widget.Widget?.component}</span>
                  </div>

                  {/* Devices liés */}
                  {widget.GenericDevices &&
                    widget.GenericDevices.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-white/40 mb-2">
                          Devices ({widget.GenericDevices.length}):
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {widget.GenericDevices.map((device) => (
                            <span
                              key={device.id}
                              className="px-2.5 py-1 bg-white/10 rounded-lg text-xs text-white/80 flex items-center gap-1.5"
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400"></span>
                              {device.name} ({device.type})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                </div>

                {/* Bouton supprimer */}
                <button
                  onClick={() =>
                    handleDelete(
                      widget.id,
                      widget.name || widget.Widget?.libelle || "ce widget",
                    )
                  }
                  className="ml-4 w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20"
                  title="Supprimer le widget (et les devices orphelins)"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
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
  const [newDashboardName, setNewDashboardName] = useState("");
  const [creating, setCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboards();
  }, []);

  const loadDashboards = async () => {
    setLoading(true);
    try {
      const { dashboards: dashboardsList } = await api.getDashboards();
      setDashboards(dashboardsList);
      setRenameDrafts(
        dashboardsList.reduce<Record<string, string>>((acc, dashboard) => {
          acc[dashboard.id] = dashboard.name;
          return acc;
        }, {}),
      );
    } catch (error) {
      console.error("Failed to load dashboards:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = newDashboardName.trim();
    if (!name) return;

    setCreating(true);
    try {
      await api.createDashboard({ name });
      setNewDashboardName("");
      await loadDashboards();
    } catch (error) {
      console.error("Failed to create dashboard:", error);
      alert("Failed to create dashboard");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (dashboardId: string) => {
    const name = (renameDrafts[dashboardId] || "").trim();
    const current = dashboards.find((d) => d.id === dashboardId);
    if (!current || !name || name === current.name) {
      setRenamingId(null);
      return;
    }

    setRenamingId(dashboardId);
    try {
      await api.updateDashboard(dashboardId, { name });
      await loadDashboards();
    } catch (error) {
      console.error("Failed to rename dashboard:", error);
      alert("Failed to rename dashboard");
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async (dashboardId: string, dashboardName: string) => {
    if (!confirm(`Supprimer le dashboard "${dashboardName}" ?`)) return;

    setDeletingId(dashboardId);
    try {
      await api.deleteDashboard(dashboardId);
      await loadDashboards();
    } catch (error) {
      console.error("Failed to delete dashboard:", error);
      alert("Failed to delete dashboard (check if it is the last dashboard)");
    } finally {
      setDeletingId(null);
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

      <div className="mb-6 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            value={newDashboardName}
            onChange={(e) => setNewDashboardName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleCreate();
              }
            }}
            placeholder="Nom du nouveau dashboard"
            className="flex-1 px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleCreate}
            disabled={creating || !newDashboardName.trim()}
            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Création..." : "Ajouter"}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {dashboards.map((dashboard) => (
          <div
            key={dashboard.id}
            className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <input
                    value={renameDrafts[dashboard.id] || ""}
                    onChange={(e) =>
                      setRenameDrafts((prev) => ({
                        ...prev,
                        [dashboard.id]: e.target.value,
                      }))
                    }
                    onBlur={() => handleRename(dashboard.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        void handleRename(dashboard.id);
                      }
                    }}
                    className="w-full max-w-sm px-3 py-1.5 rounded-lg bg-slate-900/70 border border-white/20 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
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
              <div className="ml-4 flex items-center gap-2">
                <Link
                  to={`/dashboard?id=${dashboard.id}`}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white text-sm font-medium transition-colors"
                >
                  Ouvrir
                </Link>
                <button
                  onClick={() => handleDelete(dashboard.id, dashboard.name)}
                  disabled={
                    deletingId === dashboard.id || renamingId === dashboard.id
                  }
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Supprimer le dashboard"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
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
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameDrafts, setRenameDrafts] = useState<Record<string, string>>({});
  const [form, setForm] = useState({
    name: "",
    url: "",
    apiKey: "",
  });

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    setLoading(true);
    try {
      const { providers: providersList } = await api.getProviders();
      setProviders(providersList);
      setRenameDrafts(
        providersList.reduce<Record<string, string>>((acc, provider) => {
          acc[provider.id] = provider.name;
          return acc;
        }, {}),
      );
    } catch (error) {
      console.error("Failed to load providers:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    const name = form.name.trim();
    const url = form.url.trim();
    const apiKey = form.apiKey.trim();
    if (!name || !url || !apiKey) return;

    setCreating(true);
    try {
      await api.createProvider({
        type: "jeedom",
        name,
        config: { url, apiKey },
      });
      setForm({ name: "", url: "", apiKey: "" });
      await loadProviders();
    } catch (error) {
      console.error("Failed to create provider:", error);
      alert("Failed to create provider (check URL/API key)");
    } finally {
      setCreating(false);
    }
  };

  const handleRename = async (providerId: string) => {
    const name = (renameDrafts[providerId] || "").trim();
    const current = providers.find((p) => p.id === providerId);
    if (!current || !name || name === current.name) {
      setRenamingId(null);
      return;
    }

    setRenamingId(providerId);
    try {
      await api.updateProvider(providerId, { name });
      await loadProviders();
    } catch (error) {
      console.error("Failed to rename provider:", error);
      alert("Failed to rename provider");
    } finally {
      setRenamingId(null);
    }
  };

  const handleDelete = async (providerId: string, providerName: string) => {
    if (!confirm(`Supprimer le provider "${providerName}" ?`)) return;

    setDeletingId(providerId);
    try {
      await api.deleteProvider(providerId);
      await loadProviders();
    } catch (error) {
      console.error("Failed to delete provider:", error);
      alert("Failed to delete provider");
    } finally {
      setDeletingId(null);
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

      <div className="mb-6 p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10">
        <p className="text-white/80 font-medium mb-3">
          Ajouter un provider Jeedom
        </p>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            value={form.name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder="Nom"
            className="px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
          <input
            value={form.url}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, url: e.target.value }))
            }
            placeholder="https://jeedom.exemple.com"
            className="px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
          <input
            value={form.apiKey}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, apiKey: e.target.value }))
            }
            placeholder="API key"
            className="px-4 py-2.5 bg-white/10 border border-white/15 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-purple-500"
          />
          <button
            onClick={handleCreate}
            disabled={
              creating ||
              !form.name.trim() ||
              !form.url.trim() ||
              !form.apiKey.trim()
            }
            className="px-4 py-2.5 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? "Ajout..." : "Ajouter"}
          </button>
        </div>
      </div>

      <div className="grid gap-4">
        {providers.map((provider) => (
          <div
            key={provider.id}
            className="p-6 bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 hover:border-white/20 transition-all"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <input
                  value={renameDrafts[provider.id] || ""}
                  onChange={(e) =>
                    setRenameDrafts((prev) => ({
                      ...prev,
                      [provider.id]: e.target.value,
                    }))
                  }
                  onBlur={() => handleRename(provider.id)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      void handleRename(provider.id);
                    }
                  }}
                  className="w-full max-w-sm mb-2 px-3 py-1.5 rounded-lg bg-slate-900/70 border border-white/20 text-white text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-2.5 py-1 bg-blue-500/20 rounded-lg text-blue-400 border border-blue-500/30">
                    {provider.type}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleDelete(provider.id, provider.name)}
                disabled={
                  deletingId === provider.id || renamingId === provider.id
                }
                className="ml-4 w-10 h-10 flex items-center justify-center rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-colors border border-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Supprimer le provider"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
