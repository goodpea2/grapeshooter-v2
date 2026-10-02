
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { MuzzleFlash, spawnNeighborBuffParticle } from '../../../vfx/index';
import { triggerUpgradeHook } from '../../../src/upgrades';
import { conditionTypes } from '../../../balanceConditions';
import { soundEngine } from '../../../src/audio/soundEngine';


export class ActionShoot extends TurretAction {
  tags = ['attack', 'projectile'];

  private getFireRateInfo() {
    const config = this.turret.getActiveActionConfig ? this.turret.getActiveActionConfig() : this.turret.config.actionConfig;
    const type = 'shoot';
    const step = this.turret.actionSteps.get(type) || 0;
    
    let frValue = config.shootFireRate;
    const fr = Array.isArray(frValue) ? frValue[step % frValue.length] : frValue;
    
    const frMultiplier = this.turret.getFireRateMultiplier ? this.turret.getFireRateMultiplier() : (this.turret.fireRateMultiplier || 1.0);

    let effectiveFireRate = fr / frMultiplier;
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
    const config = this.turret.getActiveActionConfig ? this.turret.getActiveActionConfig() : this.turret.config.actionConfig;
    let baseRange = config.shootRange || 300;
    return baseRange * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady() && !!this.turret.target;
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.getActiveActionConfig ? this.turret.getActiveActionConfig() : this.turret.config.actionConfig;
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

    if (this.turret.buffingNeighbors && this.turret.buffingNeighbors.length > 0) {
      for (const n of this.turret.buffingNeighbors) {
        if (n && n.getWorldPos) {
          const np = n.getWorldPos();
          state.vfx.push(spawnNeighborBuffParticle(np.x, np.y, wPos.x, wPos.y));
        }
      }
    }

    const { bulletsToSpawn } = this.getFireRateInfo();
    const bulletCount = config.shootBulletCount || 1;
    const totalBullets = bulletsToSpawn * bulletCount;
    const totalInaccuracy = (config.inaccuracy || 0) + (this.turret.stats?.inaccuracyAdd || this.turret.activeStats?.inaccuracyAdd || 0);
    
    for (let i = 0; i < totalBullets; i++) {
      let sa = this.turret.angle + (totalInaccuracy ? random(-radians(totalInaccuracy), radians(totalInaccuracy)) : 0);
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

    if (this.turret.isCharged && this.turret.isCharged()) {
      let stamCost = config.staminaCostPerBulletSpawned || config.StaminaCostPerBulletSpawned || 0;
      if (this.turret.activeStats?.staminaCostAdd) {
        stamCost += this.turret.activeStats.staminaCostAdd;
      }
      if ((state.turretUpgrades?.['t3_bowling'] || []).includes('u_t3_bowling_5') && this.turret.type === 't3_bowling') {
        stamCost += 3;
      }
      if (stamCost > 0 && state.player) {
        state.player.spendStamina(stamCost * totalBullets, this.turret);
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
