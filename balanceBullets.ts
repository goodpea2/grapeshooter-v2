
import { GRID_SIZE, HOUR_FRAMES } from './constants';

export const bulletTypes: any = {
  b_player: {
    bulletDamage: 4, bulletSpeed: 10, bulletColor: [225, 225, 100], bulletLifeTime: 180, bulletSize: 4, bulletLength: 8,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_player_mining: {
    bulletDamage: 8, bulletSpeed: 10, bulletColor: [255, 255, 100], bulletLifeTime: 180, bulletSize: 4, bulletLength: 8,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 1 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['obstacle', 'icecube']
  },
  b_pea: {
    bulletDamage: 10, bulletSpeed: 6, bulletColor: [150, 255, 100], bulletLifeTime: 90, bulletSize: 8, bulletLength: 8,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'icecube']
  },
  b_firepea: {
    bulletDamage: 10, bulletSpeed: 6, bulletColor: [255, 180, 50], bulletLifeTime: 90, bulletSize: 10, bulletLength: 10,
    spawnGroundFeatureOnContact: ['gf_fire_puddle'],
    spawnGroundFeaturePerFrame: -1,
    spawnGroundFeatureInRadius: 0,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0.5 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0.5,
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_snowpea: {
    bulletDamage: 10, bulletSpeed: 6, bulletColor: [150, 220, 255], bulletLifeTime: 90, bulletSize: 8, bulletLength: 8,
    appliedConditions: [{ type: 'c_chilled', duration: 150 }],
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['enemy', 'icecube']
  },
  b_mortar_shell: {
    bulletDamage: 20, bulletSpeed: 4, bulletColor: [200, 100, 50], bulletLifeTime: 120, bulletSize: 12, bulletLength: 12,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE*1.5], aoeDamageGradient: [10], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0.5,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    cameraShakeOnDeath: [3, 5, 0.8],
    damageTargets: ['enemy', 'icecube', 'obstacle']
  },
  b_grapeshot_shell: {
    bulletDamage: 150, bulletSpeed: 6, bulletColor: [200, 100, 255], bulletLifeTime: 60, bulletSize: 20, bulletLength: 20,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE*1,GRID_SIZE*1.5], aoeDamageGradient: [100,10], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    cameraShakeOnDeath: [10, 12, 0.8],
    damageTargets: ['enemy']
  },
  b_enemy_basic: {
    bulletDamage: 8, bulletSpeed: 3, bulletColor: [255, 100, 100], bulletLifeTime: 180, bulletSize: 4, bulletLength: 12,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['player', 'turret']
  },
  b_sniper_shot: {
    bulletDamage: 15, bulletSpeed: 12, bulletColor: [255, 50, 50], bulletLifeTime: 120, bulletSize: 4, bulletLength: 20,
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: false, aoeObstacleDamageMultiplier: 0 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 0,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    damageTargets: ['player', 'turret']
  },
  b_tnt_explosion: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 200, 50], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 2.5,GRID_SIZE * 4.5], 
      aoeDamageGradient: [60,5], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 5.0 
    },
    stunDuration: 30, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    cameraShakeOnDeath: [15, 20, 0.97],
    damageTargets: ['enemy', 'obstacle', 'player', 'turret', 'icecube']
  },
  b_cherry_explosion: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 50, 50], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 2.5,GRID_SIZE * 4,GRID_SIZE * 5.5], 
      aoeDamageGradient: [90,60,10], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 10 
    },
    cameraShakeOnDeath: [15, 20, 0.97],
    damageTargets: ['enemy','obstacle']
  },
  b_firecherry_explosion: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 100, 0], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 4.5], 
      aoeDamageGradient: [50], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, 
    spawnGroundFeatureInRadius: GRID_SIZE * 4.5,
    spawnGroundFeatureCount: 20,
    spawnGroundFeatureKeys: ['gf_firecherry_puddle'],
    cameraShakeOnDeath: [15, 20, 0.97],
    damageTargets: ['enemy', 'obstacle']
  },
  b_iceshroom_explosion: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [180, 240, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    appliedConditions: [
        { type: 'c_stun', duration: HOUR_FRAMES * 4 },
        { type: 'c_chilled', duration: HOUR_FRAMES * 6 }
    ],
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 12], 
      aoeDamageGradient: [20], 
      dealAoeOnObstacle: false, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 0 
    },
    cameraShakeOnDeath: [3, 5, 0.90],
    damageTargets: ['enemy']
  },
  b_healing_pulse: {
    bulletDamage: -5, bulletSpeed: 0, bulletColor: [100, 255, 100], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 2.5], 
      aoeDamageGradient: [-5], 
      dealAoeOnObstacle: false, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 0 
    },
    damageTargets: ['turret']
  },
  b_mine_explosion: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 100, 0], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 0.5, GRID_SIZE * 1.5], 
      aoeDamageGradient: [600,100], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    cameraShakeOnDeath: [10, 12, 0.95],
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_floating_mine: {
    bulletDamage: 0, bulletSpeed: 3, bulletColor: [255, 60, 20], bulletLifeTime: HOUR_FRAMES * 6, bulletSize: 12, bulletLength: 4,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 0.5, GRID_SIZE * 1.5], 
      aoeDamageGradient: [600,100], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1.0 
    },
    cameraShakeOnDeath: [10, 12, 0.95],
    damageTargets: ['enemy', 'obstacle', 'icecube'],
    isStationaryVFX: true,
    stopAtTarget: true,
    idleAssetImg: 'img_t_mine_front'
  },
  b_laser_explosion: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 200, 100], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { 
      isAoe: true, 
      aoeRadiusGradient: [GRID_SIZE * 1.5, GRID_SIZE * 2.5], 
      aoeDamageGradient: [40,10], 
      dealAoeOnObstacle: true, 
      dealAoeAfterLifetime: true, 
      aoeObstacleDamageMultiplier: 1 
    },
    cameraShakeOnDeath: [6, 9, 0.8],
    damageTargets: ['enemy', 'obstacle']
  },
  b_stun_gas_projectile: {
    bulletDamage: 0, bulletSpeed: 3, bulletColor: [200, 200, 255], bulletLifeTime: 90, bulletSize: 8, bulletLength: 8,
    spawnGroundFeatureOnContact: ['gf_stun_gas'],
    aoeConfig: { isAoe: false, aoeRadiusGradient: [], aoeDamageGradient: [], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
    damageTargets: ['enemy', 'obstacle']
  },
  b_big_mine_explosion: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [255, 50, 0], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 1.5, GRID_SIZE * 2.5], aoeDamageGradient: [900,100], dealAoeOnObstacle: true, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 1 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    cameraShakeOnDeath: [12, 16, 0.95],
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_ice_explosion: {
    bulletDamage: 10, bulletSpeed: 0, bulletColor: [100, 220, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    appliedConditions: [{ type: 'c_stun', duration: HOUR_FRAMES * 2 }],
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE*0.5], aoeDamageGradient: [10], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
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
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 1.5, GRID_SIZE * 2.5], aoeDamageGradient: [100,30], dealAoeOnObstacle: true, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0.5 },
    stunDuration: 0, slowDuration: 0, slowFactor: 0.3, obstacleDamageMultiplier: 0.5,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    cameraShakeOnDeath: [12, 15, 0.9],
    damageTargets: ['enemy', 'obstacle']
  },
  b_pulse_tier2: {
    bulletDamage: 0, bulletSpeed: 0, bulletColor: [180, 220, 255], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 1.5], aoeDamageGradient: [45], dealAoeOnObstacle: true, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 1 },
    stunDuration: 0, slowDuration: 0, slowFactor: 1, obstacleDamageMultiplier: 1,
    spawnGroundFeatureOnContact: [], spawnGroundFeaturePerFrame: -1, spawnGroundFeatureInRadius: 0,
    cameraShakeOnDeath: [6, 9, 0.8],
    damageTargets: ['enemy', 'obstacle', 'icecube']
  },
  b_spike: {
    bulletDamage: 10, bulletSpeed: 0, bulletColor: [180, 220, 240], bulletLifeTime: 1, bulletSize: 1, bulletLength: 1,
    aoeConfig: { isAoe: true, aoeRadiusGradient: [GRID_SIZE * 1], aoeDamageGradient: [10], dealAoeOnObstacle: false, dealAoeAfterLifetime: true, aoeObstacleDamageMultiplier: 0 },
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
    cameraShakeOnDeath: [3, 5, 0.8],
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
    cameraShakeOnDeath: [3, 5, 0.8],
    damageTargets: ['obstacle']
  }
};
