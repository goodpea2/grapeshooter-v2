import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t_mine: TurretConfig = {
  name: 'Landmine', costs: { sun: 5 }, costAlmanac: { fuel: 2 }, drops: { fuel: 1 }, health: 50, color: [255, 100, 20], size: 22, tier: 1, cooldownHours: 3,
  tooltip: "Mine explodes on contact, armed every 2h", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_mine_explosion', 
    pulseTriggerRadius: GRID_SIZE * 3.5, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES * 2, 
    pulseCenteredAtTriggerSource: true, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' }
};
