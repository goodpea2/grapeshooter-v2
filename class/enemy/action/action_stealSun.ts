import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { GRID_SIZE } from '../../../constants';

export class ActionStealSun extends EnemyAction {
  tags = ['stealSun'];

  constructor(config: EnemyActionConfig) {
    super(config);
  }

  canExecute(): boolean {
    if (this.isLocked()) return false;
    if (this.enemy.isDying || this.enemy.isAirborne) return false;
    return true;
  }

  isReady(): boolean {
    return true;
  }

  update(playerPos: any, turrets: any[]): void {
    if (!this.canExecute()) return;
    this.execute();
  }

  performExecute(): void {
    const enemy = this.enemy;
    if (!enemy.stealSunTarget || enemy.stealSunTarget.life <= 0) {
      let bestSun: any = null;
      let minDistSq = (enemy.actionConfig.stealRange || GRID_SIZE * 6) ** 2;

      state.activeChunkKeys.forEach((key: string) => {
        const chunk = state.world.chunks.get(key);
        if (chunk) {
          for (let l of chunk.loot) {
            if (l.typeKey === 'sun') {
              const dSq = (enemy.pos.x - l.pos.x) ** 2 + (enemy.pos.y - l.pos.y) ** 2;
              if (dSq < minDistSq) {
                minDistSq = dSq;
                bestSun = l;
              }
            }
          }
        }
      });
      enemy.stealSunTarget = bestSun;
    }

    if (enemy.stealSunTarget) {
      const tp = enemy.stealSunTarget.pos;
      const dSqToSun = (enemy.pos.x - tp.x) ** 2 + (enemy.pos.y - tp.y) ** 2;
      if (dSqToSun < (enemy.size * 0.5 + 20) ** 2) {
        if (enemy.stealSunTarget.life > 0) {
          enemy.stealSunTarget.life = 0;
          enemy.takeDamage(-(enemy.actionConfig.healPerSun || 80));
        }
        enemy.stealSunTarget = null;
      }
    }
  }
}
