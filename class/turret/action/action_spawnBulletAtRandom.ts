
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';

declare const random: any;
declare const floor: any;
declare const createVector: any;

export class ActionSpawnBulletAtRandom extends TurretAction {
  tags = ['attack', 'projectile', 'random'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    const config = this.turret.config.actionConfig;
    const type = 'spawnBulletAtRandom';
    let lastFire = this.turret.actionTimers.get(type) || 0;
    const fireRate = config.spawnBulletAtRandom?.cooldown || 60;
    return state.frames - lastFire >= fireRate;
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    const config = this.turret.config.actionConfig;
    const sbc = config.spawnBulletAtRandom;
    return (sbc?.distRange ? sbc.distRange[1] : 300) * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'spawnBulletAtRandom';
    
    const sbc = config.spawnBulletAtRandom;
    if (!sbc) return;

    let dependencyReady = true;
    if (sbc.enabledWhenActionIsReady) {
        const depAct = sbc.enabledWhenActionIsReady;
        const depLastT = this.turret.actionTimers.get(depAct) || -99999;
        const depStep = this.turret.actionSteps.get(depAct) || 0;
        const depFrValue = (depAct === 'shoot' || depAct === 'shootMultiTarget' || depAct === 'launch') ? config.shootFireRate : 
                           ((depAct === 'laserBeam') ? config.beamFireRate : 
                           ((depAct === 'spawnBulletAtRandom') ? config.spawnBulletAtRandom.cooldown : 
                           (depAct === 'generateElectricChain' ? config.electricChainDamageRate : 
                           (depAct === 'shield' ? 1 : 
                           (depAct === 'firstStrike' ? config.firstStrikeConfig.triggerRate : 
                           config.pulseCooldown)))));
        const depFr = Array.isArray(depFrValue) ? depFrValue[depStep % depFrValue.length] : depFrValue;
        dependencyReady = (state.frames - depLastT > (depFr / (this.turret as any).fireRateMultiplier));
    }

    if (dependencyReady) {
      const range = this.getRange();
      const minRange = (sbc.distRange ? sbc.distRange[0] : 0) * (this.turret.stats.rangeMult || 1);
      const ang = random(Math.PI * 2); const r = random(minRange, range);
      const tx = wPos.x + Math.cos(ang) * r; const ty = wPos.y + Math.sin(ang) * r;
      let b = new Bullet(wPos.x, wPos.y, tx, ty, sbc.bulletKey, 'none', this.turret); 
      (b as any).targetPos = createVector(tx, ty);
      state.bullets.push(b); 
      this.turret.recoil = 8; 
      this.turret.actionTimers.set(type, state.frames); 
      (this.turret as any).pulseAnimTimer = 10;
    }
  }

  update() {
  }
}
