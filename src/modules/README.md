# Architecture Modulaire

## Concept

Ce projet utilise une architecture modulaire pour les widgets de dashboard. Chaque module est un composant React qui respecte une interface standard.

## Structure

```
src/modules/
├── base/
│   ├── ModuleInterface.ts    # Interface TypeScript pour les modules
│   └── ModuleRegistry.ts     # Registry pour gérer les modules
├── Switch/
│   └── Switch.tsx            # Module switch on/off
├── Slider/                   # À venir
└── Sensor/                   # À venir
```

## Créer un module

1. Créer un dossier avec le nom du module
2. Créer un composant React qui respecte `ModuleProps`
3. Enregistrer le module dans le registry

```typescript
import { ModuleProps } from '../base/ModuleInterface';

export function MyModule({ device, onCommand, config }: ModuleProps) {
  return (
    <div>
      <h3>{device.name}</h3>
      {/* Votre UI ici */}
    </div>
  );
}
```

## Vision future

- **Phase 2** : Storybook pour prévisualiser les modules
- **Phase 3** : Modules NPM packages (@home-dashboard/module-*)
- **Phase 4** : Marketplace de modules communautaires
- **Phase 5** : Système de plugins avec dynamic loading

## MVP

Pour le MVP, les modules sont intégrés dans l'app. Plus tard, ils pourront être chargés dynamiquement.
