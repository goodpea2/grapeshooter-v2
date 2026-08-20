import { TurretConfig } from '../turretConfig';
import { GRID_SIZE, HOUR_FRAMES } from '../../../constants';

export const t_farm_mob: TurretConfig = {
  name: 'Raisin Mold', costs: { sun: 30 }, costAlmanac: { elixir: 10, raisin: 1 }, drops: { shell: 2 }, health: 100, color: [150, 50, 200], size: 22, tier: 1,
  tooltip: "Occasionally spawns an enemy nearby",
  animationBodyType: 'soft',
  actionType: ['farm'],
  actionConfig: {},
  farmConfig: {
    assetImg: [
      'img_t_farm_mob_stage0',
      'img_t_farm_mob_stage1',
      'img_t_farm_mob_stage2',
      'img_t_farm_mob_stage3',
      'img_t_farm_mob_stage4'
    ],
    elixirRequired: [0, 0, 0, 0, 0],
    growthTimer: [HOUR_FRAMES * 0.5, HOUR_FRAMES * 0.5, HOUR_FRAMES * 0.5, HOUR_FRAMES * 0.5, 0],
    isMobFarm: true,
    mobSpawnConfig: {
      enemies: ['e_basic', 'e_armor1'],
      spawnDist: GRID_SIZE * 2
    },
    resetAfterHarvest: true
  },
  targetType: [], targetConfig: {}
};
