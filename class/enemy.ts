
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE, EnemyCollideRadiusCheck } from '../constants';
import { enemyTypes } from '../balanceEnemies';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { BugSplatVFX, GiantDeathVFX, HitSpark, LiquidTrailVFX, MuzzleFlash, ConditionVFX, drawPersistentDeathVisual, Explosion, DamageNumberVFX } from '../vfx/index';
import { AttachedTurret } from './attachedTurret';
import { WorldTurret } from './worldTurret';
import { Bullet } from './bullet';
import { GroundFeature } from './groundFeature';
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
declare const radians: any;
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
  flashType: 'damage' | 'heal' = 'damage';
  meleeCooldown: number = 0; shootCooldown: number = 0; swarmParticles: any[] = []; markedForDespawn: boolean = false;
  actionSteps: Map<string, number> = new Map();
  conditions: Map<string, number> = new Map();
  conditionData: Map<string, any> = new Map();
  prevPos: any; isDying: boolean = false;
  triggeredSpawnThresholds: Set<number> = new Set(); // Tracks already fired health ratios
  kbVel: any; // Knockback velocity
  kbTimer: number = 0; // Knockback duration (interrupts movement)
  isFlying: boolean = false;
  stealSunTarget: any = null;
  stealCooldown: number = 0;
  lastTargetScanFrame: number = -100;

  // Attack Animation State
  attackAnimTimer: number = 0;
  attackAnimDuration: number = 0;
  attackOffset: any;

  constructor(x: number, y: number, typeKey: string) {
    this.uid = Math.random().toString(36).substr(2, 9);
    this.pos = createVector(x, y); this.prevPos = this.pos.copy(); this.type = typeKey; this.config = enemyTypes[typeKey]; this.health = this.config.health; this.maxHealth = this.health; this.speed = this.config.speed; this.size = this.config.size; this.col = this.config.col; this.rot = random(TWO_PI); this.actionType = this.config.actionType; this.actionConfig = this.config.actionConfig;
    this.isFlying = !!this.config.isFlying;
    if (this.type === 'e_swarm') for(let i=0; i<10; i++) this.swarmParticles.push({ offset: p5.Vector.random2D().mult(random(12, 24)), size: random(5, 9), phase: random(TWO_PI) });
    this.kbVel = createVector(0, 0);
    this.attackOffset = createVector(0, 0);

    if (this.config.spawnWithCondition) {
      this.applyCondition(this.config.spawnWithCondition.condition, this.config.spawnWithCondition.duration);
    }
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

  update(playerPos: any, turrets: (AttachedTurret | WorldTurret)[]) {
    if (this.isDying) return;
    if (this.flash > 0) this.flash--;
    this.prevPos.set(this.pos);


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
          if (dmg > 0 && state.frames % (cfg.damageInterval || 6) === 0) this.takeDamage(dmg);
      } else if (cfg.damage && state.frames % cfg.damageInterval === 0) {
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
       if (lData.trailVfxInterval && state.frames % floor(lData.trailVfxInterval / 2) === 0 && actualVelSq > 0.01) state.trails.push(new LiquidTrailVFX(this.pos.x, this.pos.y, lData.enemyTrailVfx, atan2(this.pos.y - this.prevPos.y, this.pos.x - this.prevPos.x)));
       
       if (lData.liquidConfig.liquidDamageConfig?.enemy) {
         const cfg = lData.liquidConfig.liquidDamageConfig.enemy;
         const interval = cfg.damageInterval || 10;
         if (state.frames % interval === 0) {
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
    
    // TARGETING THROTTLE
    if (state.frames - this.lastTargetScanFrame >= 30 || state.needsTargetReScan || !this.target) {
      this.lastTargetScanFrame = state.frames;
      let nearestT = null; 
      let minDistTSq = 450*450;
      const isHypnotized = this.conditions.has('c_hypnotized');

      // Use spatial hash to find nearest target
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const key = `${hgx + i},${hgy + j}`;
          const cellEntities = state.spatialHash.get(key);
          if (cellEntities) {
            for (const ent of cellEntities) {
              if (ent === this || ent.isDying) continue;

              if (isHypnotized) {
                // Hypnotized enemies target other enemies
                if (!(ent instanceof Enemy) || ent.conditions.has('c_hypnotized')) continue;
              } else {
                // Normal enemies target hypnotized enemies, player, or turrets
                if (ent instanceof Enemy) {
                  if (!ent.conditions.has('c_hypnotized')) continue;
                } else {
                   // If it's a turret, check if it's active
                   if (ent.config && ent.config.collideWithEnemy === false) continue;
                   if (ent.isWaterlogged || ent.isFrosted) continue;
                   if (ent.config && !state.isStationary && !ent.config.isActiveWhileMoving && ent.getWorldPos) continue;
                }
              }

              const twPos = ent.getWorldPos ? ent.getWorldPos() : ent.pos;
              const dSq = (this.pos.x - twPos.x)**2 + (this.pos.y - twPos.y)**2;
              if (dSq < minDistTSq && state.world.checkLOS(this.pos.x, this.pos.y, twPos.x, twPos.y)) { 
                  nearestT = ent; minDistTSq = dSq; 
              }
            }
          }
        }
      }
      
      if (isHypnotized) {
        this.target = nearestT; // Might be null if no other enemies nearby
      } else {
        this.target = nearestT || state.player;
      }
    }

    if (!this.target) {
      // If no target, just wander or stay still (for hypnotized enemies with no targets)
      this.rot += random(-0.05, 0.05);
      return;
    }

    let tp = this.target.getWorldPos ? this.target.getWorldPos() : this.target.pos;

    if (this.actionType.includes('stealSun')) {
      if (!this.stealSunTarget || this.stealSunTarget.life <= 0) {
        let bestSun = null;
        let minDistSq = (this.actionConfig.stealRange || GRID_SIZE * 6)**2;
        
        // OPTIMIZATION: Only check loot in active chunks
        state.activeChunkKeys.forEach((key: string) => {
          const chunk = state.world.chunks.get(key);
          if (chunk) {
            for (let l of chunk.loot) {
              if (l.typeKey === 'sun') {
                const dSq = (this.pos.x - l.pos.x)**2 + (this.pos.y - l.pos.y)**2;
                if (dSq < minDistSq) {
                  minDistSq = dSq;
                  bestSun = l;
                }
              }
            }
          }
        });
        this.stealSunTarget = bestSun;
      }

    if (this.stealSunTarget) {
      tp = this.stealSunTarget.pos;
      const dSqToSun = (this.pos.x - tp.x)**2 + (this.pos.y - tp.y)**2;
      if (this.actionConfig.stealSunSpeedMultiplier) {
        speedMult *= this.actionConfig.stealSunSpeedMultiplier;
      }
      if (dSqToSun < (this.size * 0.5 + 20)**2) {
          if (this.stealSunTarget.life > 0) {
            // Steal it
            this.stealSunTarget.life = 0;
            this.takeDamage(-(this.actionConfig.healPerSun || 80));
          }
          this.stealSunTarget = null;
        }
      }
    }

    const dx = tp.x - this.pos.x;
    const dy = tp.y - this.pos.y;
    const dSq = dx*dx + dy*dy;
    const d = Math.sqrt(dSq);
    const dirHeading = atan2(dy, dx);
    this.rot = lerpAngle(this.rot, dirHeading, 0.12);

    // Enemy-Enemy collision avoidance
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const neighbors = state.spatialHash.get(`${hgx+i},${hgy+j}`);
        if (neighbors) {
          for (const other of neighbors) {
            if (other === this || other.isDying || !(other instanceof Enemy)) continue;
            const odx = this.pos.x - other.pos.x;
            const ody = this.pos.y - other.pos.y;
            const distSq = odx*odx + ody*ody;
            
            if (distSq > checkLimitSq) continue;
            
            const md = (this.size + other.size)*0.55;
            if (distSq < md*md && distSq > 0) {
              const od = Math.sqrt(distSq);
              this.moveWithCollisions(createVector(odx/od * 0.2, ody/od * 0.2));
            }
          }
        }
      }
    }

    let targetRadius = (this.target.size || 32) * 0.5;
    if (this.target instanceof AttachedTurret && this.target.config.actionType.includes('shield')) {
        targetRadius = this.target.config.actionConfig.shieldRadius || targetRadius;
    }

    const inMeleeRange = d < (this.size * 0.5 + targetRadius + 15);
    const isShooter = this.type === 'e_shooting' || this.type === 'e_shooting_giant';
    const canShootInRange = this.actionType.includes('shoot') && d < this.actionConfig.shootRange && (isShooter || state.world.checkLOS(this.pos.x, this.pos.y, tp.x, tp.y));

    if (canShootInRange) shouldMove = false;

    if (shouldMove && this.actionType.includes('moveDefault')) {
      let rThresh = this.actionType.includes('shoot') ? this.actionConfig.shootRange * 0.75 : this.size * 0.6;
      if (d > rThresh) {
        targetMoveVec = createVector(dx/d, dy/d).mult(this.speed * speedMult);
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
        const bType = this.actionConfig.bulletTypeKey || 'b_enemy_basic';
        let sa = dirHeading + (this.actionConfig.inaccuracy ? random(-radians(this.actionConfig.inaccuracy), radians(this.actionConfig.inaccuracy)) : 0);
        state.enemyBullets.push(new Bullet(this.pos.x, this.pos.y, this.pos.x + cos(sa)*500, this.pos.y + sin(sa)*500, bType, 'core')); 
        state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, sa, 22, 6, color(200, 100, 255))); 
        
        if (Array.isArray(this.actionConfig.shootFireRate)) {
          const step = this.actionSteps.get('shoot') || 0;
          this.shootCooldown = this.actionConfig.shootFireRate[step % this.actionConfig.shootFireRate.length];
          this.actionSteps.set('shoot', step + 1);
        } else {
          this.shootCooldown = this.actionConfig.shootFireRate; 
        }
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
    if (this.target instanceof AttachedTurret || this.target instanceof WorldTurret) {
        const isRetracted = !state.isStationary && !this.target.config.isActiveWhileMoving && (this.target instanceof AttachedTurret);
        const isInactive = isRetracted || this.target.isWaterlogged || this.target.isFrosted;
        if (isInactive) return;
    }

    // Hypnotized logic: can damage other enemies
    if (this.target instanceof Enemy) {
      const isHypnotized = this.conditions.has('c_hypnotized');
      const targetHypnotized = this.target.conditions.has('c_hypnotized');
      // Only damage if one is hypnotized and the other is not
      if (isHypnotized === targetHypnotized) return;
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
        if (state.frames % 5 === 0) state.vfx.push(new HitSpark(strikePos.x, strikePos.y, [255, 50, 50]));
        
        if (this.type === 'e_giant' || this.type === 'e_shooting_giant' || this.type === 'e_snowthrower_giant') {
            state.cameraShake = Math.max(state.cameraShake, 10);
            state.cameraShakeFalloff = 0.9;
            state.vfx.push(new Explosion(strikePos.x, strikePos.y, this.size * 2, color(255, 100, 0)));
        }
    }
  }

  applyObstacleRepulsion() {
    if (this.isFlying) return;
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
    if (this.isFlying) {
      this.pos.x += move.x;
      this.pos.y += move.y;
      return;
    }
    let nx = this.pos.x + move.x; if (!state.world.checkCollision(nx, this.pos.y, this.size/2.2) && !this.checkEntityCollisions(nx, this.pos.y)) this.pos.x = nx;
    let ny = this.pos.y + move.y; if (!state.world.checkCollision(this.pos.x, ny, this.size/2.2) && !this.checkEntityCollisions(this.pos.x, ny)) this.pos.y = ny;
  }
  checkEntityCollisions(x: number, y: number) { 
    const dSqToPlayer = (x - state.player.pos.x)**2 + (y - state.player.pos.y)**2;
    const minDSqToPlayer = ((this.size + state.player.size)*0.5)**2;
    if (dSqToPlayer < minDSqToPlayer) return true; 

    // ENEMY COLLISION REFINEMENT: Only collide with ACTIVE turrets
    const worldTurrets = state.world.getAllTurrets();
    const allTurrets = [...state.player.attachments, ...worldTurrets];
    
    for (let t of allTurrets) {
      if (t.config.collideWithEnemy !== false) {
        const isRetracted = !state.isStationary && !t.config.isActiveWhileMoving && (t instanceof AttachedTurret);
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

  performSpawnGroundFeature() {
    const gfKey = this.actionConfig.groundFeatureToSpawn;
    const count = this.actionConfig.spawnCount || 1;
    const radius = this.actionConfig.spawnRadius || 0;
    for (let i = 0; i < count; i++) {
      let sx = this.pos.x;
      let sy = this.pos.y;
      if (radius > 0) {
        const ang = random(TWO_PI);
        const r = random(radius);
        sx += cos(ang) * r;
        sy += sin(ang) * r;
      }
      state.groundFeatures.push(new GroundFeature(sx, sy, gfKey));
    }
  }

  performSpawnBullet() {
    const bType = this.actionConfig.bulletTypeToSpawn;
    const b = new Bullet(this.pos.x, this.pos.y, this.pos.x, this.pos.y, bType, 'core');
    b.life = 0;
    state.enemyBullets.push(b);
  }

  performSpawnObstacle() {
    const obsType = this.actionConfig.obstacleTypeToSpawn;
    const count = this.actionConfig.spawnCount || 1;
    const radius = this.actionConfig.spawnRadius || 0;
    for (let i = 0; i < count; i++) {
      let sx = this.pos.x;
      let sy = this.pos.y;
      if (radius > 0) {
        const ang = random(TWO_PI);
        const r = random(radius);
        sx += cos(ang) * r;
        sy += sin(ang) * r;
      }
      let gx = floor(sx / GRID_SIZE);
      let gy = floor(sy / GRID_SIZE);

      // Check for turrets
      const isTurretAt = (gx: number, gy: number) => {
        const attached = state.player.attachments.some((a: any) => {
          const wPos = a.getWorldPos();
          return floor(wPos.x / GRID_SIZE) === gx && floor(wPos.y / GRID_SIZE) === gy;
        });
        if (attached) return true;
        return !!state.world.getTurretAt(gx, gy);
      };

      if (isTurretAt(gx, gy)) {
        // Find nearest available spot
        let found = false;
        for (let r = 1; r < 10; r++) { // search up to 10 tiles away
          for (let dx = -r; dx <= r; dx++) {
            for (let dy = -r; dy <= r; dy++) {
              if (Math.abs(dx) !== r && Math.abs(dy) !== r) continue;
              let ngx = gx + dx;
              let ngy = gy + dy;
              if (!isTurretAt(ngx, ngy)) {
                gx = ngx;
                gy = ngy;
                found = true;
                break;
              }
            }
            if (found) break;
          }
          if (found) break;
        }
      }
      state.world.setBlock(gx, gy, obsType);
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
    this.flashType = dmg < 0 ? 'heal' : 'damage';

    if (dmg < 0 && !this.actionConfig.bypassMaxHealth) {
      this.health = Math.min(this.maxHealth, this.health);
    }

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
      if (this.actionType.includes('spawnGroundFeature') && this.actionConfig.spawnTriggerOnHealthRatio?.includes(0)) {
        this.performSpawnGroundFeature();
      }
      if (this.actionType.includes('spawnBullet') && this.actionConfig.spawnTriggerOnHealthRatio?.includes(0)) {
        this.performSpawnBullet();
      }
      if (this.actionType.includes('spawnObstacle') && this.actionConfig.spawnTriggerOnHealthRatio?.includes(0)) {
        this.performSpawnObstacle();
      }
      if (this.type === 'e_giant' || this.type === 'e_shooting_giant' || this.type === 'e_snowthrower_giant') {
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
