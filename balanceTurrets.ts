
import { GRID_SIZE, HOUR_FRAMES } from './constants';

const placeholderT3 = { 
  health: 400, color: [100, 100, 100], size: 22, actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
};

export const turretTypes: any = {
  // --- TIER 0 SPECIAL ---
  t0_cherrybomb: {
    name: 'Cherry Bomb', cost: 15, health: 50, color: [255, 50, 50], size: 22, tier: 0, isSpecial: true,
    tooltip: "Explodes after 3s, damaging obstacles in a wide area",
    explosiveGrowth: true,
    isActiveWhileMoving: false,
    actionType: ['die'],
    actionConfig: { dieAfterDuration: 180, pulseBulletTypeKey: 'b_cherry_explosion' },
    targetType: [], targetConfig: {}
  },
  t0_firecherry: {
    name: 'Fire Cherry', cost: 25, health: 50, color: [255, 100, 0], size: 22, tier: 0, isSpecial: true,
    tooltip: "Explodes after 3s, leaving multiple fire puddles for 2h",
    explosiveGrowth: true,
    isActiveWhileMoving: false,
    actionType: ['die'],
    actionConfig: { dieAfterDuration: 180, pulseBulletTypeKey: 'b_firecherry_explosion' },
    targetType: [], targetConfig: {}
  },
  t0_iceshroom: {
    name: 'Ice Shroom', cost: 25, health: 50, color: [180, 240, 255], size: 22, tier: 0, isSpecial: true,
    tooltip: "Explodes after 6s, freezes enemies in a huge area for 4h",
    explosiveGrowth: true,
    isActiveWhileMoving: false,
    actionType: ['die'],
    actionConfig: { dieAfterDuration: 360, pulseBulletTypeKey: 'b_iceshroom_explosion' },
    targetType: [], targetConfig: {}
  },
  t0_starfruit: {
    name: 'Healing Starfruit', cost: 20, health: 100, color: [150, 255, 100], size: 22, tier: 0, isSpecial: true,
    tooltip: "Heal surrounding turrets over 2h",
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
    name: 'Rage Chili', cost: 30, health: 50, color: [255, 50, 50], size: 22, tier: 0, isSpecial: true,
    tooltip: "Allows the player to shoot while moving and gain x4 fire rate for 2h",
    isActiveWhileMoving: true,
    actionType: ['boostPlayer', 'die'],
    actionConfig: { dieAfterDuration: HOUR_FRAMES * 2 },
    targetType: [], targetConfig: {}
  },
  t0_puffshroom: {
    name: 'Puffshroom', cost: 5, health: 30, color: [200, 100, 255], size: 16, tier: 0, isSpecial: true,
    tooltip: "Shoots enemies at closer range, disappears after 12h",
    isActiveWhileMoving: false,
    actionType: ['shoot', 'die'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 5, shootFireRate: 60, dieAfterDuration: HOUR_FRAMES * 12 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t0_grapeshot: {
    name: 'Grapeshot', cost: 40, health: 50, color: [180, 80, 255], size: 22, tier: 0, isSpecial: true,
    tooltip: "Has 16 powerful projectiles to shoot at enemies.",
    isActiveWhileMoving: true,
    actionType: ['shoot', 'die'],
    actionConfig: { bulletTypeKey: 'b_grapeshot_shell', shootRange: GRID_SIZE * 10, shootFireRate: 45, dieAfterAction: 'shoot', dieAfterActionCount: 16 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'highestHealth' }
  },

  // --- TIER 1 ---
  t_pea: { 
    name: 'Peashooter', cost: 10, health: 50, color: [100, 255, 100], size: 22, tier: 1, cooldownHours: 1,
    tooltip: "Shoots bullets at enemies",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t_laser: { 
    name: 'Mining Laser', cost: 10, health: 50, color: [50, 200, 255], size: 22, tier: 1, cooldownHours: 1,
    tooltip: "Fires laser to break obstacles",
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t_wall: { 
    name: 'Wallnut', cost: 5, health: 300, color: [200, 200, 220], size: 22, tier: 1, cooldownHours: 2,
    tooltip: "Simple defensive wall",
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t_mine: {
    name: 'Landmine', cost: 5, health: 50, color: [255, 100, 20], size: 22, tier: 1, cooldownHours: 3,
    tooltip: "Mine explodes on contact, armed every 2h",
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_mine_explosion', 
      pulseTriggerRadius: GRID_SIZE * 1, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 2, 
      pulseCenteredAtTriggerSource: false, 
      hasUnarmedAsset: true,
      PulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t_ice: {
    name: 'Iceberg', cost: 5, health: 50, color: [150, 240, 255], size: 22, tier: 1, cooldownHours: 3,
    tooltip: "Freezes an enemy on contact for 2h, armed every 1h",
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_ice_explosion', 
      pulseTriggerRadius: GRID_SIZE * 1, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES, 
      pulseCenteredAtTriggerSource: true, 
      hasUnarmedAsset: true,
      PulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },

  // --- SPECIAL / REWARD ONLY ---
  t_sunflower: {
    name: 'Sunflower', cost: 0, health: 50, color: [255, 230, 50], size: 22, tier: 1.5,
    isActiveWhileMoving: false,
    tooltip: "Spawns 1 Sun every hour.",
    actionType: ['passiveSun'],
    actionConfig: { sunCooldown: HOUR_FRAMES },
    targetType: [], targetConfig: {}
  },
  t_seed: {
    name: 'Seed', cost: 0, health: 50, color: [200, 200, 200], size: 16, tier: 1.5,
    isActiveWhileMoving: false,
    tooltip: "Grows into a random Tier 1 turret over time. Water speeds up growth.",
    actionType: ['growth'],
    actionConfig: { maxGrowth: 32, growthInterval: HOUR_FRAMES * 0.25 },
    targetType: [], targetConfig: {}
  },
  t_seed2: {
    name: 'Seed (T2)', cost: 0, health: 50, color: [255, 200, 50], size: 18, tier: 1.5,
    isActiveWhileMoving: false,
    tooltip: "Grows into a random Tier 2 turret over time. Water speeds up growth.",
    actionType: ['growth'],
    actionConfig: { maxGrowth: 64, growthInterval: HOUR_FRAMES * 0.25 },
    targetType: [], targetConfig: {}
  },
  t_lilypad: {
    name: 'Lilypad', cost: 5, costType: 'soil', isSpecial: true, health: 100, color: [50, 200, 50], size: 24, tier: 1.2,
    turretLayer: 'ground', randomRotation: true, randomFlip: true,
    isActiveWhileMoving: false,
    tooltip: "Enables plants to work on water. Placed under units.",
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },

  // --- TIER 2 ---
  t2_repeater: {
    name: 'Repeater', cost: 25, health: 50, color: [0, 180, 80], size: 22, tier: 2,
    tooltip: "Shoots 2 bullets at once",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: [50, 10] },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_firepea: {
    name: 'Firepea', cost: 30, health: 50, color: [255, 60, 40], size: 22, tier: 2,
    tooltip: "Shoots at both enemy and obstacles, leaves a flaming puddle",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_firepea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'valuable' }
  },
  t2_laser2: {
    name: 'Laser MK2', cost: 25, health: 50, color: [100, 100, 255], size: 22, tier: 2,
    tooltip: "Laser breaks obstacles faster",
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 10, beamDamageRate: 3, beamWidth: 6, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 10 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t2_peanut: {
    name: 'Peanut', cost: 25, health: 300, color: [220, 200, 150], size: 22, tier: 2,
    tooltip: "Wall that shoots with high inaccuracy",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 10, shootFireRate: 15, inaccuracy: 45 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_puncher: {
    name: 'Puncher', cost: 20, health: 300, color: [120, 120, 255], size: 22, tier: 2,
    tooltip: "Fires close laser at both obstacles and enemies",
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 8, beamDamageRate: 6, beamWidth: 10, beamDuration: 1, beamFireRate: 15, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t2_tall: {
    name: 'Tallnut', cost: 15, health: 600, color: [140, 140, 150], size: 26, tier: 2,
    tooltip: "Tough defensive wall",
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t2_mortar: {
    name: 'Mortar', cost: 25, health: 50, color: [180, 100, 40], size: 22, tier: 2,
    tooltip: "Shoots at enemy, bullet explodes with splash damage",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_mortar_shell', shootRange: GRID_SIZE * 12, shootFireRate: 120 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_pulse: {
    name: 'Pulser', cost: 30, health: 50, color: [100, 255, 100], size: 22, tier: 2,
    tooltip: "Pulses surrounding damage waves at enemies",
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_pulse_tier2', pulseTriggerRadius: GRID_SIZE * 1.5, pulseTriggerBy: ['enemy', 'obstacle'], pulseCooldown: 120, pulseCenteredAtTriggerSource: false },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t2_laserexplode: {
    name: 'Exploding Laser', cost: 30, health: 50, color: [150, 40, 40], size: 22, tier: 2,
    tooltip: "Broken obstacle explodes, damaging nearby enemies and obstacles",
    actionType: ['laserBeam'],
    actionConfig: { 
        beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8,
        spawnBulletOnTargetDeath: 'b_laser_explosion'
    },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t2_minespawner: {
    name: 'Mine Launcher', cost: 25, health: 50, color: [255, 20, 20], size: 22, tier: 2,
    tooltip: "Launches a mine every 2h to a random direction",
    actionType: ['pulse', 'spawnBulletAtRandom'],
    actionConfig: { 
        pulseBulletTypeKey: 'b_mine_explosion',
        pulseTriggerRadius: GRID_SIZE * 1, 
        pulseTriggerBy: ['enemy'], 
        pulseCooldown: HOUR_FRAMES * 2, 
        pulseCenteredAtTriggerSource: false,
        hasUnarmedAsset: true,
        PulseTurretJumpAtTriggerSource: true,
        spawnBulletAtRandom: { 
            cooldown: HOUR_FRAMES * 2, 
            distRange: [GRID_SIZE * 3, GRID_SIZE * 3], 
            bulletKey: 'b_floating_mine' 
        }
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_snowpea: {
    name: 'Snowpea', cost: 25, health: 50, color: [200, 250, 255], size: 22, tier: 2,
    tooltip: "Shoots snow at random enemies, slowing them down",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_snowpea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'random' }
  },
  t2_iceray: {
    name: 'Ice Laser', cost: 20, health: 50, color: [150, 255, 255], size: 22, tier: 2,
    tooltip: "Slows down enemies contacting the laser beam",
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
    name: 'Spikerock', cost: 20, health: 5, color: [220, 220, 240], size: 24, tier: 2,
    tooltip: "Stay underground and damages enemies stepping over it",
    collideWithEnemy: false,
    renderBehindEnemy: true,
    isActiveWhileMoving: false,
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_spike', pulseTriggerRadius: GRID_SIZE * 1, pulseTriggerBy: ['enemy'], pulseCooldown: 60, pulseCenteredAtTriggerSource: false },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_icebomb: {
    name: 'Ice Bomb', cost: 20, health: 50, color: [180, 240, 255], size: 22, tier: 2,
    tooltip: "Explodes on contact, damaging and freezing enemies for 1h, armed every 2h",
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_ice_bomb_explosion', 
      pulseTriggerRadius: GRID_SIZE * 1.5, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 1, 
      pulseCenteredAtTriggerSource: false, 
      hasUnarmedAsset: true,
      PulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_stun: {
    name: 'Stunner', cost: 15, health: 50, color: [240, 240, 255], size: 22, tier: 2,
    tooltip: "Leaves a gas puddle on contact, stunning enemies that touches it, armed every 1h",
    actionType: ['pulse'],
    actionConfig: { 
      pulseBulletTypeKey: 'b_stun_gas_projectile', 
      pulseTriggerRadius: GRID_SIZE * 1, 
      pulseTriggerBy: ['enemy'], 
      pulseCooldown: HOUR_FRAMES * 1, 
      pulseCenteredAtTriggerSource: true, 
      hasUnarmedAsset: true,
      PulseTurretJumpAtTriggerSource: true 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },

  // --- TIER 3 ---
  t3_triplepea: { 
    name: 'Tripeater', cost: 40, health: 150, color: [0, 200, 50], size: 24, tier: 3,
    tooltip: "Shoots at 3 targets at once.",
    actionType: ['shootMultiTarget'],
    actionConfig: {
      bulletTypeKey: 'b_pea',
      shootRange: GRID_SIZE * 10,
      shootFireRate: 60,
      multiTargetMinCount: 3,
      multiTargetMaxCount: 3,
      multiTargetShootDelay: 6
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_firepea2: { 
    name: 'Firepea MK2', cost: 60, health: 100, color: [255, 100, 0], size: 22, tier: 3,
    tooltip: "Shoots and leaves a bigger-longer lasting flame puddle", 
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_firepea_t3', shootRange: GRID_SIZE * 10, shootFireRate: 60 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'valuable' }
  },
  t3_spinnut: { 
    name: 'Spin Nut', cost: 50, health: 400, color: [200, 200, 100], size: 26, tier: 3,
    tooltip: "Spins itself and shoots bullets when there's an enemy within range", 
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
    name: 'Mortar MK2', cost: 55, health: 100, color: [200, 50, 0], size: 22, tier: 3,
    tooltip: "Shoots at enemy, bullet explodes with greater splash damage", 
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_mortar_shell_t3', shootRange: GRID_SIZE * 14, shootFireRate: 240 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_snowpea2: { 
    name: 'Snowpea MK2', cost: 45, health: 100, color: [100, 200, 255], size: 22, tier: 3,
    tooltip: "Rapidly shoots snow at random enemies, slowing them down", 
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_snowpea', shootRange: GRID_SIZE * 10, shootFireRate: 30 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'random' }
  },
  t3_inferno: { 
    name: 'Inferno Ray', cost: 40, health: 300, color: [255, 50, 50], size: 24, tier: 3,
    tooltip: "Laser increases damage over time if not interrupted, prioritize highest health", 
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
    name: 'Flamethrower', cost: 55, health: 100, color: [255, 100, 0], size: 22, tier: 3,
    tooltip: "Shoots and spread flaming puddles along the way", 
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_flame_shot', shootRange: GRID_SIZE * 10, shootFireRate: [30,90] },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'random', obstaclePriority: 'valuable' }
  },
  t3_bowling: { 
    name: 'Bowling Bulb', cost: 55, health: 150, color: [180, 255, 50], size: 24, tier: 3,
    tooltip: "Shoots heavy rolling projectiles that pushes enemies out of the way", 
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
    name: 'Repulser', cost: 50, health: 150, color: [100, 255, 150], size: 22, tier: 3,
    tooltip: "Pulses surrounding damage waves at enemies, knocking them back", 
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
    name: 'Snow Peanut', cost: 50, health: 400, color: [180, 220, 255], size: 22, tier: 3,
    tooltip: "Wall that shoots with high inaccuracy, slowing enemies down", 
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
    name: 'Sky Mortar', cost: 70, health: 50, color: [50, 100, 255], size: 22, tier: 3,
    tooltip: "Fling mortar shells to the sky, slamming down on the toughest enemies", 
    actionType: ['launch'],
    actionConfig: { 
      bulletTypeKey: 'b_skymortar_shell', 
      shootRange: GRID_SIZE * 18, 
      shootFireRate: 480 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'highestHealth' }
  },
  t3_laser3: { 
    name: 'Mining Laser MK3', cost: 50, health: 50, tier: 3, color: [50, 200, 255], size: 22, tooltip: "Laser breaks obstacles super fast", 
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 20, beamDamageRate: 3, beamWidth: 8, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 10 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t3_puncher2: { 
    name: 'Puncher MK2', cost: 40, health: 400, color: [140, 140, 255], size: 24, tier: 3, tooltip: "Fires stronger close-range laser at both enemies and obstacles", 
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 15, beamDamageRate: 6, beamWidth: 12, beamDuration: 1, beamFireRate: 15, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t3_aoelaser: { 
    name: 'Melting Laser', cost: 60, health: 50, color: [255, 200, 100], size: 22, tier: 3, tooltip: "Fires laser that also damages nearby obstacles", 
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 10, beamDamageRate: 3, beamWidth: 6, beamDuration: 1, beamFireRate: 6, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8, beamBulletTypeKey: 'b_aoelaser_hit' },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t3_iceray2: { 
    name: 'Ice Laser MK2', cost: 45, health: 50, color: [180, 255, 255], size: 22, tier: 3, tooltip: "Freezes the enemies contacting the laser beam", 
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
    name: 'Mining Bomb', cost: 60, health: 150, color: [255, 100, 50], size: 24, tier: 3, tooltip: "Pulses when close to obstacles, damaging obstacles in a much wider area", 
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_miningbomb_explosion', pulseTriggerRadius: GRID_SIZE * 3.5, pulseTriggerBy: ['obstacle'], pulseCooldown: 120, pulseCenteredAtTriggerSource: false },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'closest' }
  },
  t3_tesla: { 
    name: 'Tesla Laser', cost: 40, health: 150, color: [100, 200, 255], size: 24, tier: 3, tooltip: "Creates electric chains between other Teslas, damaging everything on the way", 
    actionType: ['generateElectricChain', 'shoot'],
    actionConfig: { 
      electricChainDamageRate: 15, electricChainDamage: 5, electricChainDamageWidth: GRID_SIZE,
      electricChainMaxLength: GRID_SIZE * 3, electricChainMaxDamage: 15,
      bulletTypeKey: 'b_tesla_zap', shootRange: GRID_SIZE * 2, shootFireRate: 15
    },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t3_icepuncher: { 
    name: 'Ice Puncher', cost: 50, health: 50, color: [150, 200, 255], size: 24, tier: 3, tooltip: "Fires close-range laser that also slows down enemies", 
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 10, beamDamageRate: 6, beamWidth: 10, beamDuration: 1, beamFireRate: 15, beamDamageWidth: 0, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5, beamBulletTypeKey: 'b_icepuncher_hit' },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t3_densnut: { 
    name: 'Densenut', cost: 35, health: 1200, tier: 3, color: [200, 200, 220], size: 24, tooltip: "Super tough defensive wall", 
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t3_durian: { 
    name: 'Endurian', cost: 40, health: 400, tier: 3, color: [200, 180, 50], size: 22, tooltip: "Defensive wall that also damages contacting enemies", 
    actionType: ['pulse'],
    actionConfig: { 
        pulseBulletTypeKey: 'b_durian_pulse', 
        pulseTriggerRadius: GRID_SIZE * 1.0, 
        pulseTriggerBy: ['enemy'], 
        pulseCooldown: 15, 
        pulseCenteredAtTriggerSource: false 
    },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t3_spike2: { 
    name: 'Speed Spike', cost: 40, health: 10, tier: 3, color: [180, 180, 200], size: 24, tooltip: "Stay underground, damages contacting enemies with faster rate", 
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
    name: 'Holonut', cost: 35, health: 600, tier: 3, color: [150, 150, 255], size: 22, tooltip: "Has a force field to protect surrounding plants", 
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
    name: 'Mine Field', cost: 45, tier: 3, ...placeholderT3, tooltip: "Launches 8 mini mines upon planting, then keeps launching mines and exploding", 
    actionConfig: { hasUnarmedAsset: true }
  },
  t3_frostfield: { 
    name: 'Frost Field', cost: 50, tier: 3, ...placeholderT3, tooltip: "Emits a chilling field while armed. Explodes on contact and freezes enemies", 
    actionConfig: { hasUnarmedAsset: true }
  },
  t3_triberg: { 
    name: 'Iceberg Chain', cost: 35, tier: 3, ...placeholderT3, tooltip: "Leaves up to 3 gas puddles on enemies within range", 
    actionConfig: { hasUnarmedAsset: true }
  }
};
