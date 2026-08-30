import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_firecharge: TurretConfig = {
  name: 'Fire Launcher',
  costs: { sun: 70 },
  costAlmanac: { leaf: 10, fuel: 10, shard: 4 },
  drops: { leaf: 1, fuel: 1, shard: 1 },
  health: 100,
  color: [255, 90, 0],
  size: 22,
  tier: 3,
  tooltip: "Flings fire at random target. Charge speeds up attacking speed",
  animationBodyType: 'soft',
  assetImg: 't3_flamethrower',
  actionType: ['launch'],
  actionConfig: {
    bulletTypeKey: 'b_firecharge_shell',
    shootRange: GRID_SIZE * 6,
    shootFireRate: [78, 6, 6],
    hasUnarmedAsset: true
  },
  whileCharged: {
    shootFireRate: [10],
    shootRange: GRID_SIZE * 8,
    shootRandomPosWhenNoTarget: true
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'random' }
};
