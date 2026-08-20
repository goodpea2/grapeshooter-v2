import { TurretConfig } from '../turretConfig';

export const t0_firecherry: TurretConfig = {
  name: 'Fire Cherry', costs: { elixir: 30 }, health: 50, color: [255, 100, 0], size: 22, tier: 0, isSpecial: true,
  tooltip: "Explodes after 3s, leaving multiple fire puddles for 2h",
  explosiveGrowth: true, animationBodyType: 'soft',
  isActiveWhileMoving: false,
  actionType: ['die'],
  actionConfig: { dieAfterDuration: 180, pulseBulletTypeKey: 'b_firecherry_explosion' },
  targetType: [], targetConfig: {}
};
