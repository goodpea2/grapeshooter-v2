
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { MuzzleFlash } from '../../../vfx/index';
import { triggerUpgradeHook } from '../../../src/upgrades';
import { conditionTypes } from '../../../balanceConditions';
import { soundEngine } from '../../../src/audio/soundEngine';

declare const createVector: any;
declare const random: any;
declare const floor: any;
declare const atan2: any;
declare const cos: any;
declare const sin: any;
declare const radians: any;
declare const TWO_PI: any;
declare const lerp: any;

export class ActionShoot extends TurretAction {
  tags = ['attack', 'projectile'];

  private getFireRateInfo() {
    const config = this.turret.config.actionConfig;
    const type = 'shoot';
    const step = this.turret.actionSteps.get(type) || 0;
    
    const isCharged = this.turret.isCharged ? this.turret.isCharged() : false;
    let frValue = config.shootFireRate;
    if (isCharged && this.turret.config.whileCharged?.shootFireRate !== undefined) {
      frValue = this.turret.config.whileCharged.shootFireRate;
    }
    const fr = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
    
    let frDivider = (this.turret as any).activeStats?.firerateDivider || 1.0;
    for (const [cKey, duration] of this.turret.conditions) {
      const cfg = conditionTypes[cKey];
      if (cfg?.firerateBoost) frDivider += cfg.firerateBoost;
    }

    let effectiveFireRate = fr / (frDivider * this.turret.fireRateMultiplier);
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
    const type = 'shoot';
    const lastTrigger = this.turret.actionTimers.get(type) || -99999;
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

  canExecute(): boolean {
    return this.isReady() && !!this.turret.target;
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'shoot';
    const step = this.turret.actionSteps.get(type) || 0;
    
    const tCenter = this.turret.getTargetCenter();
    if (!tCenter) return;
    
    const targetAngle = atan2(tCenter.y - wPos.y, tCenter.x - wPos.x);
    
    // Handle rotation
    if (config.selfSpinDuration) {
      this.turret.spinFrames++;
      const cycleTime = this.turret.spinFrames;
      const duration = config.selfSpinDuration;
      const speed = config.selfSpinSpeed * TWO_PI / 60; 
      if (config.selfSpinBehavior === 'pingpong') {
        const period = duration * 2;
        const phase = cycleTime % period;
        let offset;
        if (phase < duration) offset = phase * speed;
        else offset = (period - phase) * speed;
        this.turret.angle = targetAngle + offset;
      } else {
        const phase = cycleTime % duration;
        this.turret.angle = targetAngle + (phase * speed);
      }
    } else if (!this.turret.config.randomRotation) {
      this.turret.angle = targetAngle;
    }

    const { bulletsToSpawn } = this.getFireRateInfo();
    const bulletCount = config.shootBulletCount || 1;
    const totalBullets = bulletsToSpawn * bulletCount;
    
    for (let i = 0; i < totalBullets; i++) {
      let sa = this.turret.angle + (config.inaccuracy ? random(-radians(config.inaccuracy), radians(config.inaccuracy)) : 0);
      let startX = wPos.x;
      let startY = wPos.y;
      let targetX = wPos.x + cos(sa) * 500;
      let targetY = wPos.y + sin(sa) * 500;

      if (i > 0 || bulletCount > 1) {
        const offX = random(-15, 15);
        const offY = random(-15, 15);
        startX += offX;
        startY += offY;
        targetX += offX;
        targetY += offY;
      }
      
      const b = Bullet.create(startX, startY, targetX, targetY, config.bulletTypeKey, 'enemy', this.turret);
      state.bullets.push(b);
      
      if (i === 0) {
        state.vfx.push(new MuzzleFlash(wPos.x, wPos.y, sa));
        soundEngine.playSFXGroup('shoot_light');
      }
    }

    triggerUpgradeHook('onShot', this.turret, { actionType: 'shoot', bulletTypeKey: config.bulletTypeKey });
    this.turret.recoil = 6; 
    this.turret.actionTimers.set(type, state.frames);
    this.turret.actionSteps.set(type, step + 1);
    this.turret.actionCount.set(type, (this.turret.actionCount.get(type) || 0) + 1);
    this.turret.pulseAnimTimer = 8;
    
    if (this.turret.config.targetConfig?.enemyPriority === 'random') {
      this.turret.target = null;
    }
  }

  update() {
  }
}
