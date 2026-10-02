
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { Bullet } from '../../bullet';
import { spawnLootAt } from '../../../economy';


export class ActionSpawnBulletAtRandom extends TurretAction {
  tags = ['attack', 'projectile', 'random'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    const config = this.turret.getActiveActionConfig ? this.turret.getActiveActionConfig() : this.turret.config.actionConfig;
    const type = 'spawnBulletAtRandom';
    let lastFire = this.turret.actionTimers.get(type) || 0;
    const armingMult = 1 + (this.turret.activeStats?.armingTimeMult || this.turret.stats?.armingTimeMult || 0);
    const fireRate = (config.spawnBulletAtRandom?.cooldown || 60) * Math.max(0.1, armingMult);
    return state.frames - lastFire >= fireRate;
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    const config = this.turret.getActiveActionConfig ? this.turret.getActiveActionConfig() : this.turret.config.actionConfig;
    const sbc = config.spawnBulletAtRandom;
    return (sbc?.distRange ? sbc.distRange[1] : 300) * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.getActiveActionConfig ? this.turret.getActiveActionConfig() : this.turret.config.actionConfig;
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
        const frMultiplier = this.turret.getFireRateMultiplier ? this.turret.getFireRateMultiplier() : ((this.turret as any).fireRateMultiplier || 1.0);
        dependencyReady = (state.frames - depLastT > (depFr / frMultiplier));
    }

    if (dependencyReady) {
      const range = this.getRange();
      const minRange = (sbc.distRange ? sbc.distRange[0] : 0) * (this.turret.stats.rangeMult || 1);
      const ang = random(Math.PI * 2); const r = random(minRange, range);
      const tx = wPos.x + Math.cos(ang) * r; const ty = wPos.y + Math.sin(ang) * r;
      let b = Bullet.create(wPos.x, wPos.y, tx, ty, sbc.bulletKey, 'none', this.turret); 
      (b as any).targetPos = createVector(tx, ty);
      state.bullets.push(b);
      if (this.turret.type === 't2_minespawner' && (state.turretUpgrades?.['t2_minespawner'] || []).includes('u_t2_minespawner_2')) {
        const count = (state.turretUpgrades?.['t2_minespawner'] || []).filter((id: string) => id === 'u_t2_minespawner_2').length;
        for (let i = 0; i < Math.max(1, count); i++) {
          spawnLootAt(wPos.x, wPos.y, 'sun');
        }
      }
      if (this.turret.isCharged && this.turret.isCharged()) {
        const stamCost = config.staminaCostPerBulletSpawned || config.StaminaCostPerBulletSpawned || 0;
        if (stamCost > 0 && state.player) {
          state.player.spendStamina(stamCost, this.turret);
        }
      }
      this.turret.recoil = 8; 
      this.turret.actionTimers.set(type, state.frames); 
      (this.turret as any).pulseAnimTimer = 10;
    }
  }

  update() {
  }
}
