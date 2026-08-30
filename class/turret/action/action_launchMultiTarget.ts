
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { MuzzleFlash } from '../../../vfx/index';
import { triggerUpgradeHook } from '../../../src/upgrades';

declare const createVector: any;
declare const atan2: any;
declare const random: any;

export class ActionLaunchMultiTarget extends TurretAction {
  tags = ['attack', 'projectile', 'artillery', 'multiTarget'];

  getFireRateInfo() {
    const config = this.turret.config.actionConfig;
    const stats = this.turret.stats;
    const frMultiplier = this.turret.fireRateMultiplier || 1;
    const type = 'launchMultiTarget';
    const step = this.turret.actionSteps.get(type) || 0;
    
    const frValue = config.shootFireRate || 60;
    const baseFR = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
    const frDivider = stats.firerateDivider || 1.0;
    
    let effectiveFireRate = baseFR / (frDivider * frMultiplier);
    let bulletsToSpawn = 1;
    if (effectiveFireRate > 0) {
      while (effectiveFireRate < 4) {
        effectiveFireRate *= 2;
        bulletsToSpawn *= 2;
      }
    }

    return { effectiveFireRate, bulletsToSpawn };
  }

  isReady(): boolean {
    if (this.isLocked()) return false;
    const type = 'launchMultiTarget';
    const lastTrigger = this.turret.actionTimers.get(type) || 0;
    const subStepKey = type + '_subStep';
    const subStep = this.turret.actionSteps.get(subStepKey) || 0;
    const { effectiveFireRate } = this.getFireRateInfo();

    return (state.frames - lastTrigger > effectiveFireRate) || (subStep > 0);
  }

  needsTarget(): boolean {
    return true;
  }

  getRange(): number {
    return (this.turret.config.actionConfig.shootRange || 300) * (this.turret.stats.rangeMult || 1);
  }

  needsLOS(): boolean {
    return false;
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const stats = this.turret.stats;
    const type = 'launchMultiTarget';
    const step = this.turret.actionSteps.get(type) || 0;
    const subStepKey = type + '_subStep';
    const lastSubKey = type + '_lastSub';
    const subStep = this.turret.actionSteps.get(subStepKey) || 0;
    const lastSub = this.turret.actionTimers.get(lastSubKey) || 0;
    
    if (subStep === 0) {
      const range = this.getRange();
      const initialTargets = (this.turret as any).findAllTargetsWithin(range);
      if (initialTargets.length > 0) { 
        this.turret.actionSteps.set(subStepKey, 1); 
        this.turret.actionTimers.set(lastSubKey, state.frames); 
        this.turret.actionTimers.set(type, state.frames); 
      }
    }
    
    if (subStep > 0) {
      const delay = config.multiTargetShootDelay || 6;
      if (state.frames - lastSub >= delay) {
        const range = this.getRange();
        const potentialTargets = (this.turret as any).findAllTargetsWithin(range);
        if (potentialTargets.length > 0) {
          const targetIdx = (subStep - 1) % potentialTargets.length;
          const target = potentialTargets[targetIdx];
          const tc = target.getWorldPos ? target.getWorldPos() : (target.gx !== undefined ? createVector(target.gx * 32 + 16, target.gy * 32 + 16) : target.pos);
          if (tc) {
            this.turret.angle = atan2(tc.y - wPos.y, tc.x - wPos.x);
            const bulletCount = config.shootBulletCount || 1;
            for (let i = 0; i < bulletCount; i++) {
              let startX = wPos.x;
              let startY = wPos.y;
              if (i > 0) {
                startX += random(-10, 10);
                startY += random(-10, 10);
              }
              let b = new Bullet(startX, startY, tc.x, tc.y, config.bulletTypeKey, 'enemy', this.turret);
              (b as any).isArtillery = true;
              (b as any).arcHeight = (config.arcHeight || 100) * (1 + random(-0.2, 0.2));
              state.bullets.push(b);
            }
            state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, this.turret.angle));
            this.turret.recoil = 10;
            this.turret.pulseAnimTimer = 12;
          }
        }
        this.turret.actionTimers.set(lastSubKey, state.frames);
        const nextStep = subStep + 1;
        const maxCnt = config.multiTargetMaxCount || 3;
        if (nextStep > maxCnt) {
           this.turret.actionSteps.set(subStepKey, 0);
           this.turret.actionSteps.set(type, step + 1);
           this.turret.actionCount.set(type, (this.turret.actionCount.get(type) || 0) + 1);
           triggerUpgradeHook('onShot', this.turret, { actionType: 'launchMultiTarget', bulletTypeKey: config.bulletTypeKey });
        }
        else this.turret.actionSteps.set(subStepKey, nextStep);
      }
    }
  }

  update() {
  }
}
