
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { spawnLootAt } from '../../../economy';

declare const floor: any;
declare const random: any;

export class ActionPassiveSun extends TurretAction {
  tags = ['economy', 'passive'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    
    const config = (this.turret.config.actionConfig as any);
    const type = 'passiveSun';
    let lastFire = this.turret.actionTimers.get(type) || 0;
    const interval = config.passiveSunInterval || 600;
    
    return state.frames - lastFire >= interval;
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
    const config = (this.turret.config.actionConfig as any);
    const type = 'passiveSun';
    
    const amount = config.passiveSunAmount || 1;
    for (let i = 0; i < amount; i++) {
      const px = wPos.x + random(-10, 10);
      const py = wPos.y + random(-10, 10);
      spawnLootAt(px, py, 'sun');
    }
    
    this.turret.actionTimers.set(type, state.frames);
    this.turret.actionCount.set(type, (this.turret.actionCount.get(type) || 0) + 1);
  }

  update() {
  }
}
