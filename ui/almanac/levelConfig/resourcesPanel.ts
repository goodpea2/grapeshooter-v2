import { state } from '../../../state';
import { ALL_CURRENCIES, EditorLevelConfigData } from './types';
import { renderTextInput } from './generalPanel';

declare const push: any;
declare const pop: any;
declare const fill: any;
declare const noStroke: any;
declare const stroke: any;
declare const strokeWeight: any;
declare const rect: any;
declare const textAlign: any;
declare const textSize: any;
declare const text: any;
declare const LEFT: any;
declare const TOP: any;
declare const CENTER: any;
declare const image: any;
declare const imageMode: any;
declare const tint: any;
declare const noTint: any;

export function renderStartingResourceControl(
  x: number, y: number, w: number, h: number,
  currency: typeof ALL_CURRENCIES[0],
  currentVal: number,
  isCurrencyActive: boolean,
  globalOffsetX: number, globalOffsetY: number
) {
  push();
  fill(isCurrencyActive ? [18, 25, 48] : [14, 18, 30, 180]);
  stroke(isCurrencyActive ? [45, 65, 110] : [25, 32, 52]);
  strokeWeight(1);
  rect(x, y, w, h, 6);

  const iconAsset = state.assets[currency.icon];
  if (iconAsset) {
    imageMode(CENTER);
    if (!isCurrencyActive) tint(100, 100, 120, 140);
    image(iconAsset, x + 16, y + h / 2, 18, 18);
    noTint();
  }

  textAlign(LEFT, CENTER);
  fill(isCurrencyActive ? [240, 245, 255] : [120, 130, 150]);
  textSize(9);
  text(currency.label, x + 30, y + h / 2);

  const valFieldWidth = 55;
  const valFieldX = x + w - valFieldWidth - 8;
  const valFieldY = y + 5;
  const valFieldH = h - 10;
  const fieldKey = `res_${currency.key}`;

  renderTextInput(
    valFieldX, valFieldY, valFieldWidth, valFieldH,
    "",
    fieldKey,
    String(currentVal),
    globalOffsetX, globalOffsetY
  );

  pop();
}

export function drawResourcesPanel(
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData,
  globalOffsetX: number, globalOffsetY: number
) {
  const card4H = 265;
  fill(22, 28, 54);
  noStroke();
  rect(cardX, curY, cardW, card4H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("4. STARTING RESOURCES (Amount of each currency to start with)", cardX + 14, curY + 12);

  const resGridStartX = cardX + 14;
  let resGridY = curY + 36;
  const resColW = (cardW - 48) / 3;
  const resItemH = 34;

  for (let i = 0; i < ALL_CURRENCIES.length; i++) {
    const c = ALL_CURRENCIES[i];
    const colIdx = i % 3;
    const rowIdx = Math.floor(i / 3);
    const itemX = resGridStartX + colIdx * (resColW + 10);
    const itemY = resGridY + rowIdx * (resItemH + 8);
    const currentVal = cfg.startingResource[c.key] ?? 0;
    const isCurrencyActive = cfg.enabledCurrency.includes(c.key);

    renderStartingResourceControl(
      itemX, itemY, resColW, resItemH,
      c,
      currentVal,
      isCurrencyActive,
      globalOffsetX, globalOffsetY
    );
  }

  return card4H;
}
