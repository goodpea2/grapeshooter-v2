import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_skymortar: TurretConfig = { 
  name: 'Sky Mortar', costs: { sun: 70 }, costAlmanac: { leaf: 10, fuel: 10, ice: 4 }, drops: { leaf: 1, fuel: 1, ice: 1 }, health: 50, color: [50, 100, 255], size: 22, tier: 3,
  tooltip: "Fling mortar shells to the sky, slamming down on the toughest enemies", animationBodyType: 'tough',
  actionType: ['launch'],
  actionConfig: { 
    bulletTypeKey: 'b_skymortar_shell', 
    shootRange: GRID_SIZE * 12, 
    shootFireRate: 480,
    hasUnarmedAsset: true
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' }
};
