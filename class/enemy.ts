
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE, EnemyCollideRadiusCheck } from '../constants';
import { enemyTypes } from '../balanceEnemies';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { BugSplatVFX, GiantDeathVFX, HitSpark, LiquidTrailVFX, MuzzleFlash, ConditionVFX, drawPersistentDeathVisual, Explosion, DamageNumberVFX } from '../vfx/index';
import { AttachedTurret } from './attachedTurret';
import { Bullet } from './bullet';
import { lerpAngle } from './utils';
import { checkCircleRectCollision } from '../utils/collisions';
import { Obstacle } from '../balanceObstacles';
import { drawEnemy } from '../visualEnemies';
import { isLegibleSpot } from '../lvDemo';
import { spawnLootAt } from '../economy';

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
declare const red: any;
declare const green: any;
declare const blue: any;
declare const TWO_PI: any;
declare const width: any;
declare const height: any;
declare const HALF_PI: any;

export class Enemy {
  uid: string;
  pos: any; type: string; config: any; health: number; maxHealth: number; speed: number; size: number; col: any; target: any = null; flash: number = 0; rot: number; actionType: string[]; actionConfig: any;
  meleeCooldown: number = 0; shootCooldown: number = 0; swarmParticles: any[] = []; markedForDespawn: boolean = false;
  conditions: Map<string, number> = new Map();
  conditionData: Map<string, any> = new Map();
  prevPos: any; isDying: boolean = false;
  triggeredSpawnThresholds: Set<number> = new Set(); // Tracks already fired health ratios
  kbVel: any; // Knockback velocity
  kbTimer: number = 0; // Knockback duration (interrupts movement)
  dummyDetectedTimer: number = 0; // Timer for o_dummy debug behavior
  preferredSteeringDirection: number = 0; // -1 for left, 1 for right, 0 for undecided
  isDummyDetectedInLookAhead: boolean = false; // For debug visualization in gizmos

  // Attack Animation State
  attackAnimTimer: number = 0;
  attackAnimDuration: number = 0;
  attackOffset: any;

  // Steering behavior
  steeringDirection: number = 0; // -1 for left, 1 for right, 0 for no steering
  steeringTarget: any = null;
  steeringFrames: number = 0;
  path: any[] = []; // For debug visualization
  movingIntention: any = null; // For debug visualization

  constructor(x: number, y: number, typeKey: string) {
    this.uid = Math.random().toString(36).substr(2, 9);
    this.pos = createVector(x, y); this.prevPos = this.pos.copy(); this.type = typeKey; this.config = enemyTypes[typeKey]; this.health = this.config.health; this.maxHealth = this.health; this.speed = this.config.speed; this.size = this.config.size; this.col = this.config.col; this.rot = random(TWO_PI); this.actionType = this.config.actionType; this.actionConfig = this.config.actionConfig;
    if (this.type === 'e_swarm') for(let i=0; i<10; i++) this.swarmParticles.push({ offset: p5.Vector.random2D().mult(random(12, 24)), size: random(5, 9), phase: random(TWO_PI) });
    this.kbVel = createVector(0, 0);
    this.attackOffset = createVector(0, 0);
  }

  applyCondition(cKey: string, duration: number, data?: any) {
    const cfg = conditionTypes[cKey]; if (!cfg) return;
    if (cfg.conditionClashesConfig?.override) {
        for (let ov of cfg.conditionClashesConfig.override) {
            this.conditions.delete(ov);
            this.conditionData.delete(ov + '_dmg');
        }
    }
    
    this.conditions.set(cKey, Math.max(this.conditions.get(cKey) || 0, duration));
    
    // Stack logic for highest damage rate
    if (cKey === 'c_burning' && data?.damage !== undefined) {
        const currentMax = this.conditionData.get('c_burning_dmg') || 0;
        this.conditionData.set('c_burning_dmg', Math.max(currentMax, data.damage));
    }

    if (!state.vfx.some((v: any) => v instanceof ConditionVFX && v.target === this && v.type === cKey)) state.vfx.push(new ConditionVFX(this, cKey));
  }

  update(playerPos: any, turrets: AttachedTurret[]) {
    if (this.isDying) return;
    if (this.flash > 0) this.flash--;
    this.prevPos.set(this.pos);
    this.isDummyDetectedInLookAhead = false; // Reset for current frame


    // Apply knockback
    if (this.kbVel.mag() > 0.05) {
      this.moveWithCollisions(this.kbVel);
      this.kbVel.mult(0.9);
    }
    if (this.kbTimer > 0) this.kbTimer--;

    const dSqToPlayer = (this.pos.x - playerPos.x)**2 + (this.pos.y - playerPos.y)**2;
    const despawnRange = (GRID_SIZE * CHUNK_SIZE * 4)**2;
    if (dSqToPlayer > despawnRange) { 
      this.markedForDespawn = true; 
      const refund = (enemyTypes[this.type].cost || 0);
      state.hourlyBudgetPool += refund; 
      state.refundedBudget += refund;
      return; 
    }
    
    this.applyObstacleRepulsion();



    let speedMult = 1.0;
    let targetMoveVec = createVector(0, 0);
    for (let [cKey, life] of this.conditions) {
      const cfg = conditionTypes[cKey];
      
      if (cKey === 'c_burning') {
          const dmg = this.conditionData.get('c_burning_dmg') || cfg.damage || 0;
          if (dmg > 0 && frameCount % (cfg.damageInterval || 6) === 0) this.takeDamage(dmg);
      } else if (cfg.damage && frameCount % cfg.damageInterval === 0) {
          this.takeDamage(cfg.damage);
      }

      speedMult *= cfg.enemyMovementSpeedMultiplier;
      this.conditions.set(cKey, life - 1);
      if (life <= 0) {
          this.conditions.delete(cKey);
          if (cKey === 'c_burning') this.conditionData.delete('c_burning_dmg');
      }
    }

    const gx = floor(this.pos.x / GRID_SIZE); const gy = floor(this.pos.y / GRID_SIZE);
    const liquidType = state.world.getLiquidAt(gx, gy); const lData = liquidType ? liquidTypes[liquidType] : null;
    let actualVelSq = (this.pos.x - this.prevPos.x)**2 + (this.pos.y - this.prevPos.y)**2;

    if (lData) {
       speedMult *= lData.liquidConfig.enemyMovementSpeedMultiplier;
       if (lData.trailVfxInterval && frameCount % floor(lData.trailVfxInterval / 2) === 0 && actualVelSq > 0.01) state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.enemyTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));
       
       if (lData.liquidConfig.liquidDamageConfig?.enemy) {
         const cfg = lData.liquidConfig.liquidDamageConfig.enemy;
         const interval = cfg.damageInterval || 10;
         if (frameCount % interval === 0) {
           if (cfg.damage) this.takeDamage(cfg.damage);
           if (cfg.condition) this.applyCondition(cfg.condition, cfg.conditionDuration || interval * 2, { damage: cfg.damage });
         }
       }
    }

    if (this.conditions.has('c_stun') || this.kbTimer > 0) return;



    // Handle Attack Animation Sequence
    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer--;
      const progress = 1 - (this.attackAnimTimer / this.attackAnimDuration);
      
      const lungeDist = this.actionConfig.meleeAttackRange || (this.size * 0.25);

      if (progress < 0.4) {
        const backProgress = progress / 0.4;
        this.attackOffset = p5.Vector.fromAngle(this.rot).mult(-lungeDist * 0.2 * backProgress);
      } else {
        const strikeProgress = (progress - 0.4) / 0.6;
        const strikeAmt = sin(strikeProgress * Math.PI) * lungeDist;
        this.attackOffset = p5.Vector.fromAngle(this.rot).mult(strikeAmt - (lungeDist * 0.2 * (1 - strikeProgress)));

        if (this.attackAnimTimer === Math.floor(this.attackAnimDuration * 0.35)) {
           this.performMeleeStrike();
        }
      }
      return; 
    } else {
      this.attackOffset.set(0, 0);
    }

    const cs = state.spatialHashCellSize;
    const hgx = floor(this.pos.x / cs);
    const hgy = floor(this.pos.y / cs);
    const checkLimitSq = EnemyCollideRadiusCheck * EnemyCollideRadiusCheck;
    let shouldMove = true;
    
    let nearestT = null; let minDistTSq = 450*450;
    for (let t of turrets) {
        // ENEMY TARGETING REFINEMENT: Ignore retracted, waterlogged, or frosted turrets
        const isRetracted = !state.isStationary && !t.config.isActiveWhileMoving;
        const isInactive = isRetracted || t.isWaterlogged || t.isFrosted;
        if (isInactive || t.config.collideWithEnemy === false) continue;

        const twPos = t.getWorldPos();
        const dSq = (this.pos.x - twPos.x)**2 + (this.pos.y - twPos.y)**2;
        if (dSq < minDistTSq && state.world.checkLOS(this.pos.x, this.pos.y, twPos.x, twPos.y)) { 
            nearestT = t; minDistTSq = dSq; 
        } 
    }

    let tp = nearestT ? nearestT.getWorldPos() : playerPos; this.target = nearestT || state.player;
    const dx = tp.x - this.pos.x;
    const dy = tp.y - this.pos.y;
    const dSq = dx*dx + dy*dy;
    const d = Math.sqrt(dSq);
    const dirHeading = atan2(dy, dx);
    if (this.dummyDetectedTimer === 0) {
      this.rot = lerpAngle(this.rot, dirHeading, 0.12);
    }

    // Enemy Steering Behavior
    let currentMoveAngle = dirHeading;

    // Check if chunk is loaded for steering behavior
    const currentChunk = state.world.getChunk(floor(this.pos.x / (GRID_SIZE * CHUNK_SIZE)), floor(this.pos.y / (GRID_SIZE * CHUNK_SIZE)));
    if (!currentChunk) {
      this.steeringDirection = 0;
      this.steeringFrames = 0;
      this.steeringTarget = null;
      this.path = [];
      this.movingIntention = null;
    } else {
      // Check for dangerous tiles ahead
      const lookAheadDist = GRID_SIZE * 1.5;
      const lookAheadPos = p5.Vector.fromAngle(dirHeading).mult(lookAheadDist).add(this.pos);

      const isFrontDangerous = state.world.isTileDangerous(lookAheadPos.x, lookAheadPos.y);

      if (isFrontDangerous && this.steeringDirection === 0) {
        // Randomly decide to steer left or right
        this.steeringDirection = random() < 0.5 ? -1 : 1; // -1 for left, 1 for right
        this.steeringFrames = floor(random(60, 180)); // Steer for 1-3 seconds
        this.steeringTarget = null; // Clear steering target
      } else if (!isFrontDangerous && this.steeringDirection !== 0) {
        // If path is clear, reduce steering frames and potentially stop steering
        this.steeringFrames--;
        if (this.steeringFrames <= 0) {
          this.steeringDirection = 0;
          this.steeringTarget = null;
        }
      }

      if (this.steeringDirection !== 0) {
        // Apply steering: rotate the desired movement vector
        currentMoveAngle = dirHeading + (this.steeringDirection * HALF_PI * 0.5); // Steer 45 degrees
        targetMoveVec = p5.Vector.fromAngle(currentMoveAngle).mult(this.speed * speedMult);
        this.movingIntention = p5.Vector.fromAngle(currentMoveAngle).mult(this.size * 2).add(this.pos);
      } else {
        targetMoveVec = createVector(dx/d, dy/d).mult(this.speed * speedMult);
        this.movingIntention = p5.Vector.fromAngle(dirHeading).mult(this.size * 2).add(this.pos);
      }

      // Update path for debug visualization
      this.path.push(this.pos.copy());
      if (this.path.length > 30) this.path.shift();
    }

    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const neighbors = state.spatialHash.get(`${hgx+i},${hgy+j}`);
        if (neighbors) {
          for (const other of neighbors) {
            if (other === this || other.isDying) continue;
            const dx = this.pos.x - other.pos.x;
            const dy = this.pos.y - other.pos.y;
            const distSq = dx*dx + dy*dy;
            
            if (distSq > checkLimitSq) continue;
            
            const md = (this.size + other.size)*0.55;
            if (distSq < md*md && distSq > 0) {
              const d = Math.sqrt(distSq);
              this.moveWithCollisions(createVector(dx/d * 0.2, dy/d * 0.2));
            }
          }
        }
      }
    }
    

    


    let targetRadius = (this.target.size || 32) * 0.5;
    if (this.target instanceof AttachedTurret && this.target.config.actionType.includes('shield')) {
        targetRadius = this.target.config.actionConfig.shieldRadius || targetRadius;
    }

    // Check for o_dummy in sight range (debug behavior)
    const sightRange = 300; // Define a sight range for the dummy obstacle
    for (const chunk of state.world.chunks.values()) {
      for (const obstacle of chunk.blocks as Obstacle[]) {
        if (obstacle.type === 'o_dummy') {
          const obsPos = createVector(obstacle.gx * GRID_SIZE + GRID_SIZE / 2, obstacle.gy * GRID_SIZE + GRID_SIZE / 2);
          const dToDummy = dist(this.pos.x, this.pos.y, obsPos.x, obsPos.y);
          const lookAheadPos = createVector(this.pos.x + cos(this.rot) * GRID_SIZE, this.pos.y + sin(this.rot) * GRID_SIZE);
          // Check for collision with the full o_dummy block at the look-ahead position
          const obstacleRectX = obstacle.gx * GRID_SIZE;
          const obstacleRectY = obstacle.gy * GRID_SIZE;
          const obstacleRectWidth = GRID_SIZE;
          const obstacleRectHeight = GRID_SIZE;
          // Use a small radius for the lookAheadPos to represent the enemy's 'head'
          const lookAheadRadius = this.size * 0.25; 
          if (dToDummy < sightRange && checkCircleRectCollision(lookAheadPos.x, lookAheadPos.y, lookAheadRadius, obstacleRectX, obstacleRectY, obstacleRectWidth, obstacleRectHeight) && state.world.checkLOS(this.pos.x, this.pos.y, obsPos.x, obsPos.y)) {
            this.isDummyDetectedInLookAhead = true;
            if (this.dummyDetectedTimer === 0) {
              if (this.preferredSteeringDirection === 0) {
                this.preferredSteeringDirection = random() < 0.5 ? -1 : 1; // Randomly decide once
              }
              this.steeringDirection = this.preferredSteeringDirection;
            }
            this.dummyDetectedTimer = 15; // Reset timer to keep steering active
            break;
          }
        }
      }
    }

    if (this.dummyDetectedTimer > 0) {
      // Get target position for LOS check
      let targetWorldPos = this.target.getWorldPos ? this.target.getWorldPos() : this.target.pos;
      if (!targetWorldPos && this.target.gx !== undefined) { // Handle case where target is a grid object
        targetWorldPos = createVector(this.target.gx * GRID_SIZE + GRID_SIZE / 2, this.target.gy * GRID_SIZE + GRID_SIZE / 2);
      }

      // Only count down if no dummy is detected AND path to target is clear
      if (!this.isDummyDetectedInLookAhead && targetWorldPos && state.world.checkLOS(this.pos.x, this.pos.y, targetWorldPos.x, targetWorldPos.y)) {
        this.dummyDetectedTimer--; // Only count down if no dummy is detected in look-ahead
      }

      if (this.isDummyDetectedInLookAhead) {
        // Rotate based on preferredSteeringDirection until path is clear
        const targetRot = this.rot + (this.preferredSteeringDirection * HALF_PI * 0.05); // Target 4.5 degrees left/right
        this.rot = lerpAngle(this.rot, targetRot, 0.15); // Smooth rotation

        // Check if path is clear after rotation
        const steeredLookAheadPos = createVector(this.pos.x + cos(this.rot) * GRID_SIZE, this.pos.y + sin(this.rot) * GRID_SIZE);
        const isSteeredPathClear = !state.world.isTileDangerous(steeredLookAheadPos.x, steeredLookAheadPos.y);

        if (isSteeredPathClear) {
          // Move towards the lookAheadPos once path is clear
          targetMoveVec = createVector(cos(this.rot), sin(this.rot)).mult(this.speed * speedMult);
          shouldMove = true; // Ensure enemy moves
        } else {
          // If still blocked after rotation, just rotate in place
          targetMoveVec = createVector(0, 0);
          shouldMove = false;
        }
      } else {
        // If dummy is NOT detected, move straight in current heading direction
        targetMoveVec = createVector(cos(this.rot), sin(this.rot)).mult(this.speed * speedMult);
        shouldMove = true;
      }
    } else {
      // Original Steering behavior
      const lookAheadDist = GRID_SIZE; // Look 1 tile ahead
      const lookAheadPos = createVector(this.pos.x + cos(this.rot) * lookAheadDist, this.pos.y + sin(this.rot) * lookAheadDist);
      const isFrontDangerous = state.world.isTileDangerous(lookAheadPos.x, lookAheadPos.y);

      if (isFrontDangerous && this.steeringDirection === 0) {
        // Decide to steer left or right (using preferred direction if set)
          if (this.preferredSteeringDirection === 0) {
            this.preferredSteeringDirection = random() < 0.5 ? -1 : 1; // Randomly decide once
          }
          this.steeringDirection = this.preferredSteeringDirection;
        this.steeringTarget = this.target; // Store current target to check LOS later
      } else if (!isFrontDangerous && this.steeringDirection !== 0) {
        // If path is clear AND we can see the original target, stop steering
        if (this.steeringTarget && state.world.checkLOS(this.pos.x, this.pos.y, this.steeringTarget.pos.x, this.steeringTarget.pos.y)) {
          this.steeringDirection = 0; // Reset steering
          this.steeringTarget = null;
        }
      }

      if (this.steeringDirection !== 0) {
        // Apply steering force
        const steerAngle = this.rot + (this.steeringDirection * HALF_PI * 0.05); // Steer 4.5 degrees left/right
        targetMoveVec = createVector(cos(steerAngle), sin(steerAngle)).mult(this.speed * speedMult);
        shouldMove = true; // Ensure enemy moves while steering
      }
    }

    const inMeleeRange = d < (this.size * 0.5 + targetRadius + 15);
    const canShootInRange = this.actionType.includes('shoot') && d < this.actionConfig.shootRange && state.world.checkLOS(this.pos.x, this.pos.y, tp.x, tp.y);

    if (canShootInRange && this.dummyDetectedTimer === 0) shouldMove = false;

    if (this.steeringDirection === 0 && this.dummyDetectedTimer === 0) {
        targetMoveVec = createVector(dx/d, dy/d).mult(this.speed * speedMult);
    }

    if (shouldMove && this.actionType.includes('moveDefault')) {
      let rThresh = this.actionType.includes('shoot') ? this.actionConfig.shootRange * 0.75 : this.size * 0.6;
      if (d > rThresh || this.steeringDirection !== 0) {
        this.moveWithCollisions(targetMoveVec);
      }
    }

    if (this.actionType.includes('meleeAttack') && inMeleeRange && this.meleeCooldown <= 0) { 
        this.attackAnimDuration = Math.max(20, this.actionConfig.attackFireRate || 30);
        this.attackAnimTimer = this.attackAnimDuration;
        this.meleeCooldown = this.actionConfig.attackFireRate;
    }
    if (this.meleeCooldown > 0) this.meleeCooldown--;

    if (this.actionType.includes('shoot') && canShootInRange && this.shootCooldown <= 0) { 
        state.enemyBullets.push(new Bullet(this.pos.x, this.pos.y, tp.x, tp.y, 'b_enemy_basic', 'core')); 
        state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, dirHeading, 22, 6, color(200, 100, 255))); 
        this.shootCooldown = this.actionConfig.shootFireRate; 
    }
    if (this.shootCooldown > 0) this.shootCooldown--;
    
    if (this.actionType.includes('spawnEnemy') && this.actionConfig.spawnTriggerOnHealthRatio) {
      let ratio = this.health / this.maxHealth;
      for (let t of this.actionConfig.spawnTriggerOnHealthRatio) {
        if (t > 0 && ratio <= t && !this.triggeredSpawnThresholds.has(t)) {
          this.triggeredSpawnThresholds.add(t);
          this.performSummon();
        }
      }
    }
  }

  performMeleeStrike() {
    if (!this.target || this.isDying) return;

    // ENEMY DAMAGE REFINEMENT: Ignore damage to inactive turrets
    if (this.target instanceof AttachedTurret) {
        const isRetracted = !state.isStationary && !this.target.config.isActiveWhileMoving;
        const isInactive = isRetracted || this.target.isWaterlogged || this.target.isFrosted;
        if (isInactive) return;
    }

    const strikePos = p5.Vector.add(this.pos, this.attackOffset);
    const tc = this.target.getWorldPos ? this.target.getWorldPos() : (this.target.pos || null);
    if (!tc) return;

    let targetRadius = (this.target.size || 32) * 0.5;
    if (this.target instanceof AttachedTurret && this.target.config.actionType.includes('shield')) {
        targetRadius = this.target.config.actionConfig.shieldRadius || targetRadius;
    }

    const distToStrike = dist(strikePos.x, strikePos.y, tc.x, tc.y);
    const strikeRange = this.size * 0.5 + targetRadius + 20;

    if (distToStrike < strikeRange) {
        this.target.takeDamage(this.actionConfig.damage);
        if (frameCount % 5 === 0) state.vfx.push(new HitSpark(strikePos.x, strikePos.y, [255, 50, 50]));
        
        if (this.type === 'e_giant') {
            state.cameraShake = Math.max(state.cameraShake, 10);
            state.cameraShakeFalloff = 0.9;
            state.vfx.push(new Explosion(strikePos.x, strikePos.y, this.size * 2, color(255, 100, 0)));
        }
    }
  }

  applyObstacleRepulsion() {
    const gx = floor(this.pos.x / GRID_SIZE);
    const gy = floor(this.pos.y / GRID_SIZE);
    const forceRange = GRID_SIZE * 0.9;
    const forceRangeSq = forceRange * forceRange;
    for (let i = gx - 1; i <= gx + 1; i++) {
      for (let j = gy - 1; j <= gy + 1; j++) {
        if (state.world.isBlockAt(i * GRID_SIZE + 1, j * GRID_SIZE + 1)) {
          const bx = i * GRID_SIZE + GRID_SIZE/2;
          const by = j * GRID_SIZE + GRID_SIZE/2;
          const dx = this.pos.x - bx;
          const dy = this.pos.y - by;
          const dSq = dx*dx + dy*dy;
          if (dSq < forceRangeSq) {
            const d = Math.sqrt(dSq);
            const force = 4.0 * (1 - d/forceRange);
            this.pos.x += dx/d * force;
            this.pos.y += dy/d * force;
          }
        }
      }
    }
  }

  moveWithCollisions(move: any) {
    let nx = this.pos.x + move.x; if (!state.world.checkCollision(nx, this.pos.y, this.size/2.2) && !this.checkEntityCollisions(nx, this.pos.y)) this.pos.x = nx;
    let ny = this.pos.y + move.y; if (!state.world.checkCollision(this.pos.x, ny, this.size/2.2) && !this.checkEntityCollisions(this.pos.x, ny)) this.pos.y = ny;
  }
  checkEntityCollisions(x: number, y: number) { 
    const dSqToPlayer = (x - state.player.pos.x)**2 + (y - state.player.pos.y)**2;
    const minDSqToPlayer = ((this.size + state.player.size)*0.5)**2;
    if (dSqToPlayer < minDSqToPlayer) return true; 

    // ENEMY COLLISION REFINEMENT: Only collide with ACTIVE turrets
    for (let t of state.player.attachments) {
      if (t.config.collideWithEnemy !== false) {
        const isRetracted = !state.isStationary && !t.config.isActiveWhileMoving;
        const isInactive = isRetracted || t.isWaterlogged || t.isFrosted;
        if (isInactive) continue;

        const twPos = t.getWorldPos();
        let targetRadius = t.size * 0.5;
        if (t.config.actionType.includes('shield')) {
            targetRadius = t.config.actionConfig.shieldRadius || targetRadius;
        }
        const dSq = (x - twPos.x)**2 + (y - twPos.y)**2;
        if (dSq < ((this.size * 0.5 + targetRadius) * 0.95)**2) return true;
      }
    }
    return false; 
  }
  
  performSummon() {
    if (!this.actionConfig.enemyTypeToSpawn) return;
    let type = random(this.actionConfig.enemyTypeToSpawn);
    let count = floor(this.actionConfig.spawnBudget / enemyTypes[type].cost);
    for(let i=0; i<count; i++) {
      let limit = 15;
      while (limit > 0) {
        limit--;
        let ang = random(TWO_PI);
        let r = random(25, this.actionConfig.spawnRadius);
        let sx = this.pos.x + cos(ang)*r;
        let sy = this.pos.y + sin(ang)*r;
        
        if (isLegibleSpot(sx, sy) && !state.world.checkCollision(sx, sy, enemyTypes[type].size/2.2)) {
          state.enemies.push(new Enemy(sx, sy, type));
          break;
        }
      }
    }
  }

  display() { 
    const margin = 100;
    const left = state.cameraPos.x - width/2 - margin;
    const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin;
    const bottom = state.cameraPos.y + height/2 + margin;
    if (this.pos.x < left || this.pos.x > right || this.pos.y < top || this.pos.y > bottom) return;
    drawEnemy(this);
  }
  takeDamage(dmg: number) { 
    if (this.isDying) return false;
    this.health -= dmg; 
    this.flash = 6; 

    const lastTick = state.lastDamageTick.get(this.uid) || 0;
    const pending = state.pendingDamage.get(this.uid) || 0;

    // no more delayed damage numbers
        state.vfx.push(new DamageNumberVFX(this.pos.x, this.pos.y - this.size * 0.5, dmg, [255, 255, 255]));

    if (this.health <= 0) { 
      this.health = 0;
      this.isDying = true;
      state.totalEnemiesDead++;
      state.killsByType[this.type] = (state.killsByType[this.type] || 0) + 1;
      spawnLootAt(this.pos.x, this.pos.y, this.type, this.config.lootConfigOnDeath);
      if (this.actionType.includes('spawnEnemy') && this.actionConfig.spawnTriggerOnHealthRatio) {
        if (this.actionConfig.spawnTriggerOnHealthRatio.includes(0)) {
           this.performSummon();
        }
      }
      if (this.type === 'e_giant') {
        state.vfx.push(new GiantDeathVFX(this.pos.x, this.pos.y, this.size, this.col));
        this.markedForDespawn = true; 
      } else {
        state.vfx.push(new BugSplatVFX(this.pos.x, this.pos.y, this.size, this.col)); 
        drawPersistentDeathVisual(this.pos.x, this.pos.y, this.size, [red(color(this.col)), green(color(this.col)), blue(color(this.col))]); 
        this.markedForDespawn = true;
      }
      return true; 
    } 
    return false; 
  }
}
