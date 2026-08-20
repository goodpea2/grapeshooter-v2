import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t2_stun: TurretConfig = {
  name: 'Stunner', costs: { sun: 15 }, costAlmanac: { ice: 5 }, drops: { ice: 2 }, health: 50, color: [240, 240, 255], size: 22, tier: 2,
  tooltip: "Leaves a gas puddle on contact, stunning enemies that touches it, armed every 1h", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_stun_gas_projectile', 
    pulseTriggerRadius: GRID_SIZE * 2.0, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES * 1, 
    pulseCenteredAtTriggerSource: true, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};
