
import { state } from '../state';
// Fixed: Removed TWO_PI from constants import and added VISIBILITY_RADIUS which is used below
import { GRID_SIZE, CHUNK_SIZE, VISIBILITY_RADIUS } from '../constants';
import { liquidTypes } from '../balanceLiquids';
import { overlayTypes } from '../balanceObstacles';
import { Explosion, LiquidTrailVFX, MuzzleFlash } from '../vfx';
import { AttachedTurret } from './attachedTurret';
import { SunLoot, TurretLoot } from './loot';
import { Bullet } from './bullet';
import { drawPlayer } from '../visualPlayer';

// Fixed: Added missing p5.js global declaration
declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const atan2: any;
declare const floor: any;
declare const frameCount: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const color: any;
// Fixed: Declared TWO_PI as a p5.js global constant
declare const TWO_PI: any;

export class Player {
  pos: any; prevPos: any; size = 30; attachments: AttachedTurret[] = []; health = 100; maxHealth = 100; speed = 3.6; flash = 0; autoTurretAngle = 0; autoTurretLastShot = 0; autoTurretRange = GRID_SIZE * 6; autoTurretFireRate = 22; recoil = 0; target: any = null;
  constructor(x: number, y: number) { this.pos = createVector(x, y); this.prevPos = createVector(x, y); }
  update() {
    this.prevPos.set(this.pos); this.recoil = (this.recoil || 0) * 0.85;
    const gx = floor(this.pos.x / GRID_SIZE); const gy = floor(this.pos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    let lMult = lData?.liquidConfig?.playerMovementSpeedMultiplier ?? 1.0;
    
    this.applyObstacleRepulsion();

    let move = createVector(0, 0); const keyIsDown: any = (window as any).keyIsDown;
    if (keyIsDown(65)) move.x -= 1; if (keyIsDown(68)) move.x += 1; if (keyIsDown(87)) move.y -= 1; if (keyIsDown(83)) move.y += 1;
    if (move.mag() > 0) { move.normalize().mult(this.speed * lMult); this.moveWithSliding(move); }
    let vel = dist(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    state.isStationary = vel < 0.4 ? (state.stationaryTimer++ > 15) : (state.stationaryTimer = 0, false);
    
    if (lData && lData.trailVfxInterval && frameCount % floor(lData.trailVfxInterval / 3) === 0 && vel > 0.5) state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.playerTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));

    for (let i = this.attachments.length - 1; i >= 0; i--) { const a = this.attachments[i]; a.update(); if (a.health <= 0) { state.vfx.push(new Explosion(a.getWorldPos().x, a.getWorldPos().y, a.size * 2, color(a.config.color))); this.attachments.splice(i, 1); } }
    for (let i = state.loot.length - 1; i >= 0; i--) {
      const res = state.loot[i].update(this.pos);
      if (res === 'collected') {
        if (state.loot[i] instanceof TurretLoot) {
           this.addStrayTurret((state.loot[i] as TurretLoot).turretType);
        } else {
           state.sunCurrency += state.loot[i].value;
           state.totalSunLootCollected += state.loot[i].value;
        }
        state.loot.splice(i, 1);
      } else if (res === 'missed') { 
        state.sunMissedTotal += state.loot[i].value; 
        state.loot.splice(i, 1); 
      }
    }
    this.updateAutoTurret();
  }

  applyObstacleRepulsion() {
    const gx = floor(this.pos.x / GRID_SIZE);
    const gy = floor(this.pos.y / GRID_SIZE);
    const forceRange = GRID_SIZE * 0.9;
    for (let i = gx - 1; i <= gx + 1; i++) {
      for (let j = gy - 1; j <= gy + 1; j++) {
        if (state.world.isBlockAt(i * GRID_SIZE + 1, j * GRID_SIZE + 1)) {
          const bCenter = createVector(i * GRID_SIZE + GRID_SIZE/2, j * GRID_SIZE + GRID_SIZE/2);
          const d = dist(this.pos.x, this.pos.y, bCenter.x, bCenter.y);
          if (d < forceRange) {
            const pushDir = p5.Vector.sub(this.pos, bCenter).normalize().mult(4.0 * (1 - d/forceRange));
            this.pos.add(pushDir);
          }
        }
      }
    }
  }

  addStrayTurret(type: string) {
    let bestSlot = null; let minDist = Infinity;
    const rangeLimit = 8;
    for (let q = -rangeLimit; q <= rangeLimit; q++) {
      for (let r = -rangeLimit; r <= rangeLimit; r++) {
        if (Math.abs(q) + Math.abs(r) + Math.abs(-q-r) <= rangeLimit * 2) {
          let occupied = (q === 0 && r === 0);
          for(let a of this.attachments) if(a.hq === q && a.hr === r) occupied = true;
          if (!occupied) {
             const neighbors = [[1,0], [-1,0], [0,1], [0,-1], [1,-1], [-1,1]];
             let adj = false;
             for (let [dq, dr] of neighbors) {
               let nq = q + dq; let nr = r + dr;
               if (nq === 0 && nr === 0) { adj = true; break; }
               if (this.attachments.some((a:any) => a.hq === nq && a.hr === nr)) { adj = true; break; }
             }
             if (adj) {
               let d = dist(0, 0, q, r);
               if (d < minDist) { minDist = d; bestSlot = { q, r }; }
             }
          }
        }
      }
    }
    if (bestSlot) {
      this.attachments.push(new AttachedTurret(type, this, bestSlot.q, bestSlot.r));
      state.vfx.push(new Explosion(this.pos.x, this.pos.y, 60, color(255, 255, 100)));
    }
  }

  updateAutoTurret() {
    if (!state.isStationary) return;
    let bestR = null; let minRD = this.autoTurretRange;
    for (let a of this.attachments) if (a.isFrosted && a.iceCubeHealth > 0) { let d = dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y); if (d < minRD && state.world.checkLOS(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y)) { minRD = d; bestR = a; } }
    if (bestR) { this.target = bestR; const bp = bestR.getWorldPos(); this.autoTurretAngle = atan2(bp.y - this.pos.y, bp.x - this.pos.x); if (frameCount - this.autoTurretLastShot > this.autoTurretFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, bp.x, bp.y, 'b_player', 'icecube')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 24, 6, color(100, 200, 255))); this.autoTurretLastShot = frameCount; this.recoil = 6; } return; }
    let nearestE = null; let minDistE = this.autoTurretRange;
    for (let e of state.enemies) if (!e.isInvisible && e.health > 0 && !e.isDying) { let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y); if (d < minDistE && state.world.checkLOS(this.pos.x, this.pos.y, e.pos.x, e.pos.y)) { minDistE = d; nearestE = e; } }
    if (nearestE) { this.autoTurretAngle = atan2(nearestE.pos.y - this.pos.y, nearestE.pos.x - this.pos.x); if (frameCount - this.autoTurretLastShot > this.autoTurretFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, nearestE.pos.x, nearestE.pos.y, 'b_player', 'enemy')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 24, 6, color(100, 200, 255))); this.autoTurretLastShot = frameCount; this.recoil = 6; } } else {
      let t = this.findBlockTarget(this.pos, this.autoTurretRange); if (t) { let bc = { x: t.pos.x + GRID_SIZE/2, y: t.pos.y + GRID_SIZE/2 }; this.autoTurretAngle = atan2(bc.y - this.pos.y, bc.x - this.pos.x); if (frameCount - this.autoTurretLastShot > this.autoTurretFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, bc.x, bc.y, 'b_player_mining', 'none')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 14, 4, color(255, 255, 100))); this.autoTurretLastShot = frameCount; this.recoil = 3; } }
    }
  }

  findBlockTarget(origin: any, range: number) {
      let nPri: any = null; let mdPri = range; let nGen: any = null; let mdGen = range;
      const chunks = state.world.chunks as Map<string, any>;
      for (const chunk of chunks.values()) {
          const cX = chunk.cx * CHUNK_SIZE * GRID_SIZE;
          const cY = chunk.cy * CHUNK_SIZE * GRID_SIZE;
          if (dist(cX, cY, origin.x, origin.y) > range + 500) continue;
          
          const blocks = chunk.blocks as any[];
          for (const b of blocks) {
              if (b.isMined || !b.pos) continue;
              const bc = { x: b.pos.x + GRID_SIZE/2, y: b.pos.y + GRID_SIZE/2 };
              const d = dist(origin.x, origin.y, bc.x, bc.y);
              if (d > range) continue;
              
              if (!state.world.checkLOS(origin.x, origin.y, bc.x + (origin.x < bc.x ? -2 : 2), bc.y + (origin.y < bc.y ? -2 : 2))) continue;
              
              const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
              if (oCfg?.isValuable || oCfg?.isEnemy) {
                  if (d < mdPri) { mdPri = d; nPri = b; }
              } else {
                  if (d < mdGen) { mdGen = d; nGen = b; }
              }
          }
      }
      return nPri || nGen;
  }

  moveWithSliding(move: any) {
    let tx = this.pos.x + move.x; 
    let cx = state.world.checkCollision(tx, this.pos.y, this.size/2); 
    const ltx = state.world.getLiquidAt(floor(tx / GRID_SIZE), floor(this.pos.y / GRID_SIZE)); 
    if (ltx && liquidTypes[ltx]?.liquidConfig?.blocksMovement) cx = true;
    
    const atts = this.attachments as AttachedTurret[];
    for(let a of atts) {
      if(a.config.collideWithEnemy !== false && state.world.checkCollision(tx + a.offset.x, this.pos.y + a.offset.y, a.config.size/2)) {
        cx = true;
        break;
      }
    }
    if (!cx) this.pos.x = tx;

    let ty = this.pos.y + move.y; 
    let cy = state.world.checkCollision(this.pos.x, ty, this.size/2); 
    const lty = state.world.getLiquidAt(floor(this.pos.x / GRID_SIZE), floor(ty / GRID_SIZE)); 
    if (lty && liquidTypes[lty]?.liquidConfig?.blocksMovement) cy = true;
    
    for(let a of atts) {
      if(a.config.collideWithEnemy !== false && state.world.checkCollision(this.pos.x + a.offset.x, ty + a.offset.y, a.config.size/2)) {
        cy = true;
        break;
      }
    }
    if (!cy) this.pos.y = ty;
  }
  takeDamage(dmg: number) { this.health -= dmg; this.flash = 6; if (this.health <= 0) this.health = 0; }
  displayAttachments(behind: boolean) { for (let a of this.attachments) if (behind === !!a.config.renderBehindEnemy) a.display(); }
  display() {
    drawPlayer(this);
  }
}
