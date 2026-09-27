import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_wall } from './t_wall';
import { state } from '../../../state';
import { getTurretClasses } from '../../../src/upgrades';
import { spawnLootAt } from '../../../economy';
import { spawnGreenEssenseVfx } from '../../../vfx/GreenEssenceVFX';

export const t2_icewall: TurretConfig = { 
  ...t_wall,
  name: 'Icewall', 
  costs: { sun: 15 }, 
  costAlmanac: { shell: 3, ice: 2 }, 
  drops: { shell: 1, ice: 1 }, 
  health: 600, 
  color: [160, 210, 240], 
  tier: 2, 
  tooltip: "Emits a small chilling field", 
  animationBodyType: 'tough',
  actionType: ['aura'],
  actionConfig: { 
    auraConfig: { 
      radius: GRID_SIZE * 1.5, 
      appliedCondition: 'c_chilled', 
      duration: 60, 
      auraVfx: 'aura_frostfield' 
    } 
  },
  targetType: [], 
  targetConfig: {},
  upgrades: [
    { id: 'u_t2_icewall_1', description: "Player's attack damage +4, range -15% for each Icewall attached", modifiers: { playerAttackAdd: 4, playerRangeAdd: -0.15 } },
    { id: 'u_t2_icewall_2', description: "Aura radius +10% for every empty neighboring spots", conditionals: [{ type: 'empty_neighbor_count', bonus: { rangeMult: 0.1 } }] },
    { id: 'u_t2_icewall_3', description: "Spawn +1 sun for every [c_shell] or [c_ice] plant death", hooks: {
      onDeath: (ctx: any) => {
        if (ctx.targetType === 'turret') {
          const target = ctx.target || ctx.source;
          if (target && target.type) {
            const classes = getTurretClasses(target.type);
            if (classes.includes('c_shell') || classes.includes('shell') || classes.includes('c_ice') || classes.includes('ice') || classes.includes('c_wall')) {
              const p = target.getWorldPos ? target.getWorldPos() : (target.pos || ctx.pos);
              if (p) {
                const allIcewalls = [...(state.player?.attachments || []), ...(state.world?.getAllTurrets ? state.world.getAllTurrets() : [])]
                  .filter((t: any) => t && t.type === 't2_icewall' && t.health > 0);
                if (allIcewalls.length > 0) {
                  for (const icewall of allIcewalls) {
                    spawnGreenEssenseVfx(p.x, p.y, icewall, () => {
                      const iwPos = icewall.getWorldPos ? icewall.getWorldPos() : (icewall.pos || p);
                      spawnLootAt(iwPos.x, iwPos.y, 'sun');
                    });
                  }
                } else {
                  spawnLootAt(p.x, p.y, 'sun');
                }
              }
            }
          }
        }
      }
    } },
    { id: 'u_t2_icewall_4', description: "Heal +50 HP every time an enemy dies within its aura radius", hooks: {
      onDeath: (ctx: any) => {
        if (ctx.targetType === 'enemy') {
          const enemy = ctx.target;
          if (!enemy?.pos) return;
          const count = (state.turretUpgrades?.['t2_icewall'] || []).filter((id: string) => id === 'u_t2_icewall_4').length;
          const healAmt = 50 * Math.max(1, count);
          const allIcewalls = [...(state.player?.attachments || []), ...(state.world?.getAllTurrets ? state.world.getAllTurrets() : [])];
          for (const t of allIcewalls) {
            if (t && t.type === 't2_icewall' && t.health > 0) {
              const wPos = t.getWorldPos ? t.getWorldPos() : t.pos;
              const r = (t.activeStats?.rangeMult || 1) * (t.config?.actionConfig?.auraConfig?.radius || (GRID_SIZE * 1.5));
              const d = Math.hypot(enemy.pos.x - wPos.x, enemy.pos.y - wPos.y);
              if (d <= r) {
                t.health = Math.min(t.maxHealth || 600, t.health + healAmt);
                t.flash = 6;
                t.flashType = 'heal';
              }
            }
          }
        }
      }
    } },
    { id: 'u_t2_icewall_5', stackable: false, description: "When a neighboring plant get damaged, this receives the damage instead", modifiers: { absorbNeighborDamage: true } }
  ]
};
