
import { state } from '../../../state';
import { TurretAction } from '../../turretAction';
import { MagicLinkVFX, SparkVFX } from '../../../vfx/index';
import { Enemy } from '../../enemy';

declare const floor: any;
declare const random: any;
declare const createVector: any;
declare const color: any;

export class ActionGenerateElectricChain extends TurretAction {
  tags = ['attack', 'electric'];

  isReady(): boolean {
    if (this.isLocked()) return false;
    return true; // Always execute to render VFX, damage is gated inside
  }

  needsTarget(): boolean {
    return false;
  }

  getRange(): number {
    const config = this.turret.config.actionConfig;
    return (config.electricChainMaxLength || 150) * (this.turret.stats.rangeMult || 1);
  }

  canExecute(): boolean {
    return this.isReady();
  }

  performExecute() {
    const wPos = this.turret.getWorldPos();
    const config = this.turret.config.actionConfig;
    const type = 'generateElectricChain';
    
    const peers = (this.turret as any).getNearbyTurrets();
    for (let peer of peers) {
        if (peer === this.turret || peer.type !== this.turret.type || peer.isFrosted || peer.uid < this.turret.uid) continue;
        const p1 = wPos;
        const p2 = peer.getWorldPos();
        const dSq = (p1.x - p2.x)**2 + (p1.y - p2.y)**2;
        const maxChainRange = this.getRange();
        const maxChainRangeSq = maxChainRange * maxChainRange;
        if (dSq > maxChainRangeSq) continue;

        if (state.frames % 3 === 0) state.vfx.push(new MagicLinkVFX(p1, p2));

        const lastTrigger = this.turret.actionTimers.get(type) || -99999;
        const frValue = config.electricChainDamageRate || 60;
        const fr = Array.isArray(frValue) ? frValue[0] : frValue; // Simplified for now
        
        let frDivider = (this.turret as any).activeStats?.firerateDivider || 1.0;
        const ready = (state.frames - lastTrigger > (fr / frDivider));

        if (ready) {
            const dmg = config.electricChainDamage || 10;
            const widthSq = (config.electricChainDamageWidth || 32)**2;
            const maxTotalDmg = config.electricChainMaxDamage || 15;

            for (let e of state.enemies) {
                if (e.health <= 0 || e.isDying) continue;
                const dSegSq = (this.turret as any).distToSegmentSq(e.pos, p1, p2);
                if (dSegSq < (widthSq + e.size**2 * 0.25)) {
                    if ((e as any).elecFrame !== state.frames) { (e as any).elecFrame = state.frames; (e as any).elecDmg = 0; }
                    if ((e as any).elecDmg < maxTotalDmg) {
                        e.takeDamage(dmg, this.turret);
                        (e as any).elecDmg += dmg;
                    }
                }
            }
            this.turret.actionTimers.set(type, state.frames);
        }
    }
  }

  update() {
  }
}
