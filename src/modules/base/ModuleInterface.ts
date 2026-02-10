/**
 * Interface standard pour les modules de dashboard
 * Chaque module doit respecter cette interface pour s'intégrer
 */

export interface Device {
  id: string;
  name: string;
  type: string;
  room?: string;
  [key: string]: any;
}

export interface ModuleProps {
  device: Device;
  onCommand: (command: string, params?: any) => Promise<void>;
  config?: any;
}

export interface ModuleConfig {
  [key: string]: any;
}

export interface DashboardModule {
  id: string;
  name: string;
  version: string;
  author: string;

  // Le composant React
  Component: React.FC<ModuleProps>;

  // Panneau de configuration (optionnel)
  ConfigPanel?: React.FC<{ config: ModuleConfig; onChange: (config: ModuleConfig) => void }>;

  // Preview pour Storybook
  stories?: {
    thumbnail: string;
    demoProps: ModuleProps;
  };
}
