import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t_farm_crystal: TurretConfig = {
  name: 'Crystal Pot', costs: { sun: 40 }, costAlmanac: { soil: 30 }, drops: { shard: 2 }, health: 100, color: [100, 200, 255], size: 22, tier: 1,
  tooltip: "Grows a bulb that drops shards on harvest, attracts and consumes elixir",
  animationBodyType: 'tough',
  actionType: ['farm'],
  actionConfig: {},
  farmConfig: {
    assetImg: [
      'img_t_farm_crystal_stage0',
      'img_t_farm_crystal_stage1',
      'img_t_farm_crystal_stage2',
      'img_t_farm_crystal_stage3',
      'img_t_farm_crystal_stage4',
      'img_t_farm_crystal_stage5'
    ],
    elixirRequired: [2, 0, 2, 0, 2, 0],
    growthTimer: [HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, HOUR_FRAMES * 2, HOUR_FRAMES * 1, 0],
    harvestStageHp: 100,
    lootOnHarvest: { shard: [3, 4], extra: { chance: 0.5, items: ['shard', 'shell'] } },
    resetAfterHarvest: true,
    attractRange: GRID_SIZE * 4
  },
  targetType: [], targetConfig: {}
};
