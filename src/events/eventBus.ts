/**
 * High-Performance Decoupled Game Event Bus
 * Provides strongly-typed subscriptions, O(1) event dispatch, and clean decoupling
 * for Audio triggers, UI notifications, Rogue-like upgrade hooks, and gameplay metrics.
 */

export type GameEventType =
  | 'ENEMY_KILLED'
  | 'ENEMY_DAMAGED'
  | 'TURRET_FIRED'
  | 'TURRET_PLACED'
  | 'TURRET_MERGED'
  | 'TURRET_DESTROYED'
  | 'BLOCK_MINED'
  | 'PAYGATE_UNLOCKED'
  | 'WAVE_SPAWNED'
  | 'PLAYER_HEALED'
  | 'PLAYER_DAMAGED'
  | 'UPGRADE_SELECTED'
  | 'UI_NOTIFICATION';

export interface GameEventPayloads {
  ENEMY_KILLED: { enemy: any; source: any; pos: { x: number; y: number }; isBoss?: boolean; typeKey: string };
  ENEMY_DAMAGED: { enemy: any; source: any; amount: number; isCrit?: boolean };
  TURRET_FIRED: { turret: any; bullet?: any; targetPos?: any };
  TURRET_PLACED: { turret: any; isAttached: boolean; pos: any };
  TURRET_MERGED: { resultTurret: any; ingredientTypes: string[]; pos: any };
  TURRET_DESTROYED: { turret: any; pos: any };
  BLOCK_MINED: { block: any; pos: any; source: any };
  PAYGATE_UNLOCKED: { paygate: any; cost?: any };
  WAVE_SPAWNED: { waveIndex: number; budget: number };
  PLAYER_HEALED: { amount: number; source?: any };
  PLAYER_DAMAGED: { amount: number; source?: any };
  UPGRADE_SELECTED: { turretType: string; upgradeId: string };
  UI_NOTIFICATION: { text: string; type?: 'info' | 'warn' | 'success'; color?: string };
}

export type EventHandler<T extends GameEventType = GameEventType> = (payload: GameEventPayloads[T]) => void;

class GameEventBus {
  private handlers: Map<GameEventType, Set<EventHandler<any>>> = new Map();
  private onceHandlers: Map<GameEventType, Set<EventHandler<any>>> = new Map();

  /**
   * Subscribe to a game event
   * @returns Unsubscribe function
   */
  on<T extends GameEventType>(eventType: T, handler: (payload: GameEventPayloads[T]) => void): () => void {
    let set = this.handlers.get(eventType);
    if (!set) {
      set = new Set();
      this.handlers.set(eventType, set);
    }
    set.add(handler);

    return () => {
      set?.delete(handler);
    };
  }

  /**
   * Subscribe to a game event once
   */
  once<T extends GameEventType>(eventType: T, handler: (payload: GameEventPayloads[T]) => void): () => void {
    let set = this.onceHandlers.get(eventType);
    if (!set) {
      set = new Set();
      this.onceHandlers.set(eventType, set);
    }
    set.add(handler);

    return () => {
      set?.delete(handler);
    };
  }

  /**
   * Emit an event with typed payload to all subscribers
   */
  emit<T extends GameEventType>(eventType: T, payload: GameEventPayloads[T]): void {
    // Normal handlers
    const set = this.handlers.get(eventType);
    if (set && set.size > 0) {
      for (const handler of set) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${eventType}:`, err);
        }
      }
    }

    // Once handlers
    const onceSet = this.onceHandlers.get(eventType);
    if (onceSet && onceSet.size > 0) {
      const handlersToRun = Array.from(onceSet);
      this.onceHandlers.delete(eventType);
      for (const handler of handlersToRun) {
        try {
          handler(payload);
        } catch (err) {
          console.error(`[EventBus] Error in once-handler for ${eventType}:`, err);
        }
      }
    }
  }

  /**
   * Remove all handlers
   */
  clear(): void {
    this.handlers.clear();
    this.onceHandlers.clear();
  }
}

export const eventBus = new GameEventBus();
