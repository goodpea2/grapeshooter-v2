import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { state } from '../../../state';

export const t2_stun: TurretConfig = {
  name: 'Stunner', costs: { sun: 15 }, costAlmanac: { ice: 5 }, drops: { ice: 2 }, health: 100, color: [240, 240, 255], size: 22, tier: 2,
  tooltip: "Leaves a gas puddle on contact, stunning enemies that touches it, armed every 1h", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_stun_gas_projectile', 
    pulseTriggerRadius: GRID_SIZE * 3.5, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES * 1, 
    pulseCenteredAtTriggerSource: true, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' },
  upgrades: [
    { id: 'u_t2_stun_1', description: "Player's stamina recharge speed +30% for each Stunner attached", modifiers: { staminaRechargeMult: 0.3 } },
    { id: 'u_t2_stun_2', description: "Arming time -25%, Stun duration -20%", modifiers: { armingTimeMult: -0.25, stunDurationMult: -0.2 } },
    { id: 'u_t2_stun_3', description: "Attack also Hypnotizes target for +6s", modifiers: { hypnotizeDuration: 360 } },
    { id: 'u_t2_stun_4', description: "Instant-arm and attack +1 times upon planting", hooks: {
      onPlant: (ctx: any) => {
        const turret = ctx.source || ctx.turret;
        if (turret?.type === 't2_stun') {
          const count = (state.turretUpgrades['t2_stun'] || []).filter((id: string) => id === 'u_t2_stun_4').length;
          turret.instantArmCharges = Math.max(1, count);
          if (turret.actionTimers) {
            turret.actionTimers.set('pulse', -999999);
          }
        }
      }
    } },
    { id: 'u_t2_stun_5', stackable: false, description: "Enemies now receive 2x damage while stunned by Stunner" }
  ]
};
