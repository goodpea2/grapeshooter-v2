import { EnemyAction, EnemyActionConfig } from '../EnemyAction';

export class ActionSpawnEnemy extends EnemyAction {
  tags = ['summon'];

  constructor(config: EnemyActionConfig) {
    super(config);
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    return true;
  }

  isReady(): boolean {
    return true;
  }

  update(playerPos: any, turrets: any[]): void {
    const enemy = this.enemy;
    if (enemy.isDying) return;

    if (enemy.actionConfig?.spawnTriggerOnHealthRatio) {
      const ratio = enemy.health / enemy.maxHealth;
      for (const t of enemy.actionConfig.spawnTriggerOnHealthRatio) {
        if (t > 0 && ratio <= t && !enemy.triggeredSpawnThresholds.has(t)) {
          enemy.triggeredSpawnThresholds.add(t);
          this.execute();
        }
      }
    }
  }

  performExecute(): void {
    this.enemy.performSummon?.();
  }
}
