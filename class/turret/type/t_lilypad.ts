import { TurretConfig } from '../turretConfig';

export const t_lilypad: TurretConfig = {
  name: 'Lilypad', costs: { soil: 8 }, isSpecial: true, health: 100, color: [50, 200, 50], size: 24, tier: 1.2,
  turretLayer: 'ground', randomRotation: true, randomFlip: true, animationBodyType: 'soft',
  isActiveWhileMoving: false,
  CountTowardAttachedCapacity: false,
  countTowardAttachedCapacity: false,
  tooltip: "Enables plants to work on water. Placed under plants",
  actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
};
