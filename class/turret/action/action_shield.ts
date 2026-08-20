
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Enemy } from '../../enemy';

declare const floor: any;
declare const random: any;
declare const createVector: any;

export class ActionShield extends TurretAction {
  tags = ['defense', 'shield'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    return true; // Shield is continuous
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    const config = this.turret.config.actionConfig;
    const baseRadius = (this.turret as any).activeStats?.shieldRadius || config.shieldRadius || (32 * 1.5);
    return baseRadius * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'shield';
    
    if (this.turret.specialActivityLevel > 0.1) {
        let sRadius = this.getRange();
        const sRadiusSq = sRadius * sRadius;
        for (let e of state.enemies) {
            if (e.health <= 0 || e.isDying) continue;
            const dx = e.pos.x - wPos.x;
            const dy = e.pos.y - wPos.y;
            const dSq = dx*dx + dy*dy;
            const rSum = (e.size / 2) + sRadius * this.turret.specialActivityLevel;
            if (dSq < rSum * rSum) {
                const d = Math.sqrt(dSq);
                const force = (rSum - d) * 0.15;
                e.moveWithCollisions(createVector(dx/d * force, dy/d * force));
                (this.turret as any).shieldImpactAngles.push(Math.atan2(dy, dx));
            }
        }
    }
    
    this.turret.actionTimers.set(type, state.frames);
  }

  update() {
  }
}
