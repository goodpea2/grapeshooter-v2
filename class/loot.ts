
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
declare const abs: any;

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
    if (dSq < collectionRangeSq) {
      if (this.config.type === 'currency') {
        if (this.config.item === 'sun') {
          state.sunCurrency += (this.config.itemValue || 1);
          state.uiSunScale = 1.5;
        } else if (this.config.item === 'elixir') {
          state.elixirCurrency += (this.config.itemValue || 1);
          state.uiElixirScale = 1.5;
        } else if (this.config.item === 'soil') {
          state.soilCurrency += (this.config.itemValue || 1);
          state.uiSoilScale = 1.5;
        } else if (this.config.item === 'raisin') {
          // Trigger flying raisin VFX
          const val = (this.config.itemValue || 1);
          const screenPos = {
            x: this.pos.x - (state.cameraPos.x - width/2),
            y: this.pos.y - (state.cameraPos.y - height/2)
          };
          const btnMargin = 10;
          const almanacBtnSize = 80;
          const targetX = width - btnMargin - almanacBtnSize / 2;
          const targetY = height - btnMargin - almanacBtnSize / 2;
          
          state.flyingRaisins.push({
            startX: screenPos.x,
            startY: screenPos.y,
            targetX: targetX,
            targetY: targetY,
            progress: 0,
            value: val
          });
        }
      } else if (this.config.type === 'turret' || this.config.type === 'turretAsItem') {
        const key = this.config.item;
        state.inventory[key] = (state.inventory[key] || 0) + 1;
      }
      return 'collected';
    }
    if (this.life <= 0) return 'missed';
    return 'none';
  }

  display() {
    // FAST CULLING: Simple AABB check against screen dimensions + margin
    const dx = abs(this.pos.x - state.cameraPos.x);
    const dy = abs(this.pos.y - state.cameraPos.y);
    if (dx > width * 0.6 || dy > height * 0.6) return;

    const sprite = state.assets[this.config.idleAssetImg];
    if (!sprite) return; // Skip if asset hasn't loaded

    const ctx = (window as any).drawingContext;
    push(); 
    translate(this.pos.x, this.pos.y);
    
    // ALPHA OPTIMIZATION: Use native globalAlpha instead of p5 tint()
    // tint() is very slow because it creates offscreen buffers for pixel manipulation
    let alpha = 1.0;
    if (this.life < 100) alpha = this.life / 100;
    ctx.globalAlpha = alpha;

    // MATH SIMPLIFICATION: Combined pulse and state logic
    const pulse = 1.0 + 0.1 * sin(frameCount * 0.15);
    if (this.config.type === 'currency') rotate(state.frames * 0.02);
    
    imageMode(CENTER);
    image(sprite, 0, 0, this.renderSize * pulse, this.renderSize * pulse);
    
    // Reset native state
    ctx.globalAlpha = 1.0;
    pop();
  }
}

export class SunLoot extends LootEntity {
  constructor(x: number, y: number, amount: number = 1) {
    super(x, y, 'sun');
    if (this.config) {
      this.config = { ...this.config, itemValue: amount };
    }
  }
}
