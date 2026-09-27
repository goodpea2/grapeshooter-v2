
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
  c_leaf: 'img_icon_class_shooter',
  c_shard: 'img_icon_class_miner',
  c_shell: 'img_icon_class_armor',
  c_fuel: 'img_icon_class_explode',
  c_ice: 'img_icon_class_stall',
  leaf: 'img_icon_leaf',
  shard: 'img_icon_shard',
  shell: 'img_icon_shell',
  fuel: 'img_icon_fuel',
  ice: 'img_icon_ice',
  sun: 'img_icon_sun',
  elixir: 'img_icon_elixir',
  soil: 'img_icon_soil',
  raisin: 'img_icon_raisin',
  health: 'img_icon_health',
  hp: 'img_icon_health',
  stamina: 'img_icon_stamina'
};

/**
 * Draws text with embedded icons like <c_leaf>
 */
export function drawRichText(str: string, x: number, y: number, maxWidth: number, size: number, color: any) {
  push();
  translate(x, y);
  textSize(size);
  fill(color);
  textAlign(LEFT, CENTER);
  imageMode(CENTER);

  // Normalize bracket notation [tag] to <tag>
  const normalizedStr = (str || '').replace(/\[([^\]]+)\]/g, '<$1>');
  const tokens = normalizedStr.split(/(<[^>]+>)/g);
  let cursorX = 0;
  let cursorY = size * 0.7; // Start at first line center
  const lineHeight = size * 1.45;

  for (const token of tokens) {
    if (!token) continue;
    if (token.startsWith('<') && token.endsWith('>')) {
      const tag = token.slice(1, -1).trim();
      const lowerTag = tag.toLowerCase();
      const iconKey = CLASS_ICON_MAP[tag] || CLASS_ICON_MAP[lowerTag] || (state.assets[tag] ? tag : (state.assets['img_icon_' + lowerTag] ? 'img_icon_' + lowerTag : null));
      const icon = iconKey ? state.assets[iconKey] : null;
      
      if (icon) {
        const iconSize = size * 1.3;
        if (cursorX + iconSize > maxWidth && cursorX > 0) {
          cursorX = 0;
          cursorY += lineHeight;
        }
        image(icon, cursorX + iconSize / 2, cursorY, iconSize, iconSize);
        cursorX += iconSize + 4;
      } else {
        // Fallback to text if icon not found
        const tW = textWidth(token);
        if (cursorX + tW > maxWidth && cursorX > 0) {
          cursorX = 0;
          cursorY += lineHeight;
        }
        text(token, cursorX, cursorY);
        cursorX += tW;
      }
    } else {
      // Normal text with space/newline splitting
      const words = token.split(/(\s+)/);
      for (const word of words) {
        if (!word) continue;
        if (word.includes('\n')) {
          const lines = word.split('\n');
          for (let l = 0; l < lines.length; l++) {
            if (l > 0) {
              cursorX = 0;
              cursorY += lineHeight;
            }
            if (lines[l]) {
              const tW = textWidth(lines[l]);
              if (cursorX + tW > maxWidth && cursorX > 0) {
                cursorX = 0;
                cursorY += lineHeight;
              }
              text(lines[l], cursorX, cursorY);
              cursorX += tW;
            }
          }
        } else {
          const tW = textWidth(word);
          if (cursorX + tW > maxWidth && cursorX > 0) {
            cursorX = 0;
            cursorY += lineHeight;
          }
          text(word, cursorX, cursorY);
          cursorX += tW;
        }
      }
    }
  }

  pop();
}

