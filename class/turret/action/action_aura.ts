
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { FrostFieldAuraVFX, TorchwoodAuraVFX } from '../../../vfx/index';

declare const floor: any;

export class ActionAura extends TurretAction {
  tags = ['aura', 'passive'];

  isReady(): boolean {
    if (this.isLocked()) return false;
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
    const effectiveRadius = (cfg.radius || 0) * (this.turret.stats.rangeMult || 1);
    const auraRadiusSq = effectiveRadius * effectiveRadius;

    if (cfg.auraVfx === 'aura_frostfield') {
      if (!state.vfx.some((v: any) => v instanceof FrostFieldAuraVFX && v.target === this.turret)) {
        state.vfx.push(new FrostFieldAuraVFX(this.turret, effectiveRadius));
      }
    } else if (cfg.auraVfx === 'aura_torchwood') {
      if (!state.vfx.some((v: any) => v instanceof TorchwoodAuraVFX && v.target === this.turret)) {
        state.vfx.push(new TorchwoodAuraVFX(this.turret, effectiveRadius));
      }
    }

    if (this.turret.specialActivityLevel > 0.1) {

      // 1. Condition Aura on Enemies
      if (cfg.appliedCondition) {
        for (let e of state.enemies) {
          if (e.health <= 0 || e.isDying) continue;
          const dx = e.pos.x - wPos.x;
          const dy = e.pos.y - wPos.y;
          if (dx * dx + dy * dy < auraRadiusSq) {
            e.applyCondition(cfg.appliedCondition, cfg.duration || 60);
          }
        }
      }

      // 2. Projectile / Bullet Damage Buffing (e.g. Torchwood)
      if (cfg.boostsBulletConfig) {
        const bCfg = cfg.boostsBulletConfig;
        const allowedEmitters: string[] = bCfg.boostsBulletFromEmitter || ['turret', 'player'];
        const dmgAdd = bCfg.damageAdd || 3;

        for (let b of state.bullets) {
          if (b.life <= 0) continue;
          if (b.boostedByTurrets && b.boostedByTurrets.has(this.turret.uid)) continue;

          // Check emitter source
          const isPlayer = b.source === state.player;
          const isTurret = b.source && b.source !== state.player && (b.source.type || b.source.constructor?.name?.includes('Turret') || b.source.isAttachedToPlayer !== undefined);
          
          let matches = false;
          if (allowedEmitters.includes('player') && isPlayer) matches = true;
          if (allowedEmitters.includes('turret') && isTurret) matches = true;
          if (!b.source && (allowedEmitters.includes('player') || allowedEmitters.includes('turret'))) matches = true;

          if (!matches) continue;

          const bdx = b.pos.x - wPos.x;
          const bdy = b.pos.y - wPos.y;
          if (bdx * bdx + bdy * bdy < auraRadiusSq) {
            if (!b.boostedByTurrets) b.boostedByTurrets = new Set();
            b.boostedByTurrets.add(this.turret.uid);
            b.dmg += dmgAdd;

            if (bCfg.flameVisual) {
              b.col = [255, 140, 30];
            }
          }
        }
      }
    }
    
    this.turret.actionTimers.set(type, state.frames);
  }

  update() {
  }
}
