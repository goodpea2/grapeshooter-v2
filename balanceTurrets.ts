
import { GRID_SIZE, HOUR_FRAMES } from './constants';

const placeholderT3 = { 
  health: 400, color: [100, 100, 100], size: 22, actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
};

export const turretTypes: any = {
  // --- TEST UNITS ---
  t_dummy: {
    name: 'Training Dummy', cost: 0, health: 10000, color: [150, 150, 150], size: 30, tier: 0, isSpecial: true,
    tooltip: "A massive block of reinforced wood. Used for combat testing.",
    isActiveWhileMoving: true, animationBodyType: 'tough',
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },

  // --- TIER 0 SPECIAL ---
  t0_cherrybomb: {
    name: 'Cherry Bomb', costs: { elixir: 20 }, health: 50, color: [255, 50, 50], size: 22, tier: 0, isSpecial: true,
    tooltip: "Explodes after 3s, damaging obstacles in a wide area",
    explosiveGrowth: true, animationBodyType: 'soft',
    isActiveWhileMoving: false,
    actionType: ['die'],
    actionConfig: { dieAfterDuration: 180, pulseBulletTypeKey: 'b_cherry_explosion' },
    targetType: [], targetConfig: {}
  },
  t0_firecherry: {
    name: 'Fire Cherry', costs: { elixir: 30 }, health: 50, color: [255, 100, 0], size: 22, tier: 0, isSpecial: true,
    tooltip: "Explodes after 3s, leaving multiple fire puddles for 2h",
    explosiveGrowth: true, animationBodyType: 'soft',
    isActiveWhileMoving: false,
    actionType: ['die'],
    actionConfig: { dieAfterDuration: 180, pulseBulletTypeKey: 'b_firecherry_explosion' },
    targetType: [], targetConfig: {}
  },
  t0_iceshroom: {
    name: 'Ice Shroom', costs: { elixir: 40 }, health: 50, color: [180, 240, 255], size: 22, tier: 0, isSpecial: true,
    tooltip: "Explodes after 6s, freezes enemies in a huge area for 4h",
    explosiveGrowth: true, animationBodyType: 'soft',
    isActiveWhileMoving: false,
    actionType: ['die'],
    actionConfig: { dieAfterDuration: 360, pulseBulletTypeKey: 'b_iceshroom_explosion' },
    targetType: [], targetConfig: {}
  },
  t0_starfruit: {
    name: 'Healing Starfruit', costs: { elixir: 30 }, health: 100, color: [150, 255, 100], size: 22, tier: 0, isSpecial: true,
    tooltip: "Heal surrounding turrets over 2h", animationBodyType: 'soft',
    isActiveWhileMoving: false,
    actionType: ['pulse', 'die'],
    actionConfig: { 
        pulseBulletTypeKey: 'b_healing_pulse', 
        pulseTriggerRadius: GRID_SIZE * 2.5, 
        pulseTriggerBy: ['turret'], 
        pulseCooldown: 60, 
        pulseCenteredAtTriggerSource: false,
        dieAfterDuration: HOUR_FRAMES * 2 
    },
    targetType: ['turret'], targetConfig: {}
  },
  t0_jalapeno: {
    name: 'Rage Chili', costs: { elixir: 20 }, health: 50, color: [255, 50, 50], size: 22, tier: 0, isSpecial: true,
    tooltip: "Allows the player to shoot while moving and gain x4 fire rate for 2h",
    isActiveWhileMoving: true, animationBodyType: 'soft',
    actionType: ['boostPlayer', 'die'],
    actionConfig: { dieAfterDuration: HOUR_FRAMES * 2 },
    targetType: [], targetConfig: {}
  },
  t0_puffshroom: {
    name: 'Puffshroom', costs: { soil: 8 }, health: 30, color: [200, 100, 255], size: 16, tier: 0, isSpecial: true,
    tooltip: "Shoots enemies at closer range, disappears after 12h",
    isActiveWhileMoving: false, animationBodyType: 'soft',
    actionType: ['shoot', 'die'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 5, shootFireRate: 60, dieAfterDuration: HOUR_FRAMES * 12 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t0_grapeshot: {
    name: 'Grapeshot', costs: { elixir: 50 }, health: 50, color: [180, 80, 255], size: 22, tier: 0, isSpecial: true,
    tooltip: "Has 16 powerful projectiles to shoot at enemies.",
    isActiveWhileMoving: true, animationBodyType: 'soft',
    actionType: ['shoot', 'die'],
    actionConfig: { bulletTypeKey: 'b_grapeshot_shell', shootRange: GRID_SIZE * 10, shootFireRate: 45, dieAfterAction: 'shoot', dieAfterActionCount: 16 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'highestHealth' }
  },

  // --- TIER 1 ---
  t_pea: { 
    name: 'Peashooter', costs: { sun: 10 }, costAlmanac: { leaf: 3 }, drops: { leaf: 1 }, health: 50, color: [100, 255, 100], size: 22, tier: 1, cooldownHours: 1,
    tooltip: "Shoots bullets at enemies", animationBodyType: 'soft',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t_laser: { 
    name: 'Mining Laser', costs: { sun: 10 }, costAlmanac: { shard: 3 }, drops: { shard: 1 }, health: 50, color: [50, 200, 255], size: 22, tier: 1, cooldownHours: 1,
    tooltip: "Fires laser to break obstacles", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t_wall: { 
    name: 'Wallnut', costs: { sun: 5 }, costAlmanac: { shell: 2 }, drops: { shell: 1 }, health: 300, color: [200, 200, 220], size: 22, tier: 1, cooldownHours: 2,
    tooltip: "Simple defensive wall", animationBodyType: 'tough',
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t_mine: {
    name: 'Landmine', costs: { sun: 5 }, costAlmanac: { fuel: 2 }, drops: { fuel: 1 }, health: 50, color: [255, 100, 20], size: 22, tier: 1, cooldownHours: 3,
    tooltip: "Mine explodes on contact, armed every 2h", animationBodyType: 'soft',
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_mine_explosion', 
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 2, 
      pulseCenteredAtTriggerSource: true, 
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t_ice: {
    name: 'Iceberg', costs: { sun: 5 }, costAlmanac: { ice: 2 }, drops: { ice: 1 }, health: 50, color: [150, 240, 255], size: 22, tier: 1, cooldownHours: 3,
    tooltip: "Freezes an enemy on contact for 2h, armed every 1h", animationBodyType: 'soft',
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_ice_explosion', 
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES, 
      pulseCenteredAtTriggerSource: true, 
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },

  // --- SPECIAL / REWARD ONLY ---
  t_sunflower: {
    name: 'Sunflower', cost: 0, health: 50, color: [255, 230, 50], size: 22, tier: 1.5,
    isActiveWhileMoving: false, animationBodyType: 'soft',
    tooltip: "Spawns 1 Sun every hour.",
    actionType: ['passiveSun'],
    actionConfig: { sunCooldown: HOUR_FRAMES },
    targetType: [], targetConfig: {}
  },
  t_seed: {
    name: 'Seed', cost: 0, health: 50, color: [200, 200, 200], size: 16, tier: 1.5,
    isActiveWhileMoving: false, animationBodyType: 'soft',
    tooltip: "Grows into a random Tier 1 turret over time. Water speeds up growth.",
    actionType: ['growth'],
    actionConfig: { maxGrowth: 32, growthInterval: HOUR_FRAMES * 0.25 },
    targetType: [], targetConfig: {}
  },
  t_seed2: {
    name: 'Seed (T2)', cost: 0, health: 50, color: [255, 200, 50], size: 16, tier: 1.5,
    isActiveWhileMoving: false, animationBodyType: 'soft',
    tooltip: "Grows into a random Tier 2 turret over time. Water speeds up growth.",
    actionType: ['growth'],
    actionConfig: { maxGrowth: 48, growthInterval: HOUR_FRAMES * 0.25 },
    targetType: [], targetConfig: {}
  },
  t_lilypad: {
    name: 'Lilypad', costs: { soil: 8 }, isSpecial: true, health: 100, color: [50, 200, 50], size: 24, tier: 1.2,
    turretLayer: 'ground', randomRotation: true, randomFlip: true, animationBodyType: 'soft',
    isActiveWhileMoving: false,
    tooltip: "Enables plants to work on water. Placed under plants",
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t_farm_bush: {
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
  },
  t_farm_crystal: {
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
  },
  t_farm_mob: {
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
  },

  // --- TIER 2 ---
  t2_repeater: {
    name: 'Repeater', costs: { sun: 25 }, costAlmanac: { leaf: 8 }, drops: { leaf: 2 }, health: 50, color: [0, 180, 80], size: 22, tier: 2,
    tooltip: "Shoots 2 bullets at once", animationBodyType: 'soft',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: [50, 10] },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_firepea: {
    name: 'Firepea', costs: { sun: 30 }, costAlmanac: { leaf: 4, shard: 6 }, drops: { leaf: 1, shard: 1 }, health: 50, color: [255, 60, 40], size: 22, tier: 2,
    tooltip: "Shoots at both enemy and obstacles, leaves a flaming puddle", animationBodyType: 'soft',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_firepea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'valuable' }
  },
  t2_laser2: {
    name: 'Laser MK2', costs: { sun: 25 }, costAlmanac: { shard: 8 }, drops: { shard: 2 }, health: 50, color: [100, 100, 255], size: 22, tier: 2,
    tooltip: "Laser breaks obstacles faster", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 10, beamDamageRate: 3, beamWidth: 6, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 10 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t2_peanut: {
    name: 'Peanut', costs: { sun: 25 }, costAlmanac: { leaf: 3, shell: 5 }, drops: { leaf: 1, shell: 1 }, health: 300, color: [220, 200, 150], size: 22, tier: 2,
    tooltip: "Wall that shoots with high inaccuracy", animationBodyType: 'tough',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 10, shootFireRate: 15, inaccuracy: 45 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_puncher: {
    name: 'Puncher', costs: { sun: 20 }, costAlmanac: { shard: 2, shell: 5 }, drops: { shard: 1, shell: 1 }, health: 300, color: [120, 120, 255], size: 22, tier: 2,
    tooltip: "Fires close laser at both obstacles and enemies", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 8, beamDamageRate: 6, beamWidth: 10, beamDuration: 1, beamFireRate: 15, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t2_tall: {
    name: 'Tallnut', costs: { sun: 15 }, costAlmanac: { shell: 5 }, drops: { shell: 2 }, health: 600, color: [140, 140, 150], size: 26, tier: 2,
    tooltip: "Tough defensive wall", animationBodyType: 'tough',
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t2_mortar: {
    name: 'Mortar', costs: { sun: 25 }, costAlmanac: { leaf: 4, fuel: 4 }, drops: { leaf: 1, fuel: 1 }, health: 50, color: [180, 100, 40], size: 22, tier: 2,
    tooltip: "Shoots at enemy, bullet explodes with splash damage", animationBodyType: 'tough',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_mortar_shell', shootRange: GRID_SIZE * 12, shootFireRate: 120 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_pulse: {
    name: 'Pulser', costs: { sun: 30 }, costAlmanac: { shell: 4, fuel: 6 }, drops: { shell: 1, fuel: 1 }, health: 50, color: [100, 255, 100], size: 22, tier: 2,
    tooltip: "Pulses surrounding damage waves at enemies", animationBodyType: 'soft',
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_pulse_tier2', pulseTriggerRadius: GRID_SIZE * 2.0, pulseTriggerBy: ['enemy', 'obstacle'], pulseCooldown: 120, pulseCenteredAtTriggerSource: false },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t2_laserexplode: {
    name: 'Exploding Laser', costs: { sun: 30 }, costAlmanac: { shard: 4, fuel: 6 }, drops: { shard: 1, fuel: 1 }, health: 50, color: [150, 40, 40], size: 22, tier: 2,
    tooltip: "Broken obstacle explodes, damaging nearby enemies and obstacles", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { 
        beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8,
        spawnBulletOnTargetDeath: 'b_laser_explosion'
    },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t2_minespawner: {
    name: 'Mine Launcher', costs: { sun: 25 }, costAlmanac: { fuel: 8 }, drops: { fuel: 2 }, health: 50, color: [255, 20, 20], size: 22, tier: 2,
    tooltip: "Launches a mine every 2h to a random direction", animationBodyType: 'soft',
    unarmedAssetApplyToAction: ['pulse'],
    actionType: ['pulse', 'spawnBulletAtRandom'],
    actionConfig: { 
        pulseBulletTypeKey: 'b_mine_explosion',
        pulseTriggerRadius: GRID_SIZE * 1.5, 
        pulseTriggerBy: ['enemy'], 
        pulseCooldown: HOUR_FRAMES * 2, 
        pulseCenteredAtTriggerSource: true,
        hasUnarmedAsset: true,
        pulseTurretJumpAtTriggerSource: true,
        spawnBulletAtRandom: { 
            cooldown: HOUR_FRAMES * 2, 
            distRange: [GRID_SIZE * 3, GRID_SIZE * 3], 
            bulletKey: 'b_floating_mine',
            enabledWhenActionIsReady: 'pulse'
        }
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_snowpea: {
    name: 'Snowpea', costs: { sun: 25 }, costAlmanac: { leaf: 5, ice: 3 }, drops: { leaf: 1, ice: 1 }, health: 50, color: [200, 250, 255], size: 22, tier: 2,
    tooltip: "Shoots snow at random enemies, slowing them down", animationBodyType: 'soft',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_snowpea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'random' }
  },
  t2_iceray: {
    name: 'Ice Laser', costs: { sun: 20 }, costAlmanac: { shard: 2, ice: 5 }, drops: { shard: 1, ice: 1 }, health: 50, color: [150, 255, 255], size: 22, tier: 2,
    tooltip: "Slows down enemies contacting the laser beam", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { 
        beamDamage: 5, 
        beamDamageRate: 6, 
        beamWidth: 4, 
        beamDuration: 1, 
        beamFireRate: 6, 
        beamDamageWidth: GRID_SIZE * 0.5, 
        beamAutoLength: true, 
        beamMaxLength: GRID_SIZE * 8,
        appliedConditions: [{ type: 'c_chilled', duration: 60 }]
    },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable', enemyPriority: 'closest' }
  },
  t2_spike: {
    name: 'Spikerock', costs: { sun: 20 }, costAlmanac: { shell: 4, ice: 3 }, drops: { shell: 1, ice: 1 }, health: 5, color: [220, 220, 240], size: 24, tier: 2,
    tooltip: "Stay underground and damages enemies stepping over it", animationBodyType: 'tough',
    collideWithEnemy: false,
    renderBehindEnemy: true,
    isActiveWhileMoving: false,
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_spike', pulseTriggerRadius: GRID_SIZE * 1, pulseTriggerBy: ['enemy'], pulseCooldown: 60, pulseCenteredAtTriggerSource: false },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_icebomb: {
    name: 'Ice Bomb', costs: { sun: 20 }, costAlmanac: { fuel: 2, ice: 5 }, drops: { fuel: 1, ice: 1 }, health: 50, color: [180, 240, 255], size: 22, tier: 2,
    tooltip: "Explodes on contact, damaging and freezing enemies for 1h, armed every 2h", animationBodyType: 'soft',
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_ice_bomb_explosion', 
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 1, 
      pulseCenteredAtTriggerSource: false, 
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_stun: {
    name: 'Stunner', costs: { sun: 15 }, costAlmanac: { ice: 5 }, drops: { ice: 2 }, health: 50, color: [240, 240, 255], size: 22, tier: 2,
    tooltip: "Leaves a gas puddle on contact, stunning enemies that touches it, armed every 1h", animationBodyType: 'soft',
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_stun_gas_projectile', 
      pulseTriggerRadius: GRID_SIZE * 2.0, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 1, 
      pulseCenteredAtTriggerSource: true, 
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },

  // --- TIER 3 ---
  t3_triplepea: { 
    name: 'Tripeater', costs: { sun: 50 }, costAlmanac: { leaf: 18 }, drops: { leaf: 3 }, health: 150, color: [0, 200, 50], size: 24, tier: 3,
    tooltip: "Shoots at 4 targets at once.", animationBodyType: 'soft',
    actionType: ['shootMultiTarget'],
    actionConfig: {
      bulletTypeKey: 'b_pea',
      shootRange: GRID_SIZE * 10,
      shootFireRate: 60,
      multiTargetMinCount: 4, // todo: improve this logic later
      multiTargetMaxCount: 4,
      multiTargetShootDelay: 4
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_firepea2: { 
    name: 'Firepea MK2', costs: { sun: 60 }, costAlmanac: { leaf: 8, shard: 12 }, drops: { leaf: 2, shard: 1 }, health: 100, color: [255, 100, 0], size: 22, tier: 3,
    tooltip: "Shoots and leaves a bigger-longer lasting flame puddle", animationBodyType: 'soft',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_firepea_t3', shootRange: GRID_SIZE * 10, shootFireRate: 60 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'valuable' }
  },
  t3_spinnut: { 
    name: 'Spin Nut', costs: { sun: 50 }, costAlmanac: { leaf: 8, shell: 10 }, drops: { leaf: 2, shell: 1 }, health: 400, color: [200, 200, 100], size: 26, tier: 3,
    tooltip: "Spins itself and shoots bullets when there's an enemy within range", animationBodyType: 'tough',
    actionType: ['shoot'],
    actionConfig: { 
        bulletTypeKey: 'b_pea_5dmg', 
        shootRange: GRID_SIZE * 8, 
        shootFireRate: 4,
        selfSpinDuration: 15,
        selfSpinSpeed: 4, // Revs per second
        selfSpinBehavior: 'loop'
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_mortar2: { 
    name: 'Mortar MK2', costs: { sun: 55 }, costAlmanac: { leaf: 10, fuel: 10 }, drops: { leaf: 2, fuel: 1 }, health: 100, color: [200, 50, 0], size: 22, tier: 3,
    tooltip: "Shoots at enemy, bullet explodes with greater splash damage", animationBodyType: 'tough',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_mortar_shell_t3', shootRange: GRID_SIZE * 14, shootFireRate: 240 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_snowpea2: { 
    name: 'Snowpea MK2', costs: { sun: 45 }, costAlmanac: { leaf: 9, ice: 6 }, drops: { leaf: 2, ice: 1 }, health: 100, color: [100, 200, 255], size: 22, tier: 3,
    tooltip: "Rapidly shoots snow at random enemies, slowing them down", animationBodyType: 'soft',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_snowpea', shootRange: GRID_SIZE * 10, shootFireRate: 30 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'random' }
  },
  t3_inferno: { 
    name: 'Inferno Ray', costs: { sun: 40 }, costAlmanac: { leaf: 4, shard: 6, shell: 2 }, drops: { leaf: 1, shard: 1, shell: 1 }, health: 300, color: [255, 50, 50], size: 24, tier: 3,
    tooltip: "Laser increases damage over time if not interrupted, prioritize highest health", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { 
        beamDamage: 5, 
        beamDamageRate: 15, 
        beamWidth: 3, 
        beamDuration: 1, 
        beamFireRate: 15, 
        beamDamageWidth: 0, 
        beamAutoLength: true, 
        beamMaxLength: GRID_SIZE * 5,
        uninteruptedDamageIncrease: [15, 30, 60],
        uninteruptedTimeForDamageIncrease: [120, 120, 120]
    },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'highestHealth', obstaclePriority: 'highestHealth' }
  },
  t3_flamethrower: { 
    name: 'Flamethrower', costs: { sun: 55 }, costAlmanac: { leaf: 6, shard: 8, fuel: 6 }, drops: { leaf: 1, shard: 1, fuel: 1 }, health: 100, color: [255, 100, 0], size: 22, tier: 3,
    tooltip: "Shoots and spread flaming puddles along the way", animationBodyType: 'soft',
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_flame_shot', shootRange: GRID_SIZE * 5, shootFireRate: [30,90] },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'random', obstaclePriority: 'valuable' }
  },
  t3_bowling: { 
    name: 'Bowling Bulb', costs: { sun: 55 }, costAlmanac: { leaf: 10, shard: 4, ice: 6 }, drops: { leaf: 1, shard: 1, ice: 1 }, health: 150, color: [180, 255, 50], size: 24, tier: 3,
    tooltip: "Shoots heavy rolling projectiles that pushes enemies out of the way", animationBodyType: 'tough',
    actionType: ['shoot'],
    actionConfig: { 
      bulletTypeKey: 'b_bowling_bulb', 
      shootRange: GRID_SIZE * 10, 
      shootFireRate: 120 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_repulser: { 
    name: 'Repulser', costs: { sun: 50 }, costAlmanac: { leaf: 4, shell: 6, fuel: 8 }, drops: { leaf: 1, shell: 1, fuel: 1 }, health: 150, color: [100, 255, 150], size: 22, tier: 3,
    tooltip: "Pulses surrounding damage waves at enemies, knocking them back", animationBodyType: 'soft',
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_repulser_pulse', 
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy', 'obstacle'], 
      pulseCooldown: 60, 
      pulseCenteredAtTriggerSource: false 
    },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t3_snowpeanut: { 
    name: 'Snow Peanut', costs: { sun: 50 }, costAlmanac: { leaf: 4, shell: 8, ice: 6 }, drops: { leaf: 1, shell: 1, ice: 1 }, health: 400, color: [180, 220, 255], size: 22, tier: 3,
    tooltip: "Wall that shoots with high inaccuracy, slowing enemies down", animationBodyType: 'tough',
    actionType: ['shoot'],
    actionConfig: { 
      bulletTypeKey: 'b_snowpea', 
      shootRange: GRID_SIZE * 10, 
      shootFireRate: 15, 
      inaccuracy: 45 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_skymortar: { 
    name: 'Sky Mortar', costs: { sun: 70 }, costAlmanac: { leaf: 10, fuel: 10, ice: 4 }, drops: { leaf: 1, fuel: 1, ice: 1 }, health: 50, color: [50, 100, 255], size: 22, tier: 3,
    tooltip: "Fling mortar shells to the sky, slamming down on the toughest enemies", animationBodyType: 'tough',
    actionType: ['launch'],
    actionConfig: { 
      bulletTypeKey: 'b_skymortar_shell', 
      shootRange: GRID_SIZE * 12, 
      shootFireRate: 480,
      hasUnarmedAsset: true
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'highestHealth' }
  },
  t3_laser3: { 
    name: 'Mining Laser MK3', costs: { sun: 50 }, costAlmanac: { shard: 18 }, drops: { shard: 3 }, health: 50, tier: 3, color: [50, 200, 255], size: 22, tooltip: "Laser breaks obstacles super fast", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 20, beamDamageRate: 3, beamWidth: 8, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 10 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t3_puncher2: { 
    name: 'Puncher MK2', costs: { sun: 40 }, costAlmanac: { shard: 4, shell: 8 }, drops: { shard: 2, shell: 1 }, health: 400, color: [140, 140, 255], size: 24, tier: 3, tooltip: "Fires stronger close-range laser at both enemies and obstacles", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 15, beamDamageRate: 6, beamWidth: 12, beamDuration: 1, beamFireRate: 15, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t3_aoelaser: { 
    name: 'Melting Laser', costs: { sun: 60 }, costAlmanac: { shard: 8, fuel: 12 }, drops: { shard: 2, fuel: 1 }, health: 50, color: [255, 200, 100], size: 22, tier: 3, tooltip: "Fires laser that also damages nearby obstacles", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 10, beamDamageRate: 3, beamWidth: 6, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8, beamBulletTypeKey: 'b_aoelaser_hit' },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t3_iceray2: { 
    name: 'Ice Laser MK2', costs: { sun: 45 }, costAlmanac: { shard: 6, ice: 9 }, drops: { shard: 2, ice: 1 }, health: 50, color: [180, 255, 255], size: 22, tier: 3, tooltip: "Freezes the enemies contacting the laser beam", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { 
        beamDamage: 10, 
        beamDamageRate: 6, 
        beamWidth: 6, 
        beamDuration: 1, 
        beamFireRate: 6, 
        beamDamageWidth: GRID_SIZE * 0.5, 
        beamAutoLength: true, 
        beamMaxLength: GRID_SIZE * 8,
        appliedConditions: [{ type: 'c_stun', duration: 60 }]
    },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable', enemyPriority: 'closest' }
  },
  t3_miningbomb: { 
    name: 'Mining Bomb', costs: { sun: 60 }, costAlmanac: { shard: 8, shell: 4, fuel: 8 }, drops: { shard: 1, shell: 1, fuel: 1 }, health: 150, color: [255, 100, 50], size: 24, tier: 3, tooltip: "Pulses when close to obstacles, damaging obstacles in a much wider area", animationBodyType: 'tough',
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_miningbomb_explosion', pulseTriggerRadius: GRID_SIZE * 1.5, pulseTriggerBy: ['obstacle'], pulseCooldown: 120, pulseCenteredAtTriggerSource: false },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'closest' }
  },
  t3_tesla: { 
    name: 'Tesla Laser', costs: { sun: 40 }, costAlmanac: { shard: 4, shell: 6, ice: 2 }, drops: { shard: 1, shell: 1, ice: 1 }, health: 300, color: [100, 200, 255], size: 24, tier: 3, tooltip: "Creates electric chains between other Teslas, damaging everything on the way", animationBodyType: 'tough',
    actionType: ['generateElectricChain', 'shoot'],
    actionConfig: { 
      electricChainDamageRate: 15, electricChainDamage: 5, electricChainDamageWidth: GRID_SIZE,
      electricChainMaxLength: GRID_SIZE * 5, electricChainMaxDamage: 15,
      bulletTypeKey: 'b_tesla_zap', shootRange: GRID_SIZE * 2, shootFireRate: 15
    },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_icepuncher: { 
    name: 'Ice Puncher', costs: { sun: 50 }, costAlmanac: { shard: 8, fuel: 2, ice: 8 }, drops: { shard: 1, fuel: 1, ice: 1 }, health: 50, color: [150, 200, 255], size: 24, tier: 3, tooltip: "Fires close-range laser that also slows down enemies", animationBodyType: 'tough',
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 10, beamDamageRate: 6, beamWidth: 10, beamDuration: 1, beamFireRate: 15, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5, beamBulletTypeKey: 'b_icepuncher_hit' },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t3_densnut: { 
    name: 'Densenut', costs: { sun: 35 }, costAlmanac: { shell: 12 }, drops: { shell: 3 }, health: 1200, tier: 3, color: [200, 200, 220], size: 24, tooltip: "Super tough defensive wall", animationBodyType: 'tough',
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t3_durian: { 
    name: 'Endurian', costs: { sun: 40 }, costAlmanac: { shell: 8, fuel: 4 }, drops: { shell: 2, fuel: 1 }, health: 400, tier: 3, color: [200, 180, 50], size: 22, tooltip: "Defensive wall that also damages contacting enemies", animationBodyType: 'tough',
    actionType: ['pulse'],
    actionConfig: { 
        pulseBulletTypeKey: 'b_durian_pulse', 
        pulseTriggerRadius: GRID_SIZE * 1.5, 
        pulseTriggerBy: ['enemy'], 
        pulseCooldown: 15, 
        pulseCenteredAtTriggerSource: false 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t3_spike2: { 
    name: 'Speed Spike', costs: { sun: 40 }, costAlmanac: { shell: 6, ice: 6 }, drops: { shell: 2, ice: 1 }, health: 10, tier: 3, color: [180, 180, 200], size: 24, tooltip: "Stay underground, damages contacting enemies with faster rate", animationBodyType: 'tough',
    collideWithEnemy: false,
    renderBehindEnemy: true,
    isActiveWhileMoving: false,
    actionType: ['pulse'],
    actionConfig: { 
        pulseBulletTypeKey: 'b_spike2_pulse', 
        pulseTriggerRadius: GRID_SIZE * 1.0, 
        pulseTriggerBy: ['enemy'], 
        pulseCooldown: 30, 
        pulseCenteredAtTriggerSource: false 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_holonut: { 
    name: 'Holonut', costs: { sun: 35 }, costAlmanac: { shell: 8, fuel: 2, ice: 2 }, drops: { shell: 1, fuel: 1, ice: 1 }, health: 600, tier: 3, color: [150, 150, 255], size: 22, tooltip: "Has a force field to protect surrounding plants", animationBodyType: 'tough',
    actionType: ['shield', 'pulse'],
    actionConfig: { 
        shieldRadius: GRID_SIZE * 2.8,
        pulseBulletTypeKey: 'b_holonut_heal', 
        pulseTriggerRadius: 1, 
        pulseTriggerBy: ['turret'], 
        pulseCooldown: 180, 
        pulseCenteredAtTriggerSource: true
    },
    targetType: ['turret'], targetConfig: {}
  },
  t3_minefield: { 
    name: 'Mine Field', costs: { sun: 45 }, costAlmanac: { fuel: 15 }, drops: { fuel: 3 }, health: 150, color: [255, 60, 0], size: 22, tier: 3, tooltip: "Launches 8 mini mines upon planting, then keeps launching mines and exploding", animationBodyType: 'soft',
    unarmedAssetApplyToAction: ['pulse'],
    actionType: ['pulse', 'spawnBulletAtRandom', 'firstStrike'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_minefield_explosion',
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 2, 
      pulseCenteredAtTriggerSource: true,
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true,
      spawnBulletAtRandom: { 
          cooldown: HOUR_FRAMES * 2, 
          distRange: [GRID_SIZE * 3, GRID_SIZE * 3], 
          bulletKey: 'b_floating_mine_t3',
          enabledWhenActionIsReady: 'pulse'
      },
      firstStrikeConfig: { actionToTrigger: 'spawnBulletAtRandom', triggerCount: 8, triggerRate: 10, FirstStrikeVfx: 'turret_first_strike' }
    },
    targetType: ['enemy'], targetConfig: { enemyPriority: 'closest' }
  },
  t3_frostfield: { 
    name: 'Frost Field', costs: { sun: 50 }, costAlmanac: { fuel: 6, ice: 12 }, drops: { fuel: 2, ice: 1 }, health: 150, color: [180, 240, 255], size: 22, tier: 3, tooltip: "Emits a chilling field while armed. Explodes on contact and freezes enemies", animationBodyType: 'soft',
    actionType: ['pulse', 'aura'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_frostfield_explosion', 
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 2, 
      pulseCenteredAtTriggerSource: false, 
      hasUnarmedAsset: true,
      pulseTurretJumpAtTriggerSource: true,
      auraConfig: { radius: GRID_SIZE * 2.8, appliedCondition: 'c_chilled', duration: 150, auraVfx: 'aura_frostfield' }
    },
    targetType: ['enemy'], targetConfig: { enemyPriority: 'closest' }
  },
  t3_triberg: { 
    name: 'Iceberg Chain', costs: { sun: 35 }, costAlmanac: { ice: 12 }, drops: { ice: 3 }, health: 150, color: [150, 240, 255], size: 22, tier: 3, tooltip: "Leaves up to 3 gas puddles on enemies within range", animationBodyType: 'soft',
    actionType: ['shootMultiTarget'],
    actionConfig: { 
      hasUnarmedAsset: true,
      bulletTypeKey: 'b_triberg_gas_projectile', 
      shootRange: GRID_SIZE * 3.5, 
      shootFireRate: HOUR_FRAMES * 2,
      multiTargetMinCount: 1,
      multiTargetMaxCount: 3,
      multiTargetShootDelay: 60,
      inaccuracy: 15
    },
    targetType: ['enemy'], targetConfig: { enemyPriority: 'random' }
  },
  tx_goldengrape: { 
    name: 'Golden Grape', costs: { elixir: 500 }, costAlmanac: { leaf: 100, shard: 100, shell: 100 }, drops: { leaf: 10, shard: 10, shell: 10 }, health: 400, color: [255, 215, 0], size: 24, isSpecial: true, tier: 0,
    tooltip: "Buy the Golden Grape and win the game", animationBodyType: 'soft',
    actionType: ['launchMultiTarget'],
    actionConfig: { 
      bulletTypeKey: 'b_goldengrape_firework', 
      shootRange: GRID_SIZE * 12, 
      shootFireRate: 240,
      multiTargetMinCount: 8,
      multiTargetMaxCount: 8,
      multiTargetShootDelay: 12,
      hasUnarmedAsset: false
    },
    targetType: ['enemy', 'obstacle', 'turret'],
    targetConfig: { enemyPriority: 'random', obstaclePriority: 'random' }
  }
};
