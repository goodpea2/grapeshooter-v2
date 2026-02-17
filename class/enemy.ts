
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE, EnemyCollideRadiusCheck } from '../constants';
import { enemyTypes } from '../balanceEnemies';
import { conditionTypes } from '../balanceConditions';
import { liquidTypes } from '../balanceLiquids';
import { BugSplatVFX, GiantDeathVFX, HitSpark, LiquidTrailVFX, MuzzleFlash, ConditionVFX, drawPersistentDeathVisual } from '../vfx';
import { AttachedTurret } from './attachedTurret';
import { Bullet } from './bullet';
import { lerpAngle } from './utils';
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

export class Enemy {
  pos: any; type: string; config: any; health: number; maxHealth: number; speed: number; size: number; col: any; target: any = null; flash: number = 0; rot: number; actionType: string[]; actionConfig: any;
  meleeCooldown: number = 0; shootCooldown: number = 0; swarmParticles: any[] = []; markedForDespawn: boolean = false;
  conditions: Map<string, number> = new Map();
  conditionData: Map<string, any> = new Map();
  prevPos: any; isDying: boolean = false;
  triggeredSpawnThresholds: Set<number> = new Set(); // Tracks already fired health ratios

  constructor(x: number, y: number, typeKey: string) {
    this.pos = createVector(x, y); this.prevPos = this.pos.copy(); this.type = typeKey; this.config = enemyTypes[typeKey]; this.health = this.config.health; this.maxHealth = this.health; this.speed = this.config.speed; this.size = this.config.size; this.col = this.config.col; this.rot = random(TWO_PI); this.actionType = this.config.actionType; this.actionConfig = this.config.actionConfig;
    if (this.type === 'e_swarm') for(let i=0; i<10; i++) this.swarmParticles.push({ offset: p5.Vector.random2D().mult(random(12, 24)), size: random(5, 9), phase: random(TWO_PI) });
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

    if (this.conditions.has('c_stun')) return;

    // Use spatial hash for enemy avoidance
    const cs = state.spatialHashCellSize;
    const hgx = floor(this.pos.x / cs);
    const hgy = floor(this.pos.y / cs);
    const checkLimitSq = EnemyCollideRadiusCheck * EnemyCollideRadiusCheck;
    
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const neighbors = state.spatialHash.get(`${hgx+i},${hgy+j}`);
        if (neighbors) {
          for (const other of neighbors) {
            if (other === this || other.isDying) continue;
            const dx = this.pos.x - other.pos.x;
            const dy = this.pos.y - other.pos.y;
            const distSq = dx*dx + dy*dy;
            
            // Only process if within the constant tuning radius
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
    
    let nearestT = null; let minDistTSq = 450*450;
    if (state.isStationary) {
      for (let t of turrets) if (t.config.collideWithEnemy !== false) { 
        const twPos = t.getWorldPos();
        const dSq = (this.pos.x - twPos.x)**2 + (this.pos.y - twPos.y)**2;
        if (dSq < minDistTSq && state.world.checkLOS(this.pos.x, this.pos.y, twPos.x, twPos.y)) { 
          nearestT = t; minDistTSq = dSq; 
        } 
      }
    }
    
    let tp = nearestT ? nearestT.getWorldPos() : playerPos; this.target = nearestT || state.player;
    const dx = tp.x - this.pos.x;
    const dy = tp.y - this.pos.y;
    const dSq = dx*dx + dy*dy;
    const d = Math.sqrt(dSq);
    const dirHeading = atan2(dy, dx);
    this.rot = lerpAngle(this.rot, dirHeading, 0.12);

    if (this.actionType.includes('moveDefault') && this.meleeCooldown <= 0) {
      let rThresh = this.actionType.includes('shoot') ? this.actionConfig.shootRange * 0.75 : this.size * 0.6;
      if (d > rThresh) {
        this.moveWithCollisions(createVector(dx/d, dy/d).mult(this.speed * speedMult));
      }
    }
    if (this.actionType.includes('meleeAttack') && d < (this.size + (this.target.size || 32))*0.5 + 10 && this.meleeCooldown <= 0) { this.target.takeDamage(this.actionConfig.damage); this.meleeCooldown = this.actionConfig.attackFireRate; if (frameCount % 5 === 0) state.vfx.push(new HitSpark(this.pos.x, this.pos.y, [255, 50, 50])); }
    if (this.meleeCooldown > 0) this.meleeCooldown--;
    if (this.actionType.includes('shoot') && d < this.actionConfig.shootRange && this.shootCooldown <= 0 && state.world.checkLOS(this.pos.x, this.pos.y, tp.x, tp.y)) { state.enemyBullets.push(new Bullet(this.pos.x, this.pos.y, tp.x, tp.y, 'b_enemy_basic', 'core')); state.vfx.push(new MuzzleFlash(this.pos.x, this.pos.y, dirHeading, 22, 6, color(200, 100, 255))); this.shootCooldown = this.actionConfig.shootFireRate; }
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
    if (state.isStationary) {
      for (let t of state.player.attachments) if (t.config.collideWithEnemy !== false) {
        const twPos = t.getWorldPos();
        const dSq = (x - twPos.x)**2 + (y - twPos.y)**2;
        if (dSq < ((this.size + t.size)*0.5)**2) return true;
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
    // Frustum culling using reliable AABB check
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
    if (this.health <= 0) { 
      this.health = 0;
      this.isDying = true;
      state.totalEnemiesDead++;
      
      // Track kill for Game Over stats
      state.killsByType[this.type] = (state.killsByType[this.type] || 0) + 1;
      
      // Spawn loot based on enemy type config
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
