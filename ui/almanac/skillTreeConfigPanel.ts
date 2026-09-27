import { state } from '../../state';
import { getActiveAlmanacProgression, DEFAULT_SKILL_TREE_CONFIG, SkillTreeConfig } from '../../lvDemo';
import { initTurretUnlockTree } from './turretUnlockTree';
import { syncWorldSeed } from '../../levelManager';
import { drawCyanButton, drawDarkButton, registerUIHitbox } from '../../uiComponents';
import { soundEngine } from '../../src/audio/soundEngine';

declare const push: any;
declare const pop: any;
declare const translate: any;
declare const fill: any;
declare const stroke: any;
declare const noStroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const line: any;
declare const textAlign: any;
declare const textSize: any;
declare const textFont: any;
declare const text: any;
declare const LEFT: any;
declare const TOP: any;
declare const CENTER: any;
declare const BOTTOM: any;
declare const mouseX: any;
declare const mouseY: any;

export function getActiveSkillTreeConfig(): SkillTreeConfig {
  const prog = getActiveAlmanacProgression();
  if (!prog.SkillTreeConfig) {
    prog.SkillTreeConfig = JSON.parse(JSON.stringify(DEFAULT_SKILL_TREE_CONFIG));
  }
  return prog.SkillTreeConfig!;
}

export function parseNodeArrayString(str: string): number[] {
  if (!str) return [];
  const cleaned = str.replace(/[\[\]]/g, '').trim();
  if (!cleaned) return [];
  return cleaned.split(',').map(s => {
    const val = parseInt(s.trim(), 10);
    return isNaN(val) ? 0 : Math.max(0, val);
  });
}

export function formatNodeArrayString(arr: number[]): string {
  if (!arr || !Array.isArray(arr)) return '';
  return arr.join(', ');
}

export function commitActiveSkillTreeInput(): void {
  if (!state.activeSkillTreeConfigInput) return;
  const cfg = getActiveSkillTreeConfig();
  const { field, textBuffer } = state.activeSkillTreeConfigInput;
  const parsed = parseNodeArrayString(textBuffer);
  if (field === 'TurretUnlockNodes') {
    cfg.TurretUnlockNodes = parsed;
  } else if (field === 'TurretUpgradeNodes') {
    cfg.TurretUpgradeNodes = parsed;
  } else if (field === 'LootNodes') {
    cfg.LootNodes = parsed;
  }
}

export function regenerateSkillTree(): void {
  commitActiveSkillTreeInput();
  const newSeed = Math.floor(Math.random() * 10000000) + 1;
  syncWorldSeed(newSeed);
  initTurretUnlockTree(newSeed);
  soundEngine.playSFX('btn_click');
}

export function resetSkillTreeDefaults(): void {
  const cfg = getActiveSkillTreeConfig();
  cfg.TurretUnlockNodes = [...DEFAULT_SKILL_TREE_CONFIG.TurretUnlockNodes];
  cfg.TurretUpgradeNodes = [...DEFAULT_SKILL_TREE_CONFIG.TurretUpgradeNodes];
  cfg.LootNodes = [...DEFAULT_SKILL_TREE_CONFIG.LootNodes];
  state.activeSkillTreeConfigInput = null;
  const newSeed = Math.floor(Math.random() * 10000000) + 1;
  syncWorldSeed(newSeed);
  initTurretUnlockTree(newSeed);
  soundEngine.playSFX('btn_click');
}

/**
 * Renders the Skill Tree Generator Configuration panel in LevelEditor.
 * Styled to strictly match LevelConfig UI (dark navy section card, cyan headers,
 * 24px Consolas input fields, selection highlight, and tactile 3D action buttons).
 */
export function drawSkillTreeConfigPanel(
  panelX: number,
  panelY: number,
  panelW: number,
  panelH: number,
  modalX: number,
  modalY: number
) {
  const cfg = getActiveSkillTreeConfig();
  const globalOffsetX = modalX + panelX;
  const globalOffsetY = modalY + panelY;

  push();
  translate(panelX, panelY);

  // Outer container card matching LevelConfig
  fill(16, 20, 38, 240);
  noStroke();
  rect(0, 0, panelW, panelH, 20);

  // Section card matching LevelConfig card1 style
  const cardX = 14;
  const cardY = 12;
  const cardW = panelW - 28;
  const cardH = panelH - 24;

  fill(22, 28, 54);
  stroke(40, 52, 95);
  strokeWeight(1);
  rect(cardX, cardY, cardW, cardH, 12);
  noStroke();

  // Cyan Section Title
  fill(0, 220, 255);
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("SKILL TREE GENERATOR CONFIG", cardX + 14, cardY + 12);

  // Subtitle / Guide
  fill(160, 185, 220);
  textSize(8.5);
  const inputX = cardX + 14;
  const inputW = cardW - 28;
  const inputH = 24;
  let curY = cardY + 54;
  const fieldGap = 16;

  // 1. TurretUnlockNodes Input
  renderArrayInputField(
    inputX, curY, inputW, inputH,
    "New Plant Unlock Nodes",
    'TurretUnlockNodes',
    cfg.TurretUnlockNodes,
    formatNodeArrayString(DEFAULT_SKILL_TREE_CONFIG.TurretUnlockNodes),
    globalOffsetX, globalOffsetY
  );
  curY += inputH + fieldGap;

  // 2. TurretUpgradeNodes Input
  renderArrayInputField(
    inputX, curY, inputW, inputH,
    "Upgrade Nodes",
    'TurretUpgradeNodes',
    cfg.TurretUpgradeNodes,
    formatNodeArrayString(DEFAULT_SKILL_TREE_CONFIG.TurretUpgradeNodes),
    globalOffsetX, globalOffsetY
  );
  curY += inputH + fieldGap;

  // 3. LootNodes Input
  renderArrayInputField(
    inputX, curY, inputW, inputH,
    "Loot / Resource Nodes",
    'LootNodes',
    cfg.LootNodes,
    formatNodeArrayString(DEFAULT_SKILL_TREE_CONFIG.LootNodes),
    globalOffsetX, globalOffsetY
  );
  curY += inputH + 24;

  // 4. Action Buttons
  const btnW = inputW;
  const btn1H = 28;
  drawCyanButton(inputX, curY, btnW, btn1H, "REGENERATE", {
    id: "btn_skill_tree_regenerate",
    fontSize: 10.5,
    radius: 7,
    depth3D: 2,
    layer: 110,
    hitboxX: globalOffsetX + inputX,
    hitboxY: globalOffsetY + curY,
    onClick: () => {
      regenerateSkillTree();
    }
  });
  curY += btn1H + 10;

  const btn2H = 26;
  drawDarkButton(inputX, curY, btnW, btn2H, "RESET TO DEFAULT", {
    id: "btn_skill_tree_reset",
    fontSize: 9.5,
    radius: 6,
    depth3D: 2,
    layer: 110,
    hitboxX: globalOffsetX + inputX,
    hitboxY: globalOffsetY + curY,
    onClick: () => {
      resetSkillTreeDefaults();
    }
  });

  pop();
}

/**
 * Renders an array input field matching LevelConfig's renderTextInput styling.
 */
function renderArrayInputField(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  field: 'TurretUnlockNodes' | 'TurretUpgradeNodes' | 'LootNodes',
  currentArray: number[],
  placeholder: string,
  globalOffsetX: number,
  globalOffsetY: number
) {
  const gX = globalOffsetX + x;
  const gY = globalOffsetY + y;
  const isFocused = state.activeSkillTreeConfigInput?.field === field;
  const isHov = mouseX >= gX && mouseX <= gX + w && mouseY >= gY && mouseY <= gY + h;

  const isMousePressed = !!(window as any).mouseIsPressed;
  if (isFocused && isMousePressed && state.activeSkillTreeConfigInput?.isDragging) {
    const activeBuf = state.activeSkillTreeConfigInput.textBuffer || '';
    const approxCharW = 5.8;
    const relX = mouseX - (gX + 8);
    const dragIdx = Math.max(0, Math.min(activeBuf.length, Math.round(relX / approxCharW)));
    state.activeSkillTreeConfigInput.selectionEnd = dragIdx;
    state.activeSkillTreeConfigInput.cursor = dragIdx;
  }

  // Label (muted cyan-gray, size 8.5)
  push();
  fill(160, 185, 220);
  textAlign(LEFT, BOTTOM);
  textSize(8.5);
  noStroke();
  text(label, x, y - 2);

  // Field Box
  fill(...(isFocused ? [12, 16, 32, 250] : (isHov ? [20, 28, 50, 240] : [12, 16, 32, 230])));
  if (isFocused) {
    stroke(0, 220, 255);
    strokeWeight(1.5);
  } else if (isHov) {
    stroke(70, 95, 145);
    strokeWeight(1);
  } else {
    stroke(32, 42, 75);
    strokeWeight(1);
  }
  rect(x, y, w, h, 6);

  // Display text in Consolas monospace font
  const displayBuf = isFocused
    ? (state.activeSkillTreeConfigInput?.textBuffer ?? '')
    : formatNodeArrayString(currentArray);

  fill(255, 255, 255);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9.5);
  if (typeof textFont === 'function') textFont('Consolas, monospace');

  const maxVisChars = Math.floor((w - 16) / 5.8);
  let renderStr = displayBuf.length > 0 ? displayBuf : placeholder;

  if (displayBuf.length === 0) {
    fill(90, 105, 135);
  } else {
    fill(255);
  }

  if (renderStr.length > maxVisChars) {
    renderStr = '...' + renderStr.substring(renderStr.length - maxVisChars + 3);
  }

  // Selection Highlight
  if (isFocused) {
    const cursorIdx = state.activeSkillTreeConfigInput?.cursor !== undefined ? state.activeSkillTreeConfigInput.cursor : displayBuf.length;
    const sStart = state.activeSkillTreeConfigInput?.selectionStart !== undefined ? state.activeSkillTreeConfigInput.selectionStart : cursorIdx;
    const sEnd = state.activeSkillTreeConfigInput?.selectionEnd !== undefined ? state.activeSkillTreeConfigInput.selectionEnd : cursorIdx;
    const minS = Math.min(sStart, sEnd);
    const maxS = Math.max(sStart, sEnd);

    if (minS !== maxS) {
      const beforeSel = displayBuf.substring(0, minS);
      const selPart = displayBuf.substring(minS, maxS);
      const beforeW = (window as any).textWidth ? (window as any).textWidth(beforeSel) : beforeSel.length * 5.8;
      const selW = (window as any).textWidth ? (window as any).textWidth(selPart) : selPart.length * 5.8;

      push();
      fill(0, 120, 200, 150);
      noStroke();
      rect(x + 8 + beforeW, y + 4, selW, h - 8, 2);
      pop();
    }
  }

  text(renderStr, x + 8, y + h / 2);

  // Blinking cursor
  if (isFocused) {
    const cursorIdx = state.activeSkillTreeConfigInput?.cursor !== undefined ? state.activeSkillTreeConfigInput.cursor : displayBuf.length;
    const beforeCursor = displayBuf.substring(0, cursorIdx);
    const cursorW = (window as any).textWidth ? (window as any).textWidth(beforeCursor) : beforeCursor.length * 5.8;
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      stroke(0, 220, 255);
      strokeWeight(1.5);
      line(x + 8 + cursorW, y + 5, x + 8 + cursorW, y + h - 5);
    }
  }

  if (typeof textFont === 'function') textFont('Viga');
  pop();
}

export function handleSkillTreeConfigClick(
  panelX: number,
  panelY: number,
  panelW: number,
  panelH: number,
  modalX: number,
  modalY: number
): boolean {
  const globalOffsetX = modalX + panelX;
  const globalOffsetY = modalY + panelY;

  const cardX = 14;
  const cardY = 12;
  const cardW = panelW - 28;
  const inputX = cardX + 14;
  const inputW = cardW - 28;
  const inputH = 24;
  let curY = cardY + 54;
  const fieldGap = 16;

  const fields: Array<{ field: 'TurretUnlockNodes' | 'TurretUpgradeNodes' | 'LootNodes'; y: number }> = [
    { field: 'TurretUnlockNodes', y: curY },
    { field: 'TurretUpgradeNodes', y: curY + inputH + fieldGap },
    { field: 'LootNodes', y: curY + (inputH + fieldGap) * 2 }
  ];

  for (const item of fields) {
    const gX = globalOffsetX + inputX;
    const gY = globalOffsetY + item.y;
    if (mouseX >= gX && mouseX <= gX + inputW && mouseY >= gY && mouseY <= gY + inputH) {
      commitActiveSkillTreeInput();
      const cfg = getActiveSkillTreeConfig();
      const initialStr = formatNodeArrayString(cfg[item.field]);
      const approxCharW = 5.8;
      const relX = mouseX - (gX + 8);
      const clickedIdx = Math.max(0, Math.min(initialStr.length, Math.round(relX / approxCharW)));

      state.activeSkillTreeConfigInput = {
        field: item.field,
        textBuffer: initialStr,
        cursor: clickedIdx,
        selectionStart: clickedIdx,
        selectionEnd: clickedIdx,
        isDragging: true
      };
      return true;
    }
  }

  // Regenerate Button area
  const btn1Y = cardY + 54 + (inputH + fieldGap) * 2 + inputH + 24;
  const btn1GX = globalOffsetX + inputX;
  const btn1GY = globalOffsetY + btn1Y;
  const btn1H = 28;
  if (mouseX >= btn1GX && mouseX <= btn1GX + inputW && mouseY >= btn1GY && mouseY <= btn1GY + btn1H) {
    regenerateSkillTree();
    return true;
  }

  // Reset Button area
  const btn2Y = btn1Y + btn1H + 10;
  const btn2GX = globalOffsetX + inputX;
  const btn2GY = globalOffsetY + btn2Y;
  const btn2H = 26;
  if (mouseX >= btn2GX && mouseX <= btn2GX + inputW && mouseY >= btn2GY && mouseY <= btn2GY + btn2H) {
    resetSkillTreeDefaults();
    return true;
  }

  // Click outside input fields
  if (state.activeSkillTreeConfigInput) {
    commitActiveSkillTreeInput();
    state.activeSkillTreeConfigInput = null;
  }

  return false;
}

export function handleSkillTreeConfigKeyInput(keyStr: string, keyCode: number, event: any): boolean {
  if (!state.activeSkillTreeConfigInput) return false;

  const input = state.activeSkillTreeConfigInput;
  let buf = input.textBuffer || '';
  let cursor = input.cursor !== undefined ? input.cursor : buf.length;
  let sStart = input.selectionStart !== undefined ? input.selectionStart : cursor;
  let sEnd = input.selectionEnd !== undefined ? input.selectionEnd : cursor;
  const minS = Math.min(sStart, sEnd);
  const maxS = Math.max(sStart, sEnd);
  const hasSelection = minS !== maxS;

  if (keyCode === 13) { // Enter -> Commit & Regenerate
    commitActiveSkillTreeInput();
    state.activeSkillTreeConfigInput = null;
    const newSeed = Math.floor(Math.random() * 10000000) + 1;
    syncWorldSeed(newSeed);
    initTurretUnlockTree(newSeed);
    soundEngine.playSFX('btn_click');
    return true;
  }

  if (keyCode === 27) { // Escape -> Blur without commit
    state.activeSkillTreeConfigInput = null;
    return true;
  }

  // Tab -> cycle to next field
  if (keyCode === 9) {
    commitActiveSkillTreeInput();
    const fieldOrder: Array<'TurretUnlockNodes' | 'TurretUpgradeNodes' | 'LootNodes'> = [
      'TurretUnlockNodes',
      'TurretUpgradeNodes',
      'LootNodes'
    ];
    const curIdx = fieldOrder.indexOf(input.field);
    const nextField = fieldOrder[(curIdx + 1) % fieldOrder.length];
    const cfg = getActiveSkillTreeConfig();
    const nextBuf = formatNodeArrayString(cfg[nextField]);
    state.activeSkillTreeConfigInput = {
      field: nextField,
      textBuffer: nextBuf,
      cursor: nextBuf.length,
      selectionStart: 0,
      selectionEnd: nextBuf.length
    };
    return true;
  }

  // Select all (Ctrl+A / Cmd+A)
  if ((event?.ctrlKey || event?.metaKey) && (keyStr === 'a' || keyStr === 'A' || keyCode === 65)) {
    input.selectionStart = 0;
    input.selectionEnd = buf.length;
    input.cursor = buf.length;
    return true;
  }

  if (keyCode === 8) { // Backspace
    if (hasSelection) {
      buf = buf.substring(0, minS) + buf.substring(maxS);
      cursor = minS;
    } else if (cursor > 0) {
      buf = buf.substring(0, cursor - 1) + buf.substring(cursor);
      cursor--;
    }
    input.textBuffer = buf;
    input.cursor = cursor;
    input.selectionStart = cursor;
    input.selectionEnd = cursor;
    commitActiveSkillTreeInput();
    return true;
  }

  if (keyCode === 46) { // Delete
    if (hasSelection) {
      buf = buf.substring(0, minS) + buf.substring(maxS);
      cursor = minS;
    } else if (cursor < buf.length) {
      buf = buf.substring(0, cursor) + buf.substring(cursor + 1);
    }
    input.textBuffer = buf;
    input.cursor = cursor;
    input.selectionStart = cursor;
    input.selectionEnd = cursor;
    commitActiveSkillTreeInput();
    return true;
  }

  if (keyCode === 37) { // Left arrow
    if (event?.shiftKey) {
      const next = Math.max(0, sEnd - 1);
      input.selectionEnd = next;
      input.cursor = next;
    } else {
      const target = hasSelection ? minS : Math.max(0, cursor - 1);
      input.cursor = target;
      input.selectionStart = target;
      input.selectionEnd = target;
    }
    return true;
  }

  if (keyCode === 39) { // Right arrow
    if (event?.shiftKey) {
      const next = Math.min(buf.length, sEnd + 1);
      input.selectionEnd = next;
      input.cursor = next;
    } else {
      const target = hasSelection ? maxS : Math.min(buf.length, cursor + 1);
      input.cursor = target;
      input.selectionStart = target;
      input.selectionEnd = target;
    }
    return true;
  }

  // Printable characters: digits, comma, space
  if (keyStr && keyStr.length === 1 && !event?.ctrlKey && !event?.metaKey) {
    if (hasSelection) {
      buf = buf.substring(0, minS) + keyStr + buf.substring(maxS);
      cursor = minS + 1;
    } else {
      buf = buf.substring(0, cursor) + keyStr + buf.substring(cursor);
      cursor++;
    }
    input.textBuffer = buf;
    input.cursor = cursor;
    input.selectionStart = cursor;
    input.selectionEnd = cursor;
    commitActiveSkillTreeInput();
    return true;
  }

  return false;
}
