import { TurretConfig } from '../turretConfig';
import { HOUR_FRAMES } from '../../../constants';

export const t_seed2: TurretConfig = {
  name: 'Seed (T2)', cost: 0, health: 50, color: [255, 200, 50], size: 16, tier: 1.5,
  isActiveWhileMoving: false, animationBodyType: 'soft',
  tooltip: "Grows into a random Tier 2 turret over time. Water speeds up growth.",
  actionType: ['growth'],
  actionConfig: { maxGrowth: 48, growthInterval: HOUR_FRAMES * 0.25, growthPool: ['t2_repeater', 't2_firepea', 't2_laser2', 't2_peanut', 't2_puncher', 't2_tall', 't2_mortar', 't2_pulse', 't2_laserexplode', 't2_minespawner', 't2_snowpea', 't2_iceray', 't2_spike', 't2_icebomb', 't2_stun'] },
  targetType: [], targetConfig: {}
};
