/**
 * Registry pour gérer les modules de dashboard
 * Permet d'ajouter, récupérer et lister les modules disponibles
 */

import { DashboardModule } from './ModuleInterface';

class ModuleRegistry {
  private modules: Map<string, DashboardModule> = new Map();

  /**
   * Enregistrer un nouveau module
   */
  register(module: DashboardModule) {
    this.modules.set(module.id, module);
  }

  /**
   * Récupérer un module par son ID
   */
  get(id: string): DashboardModule | undefined {
    return this.modules.get(id);
  }

  /**
   * Lister tous les modules disponibles
   */
  list(): DashboardModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Vérifier si un module existe
   */
  has(id: string): boolean {
    return this.modules.has(id);
  }
}

// Instance singleton
export const moduleRegistry = new ModuleRegistry();
