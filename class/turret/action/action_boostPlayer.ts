
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { MagicLinkVFX } from '../../../vfx/index';

export class ActionBoostPlayer extends TurretAction {
  tags = ['boost', 'passive'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    return true; // Boost is passive/continuous
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
    const type = 'boostPlayer';
    
    state.player.applyCondition('c_raged', 15);
    if (state.frames % 10 === 0) {
       state.vfx.push(new MagicLinkVFX(wPos, state.player.pos));
    }
    
    this.turret.actionTimers.set(type, state.frames);
  }

  update() {
  }
}
