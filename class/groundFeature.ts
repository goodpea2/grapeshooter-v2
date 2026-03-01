
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { groundFeatureTypes } from '../balanceGroundFeatures';
import { FirePuddleVFX, StunGasVFX, PoisonGasVFX, ForcefieldVFX } from '../vfx';

declare const createVector: any;
declare const dist: any;
declare const floor: any;

export class GroundFeature {
  pos: any; config: any; life: number; typeKey: string; vfx: any;
  constructor(x: number, y: number, typeKey: string) {
    this.typeKey = typeKey;
    this.config = groundFeatureTypes[typeKey];
    this.pos = createVector(x, y);
    this.life = this.config.life;
    if (this.config.vfxType === 'fire_puddle') this.vfx = new FirePuddleVFX(x, y, this.config.radius, this.config.life);
    if (this.config.vfxType === 'stun_gas') this.vfx = new StunGasVFX(x, y, this.config.radius, this.config.life);
    if (this.config.vfxType === 'poison_gas') this.vfx = new PoisonGasVFX(x, y, this.config.radius, this.config.life);
    if (this.config.vfxType === 'forcefield') this.vfx = new ForcefieldVFX(x, y, this.config.radius, this.config.life);
  }
  update() {
    this.life--;
    if (this.vfx) this.vfx.update();

    // Specific Forcefield Repulsion Logic
    if (this.typeKey === 'gf_forcefield') {
       const dx = state.player.pos.x - this.pos.x;
       const dy = state.player.pos.y - this.pos.y;
       const dSq = dx*dx + dy*dy;
       const rSum = state.player.size / 2 + this.config.radius;
       if (dSq < rSum * rSum) {
         const d = Math.sqrt(dSq);
         const pushForce = (rSum - d) * 0.5;
         state.player.pos.x += (dx / d) * pushForce;
         state.player.pos.y += (dy / d) * pushForce;
       }
    }

    if (this.config.tickRate && this.life % this.config.tickRate === 0) {
      const targets = this.config.damageTargets || ['enemy', 'obstacle']; // Default targets
      
      if (targets.includes('enemy')) {
        for (let e of state.enemies) {
          if (e.health > 0 && dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y) < this.config.radius + e.size/2) {
            const cond = this.config.appliedCondition;
            if (cond && e.applyCondition) {
               if (typeof cond === 'string') {
                 e.applyCondition(cond, this.config.conditionDuration || 60);
               } else {
                 for (const c of cond) e.applyCondition(c.type, c.duration, c);
               }
            }
            if (this.config.damage > 0) e.takeDamage(this.config.damage);
          }
        }
      }

      if (targets.includes('player')) {
        if (state.player && state.player.health > 0) {
          if (dist(this.pos.x, this.pos.y, state.player.pos.x, state.player.pos.y) < this.config.radius + state.player.size/2) {
            if (this.config.damage > 0) state.player.takeDamage(this.config.damage);
          }
        }
      }

      if (targets.includes('turret')) {
        for (let a of state.player.attachments) {
          if (a.health > 0) {
            const awPos = a.getWorldPos();
            if (dist(this.pos.x, this.pos.y, awPos.x, awPos.y) < this.config.radius + a.size/2) {
              if (this.config.damage > 0) a.takeDamage(this.config.damage);
            }
          }
        }
      }

      if (targets.includes('obstacle')) {
        let gxStart = floor((this.pos.x - this.config.radius) / GRID_SIZE);
        let gxEnd = floor((this.pos.x + this.config.radius) / GRID_SIZE);
        let gyStart = floor((this.pos.y - this.config.radius) / GRID_SIZE);
        let gyEnd = floor((this.pos.y + this.config.radius) / GRID_SIZE);
        for (let gx = gxStart; gx <= gxEnd; gx++) {
          for (let gy = gyStart; gy <= gyEnd; gy++) {
            let cx = floor(gx / CHUNK_SIZE); let cy = floor(gy / CHUNK_SIZE);
            let chunk = state.world.getChunk(cx, cy);
            let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
            if (block) {
              let bx = block.pos.x + GRID_SIZE/2; let by = block.pos.y + GRID_SIZE/2;
              if (dist(this.pos.x, this.pos.y, bx, by) < this.config.radius + GRID_SIZE/2) {
                if (this.config.damage > 0) block.takeDamage(this.config.damage);
              }
            }
          }
        }
      }
    }
  }
  display() { if (this.vfx) this.vfx.display(); }
}
