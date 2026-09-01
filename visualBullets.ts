import { state } from './state';

declare const push: any;
declare const pop: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const line: any;
declare const image: any;
declare const imageMode: any;
declare const CENTER: any;
declare const translate: any;
declare const rotate: any;
declare const atan2: any;
declare const sin: any;
declare const PI: any;
declare const fill: any;
declare const noStroke: any;
declare const ellipse: any;

/**
 * Converts any bullet color format (Array [r,g,b], [r,g,b,a], hex, p5.Color, number)
 * into a valid Canvas2D CSS color string.
 */
export function toColorString(col: any, defaultAlpha: number = 1): string {
  if (!col) return '#ffcc00';

  if (Array.isArray(col)) {
    const r = col[0] ?? 255;
    const g = col[1] ?? 255;
    const b = col[2] ?? 255;
    const a = col[3] !== undefined ? (col[3] > 1 ? col[3] / 255 : col[3]) : defaultAlpha;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  if (typeof col === 'string') {
    if (col.startsWith('#') || col.startsWith('rgb') || col.startsWith('hsl')) {
      return col;
    }
    // Comma-separated "r,g,b" string
    if (col.includes(',')) {
      return `rgb(${col})`;
    }
    return col;
  }

  if (typeof col === 'number') {
    return `rgb(${col}, ${col}, ${col})`;
  }

  // p5.Color object with levels array
  if (col && Array.isArray(col.levels)) {
    const r = col.levels[0];
    const g = col.levels[1];
    const b = col.levels[2];
    const a = col.levels[3] !== undefined ? col.levels[3] / 255 : defaultAlpha;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  if (typeof col.toString === 'function') {
    const str = col.toString();
    if (str && (str.startsWith('#') || str.startsWith('rgb') || str.startsWith('hsl'))) {
      return str;
    }
    if (str && str.includes(',')) {
      return `rgb(${str})`;
    }
  }

  return '#ffcc00';
}

/**
 * Extracts custom sprite key if present on bullet or its config
 */
export function getBulletSpriteKey(b: any): string | null {
  if (!b) return null;
  return (
    b.config?.assetImg ||
    b.config?.idleAssetImg ||
    b.config?.bulletAssetImg ||
    b.assetImg ||
    b.idleAssetImg ||
    b.config?.sprite ||
    null
  );
}

/**
 * Single bullet fallback renderer (using p5/canvas matrix)
 */
export function drawBullet(b: any) {
  if (isNaN(b.pos.x) || isNaN(b.prevPos.x)) return;

  const spriteKey = getBulletSpriteKey(b);
  const sprite = spriteKey ? state.assets[spriteKey] : null;
  const angle = atan2(b.pos.y - b.prevPos.y, b.pos.x - b.prevPos.x);
  const bulletSize = b.config?.bulletSize || 6;
  const bulletColorStr = toColorString(b.col || b.config?.bulletColor, 1);

  if (b.config?.highArcConfig) {
    const travelTime = b.config.highArcConfig.arcTravelTime;
    const progress = 1.0 - (b.life / travelTime);
    const arcHeight = b.config.highArcConfig.arcHeight;

    const arcVisualOffset = sin(progress * PI);
    const visualScale = 1.0 + arcVisualOffset * 1.5;

    const shadowScale = 1.0 - (arcVisualOffset * 0.6);
    const shadowAlpha = 50 * (1.0 - arcVisualOffset * 0.4);

    // Draw shadow on ground
    push();
    translate(b.pos.x, b.pos.y);
    fill(0, shadowAlpha);
    noStroke();
    ellipse(0, 0, bulletSize * 3 * shadowScale, bulletSize * 1.5 * shadowScale);
    pop();

    // Draw elevated projectile
    push();
    translate(b.pos.x, b.pos.y - arcVisualOffset * arcHeight);
    rotate(angle + (b.rotation || 0));
    if (sprite) {
      imageMode(CENTER);
      image(sprite, 0, 0, bulletSize * 2.5 * visualScale, bulletSize * 2.5 * visualScale);
    } else {
      stroke(bulletColorStr);
      strokeWeight(bulletSize * visualScale);
      const halfLen = (b.config.bulletLength || 10) / 2;
      line(-halfLen, 0, halfLen, 0);
    }
    pop();
    return;
  }

  if (sprite) {
    push();
    translate(b.pos.x, b.pos.y);
    rotate(angle + (b.rotation || 0));
    imageMode(CENTER);
    image(sprite, 0, 0, bulletSize * 2.5, bulletSize * 2.5);
    pop();
  } else {
    push();
    stroke(bulletColorStr);
    strokeWeight(bulletSize);
    line(b.prevPos.x, b.prevPos.y, b.pos.x, b.pos.y);

    stroke(255, 255, 255, 200);
    strokeWeight(Math.max(1, bulletSize * 0.4));
    line(b.prevPos.x, b.prevPos.y, b.pos.x, b.pos.y);
    pop();
  }
}

/**
 * High-Performance Batched Bullet Renderer
 * Eliminates thousands of push/pop matrix calls per frame, groups tracers by color,
 * and batches sprite draws efficiently.
 */
export function drawBatchedBullets(bullets: any[], vp: any) {
  if (!bullets || bullets.length === 0) return;
  const ctx = (window as any).drawingContext as CanvasRenderingContext2D;
  if (!ctx) {
    for (let i = bullets.length - 1; i >= 0; i--) {
      bullets[i].display();
    }
    return;
  }

  const arcBullets: any[] = [];
  const spriteMap = new Map<string, any[]>();
  const colorBuckets = new Map<string, any[]>();

  // 1. Cull and categorize
  for (let i = 0; i < bullets.length; i++) {
    const b = bullets[i];
    if (isNaN(b.pos.x) || isNaN(b.prevPos.x)) continue;

    if (vp && vp.maxX !== undefined) {
      if (b.pos.x < vp.minX - 40 || b.pos.x > vp.maxX + 40 || b.pos.y < vp.minY - 40 || b.pos.y > vp.maxY + 40) {
        continue;
      }
    }

    const spriteKey = getBulletSpriteKey(b);
    if (b.config?.highArcConfig) {
      arcBullets.push(b);
    } else if (spriteKey) {
      let group = spriteMap.get(spriteKey);
      if (!group) {
        group = [];
        spriteMap.set(spriteKey, group);
      }
      group.push(b);
    } else {
      const colorStr = toColorString(b.col || b.config?.bulletColor, 1);
      let group = colorBuckets.get(colorStr);
      if (!group) {
        group = [];
        colorBuckets.set(colorStr, group);
      }
      group.push(b);
    }
  }

  // 2. Render Arc Bullets Pass (Shadows first, then elevated bodies)
  if (arcBullets.length > 0) {
    // Ground shadows batch
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    for (const b of arcBullets) {
      const travelTime = b.config.highArcConfig.arcTravelTime || 60;
      const progress = 1.0 - (b.life / travelTime);
      const arcVisualOffset = Math.sin(progress * Math.PI);
      const shadowScale = 1.0 - (arcVisualOffset * 0.6);
      const bSize = b.config.bulletSize || 8;
      const rx = (bSize * 1.5 * shadowScale) || 8;
      const ry = (bSize * 0.75 * shadowScale) || 4;
      ctx.ellipse(b.pos.x, b.pos.y, rx, ry, 0, 0, Math.PI * 2);
    }
    ctx.fill();

    // Elevated bodies
    for (const b of arcBullets) {
      const travelTime = b.config.highArcConfig.arcTravelTime || 60;
      const progress = 1.0 - (b.life / travelTime);
      const arcHeight = b.config.highArcConfig.arcHeight || 50;
      const arcVisualOffset = Math.sin(progress * Math.PI);
      const visualScale = 1.0 + arcVisualOffset * 1.5;
      const angle = Math.atan2(b.pos.y - b.prevPos.y, b.pos.x - b.prevPos.x) + (b.rotation || 0);
      const elevatedY = b.pos.y - arcVisualOffset * arcHeight;
      const spriteKey = getBulletSpriteKey(b);
      const sprite = spriteKey ? state.assets[spriteKey] : null;
      const bSize = b.config.bulletSize || 8;

      ctx.save();
      ctx.translate(b.pos.x, elevatedY);
      ctx.rotate(angle);
      if (sprite && ((sprite as any).canvas || (sprite as any).elt || sprite)) {
        const imgSource = (sprite as any).canvas || (sprite as any).elt || sprite;
        const renderW = bSize * 2.5 * visualScale;
        ctx.drawImage(imgSource, -renderW / 2, -renderW / 2, renderW, renderW);
      } else {
        ctx.strokeStyle = toColorString(b.col || b.config?.bulletColor, 1);
        ctx.lineWidth = bSize * visualScale;
        ctx.lineCap = 'round';
        ctx.beginPath();
        const halfLen = (b.config.bulletLength || 10) / 2;
        ctx.moveTo(-halfLen, 0);
        ctx.lineTo(halfLen, 0);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // 3. Render Line / Tracer Bullets (Grouped by color bucket for minimal stroke state switches)
  if (colorBuckets.size > 0) {
    ctx.lineCap = 'round';

    // Pass 3a: Outer colored bullet bodies
    colorBuckets.forEach((group, colorStr) => {
      ctx.strokeStyle = colorStr;
      for (let i = 0; i < group.length; i++) {
        const b = group[i];
        ctx.lineWidth = b.config?.bulletSize || 4;
        ctx.beginPath();
        ctx.moveTo(b.prevPos.x, b.prevPos.y);
        ctx.lineTo(b.pos.x, b.pos.y);
        ctx.stroke();
      }
    });

    // Pass 3b: Inner bright core (single batch path!)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    colorBuckets.forEach((group) => {
      for (let i = 0; i < group.length; i++) {
        const b = group[i];
        ctx.moveTo(b.prevPos.x, b.prevPos.y);
        ctx.lineTo(b.pos.x, b.pos.y);
      }
    });
    ctx.stroke();
  }

  // 4. Render Sprite-based Bullets (Grouped by texture asset)
  if (spriteMap.size > 0) {
    spriteMap.forEach((bulletGroup, spriteKey) => {
      const asset = state.assets[spriteKey];
      if (!asset) return;
      const imgSource = (asset as any).canvas || (asset as any).elt || asset;
      if (!imgSource) return;

      for (let i = 0; i < bulletGroup.length; i++) {
        const b = bulletGroup[i];
        const angle = Math.atan2(b.pos.y - b.prevPos.y, b.pos.x - b.prevPos.x) + (b.rotation || 0);
        const renderSize = (b.config?.bulletSize || 8) * 2.5;

        ctx.save();
        ctx.translate(b.pos.x, b.pos.y);
        ctx.rotate(angle);
        ctx.drawImage(imgSource, -renderSize / 2, -renderSize / 2, renderSize, renderSize);
        ctx.restore();
      }
    });
  }
}
