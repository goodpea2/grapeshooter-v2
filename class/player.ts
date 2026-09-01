
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE, VISIBILITY_RADIUS, HEX_DIST, PLAYER_DRAG_MIN_DISTANCE_TILES, PLAYER_DRAG_MAX_DISTANCE_TILES } from '../constants';
import { liquidTypes } from '../balanceLiquids';
import { conditionTypes } from '../balanceConditions';
import { overlayTypes } from '../balanceObstacles';
import { turretTypes } from '../balanceTurrets';
import { Explosion, spawnExplosion, LiquidTrailVFX, MuzzleFlash, ConditionVFX } from '../vfx';
import { AttachedTurret } from './attachedTurret';
import { WorldTurret } from './worldTurret';
import { createAttachedTurret, createWorldTurret, copyTurretState, restoreTurretData } from './turret/TurretRegistry';
import { getPlayerUpgradeStat } from '../src/playerUpgrades';
import { LootEntity, TurretLoot } from './loot';
import { spawnLootAt } from '../economy';
import { Bullet, spawnBullet } from './bullet';
import { drawPlayer } from '../visualPlayer';
import { triggerUpgradeHook } from '../src/upgrades';
import { soundEngine } from '../src/audio/soundEngine';

declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const atan2: any;
declare const floor: any;
declare const constrain: any;
declare const frameCount: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const color: any;
declare const radians: any;
declare const TWO_PI: any;

export class Player {
  pos: any; prevPos: any; size = 30; attachments: AttachedTurret[] = []; health = 100; maxHealth = 100; speed = 3.0; flash = 0; autoTurretAngle = 0; autoTurretLastShot = 0; autoTurretRange = GRID_SIZE * 6; autoTurretFireRate = 22; recoil = 0; target: any = null;
  stamina = 100;
  maxStamina = 100;
  lastStaminaSpentFrame = -1000;
  staminaDepletingTimer = 0;
  hurtAnimTimer = 0;
  isClickHolding: boolean = false;
  isBoosting: boolean = false;
  autoTurretClickMiningBoost = 2; // +200% mining speed
  autoTurretClickAttackBoost = 2; // +200% attack speed
  pulseAnimTimer = 0;
  conditions: Map<string, number> = new Map();
  
  // Input tracking for orientation and state locking
  moveInputVec: any;
  isMovingIntent: boolean = false;
  activeStats: any = {
    damageMult: 1.0,
    speedMult: 1.0,
    healthMult: 1.0,
    damageAdd: 0,
    healthAdd: 0,
  };

  constructor(x: number, y: number) { 
    this.pos = createVector(x, y); 
    this.prevPos = createVector(x, y); 
    this.moveInputVec = createVector(0, 0);
    const configuredMaxStam = getPlayerUpgradeStat('maxStamina') || 100;
    this.maxStamina = configuredMaxStam;
    this.stamina = configuredMaxStam;
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
    if (this.staminaDepletingTimer > 0) this.staminaDepletingTimer--;

    // Update Boosting state: requires >= 25 stamina to start, stops when stamina runs out (<= 0)
    if (this.isClickHolding) {
      if (!this.isBoosting) {
        if (this.stamina >= 25) {
          this.isBoosting = true;
        }
      } else {
        if (this.stamina <= 0) {
          this.isBoosting = false;
        }
      }
    } else {
      this.isBoosting = false;
    }

    // Update Max Stamina from upgrades
    const currentMaxStam = getPlayerUpgradeStat('maxStamina') || 100;
    if (currentMaxStam !== this.maxStamina) {
      const diff = currentMaxStam - this.maxStamina;
      this.maxStamina = currentMaxStam;
      if (diff > 0) {
        this.stamina = Math.min(this.maxStamina, this.stamina + diff);
      } else {
        this.stamina = Math.min(this.maxStamina, this.stamina);
      }
    }

    // Stamina auto-recovery: only when player is not moving and >= 1 second (60 frames) since last stamina spent
    // Recovery rate: 2 per 6 frames (1/3 per frame)
    const isMoving = this.isMovingIntent;
    const timeSinceLastSpent = state.frames - this.lastStaminaSpentFrame;
    if (!isMoving && timeSinceLastSpent >= 60 && this.stamina < this.maxStamina) {
      this.stamina = Math.min(this.maxStamina, this.stamina + (2 / 6));
    }

    // Game Over check
    if (this.health <= 0 && !state.isGameOver) {
      state.isGameOver = true;
      state.showGameOverPopup = true;
    }

    if (state.isGameOver) return;

    const isTurretSelected = !!(state.selectedTurretType || state.draggedTurretInstance || state.draggedTurretType);

    // Process Conditions
    let fireRateBonus = 0;
    for (let [cKey, life] of this.conditions) {
      const cfg = conditionTypes[cKey];
      if (cfg.playerCombatBoost) fireRateBonus += (cfg.playerCombatBoost - 1);
      if (cfg.firerateBoost) fireRateBonus += cfg.firerateBoost;
      this.conditions.set(cKey, life - 1);
      if (life <= 0) this.conditions.delete(cKey);
    }
    let fireRateMult = 1.0 + fireRateBonus;

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
      const moveSpeedBonus = getPlayerUpgradeStat('movementSpeed') || 0;
      const totalSpeedMultiplier = (state.playerBonuses.speedMult || 1.0) * (1.0 + moveSpeedBonus);
      const move = this.moveInputVec.copy().normalize().mult(this.speed * lMult * effectiveSpeedMultiplier * totalSpeedMultiplier); 
      this.moveWithSliding(move);

      // Update Breadcrumb Trail
      const lastPoint = state.playerTrail[state.playerTrail.length - 1];
      if (!lastPoint || dist(this.pos.x, this.pos.y, lastPoint.x, lastPoint.y) > 20) {
        state.playerTrail.push(this.pos.copy());
        if (state.playerTrail.length > state.maxTrailLength) {
          state.playerTrail.shift();
          if (state.trailStartIndexOnMove > 0) {
            state.trailStartIndexOnMove--;
          }
        }
      }
    } else {
      state.playerSpeedMultiplier = 0; // Reset multiplier if no movement intent
    }

    // 3. Resolve Obstacle Collisions (Snap to surface to prevent jitter)
    this.applyObstacleRepulsion();

    // 4. Update Stationary State
    let vel = dist(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    const isActuallyStationary = (vel < 0.2);
    
    if (isActuallyStationary) {
      state.stationaryTimer++;
      if (state.stationaryTimer > 15) {
        state.isStationary = true;
      }
      // When stationary, prune breadcrumbs to only the last 20 points
      if (state.playerTrail.length > 20) {
        const excess = state.playerTrail.length - 20;
        state.playerTrail = state.playerTrail.slice(excess);
        state.trailStartIndexOnMove = Math.max(0, state.trailStartIndexOnMove - excess);
        // Adjust pathTargetIndex for trailing turrets so they don't jump indices
        for (const a of this.attachments) {
          if (a.isFollowingTrail) {
            a.pathTargetIndex = Math.max(0, a.pathTargetIndex - excess);
          }
        }
      }

      // Count down 4 seconds (240 frames @ 60fps) before clearing remaining breadcrumbs
      if (state.playerTrail.length > 0) {
        if (state.trailFadeTimer <= 0) {
          state.trailFadeTimer = 240; // 4 seconds
        } else {
          state.trailFadeTimer--;
          if (state.trailFadeTimer <= 0) {
            state.playerTrail = [];
            state.trailStartIndexOnMove = 0;
            for (const a of this.attachments) {
              a.isFollowingTrail = false;
            }
          }
        }
      } else {
        state.trailFadeTimer = 0;
        state.trailStartIndexOnMove = 0;
      }
    } else {
      if (state.isStationary) {
        // Just started moving again: mark current trail end as the start of new movement
        state.trailStartIndexOnMove = state.playerTrail.length;
        for (const a of this.attachments) {
          a.isFollowingTrail = false;
          a.reactionTimer = 0;
          a.pathTargetIndex = state.playerTrail.length;
        }
      }
      state.stationaryTimer = 0;
      state.isStationary = false;
      state.trailFadeTimer = 0;
    }
    
    if (vel > 0.5) {
      soundEngine.playSFXGroup('player_step');
    }

    if (lData && lData.trailVfxInterval && state.frames % floor(lData.trailVfxInterval / 3) === 0 && vel > 0.5) {
      state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.playerTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));
    }

    for (let i = this.attachments.length - 1; i >= 0; i--) { 
      const a = this.attachments[i]; 
      a.update(); 
      if (a.health <= 0) { 
        state.vfx.push(spawnExplosion(a.getWorldPos().x, a.getWorldPos().y, a.size * 2, color(...a.config.color))); 
        
        // Drop loot on death
        if (a.config.drops) {
          for (const [res, amount] of Object.entries(a.config.drops)) {
            for (let j = 0; j < (amount as number); j++) {
              spawnLootAt(a.getWorldPos().x, a.getWorldPos().y, res);
            }
          }
        }
        
        this.attachments.splice(i, 1); 
      } 
    }
    
    this.updateAutoTurret(fireRateMult);
    this.checkWorldTurretCollisions();
  }

  getAttachedCount(): number {
    return this.attachments.filter(a => a.config?.countTowardAttachedCapacity !== false && a.config?.CountTowardAttachedCapacity !== false).length;
  }

  checkWorldTurretCollisions() {
    const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity') || 0;
    if (this.getAttachedCount() >= maxCapacity) {
      // Ignore WorldTurret and do not collide when capacity is reached
      return;
    }

    const worldTurrets = state.world.getAllTurrets();
    const myRadius = this.size * 0.5;
    
    for (let i = worldTurrets.length - 1; i >= 0; i--) {
      const wt = worldTurrets[i];
      if (wt.isRelocating || wt.jumpPhase !== null) {
        continue;
      }
      const wtPos = wt.getWorldPos();
      const wtRadius = wt.size * 0.5;

      // Proximity-Exit Trigger: turret cannot be re-picked up until player & squad step away
      if (wt.mustExitProximityFirst) {
        const dPlayerSq = (this.pos.x - wtPos.x)**2 + (this.pos.y - wtPos.y)**2;
        let minAttachmentDistSq = Infinity;
        for (const a of this.attachments) {
          const aPos = a.getWorldPos();
          const d = (aPos.x - wtPos.x)**2 + (aPos.y - wtPos.y)**2;
          if (d < minAttachmentDistSq) minAttachmentDistSq = d;
        }

        const safeExitDist = (myRadius + wtRadius + 24); // Safely outside detachment footprint
        const safeExitDistSq = safeExitDist * safeExitDist;

        if (dPlayerSq > safeExitDistSq && (this.attachments.length === 0 || minAttachmentDistSq > safeExitDistSq)) {
          // Successfully exited the proximity zone; enable normal pickup upon return
          wt.mustExitProximityFirst = false;
        } else {
          // Still inside detachment area, ignore pickup
          continue;
        }
      }
      
      // Check collision with player core
      const dPlayerSq = (this.pos.x - wtPos.x)**2 + (this.pos.y - wtPos.y)**2;
      if (dPlayerSq < (myRadius + wtRadius)**2) {
        if (this.attachWorldTurret(wt)) {
          continue;
        }
      }
      
      // Check collision with attachments
      for (const a of this.attachments) {
        const aPos = a.getWorldPos();
        const aRadius = a.size * 0.5;
        const dAttSq = (aPos.x - wtPos.x)**2 + (aPos.y - wtPos.y)**2;
        if (dAttSq < (aRadius + wtRadius)**2) {
          if (this.attachWorldTurret(wt)) {
            break;
          }
        }
      }
    }
  }

  attachWorldTurret(wt: any): boolean {
    const config = turretTypes[wt.type];
    if (!config) return false;

    const doesCount = config.countTowardAttachedCapacity !== false && config.CountTowardAttachedCapacity !== false;
    const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity') || 6;
    if (doesCount && this.getAttachedCount() >= maxCapacity) {
      return false; // Player at max capacity, turret remains as a world turret
    }

    let bestSlot: { q: number, r: number } | null = null;
    let minDist = Infinity;
    const rangeLimit = 8;
    const turretSize = config.size || 22;

    for (let q = -rangeLimit; q <= rangeLimit; q++) {
      for (let r = -rangeLimit; r <= rangeLimit; r++) {
        if (Math.abs(q) + Math.abs(r) + Math.abs(-q - r) <= rangeLimit * 2) {
          let occupied = (q === 0 && r === 0);
          for (let a of this.attachments) if (a.hq === q && a.hr === r) occupied = true;

          if (!occupied) {
            const neighbors = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
            let adj = false;
            for (let [dq, dr] of neighbors) {
              let nq = q + dq;
              let nr = r + dr;
              if (nq === 0 && nr === 0) { adj = true; break; }
              if (this.attachments.some((a: any) => a.hq === nq && a.hr === nr)) { adj = true; break; }
            }

            if (adj) {
              const offX = HEX_DIST * (1.5 * q);
              const offY = HEX_DIST * (Math.sqrt(3) / 2 * q + Math.sqrt(3) * r);
              const targetWorldX = this.pos.x + offX;
              const targetWorldY = this.pos.y + offY;

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
      const wtPos = wt.getWorldPos();
      state.world.removeTurret(wt.gx, wt.gy);
      const newTurret = createAttachedTurret(wt.type, this, bestSlot.q, bestSlot.r);
      copyTurretState(wt, newTurret);
      // Transfer active VFX
      for (let v of state.vfx) {
        if (v && v.target === wt) v.target = newTurret;
      }
      this.attachments.push(newTurret);
      state.totalTurretsAcquired++;
      state.vfx.push(new Explosion(wtPos.x, wtPos.y, 40, color(100, 255, 200)));
      soundEngine.playSFX('turret_pickup');
      return true;
    }

    return false;
  }

  dropWorldTurretAsLoot(wt: any) {
    const wtPos = wt.getWorldPos();
    spawnLootAt(wtPos.x, wtPos.y, wt.type, wt.health);
    state.world.removeTurret(wt.gx, wt.gy);
    state.vfx.push(new Explosion(wtPos.x, wtPos.y, 40, color(200, 200, 255)));
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
          
          const block = state.world.getBlock(i, j);
          if (block && block.type === 'o_paygate' && !block.isMined) {
            // Check actual collision contact with the block's physical bounds (increased trigger range by 1px)
            const cX = constrain(this.pos.x, i * GRID_SIZE, (i + 1) * GRID_SIZE);
            const cY = constrain(this.pos.y, j * GRID_SIZE, (j + 1) * GRID_SIZE);
            const distSqToBlock = (this.pos.x - cX) ** 2 + (this.pos.y - cY) ** 2;
            const isCollidingWithBlock = distSqToBlock <= (myRadius + 3) ** 2;

            if (isCollidingWithBlock && !this.isMovingIntent) {
              const grp = state.world.getPayGateGroup(block);
              if (grp) {
                if (state.frames - grp.lastPayFrame >= 6) {
                  grp.lastPayFrame = state.frames;
                  grp.payOneResource(state.world);
                }
              }
            }
          }

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

  addStrayTurret(type: string, hp?: number, turretData?: any) {
    const config = turretTypes[type];
    if (!config) return;

    const doesCount = config.countTowardAttachedCapacity !== false && config.CountTowardAttachedCapacity !== false;
    const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity') || 6;
    if (doesCount && this.getAttachedCount() >= maxCapacity) {
      // When TurretAttachCapacity is reached, spawn the turret on the nearest grid (WorldTurret)
      const baseGx = floor(this.pos.x / GRID_SIZE);
      const baseGy = floor(this.pos.y / GRID_SIZE);
      let bestGx = baseGx;
      let bestGy = baseGy;
      let minDist = Infinity;
      const searchRadius = 12;

      for (let dx = -searchRadius; dx <= searchRadius; dx++) {
        for (let dy = -searchRadius; dy <= searchRadius; dy++) {
          const gx = baseGx + dx;
          const gy = baseGy + dy;
          const wx = gx * GRID_SIZE + GRID_SIZE / 2;
          const wy = gy * GRID_SIZE + GRID_SIZE / 2;
          
          if (!state.world.isBlockAt(wx, wy) && !state.world.getTurretAt(gx, gy)) {
            const d = dist(this.pos.x, this.pos.y, wx, wy);
            if (d < minDist) {
              minDist = d;
              bestGx = gx;
              bestGy = gy;
            }
          }
        }
      }

      const worldX = bestGx * GRID_SIZE + GRID_SIZE / 2;
      const worldY = bestGy * GRID_SIZE + GRID_SIZE / 2;
      const newTurret = createWorldTurret(type, bestGx, bestGy);
      if (turretData) {
        restoreTurretData(newTurret, turretData);
      } else if (hp !== undefined) {
        newTurret.health = hp;
      }
      state.world.addTurret(newTurret);
      state.totalTurretsAcquired++;
      state.vfx.push(new Explosion(worldX, worldY, 40, color(100, 255, 200)));
      return;
    }

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
      const newTurret = createAttachedTurret(type, this, bestSlot.q, bestSlot.r);
      if (turretData) {
        restoreTurretData(newTurret, turretData);
      } else if (hp !== undefined) {
        newTurret.health = hp;
      }
      this.attachments.push(newTurret);
      state.totalTurretsAcquired++;
      state.vfx.push(spawnExplosion(this.pos.x, this.pos.y, 60, color(255, 255, 100)));
    } else {
      // CRAMPED FALLBACK: 
      // If no physically clear spot exists adjacent to the base, 
      // automatically add the turret to the inventory so the player doesn't lose it.
      state.inventory.items[type] = (state.inventory.items[type] || 0) + 1;
      state.inventory.specList.push({ key: type, type: 'turret', hp, turretData, timestamp: Date.now() });
      state.totalTurretsAcquired++;
      state.uiAlpha = 255; // Flash UI to show item acquisition
    }
  }

  updateAutoTurret(fireRateMult: number) {
    const isRaged = this.conditions.has('c_raged') || this.conditions.has('c_raged_visualonly');
    
    // Resolve ClickHold boost from upgrade
    const boostStat = getPlayerUpgradeStat('clickHoldBoost');
    const boostVal = boostStat !== undefined ? boostStat : 1.0;
    this.autoTurretClickAttackBoost = boostVal;
    this.autoTurretClickMiningBoost = boostVal;

    const isBoostActive = this.isBoosting && this.stamina > 0;

    // do not delete this line - effectiveFireRate is a stackable percentage, not exponential, for example: "4x fire rate" translates to +300% fire rate, so 2 sources of 4x fire rate gives the output of +600%. 
    let attackBonus = (fireRateMult - 1.0) + ((state.playerBonuses.attackFirerateMult || 1.0) - 1.0);
    let miningBonus = (fireRateMult - 1.0) + ((state.playerBonuses.miningFirerateMult || 1.0) - 1.0);
    
    if (isBoostActive) {
      attackBonus += this.autoTurretClickAttackBoost;
      miningBonus += this.autoTurretClickMiningBoost;
    }

    let attackFirerateMultiplier = 1.0 + attackBonus;
    let miningFirerateMultiplier = 1.0 + miningBonus;

    let effectiveAttackFireRate = this.autoTurretFireRate / attackFirerateMultiplier;
    let attackBulletsToSpawn = 1;
    if (effectiveAttackFireRate > 0) {
      while (effectiveAttackFireRate < 4) {
        effectiveAttackFireRate *= 2;
        attackBulletsToSpawn *= 2;
      }
    }

    let effectiveMiningFireRate = this.autoTurretFireRate / miningFirerateMultiplier;
    let miningBulletsToSpawn = 1;
    if (effectiveMiningFireRate > 0) {
      while (effectiveMiningFireRate < 4) {
        effectiveMiningFireRate *= 2;
        miningBulletsToSpawn *= 2;
      }
    }

    // Firing condition: stationary, raged, or holding click
    if (!state.isStationary && !isRaged && !this.isClickHolding) return;

    // 1. Frosted attachments (icecube target)
    let bestR = null; let minRD = this.autoTurretRange;
    for (let a of this.attachments) if (a.isFrosted && a.iceCubeHealth > 0) { let d = dist(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y); if (d < minRD && state.world.checkLOS(this.pos.x, this.pos.y, a.getWorldPos().x, a.getWorldPos().y)) { minRD = d; bestR = a; } }
    if (bestR) { 
      this.target = bestR; 
      const bp = bestR.getWorldPos(); 
      this.autoTurretAngle = atan2(bp.y - this.pos.y, bp.x - this.pos.x); 
      if (state.frames - this.autoTurretLastShot > effectiveAttackFireRate) { 
        for (let i = 0; i < attackBulletsToSpawn; i++) {
          let sa = this.autoTurretAngle;
          let startX = this.pos.x;
          let startY = this.pos.y;
          let targetX = bp.x;
          let targetY = bp.y;
          if (i > 0) {
            const offX = random(-15, 15);
            const offY = random(-15, 15);
            startX += offX; startY += offY;
            targetX += offX; targetY += offY;
          }
          state.bullets.push(spawnBullet(startX, startY, targetX, targetY, 'b_player', 'icecube', this)); 
          if (i === 0) state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, sa, 24, 6, color(100, 200, 255))); 
        }
        if (isBoostActive) {
          this.stamina = Math.max(0, this.stamina - 2 * attackBulletsToSpawn);
          this.lastStaminaSpentFrame = state.frames;
          this.staminaDepletingTimer = 12;
          this.applyCondition('c_raged_visualonly', 10);
        }
        this.autoTurretLastShot = state.frames; this.recoil = 6; this.pulseAnimTimer = 15; 
      } 
      return; 
    }

    // 2. Enemies
    let nearestE: any = null; let minDistE = this.autoTurretRange;
    if (state.spatialGrid) {
      state.spatialGrid.queryCircleEnemies(this.pos.x, this.pos.y, this.autoTurretRange, (e: any) => {
        let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y);
        if (d < minDistE && state.world.checkLOS(this.pos.x, this.pos.y, e.pos.x, e.pos.y)) {
          minDistE = d;
          nearestE = e;
        }
      });
    } else {
      for (let e of state.enemies) {
        if (e.health > 0 && !e.isDying) {
          let d = dist(this.pos.x, this.pos.y, e.pos.x, e.pos.y);
          if (d < minDistE && state.world.checkLOS(this.pos.x, this.pos.y, e.pos.x, e.pos.y)) {
            minDistE = d;
            nearestE = e;
          }
        }
      }
    }
    if (nearestE) { 
      this.autoTurretAngle = atan2(nearestE.pos.y - this.pos.y, nearestE.pos.x - this.pos.x); 
      if (state.frames - this.autoTurretLastShot > effectiveAttackFireRate) { 
        for (let i = 0; i < attackBulletsToSpawn; i++) {
          let sa = this.autoTurretAngle;
          let startX = this.pos.x;
          let startY = this.pos.y;
          let targetX = nearestE.pos.x;
          let targetY = nearestE.pos.y;
          if (i > 0) {
            const offX = random(-15, 15);
            const offY = random(-15, 15);
            startX += offX; startY += offY;
            targetX += offX; targetY += offY;
          }
          state.bullets.push(spawnBullet(startX, startY, targetX, targetY, 'b_player', 'enemy', this)); 
          if (i === 0) state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, sa, 24, 6, color(100, 200, 255))); 
        }
        if (isBoostActive) {
          const spent = 2 * attackBulletsToSpawn;
          this.stamina = Math.max(0, this.stamina - spent);
          this.lastStaminaSpentFrame = state.frames;
          this.staminaDepletingTimer = 12;
          this.applyCondition('c_raged_visualonly', 10);
          triggerUpgradeHook('onStaminaSpent', this, { amount: spent });
        }
        this.autoTurretLastShot = state.frames; this.recoil = 6; this.pulseAnimTimer = 15; 
      } 
      return;
    }

    // 3. Harvest Targets (ready to harvest sunflowers, etc.)
    let ht = this.findHarvestTarget(this.pos, this.autoTurretRange);
    if (ht) {
      let bc = ht.getWorldPos();
      this.autoTurretAngle = atan2(bc.y - this.pos.y, bc.x - this.pos.x);
      if (state.frames - this.autoTurretLastShot > effectiveMiningFireRate) {
        for (let i = 0; i < miningBulletsToSpawn; i++) {
          let sa = this.autoTurretAngle;
          let startX = this.pos.x;
          let startY = this.pos.y;
          let targetX = bc.x;
          let targetY = bc.y;
          if (i > 0) {
            const offX = random(-10, 10);
            const offY = random(-10, 10);
            startX += offX; startY += offY;
            targetX += offX; targetY += offY;
          }
          state.bullets.push(spawnBullet(startX, startY, targetX, targetY, 'b_player_mining', 'none', this));
          if (i === 0) state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, sa, 14, 4, color(255, 255, 100)));
        }
        if (isBoostActive) {
          const spent = 2 * miningBulletsToSpawn;
          this.stamina = Math.max(0, this.stamina - spent);
          this.lastStaminaSpentFrame = state.frames;
          this.staminaDepletingTimer = 12;
          this.applyCondition('c_raged_visualonly', 10);
          triggerUpgradeHook('onStaminaSpent', this, { amount: spent });
        }
        this.autoTurretLastShot = state.frames;
        this.recoil = 3;
        this.pulseAnimTimer = 10;
      }
      return;
    }

    // 4. Block Targets (dirt, rocks, sunGenerator, spawners, etc.)
    let t = this.findBlockTarget(this.pos, this.autoTurretRange); 
    if (t) { 
      let bc = { x: t.pos.x + GRID_SIZE/2, y: t.pos.y + GRID_SIZE/2 }; 
      this.autoTurretAngle = atan2(bc.y - this.pos.y, bc.x - this.pos.x); 
      if (state.frames - this.autoTurretLastShot > effectiveMiningFireRate) { 
        for (let i = 0; i < miningBulletsToSpawn; i++) {
          let sa = this.autoTurretAngle;
          let startX = this.pos.x;
          let startY = this.pos.y;
          let targetX = bc.x;
          let targetY = bc.y;
          if (i > 0) {
            const offX = random(-10, 10);
            const offY = random(-10, 10);
            startX += offX; startY += offY;
            targetX += offX; targetY += offY;
          }
          state.bullets.push(spawnBullet(startX, startY, targetX, targetY, 'b_player_mining', 'none', this)); 
          if (i === 0) state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, sa, 14, 4, color(255, 255, 100))); 
        }
        if (isBoostActive) {
          const spent = 2 * miningBulletsToSpawn;
          this.stamina = Math.max(0, this.stamina - spent);
          this.lastStaminaSpentFrame = state.frames;
          this.staminaDepletingTimer = 12;
          this.applyCondition('c_raged_visualonly', 10);
          triggerUpgradeHook('onStaminaSpent', this, { amount: spent });
        }
        this.autoTurretLastShot = state.frames; 
        this.recoil = 3; 
        this.pulseAnimTimer = 10; 
      } 
      return;
    }
  }

  findBlockTarget(origin: any, range: number) {
      let nPri: any = null; let mdPri = range; let nGen: any = null; let mdGen = range;
      const chunks = state.world.chunks as Map<string, any>;
      for (const chunk of chunks.values()) {
          const cX = chunk.cx * CHUNK_SIZE * GRID_SIZE;
          const cY = chunk.cy * CHUNK_SIZE * GRID_SIZE;
          // Robust chunk distance check: check distance to center of chunk
          const chunkCenterX = cX + (CHUNK_SIZE * GRID_SIZE) / 2;
          const chunkCenterY = cY + (CHUNK_SIZE * GRID_SIZE) / 2;
          const maxChunkRadius = (CHUNK_SIZE * GRID_SIZE) * 0.8; // Approx distance from center to corner
          if (dist(chunkCenterX, chunkCenterY, origin.x, origin.y) > range + maxChunkRadius) continue;
          
          const blocks = chunk.blocks as any[];
          for (const b of blocks) {
              if (b.isMined || !b.pos || b.type === 'o_barrier' || b.config?.isValidTarget === false || b.isValidTarget === false) continue;
              const oCfg = b.overlay ? overlayTypes[b.overlay] : null;
              if (oCfg?.isValidTarget === false) continue;

              const bc = { x: b.pos.x + GRID_SIZE/2, y: b.pos.y + GRID_SIZE/2 };
              const d = dist(origin.x, origin.y, bc.x, bc.y);
              if (d > range) continue;
              
              if (!state.world.checkLOS(origin.x, origin.y, bc.x, bc.y)) continue;
              
              if (oCfg?.isValuable || oCfg?.isEnemy) {
                  if (d < mdPri) { mdPri = d; nPri = b; }
              } else {
                  if (d < mdGen) { mdGen = d; nGen = b; }
              }
          }
      }
      return nPri || nGen;
  }

  findHarvestTarget(origin: any, range: number) {
    let best = null;
    let minDist = range;
    for (let a of this.attachments) {
      if (a.isHarvestReady) {
        const wPos = a.getWorldPos();
        const d = dist(origin.x, origin.y, wPos.x, wPos.y);
        if (d < minDist) {
          minDist = d;
          best = a;
        }
      }
    }
    return best;
  }

  moveWithSliding(move: any) {
    let tx = this.pos.x + move.x; 
    let cx = state.world.checkCollision(tx, this.pos.y, this.size/2.1); 
    const ltx = state.world.getLiquidAt(floor(tx / GRID_SIZE), floor(this.pos.y / GRID_SIZE)); 
    if (ltx && liquidTypes[ltx]?.liquidConfig?.blocksMovement) cx = true;
    
    if (!cx) this.pos.x = tx;

    let ty = this.pos.y + move.y; 
    let cy = state.world.checkCollision(this.pos.x, ty, this.size/2.1); 
    const lty = state.world.getLiquidAt(floor(this.pos.x / GRID_SIZE), floor(ty / GRID_SIZE)); 
    if (lty && liquidTypes[lty]?.liquidConfig?.blocksMovement) cy = true;
    
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
        
        // If they are at the same position, prioritize ground layer to be rendered first (underneath)
        if (Math.abs(posA.x - posB.x) < 1 && Math.abs(posA.y - posB.y) < 1) {
          const layerA = a.config.turretLayer === 'ground' ? 0 : 1;
          const layerB = b.config.turretLayer === 'ground' ? 0 : 1;
          if (layerA !== layerB) return layerA - layerB;
        }

        if (posB.y !== posA.y) return posB.y - posA.y;
        return posA.x - posB.x;
    });

    for (let a of filtered) a.display();
  }

  display() {
    drawPlayer(this);
  }
}
