import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t_farm_bush: TurretConfig = {
  name: 'Fern Pot', costs: { sun: 40 }, costAlmanac: { soil: 30 }, drops: { leaf: 2 }, health: 100, color: [50, 150, 50], size: 22, tier: 1,
  tooltip: "Grows a bush that drop leaves on harvest, attracts and consumes elixir",
  animationBodyType: 'soft',
  actionType: ['farm'],
  actionConfig: {},
  farmConfig: {
    assetImg: [
      'img_t_farm_bush_stage0',
      'img_t_farm_bush_stage1',
      'img_t_farm_bush_stage2',
      'img_t_farm_bush_stage3',
      'img_t_farm_bush_stage4',
      'img_t_farm_bush_stage5'
    ],
    elixirRequired: [2, 0, 2, 0, 2, 0],
    growthTimer: [HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, 0],
    harvestStageHp: 100,
    lootOnHarvest: { leaf: [3, 4], extra: { chance: 0.5, items: ['leaf', 'shell'] } },
    resetAfterHarvest: true,
    attractRange: GRID_SIZE * 4
  },
  targetType: [], targetConfig: {}
};
