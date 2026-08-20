import { TurretConfig } from '../turretConfig';

export const t0_cherrybomb: TurretConfig = {
  name: 'Cherry Bomb', costs: { elixir: 20 }, health: 50, color: [255, 50, 50], size: 22, tier: 0, isSpecial: true,
  tooltip: "Explodes after 3s, damaging obstacles in a wide area",
  explosiveGrowth: true, animationBodyType: 'soft',
  isActiveWhileMoving: false,
  actionType: ['die'],
  actionConfig: { dieAfterDuration: 180, pulseBulletTypeKey: 'b_cherry_explosion' },
  targetType: [], targetConfig: {}
};
