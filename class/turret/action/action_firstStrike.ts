
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';

declare const createVector: any;
declare const random: any;

export class ActionFirstStrike extends TurretAction {
  tags = ['attack', 'firstStrike'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    if ((this.turret as any).firstStrikeCount <= 0) return false;
    const config = this.turret.config.actionConfig;
    const type = 'firstStrike';
    const lastTrigger = this.turret.actionTimers.get(type) || 0;
    const triggerRate = config.firstStrikeConfig?.triggerRate || 10;
    return state.frames - lastTrigger >= triggerRate;
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    const config = this.turret.config.actionConfig;
    const fsc = config.firstStrikeConfig;
    if (fsc?.actionToTrigger === 'spawnBulletAtRandom') {
      const sbc = config.spawnBulletAtRandom;
      return (sbc?.distRange ? sbc.distRange[1] : 300) * (this.turret.stats.rangeMult || 1);
    }
    if (fsc?.actionToTrigger === 'pulse') {
      return (config.pulseTriggerRadius || 0) * (this.turret.stats.rangeMult || 1);
    }
    return 0;
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'firstStrike';
    
    const fsc = config.firstStrikeConfig;
    if (!fsc) return;
    
    const triggerCount = 1;
    
    for (let i = 0; i < triggerCount; i++) {
      if (fsc.actionToTrigger === 'spawnBulletAtRandom') {
          const sbc = config.spawnBulletAtRandom;
          if (sbc) {
            const range = this.getRange();
            const minRange = (sbc.distRange ? sbc.distRange[0] : 0) * (this.turret.stats.rangeMult || 1);
            const ang = random(Math.PI * 2); const r = random(minRange, range);
            const tx = wPos.x + Math.cos(ang) * r; const ty = wPos.y + Math.sin(ang) * r;
            let b = new Bullet(wPos.x, wPos.y, tx, ty, sbc.bulletKey, 'none', this.turret); 
            (b as any).targetPos = createVector(tx, ty);
            state.bullets.push(b); 
            this.turret.recoil = 8;
          }
      }
      if (fsc.actionToTrigger === 'pulse') {
        if (config.pulseBulletTypeKey) {
          let b = new Bullet(wPos.x, wPos.y, wPos.x, wPos.y, config.pulseBulletTypeKey, 'none', this.turret); 
          (b as any).life = 0; 
          state.bullets.push(b);
        }
      }
    }
    (this.turret as any).firstStrikeCount--;
    this.turret.actionTimers.set(type, state.frames);
    (this.turret as any).pulseAnimTimer = 10;
  }

  update() {
  }
}
