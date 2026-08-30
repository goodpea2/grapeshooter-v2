
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { triggerUpgradeHook } from '../../../src/upgrades';
import { GRID_SIZE } from '../../../constants';

declare const p5: any;
declare const sin: any;
declare const createVector: any;

export class ActionPulse extends TurretAction {
  tags = ['attack', 'aoe'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    if (this.turret.jumpPhase !== null || this.turret.jumpFrames > 0) return false;
    const config = this.turret.config.actionConfig;
    const type = 'pulse';
    let lastFire = this.turret.actionTimers.get(type) || 0;
    const fireRate = config.pulseCooldown || 60;
    return state.frames - lastFire >= fireRate;
  }

  needsTarget(): boolean {
    const config = this.turret.config.actionConfig;
    return !config.pulseTriggerAlways;
  }

  getRange(): number {
    const config = this.turret.config.actionConfig;
    return (config.pulseTriggerRadius || 0) * (this.turret.stats?.rangeMult || 1);
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
    const type = 'pulse';
    const triggerRadius = this.getRange();
    const triggerRadiusSq = Math.max(1, triggerRadius * triggerRadius);
    const triggerBy = config.pulseTriggerBy || ['enemy'];
    
    let triggered = false;
    let tCenter = (this.turret as any).getTargetCenter();
    if (tCenter) {
      const dSq = (wPos.x - tCenter.x)**2 + (wPos.y - tCenter.y)**2;
      if (dSq <= triggerRadiusSq) {
        // Check if target is in pulseTriggerBy
        let validTarget = false;
        if (triggerBy.includes('enemy') && (this.turret.target.health !== undefined && !this.turret.target.isMined)) validTarget = true;
        if (triggerBy.includes('obstacle') && (this.turret.target.isMined !== undefined || this.turret.target.type?.startsWith('o_') || this.turret.target.overlay !== undefined)) validTarget = true;
        if (triggerBy.includes('turret') && this.turret.target.actions !== undefined) validTarget = true;
        
        if (validTarget) triggered = true;
      }
    }

    // Proximity fallback check: scan nearby enemies/obstacles if target was lost or null
    if (!triggered && !config.pulseTriggerAlways) {
      if (triggerBy.includes('enemy')) {
        for (const e of state.enemies) {
          if (e.health > 0 && !e.isDying) {
            const edSq = (wPos.x - e.pos.x)**2 + (wPos.y - e.pos.y)**2;
            if (edSq <= triggerRadiusSq) {
              triggered = true;
              if (!tCenter) tCenter = e.pos.copy ? e.pos.copy() : createVector(e.pos.x, e.pos.y);
              break;
            }
          }
        }
      }
      if (!triggered && triggerBy.includes('obstacle') && state.world) {
        const baseGx = Math.floor(wPos.x / GRID_SIZE);
        const baseGy = Math.floor(wPos.y / GRID_SIZE);
        const tileR = Math.ceil(triggerRadius / GRID_SIZE);
        for (let dx = -tileR; dx <= tileR; dx++) {
          for (let dy = -tileR; dy <= tileR; dy++) {
            const bx = (baseGx + dx) * GRID_SIZE + GRID_SIZE / 2;
            const by = (baseGy + dy) * GRID_SIZE + GRID_SIZE / 2;
            const bdSq = (wPos.x - bx)**2 + (wPos.y - by)**2;
            if (bdSq <= triggerRadiusSq && state.world.isBlockAt(bx, by)) {
              triggered = true;
              if (!tCenter) tCenter = createVector(bx, by);
              break;
            }
          }
          if (triggered) break;
        }
      }
    }

    if (config.pulseTriggerAlways) triggered = true;
    
    if (triggered) {
      if (config.pulseTurretJumpAtTriggerSource && tCenter) {
        this.turret.jumpPhase = 'toTarget';
        this.turret.jumpTargetPos = tCenter.copy();
        this.turret.jumpCurrentPos = wPos.copy();
        this.turret.jumpFrames = 1; // Mark active
        (this.turret as any).jumpTargetEntity = this.turret.target;
        const toTargetX = tCenter.x - wPos.x;
        const toTargetY = tCenter.y - wPos.y;
        this.turret.angle = Math.atan2(toTargetY, toTargetX);
      } else {
        // Standard pulse
        if (config.pulseBulletTypeKey) {
          const sx = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.x : wPos.x;
          const sy = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.y : wPos.y;
          let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none', this.turret); 
          (b as any).life = 0; 
          state.bullets.push(b);
          triggerUpgradeHook('onShot', this.turret, { actionType: 'pulse', bulletTypeKey: config.pulseBulletTypeKey });
          (this.turret as any).pulseAnimTimer = 15;
        }
        this.turret.actionTimers.set(type, state.frames);
      }
    }
  }

  update() {
    if (!this.turret.jumpPhase) return;
    const config = this.turret.config.actionConfig;
    const wPos = this.turret.getWorldPos();
    const type = 'pulse';
    const baseRunSpeed = 5.0; // Fast chase speed

    if (this.turret.jumpPhase === 'toTarget') {
      if (!this.turret.jumpCurrentPos) this.turret.jumpCurrentPos = wPos.copy();

      // Continuously chase the live target entity if still alive
      const targetEntity = (this.turret as any).jumpTargetEntity || this.turret.target;
      if (targetEntity) {
        let isDead = false;
        if (targetEntity.isFrosted !== undefined) {
          isDead = targetEntity.isFrosted && targetEntity.iceCubeHealth <= 0;
        } else if (targetEntity.health !== undefined) {
          isDead = targetEntity.health <= 0;
        } else if (targetEntity.isMined !== undefined) {
          isDead = targetEntity.isMined;
        }
        const isDying = targetEntity.isDying === true;

        if (!isDead && !isDying) {
          let currentTargetCenter: any = null;
          if (targetEntity.getWorldPos) {
            currentTargetCenter = targetEntity.getWorldPos();
          } else if (targetEntity.gx !== undefined) {
            currentTargetCenter = createVector(targetEntity.gx * GRID_SIZE + GRID_SIZE / 2, targetEntity.gy * GRID_SIZE + GRID_SIZE / 2);
          } else if (targetEntity.pos) {
            currentTargetCenter = targetEntity.pos.copy ? targetEntity.pos.copy() : createVector(targetEntity.pos.x, targetEntity.pos.y);
          }

          if (currentTargetCenter) {
            this.turret.jumpTargetPos = currentTargetCenter.copy();
          }
        }
      }

      // Target position: live target pos or the target's last position if it died
      const targetPos = this.turret.jumpTargetPos || wPos;
      const toTarget = (p5.Vector as any).sub(targetPos, this.turret.jumpCurrentPos);
      const distRemaining = toTarget.mag();

      if (distRemaining > 0.001) {
        this.turret.angle = Math.atan2(toTarget.y, toTarget.x);
      }

      let runSpeed = baseRunSpeed;
      if (targetEntity && targetEntity.speed && targetEntity.speed * 2.5 > runSpeed) {
        runSpeed = targetEntity.speed * 2.5;
      }

      if (distRemaining <= runSpeed) {
        // Reached the target or the target's last position
        this.turret.jumpCurrentPos = targetPos.copy();

        // Release pulse at target location
        if (config.pulseBulletTypeKey) {
          const sx = targetPos.x;
          const sy = targetPos.y;
          let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none', this.turret);
          (b as any).life = 0;
          state.bullets.push(b);
          triggerUpgradeHook('onShot', this.turret, { actionType: 'pulse', bulletTypeKey: config.pulseBulletTypeKey });
          (this.turret as any).pulseAnimTimer = 15;
        }
        // Set cooldown timer upon detonating at target
        this.turret.actionTimers.set(type, state.frames);

        // Transition to running home
        this.turret.jumpPhase = 'toHome';
        (this.turret as any).jumpTargetEntity = null;
      } else {
        toTarget.normalize().mult(runSpeed);
        this.turret.jumpCurrentPos.add(toTarget);
      }

      // Displacement relative to base wPos with hop bobbing
      const disp = (p5.Vector as any).sub(this.turret.jumpCurrentPos, wPos);
      const hopVal = Math.abs(Math.sin(state.frames * 0.28));
      disp.y += -hopVal * 5;
      this.turret.jumpOffset = disp;

    } else if (this.turret.jumpPhase === 'toHome') {
      if (!this.turret.jumpCurrentPos) this.turret.jumpCurrentPos = wPos.copy();
      // Current home target dynamically tracks wPos (handles attached player movement or world position)
      const toHome = (p5.Vector as any).sub(wPos, this.turret.jumpCurrentPos);
      const distRemaining = toHome.mag();

      if (distRemaining > 0.001) {
        this.turret.angle = Math.atan2(toHome.y, toHome.x);
      }

      if (distRemaining <= baseRunSpeed) {
        // Successfully returned home
        this.turret.jumpOffset = null;
        this.turret.jumpPhase = null;
        this.turret.jumpTargetPos = null;
        this.turret.jumpCurrentPos = null;
        this.turret.jumpFrames = 0;
        (this.turret as any).jumpTargetEntity = null;
      } else {
        toHome.normalize().mult(baseRunSpeed);
        this.turret.jumpCurrentPos.add(toHome);

        const disp = (p5.Vector as any).sub(this.turret.jumpCurrentPos, wPos);
        const hopVal = Math.abs(Math.sin(state.frames * 0.28));
        disp.y += -hopVal * 5;
        this.turret.jumpOffset = disp;
      }
    }
  }
}

