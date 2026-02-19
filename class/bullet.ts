
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { bulletTypes } from '../balanceBullets';
import { Explosion, MuzzleFlash, HitSpark } from '../vfx';
import { GroundFeature } from './groundFeature';
import { drawBullet } from '../visualBullets';

declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const floor: any;
declare const color: any;
declare const random: any;
declare const cos: any;
declare const sin: any;
declare const TWO_PI: any;
declare const lerp: any;
declare const width: any;
declare const height: any;

export class Bullet {
  pos: any; prevPos: any; vel: any; col: any; dmg: number; targetType: string; life: number; config: any; typeKey: string;
  damageTargets: string[] = [];
  targetPos: any | null = null;
  currentPierceChance: number = 0;
  
  // Track unique hits for piercing consistency
  hitTargets: Set<string> = new Set();

  constructor(x: number, y: number, tx: number, ty: number, typeKey: string, targetType: string) {
    this.typeKey = typeKey; this.config = bulletTypes[typeKey] || bulletTypes.b_player;
    this.damageTargets = this.config.damageTargets || [];
    this.pos = createVector(x, y); this.prevPos = this.pos.copy();
    
    this.col = this.config.bulletColor; this.dmg = this.config.bulletDamage; this.targetType = targetType; this.life = this.config.bulletLifeTime;
    this.currentPierceChance = this.config.initialPierceChance ?? 0;

    if (this.config.highArcConfig) {
       this.life = this.config.highArcConfig.arcTravelTime;
       this.targetPos = createVector(tx, ty);
       // Calculate required velocity to reach target in exactly arcTravelTime frames
       let dx = tx - x; let dy = ty - y;
       this.vel = createVector(dx / this.life, dy / this.life);
    } else {
       let dx = tx - x; let dy = ty - y; let mag = Math.sqrt(dx * dx + dy * dy);
       this.vel = mag < 0.1 ? createVector(0,0) : createVector(dx / mag * this.config.bulletSpeed, dy / mag * this.config.bulletSpeed);
    }
  }

  update() {
    this.prevPos.set(this.pos); this.pos.add(this.vel); this.life--;
    
    // BALLISTIC PROJECTILE LOGIC: Ignore all collisions while flying high
    if (this.config.highArcConfig) {
        if (this.life <= 0) {
           this.pos.set(this.targetPos);
           this.explode();
           this.spawnFeatures(null);
        }
        return; 
    }

    if (this.targetPos && !this.config.highArcConfig) {
       let dSq = (this.pos.x - this.targetPos.x)**2 + (this.pos.y - this.targetPos.y)**2;
       let mag = this.vel.mag();
       if (dSq < (mag + 2)**2) {
          this.pos.set(this.targetPos);
          this.vel.mult(0);
          this.targetPos = null;
          if (this.config.aoeConfig?.isAoe && this.config.aoeConfig.dealAoeAtTarget) this.explode();
          if (this.config.stopAtTarget) { this.life = this.config.bulletLifeTime; }
       }
    }

    if (this.config.spawnGroundFeatureAfterLifetime && this.life <= 0) {
       this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
    }

    if (this.config.spawnGroundFeaturePerFrame > 0 && state.frames % this.config.spawnGroundFeaturePerFrame === 0) {
       this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
    }
    
    if (this.damageTargets.includes('icecube')) {
      for (let a of state.player.attachments) {
        if (a.isFrosted && !this.hitTargets.has(a.uid)) {
          const awPos = a.getWorldPos();
          const dSq = (this.pos.x - awPos.x)**2 + (this.pos.y - awPos.y)**2;
          const minDist = a.size / 2 + 6;
          if (dSq < minDist*minDist) {
            this.hitTargets.add(a.uid);
            a.takeDamage(this.dmg);
            this.handleCollision();
            if (this.life <= 0) return;
          }
        }
      }
    }

    if (this.damageTargets.includes('obstacle')) {
      let gx = floor(this.pos.x / GRID_SIZE); let gy = floor(this.pos.y / GRID_SIZE);
      const blockKey = `${gx},${gy}`;
      if (!this.hitTargets.has(blockKey)) {
        let chunk = state.world.getChunk(floor(gx/CHUNK_SIZE), floor(gy/CHUNK_SIZE));
        let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
        if (block) {
          this.hitTargets.add(blockKey);
          block.takeDamage(this.dmg * (this.config.obstacleDamageMultiplier || 1));
          
          // Trigger sparking Hit VFX on obstacle impact
          const hitVfx = this.config.bulletHitVfx || 'v_hit_spark';
          if (hitVfx === 'v_hit_spark') {
             state.vfx.push(new HitSpark(this.pos.x, this.pos.y, this.col));
          }

          if (this.config.bounceConfig) {
             // Calculate bounce
             const prevGX = floor(this.prevPos.x / GRID_SIZE);
             const prevGY = floor(this.prevPos.y / GRID_SIZE);
             if (prevGX !== gx) this.vel.x *= -1;
             if (prevGY !== gy) this.vel.y *= -1;
             this.dmg = Math.max(0, this.dmg - (this.config.bounceConfig.damageDecayPerBounce || 0));
          } else {
             this.handleCollision(true);
          }
          if (this.life <= 0) return;
        }
      }
    } else {
        if (state.world.isBlockAt(this.pos.x, this.pos.y)) {
           this.handleCollision();
           if (this.life <= 0) return;
        }
    }

    if (this.damageTargets.includes('enemy')) {
      const cs = state.spatialHashCellSize;
      const hgx = floor(this.pos.x / cs);
      const hgy = floor(this.pos.y / cs);
      
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          const cell = state.spatialHash.get(`${hgx+i},${hgy+j}`);
          if (cell) {
            for (const e of cell) {
              if (e.health <= 0 || e.isDying || this.hitTargets.has(e.uid)) continue;
              const dSq = (this.pos.x - e.pos.x)**2 + (this.pos.y - e.pos.y)**2;
              const minDist = e.size / 2;
              if (dSq < minDist*minDist) {
                this.hitTargets.add(e.uid);
                this.applyBulletConditions(e);
                
                // Direct Knockback
                if (this.config.knockBackStrength) {
                   const dir = p5.Vector.sub(e.pos, this.prevPos).normalize();
                   const strength = this.config.knockBackStrength / Math.max(0.2, (e.size / 30));
                   e.kbVel.add(dir.mult(strength));
                   if (this.config.knockBackDuration) {
                      e.kbTimer = Math.max(e.kbTimer || 0, this.config.knockBackDuration);
                   }
                }

                // Satisfying Hit VFX
                const hitVfx = this.config.bulletHitVfx || 'v_hit_spark';
                if (hitVfx === 'v_hit_spark') {
                   state.vfx.push(new HitSpark(this.pos.x, this.pos.y, this.col));
                }

                e.takeDamage(this.dmg); 
                this.handleCollision(); // Process pierce and lifetime
                if (this.life <= 0) return;
              }
            }
          }
        }
      }
    }

    if (this.damageTargets.includes('turret')) {
      for (let a of state.player.attachments) {
        if (!this.hitTargets.has(a.uid)) {
          const awPos = a.getWorldPos();
          const dSq = (this.pos.x - awPos.x)**2 + (this.pos.y - awPos.y)**2;
          const minDist = a.size / 2 + 4;
          if (dSq < minDist*minDist) {
            this.hitTargets.add(a.uid);
            a.takeDamage(this.dmg); 
            this.handleCollision();
            if (this.life <= 0) return;
          }
        }
      }
    }

    if (this.damageTargets.includes('player') && !this.hitTargets.has('player')) {
      const pdSq = (this.pos.x - state.player.pos.x)**2 + (this.pos.y - state.player.pos.y)**2;
      const pMinDist = state.player.size / 2;
      if (pdSq < pMinDist*pMinDist) {
        this.hitTargets.add('player');
        state.player.takeDamage(this.dmg); 
        this.handleCollision();
        if (this.life <= 0) return;
      }
    }

    if (this.life <= 0 && this.config.aoeConfig?.isAoe && (this.config.aoeConfig.dealAoeAfterLifetime || this.config.bulletLifeTime === 1)) { 
        this.explode(); 
        this.spawnFeatures(null);
    }
  }

  handleCollision(isObstacle: boolean = false) {
    const aoe = this.config.aoeConfig;
    const shouldExplodeEveryTime = aoe?.dealAoeOnEveryHit;
    
    // PIERCE LOGIC: Bullet only dies if pierce roll fails
    let willDie = true;
    if (random() < this.currentPierceChance) {
        this.currentPierceChance -= (this.config.pierceChanceDecayPerHit || 0);
        willDie = false;
    }

    if (aoe?.isAoe) {
       const isEligible = isObstacle ? aoe.dealAoeOnObstacle : true;
       if (isEligible) {
          // Explode either if specifically configured to always explode, or if this is the final impact
          if (shouldExplodeEveryTime || willDie) {
             this.explode();
          }
       }
    }

    this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
    if (willDie) this.life = 0;
  }

  applyBulletConditions(target: any) {
    if (!target.applyCondition) return;
    if (this.config.appliedConditions) {
      for (const cond of this.config.appliedConditions) {
        target.applyCondition(cond.type, cond.duration);
      }
    }
    if (this.config.stunDuration > 0) target.applyCondition('c_stun', this.config.stunDuration);
    if (this.config.slowDuration > 0) target.applyCondition('c_chilled', this.config.slowDuration);
  }
  spawnFeatures(keys: string[] | null) {
    const list = (keys && keys.length > 0) ? keys : (this.config.spawnGroundFeatureKeys || []);
    if (list.length === 0) return;
    const count = this.config.spawnGroundFeatureCount || 1;

    for (let i = 0; i < count; i++) {
        const gfKey = list[floor(random(list.length))];
        let sx = this.pos.x; let sy = this.pos.y;
        if (this.config.spawnGroundFeatureInRadius > 0) { 
            let ang = random(TWO_PI); 
            let r = random(this.config.spawnGroundFeatureInRadius); 
            sx += cos(ang)*r; sy += sin(ang)*r; 
        }
        state.groundFeatures.push(new GroundFeature(sx, sy, gfKey));
    }
  }

  getLerpedAoeDamage(d: number, aoe: any) {
    const radii = aoe.aoeRadiusGradient;
    const damages = aoe.aoeDamageGradient;
    const maxR = radii[radii.length - 1];
    
    if (d > maxR) return 0;
    if (radii.length === 1) return d <= radii[0] ? damages[0] : 0;
    if (d <= radii[0]) return damages[0];

    for (let i = 0; i < radii.length - 1; i++) {
      if (d >= radii[i] && d <= radii[i+1]) {
        const factor = (d - radii[i]) / (radii[i+1] - radii[i]);
        return lerp(damages[i], damages[i+1], factor);
      }
    }
    return 0;
  }

  explode() {
    if (this.config.cameraShakeOnDeath) {
      const [min, max, falloff] = this.config.cameraShakeOnDeath;
      state.cameraShake = Math.max(state.cameraShake, random(min, max));
      if (falloff !== undefined) {
        state.cameraShakeFalloff = falloff;
      }
    }

    const aoe = this.config.aoeConfig; if (!aoe) return;
    const radii = aoe.aoeRadiusGradient;
    const maxR = radii[radii.length - 1] || 10;
    state.vfx.push(new Explosion(this.pos.x, this.pos.y, maxR*2, color(this.col)));
    
    if (this.damageTargets.includes('enemy')) {
      for (let e of state.enemies) {
        let dSq = (this.pos.x - e.pos.x)**2 + (this.pos.y - e.pos.y)**2;
        if (dSq < maxR*maxR) {
          const d = Math.sqrt(dSq);
          
          // AOE Knockback
          if (aoe.aoeKnockbackStrength) {
             const dir = p5.Vector.sub(e.pos, this.pos).normalize();
             const strength = (aoe.aoeKnockbackStrength * (1 - d/maxR)) / Math.max(0.2, (e.size / 30));
             e.kbVel.add(dir.mult(strength));
             if (this.config.knockBackDuration) {
                e.kbTimer = Math.max(e.kbTimer || 0, this.config.knockBackDuration);
             }
          }

          const lerpDmg = this.getLerpedAoeDamage(d, aoe);
          if (lerpDmg > 0) {
            this.applyBulletConditions(e);
            e.takeDamage(lerpDmg);
          }
        }
      }
    }

    if (this.damageTargets.includes('player')) {
      let pdSq = (this.pos.x - state.player.pos.x)**2 + (this.pos.y - state.player.pos.y)**2;
      if (pdSq < maxR*maxR) {
        const d = Math.sqrt(pdSq);
        const lerpDmg = this.getLerpedAoeDamage(d, aoe);
        if (lerpDmg > 0) state.player.takeDamage(lerpDmg);
      }
    }

    if (this.damageTargets.includes('turret')) {
      for (let a of state.player.attachments) {
        const awPos = a.getWorldPos();
        let adSq = (this.pos.x - awPos.x)**2 + (this.pos.y - awPos.y)**2;
        if (adSq < maxR*maxR) {
          const d = Math.sqrt(adSq);
          const lerpDmg = this.getLerpedAoeDamage(d, aoe);
          if (lerpDmg !== 0) a.takeDamage(lerpDmg);
        }
      }
    }

    if (this.damageTargets.includes('icecube')) {
       for (let a of state.player.attachments) {
        if (a.isFrosted) {
          const awPos = a.getWorldPos();
          let adSq = (this.pos.x - awPos.x)**2 + (this.pos.y - awPos.y)**2;
          if (adSq < maxR*maxR) {
            const d = Math.sqrt(adSq);
            const lerpDmg = this.getLerpedAoeDamage(d, aoe);
            if (lerpDmg > 0) a.takeDamage(lerpDmg);
          }
        }
      }
    }
    
    if (this.damageTargets.includes('obstacle')) {
      let gxStart = floor((this.pos.x - maxR)/GRID_SIZE); let gxEnd = floor((this.pos.x + maxR)/GRID_SIZE);
      let gyStart = floor((this.pos.y - maxR)/GRID_SIZE); let gyEnd = floor((this.pos.y + maxR)/GRID_SIZE);
      for(let gx=gxStart; gx<=gxEnd; gx++) for(let gy=gyStart; gy<=gyEnd; gy++) {
        let cx=floor(gx/CHUNK_SIZE); let cy=floor(gy/CHUNK_SIZE);
        let chunk = state.world.getChunk(cx, cy);
        let block = chunk?.blockMap.get(`${gx},${gy}`);
        if (block && !block.isMined) { 
          let bcx = block.pos.x + GRID_SIZE/2;
          let bcy = block.pos.y + GRID_SIZE/2;
          let dSq = (this.pos.x - bcx)**2 + (this.pos.y - bcy)**2;
          if (dSq < maxR*maxR) {
            const d = Math.sqrt(dSq);
            const lerpDmg = this.getLerpedAoeDamage(d, aoe);
            if (lerpDmg > 0) block.takeDamage(lerpDmg * (aoe.aoeObstacleDamageMultiplier || 1)); 
          }
        }
      }
    }
  }
  display() {
    const margin = 50;
    const screenX = this.pos.x - (state.cameraPos.x - width/2);
    const screenY = this.pos.y - (state.cameraPos.y - height/2);
    if (screenX < -margin || screenX > width + margin || screenY < -margin || screenY > height + margin) return;
    drawBullet(this);
  }
}
