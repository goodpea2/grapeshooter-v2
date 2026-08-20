
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Enemy } from '../../enemy';
import { FrostFieldAuraVFX } from '../../../vfx/index';

declare const floor: any;

export class ActionAura extends TurretAction {
  tags = ['aura', 'passive'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    const type = 'aura';
    const lastTrigger = this.turret.actionTimers.get(type) || -99999;
    const config = this.turret.config.actionConfig;
    const cfg = config.auraConfig;
    if (!cfg) return false;
    return true; // Aura is passive/continuous
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    const config = this.turret.config.actionConfig;
    const cfg = config.auraConfig;
    return (cfg?.radius || 0) * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'aura';
    
    const cfg = config.auraConfig;
    if (!cfg) return;
    const auraRadiusSq = cfg.radius * cfg.radius;
    if (this.turret.specialActivityLevel > 0.5) {
      if (cfg.auraVfx === 'aura_frostfield' && state.frames % 10 === 0) {
        state.vfx.push(new FrostFieldAuraVFX(this.turret, cfg.radius));
      }
      for (let e of state.enemies) {
        if (e.health <= 0 || e.isDying) continue;
        const dx = e.pos.x - wPos.x;
        const dy = e.pos.y - wPos.y;
        if (dx*dx + dy*dy < auraRadiusSq) {
          e.applyCondition(cfg.appliedCondition, cfg.duration);
        }
      }
    }
    
    this.turret.actionTimers.set(type, state.frames);
  }

  update() {
  }
}
