import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t3_spinnut: TurretConfig = { 
  name: 'Spin Nut', costs: { sun: 50 }, costAlmanac: { leaf: 8, shell: 10 }, drops: { leaf: 2, shell: 1 }, health: 400, color: [200, 200, 100], size: 26, tier: 3,
  tooltip: "Spins itself and shoots bullets when there's an enemy within range", animationBodyType: 'tough',
  actionType: ['shootSpin'],
  actionConfig: { 
      bulletTypeKey: 'b_pea_5dmg', 
      shootRange: GRID_SIZE * 8, 
      shootFireRate: 4,
      selfSpinSpeed: 1, // Revs per second
  },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};
