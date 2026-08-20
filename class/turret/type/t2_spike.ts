import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';

export const t2_spike: TurretConfig = {
  name: 'Spikerock', costs: { sun: 20 }, costAlmanac: { shell: 4, ice: 3 }, drops: { shell: 1, ice: 1 }, health: 5, color: [220, 220, 240], size: 24, tier: 2,
  tooltip: "Stay underground and damages enemies stepping over it", animationBodyType: 'tough',
  collideWithEnemy: false,
  renderBehindEnemy: true,
  isActiveWhileMoving: false,
  actionType: ['pulse'],
  actionConfig: { pulseBulletTypeKey: 'b_spike', pulseTriggerRadius: GRID_SIZE * 1, pulseTriggerBy: ['enemy'], pulseCooldown: 60, pulseCenteredAtTriggerSource: false },
  targetType: ['enemy'],
  targetConfig: { enemyPriority: 'closest' }
};
