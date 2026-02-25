
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE, VISIBILITY_RADIUS, HEX_DIST, PLAYER_DRAG_MIN_DISTANCE_TILES, PLAYER_DRAG_MAX_DISTANCE_TILES } from '../constants';
import { liquidTypes } from '../balanceLiquids';
import { conditionTypes } from '../balanceConditions';
import { overlayTypes } from '../balanceObstacles';
import { turretTypes } from '../balanceTurrets';
import { Explosion, LiquidTrailVFX, MuzzleFlash, ConditionVFX } from '../vfx';
import { AttachedTurret } from './attachedTurret';
import { LootEntity } from './loot';
import { Bullet } from './bullet';
import { drawPlayer } from '../visualPlayer';

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
declare const TWO_PI: any;

export class Player {
  pos: any; prevPos: any; size = 30; attachments: AttachedTurret[] = []; health = 100; maxHealth = 100; speed = 3.6; flash = 0; autoTurretAngle = 0; autoTurretLastShot = 0; autoTurretRange = GRID_SIZE * 6; autoTurretFireRate = 22; recoil = 0; target: any = null;
  hurtAnimTimer = 0;
  isClickHolding: boolean = false;
  autoTurretClickFirerateBoost = 3; // +300% attack speed
  pulseAnimTimer = 0;
  conditions: Map<string, number> = new Map();
  
  // Input tracking for orientation and state locking
  moveInputVec: any;
  isMovingIntent: boolean = false;

  constructor(x: number, y: number) { 
    this.pos = createVector(x, y); 
    this.prevPos = createVector(x, y); 
    this.moveInputVec = createVector(0, 0);
  }
  
  applyCondition(cKey: string, duration: number) {
    const cfg = conditionTypes[cKey]; if (!cfg) return;
    this.conditions.set(cKey, Math.max(this.conditions.get(cKey) || 0, duration));
    if (!state.vfx.some((v: any) => v instanceof ConditionVFX && v.target === this && v.type === cKey)) state.vfx.push(new ConditionVFX(this, cKey));
  }

  update() {
    this.prevPos.set(this.pos); 
    this.recoil = (this.recoil || 0) * 0.85;
    if (this.flash > 0) this.flash--;
    if (this.hurtAnimTimer > 0) this.hurtAnimTimer--;
    if (this.pulseAnimTimer > 0) this.pulseAnimTimer--;

    // Game Over check
    if (this.health <= 0 && !state.isGameOver) {
      state.isGameOver = true;
      state.showGameOverPopup = true;
    }

    if (state.isGameOver) return;

    // Process Conditions
    let fireRateMult = 1.0;
    for (let [cKey, life] of this.conditions) {
      const cfg = conditionTypes[cKey];
      if (cfg.playerCombatBoost) fireRateMult *= cfg.playerCombatBoost;
      this.conditions.set(cKey, life - 1);
      if (life <= 0) this.conditions.delete(cKey);
    }

    const gx = floor(this.pos.x / GRID_SIZE); const gy = floor(this.pos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    let lMult = lData?.liquidConfig?.playerMovementSpeedMultiplier ?? 1.0;
    
    // 1. Gather Input Intent
    this.moveInputVec.set(0, 0); 
    const keyIsDown: any = (window as any).keyIsDown;
    if (keyIsDown(65)) this.moveInputVec.x -= 1; 
    if (keyIsDown(68)) this.moveInputVec.x += 1; 
    if (keyIsDown(87)) this.moveInputVec.y -= 1; 
    if (keyIsDown(83)) this.moveInputVec.y += 1;
    
    // Add touch input
    if (state.touchInputVec.x !== 0 || state.touchInputVec.y !== 0) {
      this.moveInputVec.x += state.touchInputVec.x;
      this.moveInputVec.y += state.touchInputVec.y;
    }
    
    this.isMovingIntent = this.moveInputVec.mag() > 0;

    // 2. Perform Movement
    if (this.isMovingIntent) { 
      let effectiveSpeedMultiplier = state.isWASDInput ? 1.0 : state.playerSpeedMultiplier;
      const move = this.moveInputVec.copy().normalize().mult(this.speed * lMult * effectiveSpeedMultiplier); 
      this.moveWithSliding(move); 
    } else {
      state.playerSpeedMultiplier = 0; // Reset multiplier if no movement intent
    }

    // 3. Resolve Obstacle Collisions (Snap to surface to prevent jitter)
    this.applyObstacleRepulsion();

    // 4. Update Stationary State
    let vel = dist(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    const isActuallyStationary = (vel < 0.1);
    
    if (isActuallyStationary) {
      state.stationaryTimer++;
      if (state.stationaryTimer > 15) state.isStationary = true;
    } else {
      state.stationaryTimer = 0;
      state.isStationary = false;
    }
    
    if (lData && lData.trailVfxInterval && frameCount % floor(lData.trailVfxInterval / 3) === 0 && vel > 0.5) {
      state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.playerTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));
    }

    for (let i = this.attachments.length - 1; i >= 0; i--) { const a = this.attachments[i]; a.update(); if (a.health <= 0) { state.vfx.push(new Explosion(a.getWorldPos().x, a.getWorldPos().y, a.size * 2, color(...a.config.color))); this.attachments.splice(i, 1); } }
    
    for (let i = state.loot.length - 1; i >= 0; i--) {
      const loot = state.loot[i] as LootEntity;
      const res = loot.update(this.pos);
      if (res === 'collected') {
        if (loot.config.type === 'turret') {
           this.addStrayTurret(loot.config.itemValue !== undefined ? String(loot.config.itemValue) : loot.config.item);
        } else if (loot.config.type === 'turretAsItem') {
           const itemKey = loot.config.item;
           state.inventory[itemKey] = (state.inventory[itemKey] || 0) + 1;
           state.totalTurretsAcquired++;
           state.uiAlpha = 255; 
        } else {
           const val = loot.config.itemValue || 1;
           if (loot.config.item === 'sun') {
              state.sunCurrency += val;
              state.totalSunLootCollected += val;
              state.uiSunScale = 1.6;
           } else if (loot.config.item === 'elixir') {
              state.elixirCurrency += val;
              state.totalElixirLootCollected += val;
              state.uiElixirScale = 1.6;
           } else if (loot.config.item === 'soil') {
              state.soilCurrency += val;
              state.totalSoilLootCollected += val;
              state.uiSoilScale = 1.6;
           }
        }
        state.loot.splice(i, 1);
      } else if (res === 'missed') { 
        if (loot.config.type === 'currency' && loot.config.item === 'sun') state.sunMissedTotal += (loot.config.itemValue || 1); 
        state.loot.splice(i, 1); 
      }
    }

    this.updateAutoTurret(fireRateMult);
  }

  applyObstacleRepulsion() {
    const gx = floor(this.pos.x / GRID_SIZE);
    const gy = floor(this.pos.y / GRID_SIZE);
    
    // Use slightly smaller collision radius for "soft" pushing
    const myRadius = this.size * 0.45; 
    const blockRadius = GRID_SIZE * 0.5;
    const minSafeDist = myRadius + blockRadius;

    for (let i = gx - 1; i <= gx + 1; i++) {
      for (let j = gy - 1; j <= gy + 1; j++) {
        const bx = i * GRID_SIZE + GRID_SIZE/2;
        const by = j * GRID_SIZE + GRID_SIZE/2;
        if (state.world.isBlockAt(bx, by)) {
          const dx = this.pos.x - bx;
          const dy = this.pos.y - by;
          const dSq = dx*dx + dy*dy;
          
          if (dSq < minSafeDist * minSafeDist && dSq > 0.01) {
            const d = Math.sqrt(dSq);
            const overlap = minSafeDist - d;
            // STATIC RESOLUTION: Move exactly the overlap distance + epsilon
            const pushX = (dx / d) * (overlap + 0.05);
            const pushY = (dy / d) * (overlap + 0.05);
            this.pos.x += pushX;
            this.pos.y += pushY;
          }
        }
      }
    }
  }

  addStrayTurret(type: string) {
    const config = turretTypes[type];
    if (!config) return;

    let bestSlot = null; 
    let minDist = Infinity;
    const rangeLimit = 8;
    const turretSize = config.size || 22;

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
               // Calculate world position relative to current player position
               const offX = HEX_DIST * (1.5 * q);
               const offY = HEX_DIST * (Math.sqrt(3)/2 * q + Math.sqrt(3) * r);
               const targetWorldX = this.pos.x + offX;
               const targetWorldY = this.pos.y + offY;

               // PHYSICAL LEGIBILITY CHECK: 
               // Check if the spot is clear of obstacles before allowing attachment.
               // We use the same 0.55 multiplier as manual placement.
               const isClear = !state.world.checkCollision(targetWorldX, targetWorldY, turretSize * 0.55);

               if (isClear) {
                 let d = dist(0, 0, q, r);
                 if (d < minDist) { 
                   minDist = d; 
                   bestSlot = { q, r }; 
                 }
               }
             }
          }
        }
      }
    }

    if (bestSlot) {
      this.attachments.push(new AttachedTurret(type, this, bestSlot.q, bestSlot.r));
      state.totalTurretsAcquired++;
      state.vfx.push(new Explosion(this.pos.x, this.pos.y, 60, color(255, 255, 100)));
    } else {
      // CRAMPED FALLBACK: 
      // If no physically clear spot exists adjacent to the base, 
      // automatically add the turret to the inventory so the player doesn't lose it.
      state.inventory[type] = (state.inventory[type] || 0) + 1;
      state.totalTurretsAcquired++;
      state.uiAlpha = 255; // Flash UI to show item acquisition
    }
  }

  updateAutoTurret(fireRateMult: number) {
    const isRaged = this.conditions.has('c_raged');
    // do not delete this line - effectiveFireRate is a stackable percentage, not exponential, for example: "4x fire rate" translates to +300% fire rate, so 2 sources of 4x fire rate gives the output of +600%. 
    let effectiveFireRateMultiplier = fireRateMult;
    if (this.isClickHolding) effectiveFireRateMultiplier += this.autoTurretClickFirerateBoost;
    if (!state.isStationary && !isRaged) return;

    const effectiveFireRate = this.autoTurretFireRate / effectiveFireRateMultiplier;

    let bestR = null; let minRD = this.autoTurretRange;
    for (let a of this.attachments) if (a.isFrosted && a.iceCubeHealth > 0) { let d = dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y); if (d < minRD && state.world.checkLOS(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y)) { minRD = d; bestR = a; } }
    if (bestR) { this.target = bestR; const bp = bestR.getWorldPos(); this.autoTurretAngle = atan2(bp.y - this.pos.y, bp.x - this.pos.x); if (frameCount - this.autoTurretLastShot > effectiveFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, bp.x, bp.y, 'b_player', 'icecube')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 24, 6, color(100, 200, 255))); this.autoTurretLastShot = frameCount; this.recoil = 6; this.pulseAnimTimer = 15; } return; }
    let nearestE = null; let minDistE = this.autoTurretRange;
    for (let e of state.enemies) if (!e.isInvisible && e.health > 0 && !e.isDying) { let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y); if (d < minDistE && state.world.checkLOS(this.pos.x, this.pos.y, e.pos.x, e.pos.y)) { minDistE = d; nearestE = e; } }
    if (nearestE) { this.autoTurretAngle = atan2(nearestE.pos.y - this.pos.y, nearestE.pos.x - this.pos.x); if (frameCount - this.autoTurretLastShot > effectiveFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, nearestE.pos.x, nearestE.pos.y, 'b_player', 'enemy')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 24, 6, color(100, 200, 255))); this.autoTurretLastShot = frameCount; this.recoil = 6; this.pulseAnimTimer = 15; } } else {
      let t = this.findBlockTarget(this.pos, this.autoTurretRange); if (t) { let bc = { x: t.pos.x + GRID_SIZE/2, y: t.pos.y + GRID_SIZE/2 }; this.autoTurretAngle = atan2(bc.y - this.pos.y, bc.x - this.pos.x); if (frameCount - this.autoTurretLastShot > effectiveFireRate) { state.bullets.push(new Bullet(this.pos.x, this.pos.y, bc.x, bc.y, 'b_player_mining', 'none')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, this.autoTurretAngle, 14, 4, color(255, 255, 100))); this.autoTurretLastShot = frameCount; this.recoil = 3; this.pulseAnimTimer = 10; } }
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
    let cx = state.world.checkCollision(tx, this.pos.y, this.size/2.1); 
    const ltx = state.world.getLiquidAt(floor(tx / GRID_SIZE), floor(this.pos.y / GRID_SIZE)); 
    if (ltx && liquidTypes[ltx]?.liquidConfig?.blocksMovement) cx = true;
    
    const atts = this.attachments as AttachedTurret[];
    for(let a of atts) {
      if(state.world.checkCollision(tx + a.offset.x, this.pos.y + a.offset.y, a.config.size/2.1)) {
        cx = true;
        break;
      }
    }
    if (!cx) this.pos.x = tx;

    let ty = this.pos.y + move.y; 
    let cy = state.world.checkCollision(this.pos.x, ty, this.size/2.1); 
    const lty = state.world.getLiquidAt(floor(this.pos.x / GRID_SIZE), floor(ty / GRID_SIZE)); 
    if (lty && liquidTypes[lty]?.liquidConfig?.blocksMovement) cy = true;
    
    for(let a of atts) {
      if(state.world.checkCollision(this.pos.x + a.offset.x, ty + a.offset.y, a.config.size/2.1)) {
        cy = true;
        break;
      }
    }
    if (!cy) this.pos.y = ty;
  }
  takeDamage(dmg: number) { this.health -= dmg; this.flash = 6; this.hurtAnimTimer = 10; if (this.health <= 0) this.health = 0; }
  
  displayAttachments(behind: boolean) { 
    const filtered = this.attachments.filter(a => {
        const isGroundGroup = (a.config.turretLayer === 'ground' || !!a.config.renderBehindEnemy);
        return behind ? isGroundGroup : !isGroundGroup;
    });

    filtered.sort((a, b) => {
        const posA = a.getWorldPos();
        const posB = b.getWorldPos();
        if (posB.y !== posA.y) return posB.y - posA.y;
        return posA.x - posB.x;
    });

    for (let a of filtered) a.display();
  }

  display() {
    drawPlayer(this);
  }
}
