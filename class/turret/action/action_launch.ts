
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { MuzzleFlash } from '../../../vfx/index';
import { triggerUpgradeHook } from '../../../src/upgrades';

declare const atan2: any;
declare const random: any;
declare const radians: any;

export class ActionLaunch extends TurretAction {
  tags = ['attack', 'projectile', 'artillery'];

  getFireRateInfo() {
    const config = this.turret.config.actionConfig;
    const stats = this.turret.stats;
    const frMultiplier = this.turret.fireRateMultiplier || 1;
    const type = 'launch';
    const step = this.turret.actionSteps.get(type) || 0;
    
    const frValue = config.shootFireRate || 60;
    const baseFR = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
    const frDivider = stats.firerateDivider || 1.0;
    
    let effectiveFireRate = baseFR / (frDivider * frMultiplier);
    let bulletsToSpawn = 1;
    
    if (effectiveFireRate < 2) {
      bulletsToSpawn = Math.floor(2 / effectiveFireRate);
      effectiveFireRate = 2;
    }

    return { effectiveFireRate, bulletsToSpawn };
  }

  isReady(): boolean {
    if (this.isLocked()) return false;
    const type = 'launch';
    const lastTrigger = this.turret.actionTimers.get(type) || 0;
    const { effectiveFireRate } = this.getFireRateInfo();
    return (state.frames - lastTrigger > effectiveFireRate);
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
    return this.isReady() && !!this.turret.target;
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'launch';
    const step = this.turret.actionSteps.get(type) || 0;

    const tCenter = this.turret.getTargetCenter();
    if (!tCenter) return;

    this.turret.angle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x);

    const { effectiveFireRate, bulletsToSpawn } = this.getFireRateInfo();
    const bulletCount = config.shootBulletCount || 1;
    const totalBullets = bulletsToSpawn * bulletCount;

    for (let i = 0; i < totalBullets; i++) {
      let sa = this.turret.angle + (config.inaccuracy ? random(-radians(config.inaccuracy), radians(config.inaccuracy)) : 0);
      let startX = wPos.x;
      let startY = wPos.y;
      let targetX = tCenter.x + (config.spread ? random(-config.spread, config.spread) : 0);
      let targetY = tCenter.y + (config.spread ? random(-config.spread, config.spread) : 0);

      const b = new Bullet(startX, startY, targetX, targetY, config.bulletTypeKey, 'enemy', this.turret);
      (b as any).isArtillery = true;
      (b as any).arcHeight = (config.arcHeight || 100) * (1 + random(-0.2, 0.2));
      state.bullets.push(b);

      if (i === 0) {
        state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, sa));
      }
    }

    triggerUpgradeHook('onShot', this.turret, { actionType: 'launch', bulletTypeKey: config.bulletTypeKey });
    this.turret.recoil = 6;
    this.turret.actionTimers.set(type, state.frames);
    this.turret.actionSteps.set(type, step + 1);
    this.turret.pulseAnimTimer = 8;
    this.turret.actionCount.set(type, (this.turret.actionCount.get(type) || 0) + 1);

    if (this.turret.config.targetConfig?.enemyPriority === 'random') {
      this.turret.target = null;
    }
  }

  update() {
  }
}
