
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { FrostFieldAuraVFX, TorchwoodAuraVFX, SpeederAuraVFX, spawnSpeederAuraVFX } from '../../../vfx/index';

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
    } else if (cfg.auraVfx === 'aura_speeder') {
      if (!state.vfx.some((v: any) => v instanceof SpeederAuraVFX && v.target === this.turret)) {
        state.vfx.push(spawnSpeederAuraVFX(this.turret, effectiveRadius));
      }
    }

    if (this.turret.specialActivityLevel > 0.1) {

      // 1. Condition Aura on Enemies
      if (cfg.appliedCondition) {
        if (state.spatialGrid) {
          state.spatialGrid.queryCircleEnemies(wPos.x, wPos.y, effectiveRadius, (e: any) => {
            if (e.conditions?.has('c_hypnotized')) return;
            e.applyCondition(cfg.appliedCondition, cfg.duration || 60);
          });
        } else {
          for (let e of state.enemies) {
            if (e.health <= 0 || e.isDying || e.conditions?.has('c_hypnotized')) continue;
            const dx = e.pos.x - wPos.x;
            const dy = e.pos.y - wPos.y;
            if (dx * dx + dy * dy < auraRadiusSq) {
              e.applyCondition(cfg.appliedCondition, cfg.duration || 60);
            }
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

      // 3. Turret & Player Firerate Buffing (e.g. Speeder stackable firerate boost)
      if (cfg.boostsTurretConfig) {
        const tCfg = cfg.boostsTurretConfig;
        const frBoost = tCfg.firerateBoost || 0.25;

        // Buff attached turrets on player
        if (state.player?.attachments) {
          for (const att of state.player.attachments) {
            if (att === this.turret) continue;
            const aPos = att.getWorldPos();
            const dx = aPos.x - wPos.x;
            const dy = aPos.y - wPos.y;
            if (dx * dx + dy * dy <= auraRadiusSq) {
              if ((att as any).applyAuraFirerateBoost) {
                (att as any).applyAuraFirerateBoost(this.turret.uid, frBoost, 6);
              }
              att.applyCondition('fireRateUp', 6);
            }
          }
        }

        // Buff world turrets
        if (state.world?.getAllTurrets) {
          const worldTurrets = state.world.getAllTurrets();
          for (const wt of worldTurrets) {
            if (wt === this.turret) continue;
            const pos = wt.getWorldPos();
            const dx = pos.x - wPos.x;
            const dy = pos.y - wPos.y;
            if (dx * dx + dy * dy <= auraRadiusSq) {
              if ((wt as any).applyAuraFirerateBoost) {
                (wt as any).applyAuraFirerateBoost(this.turret.uid, frBoost, 6);
              }
              wt.applyCondition('fireRateUp', 6);
            }
          }
        }

        // Buff player
        if (state.player) {
          const pPos = state.player.pos;
          const dx = pPos.x - wPos.x;
          const dy = pPos.y - wPos.y;
          if (dx * dx + dy * dy <= auraRadiusSq) {
            if ((state.player as any).applyAuraFirerateBoost) {
              (state.player as any).applyAuraFirerateBoost(this.turret.uid, frBoost, 6);
            }
            state.player.applyCondition('fireRateUp', 6);
          }
        }
      }
    }
    
    this.turret.actionTimers.set(type, state.frames);
  }

  update() {
  }
}
