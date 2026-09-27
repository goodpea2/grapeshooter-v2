import { EditorLevelConfigData } from './types';
import { renderTextInput } from './generalPanel';

declare const fill: any;
declare const noStroke: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const TOP: any;

export function drawSpawnsPanel(
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData,
  globalOffsetX: number, globalOffsetY: number
) {
  const cardH = 80;
  fill(22, 28, 54);
  noStroke();
  rect(cardX, curY, cardW, cardH, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("HOURLY BUDGETS & SPAWN PACING", cardX + 14, curY + 12);

  const fieldH = 24;
  const rowY = curY + 36;
  const colW = (cardW - 28 - 10) / 2;

  renderTextInput(cardX + 14, rowY, colW, fieldH, "Hourly Budget Per Day (e.g. 3, 10, 20)", 'hourlyBudgetPerDay', cfg.hourlyBudgetPerDay, globalOffsetX, globalOffsetY);
  renderTextInput(cardX + 14 + colW + 10, rowY, colW, fieldH, "Hourly Budget Per Night (e.g. 20, 40)", 'hourlyBudgetPerNight', cfg.hourlyBudgetPerNight, globalOffsetX, globalOffsetY);

  return cardH;
}
