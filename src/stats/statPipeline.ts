/**
 * Reactive Stat Modifier Pipeline with Dirty-Flag Caching
 * Handles base values, flat bonuses, additive percentages, and multiplicative percentages
 * for Player, Turrets, Bullets, and Enemies.
 */

export type StatModifierType = 'flat' | 'percent_add' | 'percent_mult';

export interface StatModifier {
  id: string;
  statKey: string;
  type: StatModifierType;
  value: number;
  source?: string;
  expiresFrame?: number; // Optional frame-based expiry
}

export class StatContainer {
  private baseStats: Map<string, number> = new Map();
  private modifiers: Map<string, StatModifier[]> = new Map();
  private cachedValues: Map<string, number> = new Map();
  private isDirty: boolean = true;

  constructor(initialStats?: Record<string, number>) {
    if (initialStats) {
      for (const [k, v] of Object.entries(initialStats)) {
        this.baseStats.set(k, v);
      }
    }
  }

  /**
   * Set base value for a stat
   */
  setBase(statKey: string, value: number): void {
    if (this.baseStats.get(statKey) !== value) {
      this.baseStats.set(statKey, value);
      this.isDirty = true;
    }
  }

  /**
   * Get raw base value
   */
  getBase(statKey: string, defaultValue: number = 0): number {
    return this.baseStats.get(statKey) ?? defaultValue;
  }

  /**
   * Add a modifier to a stat
   */
  addModifier(mod: StatModifier): void {
    let list = this.modifiers.get(mod.statKey);
    if (!list) {
      list = [];
      this.modifiers.set(mod.statKey, list);
    }
    // Replace existing if matching ID
    const existingIdx = list.findIndex(m => m.id === mod.id);
    if (existingIdx >= 0) {
      list[existingIdx] = mod;
    } else {
      list.push(mod);
    }
    this.isDirty = true;
  }

  /**
   * Remove modifier by id
   */
  removeModifier(id: string, statKey?: string): boolean {
    let removed = false;
    if (statKey) {
      const list = this.modifiers.get(statKey);
      if (list) {
        const next = list.filter(m => m.id !== id);
        if (next.length !== list.length) {
          this.modifiers.set(statKey, next);
          removed = true;
          this.isDirty = true;
        }
      }
    } else {
      for (const [k, list] of this.modifiers.entries()) {
        const next = list.filter(m => m.id !== id);
        if (next.length !== list.length) {
          this.modifiers.set(k, next);
          removed = true;
          this.isDirty = true;
        }
      }
    }
    return removed;
  }

  /**
   * Clean expired modifiers based on current frame number
   */
  cleanExpired(currentFrame: number): void {
    for (const [k, list] of this.modifiers.entries()) {
      const next = list.filter(m => m.expiresFrame === undefined || m.expiresFrame > currentFrame);
      if (next.length !== list.length) {
        this.modifiers.set(k, next);
        this.isDirty = true;
      }
    }
  }

  /**
   * Clear all active modifiers
   */
  clearModifiers(): void {
    if (this.modifiers.size > 0) {
      this.modifiers.clear();
      this.isDirty = true;
    }
  }

  /**
   * Get calculated final stat value with caching
   */
  get(statKey: string, defaultValue: number = 0, currentFrame?: number): number {
    if (currentFrame !== undefined) {
      this.cleanExpired(currentFrame);
    }

    if (!this.isDirty && this.cachedValues.has(statKey)) {
      return this.cachedValues.get(statKey)!;
    }

    const base = this.baseStats.get(statKey) ?? defaultValue;
    const mods = this.modifiers.get(statKey);
    if (!mods || mods.length === 0) {
      this.cachedValues.set(statKey, base);
      return base;
    }

    let flatTotal = 0;
    let percentAddTotal = 0;
    let percentMultTotal = 1.0;

    for (let i = 0; i < mods.length; i++) {
      const m = mods[i];
      if (m.type === 'flat') {
        flatTotal += m.value;
      } else if (m.type === 'percent_add') {
        percentAddTotal += m.value;
      } else if (m.type === 'percent_mult') {
        percentMultTotal *= (1.0 + m.value / 100);
      }
    }

    const finalVal = (base + flatTotal) * Math.max(0, 1.0 + percentAddTotal / 100) * percentMultTotal;
    this.cachedValues.set(statKey, finalVal);
    return finalVal;
  }

  /**
   * Invalidate cache
   */
  markDirty(): void {
    this.isDirty = true;
    this.cachedValues.clear();
  }
}
