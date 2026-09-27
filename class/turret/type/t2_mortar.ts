import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';
import { spawnStaminaFlyToTurretVFX } from '../../../vfx/index';

export const t2_mortar: TurretConfig = {
  name: 'Mortar', costs: { sun: 25 }, costAlmanac: { leaf: 4, fuel: 4 }, drops: { leaf: 1, fuel: 1 }, health: 100, color: [180, 100, 40], size: 22, tier: 2,
  tooltip: "Shoots at enemy, bullet explodes with splash damage", animationBodyType: 'tough',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_mortar_shell', shootRange: GRID_SIZE * 12, shootFireRate: 90 },
  actionTypeWhileCharged: ['shoot'],
  actionConfigWhileCharged: {
    bulletTypeKey: 'b_mortar_shell_charged',
    staminaCostPerBulletSpawned: 20,
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  upgrades: [
    { id: 'u_t2_mortar_1', description: "Player's max stamina +20 for each Mortar attached", modifiers: { playerStaminaAdd: 20 } },
    { id: 'u_t2_mortar_2', stackable: false, description: "Fire rate +100%, Splash damage -30%", modifiers: { firerateMult: 1.0, aoeDamageMult: -0.3 } },
    { id: 'u_t2_mortar_3', description: "Splash radius +30% for every neighboring [c_fuel]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_fuel', bonus: { aoeRadiusMult: 0.3 } }] },
    { id: 'u_t2_mortar_4', description: "Splash damage +20%", modifiers: { aoeDamageMult: 0.2 } },
    { id: 'u_t2_mortar_5', description: "Heal +3 Stamina for every enemies killed", hooks: { onKill: (ctx: any) => { 
        if (ctx.source?.type === 't2_mortar' && state.player) { 
          const count = (state.turretUpgrades?.['t2_mortar'] || []).filter((id: string) => id === 'u_t2_mortar_5').length;
          const staminaGain = 3 * Math.max(1, count);
          state.player.stamina = Math.min(state.player.maxStamina || 100, state.player.stamina + staminaGain); 
          const deathX = ctx.enemy?.pos?.x ?? ctx.target?.pos?.x ?? (ctx.pos?.x ?? state.player.pos.x);
          const deathY = ctx.enemy?.pos?.y ?? ctx.target?.pos?.y ?? (ctx.pos?.y ?? state.player.pos.y);
          spawnStaminaFlyToTurretVFX(deathX, deathY, state.player);
        } 
    } } }
  ]
};
