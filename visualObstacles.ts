import { GRID_SIZE } from './constants';
import { state } from './state';
import { turretTypes } from './balanceTurrets';
import { overlayTypes } from './balanceObstacles';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const rotate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const rect: any;
declare const ellipse: any;
declare const color: any;
declare const lerpColor: any;
declare const sin: any;
declare const cos: any;
declare const frameCount: any;
declare const line: any;
declare const strokeWeight: any;
declare const textAlign: any;
declare const textSize: any;
declare const textWidth: any;
declare const triangle: any;
declare const CENTER: any;
declare const text: any;
declare const PI: any;
declare const TWO_PI: any;
declare const atan2: any;
declare const noise: any;
declare const random: any;
declare const image: any;
declare const imageMode: any;
declare const scale: any;
declare const rectMode: any;
declare const HALF_PI: any;

export function drawTickingExplosive(tex: any) {
    const progress = 1 - (tex.timer / tex.maxTimer);
    const eased = progress * progress; // quadratic easing
    const pulseFreq = 0.02 + eased * 0.4;
    const p = 0.5 + 0.5 * sin(frameCount * pulseFreq*0.1);
    push();
    translate(tex.x, tex.y);
    rectMode(CENTER);
    const cRed = color(255, 30, 30);
    const cWhite = color(255, 200, 200);
    const lerpedCol = lerpColor(cRed, cWhite, p);
    noStroke();
    fill(lerpedCol);
    rect(0, 0, GRID_SIZE, GRID_SIZE, 8);
    pop();
}


export function drawOverlay(type: string, block: any, opacity: number) {
  const gx = block.gx;
  const gy = block.gy;
  const oCfg = overlayTypes[block.overlay];

  if (oCfg?.assetImgConfig) {
    const cfg = oCfg.assetImgConfig;
    const pool = cfg.idleAssetImg;
    const seed = (gx * 31 + gy * 7);
    const variantIdx = Math.abs(seed) % pool.length;
    const sprite = state.assets[pool[variantIdx]];

    if (sprite) {
      push();
      translate(GRID_SIZE / 2, GRID_SIZE / 2);
      if (cfg.randomRotation) { rotate((Math.abs(seed * 13) % 4) * HALF_PI); }
      if (cfg.randomFlip) { scale((Math.abs(seed * 17) % 2 === 0) ? -1 : 1, 1); }
      imageMode(CENTER);
      // OPTIMIZATION: Tint is expensive in p5.js. Skip if fully opaque.
      if (opacity < 254) {
        (window as any).tint(255, opacity);
      }
      image(sprite, 0, 0, GRID_SIZE, GRID_SIZE);
      if (opacity < 254) {
        (window as any).noTint();
      }
      pop();
      return; 
    }
  }

  if (type === 'v_sniper_tower') {
    const wPos = { x: block.pos.x + GRID_SIZE/2, y: block.pos.y + GRID_SIZE/2 };
    const ang = block.lockedAngle !== undefined && block.lockedAngle !== null ? block.lockedAngle : atan2(state.player.pos.y - wPos.y, state.player.pos.x - wPos.x);
    fill(40, 40, 60, opacity); noStroke(); rect(4, 4, GRID_SIZE-8, GRID_SIZE-8, 4);
    push(); translate(GRID_SIZE/2, GRID_SIZE/2); rotate(ang);
    fill(20, 20, 40, opacity); rect(0, -4, 20, 8, 2);
    fill(255, 50, 50, opacity * (0.6 + 0.4 * sin(frameCount * 0.2))); ellipse(0, 0, 8);
    pop();
  } else if (type === 'v_mortar_tower') {
    const wPos = { x: block.pos.x + GRID_SIZE/2, y: block.pos.y + GRID_SIZE/2 };
    const ang = block.lockedAngle !== undefined && block.lockedAngle !== null ? block.lockedAngle : atan2(state.player.pos.y - wPos.y, state.player.pos.x - wPos.x);
    fill(55, 45, 40, opacity); noStroke(); rect(4, 4, GRID_SIZE-8, GRID_SIZE-8, 4);
    push(); translate(GRID_SIZE/2, GRID_SIZE/2); rotate(ang);
    fill(30, 25, 20, opacity); rect(-2, -6, 16, 12, 3);
    fill(255, 140, 0, opacity * (0.7 + 0.3 * sin(frameCount * 0.15))); ellipse(0, 0, 10);
    pop();
  } else if (type === 'v_minigun_tower') {
    const wPos = { x: block.pos.x + GRID_SIZE/2, y: block.pos.y + GRID_SIZE/2 };
    const ang = block.lockedAngle !== undefined && block.lockedAngle !== null ? block.lockedAngle : atan2(state.player.pos.y - wPos.y, state.player.pos.x - wPos.x);
    fill(60, 50, 35, opacity); noStroke(); rect(4, 4, GRID_SIZE-8, GRID_SIZE-8, 4);
    push(); translate(GRID_SIZE/2, GRID_SIZE/2); rotate(ang);
    fill(35, 30, 20, opacity); rect(0, -5, 18, 10, 2);
    fill(200, 150, 50, opacity); rect(6, -6, 8, 12, 1);
    fill(255, 200, 50, opacity * (0.8 + 0.2 * sin(frameCount * 0.3))); ellipse(0, 0, 8);
    pop();
  } else if (type === 'v_healing_tower') {
    fill(30, 60, 45, opacity); noStroke(); rect(4, 4, GRID_SIZE-8, GRID_SIZE-8, 4);
    push(); translate(GRID_SIZE/2, GRID_SIZE/2);
    fill(40, 220, 120, opacity * (0.7 + 0.3 * sin(frameCount * 0.1)));
    rect(-3, -10, 6, 20, 2);
    rect(-10, -3, 20, 6, 2);
    ellipse(0, 0, 12);
    pop();
  } else if (type === 'v_firewall_tower') {
    fill(65, 30, 30, opacity); noStroke(); rect(4, 4, GRID_SIZE-8, GRID_SIZE-8, 4);
    push(); translate(GRID_SIZE/2, GRID_SIZE/2);
    fill(255, 80, 40, opacity * (0.7 + 0.3 * sin(frameCount * 0.2)));
    ellipse(0, 0, 18);
    stroke(255, 120, 50, opacity * 0.8); strokeWeight(2); noFill();
    ellipse(0, 0, 24 + 4 * sin(frameCount * 0.15));
    pop();
  } else if (type === 'v_textsign') {
    const rawText = block.customText || 'Hint';
    push();
    translate(GRID_SIZE / 2, -6);
    textSize(8.5);
    const tw = Math.max(36, textWidth(rawText) + 12);
    const th = 18;
    // Tail
    fill(14, 18, 32, opacity);
    stroke(240, 190, 80, opacity);
    strokeWeight(1);
    triangle(-4, 0, 4, 0, 0, 5);
    // Bubble Box
    rectMode(CENTER);
    rect(0, -th / 2, tw, th, 4);
    // Text
    noStroke();
    fill(255, 235, 170, opacity);
    textAlign(CENTER, CENTER);
    text(rawText, 0, -th / 2);
    pop();
  }
}
