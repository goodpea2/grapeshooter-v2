
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { groundFeatureTypes } from '../balanceGroundFeatures';
import { FirePuddleVFX, StunGasVFX } from '../vfx';

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
    if (this.config.vfxType === 'fire_puddle') this.vfx = new FirePuddleVFX(x, y, this.config.radius);
    if (this.config.vfxType === 'stun_gas') this.vfx = new StunGasVFX(x, y, this.config.radius, this.config.life);
  }
  update() {
    this.life--;
    if (this.vfx) this.vfx.update();
    if (this.life % this.config.tickRate === 0) {
      for (let e of state.enemies) {
        if (e.health > 0 && dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y) < this.config.radius + e.size/2) {
          const cond = this.config.appliedCondition;
          if (cond && e.applyCondition) {
             if (typeof cond === 'string') {
               e.applyCondition(cond, this.config.conditionDuration || 60);
             } else {
               for (const c of cond) e.applyCondition(c.type, c.duration);
             }
          }
          e.takeDamage(this.config.damage);
        }
      }
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
            if (dist(this.pos.x, this.pos.y, bx, by) < this.config.radius + GRID_SIZE/2) block.takeDamage(this.config.damage);
          }
        }
      }
    }
  }
  display() { if (this.vfx) this.vfx.display(); }
}
