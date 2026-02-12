/**
 * Types TypeScript pour l'architecture multi-tenant
 */

// House (Maison)
export interface House {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// User
export interface User {
  id: string;
  email: string;
  name: string;
  house_id: string;
  role: "admin" | "member";
}

// Provider
export interface Provider {
  id: string;
  houseId: string;
  type: "jeedom" | "mqtt" | "homeassistant";
  name: string;
  createdAt: string;
  updatedAt: string;
}

// Capabilities d'un device
export interface DeviceCapabilities {
  toggle?: boolean;
  dim?: boolean;
  color?: boolean;
  temperature?: boolean;
  [key: string]: boolean | undefined;
}

// Command mapping pour le provider
export interface CommandMapping {
  provider_type: string;
  device_id: string;
  commands: {
    toggle?: string;
    on?: string;
    off?: string;
    dim?: string;
    color?: string;
    [key: string]: string | undefined;
  };
}

// Generic Device (abstraction des devices providers)
export interface GenericDevice {
  id: string;
  provider_id: string;
  name: string;
  type: string;
  capabilities: DeviceCapabilities;
  command_mapping: CommandMapping;
  Provider?: Provider;
  createdAt?: string;
  updatedAt?: string;
}

// Widget (catalogue)
export interface Widget {
  id: string;
  name: string;
  libelle: string;
  component: string;
  description?: string;
  icon?: string;
  category?: string;
  config_schema: Record<string, any>;
}

// Dashboard
export interface Dashboard {
  id: string;
  houseId: string;
  name: string;
  isDefault: boolean;
  layouts?: any;
  DashboardWidgets?: DashboardWidget[];
  createdAt: string;
  updatedAt: string;
}

// DashboardWidget (instance de widget sur un dashboard)
export interface DashboardWidget {
  id: string;
  dashboardId: string;
  widgetId: string;
  name?: string | null; // Nom personnalisé optionnel
  config: Record<string, any>;
  position: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  Widget?: Widget;
  Dashboard?: Dashboard;
  GenericDevices?: GenericDevice[];
  createdAt?: string;
  updatedAt?: string;
}

// API Responses
export interface LoginResponse {
  user: User;
  token: string;
}

export interface ProvidersResponse {
  providers: Provider[];
}

export interface AvailableDevicesResponse {
  devices: GenericDevice[];
}

export interface DevicesResponse {
  devices: GenericDevice[];
}

export interface DashboardResponse {
  dashboard: Dashboard;
}

export interface DashboardsResponse {
  dashboards: Dashboard[];
}

export interface WidgetsResponse {
  widgets: Widget[];
}

export interface DashboardWidgetResponse {
  dashboardWidget: DashboardWidget;
}

export interface DeviceStateResponse {
  state: {
    isOn?: boolean;
    brightness?: number;
    color?: string;
    [key: string]: any;
  };
}

// Props pour les composants Widget
export interface WidgetComponentProps {
  dashboardWidget: DashboardWidget;
  onCommand: (
    capability: string,
    params?: any,
    deviceId?: string,
  ) => Promise<void>;
}
