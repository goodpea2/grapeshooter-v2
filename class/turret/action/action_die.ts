
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { triggerUpgradeHook } from '../../../src/upgrades';

export class ActionDie extends TurretAction {
  tags = ['die', 'death'];

  isReady(): boolean {
    if (this.turret.health <= 0 && !this.turret.isDying) return true;
    const config = this.turret.config.actionConfig;
    if (config) {
      if (config.dieAfterDuration && this.turret.framesAlive >= config.dieAfterDuration) {
        return true;
      }
      if (config.dieAfterAction && config.dieAfterActionCount) {
        const actionCount = this.turret.actionCount.get(config.dieAfterAction) || 0;
        if (actionCount >= config.dieAfterActionCount) return true;
      }
    }
    return false;
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
    if (this.turret.isDying) return;
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    
    if (config.pulseBulletTypeKey) {
      let b = Bullet.create(wPos.x, wPos.y, wPos.x, wPos.y, config.pulseBulletTypeKey, 'none', this.turret); 
      (b as any).life = 0; 
      state.bullets.push(b);
    }
    
    triggerUpgradeHook('onDeath', this.turret, { target: this.turret, targetType: 'turret', typeName: this.turret.type });
    this.turret.health = 0;
    (this.turret as any).onDeath();
  }

  update() {
  }
}
