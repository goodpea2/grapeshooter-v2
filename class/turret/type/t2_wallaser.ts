import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_laser } from './t_laser';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';

export class WallaserAttachedTurret extends AttachedTurret {
  constructor(type: string, parent: any, hq: number, hr: number) {
    super(type, parent, hq, hr);
    this.updateVisualStage();
  }

  customUpdate() {
    this.updateVisualStage();
  }

  updateVisualStage() {
    if (this.health >= 1201) {
      this.customAssetImg = 't_wallaser_stage3';
    } else if (this.health >= 600) {
      this.customAssetImg = 't_wallaser_stage2';
    } else {
      this.customAssetImg = 't_wallaser_stage1';
    }
  }
}

export class WallaserWorldTurret extends WorldTurret {
  constructor(type: string, gx: number, gy: number) {
    super(type, gx, gy);
    this.updateVisualStage();
  }

  customUpdate() {
    this.updateVisualStage();
  }

  updateVisualStage() {
    if (this.health >= 1201) {
      this.customAssetImg = 't_wallaser_stage3';
    } else if (this.health >= 600) {
      this.customAssetImg = 't_wallaser_stage2';
    } else {
      this.customAssetImg = 't_wallaser_stage1';
    }
  }
}

export const t2_wallaser: TurretConfig = {
  ...t_laser,
  name: 'Walling Laser', 
  costs: { sun: 20 }, costAlmanac: { shard: 2, shell: 5 }, drops: { shard: 1, shell: 1 },
  health: 150, 
  maxHealth: 2400,
  initialHealth: 150,
  color: [100, 180, 255], 
  tier: 2, 
  tooltip: "Heals itself everytime a block is mined", 
  animationBodyType: 'tough',
  actionType: ['laserBeam'],
  actionConfig: { 
    ...t_laser.actionConfig,
    onMineHealSelf: 50,
    onMineHealBypassMaxHP: false
  },
  targetType: ['obstacle'],
  targetConfig: { obstaclePriority: 'valuable' }
};
