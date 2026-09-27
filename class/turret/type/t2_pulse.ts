import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { state } from '../../../state';
import { recalculateAllStats, getTurretClasses } from '../../../src/upgrades';
import { spawnStaminaFlyToTurretVFX } from '../../../vfx/StaminaFlyToTurretVFX';

export const t2_pulse: TurretConfig = {
  name: 'Pulser', costs: { sun: 30 }, costAlmanac: { shell: 4, fuel: 6 }, drops: { shell: 1, fuel: 1 }, health: 100, color: [100, 255, 100], size: 22, tier: 2,
  tooltip: "Pulses surrounding damage waves at enemies", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { pulseBulletTypeKey: 'b_pulse_tier2', pulseTriggerRadius: GRID_SIZE * 2, pulseTriggerBy: ['enemy', 'obstacle'], pulseCooldown: 90, pulseCenteredAtTriggerSource: false, pulseAppliedFireRateMultiplier: true },
  actionTypeWhileCharged: ['pulse'],
  actionConfigWhileCharged: {
    pulseBulletTypeKey: 'b_pulse_tier2_charged',
    pulseTriggerRadius: GRID_SIZE * 4,
    staminaCostPerBulletSpawned: 12
  },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' },
  upgrades: [
    { id: 'u_t2_pulse_1', description: "Player's range +10% for each Pulser attached", modifiers: { playerRangeAdd: 0.1 } },
    { id: 'u_t2_pulse_2', description: "Max health +100 for every empty neighboring spots", conditionals: [{ type: 'empty_neighbor_count', bonus: { healthAdd: 100 } }] },
    { id: 'u_t2_pulse_3', description: "Damage +5% for every new [c_fuel] plants placed", hooks: {
      onPlant: (ctx: any) => {
        const placedTurret = ctx.source || ctx.turret;
        if (placedTurret) {
          const classes = getTurretClasses(placedTurret.type);
          if (classes.includes('c_fuel') || classes.includes('fuel')) {
            const count = (state.turretUpgrades?.['t2_pulse'] || []).filter((id: string) => id === 'u_t2_pulse_3').length;
            const add = 0.05 * Math.max(1, count);
            (state as any).t2PulseFuelPlantDmgBonus = ((state as any).t2PulseFuelPlantDmgBonus || 0) + add;
            recalculateAllStats();
          }
        }
      }
    } },
    { id: 'u_t2_pulse_4', stackable: false, description: "Pulsing radius +50%, fire rate -50%", modifiers: { aoeRadiusMult: 0.5, firerateMult: -0.5 } },
    { id: 'u_t2_pulse_5', description: "Heal +4 stamina for every enemies killed", hooks: {
      onKill: (ctx: any) => {
        if (ctx.source?.type === 't2_pulse' && state.player) {
          const count = (state.turretUpgrades?.['t2_pulse'] || []).filter((id: string) => id === 'u_t2_pulse_5').length;
          const staminaGain = 4 * Math.max(1, count);
          state.player.stamina = Math.min(state.player.maxStamina || 100, state.player.stamina + staminaGain);
          const deathX = ctx.enemy?.pos?.x ?? ctx.target?.pos?.x ?? (ctx.pos?.x ?? state.player.pos.x);
          const deathY = ctx.enemy?.pos?.y ?? ctx.target?.pos?.y ?? (ctx.pos?.y ?? state.player.pos.y);
          spawnStaminaFlyToTurretVFX(deathX, deathY, state.player);
        }
      }
    } }
  ]
};
