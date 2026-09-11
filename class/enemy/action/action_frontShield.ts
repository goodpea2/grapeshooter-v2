import { EnemyAction, EnemyActionConfig } from '../EnemyAction';
import { state } from '../../../state';
import { GRID_SIZE } from '../../../constants';
import { eventBus } from '../../../src/events/eventBus';
import { soundEngine } from '../../../src/audio/soundEngine';
import { spawnHitSpark, spawnDamageNumber } from '../../../vfx/index';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const stroke: any;
declare const noFill: any;
declare const strokeWeight: any;
declare const arc: any;
declare const atan2: any;
declare const sin: any;
declare const frameCount: any;

export class ActionFrontShield extends EnemyAction {
  tags = ['defense', 'shield'];
  shieldHp: number = 1000;
  maxShieldHp: number = 1000;
  shieldRadius: number = GRID_SIZE * 2; // 2 tiles away = 68px
  shieldArc: number = Math.PI / 2; // 90 degree arc (±45 degrees from front)
  lastHitFrame: number = -100;

  constructor(config: EnemyActionConfig) {
    super(config);
    this.shieldHp = config.shieldHealth ?? 1000;
    this.maxShieldHp = this.shieldHp;
    this.shieldRadius = config.shieldRadius ?? (GRID_SIZE * 2);
    this.shieldArc = (config.shieldArcDegrees ? (config.shieldArcDegrees * Math.PI / 180) : Math.PI / 2);
  }

  canExecute(): boolean {
    return this.shieldHp > 0 && !this.enemy.isDying;
  }

  isReady(): boolean {
    return this.shieldHp > 0;
  }

  update(playerPos: any, turrets: any[]): void {
    if (this.enemy.isDying) {
      this.shieldHp = 0;
    }
  }

  performExecute(): void {}

  /**
   * Tests whether a bullet at (bx, by) intersects the front shield arc.
   */
  testBulletIntersection(bx: number, by: number, prevBx?: number, prevBy?: number): boolean {
    if (this.shieldHp <= 0 || this.enemy.isDying) return false;

    const ex = this.enemy.pos.x;
    const ey = this.enemy.pos.y;
    const dx = bx - ex;
    const dy = by - ey;
    const distSq = dx * dx + dy * dy;
    const d = Math.sqrt(distSq);

    // Check radial proximity to shield arc (width ~16px tolerance)
    const arcRadius = this.shieldRadius;
    const tolerance = 16;
    if (Math.abs(d - arcRadius) > tolerance) {
      // Also test segment between prevPos and pos if available
      if (prevBx !== undefined && prevBy !== undefined) {
        const prevDx = prevBx - ex;
        const prevDy = prevBy - ey;
        const prevD = Math.sqrt(prevDx * prevDx + prevDy * prevDy);
        // Did the bullet cross arcRadius?
        if (!((prevD < arcRadius && d > arcRadius) || (prevD > arcRadius && d < arcRadius))) {
          return false;
        }
      } else {
        return false;
      }
    }

    // Check angle relative to enemy's front direction
    const angleToBullet = atan2(dy, dx);
    let diff = angleToBullet - this.enemy.rot;
    // Normalize to [-PI, PI]
    while (diff < -Math.PI) diff += Math.PI * 2;
    while (diff > Math.PI) diff -= Math.PI * 2;

    const halfArc = this.shieldArc / 2;
    return Math.abs(diff) <= halfArc;
  }

  /**
   * Applies damage to the front shield.
   */
  takeShieldDamage(dmg: number, source?: any): boolean {
    if (this.shieldHp <= 0) return false;

    this.shieldHp = Math.max(0, this.shieldHp - dmg);
    this.lastHitFrame = state.frames;

    // Visual damage number in cyan/blue for shield hit
    const shieldAngle = this.enemy.rot;
    const hitX = this.enemy.pos.x + Math.cos(shieldAngle) * this.shieldRadius;
    const hitY = this.enemy.pos.y + Math.sin(shieldAngle) * this.shieldRadius;

    state.vfx.push(spawnDamageNumber(hitX, hitY, dmg, [100, 220, 255]));
    state.vfx.push(spawnHitSpark(hitX, hitY, [120, 240, 255]));

    soundEngine.playSFXGroup('projectile_hit_shield');
    eventBus.emit('SHIELD_DAMAGED', {
      enemy: this.enemy,
      shieldHp: this.shieldHp,
      maxShieldHp: this.maxShieldHp,
      amount: dmg
    });

    if (this.shieldHp <= 0) {
      // Shield break explosion of sparks
      for (let i = 0; i < 8; i++) {
        state.vfx.push(spawnHitSpark(hitX + (Math.random() - 0.5) * 30, hitY + (Math.random() - 0.5) * 30, [140, 240, 255]));
      }
      soundEngine.playSFXGroup('enemy_swarm_death');
    }

    return true;
  }

  displayShield(): void {
    if (this.shieldHp <= 0 || this.enemy.isDying) return;

    push();
    translate(this.enemy.pos.x, this.enemy.pos.y);
    rotate(this.enemy.rot);

    const halfArc = this.shieldArc / 2;
    const isHit = (state.frames - this.lastHitFrame) < 5;
    const integrityRatio = Math.max(0.1, this.shieldHp / this.maxShieldHp);

    noFill();
    // Glowing outer arc
    stroke(100, 220, 255, isHit ? 240 : 120 + 30 * sin(frameCount * 0.1));
    strokeWeight(isHit ? 6 : 4);
    arc(0, 0, this.shieldRadius * 2, this.shieldRadius * 2, -halfArc, halfArc);

    // Inner crisp arc
    stroke(200, 250, 255, isHit ? 255 : 200 * integrityRatio);
    strokeWeight(2);
    arc(0, 0, this.shieldRadius * 2 - 2, this.shieldRadius * 2 - 2, -halfArc, halfArc);

    pop();
  }

  onDeath(): void {
    this.shieldHp = 0;
  }
}
