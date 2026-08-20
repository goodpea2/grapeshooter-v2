import { TurretConfig } from '../turretConfig';

export const t0_hypnobomb: TurretConfig = {
  name: 'Hypno Bomb', costs: { elixir: 50 }, health: 50, color: [255, 0, 255], size: 22, tier: 0, isSpecial: true,
  tooltip: "Explodes after 6s, hypnotizes enemies in a huge area for 2h",
  explosiveGrowth: true, animationBodyType: 'soft',
  isActiveWhileMoving: false,
  actionType: ['die'],
  actionConfig: { dieAfterDuration: 360, pulseBulletTypeKey: 'b_hypnobomb_explosion' },
  targetType: [], targetConfig: {}
};
