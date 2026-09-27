import { state } from '../../../state';
import { EditorLevelConfigData } from './types';

declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const line: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const TOP: any;
declare const CENTER: any;
declare const BOTTOM: any;
declare const mouseX: any;
declare const mouseY: any;

export function renderTextInput(
  x: number, y: number, w: number, h: number,
  label: string,
  field: string,
  value: string,
  globalOffsetX: number, globalOffsetY: number
) {
  const gX = globalOffsetX + x;
  const gY = globalOffsetY + y;
  const isFocused = state.activeLevelConfigInput?.field === field;
  const isHov = mouseX >= gX && mouseX <= gX + w && mouseY >= gY && mouseY <= gY + h;

  const isMousePressed = !!(window as any).mouseIsPressed;
  if (isFocused && isMousePressed && state.activeLevelConfigInput?.isDragging) {
    const activeBuf = state.activeLevelConfigInput.textBuffer || '';
    const approxCharW = 5.8;
    const relX = mouseX - (gX + 8);
    const dragIdx = Math.max(0, Math.min(activeBuf.length, Math.round(relX / approxCharW)));
    state.activeLevelConfigInput.selectionEnd = dragIdx;
    state.activeLevelConfigInput.cursor = dragIdx;
  }

  push();
  fill(160, 185, 220);
  textAlign(LEFT, BOTTOM);
  textSize(8.5);
  text(label, x, y - 2);

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

  // Input text rendering
  const displayBuf = isFocused ? (state.activeLevelConfigInput?.textBuffer || '') : (value || '');
  fill(255, 255, 255);
  noStroke();
  textAlign(LEFT, CENTER);
  textSize(9.5);

  const maxVisChars = Math.floor((w - 16) / 6);
  let renderStr = displayBuf;
  if (displayBuf.length > maxVisChars) {
    renderStr = '...' + displayBuf.substring(displayBuf.length - maxVisChars + 3);
  }

  if (isFocused) {
    const cursorIdx = state.activeLevelConfigInput?.cursor !== undefined ? state.activeLevelConfigInput.cursor : displayBuf.length;
    const sStart = state.activeLevelConfigInput?.selectionStart !== undefined ? state.activeLevelConfigInput.selectionStart : cursorIdx;
    const sEnd = state.activeLevelConfigInput?.selectionEnd !== undefined ? state.activeLevelConfigInput.selectionEnd : cursorIdx;
    const minS = Math.min(sStart, sEnd);
    const maxS = Math.max(sStart, sEnd);

    if (minS !== maxS) {
      const beforeSel = displayBuf.substring(0, minS);
      const selPart = displayBuf.substring(minS, maxS);
      const beforeW = (window as any).textWidth ? (window as any).textWidth(beforeSel) : beforeSel.length * 6;
      const selW = (window as any).textWidth ? (window as any).textWidth(selPart) : selPart.length * 6;

      push();
      fill(0, 120, 200, 150);
      noStroke();
      rect(x + 8 + beforeW, y + 5, selW, h - 10, 2);
      pop();
    }
  }

  text(renderStr, x + 8, y + h / 2);

  if (isFocused) {
    const cursorIdx = state.activeLevelConfigInput?.cursor !== undefined ? state.activeLevelConfigInput.cursor : displayBuf.length;
    const beforeCursor = displayBuf.substring(0, cursorIdx);
    const cursorW = (window as any).textWidth ? (window as any).textWidth(beforeCursor) : beforeCursor.length * 6;
    if (Math.floor(Date.now() / 400) % 2 === 0) {
      stroke(0, 220, 255);
      strokeWeight(1.5);
      line(x + 8 + cursorW, y + 6, x + 8 + cursorW, y + h - 6);
    }
  }

  pop();
}

export function drawGeneralPanel(
  card1X: number, curY: number, card1W: number,
  cfg: EditorLevelConfigData,
  globalOffsetX: number, globalOffsetY: number
) {
  const card1H = 145;
  fill(22, 28, 54);
  noStroke();
  rect(card1X, curY, card1W, card1H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("1. METADATA & IDENTITY", card1X + 14, curY + 12);

  const fieldH = 24;
  const row1Y = curY + 34;
  const col1W = Math.max(120, (card1W - 28 - 20) / 3);

  renderTextInput(card1X + 14, row1Y, col1W, fieldH, "Level ID", 'id', cfg.id, globalOffsetX, globalOffsetY);
  renderTextInput(card1X + 14 + col1W + 10, row1Y, col1W, fieldH, "Tag / Category", 'tag', cfg.tag, globalOffsetX, globalOffsetY);
  renderTextInput(card1X + 14 + (col1W + 10) * 2, row1Y, col1W, fieldH, "Sun Spawn Interval (Hours)", 'sunSpawnHourInterval', cfg.sunSpawnHourInterval, globalOffsetX, globalOffsetY);

  const row2Y = curY + 68;
  renderTextInput(card1X + 14, row2Y, card1W - 28, fieldH, "Level Display Name", 'name', cfg.name, globalOffsetX, globalOffsetY);

  const row3Y = curY + 102;
  renderTextInput(card1X + 14, row3Y, card1W - 28, fieldH, "Description", 'description', cfg.description, globalOffsetX, globalOffsetY);

  return card1H;
}

export function drawWaveSettingsPanel(
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData,
  globalOffsetX: number, globalOffsetY: number
) {
  const card2H = 92;
  fill(22, 28, 54);
  noStroke();
  rect(cardX, curY, cardW, card2H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("2. WAVE CONFIGURATION & BUDGETS (Comma-separated per night/day)", cardX + 14, curY + 12);

  const fieldH = 24;
  const rowY = curY + 36;
  const colW = (cardW - 28 - 10) / 2;

  renderTextInput(cardX + 14, rowY, colW, fieldH, "Custom Budget Per Night (e.g. 100, 200, 400)", 'customBudgetPerNight', cfg.customBudgetPerNight, globalOffsetX, globalOffsetY);
  renderTextInput(cardX + 14 + colW + 10, rowY, colW, fieldH, "Hourly Budget Per Night (e.g. 20, 40, 80)", 'hourlyBudgetPerNight', cfg.hourlyBudgetPerNight, globalOffsetX, globalOffsetY);

  return card2H;
}
