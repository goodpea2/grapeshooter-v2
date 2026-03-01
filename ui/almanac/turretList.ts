
import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { TYPE_MAP, drawTurretSprite } from '../../assetTurret';
import { CLASS_ICON_MAP } from '../../UITurretTooltip';
import { TURRET_RECIPES } from '../../dictionaryTurretMerging';
import { AlmanacProgression } from '../../lvDemo';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const TOP: any;
declare const floor: any;
declare const dist: any;
declare const mouseX: any;
declare const mouseY: any;
declare const mouseIsPressed: any;
declare const rectMode: any;
declare const imageMode: any;
declare const image: any;
declare const tint: any;
declare const noTint: any;
declare const CENTER: any;
declare const map: any;
declare const constrain: any;
declare const noFill: any;
declare const frameCount: any;
declare const scale: any;
declare const sin: any;

export function drawTurretList(x: number, y: number, w: number, h: number, modalX: number, modalY: number) {
  const itemW = 105;
  const itemH = 105;
  const padding = 10;

  const validTurrets = new Set([
    ...AlmanacProgression.StartingTurret,
    ...AlmanacProgression.LockedTurret.map(t => t.type)
  ]);

  const turrets = Object.keys(turretTypes).filter(k => 
    (turretTypes[k].tier > 0 || turretTypes[k].isSpecial) && validTurrets.has(k)
  );
  
  // Group by Tier
  const tiers: Record<string, string[]> = {};
  const specialTurrets = ['t_sunflower', 't_lilypad', 't_seed', 't_seed2'];

  turrets.forEach(k => {
    const tr = turretTypes[k];
    let tierKey: string;
    
    if (specialTurrets.includes(k) || tr.tier === 0 || tr.isSpecial) {
      tierKey = "Special";
    } else {
      tierKey = `Tier ${floor(tr.tier)}`;
    }
    
    if (!tiers[tierKey]) tiers[tierKey] = [];
    tiers[tierKey].push(k);
  });

  const tierKeys = Object.keys(tiers).sort();
  
  // Calculate total height with flexible wrapping
  let totalH = 0;
  const tierLayouts: Record<string, { key: string, x: number, y: number }[]> = {};

  tierKeys.forEach(tierName => {
    const tierTurrets = tiers[tierName];
    const layout: { key: string, x: number, y: number }[] = [];
    let curX = 10;
    let curY = totalH + 35; // Space for header
    
    tierTurrets.forEach(key => {
      if (curX + itemW > w-20) {
        curX = 10;
        curY += itemH;
      }
      layout.push({ key, x: curX + itemW/2, y: curY + itemH/2 - 20 });
      curX += itemW;
    });
    
    tierLayouts[tierName] = layout;
    totalH = curY + itemH;
  });

  // Handle Scrolling
  const maxScroll = Math.min(0, h - totalH);
  const isInside = mouseX > modalX + x && mouseX < modalX + x + w && mouseY > modalY + y && mouseY < modalY + y + h;
  
  if (mouseIsPressed && isInside) {
    const dy = mouseY - (window as any).pmouseY;
    state.almanacScrollVelocity = dy;
    if (Math.abs(dy) > 2) state.almanacIsDragging = true;
  } else {
    state.almanacScrollVelocity *= 0.75;
    if (!mouseIsPressed) state.almanacIsDragging = false;
  }
  
  state.almanacScrollY += state.almanacScrollVelocity;
  state.almanacScrollY = constrain(state.almanacScrollY, maxScroll, 0);

  push();
  translate(x, y);
  
  // Clipping
  const dc = (window as any).drawingContext;
  dc.save();
  dc.beginPath();
  dc.rect(0, 0, w, h);
  dc.clip();

  translate(0, state.almanacScrollY);

  tierKeys.forEach(tierName => {
    const layout = tierLayouts[tierName];
    if (layout.length === 0) return;
    
    const headerY = layout[0].y - itemH/2 - 15;
    fill(255, 200);
    textAlign(LEFT, TOP);
    textSize(18);
    text(tierName, 0, headerY);
    
    layout.forEach(item => {
      drawTurretGridItem(item.x, item.y, item.key, modalX + x, modalY + y + state.almanacScrollY);
    });
  });
  
  dc.restore();
  
  // Scrollbar
  if (totalH > h) {
    const sbW = 4;
    const sbX = w - 20;
    fill(0, 30);
    rect(sbX, 0, sbW, h-20, 2);
    const handleH = Math.max(20, (h / totalH) * h);
    const handleY = maxScroll === 0 ? 0 : map(state.almanacScrollY, 0, maxScroll, 0, h - handleH);
    fill(50, 200, 100, 150);
    rect(sbX, handleY, sbW, handleH, 2);
  }

  pop();
}

function drawTurretGridItem(x: number, y: number, key: string, parentX: number, parentY: number) {
  const isSelected = state.almanacSelectedTurret === key;
  const isUnlocked = state.unlockedTurrets.includes(key);
  
  const screenX = parentX + x;
  const screenY = parentY + y;
  
  const hov = mouseX > screenX - 50 && mouseX < screenX + 50 && 
              mouseY > screenY - 50 && mouseY < screenY + 50;

  push();
  translate(x, y);

  

  // Podium with depth and shadow
  push();
  translate(0, 20);
  rectMode(CENTER);
  
  // Shadow
  noStroke();
  fill(0, 0, 0, 255);
  rect(0, 5, 95, 60, 20);
  
  // Depth (Side)
  fill(isUnlocked ? [30, 88, 58] : [54, 62, 114]);
  rect(0, 0, 95, 60, 20);
  
  // Top Surface
  fill(isUnlocked ? [20, 64, 47] : [40, 47, 96]);
  rect(0, -15, 95, 45, 20);

  // Ingredient icons on front of podium
  if (isUnlocked) {
    const tr = turretTypes[key];
    const recipe = TURRET_RECIPES.find(r => r.id === key);
    const ingredientIcons: string[] = [];
    if (recipe) {
        recipe.ingredients.forEach(ing => ingredientIcons.push(CLASS_ICON_MAP[ing]));
        for (let i = 0; i < recipe.duplicates; i++) ingredientIcons.push(CLASS_ICON_MAP['duplicate']);
    } else if (tr.tier && floor(tr.tier) === 1) {
        ingredientIcons.push(CLASS_ICON_MAP[key]);
    }

    const iconSize = 16;
    const totalW = ingredientIcons.length * (iconSize + 4);
    push();
    translate(-totalW / 2 + iconSize / 2, 18);
    ingredientIcons.forEach((iconKey: string, idx: number) => {
      const iconSprite = state.assets[iconKey];
      if (iconSprite) {
        imageMode(CENTER);
        image(iconSprite, idx * (iconSize + 4), 0, iconSize, iconSize);
      }
    });
    pop();
  }

  // Selection Highlight
  if (isSelected) {
    noFill();
    translate(0, -15);
    stroke(255, 235, 90);
    strokeWeight(4);
    rectMode(CENTER);
    rect(0, 0, 95, 95, 20);
  }
  pop();
  
  // Turret Sprite with Idle Animation
  push();
  const config = turretTypes[key];
  const isSoft = config.animationBodyType === 'soft';
  const breatheRate = isSoft ? 0.1 : 0.06;
  const breatheAmp = isSoft ? 0.05 : 0.03;
  const animScaleY = 1.0 + sin(frameCount * breatheRate) * breatheAmp;
  const animScaleX = 1.0 / animScaleY;

  translate(0, -10);
  scale(animScaleX*1.25, animScaleY*1.25);



  const dummyTurret = {
    type: key,
    config: config,
    angle: 0,
    //framesAlive: framesAlive,
    alpha: isUnlocked ? 255 : 100,
    actionTimers: new Map(),
    flashTimer: 0,
    recoil: 0,
    fireRateMultiplier: 1.0,
    uid: 'almanac_' + key
  };
  
  if (!isUnlocked) tint(0, 0, 0, 200);
  drawTurretSprite(dummyTurret);
  noTint();
  pop();

  if (hov && mouseIsPressed && !state.almanacIsDragging) {
    state.almanacSelectedTurret = key;
  }
  
  pop();
}

export function getTurretY(targetKey: string): number {
  const itemH = 105;
  const itemW = 105;
  const w = 450; // Standard Almanac list width

  const validTurrets = new Set([
    ...AlmanacProgression.StartingTurret,
    ...AlmanacProgression.LockedTurret.map(t => t.type)
  ]);

  const turrets = Object.keys(turretTypes).filter(k => 
    (turretTypes[k].tier > 0 || turretTypes[k].isSpecial) && validTurrets.has(k)
  );
  
  const tiers: Record<string, string[]> = {};
  const specialTurrets = ['t_sunflower', 't_lilypad', 't_seed', 't_seed2'];

  turrets.forEach(k => {
    const tr = turretTypes[k];
    let tierKey: string;
    if (specialTurrets.includes(k) || tr.tier === 0 || tr.isSpecial) tierKey = "Special";
    else tierKey = `Tier ${floor(tr.tier)}`;
    if (!tiers[tierKey]) tiers[tierKey] = [];
    tiers[tierKey].push(k);
  });

  const tierKeys = Object.keys(tiers).sort();
  let totalH = 0;

  for (const tierName of tierKeys) {
    const tierTurrets = tiers[tierName];
    let curX = 10;
    let curY = totalH + 35;
    
    for (const key of tierTurrets) {
      if (curX + itemW > w-20) {
        curX = 10;
        curY += itemH;
      }
      if (key === targetKey) return curY;
      curX += itemW;
    }
    totalH = curY + itemH;
  }
  return 0;
}


