import type { WidgetComponentProps } from '../types';
import { Switch } from './Switch/Switch';
import { SwitchToggle } from './SwitchToggle/SwitchToggle';

/**
 * Registry des widgets disponibles
 * Mappe les component names (depuis la BDD) aux composants React
 */

type WidgetComponent = React.FC<WidgetComponentProps>;

interface WidgetRegistryMap {
  [componentName: string]: WidgetComponent;
}

export const widgetRegistry: WidgetRegistryMap = {
  'Switch': Switch,
  'SwitchToggle': SwitchToggle,
  // Ajouter d'autres widgets ici au fur et à mesure:
  // 'Slider': Slider,
  // 'Sensor': Sensor,
  // etc.
};

/**
 * Récupère un composant widget par son nom
 */
export function getWidgetComponent(componentName: string): WidgetComponent | null {
  return widgetRegistry[componentName] || null;
}

/**
 * Vérifie si un widget est enregistré
 */
export function isWidgetRegistered(componentName: string): boolean {
  return componentName in widgetRegistry;
}
