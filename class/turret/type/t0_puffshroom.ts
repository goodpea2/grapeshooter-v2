import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t0_puffshroom: TurretConfig = {
  name: 'Puffshroom', costs: { soil: 8 }, health: 30, color: [200, 100, 255], size: 16, tier: 0, isSpecial: true,
  tooltip: "Shoots enemies at closer range, disappears after 12h",
  isActiveWhileMoving: false, animationBodyType: 'soft',
  actionType: ['shoot', 'die'],
  actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 5, shootFireRate: 60, dieAfterDuration: HOUR_FRAMES * 12 },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};
