import type {
  LoginResponse,
  ProvidersResponse,
  AvailableDevicesResponse,
  DevicesResponse,
  DashboardsResponse,
  DashboardResponse,
  WidgetsResponse,
  DashboardWidgetResponse,
  DeviceStateResponse,
  GenericDevice,
  DashboardWidget
} from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

class ApiService {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || `HTTP ${response.status}`);
    }

    return response.json();
  }

  // ============ AUTH ============

  async login(email: string, password: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    // Store token
    localStorage.setItem('token', data.token);
    return data;
  }

  async register(email: string, password: string, name: string): Promise<LoginResponse> {
    const data = await this.request<LoginResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    localStorage.setItem('token', data.token);
    return data;
  }

  async me(): Promise<{ user: any }> {
    return this.request('/auth/me');
  }

  logout() {
    localStorage.removeItem('token');
  }

  // ============ PROVIDERS ============

  async getProviders(): Promise<ProvidersResponse> {
    return this.request('/providers');
  }

  // ============ DEVICES ============

  /**
   * Liste LIVE des devices disponibles du provider (pas encore créés en DB)
   */
  async getAvailableDevices(providerId: string): Promise<AvailableDevicesResponse> {
    return this.request(`/devices/available/${providerId}`);
  }

  /**
   * Liste des generic_devices déjà créés pour la maison
   */
  async getDevices(): Promise<DevicesResponse> {
    return this.request('/devices');
  }

  /**
   * Créer un generic_device (lazy creation lors de l'ajout au dashboard)
   */
  async createDevice(data: {
    provider_id: string;
    name: string;
    type: string;
    capabilities: any;
    command_mapping: any;
  }): Promise<{ device: GenericDevice }> {
    return this.request('/devices', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Exécuter une capability sur un device (toggle, dim, etc.)
   */
  async executeCapability(
    deviceId: string,
    capability: string,
    params?: any
  ): Promise<{ success: boolean }> {
    return this.request(`/devices/${deviceId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ capability, params }),
    });
  }

  /**
   * Récupérer l'état actuel d'un device
   */
  async getDeviceState(deviceId: string): Promise<DeviceStateResponse> {
    return this.request(`/devices/${deviceId}/state`);
  }

  /**
   * Supprimer un generic_device
   */
  async deleteDevice(deviceId: string): Promise<{ success: boolean }> {
    return this.request(`/devices/${deviceId}`, {
      method: 'DELETE',
    });
  }

  // ============ DASHBOARDS ============

  /**
   * Liste des dashboards de la maison
   */
  async getDashboards(): Promise<DashboardsResponse> {
    return this.request('/dashboards');
  }

  /**
   * Un dashboard avec ses widgets
   */
  async getDashboard(dashboardId: string): Promise<DashboardResponse> {
    return this.request(`/dashboards/${dashboardId}`);
  }

  /**
   * Créer un dashboard
   */
  async createDashboard(data: {
    name: string;
    isDefault?: boolean;
  }): Promise<{ dashboard: any }> {
    return this.request('/dashboards', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // ============ WIDGETS ============

  /**
   * Catalogue de widgets disponibles
   */
  async getWidgetsCatalogue(): Promise<WidgetsResponse> {
    return this.request('/dashboards/widgets/catalogue');
  }

  /**
   * Liste de TOUS les DashboardWidgets de la maison (pour admin)
   */
  async getAllDashboardWidgets(): Promise<{ dashboardWidgets: DashboardWidget[] }> {
    return this.request('/dashboards/widgets/all');
  }

  /**
   * Ajouter un widget au dashboard
   */
  async addWidget(
    dashboardId: string,
    data: {
      widgetId: string;
      genericDeviceIds: string[];
      config?: any;
      position?: { x: number; y: number; w: number; h: number };
    }
  ): Promise<DashboardWidgetResponse> {
    return this.request(`/dashboards/${dashboardId}/widgets`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  /**
   * Mettre à jour un widget (position, config)
   */
  async updateWidget(
    widgetId: string,
    data: {
      config?: any;
      position?: { x: number; y: number; w: number; h: number };
    }
  ): Promise<{ dashboardWidget: DashboardWidget }> {
    return this.request(`/dashboards/widgets/${widgetId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  /**
   * Supprimer un widget du dashboard
   */
  async deleteWidget(widgetId: string): Promise<{ success: boolean }> {
    return this.request(`/dashboards/widgets/${widgetId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Exécuter une commande sur TOUS les devices d'un widget
   */
  async executeWidgetCommand(
    widgetId: string,
    capability: string,
    params?: any
  ): Promise<{
    success: boolean;
    executed: number;
    total: number;
    succeeded: Array<{ deviceId: string; deviceName: string; success: boolean }>;
    failed: Array<{ deviceId: string; deviceName: string; error: string }>;
  }> {
    return this.request(`/dashboards/widgets/${widgetId}/execute`, {
      method: 'POST',
      body: JSON.stringify({ capability, params }),
    });
  }

  /**
   * Récupérer l'état de TOUS les devices d'un widget
   */
  async getWidgetState(widgetId: string): Promise<{
    devices: Array<{ deviceId: string; deviceName: string; state: any }>;
    errors: Array<{ deviceId: string; deviceName: string; error: string }>;
    total: number;
  }> {
    return this.request(`/dashboards/widgets/${widgetId}/state`);
  }
}

export const api = new ApiService();
