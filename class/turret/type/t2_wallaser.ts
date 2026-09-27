import { TurretConfig } from '../turretConfig';
import { GRID_SIZE } from '../../../constants';
import { t_laser } from './t_laser';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noFill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const ellipse: any;
declare const fill: any;
declare const noStroke: any;

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

  display() {
    super.display();
    const hasUpg3 = (state.turretUpgrades?.['t2_wallaser'] || []).includes('u_t2_wallaser_3');
    const isFullHp = this.health >= (this.maxHealth || this.config?.maxHealth || this.config?.health || 150);
    const playerMissingHp = state.player ? (state.player.maxHealth - state.player.health) : 0;
    if (hasUpg3 && isFullHp && playerMissingHp >= 50) {
      const wPos = this.getWorldPos();
      const pulse = (Math.sin((state.frames || 0) * 0.08) + 1) * 0.5;
      push();
      translate(wPos.x, wPos.y);
      noFill();
      stroke(100, 255, 120, 70 + pulse * 110);
      strokeWeight(2 + pulse * 1.5);
      ellipse(0, 0, (this.size || 22) * 2 + 6 + pulse * 4);
      fill(100, 255, 120, 25 + pulse * 30);
      noStroke();
      ellipse(0, 0, (this.size || 22) * 2 + 4);
      pop();
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

  display() {
    super.display();
    const hasUpg3 = (state.turretUpgrades?.['t2_wallaser'] || []).includes('u_t2_wallaser_3');
    const isFullHp = this.health >= (this.maxHealth || this.config?.maxHealth || this.config?.health || 150);
    const playerMissingHp = state.player ? (state.player.maxHealth - state.player.health) : 0;
    if (hasUpg3 && isFullHp && playerMissingHp >= 50) {
      const wPos = this.getWorldPos();
      const pulse = (Math.sin((state.frames || 0) * 0.08) + 1) * 0.5;
      push();
      translate(wPos.x, wPos.y);
      noFill();
      stroke(100, 255, 120, 70 + pulse * 110);
      strokeWeight(2 + pulse * 1.5);
      ellipse(0, 0, (this.size || 22) * 2 + 6 + pulse * 4);
      fill(100, 255, 120, 25 + pulse * 30);
      noStroke();
      ellipse(0, 0, (this.size || 22) * 2 + 4);
      pop();
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
  targetConfig: { obstaclePriority: 'valuable' },
  upgrades: [
    { id: 'u_t2_wallaser_1', description: "Player's movement speed +5% for each Walling Laser attached", modifiers: { playerSpeedAdd: 0.05 } },
    { id: 'u_t2_wallaser_2', description: "Walling Laser starts with 150 extra health", modifiers: { initialHealthAdd: 150 } },
    { id: 'u_t2_wallaser_3', stackable: false, description: "While on max health, can be merged onto the Player to heal the Player" },
    { id: 'u_t2_wallaser_4', description: "Range +20% for every neighboring [c_ice]", conditionals: [{ type: 'neighbor_count', targetClass: 'c_ice', bonus: { rangeMult: 0.2 } }] },
    { id: 'u_t2_wallaser_5', description: "While on max health, neighboring plants' Max Health +100" }
  ]
};

