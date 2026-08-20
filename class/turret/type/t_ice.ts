import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t_ice: TurretConfig = {
  name: 'Iceberg', costs: { sun: 5 }, costAlmanac: { ice: 2 }, drops: { ice: 1 }, health: 50, color: [150, 240, 255], size: 22, tier: 1, cooldownHours: 3,
  tooltip: "Freezes an enemy on contact for 2h, armed every 1h", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_ice_explosion', 
    pulseTriggerRadius: GRID_SIZE * 1.5, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES, 
    pulseCenteredAtTriggerSource: true, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};
