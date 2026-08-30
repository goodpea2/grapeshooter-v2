import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t2_puncher } from './t2_puncher';

export const t2_wallaser: TurretConfig = { 
  name: 'Wallaser', 
  costs: { ...t2_puncher.costs }, 
  costAlmanac: { ...t2_puncher.costAlmanac }, 
  drops: { ...t2_puncher.drops }, 
  health: 150, 
  maxHealth: 1200,
  initialHealth: 150,
  color: [100, 180, 255], 
  size: 22, 
  tier: 2, 
  cooldownHours: 1,
  tooltip: "Heals itself everytime a block is mined", 
  animationBodyType: 'tough',
  actionType: ['laserBeam'],
  actionConfig: { 
    beamDamage: 5, 
    beamDamageRate: 3, 
    beamWidth: 4, 
    beamDuration: 1, 
    beamFireRate: 6, 
    beamDamageWidth: 0, 
    beamAutoLength: true, 
    beamMaxLength: GRID_SIZE * 4,
    onMineHealSelf: 50,
    onMineHealBypassMaxHP: false
  },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable' }
};
