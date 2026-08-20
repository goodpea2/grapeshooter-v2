
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { MergeVFX } from '../../../vfx/index';

declare const floor: any;
declare const random: any;

export class ActionGrowth extends TurretAction {
  tags = ['growth', 'passive'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    return true; // Growth is passive/continuous
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    return 0;
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'growth';
    
    if (config.growthPool) {
      const interval = config.growthInterval || 150;
      if (state.frames % interval === 0) {
        let gain = 1;
        if (this.turret.isWaterlogged) gain = 4;
        this.turret.growthProgress += gain;
        
        if (this.turret.growthProgress >= (config.maxGrowth || 32)) {
          const pool = config.growthPool;
          const chosen = pool[Math.floor(Math.random() * pool.length)];
          
          this.turret.replaceWith(chosen);
          
          state.vfx.push(new MergeVFX(wPos.x, wPos.y, [255, 255, 255]));
        }
      }
    }
    
    this.turret.actionTimers.set(type, state.frames);
  }

  update() {
  }
}
