
import { state } from '../../state';
import { turretTypes } from '../../balanceTurrets';
import { TYPE_MAP } from '../../assetTurret';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const noFill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const ellipse: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const CENTER: any;
declare const LEFT: any;
declare const image: any;
declare const imageMode: any;
declare const textWidth: any;
declare const sin: any;
declare const frameCount: any;

/**
 * Draws a bright yellow circle highlight behind a turret.
 * Used for selected or previewing turrets.
 */
export function drawSelectionHighlight(x: number, y: number, size: number, alpha: number = 255) {
  push();
  translate(x, y);
  noStroke();
  const pulse = 1.0 + 0.1 * sin(frameCount * 0.2);
  // Outer glow
  fill(255, 255, 100, alpha * 0.5);
  ellipse(0, 0, size * 1.8);
  // Inner highlight
  fill(255, 255, 150, alpha * 1);
  ellipse(0, 0, size * 1.3);
  pop();
}

/**
 * Draws a white bubble chat with the output turret and cost.
 * The bubble color changes based on affordability and confirmation state.
 */
export function drawMergeBubble(x: number, y: number, outputType: string, cost: number, canAfford: boolean, isConfirming: boolean, alpha: number = 255) {
  const config = turretTypes[outputType];
  if (!config) return;

  push();
  translate(x, y);
  
  const bubbleW = 25;
  const bubbleH = 20;
  const bubbleY = -20; // Position above the turret
  
  // Determine bubble color
  let bgColor = [255, 255, 255]; // Default white
  if (!canAfford) {
    bgColor = [255, 100, 100]; // Light red
  } else if (isConfirming) {
    bgColor = [255, 255, 100]; // Light yellow
  }
  
  // Draw bubble tail
  fill(bgColor[0], bgColor[1], bgColor[2], alpha);
  noStroke();
  triangle(0, bubbleY + bubbleH/2 + 5, -5, bubbleY + bubbleH/2 - 5, 5, bubbleY + bubbleH/2 - 5);
  
  // Draw bubble body
  rectMode(CENTER);
  noStroke();
  rect(0, bubbleY, bubbleW, bubbleH, 4);
  
  // Draw output turret icon
  const spriteKey = `img_${TYPE_MAP[outputType]}_front`;
  const sprite = state.assets[spriteKey] || state.assets[`img_${TYPE_MAP[outputType]}`];
  if (sprite) {
    imageMode(CENTER);
    image(sprite, 0, bubbleY-6, 20, 20);
  }
  
  // Draw cost with sun icon
  const costText = `${cost}`;
  textSize(6);
  const tw = textWidth(costText) + 14;
  const costY = bubbleY + 5;
  
  const sunIcon = state.assets['img_icon_sun'];
  if (sunIcon) {
    image(sunIcon, -tw/2 + 6, costY, 14, 14);
  }
  
  fill(0);
  noStroke();
  textAlign(LEFT, CENTER);
  text(costText, -tw/2 + 10, costY);
  
  pop();
}

declare const triangle: any;
declare const rectMode: any;
