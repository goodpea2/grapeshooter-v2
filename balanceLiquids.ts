export const liquidTypes: any = {
  l_water: {
    name: 'Water',
    color: [30, 80, 220, 180],
    glowColor: [50, 120, 255, 60],
    pulseSpeed: 0.05,
    playerTrailVfx: 'water_trail',
    enemyTrailVfx: 'water_trail',
    trailVfxInterval: 15,
    isDanger: false,
    liquidConfig: {
      playerMovementSpeedMultiplier: 1.0,
      enemyMovementSpeedMultiplier: 1.0,
      turretFireRateMultiplier: 1.0,
      blocksMovement: false,
    }
  },
  l_ice: {
    name: 'Ice',
    color: [150, 180, 255, 200],
    glowColor: [180, 220, 255, 80],
    pulseSpeed: 0.02,
    playerTrailVfx: 'ice_trail',
    enemyTrailVfx: 'ice_trail',
    trailVfxInterval: 45,
    isDanger: false,
    liquidConfig: {
      playerMovementSpeedMultiplier: 1.0,
      enemyMovementSpeedMultiplier: 1.0,
      turretFireRateMultiplier: 1.0,
      blocksMovement: false,
    }
  },
  l_tar: {
    name: 'Tar',
    color: [15, 10, 25, 230],
    glowColor: [60, 20, 80, 40],
    pulseSpeed: 0.03,
    playerTrailVfx: 'tar_trail',
    enemyTrailVfx: 'tar_trail',
    trailVfxInterval: 60,
    isDanger: false,
    liquidConfig: {
      playerMovementSpeedMultiplier: 0.67,
      enemyMovementSpeedMultiplier: 0.8,
      turretFireRateMultiplier: 0.5,
      blocksMovement: false,
    }
  },
  l_lava: {
    name: 'Lava',
    color: [220, 40, 20, 220],
    glowColor: [255, 120, 0, 100],
    pulseSpeed: 0.05,
    playerTrailVfx: 'lava_trail',
    enemyTrailVfx: 'lava_trail',
    trailVfxInterval: 15,
    isDanger: true,
    liquidConfig: {
      playerMovementSpeedMultiplier: 1.0,
      enemyMovementSpeedMultiplier: 1.0,
      turretFireRateMultiplier: 1.0,
      blocksMovement: true,
      liquidDamageConfig: {
        turret: {
          damageWhileMoving: 1,
          damageWhileStationary: 0,
          damageAsMaxHpWhileStationary: 0.01,
          damageInterval: 6,
          condition: 'c_burning',
          conditionDuration: 60
        },
        enemy: {
          damageInterval: 10,
          condition: 'c_burning',
          conditionDuration: 60
        }
      }
    }
  }
};

export const LIQUID_WEIGHTS = [
  [25, 0, 0, 0],   // 0
  [25, 0, 0, 0],   // 1
  [25, 2, 0, 0],   // 2
  [25, 5, 0, 0],   // 3
  [15, 5, 5, 0],   // 4
  [15, 10, 10, 0], // 5
  [5, 10, 15, 0],  // 6
  [5, 5, 15, 5],   // 7
  [0, 2, 10, 15],  // 8
  [0, 1, 5, 25],   // 9
  [0, 0, 0, 25]    // 10
];

export const LIQUID_KEYS = ['l_water', 'l_ice', 'l_tar', 'l_lava'];