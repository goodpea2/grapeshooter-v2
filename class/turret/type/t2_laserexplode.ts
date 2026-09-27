import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';
import { spawnStaminaFlyToTurretVFX } from '../../../vfx/index';
import { t_laser } from './t_laser';

export const t2_laserexplode: TurretConfig = {
  ...t_laser,
  name: 'Exploding Laser', costs: { sun: 30 }, costAlmanac: { shard: 4, fuel: 6 }, drops: { shard: 1, fuel: 1 }, health: 100, color: [150, 40, 40], size: 22, tier: 2,
  tooltip: "Broken obstacle explodes, damaging nearby enemies and obstacles", animationBodyType: 'tough',
  actionConfig: { 
    ...t_laser.actionConfig,
    spawnBulletOnTargetDeath: 'b_laser_explosion'
  },
  upgrades: [
    { id: 'u_t2_laserexplode_1', description: "Player's max stamina +20 for each Exploding Laser attached", modifiers: { playerStaminaAdd: 20 } },
    { id: 'u_t2_laserexplode_2', description: "Range +20% for every neighboring [c_shell]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_shell', bonus: { rangeMult: 0.2 } }] },
    { id: 'u_t2_laserexplode_3', description: "Explosion damage +50% for every neighboring [c_fuel]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_fuel', bonus: { aoeDamageMult: 0.5 } }] },
    { 
      id: 'u_t2_laserexplode_4', 
      description: "Heal +3 Stamina for every blocks killed", 
      hooks: { 
        onMine: (ctx: any) => { 
          if (ctx.source?.type === 't2_laserexplode' && ctx.blockKilled && state.player) { 
            const count = (state.turretUpgrades?.['t2_laserexplode'] || []).filter((id: string) => id === 'u_t2_laserexplode_4').length; 
            const stamGain = 3 * Math.max(1, count); 
            state.player.stamina = Math.min(state.player.maxStamina || 100, (state.player.stamina || 0) + stamGain); 
            const p = ctx.pos || (ctx.target?.pos ? { x: ctx.target.pos.x + GRID_SIZE/2, y: ctx.target.pos.y + GRID_SIZE/2 } : state.player.pos); 
            const vfx = spawnStaminaFlyToTurretVFX(p.x, p.y, state.player); 
            if (vfx) state.vfx.push(vfx); 
          } 
        } 
      } 
    },
    { id: 'u_t2_laserexplode_5', stackable: false, description: "Exploding Laser now only targets enemies with -60% damage", modifiers: { damageMult: -0.6, targetTypeOverride: ['enemy'] } }
  ]
};

