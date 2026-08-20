
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { triggerUpgradeHook } from '../../../src/upgrades';

declare const p5: any;
declare const sin: any;

export class ActionPulse extends TurretAction {
  tags = ['attack', 'aoe'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    if (this.turret.jumpFrames > 0) return false;
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
    return (config.pulseTriggerRadius || 0) * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'pulse';
    
    let triggered = false;
    const tCenter = (this.turret as any).getTargetCenter();
    if (tCenter) {
      const dSq = (wPos.x - tCenter.x)**2 + (wPos.y - tCenter.y)**2;
      const triggerRadius = this.getRange();
      if (dSq < Math.max(1, triggerRadius * triggerRadius)) {
        // Check if target is in pulseTriggerBy
        const triggerBy = config.pulseTriggerBy || ['enemy'];
        let validTarget = false;
        if (triggerBy.includes('enemy') && (this.turret.target.health !== undefined)) validTarget = true;
        if (triggerBy.includes('obstacle') && this.turret.target.isMined !== undefined) validTarget = true;
        if (triggerBy.includes('turret') && this.turret.target.actions !== undefined) validTarget = true;
        
        if (validTarget) triggered = true;
      }
    }
    if (config.pulseTriggerAlways) triggered = true;
    
    if (triggered) {
      if (config.pulseTurretJumpAtTriggerSource && tCenter) {
        this.turret.jumpFrames = 20;
        this.turret.jumpTargetPos = tCenter.copy();
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
      }
      this.turret.actionTimers.set(type, state.frames);
    }
  }

  update() {
    if (this.turret.jumpFrames > 0) {
      this.turret.jumpFrames--;
      const config = this.turret.config.actionConfig;
      const wPos = this.turret.getWorldPos();
      
      if (this.turret.jumpTargetPos) {
        const progress = 1 - (this.turret.jumpFrames / 20);
        this.turret.jumpOffset = (p5.Vector as any).sub(this.turret.jumpTargetPos, wPos).mult(sin(progress * Math.PI));
      }
      
      if (this.turret.jumpFrames === 0) {
        const tCenter = this.turret.jumpTargetPos;
        if (config.pulseBulletTypeKey) {
          const sx = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.x : wPos.x;
          const sy = config.pulseCenteredAtTriggerSource && tCenter ? tCenter.y : wPos.y;
          let b = new Bullet(sx, sy, sx, sy, config.pulseBulletTypeKey, 'none', this.turret); 
          (b as any).life = 0; 
          state.bullets.push(b);
          triggerUpgradeHook('onShot', this.turret, { actionType: 'pulse', bulletTypeKey: config.pulseBulletTypeKey });
          (this.turret as any).pulseAnimTimer = 15;
        }
        this.turret.jumpOffset = null;
        this.turret.jumpTargetPos = null;
      }
    }
  }
}
