
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { WeldingHitVFX } from '../../../vfx/index';
import { Bullet } from '../../bullet';
import { GRID_SIZE } from '../../../constants';

declare const createVector: any;
declare const random: any;
declare const floor: any;

export class ActionLaserBeam extends TurretAction {
  tags = ['attack', 'laser'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    return true; // Laser beam is continuous
  }

  needsTarget(): boolean {
    return true;
  }

  getRange(): number {
    return (this.turret.config.actionConfig.beamMaxLength || 300) * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady() && !!this.turret.target;
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'laserBeam';
    
    const target = this.turret.target;
    if (target) {
      const targetId = target.uid || `${target.gx},${target.gy}`;
      if (targetId === (this.turret as any).lastTargetUid) (this.turret as any).uninterruptedFrames++;
      else { (this.turret as any).lastTargetUid = targetId; (this.turret as any).uninterruptedFrames = 0; }
      
      let currentDamage = config.beamDamage * (this.turret.stats?.damageMult || 1.0) + (this.turret.stats?.damageAdd || 0);
      if (config.uninteruptedDamageIncrease && config.uninteruptedTimeForDamageIncrease) {
          let cumulativeTime = 0; let foundBracket = -1;
          for (let i = 0; i < config.uninteruptedTimeForDamageIncrease.length; i++) {
              cumulativeTime += config.uninteruptedTimeForDamageIncrease[i];
              if ((this.turret as any).uninterruptedFrames >= cumulativeTime) { 
                currentDamage = config.uninteruptedDamageIncrease[i] * (this.turret.stats?.damageMult || 1.0) + (this.turret.stats?.damageAdd || 0); 
                foundBracket = i; 
              }
              else break;
          }
          (this.turret as any).rampFactor = (foundBracket + 1) / config.uninteruptedDamageIncrease.length;
      } else (this.turret as any).rampFactor = 0;

      const tCenter = (this.turret as any).getTargetCenter(); 
      if (tCenter) {
         if (state.frames % 3 === 0) {
             state.vfx.push(new WeldingHitVFX(tCenter.x, tCenter.y, config.color || [255, 255, 100]));
         }
      }

      if (!tCenter) return;
      if (!this.turret.config.randomRotation) this.turret.angle = Math.atan2(tCenter.y - wPos.y, tCenter.x - wPos.x); 
      
      const damageRate = config.beamDamageRate || 3;
      const lastDamageFrame = (this.turret as any).lastDamageFrame || 0;
      if (state.frames - lastDamageFrame >= damageRate) {
        (this.turret as any).lastDamageFrame = state.frames;
        
        // Save target center coordinates before takeDamage might clear target or mine block
        const targetPosBackup = tCenter ? tCenter.copy() : (target.gx !== undefined ? createVector(target.gx * GRID_SIZE + GRID_SIZE / 2, target.gy * GRID_SIZE + GRID_SIZE / 2) : (target.pos ? target.pos.copy() : null));

        const killed = target.takeDamage(currentDamage, this.turret);
        const isBlock = target && (target.gx !== undefined || target.isMined !== undefined);
        if (killed && !isBlock) {
          this.turret.onTargetKilled(target);
        }
        
        if (config.appliedConditions && target.applyCondition) {
          for (const cond of config.appliedConditions) {
            target.applyCondition(cond.type, cond.duration, cond);
          }
        }

        if (config.beamBulletTypeKey && targetPosBackup) {
          state.bullets.push(new Bullet(targetPosBackup.x, targetPosBackup.y, targetPosBackup.x, targetPosBackup.y, config.beamBulletTypeKey, 'none', this.turret));
        }

        if (config.beamDamageWidth > 0) {
          const widthSq = config.beamDamageWidth * config.beamDamageWidth;
          for (let e of state.enemies) {
              if (e === target || e.health <= 0 || e.isDying) continue;
              const dSegSq = (this.turret as any).distToSegmentSq(e.pos, wPos, tCenter);
              if (dSegSq < (widthSq + e.size**2 * 0.25)) {
                  e.takeDamage(currentDamage, this.turret);
                  if (config.appliedConditions && e.applyCondition) {
                      for (const cond of config.appliedConditions) e.applyCondition(cond.type, cond.duration, cond);
                  }
              }
          }
        }
      }
      
      this.turret.recoil = 2; 
      this.turret.actionTimers.set(type, state.frames);
    }
  }

  onTargetKilled(target: any) {
    const config = this.turret.config.actionConfig;
    if (config.spawnBulletOnTargetDeath && target) {
      const tc = target.getWorldPos ? target.getWorldPos() : (target.pos ? target.pos.copy() : null);
      if (tc) {
        state.bullets.push(new Bullet(tc.x, tc.y, tc.x, tc.y, config.spawnBulletOnTargetDeath, 'none', this.turret));
      }
    }
  }

  onTargetMined(target: any, context?: any) {
    const config = this.turret.config.actionConfig;
    if (config.onMineHealSelf) {
      this.turret.heal(config.onMineHealSelf, config.onMineHealBypassMaxHP ?? false);
    }
    if (config.spawnBulletOnTargetDeath && target) {
      const tc = (target.gx !== undefined && target.gy !== undefined)
        ? createVector(target.gx * GRID_SIZE + GRID_SIZE / 2, target.gy * GRID_SIZE + GRID_SIZE / 2)
        : (target.getWorldPos ? target.getWorldPos() : (target.pos ? createVector(target.pos.x + GRID_SIZE / 2, target.pos.y + GRID_SIZE / 2) : null));
      if (tc) {
        state.bullets.push(new Bullet(tc.x, tc.y, tc.x, tc.y, config.spawnBulletOnTargetDeath, 'none', this.turret));
      }
    }
  }

  update() {
  }
}
