
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
    // Very slow start, much faster near end
    const pulseFreq = 0.02 + eased * 0.4;
    const p = 0.5 + 0.5 * sin(frameCount * pulseFreq*0.1);
    push();
    translate(tex.x, tex.y);
    rectMode(CENTER);
    // Color pulse: Interpolate between intense Red and pure White
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

  // If we have an asset config, use the sprites
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
      (window as any).tint(255, opacity);
      image(sprite, 0, 0, GRID_SIZE, GRID_SIZE);
      (window as any).noTint();
      pop();
      return; 
    }
  }

  if (type === 'v_sun_tiny' || type === 'v_sun_ore' || type === 'v_sun_clump') {
    push();
    for (let bit of block.sunBits) {
      noStroke();
      fill(255, 255, 100, opacity); 
      ellipse(bit.x + GRID_SIZE*0.5, bit.y + GRID_SIZE*0.5, bit.s); 
      fill(255, 255, 200, opacity * 0.8); 
      ellipse(bit.x + GRID_SIZE*0.5, bit.y + GRID_SIZE*0.5, bit.s * 0.5);
    }
    pop();
  } else if (type === 'v_tnt') {
    push();
    const p = 0.5 + 0.5 * sin(frameCount * 0.2 + (gx + gy));
    for(let i=0; i<8; i++) {
        const nx = Math.abs(gx * 37 + i * 19) % (GRID_SIZE - 8) + 4;
        const ny = Math.abs(gy * 23 + i * 13) % (GRID_SIZE - 8) + 4;
        const sz = 4 + Math.abs(gx + i) % 4;
        noStroke();
        fill(255, 30, 30, opacity);
        rect(nx, ny, sz, sz, 1);
        fill(255, 100, 100, opacity * p);
        rect(nx + 1, ny + 1, sz - 2, sz - 2, 1);
    }
    fill(20, opacity * 0.8); noStroke();
    rect(GRID_SIZE/2 - 6, GRID_SIZE/2 - 6, 12, 12, 2);
    fill(255, 100, 100, opacity * p);
    ellipse(GRID_SIZE/2, GRID_SIZE/2, 4);
    pop();
  } else if (type === 'v_spawner') {
    push();
    const sCfg = oCfg.enemySpawnConfig;
    const timeToSpawn = frameCount - block.lastSpawnTime;
    const isAboutToSpawn = sCfg.spawnInterval > 0 && timeToSpawn > (sCfg.spawnInterval - 60);
    const activePulse = isAboutToSpawn ? sin(frameCount * 0.5) : sin(frameCount * 0.15 + (gx + gy));
    const p = 0.5 + 0.5 * activePulse;
    
    const danger = oCfg?.danger || 1;
    fill(isAboutToSpawn ? [80, 20, 100] : [40, 20, 60], opacity); stroke(isAboutToSpawn ? [255, 100, 255] : [80, 40, 120], opacity); strokeWeight(2);
    rect(4, 4, GRID_SIZE-8, GRID_SIZE-8, 3);
    
    // Core glow
    fill(200, 50, 255, opacity * (isAboutToSpawn ? 0.9 : (0.6 + 0.4 * p)));
    ellipse(GRID_SIZE/2, GRID_SIZE/2, 12 + p * (isAboutToSpawn ? 8 : 4));
    fill(255, 200, 255, opacity);
    ellipse(GRID_SIZE/2, GRID_SIZE/2, 4 + p * (isAboutToSpawn ? 4 : 2));
    
    if (isAboutToSpawn) {
        noFill(); stroke(255, 150, 255, opacity * p); strokeWeight(1);
        ellipse(GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE * p * 1.5);
    }

    fill(255, 255, 100, opacity);
    for(let i=0; i<danger; i++) { ellipse(6 + i*5, 10, 3); }
    pop();
  } else if (type === 'v_sniper_tower') {
    const wPos = { x: block.pos.x + GRID_SIZE/2, y: block.pos.y + GRID_SIZE/2 };
    const ang = atan2(state.player.pos.y - wPos.y, state.player.pos.x - wPos.x);
    fill(40, 40, 60, opacity); noStroke(); rect(4, 4, GRID_SIZE-8, GRID_SIZE-8, 4);
    push(); translate(GRID_SIZE/2, GRID_SIZE/2); rotate(ang);
    fill(20, 20, 40, opacity); rect(0, -4, 18, 8, 2);
    fill(255, 50, 50, opacity * (0.6 + 0.4 * sin(frameCount * 0.2))); ellipse(0, 0, 8);
    pop();
  } else if (type === 'v_stray') {
    push();
    const turretKeys = ['t_peashooter', 't_laser', 't_wall', 't_mine', 't_ice'];
    let hash = (gx * 17 + gy * 13);
    let chosenIdx = hash % turretKeys.length;
    if (chosenIdx < 0) chosenIdx += turretKeys.length;
    const tKey = turretKeys[chosenIdx];
    const tCfg = turretTypes[tKey];
    fill(100, 100, 120, opacity); stroke(255, 30); strokeWeight(1);
    rect(6, 6, GRID_SIZE-12, GRID_SIZE-12, 4);
    if (tCfg && tCfg.color) {
        translate(GRID_SIZE/2, GRID_SIZE/2);
        fill(tCfg.color[0], tCfg.color[1], tCfg.color[2], opacity);
        stroke(20, opacity); strokeWeight(2);
        ellipse(0, 0, 16, 16);
        noStroke(); fill(255, opacity * 0.4);
        ellipse(-4, -4, 4, 4);
    }
    pop();
  } else if (type === 'v_sunflower') {
    push();
    const p = 0.5 + 0.5 * sin(frameCount * 0.1 + (gx + gy)); 
    stroke(80, 160, 40, opacity); strokeWeight(4); line(GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE/2, GRID_SIZE); noStroke();
    fill(255, 220, 50, opacity);
    for(let i=0; i<8; i++) {
      let a = i * PI/4 + frameCount * 0.02;
      ellipse(GRID_SIZE/2 + cos(a)*10, GRID_SIZE/2 + sin(a)*10, 8, 12);
    }
    fill(100, 60, 20, opacity); ellipse(GRID_SIZE/2, GRID_SIZE/2, 12 + p * 2);
    pop();
  }
}
