import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t2_icebomb: TurretConfig = {
  name: 'Ice Bomb', costs: { sun: 20 }, costAlmanac: { fuel: 2, ice: 5 }, drops: { fuel: 1, ice: 1 }, health: 50, color: [180, 240, 255], size: 22, tier: 2,
  tooltip: "Explodes on contact, damaging and freezing enemies for 1h, armed every 2h", animationBodyType: 'soft',
  actionType: ['pulse'],
  actionConfig: { 
    pulseBulletTypeKey: 'b_ice_bomb_explosion', 
    pulseTriggerRadius: GRID_SIZE * 1.5, 
    pulseTriggerBy: ['enemy'], 
    pulseCooldown: HOUR_FRAMES * 1, 
    pulseCenteredAtTriggerSource: false, 
    hasUnarmedAsset: true,
    pulseTurretJumpAtTriggerSource: true 
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};
