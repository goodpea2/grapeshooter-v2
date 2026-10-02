import { state } from '../../../state';
import { ALL_CURRENCIES, EditorLevelConfigData } from './types';
import { registerUIHitbox } from '../../../uiComponents';


export function drawCurrencyPanel(
  cardX: number, curY: number, cardW: number,
  cfg: EditorLevelConfigData,
  globalOffsetX: number, globalOffsetY: number
) {
  const card3H = 80;
  fill(22, 28, 54);
  noStroke();
  rect(cardX, curY, cardW, card3H, 12);

  fill(0, 220, 255);
  noStroke();
  textAlign(LEFT, TOP);
  textSize(11.5);
  text("3. ENABLED CURRENCIES (Click to toggle active currency types)", cardX + 14, curY + 12);

  const badgeGridStartX = cardX + 14;
  const badgeGridY = curY + 34;
  const numBadges = ALL_CURRENCIES.length;
  const badgeW = (cardW - 28 - (numBadges - 1) * 6) / numBadges;
  const badgeH = 34;

  let curBadgeX = badgeGridStartX;
  for (let i = 0; i < ALL_CURRENCIES.length; i++) {
    const c = ALL_CURRENCIES[i];
    const isEnabled = cfg.enabledCurrency.includes(c.key);
    const gBadgeX = globalOffsetX + curBadgeX;
    const gBadgeY = globalOffsetY + badgeGridY;
    const isHov = mouseX >= gBadgeX && mouseX <= gBadgeX + badgeW && mouseY >= gBadgeY && mouseY <= gBadgeY + badgeH;

    registerUIHitbox({
      id: `lc_currency_${c.key}`,
      x: gBadgeX, y: gBadgeY, w: badgeW, h: badgeH,
      onClick: () => {
        if (!cfg.enabledCurrency) cfg.enabledCurrency = ['sun', 'elixir', 'soil'];
        const idx = cfg.enabledCurrency.indexOf(c.key);
        if (idx >= 0) {
          if (cfg.enabledCurrency.length > 1) {
            cfg.enabledCurrency.splice(idx, 1);
          }
        } else {
          cfg.enabledCurrency.push(c.key);
        }
        state.activeLevelConfigInput = null;
      }
    });

    push();
    fill(isEnabled ? (isHov ? [35, 65, 110] : [25, 45, 80]) : (isHov ? [22, 30, 52] : [14, 18, 30]));
    if (isHov) {
      stroke(c.color[0], c.color[1], c.color[2]);
      strokeWeight(1.5);
    } else {
      noStroke();
    }

    rect(curBadgeX, badgeGridY, badgeW, badgeH, 6);

    const iconAsset = state.assets[c.icon];
    if (iconAsset) {
      imageMode(CENTER);
      if (!isEnabled) tint(120, 120, 140, 160);
      image(iconAsset, curBadgeX + 14, badgeGridY + badgeH / 2, 20, 20);
      noTint();
    }

    textAlign(LEFT, CENTER);
    fill(isEnabled ? [255, 255, 255] : [120, 130, 150]);
    textSize(9);
    text(c.label, curBadgeX + 28, badgeGridY + badgeH / 2);

    const dotX = curBadgeX + badgeW - 8;
    fill(isEnabled ? [100, 255, 120] : [100, 100, 120]);
    noStroke();
    ellipse(dotX, badgeGridY + badgeH / 2, 6, 6);

    pop();

    curBadgeX += badgeW + 6;
  }

  return card3H;
}
