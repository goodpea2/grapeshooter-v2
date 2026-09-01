
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { MuzzleFlash } from '../../../vfx/index';
import { triggerUpgradeHook } from '../../../src/upgrades';
import { GRID_SIZE } from '../../../constants';

declare const atan2: any;
declare const random: any;
declare const radians: any;
declare const TWO_PI: any;

export class ActionLaunch extends TurretAction {
  tags = ['attack', 'projectile', 'artillery'];

  getFireRateInfo() {
    const config = this.turret.config.actionConfig;
    const stats = this.turret.stats;
    const frMultiplier = this.turret.fireRateMultiplier || 1;
    const type = 'launch';
    const step = this.turret.actionSteps.get(type) || 0;
    
    const isCharged = this.turret.isCharged ? this.turret.isCharged() : false;
    let frValue = config.shootFireRate || 60;
    if (isCharged && this.turret.config.whileCharged?.shootFireRate !== undefined) {
      frValue = this.turret.config.whileCharged.shootFireRate;
    }
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
    const type = 'launch';
    const lastTrigger = this.turret.actionTimers.get(type) || 0;
    const { effectiveFireRate } = this.getFireRateInfo();
    return (state.frames - lastTrigger > effectiveFireRate);
  }

  needsTarget(): boolean {
    return true;
  }

  getRange(): number {
    const isCharged = this.turret.isCharged ? this.turret.isCharged() : false;
    let baseRange = this.turret.config.actionConfig.shootRange || 300;
    if (isCharged && this.turret.config.whileCharged?.shootRange !== undefined) {
      baseRange = this.turret.config.whileCharged.shootRange;
    }
    return baseRange * (this.turret.stats.rangeMult || 1);
  }

  needsLOS(): boolean {
    return false;
  }

  canExecute(): boolean {
    const isCharged = this.turret.isCharged ? this.turret.isCharged() : false;
    if (isCharged && this.turret.config.whileCharged?.shootRandomPosWhenNoTarget) {
      return this.isReady();
    }
    return this.isReady() && !!this.turret.target;
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'launch';
    const step = this.turret.actionSteps.get(type) || 0;
    const isCharged = this.turret.isCharged ? this.turret.isCharged() : false;

    let tCenter = this.turret.getTargetCenter();
    if (!tCenter) {
      if (isCharged && this.turret.config.whileCharged?.shootRandomPosWhenNoTarget) {
        const randAngle = random(TWO_PI);
        const maxR = this.getRange();
        const randDist = random(GRID_SIZE * 1.5, maxR);
        tCenter = { x: wPos.x + Math.cos(randAngle) * randDist, y: wPos.y + Math.sin(randAngle) * randDist };
      } else {
        return;
      }
    }

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

      const b = Bullet.create(startX, startY, targetX, targetY, config.bulletTypeKey, 'enemy', this.turret);
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
