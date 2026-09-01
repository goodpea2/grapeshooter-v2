import { state } from '../state';
import { LEVELS, refreshLevels, startLevel, triggerImportLevelJson } from '../levelManager';
import { startLevelEditor } from '../levelEditor';
import { enemyTypes } from '../balanceEnemies';
import { bulletTypes } from '../balanceBullets';
import { GRID_SIZE } from '../constants';
import { BugSplatVFX, GiantDeathVFX, Explosion, FireworkVFX, DamageNumberVFX, drawPersistentDeathVisual } from '../vfx/index';
import { drawYellowButton, drawCyanButton, drawPurpleButton, drawDarkButton } from '../uiComponents';
import { soundEngine } from '../src/audio/soundEngine';

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
declare const line: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const CENTER: any;
declare const RIGHT: any;
declare const TOP: any;
declare const BOTTOM: any;
declare const CORNER: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const mouseIsPressed: any;
declare const sin: any;
declare const cos: any;
declare const textWidth: any;
declare const strokeWeight: any;
declare const map: any;
declare const constrain: any;
declare const beginShape: any;
declare const vertex: any;
declare const endShape: any;
declare const CLOSE: any;
declare const lerp: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;
declare const color: any;
declare const random: any;

interface MenuEnemy {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  health: number;
  maxHealth: number;
  size: number;
  type: string;
  speed: number;
  col: number[];
  flashTimer: number;
  fleeTimer?: number;
  fleeTargetAngle?: number;
}

const menuEnemies: MenuEnemy[] = [];
const menuVfx: any[] = [];
let nextSpawnTimer = 0;
let splatBuffer: any = null;

function getSplatBuffer(w: number, h: number) {
  if (!splatBuffer || splatBuffer.width !== w || splatBuffer.height !== h) {
    splatBuffer = (window as any).createGraphics(w, h);
    splatBuffer.pixelDensity(1);
    splatBuffer.clear();
  }
  return splatBuffer;
}

const SPAWN_WEIGHTS: { type: string; weight: number }[] = [
  { type: 'e_basic', weight: 200 },
  { type: 'e_armor1', weight: 50 },
  { type: 'e_armor2', weight: 20 },
  { type: 'e_armor3', weight: 10 },
  { type: 'e_giant', weight: 3 },
  { type: 'e_bomb_mainmenu', weight: 10 }
];

function getRandomEnemyType(): string {
  const totalWeight = SPAWN_WEIGHTS.reduce((acc, curr) => acc + curr.weight, 0);
  let r = Math.random() * totalWeight;
  for (const item of SPAWN_WEIGHTS) {
    if (r < item.weight) {
      return item.type;
    }
    r -= item.weight;
  }
  return 'e_basic';
}

function spawnMenuEnemy(minX: number, maxX: number, minY: number, maxY: number, spawnOutside: boolean = true) {
  const type = getRandomEnemyType();
  const cfg = enemyTypes[type];
  const speed = cfg.speed; // Exactly matches config speed

  let x: number;
  let y: number;
  let ang: number;

  if (spawnOutside) {
    const side = Math.floor(Math.random() * 4);
    if (side === 0) { // Spawn from right
      x = maxX + 25;
      y = minY + Math.random() * (maxY - minY);
      ang = Math.PI * 0.75 + Math.random() * Math.PI * 0.5; // heading left-ish
    } else if (side === 1) { // Spawn from top
      x = minX + Math.random() * (maxX - minX);
      y = minY - 25;
      ang = Math.PI * 0.25 + Math.random() * Math.PI * 0.5; // heading down-ish
    } else if (side === 2) { // Spawn from bottom
      x = minX + Math.random() * (maxX - minX);
      y = maxY + 25;
      ang = -Math.PI * 0.25 - Math.random() * Math.PI * 0.5; // heading up-ish
    } else { // Spawn from left (near dividing line)
      x = minX - 25;
      y = minY + Math.random() * (maxY - minY);
      ang = -Math.PI * 0.25 + Math.random() * Math.PI * 0.5; // heading right-ish
    }
  } else {
    x = minX + Math.random() * (maxX - minX);
    y = minY + Math.random() * (maxY - minY);
    ang = Math.random() * Math.PI * 2;
  }

  menuEnemies.push({
    x,
    y,
    vx: Math.cos(ang) * speed,
    vy: Math.sin(ang) * speed,
    rot: ang,
    health: cfg.health,
    maxHealth: cfg.health,
    size: cfg.size,
    type: type,
    speed: speed,
    col: cfg.col || [140, 70, 220],
    flashTimer: 0
  });
}

function initMiniGameIfEmpty(minX: number, maxX: number, minY: number, maxY: number) {
  if (menuEnemies.length === 0) {
    for (let i = 0; i < 8; i++) {
      spawnMenuEnemy(minX, maxX, minY, maxY, false);
    }
  }
}

function triggerBulletExplosion(bKey: string, cx: number, cy: number) {
  const bCfg = bulletTypes[bKey] || bulletTypes.b_mainmenu;
  if (!bCfg) return;

  const aoe = bCfg.aoeConfig;
  const radii = aoe?.aoeRadiusGradient || [GRID_SIZE * 1];
  const maxR = radii[radii.length - 1] || (GRID_SIZE * 1);
  const dmgGradient = aoe?.aoeDamageGradient || [bCfg.bulletDamage || 100];
  const col = bCfg.bulletColor ? color(bCfg.bulletColor[0], bCfg.bulletColor[1], bCfg.bulletColor[2]) : color(255, 50, 50);

  // In-game bullet death VFX selection (FireworkVFX for v_goldengrape_firework or Explosion)
  if (bCfg.bulletDeathVfx === 'v_goldengrape_firework') {
    menuVfx.push(new FireworkVFX(cx, cy));
  } 

  // Calculate damage & hit enemies in blast radius using snapshot to prevent index shifts during chain explosions
  const targets = [...menuEnemies];
  for (const e of targets) {
    if (!e || !menuEnemies.includes(e)) continue;
    const d = Math.hypot(e.x - cx, e.y - cy);
    if (d <= maxR + e.size * 0.5) {
      let dmg = bCfg.bulletDamage || 100;
      if (radii.length > 1 && dmgGradient.length > 1) {
        if (d <= radii[0]) {
          dmg = dmgGradient[0];
        } else {
          for (let k = 0; k < radii.length - 1; k++) {
            if (d >= radii[k] && d <= radii[k + 1]) {
              const factor = (d - radii[k]) / (radii[k + 1] - radii[k]);
              dmg = lerp(dmgGradient[k], dmgGradient[k + 1], factor);
              break;
            }
          }
        }
      } else if (dmgGradient.length === 1) {
        dmg = dmgGradient[0];
      }

      e.health -= dmg;
      e.flashTimer = 6;

      // In-game DamageNumberVFX
      menuVfx.push(new DamageNumberVFX(e.x, e.y - e.size * 0.5, Math.round(dmg), [255, 255, 255]));

      if (e.health <= 0) {
        killMenuEnemy(e);
      }
    }
  }
}

function killMenuEnemy(e: MenuEnemy, index?: number) {
  if (!e) return;
  const idx = index !== undefined ? index : menuEnemies.indexOf(e);
  if (idx === -1 || idx >= menuEnemies.length || menuEnemies[idx] !== e) {
    const realIdx = menuEnemies.indexOf(e);
    if (realIdx === -1) return; // already removed
    menuEnemies.splice(realIdx, 1);
  } else {
    menuEnemies.splice(idx, 1);
  }

  // In-game persistent splat to background buffer
  drawPersistentDeathVisual(e.x, e.y, e.size, e.col, getSplatBuffer(width, height));

  // In-game Enemy Death VFX (GiantDeathVFX for giants, BugSplatVFX for standard)
  if (e.type === 'e_giant' || e.type.includes('giant')) {
    menuVfx.push(new GiantDeathVFX(e.x, e.y, e.size, e.col));
    soundEngine.playSFX('enemy_death_strong');
  } else {
    menuVfx.push(new BugSplatVFX(e.x, e.y, e.size, color(e.col[0], e.col[1], e.col[2])));
    soundEngine.playSFXGroup('enemy_death');
  }

  // Trigger on-death actions (e.g. e_bomb_mainmenu spawns b_bomb_mainmenu)
  const cfg = enemyTypes[e.type];
  if (cfg?.actionType?.includes('spawnBullet') && cfg.actionConfig?.bulletTypeToSpawn) {
    if (cfg.actionConfig.spawnTriggerOnHealthRatio?.includes(0) || !cfg.actionConfig.spawnTriggerOnHealthRatio) {
      triggerBulletExplosion(cfg.actionConfig.bulletTypeToSpawn, e.x, e.y);
    }
  }
}

function handleMiniGameExplosion(cx: number, cy: number) {
  // Fire configured b_mainmenu bullet
  triggerBulletExplosion('b_mainmenu', cx, cy);

  // Only enemies within 10 tiles radius of the clicking point switch direction,
  // with a delay of 15 frames for 2-tile distance up to 120 frames for 10-tile distance.
  const maxFleeDist = 10 * GRID_SIZE; // 10 tiles (320px)
  const minFleeDist = 2 * GRID_SIZE;  // 2 tiles (64px)

  for (const e of menuEnemies) {
    if (!e) continue;
    const d = Math.hypot(e.x - cx, e.y - cy);
    if (d <= maxFleeDist) {
      const baseAngle = Math.atan2(e.y - cy, e.x - cx);
      const variation = (Math.random() - 0.5) * (30 * Math.PI / 180) * 2; // ±30 deg
      const runAngle = baseAngle + variation;

      // Distance delay calculation: 15 frames (2 tiles) to 120 frames (10 tiles)
      const clampedD = Math.max(minFleeDist, Math.min(maxFleeDist, d));
      const t = (clampedD - minFleeDist) / (maxFleeDist - minFleeDist);
      const delayFrames = Math.round(15 + t * (120 - 15));

      e.fleeTimer = delayFrames;
      e.fleeTargetAngle = runAngle;
    }
  }
}

function updateAndDrawMiniGame(minX: number, maxX: number, minY: number, maxY: number) {
  initMiniGameIfEmpty(minX, maxX, minY, maxY);

  // Spawn new enemies frequently
  nextSpawnTimer--;
  if (nextSpawnTimer <= 0) {
    if (menuEnemies.length < 24) {
      spawnMenuEnemy(minX, maxX, minY, maxY, true);
    }
    nextSpawnTimer = 20;
  }

  // Update & Draw VFX (Explosion, BugSplatVFX, DamageNumberVFX)
  for (let i = menuVfx.length - 1; i >= 0; i--) {
    const v = menuVfx[i];
    if (!v) continue;
    v.update();
    v.display();
    if (v.isDone()) {
      menuVfx.splice(i, 1);
    }
  }

  // Update & Draw Enemies
  const despawnMargin = 80;
  for (let i = menuEnemies.length - 1; i >= 0; i--) {
    const e = menuEnemies[i];
    if (!e) continue;

    // Handle distance-based flee direction switch after delay expires
    if (e.fleeTimer !== undefined && e.fleeTimer > 0) {
      e.fleeTimer--;
      if (e.fleeTimer === 0 && e.fleeTargetAngle !== undefined) {
        e.vx = Math.cos(e.fleeTargetAngle) * e.speed;
        e.vy = Math.sin(e.fleeTargetAngle) * e.speed;
        e.rot = e.fleeTargetAngle;
      }
    }

    e.x += e.vx;
    e.y += e.vy;

    // Slight gentle wander steering (only when not actively counting down to flee)
    if ((e.fleeTimer === undefined || e.fleeTimer <= 0) && Math.random() < 0.03) {
      const curAng = Math.atan2(e.vy, e.vx) + (Math.random() - 0.5) * 0.3;
      e.vx = Math.cos(curAng) * e.speed;
      e.vy = Math.sin(curAng) * e.speed;
    }

    // Facing angle
    e.rot = lerp(e.rot, Math.atan2(e.vy, e.vx), 0.15);

    // Despawn if wandered too far outside the screen bounds (no wall bounce)
    if (e.x < minX - despawnMargin || e.x > maxX + despawnMargin || e.y < minY - despawnMargin || e.y > maxY + despawnMargin) {
      menuEnemies.splice(i, 1);
      continue;
    }

    if (e.flashTimer > 0) e.flashTimer--;

    // Render Enemy (No shadows)
    push();
    translate(e.x, e.y);
    rotate(e.rot);

    const imgKey = e.type === 'e_bomb_mainmenu' ? 'img_bomb' : ('img_' + e.type.slice(2));
    const sprite = state.assets[imgKey] || state.assets['img_basic'];
    if (sprite) {
      imageMode(CENTER);
      if (e.flashTimer > 0) {
        tint(255, 100, 100);
      }
      image(sprite, 0, 0, 64, 64);
      if (e.flashTimer > 0) {
        noTint();
      }
    } else {
      // Fallback procedural sprite
      fill(e.col[0], e.col[1], e.col[2]);
      noStroke();
      ellipse(0, 0, e.size, e.size);

      // Eyes
      fill(255);
      ellipse(e.size * 0.25, -e.size * 0.15, e.size * 0.38, e.size * 0.38);
      ellipse(e.size * 0.25, e.size * 0.15, e.size * 0.38, e.size * 0.38);
      fill(20, 10, 30);
      ellipse(e.size * 0.32, -e.size * 0.15, e.size * 0.2, e.size * 0.2);
      ellipse(e.size * 0.32, e.size * 0.15, e.size * 0.2, e.size * 0.2);
    }
    pop();

    // Health bar if damaged
    if (e.health < e.maxHealth) {
      push();
      translate(e.x, e.y - e.size * 0.85);
      fill(10, 15, 30, 200);
      noStroke();
      rect(-16, -3, 32, 6, 3);
      fill(255, 60, 60);
      const hpPct = constrain(e.health / e.maxHealth, 0, 1);
      rect(-16, -3, 32 * hpPct, 6, 3);
      pop();
    }
  }
}

export function drawMainMenu() {
  refreshLevels();
  push();

  // 1. Dark ambient background
  fill(18, 20, 38);
  noStroke();
  rect(0, 0, width, height);

  // 1.1 Draw Persistent Death Splats Buffer on the background
  if (splatBuffer) {
    imageMode(CORNER);
    image(splatBuffer, 0, 0);
  }

  // Subtle background ambient dots
  const t = (state.frames || 0) * 0.02;
  stroke(36, 44, 80, 80);
  strokeWeight(1);
  const gridSize = 64;
  for (let x = 0; x < width; x += gridSize) {
    for (let y = 0; y < height; y += gridSize) {
      const pulse = sin(t + (x + y) * 0.01) * 1.5;
      fill(60, 75, 140, 15 + pulse * 5);
      rect(x + 30, y + 30, 3, 3, 1);
    }
  }

  // Layout Geometry
  const leftMargin = Math.max(36, width * 0.045);
  const leftColumnW = Math.min(480, Math.max(340, width * 0.38));
  const topMargin = Math.max(32, height * 0.06);

  // Mini-game bounds on the right side
  const miniGameMinX = leftMargin + leftColumnW + 30;
  const miniGameMaxX = width - 24;
  const miniGameMinY = 24;
  const miniGameMaxY = height - 24;

  // 2. Right Side Interactive Mini-Game
  if (miniGameMaxX > miniGameMinX + 50) {
    updateAndDrawMiniGame(miniGameMinX, miniGameMaxX, miniGameMinY, miniGameMaxY);
  }

  // 3. Left Side: Title Section (Aligned to the left above cards)
  textAlign(LEFT, TOP);
  textSize(42);

  // Title shadow (purple/indigo 3D shadow)
  noStroke();
  fill(65, 52, 132);
  text("GRAPESHOOTER", leftMargin + 3, topMargin + 4);

  // Title Main (Bright golden yellow)
  fill(255, 235, 90);
  text("GRAPESHOOTER", leftMargin, topMargin);

  // 4. Level Cards Container
  const cardW = leftColumnW;
  const cardH = 88;
  const cardGap = 14;

  // Bottom action buttons (LEVEL EDITOR, IMPORT LEVEL, SETTINGS)
  const bottomBtnH = 42;
  const bottomBtnGap = 8;
  const settingsBtnW = 44;
  const twoBtnsW = cardW - settingsBtnW - bottomBtnGap * 2;
  const singleBtnW = twoBtnsW / 2;
  const bottomY = height - Math.max(28, height * 0.04) - bottomBtnH;

  // Scrollable container bounds
  const containerY = topMargin + 66;
  const containerH = Math.max(100, bottomY - containerY - 16);
  const totalCardsH = LEVELS.length * (cardH + cardGap) - cardGap;
  const maxScroll = Math.min(0, containerH - totalCardsH);

  // Update smooth scroll velocity
  if (state.mainMenuScrollVelocity) {
    state.mainMenuScrollY = constrain((state.mainMenuScrollY || 0) + state.mainMenuScrollVelocity, maxScroll, 0);
    state.mainMenuScrollVelocity *= 0.86;
    if (Math.abs(state.mainMenuScrollVelocity) < 0.01) state.mainMenuScrollVelocity = 0;
  } else {
    state.mainMenuScrollY = constrain(state.mainMenuScrollY || 0, maxScroll, 0);
  }

  // Clip the scrollable list
  const dc = (window as any).drawingContext;
  if (dc) {
    dc.save();
    dc.beginPath();
    dc.rect(leftMargin - 10, containerY, cardW + 20, containerH);
    dc.clip();
  }

  const startY = containerY + (state.mainMenuScrollY || 0);

  for (let i = 0; i < LEVELS.length; i++) {
    const level = LEVELS[i];
    const cy = startY + i * (cardH + cardGap);
    const cx = leftMargin;

    // Skip out of visible bounds
    if (cy + cardH < containerY || cy > containerY + containerH) {
      continue;
    }

    const isHovered = mouseX >= cx && mouseX <= cx + cardW && mouseY >= cy && mouseY <= cy + cardH && mouseY >= containerY && mouseY <= containerY + containerH;
    const isCleared = state.clearedLevels && state.clearedLevels.has(level.id);

    push();
    // Card Drop Shadow
    noStroke();
    fill(0, 0, 0, 120);
    rect(cx + 2, cy + 4, cardW, cardH, 16);

    // Card Background (Reusing NPCShop item card visual style)
    if (isHovered) {
      fill(54, 82, 185);
      stroke(90, 155, 255, 180);
      strokeWeight(2);
    } else {
      fill(38, 46, 94);
      stroke(54, 66, 128, 90);
      strokeWeight(1);
    }

    rect(cx, cy, cardW, cardH, 16);

    // Card Content: Level Name
    textAlign(LEFT, TOP);
    textSize(18);
    noStroke();
    fill(255);
    text(level.name, cx + 20, cy + 18);

    // Tag Pill
    const nameW = textWidth(level.name);
    const pillX = cx + 20 + nameW + 12;
    const pillY = cy + 18;
    const tagText = (level.tag || 'MAP').toUpperCase();

    push();
    textSize(10);
    const tagW = textWidth(tagText) + 16;
    noStroke();
    fill(45, 90, 168);
    rect(pillX, pillY, tagW, 20, 5);
    fill(255);
    textAlign(CENTER, CENTER);
    text(tagText, pillX + tagW / 2, pillY + 10);
    pop();

    // Description text
    textSize(11.5);
    noStroke();
    fill(160, 175, 215);
    const descRightMargin = isHovered ? 125 : (isCleared ? 115 : 30);
    text(level.description, cx + 20, cy + 45, cardW - descRightMargin, 38);

    // Star Rating Display (1, 2, 3 stars)
    const isSandboxOrEmpty = level.id === 'sandbox' || level.id === 'empty' || level.tag === 'sandbox' || level.tag === 'empty';
    if (!isSandboxOrEmpty) {
      const starsEarned = state.levelStars ? (state.levelStars[level.id] || 0) : 0;
      const starStartX = cx + cardW - 84;
      const starY = cy + 20;
      const grapeSprite = state.assets['img_tx_goldengrape_front'];

      for (let sIdx = 0; sIdx < 3; sIdx++) {
        const isStarActive = sIdx < starsEarned;
        const sx = starStartX + sIdx * 24;
        push();
        translate(sx, starY);
        imageMode(CENTER);
        if (isStarActive) {
          if (grapeSprite) {
            image(grapeSprite, 0, 0, 20, 20);
          } else {
            fill(255, 215, 0);
            ellipse(0, 0, 16, 16);
          }
        } else {
          if (grapeSprite) {
            tint(65, 75, 120, 140);
            image(grapeSprite, 0, 0, 17, 17);
          } else {
            fill(65, 75, 120, 150);
            ellipse(0, 0, 13, 13);
          }
        }
        pop();
      }
    }

    // Right Side: Tactile PLAY Button on Hover, or Cleared Tag if cleared and unhovered
    if (isHovered) {
      const playBtnW = 92;
      const playBtnH = 40;
      const playBtnX = cx + cardW - playBtnW - 16;
      const playBtnY = cy + (cardH - playBtnH) / 2;

      drawYellowButton(playBtnX, playBtnY, playBtnW, playBtnH, "PLAY", {
        fontSize: 15,
        radius: 10,
        depth3D: 4,
        onClick: () => {
          state.selectedLevelInMenu = level.id;
          startLevel(level.id);
        }
      });
    } else if (isCleared) {
      // Cleared Text in yellow with purple shadow
      const clearX = cx + cardW - 60;
      const clearY = cy + cardH - 20;
      textAlign(CENTER, CENTER);
      textSize(21);

      noStroke();
      fill(80, 70, 150);
      text("Cleared", clearX + 2, clearY + 2);

      fill(255, 235, 90);
      text("Cleared", clearX, clearY);
    }

    pop();
  }

  if (dc) {
    dc.restore();
  }

  // Draw scrollbar indicator if needed
  if (totalCardsH > containerH) {
    const sbW = 4;
    const sbX = leftMargin + cardW + 6;
    const sbH = containerH;
    fill(255, 15);
    noStroke();
    rect(sbX, containerY, sbW, sbH, 2);
    const handleH = Math.max(20, (containerH / totalCardsH) * containerH);
    const handleY = containerY + map(state.mainMenuScrollY || 0, 0, maxScroll, 0, containerH - handleH);
    fill(90, 155, 255, 160);
    rect(sbX, handleY, sbW, handleH, 2);
  }

  // 5. Bottom Action Buttons: LEVEL EDITOR, IMPORT LEVEL & SETTINGS
  // Button 1: LEVEL EDITOR
  const btn1X = leftMargin;
  const btn1Y = bottomY;

  drawCyanButton(btn1X, btn1Y, singleBtnW, bottomBtnH, "LEVEL EDITOR", {
    id: "btn_menu_level_editor",
    fontSize: 12.5,
    radius: 10,
    depth3D: 4,
    onClick: () => {
      soundEngine.playSFX('btn_click');
      startLevelEditor();
    }
  });

  // Button 2: IMPORT LEVEL
  const btn2X = btn1X + singleBtnW + bottomBtnGap;
  const btn2Y = bottomY;

  drawPurpleButton(btn2X, btn2Y, singleBtnW, bottomBtnH, "IMPORT LEVEL", {
    id: "btn_menu_import_level",
    fontSize: 12.5,
    radius: 10,
    depth3D: 4,
    onClick: () => {
      soundEngine.playSFX('btn_click');
      triggerImportLevelJson();
    }
  });

  // Button 3: SETTINGS (PauseMenu settings modal in Main Menu)
  const btn3X = btn2X + singleBtnW + bottomBtnGap;
  const btn3Y = bottomY;

  drawDarkButton(btn3X, btn3Y, settingsBtnW, bottomBtnH, "⚙️", {
    id: "btn_menu_settings",
    fontSize: 18,
    radius: 10,
    depth3D: 4,
    onClick: () => {
      soundEngine.playSFX('pausemenu_btn');
      state.isPauseMenuOpen = true;
    }
  });

  pop();
}

// Touch & Drag interaction state for Main Menu Level List
let menuTouchStartY = 0;
let menuTouchLastY = 0;
let menuTouchStartScrollY = 0;
let menuIsDragging = false;
let menuTouchMovedDist = 0;

export function handleMainMenuPress(mx: number, my: number): void {
  menuTouchStartY = my;
  menuTouchLastY = my;
  menuTouchStartScrollY = state.mainMenuScrollY || 0;
  menuIsDragging = false;
  menuTouchMovedDist = 0;
  state.mainMenuScrollVelocity = 0;
}

export function handleMainMenuDrag(mx: number, my: number): boolean {
  const dy = my - menuTouchLastY;
  menuTouchMovedDist += Math.abs(dy);
  menuTouchLastY = my;

  if (menuTouchMovedDist > 6) {
    menuIsDragging = true;
  }

  if (menuIsDragging) {
    state.mainMenuScrollY = (state.mainMenuScrollY || 0) + dy;
    state.mainMenuScrollVelocity = dy * 0.75;
    return true;
  }
  return false;
}

export function handleMainMenuRelease(mx: number, my: number): boolean {
  if (menuIsDragging || menuTouchMovedDist > 8) {
    menuIsDragging = false;
    menuTouchMovedDist = 0;
    return true;
  }
  menuIsDragging = false;
  menuTouchMovedDist = 0;
  return handleMainMenuClick();
}

export function handleMainMenuClick(): boolean {
  refreshLevels();

  const leftMargin = Math.max(36, width * 0.045);
  const leftColumnW = Math.min(480, Math.max(340, width * 0.38));
  const topMargin = Math.max(32, height * 0.06);

  const cardW = leftColumnW;
  const cardH = 88;
  const cardGap = 14;

  const bottomBtnH = 42;
  const bottomBtnGap = 10;
  const singleBtnW = (cardW - bottomBtnGap) / 2;
  const bottomY = height - Math.max(28, height * 0.04) - bottomBtnH;

  const containerY = topMargin + 66;
  const containerH = Math.max(100, bottomY - containerY - 16);
  const startY = containerY + (state.mainMenuScrollY || 0);

  // 1. Check Level Card & PLAY Button Clicks
  if (mouseY >= containerY && mouseY <= containerY + containerH) {
    for (let i = 0; i < LEVELS.length; i++) {
      const level = LEVELS[i];
      const cy = startY + i * (cardH + cardGap);
      const cx = leftMargin;

      if (mouseX >= cx && mouseX <= cx + cardW && mouseY >= cy && mouseY <= cy + cardH) {
        state.selectedLevelInMenu = level.id;
        startLevel(level.id);
        return true;
      }
    }
  }

  // 2. Check Level Editor Button Click
  const btn1X = leftMargin;
  if (mouseX >= btn1X && mouseX <= btn1X + singleBtnW && mouseY >= bottomY && mouseY <= bottomY + bottomBtnH) {
    startLevelEditor();
    return true;
  }

  // 3. Check Import Level Button Click
  const btn2X = btn1X + singleBtnW + bottomBtnGap;
  if (mouseX >= btn2X && mouseX <= btn2X + singleBtnW && mouseY >= bottomY && mouseY <= bottomY + bottomBtnH) {
    triggerImportLevelJson((_data, cfg) => {
      state.selectedLevelInMenu = cfg.id;
    });
    return true;
  }

  // 4. Mini-game Interaction (spawn b_mainmenu bullet explosion & redirect enemies)
  handleMiniGameExplosion(mouseX, mouseY);
  return true;
}
