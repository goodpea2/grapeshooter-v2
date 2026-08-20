
import { state } from '../state';
import { TurretClass } from '../src/upgrades';

declare const image: any;
declare const text: any;
declare const textWidth: any;
declare const push: any;
declare const pop: any;
declare const translate: any;
declare const textAlign: any;
declare const textSize: any;
declare const fill: any;
declare const LEFT: any;
declare const CENTER: any;
declare const imageMode: any;

export const CLASS_ICON_MAP: Record<string, string> = {
  [TurretClass.SHOOTER]: 'img_icon_class_shooter',
  [TurretClass.MINER]: 'img_icon_class_miner',
  [TurretClass.ARMOR]: 'img_icon_class_armor',
  [TurretClass.EXPLOSIVE]: 'img_icon_class_explode',
  [TurretClass.ICE]: 'img_icon_class_ice',
  [TurretClass.STALL]: 'img_icon_class_stall',
  [TurretClass.PLAYER]: 'img_player_front_right'
};

/**
 * Draws text with embedded icons like <shooter>, <miner>, etc.
 */
export function drawRichText(str: string, x: number, y: number, maxWidth: number, size: number, color: any) {
  push();
  translate(x, y);
  textSize(size);
  fill(color);
  textAlign(LEFT, CENTER);
  imageMode(CENTER);

  const tokens = str.split(/(<[^>]+>)/g);
  let cursorX = 0;
  let cursorY = 0;
  const lineHeight = size * 1.4;

  for (const token of tokens) {
    if (token.startsWith('<') && token.endsWith('>')) {
      const className = token.slice(1, -1) as TurretClass;
      const iconKey = CLASS_ICON_MAP[className];
      const icon = state.assets[iconKey];
      
      if (icon) {
        const iconSize = size * 1.2;
        if (cursorX + iconSize > maxWidth) {
          cursorX = 0;
          cursorY += lineHeight;
        }
        image(icon, cursorX + iconSize / 2, cursorY, iconSize, iconSize);
        cursorX += iconSize + 4;
      } else {
        // Fallback to text if icon not found
        const tW = textWidth(token);
        if (cursorX + tW > maxWidth) {
          cursorX = 0;
          cursorY += lineHeight;
        }
        text(token, cursorX, cursorY);
        cursorX += tW;
      }
    } else {
      // Normal text
      const words = token.split(' ');
      for (const word of words) {
        const wText = word + ' ';
        const tW = textWidth(wText);
        if (cursorX + tW > maxWidth) {
          cursorX = 0;
          cursorY += lineHeight;
        }
        text(wText, cursorX, cursorY);
        cursorX += tW;
      }
    }
  }

  pop();
}
