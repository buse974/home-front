import type { WidgetComponentProps } from "../types";
import { Switch } from "./Switch/Switch";
import { SwitchToggle } from "./SwitchToggle/SwitchToggle";
import { ActionButton } from "./ActionButton/ActionButton";
import { SwitchNeon } from "./SwitchNeon/SwitchNeon";
import { Sensor } from "./Sensor/Sensor";
import { StateMessage } from "./StateMessage/StateMessage";
import { RawState } from "./RawState/RawState";
import { TextTicker } from "./TextTicker/TextTicker";
import { Clock } from "./Clock/Clock";
import { Weather } from "./Weather/Weather";
import { PhotoFrame } from "./PhotoFrame/PhotoFrame";
import { ColorSlider } from "./ColorSlider/ColorSlider";
import { WhiteSlider } from "./WhiteSlider/WhiteSlider";

/**
 * Registry des widgets disponibles
 * Mappe les component names (depuis la BDD) aux composants React
 */

type WidgetComponent = React.FC<WidgetComponentProps>;

interface WidgetRegistryMap {
  [componentName: string]: WidgetComponent;
}

export const widgetRegistry: WidgetRegistryMap = {
  Switch: Switch,
  SwitchToggle: SwitchToggle,
  ActionButton: ActionButton,
  SwitchNeon: SwitchNeon,
  Sensor: Sensor,
  StateMessage: StateMessage,
  RawState: RawState,
  TextTicker: TextTicker,
  Clock: Clock,
  Weather: Weather,
  PhotoFrame: PhotoFrame,
  ColorSlider: ColorSlider,
  WhiteSlider: WhiteSlider,
  // Ajouter d'autres widgets ici au fur et à mesure:
  // 'Slider': Slider,
  // etc.
};

/**
 * Récupère un composant widget par son nom
 */
export function getWidgetComponent(
  componentName: string,
): WidgetComponent | null {
  return widgetRegistry[componentName] || null;
}

/**
 * Vérifie si un widget est enregistré
 */
export function isWidgetRegistered(componentName: string): boolean {
  return componentName in widgetRegistry;
}
