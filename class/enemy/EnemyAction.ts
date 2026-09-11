export interface EnemyActionConfig {
  enemy: any;
  [key: string]: any;
}

export abstract class EnemyAction {
  enemy: any;
  tags: string[] = [];

  constructor(config: EnemyActionConfig) {
    this.enemy = config.enemy;
  }

  abstract update(playerPos: any, turrets: any[]): void;
  abstract canExecute(): boolean;
  abstract isReady(): boolean;

  execute() {
    this.enemy.onActionExecute?.(this.constructor.name);
    this.performExecute();
    this.enemy.onActionComplete?.(this.constructor.name);
  }

  abstract performExecute(): void;

  onDamage(dmg: number, source?: any): boolean {
    return false;
  }

  onDeath() {}

  onLand() {}

  isLocked(): boolean {
    return this.enemy.isActionLocked(this.tags);
  }

  lock(tags: string[]) {
    this.enemy.lockActions(tags);
  }

  unlock(tags: string[]) {
    this.enemy.unlockActions(tags);
  }
}
