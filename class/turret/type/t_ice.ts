import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { state } from '../../../state';

export const t_ice: TurretConfig = {
  name: 'Iceberg', costs: { sun: 5 }, costAlmanac: { ice: 2 }, drops: { ice: 1 }, health: 100, color: [150, 240, 255], size: 22, tier: 1, cooldownHours: 3,
  tooltip: "Freezes an enemy on contact for 2h, armed every 1h", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_ice_explosion', 
    pulseTriggerRadius: GRID_SIZE * 2.5, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES, 
    pulseCenteredAtTriggerSource: true, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  upgrades: [
    { id: 'u_t_ice_1', description: "Player's stamina recharge speed +25% for each Iceberg attached", modifiers: { staminaRechargeMult: 0.25 } },
    { id: 'u_t_ice_2', description: "Arming time -25%, Stun duration -20%", modifiers: { armingTimeMult: -0.25, stunDurationMult: -0.2 } },
    { id: 'u_t_ice_3', description: "Attack also Hypnotizes target for +6s", modifiers: { hypnotizeDuration: 360 } },
    { id: 'u_t_ice_4', description: "Instant-arm and attack +1 times upon planting", hooks: { onPlant: (ctx: any) => { 
        if (ctx.source?.type === 't_ice') { 
          const count = (state.turretUpgrades['t_ice'] || []).filter((id: string) => id === 'u_t_ice_4').length;
          ctx.source.instantArmCharges = Math.max(1, count);
          if (ctx.source.actionTimers) {
            ctx.source.actionTimers.set('pulse', -999999);
          }
        } 
      } } }
  ]
};
