
import { GRID_SIZE, HOUR_FRAMES } from './constants';

export const bulletTypes: any = {
  b_player: {
    bulletDamage: 4, bulletSpeed: 14, bulletColor: [225, 225, 100], bulletLifeTime: 180, bulletSize: 6, bulletLength: 8,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_player_mining: {
    bulletDamage: 8, bulletSpeed: 14, bulletColor: [255, 255, 100], bulletLifeTime: 180, bulletSize: 6, bulletLength: 8,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 1 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['obstacle', 'icecube']
  },
  b_pea: {
    bulletDamage: 10, bulletSpeed: 10, bulletColor: [150, 255, 100], bulletLifeTime: 90, bulletSize: 6, bulletLength: 12,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'icecube']
  },
  b_firepea: {
    bulletDamage: 10, bulletSpeed: 10, bulletColor: [255, 180, 50], bulletLifeTime: 90, bulletSize: 8, bulletLength: 14,
    spawnGroundFeatureOnContact: ['gf_fire_puddle'],
    spawnGroundFeaturePerFrame: -1,
    spawnGroundFeatureInRadius: 0,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0.5 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0.5,
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_snowpea: {
    bulletDamage: 10, bulletSpeed: 10, bulletColor: [150, 220, 255], bulletLifeTime: 90, bulletSize: 6, bulletLength: 12,
    appliedConditions: [{ type: 'c_chilled', duration: 150 }],
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'icecube']
  },
  b_mortar_shell: {
    bulletDamage: 30, bulletSpeed: 6, bulletColor: [200, 100, 50], bulletLifeTime: 120, bulletSize: 8, bulletLength: 8,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [48], aoeDamageGradient: [30], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'icecube']
  },
  b_enemy_basic: {
    bulletDamage: 8, bulletSpeed: 6, bulletColor: [255, 100, 100], bulletLifeTime: 180, bulletSize: 6, bulletLength: 8,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['player', 'turret']
  },
  b_sniper_shot: {
    bulletDamage: 15, bulletSpeed: 18, bulletColor: [255, 50, 50], bulletLifeTime: 120, bulletSize: 4, bulletLength: 20,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['player', 'turret']
  },
  b_tnt_explosion: {
    bulletDamage: 250, bulletSpeed: 0, bulletColor: [255, 200, 50], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 3.5], 
      aoeDamageGradient: [250], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    stunDuration: 30, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'obstacle', 'player', 'turret', 'icecube']
  },
  b_mine_explosion: {
    bulletDamage: 600, bulletSpeed: 0, bulletColor: [255, 100, 0], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [64], 
      aoeDamageGradient: [600], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_floating_mine: {
    bulletDamage: 600, bulletSpeed: 8, bulletColor: [255, 60, 20], bulletLifeTime: HOUR_FRAMES * 6, bulletSize: 12, bulletLength: 4,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [64], 
      aoeDamageGradient: [600], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    damageTargets: ['enemy'],
    isStationaryVFX: true,
    stopAtTarget: true
  },
  b_laser_explosion: {
    bulletDamage: 40, bulletSpeed: 0, bulletColor: [255, 200, 100], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 1.5], 
      aoeDamageGradient: [40], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    damageTargets: ['enemy', 'obstacle']
  },
  b_stun_gas_projectile: {
    bulletDamage: 0, bulletSpeed: 8, bulletColor: [200, 200, 255], bulletLifeTime: 90, bulletSize: 8, bulletLength: 8,
    spawnGroundFeatureOnContact: ['gf_stun_gas'],
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    damageTargets: ['enemy', 'obstacle']
  },
  b_big_mine_explosion: {
    bulletDamage: 900, bulletSpeed: 0, bulletColor: [255, 50, 0], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 1.5], aoeDamageGradient: [900], dealAoeOnObstacle: true, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 1 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_ice_explosion: {
    bulletDamage: 10, bulletSpeed: 0, bulletColor: [100, 220, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    appliedConditions: [{ type: 'c_stun', duration: HOUR_FRAMES * 2 }],
    aoeConfig: { isAoe: true, aoeRadiusGradient: [48], aoeDamageGradient: [10], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy']
  },
  b_aoe_stun: {
    bulletDamage: 10, bulletSpeed: 0, bulletColor: [200, 200, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    appliedConditions: [{ type: 'c_stun', duration: HOUR_FRAMES * 3 }],
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE], aoeDamageGradient: [10], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy']
  },
  b_ice_bomb_explosion: {
    bulletDamage: 100, bulletSpeed: 0, bulletColor: [180, 240, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    appliedConditions: [
        { type: 'c_stun', duration: HOUR_FRAMES * 1 },
        { type: 'c_chilled', duration: HOUR_FRAMES * 2 }
    ],
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 2.5], aoeDamageGradient: [100], dealAoeOnObstacle: true, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0.5 },
    stunDuration: 0, slowDuration: 0, slowFactor: 0.3, obstacleDamageMultiplier: 0.5,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'obstacle']
  },
  b_pulse_tier2: {
    bulletDamage: 45, bulletSpeed: 0, bulletColor: [180, 220, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 1.5], aoeDamageGradient: [45], dealAoeOnObstacle: true, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 1 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_spike: {
    bulletDamage: 10, bulletSpeed: 0, bulletColor: [180, 220, 240], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 1.5], aoeDamageGradient: [10], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy']
  },
  // --- CHEAT BULLETS ---
  b_cheat_enemies: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 50, 50], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 5], 
      aoeDamageGradient: [1000], 
      dealAoeOnObstacle: false, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 0 
    },
    damageTargets: ['enemy']
  },
  b_cheat_blocks: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 255, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 5], 
      aoeDamageGradient: [1000], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    damageTargets: ['obstacle']
  }
};
