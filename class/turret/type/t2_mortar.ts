import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_mortar: TurretConfig = {
  name: 'Mortar', costs: { sun: 25 }, costAlmanac: { leaf: 4, fuel: 4 }, drops: { leaf: 1, fuel: 1 }, health: 100, color: [180, 100, 40], size: 22, tier: 2,
  tooltip: "Shoots at enemy, bullet explodes with splash damage", animationBodyType: 'tough',
  actionType: ['shoot'],
  actionConfig: { bulletTypeKey: 'b_mortar_shell', shootRange: GRID_SIZE * 12, shootFireRate: 90 },
  actionTypeWhileCharged: ['shoot'],
  actionConfigWhileCharged: {
    bulletTypeKey: 'b_mortar_shell_charged',
    staminaCostPerBulletSpawned: 20,
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};
