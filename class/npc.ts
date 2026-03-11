
import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { npcTypes, NPCTrade, T2_TURRET_POOL, T3_TURRET_POOL } from '../balanceNPC';
import { lootTypes } from '../balanceLootTable';
import { turretTypes } from '../balanceTurrets';
import { LootEntity } from './loot';
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
declare const TWO_PI: any;
declare const PI: any;
declare const HALF_PI: any;
declare const abs: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const scale: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const tint: any;
declare const noTint: any;
declare const width: any;
declare const height: any;
declare const textAlign: any;
declare const textSize: any;
declare const fill: any;
declare const noStroke: any;
declare const text: any;

export class NPCEntity {
  pos: any;
  type: string;
  config: any;
  shop: NPCTrade[]; // Each NPC instance has its own resolved shop
  angleToPlayer: number = 0;
  isInteractable: boolean = false;
  rot: number = 0;
  uid: string;
  purchaseAnimTimer: number = 0;
  discovered: boolean = false;

  constructor(x: number, y: number, typeKey: string) {
    this.pos = createVector(x, y);
    this.type = typeKey;
    this.config = npcTypes[typeKey];
    this.uid = Math.random().toString(36).substr(2, 9);
    
    // Resolve Randomized Shop Trades
    const rolledTurrets = new Set<string>();
    this.shop = this.config.shop.map((trade: NPCTrade) => {
      const newTrade = { ...trade };
      
      // Handle Random Turret Types
      if (newTrade.tradeType === 'randomT2' || newTrade.tradeType === 'randomT3') {
        const pool = newTrade.tradeType === 'randomT2' ? T2_TURRET_POOL : T3_TURRET_POOL;
        
        // Try to find a turret not already rolled for this NPC
        let roll = pool[floor(random(pool.length))];
        let attempts = 0;
        while (rolledTurrets.has(roll) && attempts < 20) {
          roll = pool[floor(random(pool.length))];
          attempts++;
        }
        rolledTurrets.add(roll);

        const tCfg = turretTypes[roll];
        newTrade.itemKey = roll;
        newTrade.itemName = tCfg?.name || '??';
      }

      // Handle Random Cost Ranges
      const newCost: any = {};
      for (const [key, val] of Object.entries(newTrade.cost)) {
        if (Array.isArray(val)) {
          newCost[key] = floor(random(val[0], val[1] + 1));
        } else {
          newCost[key] = val;
        }
      }
      newTrade.cost = newCost;

      return newTrade;
    });
  }

  update(playerPos: any) {
    const d = dist(this.pos.x, this.pos.y, playerPos.x, playerPos.y);
    this.isInteractable = d < GRID_SIZE * 2.5;
    if (this.isInteractable) this.discovered = true;
    
    const targetAngle = atan2(playerPos.y - this.pos.y, playerPos.x - this.pos.x);
    this.angleToPlayer = targetAngle;

    if (this.isInteractable) {
      if (state.activeNPC !== this) {
        state.activeNPC = this;
        state.activeNpcDialogueIdx = 0;
      }
    } else if (state.activeNPC === this) {
      state.activeNPC = null;
    }

    if (this.purchaseAnimTimer > 0) this.purchaseAnimTimer--;
  }

  triggerPurchaseAnim() {
    this.purchaseAnimTimer = 20;
  }

  /**
   * Physically spawns the purchased loot items from the NPC entity.
   */
  spawnTradeLoot(trade: NPCTrade) {
    const amount = trade.itemAmount || 1;
    const itemKey = trade.itemKey;
    // Check if we have a loot type definition for this key, otherwise fallback to sun
    const typeToSpawn = lootTypes[itemKey] ? itemKey : 'sun';

    for (let i = 0; i < amount; i++) {
      spawnLootAt(this.pos.x, this.pos.y, typeToSpawn);
    }
  }

  display() {
    const margin = 100;
    const left = state.cameraPos.x - width/2 - margin;
    const right = state.cameraPos.x + width/2 + margin;
    const top = state.cameraPos.y - height/2 - margin;
    const bottom = state.cameraPos.y + height/2 + margin;
    if (this.pos.x < left || this.pos.x > right || this.pos.y < top || this.pos.y > bottom) return;

    push();
    translate(this.pos.x, this.pos.y);
    
    let isLeft = false;
    let isBack = false;
    const ang = this.angleToPlayer;
    if (abs(ang) > HALF_PI) isLeft = true;
    if (ang < 0) isBack = true;

    const baseKey = this.config.assetKey;
    const spriteKey = isBack ? `img_${baseKey}_back` : `img_${baseKey}_front`;
    const sprite = state.assets[spriteKey];

    // Animation Calculation
    let animY = 0;
    let animScaleX = 1.0;
    let animScaleY = 1.0;
    
    // Idle Hover (Subtle)
    animY += sin(state.frames * 0.05) * 2;
    
    // Panel Open Jump (Subtle)
    if (state.activeNPC === this) {
        animY -= abs(sin(state.frames * 0.08)) * 4;
    }

    // Purchase Pulse
    if (this.purchaseAnimTimer > 0) {
        const progress = 1 - (this.purchaseAnimTimer / 20);
        const squash = sin(progress * PI) * (1 - progress) * 0.15;
        animScaleY -= squash;
        animScaleX += squash;
    }

    if (sprite) {
      push();
      if (isLeft) scale(-1, 1);
      translate(0, animY);
      scale(animScaleX, animScaleY);
      imageMode(CENTER);
      image(sprite, 0, 0, 80, 80);
      pop();
    }

    if (this.isInteractable) {
      push();
      translate(0, -45 + sin(state.frames * 0.1) * 3);
      textAlign(CENTER, CENTER);
      textSize(14);
      fill(255, 255, 100);
      noStroke();
      text(this.config.name, 0, 0);
      pop();
    }

    pop();
  }
}
