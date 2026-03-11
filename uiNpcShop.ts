
import { state } from './state';
import { turretTypes } from './balanceTurrets';
import { TYPE_MAP } from './assetTurret';
import { ShopFlyVFX } from './vfx/index';

declare const floor: any;
declare const dist: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const RIGHT: any;
declare const TOP: any;
declare const CENTER: any;
declare const BOTTOM: any;
declare const mouseX: any;
declare const mouseY: any;
declare const width: any;
declare const height: any;
declare const mouseIsPressed: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const lerp: any;
declare const line: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;
declare const ellipse: any;
declare const scale: any;
declare const constrain: any;
declare const map: any;
declare const sin: any;
declare const frameCount: any;
declare const abs: any;
declare const PI: any;

const PANEL_WIDTH = 320;
const SHOP_Y_START = 160; 
const CARD_HEIGHT = 60;  
const CARD_SPACING = 68; 

export function handleNpcUiPress() {
  if (!state.activeNPC || state.isAlmanacOpen || state.showUnlockPopup) return false;
  
  const currentX = lerp(width, width - PANEL_WIDTH, state.npcUiPanelPos);
  if (mouseX < currentX) return false;

  const npc = state.activeNPC;

  if (mouseY < SHOP_Y_START - 20) {
    return true;
  }

  if (mouseY >= SHOP_Y_START) {
    let curY = SHOP_Y_START + state.npcShopScrollY;
    for (const trade of npc.shop) {
      if (mouseX > currentX + 20 && mouseX < width - 20 && mouseY > curY && mouseY < curY + CARD_HEIGHT) {
        state.pressedTradeId = trade.id;
        state.npcShopPressPos = { x: mouseX, y: mouseY };
        state.npcShopScrollVelocity = 0; 
        return true;
      }
      curY += CARD_SPACING;
    }
  }
  return false;
}

export function handleNpcUiClick() {
  if (!state.activeNPC || state.isAlmanacOpen || state.showUnlockPopup) return false;
  
  const currentX = lerp(width, width - PANEL_WIDTH, state.npcUiPanelPos);
  if (mouseX < currentX) return false;

  const npc = state.activeNPC;
  const cfg = npc.config;
  const npcUid = npc.uid;

  // Check if it was a drag or a click
  const dragDist = state.npcShopPressPos ? dist(state.npcShopPressPos.x, state.npcShopPressPos.y, mouseX, mouseY) : 0;
  const isClick = dragDist < 10 && Math.abs(state.npcShopScrollVelocity) < 3;

  if (mouseY < SHOP_Y_START - 20 && isClick) {
    state.activeNpcDialogueIdx = (state.activeNpcDialogueIdx + 1) % cfg.dialogue.length;
    state.npcDialogueJump = 10; 
    return true;
  }

  if (mouseY >= SHOP_Y_START && isClick) {
    if (!state.npcStock[npcUid]) state.npcStock[npcUid] = {};
    const stockMap = state.npcStock[npcUid];

    let curY = SHOP_Y_START + state.npcShopScrollY;

    // Use NPC instance shop instead of global config shop
    for (const trade of npc.shop) {
      if (state.pressedTradeId === trade.id && mouseX > currentX + 20 && mouseX < width - 20 && mouseY > curY && mouseY < curY + CARD_HEIGHT) {
        const purchasedCount = stockMap[trade.id] || 0;
        const stockRemaining = trade.stockCount === -1 ? 999 : (trade.stockCount - purchasedCount);

        if (stockRemaining <= 0) return true;

        let canAfford = true;
        for (const [currency, amount] of Object.entries(trade.cost)) {
          const costVal = amount as number;
          if (currency === 'sun' && state.sunCurrency < costVal) canAfford = false;
          if (currency === 'soil' && state.soilCurrency < costVal) canAfford = false;
          if (currency === 'elixir' && state.elixirCurrency < costVal) canAfford = false;
          if (currency === 'raisin' && state.raisinCurrency < costVal) canAfford = false;
          if (currency === 'leaf' && state.leafCurrency < costVal) canAfford = false;
          if (currency === 'shard' && state.shardCurrency < costVal) canAfford = false;
          if (currency === 'shell' && state.shellCurrency < costVal) canAfford = false;
          if (currency === 'fuel' && state.fuelCurrency < costVal) canAfford = false;
          if (currency === 'ice' && state.iceCurrency < costVal) canAfford = false;
        }

        if (canAfford) {
          for (const [currency, amount] of Object.entries(trade.cost)) {
            const costVal = amount as number;
            if (currency === 'sun') state.sunCurrency -= costVal;
            if (currency === 'soil') state.soilCurrency -= costVal;
            if (currency === 'elixir') state.elixirCurrency -= costVal;
            if (currency === 'raisin') state.raisinCurrency -= costVal;
            if (currency === 'leaf') state.leafCurrency -= costVal;
            if (currency === 'shard') state.shardCurrency -= costVal;
            if (currency === 'shell') state.shellCurrency -= costVal;
            if (currency === 'fuel') state.fuelCurrency -= costVal;
            if (currency === 'ice') state.iceCurrency -= costVal;
          }

          stockMap[trade.id] = purchasedCount + 1;
          npc.triggerPurchaseAnim();

          if (trade.outputBehavior === 'giveItem') {
            const amount = trade.itemAmount || 1;
            if (trade.itemType === 'turret') {
              state.inventory.items[trade.itemKey] = (state.inventory.items[trade.itemKey] || 0) + amount;
              for (let i = 0; i < amount; i++) {
                state.inventory.specList.push({ key: trade.itemKey, type: 'turret', timestamp: Date.now() });
              }
              state.totalTurretsAcquired += amount;
            } else if (trade.itemType === 'resource') {
              if (trade.itemKey === 'sun') state.sunCurrency += amount;
              if (trade.itemKey === 'soil') state.soilCurrency += amount;
              if (trade.itemKey === 'elixir') state.elixirCurrency += amount;
              if (trade.itemKey === 'raisin') state.raisinCurrency += amount;
              if (trade.itemKey === 'leaf') state.leafCurrency += amount;
              if (trade.itemKey === 'shard') state.shardCurrency += amount;
              if (trade.itemKey === 'shell') state.shellCurrency += amount;
              if (trade.itemKey === 'fuel') state.fuelCurrency += amount;
              if (trade.itemKey === 'ice') state.iceCurrency += amount;
            }

            state.uiAlpha = 255;
            const startX = currentX + 60;
            const startY = curY + CARD_HEIGHT / 2;
            const targetX = 60;
            const targetY = 160; 
            const assetKey = trade.itemAssetImg || `img_${TYPE_MAP[trade.itemKey]}_front`;
            state.uiVfx.push(new ShopFlyVFX(startX, startY, targetX, targetY, assetKey));
          } else {
            // Drop as loot - player must collect it
            // Acquisition tracking happens in player collection logic for loot
            npc.spawnTradeLoot(trade);
            state.uiAlpha = 255;
          }
        }
        return true;
      }
      curY += CARD_SPACING;
    }
  }

  return false;
}

export function drawNPCPanel() {
  state.npcUiPanelPos = lerp(state.npcUiPanelPos || 0, state.activeNPC ? 1 : 0, 0.12);
  if (state.npcUiPanelPos < 0.01) return;

  const currentX = lerp(width, width - PANEL_WIDTH, state.npcUiPanelPos);

  const npc = state.activeNPC;
  const cfg = npc?.config;
  const npcUid = npc?.uid;

  push();
  translate(currentX, 0);

  fill(27, 31, 57, 255);
  noStroke();
  rect(0, 0, PANEL_WIDTH, height);
  fill(54, 62, 114);
  rect(0, 0, 6, height);

  if (npc && cfg) {
    const jumpOffset = state.npcDialogueJump || 0;
    state.npcDialogueJump = lerp(state.npcDialogueJump || 0, 0, 0.2);

    const sprite = state.assets[`img_${cfg.assetKey}_front`];
    if (sprite) {
      push();
      translate(60, 70 - jumpOffset);
      
      // Panel Asset Animations
      const idleHover = sin(state.frames * 0.04) * 3;
      const purchaseJump = npc.purchaseAnimTimer > 0 ? -abs(sin((1 - npc.purchaseAnimTimer/20) * PI)) * 15 : 0;
      
      translate(0, idleHover + purchaseJump);
      
      imageMode(CENTER);
      image(sprite, 0, 0, 180, 180);
      pop();
    }

    fill(255, 235, 90);
    textAlign(LEFT, TOP);
    textSize(18);
    text(cfg.name, 125, 20);

    const dialogue = cfg.dialogue[state.activeNpcDialogueIdx % cfg.dialogue.length];
    fill(40, 47, 96);
    rect(120, 45, PANEL_WIDTH - 135, 75, 12);
    fill(255);
    textSize(11);
    text(dialogue, 132, 55, PANEL_WIDTH - 155);

    stroke(255, 230, 100, 100);
    strokeWeight(1);
    line(20, 135, PANEL_WIDTH - 20, 135);
    noStroke();

    fill(255, 235, 90, 180);
    textAlign(LEFT, TOP);
    textSize(10);
    text("TRADES", 20, 142);

    const VIEWPORT_Y = SHOP_Y_START;
    const VIEWPORT_H = height - VIEWPORT_Y - 20;
    
    // Total content depends on the instance shop length
    const totalContentH = npc.shop.length * CARD_SPACING;
    const maxScroll = Math.min(0, VIEWPORT_H - totalContentH);

    if (mouseIsPressed && mouseX > currentX && mouseY > VIEWPORT_Y) {
        state.npcShopScrollVelocity = (mouseY - (window as any).pmouseY);
    } else {
        state.npcShopScrollVelocity *= 0.92;
    }
    state.npcShopScrollY += state.npcShopScrollVelocity;
    state.npcShopScrollY = constrain(state.npcShopScrollY, maxScroll, 0);

    const dc = (window as any).drawingContext;
    dc.save();
    dc.beginPath();
    dc.rect(0, VIEWPORT_Y, PANEL_WIDTH, VIEWPORT_H);
    dc.clip();

    const CARD_WIDTH = PANEL_WIDTH - 40;
    let curY = VIEWPORT_Y + state.npcShopScrollY;
    const stockMap = state.npcStock[npcUid] || {};

    // Use NPC instance shop
    for (const trade of npc.shop) {
      if (curY + CARD_HEIGHT < VIEWPORT_Y || curY > VIEWPORT_Y + VIEWPORT_H) {
         curY += CARD_SPACING;
         continue;
      }

      const purchasedCount = stockMap[trade.id] || 0;
      const stockRemaining = trade.stockCount === -1 ? 999 : trade.stockCount - purchasedCount;
      const outOfStock = stockRemaining <= 0;
      const isPressed = state.pressedTradeId === trade.id;
      const hov = !outOfStock && mouseX > currentX + 20 && mouseX < width - 20 && mouseY > curY && mouseY < curY + CARD_HEIGHT;

      push();
      translate(20, curY + (isPressed ? 1 : 0));
      
      if (!isPressed) {
        fill(0, 0, 0, 100);
        rect(2, 4, CARD_WIDTH, CARD_HEIGHT, 12);
      }
      if (isPressed) scale(0.99);

      const cardBg = outOfStock ? [35, 40, 70] : (hov ? [60, 70, 150] : [40, 47, 96]);
      fill(cardBg[0], cardBg[1], cardBg[2], 255);
      noStroke();
      rect(0, 0, CARD_WIDTH, CARD_HEIGHT, 12);

      fill(27, 31, 57, 180);
      //ellipse(35, CARD_HEIGHT / 2, 45, 45);

      let itemAsset = null;
      if (trade.itemType === 'resource') {
        itemAsset = state.assets[`img_icon_${trade.itemKey}`];
      } else {
        const tCfg = turretTypes[trade.itemKey];
        const assetKey = trade.itemAssetImg || (tCfg ? `img_${TYPE_MAP[trade.itemKey]}_front` : null);
        itemAsset = assetKey ? state.assets[assetKey] : null;
      }

      if (itemAsset) {
        imageMode(CENTER);
        if (outOfStock) tint(100, 150);
        image(itemAsset, 35, CARD_HEIGHT / 2, 64, 64);
        noTint();
      }

      const tCfg = turretTypes[trade.itemKey];
      const amountPrefix = (trade.itemAmount && trade.itemAmount > 1) ? `${trade.itemAmount}x ` : "";
      let displayName = trade.itemName || tCfg?.name || trade.itemKey;
      if (trade.tradeType === 'randomT2' && !trade.itemKey) displayName = "? T2 Turret";
      if (trade.tradeType === 'randomT3' && !trade.itemKey) displayName = "? T3 Turret";
      fill(outOfStock ? 90 : 255);
      textSize(14);
      text(amountPrefix + displayName, 70, 10);

      fill(outOfStock ? 90 : 200);
      textSize(10);
      // User requested: don't mention "(drop)" in item description
      text(trade.itemDescription || tCfg?.tooltip || "", 70, 26, CARD_WIDTH - 130);

      if (!outOfStock) {
        textAlign(RIGHT, CENTER);
        let costOff = 0;
        // Get original trade config to see if it was a range
        const originalTrade = npc.config.shop.find((t: any) => t.id === trade.id);

        for (const [currency, amount] of Object.entries(trade.cost)) {
          const iconKey = `img_icon_${currency}`;
          const icon = state.assets[iconKey];
          let canAfford = true;
          const costVal = amount as number;
          
          if (currency === 'sun' && state.sunCurrency < costVal) canAfford = false;
          if (currency === 'soil' && state.soilCurrency < costVal) canAfford = false;
          if (currency === 'elixir' && state.elixirCurrency < costVal) canAfford = false;
          if (currency === 'raisin' && state.raisinCurrency < costVal) canAfford = false;
          if (currency === 'leaf' && state.leafCurrency < costVal) canAfford = false;
          if (currency === 'shard' && state.shardCurrency < costVal) canAfford = false;
          if (currency === 'shell' && state.shellCurrency < costVal) canAfford = false;
          if (currency === 'fuel' && state.fuelCurrency < costVal) canAfford = false;
          if (currency === 'ice' && state.iceCurrency < costVal) canAfford = false;

          if (icon) {
            imageMode(CENTER);
            image(icon, CARD_WIDTH - 40 - costOff, 20, 32, 32);
            noTint();
          }
          fill(canAfford ? [255, 235, 90] : [255, 100, 100]);
          textSize(14);
          
          let costText = costVal.toString();
          text(costText, CARD_WIDTH - 12 - costOff, 20);
          costOff += 40; // Reverted spacing since we don't show ranges
        }
      }

      if (trade.stockCount !== -1) {
        textAlign(RIGHT, BOTTOM);
        textSize(9);
        if (outOfStock) {
          fill(255, 120, 120, 180);
          text("OUT OF STOCK", CARD_WIDTH - 12, CARD_HEIGHT - 8);
        } else {
          fill(120, 255, 170, 150);
          text(`${stockRemaining} LEFT`, CARD_WIDTH - 12, CARD_HEIGHT - 8);
        }
      }
      pop();
      curY += CARD_SPACING;
    }
    dc.restore();

    if (totalContentH > VIEWPORT_H) {
      const sbW = 3;
      const sbX = PANEL_WIDTH - 8;
      fill(255, 15);
      rect(sbX, VIEWPORT_Y, sbW, VIEWPORT_H, 2);
      const handleH = (VIEWPORT_H / totalContentH) * VIEWPORT_H;
      const handleY = VIEWPORT_Y + map(state.npcShopScrollY, 0, maxScroll, 0, VIEWPORT_H - handleH);
      fill(255, 235, 90, 100);
      rect(sbX, handleY, sbW, handleH, 2);
    }
  }

  pop();
}
