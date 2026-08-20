import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { ActionShoot } from '../action/action_shoot';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';

export class PeaAttachedTurret extends AttachedTurret {}
export class PeaWorldTurret extends WorldTurret {}

export const t_pea: TurretConfig = { 
  name: 'Peashooter', costs: { sun: 10 }, costAlmanac: { leaf: 3 }, drops: { leaf: 1 }, health: 50, color: [100, 255, 100], size: 22, tier: 1, cooldownHours: 1,
  tooltip: "Shoots bullets at enemies", animationBodyType: 'soft',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' },
  getActions: (turret) => [new ActionShoot({ turret })],
};
