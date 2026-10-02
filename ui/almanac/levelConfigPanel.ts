import { state } from '../../state';
import { EditorLevelConfigData, getSelectedEnemyKeys } from './levelConfig/types';
import { drawGeneralPanel, drawWaveSettingsPanel } from './levelConfig/generalPanel';
import { drawCurrencyPanel } from './levelConfig/currencyPanel';
import { drawResourcesPanel } from './levelConfig/resourcesPanel';
import { drawSpawnsPanel } from './levelConfig/spawnsPanel';
import { drawEnemiesPanel } from './levelConfig/enemiesPanel';
import { drawWinConditionsPanel, getWinConditionsPanelHeight } from './levelConfig/winConditionsPanel';
import { initLevelEditorLevelConfig } from './levelConfig/configActions';
export { initLevelEditorLevelConfig, serializeLevelEditorLevelConfig, formatGlobalEnemySpawnConfig, handleLevelConfigClick, handleLevelConfigKeyInput, handleLevelConfigScroll, syncLevelConfigToLayoutData } from './levelConfig/configActions';
import { ALL_ENEMY_TYPES_LIST } from '../../levelEditor/types';


export function drawLevelConfigPanel(
  panelX: number, panelY: number, panelW: number, panelH: number,
  modalX: number, modalY: number
) {
  if (!state.levelEditorLevelConfig) {
    initLevelEditorLevelConfig();
  }
  const cfg: EditorLevelConfigData = state.levelEditorLevelConfig;
  const selectedEnemies = getSelectedEnemyKeys();

  push();
  translate(panelX, panelY);

  // Main Background Card
  fill(16, 20, 38, 240);
  noStroke();
  rect(0, 0, panelW, panelH, 20);

  const viewY = 16;
  const viewH = panelH - viewY - 12;

  // Estimate card5 height
  let estCard5H = 300;
  {
    const estCardW = panelW - 40;
    const estChipStartX = 20 + 14;
    let curChipEstX = estChipStartX;
    let curChipEstY = 0;
    const estChipH = 20;
    const estChipGap = 4;
    const maxEstChipsW = estCardW - 28;
    for (let i = 0; i < ALL_ENEMY_TYPES_LIST.length; i++) {
      const choice = ALL_ENEMY_TYPES_LIST[i];
      const chipW = Math.max(52, choice.label.length * 6 + 16);
      if (curChipEstX + chipW > estChipStartX + maxEstChipsW) {
        curChipEstX = estChipStartX;
        curChipEstY += estChipH + estChipGap;
      }
      curChipEstX += chipW + estChipGap;
    }
    estCard5H = (curChipEstY + estChipH + 12) + 24 + (selectedEnemies.length * 21) + 40;
  }

  const estWinH = getWinConditionsPanelHeight(cfg, panelW - 40);
  const totalContentH = 145 + 14 + 92 + 14 + estWinH + 14 + 80 + 14 + 265 + 14 + 80 + 14 + estCard5H + 40;
  const totalHeight = totalContentH;
  (window as any).totalHeight = totalHeight;
  const minScroll = Math.min(0, viewH - totalContentH);

  if (state.levelConfigScrollVelocity) {
    state.levelConfigScrollY = constrain(
      (state.levelConfigScrollY || 0) + state.levelConfigScrollVelocity,
      minScroll,
      0
    );
    state.levelConfigScrollVelocity *= 0.85;
    if (abs(state.levelConfigScrollVelocity) < 0.01) state.levelConfigScrollVelocity = 0;
  } else {
    state.levelConfigScrollY = constrain(state.levelConfigScrollY || 0, minScroll, 0);
  }

  const scrollY = state.levelConfigScrollY || 0;

  const dc = (window as any).drawingContext;
  if (dc) {
    dc.save();
    dc.beginPath();
    dc.rect(0, viewY, panelW, viewH);
    dc.clip();
  }

  push();
  translate(0, viewY + scrollY);

  let curY = 0;
  const globalOffsetX = modalX + panelX;
  const globalOffsetY = modalY + panelY + viewY + scrollY;

  const card1W = panelW - 40;
  const card1X = 20;

  // 1. Metadata & Identity
  const h1 = drawGeneralPanel(card1X, curY, card1W, cfg, globalOffsetX, globalOffsetY);
  curY += h1 + 14;

  // 2. Wave Configuration & Budgets
  const h2 = drawWaveSettingsPanel(card1X, curY, card1W, cfg, globalOffsetX, globalOffsetY);
  curY += h2 + 14;

  // Win Conditions
  const hWin = drawWinConditionsPanel(card1X, curY, card1W, cfg, globalOffsetX, globalOffsetY);
  curY += hWin + 14;

  // 3. Enabled Currencies
  const h3 = drawCurrencyPanel(card1X, curY, card1W, cfg, globalOffsetX, globalOffsetY);
  curY += h3 + 14;

  // 4. Starting Resources
  const h4 = drawResourcesPanel(card1X, curY, card1W, cfg, globalOffsetX, globalOffsetY);
  curY += h4 + 14;

  // Hourly Budgets
  const hSpawn = drawSpawnsPanel(card1X, curY, card1W, cfg, globalOffsetX, globalOffsetY);
  curY += hSpawn + 14;

  // 5. Global Enemy Spawn Config Matrix
  drawEnemiesPanel(
    card1X, curY, card1W, cfg,
    globalOffsetX, globalOffsetY,
    modalX, modalY, panelX, panelY, panelW, panelH, viewY, viewH
  );

  pop();

  if (dc) {
    dc.restore();
  }

  pop();
}
