
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';

declare const createVector: any;
declare const random: any;
declare const floor: any;

export class ActionSpawnOnTargetDeath extends TurretAction {
  tags = ['utility', 'reactive'];

  isReady(): boolean {
    return true; 
  }

  needsTarget(): boolean {
    return false;
  }

  canExecute(): boolean {
    return false; // This action is reactive, not triggered by the standard execute loop
  }

  performExecute() {
    // Do nothing in standard execution
  }

  onTargetKilled(target: any) {
    // If target is a mined block / tile, block death is handled exclusively by onTargetMined
    if (target && (target.gx !== undefined || target.isMined !== undefined || target.overlay !== undefined)) {
      return;
    }
    const config = this.turret.config.actionConfig;
    const vConfig = config.spawnOnTargetDeathConfig;
    if (!vConfig) return;
    this.spawnBullets(target, vConfig);
  }

  onTargetMined(target: any, context?: any) {
    const config = this.turret.config.actionConfig;
    const vConfig = config.spawnOnTargetDeathConfig;
    if (!vConfig || !vConfig.triggerOnMine) return;
    this.spawnBullets(target, vConfig);
  }

  private spawnBullets(target: any, vConfig: any) {
    if (vConfig.onlyTriggerFromIntendedTargetDeath && target !== this.turret.target) {
      return;
    }

    const wPos = this.turret.getWorldPos();
    const tc = target.getWorldPos ? target.getWorldPos() : (target.gx !== undefined ? createVector(target.gx * 40 + 20, target.gy * 40 + 20) : (target.pos ? target.pos.copy() : null));
    if (!tc) return;

    const spawnAt = vConfig.spawnAt === 'turret' ? wPos : tc;
    const count = vConfig.count || 1;
    const bulletKey = vConfig.bulletTypeKey;
    if (!bulletKey) return;

    if (vConfig.pattern === 'volley') {
      const angleStep = (Math.PI * 2) / count;
      for (let i = 0; i < count; i++) {
        const angle = i * angleStep;
        const tx = spawnAt.x + Math.cos(angle) * 100;
        const ty = spawnAt.y + Math.sin(angle) * 100;
        state.bullets.push(new Bullet(spawnAt.x, spawnAt.y, tx, ty, bulletKey, 'enemy', this.turret));
      }
    } else {
      for (let i = 0; i < count; i++) {
        // Default to spawning at target position if no pattern specified
        state.bullets.push(new Bullet(spawnAt.x, spawnAt.y, spawnAt.x, spawnAt.y, bulletKey, 'none', this.turret));
      }
    }
  }

  update() {
  }
}
