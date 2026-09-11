import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';
import { AttachedTurret } from '../../attachedTurret';
import { WorldTurret } from '../../worldTurret';
import { state } from '../../../state';

export const t3_puncher: TurretConfig = { 
  name: 'Puncher', 
  costs: { sun: 60 }, 
  costAlmanac: { shard: 8, shell: 12 }, 
  drops: { shard: 1, shell: 2 }, 
  health: 600, 
  color: [140, 140, 255], 
  size: 22, 
  tier: 3, 
  tooltip: "Attacks both enemies and obstacles. Increases damage temporarily per kill.", 
  animationBodyType: 'tough',
  actionType: ['laserBeam'],
  actionConfig: { 
    beamDamage: 15,
    beamDamageRate: 15,
    beamWidth: 10,
    beamDuration: 1,
    beamFireRate: 30,
    beamDamageWidth: 0,
    beamAutoLength: true,
    beamMaxLength: GRID_SIZE * 2.5
  },
  targetType: ['enemy', 'obstacle'],
  targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
};

export class PuncherMK2AttachedTurret extends AttachedTurret {
  buffStacks: number = 0;
  lastBuffFrame: number = -999999;
  decayCounter: number = 0;

  constructor(type: string, parent: any, hq: number, hr: number) {
    super(type, parent, hq, hr);
    this.updateVisualStage();
  }

  getActiveActionConfig(): any {
    const base = super.getActiveActionConfig();
    return {
      ...base,
      beamDamage: (base.beamDamage || 8) + this.buffStacks*3
    };
  }

  handleTargetDeathBuff() {
    if (this.buffStacks < 15) {
      this.buffStacks++;
    }
    this.lastBuffFrame = state.frames;
    this.decayCounter = 0;
    this.updateVisualStage();
  }

  onTargetKilled(target: any) {
    super.onTargetKilled(target);
    this.handleTargetDeathBuff();
  }

  onTargetMined(target: any, context?: any) {
    super.onTargetMined(target, context);
    this.handleTargetDeathBuff();
  }

  customUpdate() {
    const graceFrames = 2 * HOUR_FRAMES; // 1200 frames (2 in-game hours)
    const elapsed = state.frames - this.lastBuffFrame;

    if (this.buffStacks > 0 && elapsed >= graceFrames) {
      this.decayCounter++;
      // Decays by 2 per second (60 fps / 2 = 1 stack every 30 frames)
      if (this.decayCounter >= 30) {
        this.decayCounter = 0;
        this.buffStacks = Math.max(0, this.buffStacks - 1);
        this.updateVisualStage();
      }
    } else {
      this.decayCounter = 0;
    }
  }

  updateVisualStage() {
    if (this.buffStacks >= 15) {
      this.customAssetImg = 't3_puncher_stage3';
    } else if (this.buffStacks >= 5) {
      this.customAssetImg = 't3_puncher_stage2';
    } else {
      this.customAssetImg = 't3_puncher_stage1';
    }
  }
}

export class PuncherMK2WorldTurret extends WorldTurret {
  buffStacks: number = 0;
  lastBuffFrame: number = -999999;
  decayCounter: number = 0;

  constructor(type: string, gx: number, gy: number) {
    super(type, gx, gy);
    this.updateVisualStage();
  }

  getActiveActionConfig(): any {
    const base = super.getActiveActionConfig();
    return {
      ...base,
      beamDamage: (base.beamDamage || 8) + this.buffStacks*3
    };
  }

  handleTargetDeathBuff() {
    if (this.buffStacks < 15) {
      this.buffStacks++;
    }
    this.lastBuffFrame = state.frames;
    this.decayCounter = 0;
    this.updateVisualStage();
  }

  onTargetKilled(target: any) {
    super.onTargetKilled(target);
    this.handleTargetDeathBuff();
  }

  onTargetMined(target: any, context?: any) {
    super.onTargetMined(target, context);
    this.handleTargetDeathBuff();
  }

  customUpdate() {
    const graceFrames = 2 * HOUR_FRAMES; // 1200 frames (2 in-game hours)
    const elapsed = state.frames - this.lastBuffFrame;

    if (this.buffStacks > 0 && elapsed >= graceFrames) {
      this.decayCounter++;
      if (this.decayCounter >= 30) {
        this.decayCounter = 0;
        this.buffStacks = Math.max(0, this.buffStacks - 1);
        this.updateVisualStage();
      }
    } else {
      this.decayCounter = 0;
    }
  }

  updateVisualStage() {
    if (this.buffStacks >= 15) {
      this.customAssetImg = 't3_puncher_stage3';
    } else if (this.buffStacks >= 5) {
      this.customAssetImg = 't3_puncher_stage2';
    } else {
      this.customAssetImg = 't3_puncher_stage1';
    }
  }
}
