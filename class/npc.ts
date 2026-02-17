
import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { npcTypes, NPCTrade, T2_TURRET_POOL } from '../balanceNPC';
import { lootTypes } from '../balanceLootTable';
import { turretTypes } from '../balanceTurrets';
import { LootEntity } from './loot';

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

  constructor(x: number, y: number, typeKey: string) {
    this.pos = createVector(x, y);
    this.type = typeKey;
    this.config = npcTypes[typeKey];
    this.uid = Math.random().toString(36).substr(2, 9);
    
    // Resolve Randomized Shop Trades
    this.shop = this.config.shop.map((trade: NPCTrade) => {
      const newTrade = { ...trade };
      if (newTrade.tradeType === 'randomT2') {
        const roll = T2_TURRET_POOL[floor(random(T2_TURRET_POOL.length))];
        const tCfg = turretTypes[roll];
        newTrade.itemKey = roll;
        // User requested: just give the turret name, don't mention the "Mystery T2" part
        newTrade.itemName = tCfg?.name || '??';
        
        // Dynamic cost range: 25..40
        const rolledSun = floor(random(25, 41));
        if (newTrade.cost.sun !== undefined) newTrade.cost.sun = rolledSun;
        else if (newTrade.cost.soil !== undefined) newTrade.cost.soil = floor(rolledSun * 0.7);
        else if (newTrade.cost.elixir !== undefined) newTrade.cost.elixir = floor(rolledSun * 0.5);
      }
      return newTrade;
    });
  }

  update(playerPos: any) {
    const d = dist(this.pos.x, this.pos.y, playerPos.x, playerPos.y);
    this.isInteractable = d < GRID_SIZE * 2.5;
    
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
      const loot = new LootEntity(this.pos.x, this.pos.y, typeToSpawn);
      const ang = random(TWO_PI);
      loot.vel = p5.Vector.fromAngle(ang).mult(random(3, 6));
      state.loot.push(loot);
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

    if (sprite) {
      push();
      if (isLeft) scale(-1, 1);
      imageMode(CENTER);
      const breathe = 1.0 + 0.02 * sin(frameCount * 0.05);
      image(sprite, 0, 0, 80, 80 * breathe);
      pop();
    }

    if (this.isInteractable) {
      push();
      translate(0, -45 + sin(frameCount * 0.1) * 3);
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
