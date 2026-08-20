import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t0_grapeshot: TurretConfig = {
  name: 'Grapeshot', costs: { elixir: 50 }, health: 50, color: [180, 80, 255], size: 22, tier: 0, isSpecial: true,
  tooltip: "Has 16 powerful projectiles to shoot at enemies.",
  isActiveWhileMoving: true, animationBodyType: 'soft',
  actionType: ['shoot', 'die'],
  actionConfig: { bulletTypeKey: 'b_grapeshot_shell', shootRange: GRID_SIZE * 10, shootFireRate: 45, dieAfterAction: 'shoot', dieAfterActionCount: 16 },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'highestHealth' }
};
