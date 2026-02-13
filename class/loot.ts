import { state } from '../state';
import { ECONOMY_CONFIG } from '../economy';
import { lootTypes, LootType } from '../balanceLootTable';

declare const p5: any;
declare const createVector: any;
declare const dist: any;
declare const sin: any;
declare const frameCount: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const noStroke: any;
declare const fill: any;
declare const ellipse: any;
declare const map: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rectMode: any;
declare const CENTER: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const random: any;
declare const rect: any;
declare const image: any;
declare const imageMode: any;
declare const rotate: any;
declare const tint: any;
declare const noTint: any;
declare const width: any;
declare const height: any;

export class LootEntity {
  pos: any; 
  vel: any; 
  life: number; 
  spawnFrame: number; 
  typeKey: string;
  config: LootType;
  renderSize: number;

  constructor(x: number, y: number, typeKey: string) {
    this.typeKey = typeKey;
    this.config = lootTypes[typeKey];
    this.pos = createVector(x, y); 
    this.vel = p5.Vector.random2D().mult(random(0.5, 1.2)); 
    this.life = ECONOMY_CONFIG.sunLootLifetime;
    this.spawnFrame = state.frames;
    
    // Pick random size from range
    this.renderSize = random(this.config.idleAssetImgSize[0], this.config.idleAssetImgSize[1]);
  }

  update(playerPos: any): 'none' | 'collected' | 'missed' {
    // Optimization: Use squared distance to avoid sqrt during range check
    const dx = this.pos.x - playerPos.x;
    const dy = this.pos.y - playerPos.y;
    const dSq = dx*dx + dy*dy;
    
    const canBeAttracted = (state.frames - this.spawnFrame > 60);
    const attractRangeSq = ECONOMY_CONFIG.sunLootAttractionRange * ECONOMY_CONFIG.sunLootAttractionRange;
    
    if (canBeAttracted && dSq < attractRangeSq) {
      this.vel.add(p5.Vector.sub(playerPos, this.pos).normalize().mult(0.8));
      this.vel.limit(8);
    }
    
    this.pos.add(this.vel); 
    this.vel.mult(0.94); 
    this.life--;
    
    const collectionRangeSq = ECONOMY_CONFIG.sunLootCollectionRange * ECONOMY_CONFIG.sunLootCollectionRange;
    if (dSq < collectionRangeSq) return 'collected';
    if (this.life <= 0) return 'missed';
    return 'none';
  }

  display() {
    // Optimization: Frustum Culling
    // Do not draw if loot is significantly off-screen
    const margin = 100;
    const screenX = this.pos.x - (state.cameraPos.x - width/2);
    const screenY = this.pos.y - (state.cameraPos.y - height/2);
    
    if (screenX < -margin || screenX > width + margin || screenY < -margin || screenY > height + margin) {
      return;
    }

    push(); 
    translate(this.pos.x, this.pos.y);
    const pulse = 1.0 + 0.1 * sin(frameCount * 0.15);
    const alpha = map(this.life, 0, 100, 0, 255);

    const sprite = state.assets[this.config.idleAssetImg];
    if (sprite) {
      if (this.config.type === 'currency') rotate(state.frames * 0.02);
      imageMode(CENTER);
      tint(255, alpha);
      image(sprite, 0, 0, this.renderSize * pulse, this.renderSize * pulse);
      noTint();
    } else {
      // Fallback
      fill(255, 230, 50, alpha); ellipse(0, 0, 10);
    }
    pop();
  }
}

// Added SunLoot class to satisfy imports in other files that expect a specialized sun loot class
export class SunLoot extends LootEntity {
  constructor(x: number, y: number, amount: number = 1) {
    super(x, y, 'sun');
    // Override the value if a different amount is passed to the constructor
    if (this.config) {
      this.config = { ...this.config, itemValue: amount };
    }
  }
}