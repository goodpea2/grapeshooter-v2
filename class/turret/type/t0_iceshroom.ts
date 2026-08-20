import { TurretConfig } from '../turretConfig';

export const t0_iceshroom: TurretConfig = {
  name: 'Ice Shroom', costs: { elixir: 40 }, health: 50, color: [180, 240, 255], size: 22, tier: 0, isSpecial: true,
  tooltip: "Explodes after 6s, freezes enemies in a huge area for 4h",
  explosiveGrowth: true, animationBodyType: 'soft',
  isActiveWhileMoving: false,
  actionType: ['die'],
  actionConfig: { dieAfterDuration: 360, pulseBulletTypeKey: 'b_iceshroom_explosion' },
  targetType: [], targetConfig: {}
};
