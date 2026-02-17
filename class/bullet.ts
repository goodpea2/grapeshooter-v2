
import { state } from '../state';
import { GRID_SIZE, CHUNK_SIZE } from '../constants';
import { bulletTypes } from '../balanceBullets';
import { Explosion, MuzzleFlash } from '../vfx';
import { GroundFeature } from './groundFeature';
import { drawBullet } from '../visualBullets';

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

  constructor(x: number, y: number, tx: number, ty: number, typeKey: string, targetType: string) {
    this.typeKey = typeKey; this.config = bulletTypes[typeKey] || bulletTypes.b_player;
    this.damageTargets = this.config.damageTargets || [];
    this.pos = createVector(x, y); this.prevPos = this.pos.copy();
    let dx = tx - x; let dy = ty - y; let mag = Math.sqrt(dx * dx + dy * dy);
    this.vel = mag < 0.1 ? createVector(0,0) : createVector(dx / mag * this.config.bulletSpeed, dy / mag * this.config.bulletSpeed);
    this.col = this.config.bulletColor; this.dmg = this.config.bulletDamage; this.targetType = targetType; this.life = this.config.bulletLifeTime;
  }
  update() {
    this.prevPos.set(this.pos); this.pos.add(this.vel); this.life--;
    
    if (this.targetPos) {
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

    if (this.config.spawnGroundFeaturePerFrame > 0 && state.frames % this.config.spawnGroundFeaturePerFrame === 0) this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
    
    if (this.damageTargets.includes('icecube')) {
      for (let a of state.player.attachments) {
        if (a.isFrosted) {
          const awPos = a.getWorldPos();
          const dSq = (this.pos.x - awPos.x)**2 + (this.pos.y - awPos.y)**2;
          const minDist = a.size / 2 + 6;
          if (dSq < minDist*minDist) {
            a.takeDamage(this.dmg);
            if (this.config.aoeConfig?.isAoe) this.explode();
            this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
            this.life = 0; return;
          }
        }
      }
    }

    if (this.damageTargets.includes('obstacle')) {
      let gx = floor(this.pos.x / GRID_SIZE); let gy = floor(this.pos.y / GRID_SIZE);
      let chunk = state.world.getChunk(floor(gx/CHUNK_SIZE), floor(gy/CHUNK_SIZE));
      let block = chunk?.blocks.find((b: any) => !b.isMined && b.gx === gx && b.gy === gy);
      if (block) {
        block.takeDamage(this.dmg * (this.config.obstacleDamageMultiplier || 1));
        if (this.config.aoeConfig?.isAoe && this.config.aoeConfig.dealAoeOnObstacle) this.explode();
        this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
        this.life = 0; return;
      }
    } else {
        if (state.world.isBlockAt(this.pos.x, this.pos.y)) {
           this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
           this.life = 0; return;
        }
    }

    if (this.damageTargets.includes('enemy')) {
      // Use spatial hash for bullet-enemy collision
      const cs = state.spatialHashCellSize;
      const hgx = floor(this.pos.x / cs);
      const hgy = floor(this.pos.y / cs);
      let hit = false;
      
      for (let i = -1; i <= 1 && !hit; i++) {
        for (let j = -1; j <= 1 && !hit; j++) {
          const targets = state.spatialHash.get(`${hgx+i},${hgy+j}`);
          if (targets) {
            for (const e of targets) {
              if (e.health <= 0 || e.isDying) continue;
              const dSq = (this.pos.x - e.pos.x)**2 + (this.pos.y - e.pos.y)**2;
              const minDist = e.size / 2;
              if (dSq < minDist*minDist) {
                this.applyBulletConditions(e);
                e.takeDamage(this.dmg); 
                if (this.config.aoeConfig?.isAoe) this.explode();
                this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
                this.life = 0; hit = true; break;
              }
            }
          }
        }
      }
      if (hit) return;
    }

    if (this.damageTargets.includes('turret')) {
      // Healing check: only stationary or specialized turrets
      for (let a of state.player.attachments) {
        const awPos = a.getWorldPos();
        const dSq = (this.pos.x - awPos.x)**2 + (this.pos.y - awPos.y)**2;
        const minDist = a.size / 2 + 4;
        if (dSq < minDist*minDist) {
          a.takeDamage(this.dmg); 
          if (this.config.aoeConfig?.isAoe) this.explode();
          this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
          this.life = 0; return;
        }
      }
    }

    if (this.damageTargets.includes('player')) {
      const pdSq = (this.pos.x - state.player.pos.x)**2 + (this.pos.y - state.player.pos.y)**2;
      const pMinDist = state.player.size / 2;
      if (pdSq < pMinDist*pMinDist) {
        state.player.takeDamage(this.dmg); if (this.config.aoeConfig?.isAoe) this.explode();
        this.spawnFeatures(this.config.spawnGroundFeatureOnContact);
        this.life = 0; return;
      }
    }

    // FIX: Explode and spawn features for dummy bullets (life 0 at start)
    if (this.life <= 0 && this.config.aoeConfig?.isAoe && (this.config.aoeConfig.dealAoeAfterLifetime || this.config.bulletLifeTime === 1)) { 
        this.explode(); 
        this.spawnFeatures(null); // Explicitly pass null to fallback to config keys during explosion
    }
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
    // FIX: Ensure list prioritization is correct even if an empty array is passed
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
    // Trigger camera shake if configured
    if (this.config.cameraShakeOnDeath) {
      const [min, max, falloff] = this.config.cameraShakeOnDeath;
      // Do not stack shake strength, take the max to prevent vibration runaway
      state.cameraShake = Math.max(state.cameraShake, random(min, max));
      // Expose and apply the third falloff parameter if it exists
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
          // Note: lerpDmg can be negative for healing starfruit pulse
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
