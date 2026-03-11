
import { state } from '../state';

declare const p5: any;
declare const createVector: any;
declare const lerp: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const tint: any;
declare const noTint: any;
declare const width: any;
declare const height: any;
declare const sin: any;

export class LootInFlightVFX {
  pos: any;
  targetPos: any;
  progress: number = 0;
  speed: number = 0.05;
  assetKey: string;
  size: number;
  value: number;
  itemKey: string;
  type: string;
  turretHP?: number;

  startPos: any;

  constructor(startX: number, startY: number, targetX: number, targetY: number, assetKey: string, size: number, value: number, itemKey: string, type: string, turretHP?: number) {
    this.pos = createVector(startX, startY);
    this.startPos = createVector(startX, startY);
    this.targetPos = createVector(targetX, targetY);
    this.assetKey = assetKey;
    this.size = size;
    this.value = value;
    this.itemKey = itemKey;
    this.type = type;
    this.turretHP = turretHP;
  }

  update() {
    this.progress += this.speed;
    this.speed += 0.005; // Accelerate
    
    // Use a non-linear interpolation for a "swoop" effect
    const t = this.progress * this.progress; 
    this.pos.x = lerp(this.startPos.x, this.targetPos.x, t);
    this.pos.y = lerp(this.startPos.y, this.targetPos.y, t);

    if (this.progress >= 1) {
      // Apply the value to state
      if (this.type === 'currency') {
        (state as any)[this.itemKey + 'Currency'] += this.value;
        if (this.itemKey === 'sun') {
          state.totalSunLootCollected += this.value;
          state.uiSunScale = 1.6;
        } else if (this.itemKey === 'elixir') {
          state.totalElixirLootCollected += this.value;
          state.uiElixirScale = 1.6;
        } else if (this.itemKey === 'soil') {
          state.totalSoilLootCollected += this.value;
          state.uiSoilScale = 1.6;
        }
      } else if (this.type === 'item') {
        state.inventory.items[this.itemKey] = (state.inventory.items[this.itemKey] || 0) + 1;
      } else if (this.type === 'turret') {
        state.player.addStrayTurret(this.itemKey, this.turretHP);
      } else if (this.type === 'turretAsItem') {
        state.inventory.items[this.itemKey] = (state.inventory.items[this.itemKey] || 0) + 1;
        state.inventory.specList.push({ key: this.itemKey, type: 'turret', timestamp: Date.now() });
        state.totalTurretsAcquired += 1;
        state.uiAlpha = 255;
      }
    }
  }

  isDone() {
    return this.progress >= 1;
  }

  display() {
    const sprite = state.assets[this.assetKey];
    if (!sprite) return;

    push();
    const pulse = 1.0 + 0.1 * sin(state.frames * 0.2);
    imageMode(CENTER);
    image(sprite, this.pos.x, this.pos.y, this.size * pulse, this.size * pulse);
    pop();
  }
}

declare const push: any;
declare const pop: any;
