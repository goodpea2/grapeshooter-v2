import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const tx_goldengrape: TurretConfig = { 
  name: 'Golden Grape', costs: { elixir: 500 }, costAlmanac: { leaf: 100, shard: 100, shell: 100 }, drops: { leaf: 10, shard: 10, shell: 10 }, health: 400, color: [255, 215, 0], size: 24, isSpecial: true, tier: 0,
  tooltip: "Buy the Golden Grape and win the game", animationBodyType: 'soft',
  actionType: ['launchMultiTarget'],
  actionConfig: { 
    bulletTypeKey: 'b_goldengrape_firework', 
    shootRange: GRID_SIZE * 12, 
    shootFireRate: 240,
    multiTargetMinCount: 8,
    multiTargetMaxCount: 8,
    multiTargetShootDelay: 12,
    hasUnarmedAsset: false
  },
  targetType: ['enemy', 'obstacle', 'turret'],
  targetConfig: { enemyPriority: 'random', obstaclePriority: 'random' }
};
