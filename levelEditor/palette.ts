import { state } from '../state';
import { obstacleTypes, overlayTypes } from '../balanceObstacles';
import { liquidTypes } from '../balanceLiquids';
import { groundFeatureTypes } from '../balanceGroundFeatures';
import { enemyTypes } from '../balanceEnemies';
import { npcTypes } from '../balanceNPC';
import { lootTypes } from '../balanceLootTable';
import { turretTypes } from '../balanceTurrets';
import { TYPE_MAP } from '../assetTurret';
import { PaletteItem } from './types';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const noStroke: any;
declare const rect: any;
declare const ellipse: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const RIGHT: any;
declare const BOTTOM: any;
declare const image: any;
declare const imageMode: any;

export function getAllPaletteItems(): PaletteItem[] {
  const items: PaletteItem[] = [];

  // 1. Obstacles
  for (const key of Object.keys(obstacleTypes)) {
    items.push({
      key,
      name: obstacleTypes[key].name || key,
      category: 'obstacles',
      desc: obstacleTypes[key].desc || '',
      color: obstacleTypes[key].color
    });
  }

  // 2. Overlays
  for (const key of Object.keys(overlayTypes)) {
    items.push({
      key,
      name: overlayTypes[key].name || key,
      category: 'overlays',
      desc: overlayTypes[key].desc || ''
    });
  }

  // 3. Liquids
  for (const key of Object.keys(liquidTypes)) {
    items.push({
      key,
      name: liquidTypes[key].name || key,
      category: 'liquids',
      desc: liquidTypes[key].desc || '',
      color: liquidTypes[key].color
    });
  }

  // 4. Ground Features
  for (const key of Object.keys(groundFeatureTypes)) {
    items.push({
      key,
      name: groundFeatureTypes[key].name || key,
      category: 'groundFeatures',
      desc: groundFeatureTypes[key].desc || '',
      color: groundFeatureTypes[key].color
    });
  }

  // 5. Entities
  items.push({
    key: 'player_spawn',
    name: 'Player Core',
    category: 'entities',
    subCategory: 'Player',
    desc: 'Player starting point'
  });

  for (const key of Object.keys(enemyTypes)) {
    items.push({
      key,
      name: key.replace(/^e_/, '').toUpperCase(),
      category: 'entities',
      subCategory: 'Enemies',
      desc: enemyTypes[key].desc || '',
      color: enemyTypes[key].col
    });
  }

  for (const key of Object.keys(npcTypes)) {
    items.push({
      key,
      name: npcTypes[key].name || key,
      category: 'entities',
      subCategory: 'NPCs',
      desc: npcTypes[key].description || '',
      icon: npcTypes[key].assetKey
    });
  }

  for (const key of Object.keys(lootTypes)) {
    items.push({
      key,
      name: key.toUpperCase() + ' Drop',
      category: 'entities',
      subCategory: 'Loot',
      desc: `${key.toUpperCase()} resource drop`,
      icon: lootTypes[key].idleAssetImg
    });
  }

  // 6. Turrets
  for (const key of Object.keys(turretTypes)) {
    items.push({
      key,
      name: turretTypes[key].name || key,
      category: 'turrets',
      desc: turretTypes[key].desc || ''
    });
  }

  // 7. Flags
  items.push({
    key: 'isWinCondition',
    name: 'WinCondition',
    category: 'flags',
    desc: 'Target boss or win condition entity'
  });

  return items;
}

export function renderPaletteItemIcon(item: PaletteItem, px: number, py: number, size: number) {
  push();
  translate(px, py);

  if (item.category === 'obstacles') {
    const cfg = obstacleTypes[item.key];
    const idleAsset = cfg?.assetImgConfig?.idleAssetImg?.[0];
    const tilesetAsset = 'img_tileset_' + item.key.replace(/^o_/, '');
    if (idleAsset && state.assets[idleAsset]) {
      imageMode(CENTER);
      image(state.assets[idleAsset], 0, 0, size, size);
    } else if (state.assets[tilesetAsset] || state.assets[tilesetAsset + '_v2']) {
      const tsImg = state.assets[tilesetAsset + '_v2'] || state.assets[tilesetAsset];
      imageMode(CENTER);
      if (tsImg.width >= 256) {
        const tileSize = tsImg.width / 4;
        image(tsImg, 0, 0, size, size, 2 * tileSize, 1 * tileSize, tileSize, tileSize);
      } else {
        image(tsImg, 0, 0, size, size);
      }
    } else if (cfg) {
      fill(cfg.color ? cfg.color : [120, 100, 80]);
      stroke(cfg.borderColor ? cfg.borderColor : [160, 140, 120]);
      strokeWeight(2);
      rect(-size / 2, -size / 2, size, size, 4);
    }
  } else if (item.category === 'overlays') {
    const cfg = overlayTypes[item.key];
    const idleAsset = cfg?.assetImgConfig?.idleAssetImg?.[0];
    const spawnerAsset = (item.key === 'ov_spawner_a' || item.key === 'ov_spawner_custom' || cfg?.isEnemySpawner || cfg?.isCustomPrefab) ? 'img_spawner_a' : null;
    const tntAsset = item.key === 'ov_tnt' ? 'img_tnt_a' : null;
    const chestAsset = item.key === 'ov_chest' ? 'img_treasurechest' : null;
    const assetKey = idleAsset || spawnerAsset || tntAsset || chestAsset;

    if (assetKey && state.assets[assetKey]) {
      imageMode(CENTER);
      image(state.assets[assetKey], 0, 0, size, size);
      if (item.key === 'ov_spawner_custom' || cfg?.isCustomPrefab) {
        fill(255, 200, 50);
        noStroke();
        textSize(8);
        textAlign(RIGHT, BOTTOM);
        text('⚙', size / 2, size / 2);
      }
    } else {
      fill(255, 180, 50);
      noStroke();
      ellipse(0, 0, size * 0.8);
    }
  } else if (item.category === 'liquids') {
    const cfg = liquidTypes[item.key];
    fill(cfg ? cfg.color : [50, 100, 200]);
    noStroke();
    rect(-size / 2, -size / 2, size, size, 6);
  } else if (item.category === 'groundFeatures') {
    const cfg = groundFeatureTypes[item.key];
    fill(cfg && cfg.color ? cfg.color : [255, 100, 50]);
    noStroke();
    ellipse(0, 0, size * 0.8);
  } else if (item.category === 'entities') {
    if (item.key === 'player_spawn') {
      const sprite = state.assets['img_player_front_right'] || state.assets['img_core'];
      if (sprite) {
        imageMode(CENTER);
        image(sprite, 0, 0, size, size);
      } else {
        fill(0, 220, 255);
        ellipse(0, 0, size * 0.8);
      }
    } else {
      const enemySpriteKey = 'img_' + item.key.replace(/^e_/, '');
      const npcKey = npcTypes[item.key]?.assetKey;
      const npcSpriteKey = npcKey ? `img_${npcKey}_front` : null;

      if (state.assets[enemySpriteKey]) {
        imageMode(CENTER);
        image(state.assets[enemySpriteKey], 0, 0, size, size);
      } else if (npcSpriteKey && state.assets[npcSpriteKey]) {
        imageMode(CENTER);
        image(state.assets[npcSpriteKey], 0, 0, size, size);
      } else if (item.icon && state.assets[item.icon]) {
        imageMode(CENTER);
        image(state.assets[item.icon], 0, 0, size, size);
      } else if (item.color) {
        fill(item.color[0], item.color[1], item.color[2]);
        noStroke();
        ellipse(0, 0, size * 0.8);
      } else {
        fill(180, 180, 200);
        ellipse(0, 0, size * 0.8);
      }
    }
  } else if (item.category === 'turrets') {
    const mapKey = TYPE_MAP[item.key] || item.key;
    const sprite = state.assets[`img_t_${mapKey}_front`] || state.assets[`img_t0_${mapKey}_front`] || state.assets[`img_${mapKey}_front`];
    if (sprite) {
      imageMode(CENTER);
      image(sprite, 0, 0, size, size);
    } else {
      fill(100, 220, 150);
      ellipse(0, 0, size * 0.8);
    }
  } else if (item.category === 'flags') {
    push();
    fill(255, 215, 0);
    noStroke();
    textSize(size * 0.75);
    textAlign(CENTER, CENTER);
    text('👑', 0, 0);
    pop();
  }

  pop();
}
