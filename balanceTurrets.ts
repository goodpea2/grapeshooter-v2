
import { GRID_SIZE, HOUR_FRAMES } from './constants';

const placeholderT3 = { 
  health: 400, actionType: [], actionConfig: {}, targetType: [], targetConfig: {}, tooltip: "Logic under development." 
};

export const turretTypes: any = {
  // --- TIER 1 ---
  t_pea: { 
    name: 'Peashooter', cost: 10, health: 50, color: [100, 255, 100], size: 18, tier: 1, cooldownHours: 1,
    tooltip: "High damage vs enemies. No block damage.",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t_laser: { 
    name: 'Mining Laser', cost: 10, health: 50, color: [50, 200, 255], size: 18, tier: 1, cooldownHours: 1,
    tooltip: "Rapid mining beam. High block priority.",
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageAcrossLength: false, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t_wall: { 
    name: 'Wallnut', cost: 5, health: 300, color: [200, 200, 220], size: 22, tier: 1, cooldownHours: 2,
    tooltip: "Heavy defensive armor.",
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t_mine: {
    name: 'Landmine', cost: 5, health: 50, color: [255, 100, 20], size: 16, tier: 1, cooldownHours: 3,
    tooltip: "Explosive trap. Arms every 2h.",
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
    name: 'Iceberg', cost: 5, health: 50, color: [150, 240, 255], size: 16, tier: 1, cooldownHours: 3,
    tooltip: "Freeze trap. Arms every 1h.",
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
    name: 'Sunflower', cost: 0, health: 50, color: [255, 230, 50], size: 20, tier: 1.5,
    tooltip: "Passive Generator. Spawns 1 Sun every hour.",
    actionType: ['passiveSun'],
    actionConfig: { sunCooldown: HOUR_FRAMES },
    targetType: [], targetConfig: {}
  },
  t_seed: {
    name: 'Seed', cost: 0, health: 50, color: [200, 200, 200], size: 18, tier: 1.5,
    tooltip: "Grows into a random Tier 1 turret over time. Water speeds growth.",
    actionType: ['growth'],
    actionConfig: { maxGrowth: 32, growthInterval: HOUR_FRAMES * 0.25 },
    targetType: [], targetConfig: {}
  },
  t_lilypad: {
    name: 'Lilypad', cost: 5, costType: 'soil', isSpecial: true, health: 100, color: [50, 200, 50], size: 22, tier: 1.2,
    turretLayer: 'ground', randomRotation: true, randomFlip: true,
    tooltip: "Enables turrets to work on water. Placed under units.",
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },

  // --- TIER 2 ---
  t2_repeater: {
    name: 'Repeater', cost: 10, mergeCost: 5, health: 50, color: [0, 180, 80], size: 20, tier: 2,
    tooltip: "Shoots bursts: 50f delay, then 10f burst.",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 8, shootFireRate: [50, 10] },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_firepea: {
    name: 'Firepea', cost: 20, mergeCost: 10, health: 50, color: [255, 60, 40], size: 20, tier: 2,
    tooltip: "Shoots fire peas that leave a 1s damaging puddle. Targets obstacles.",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_firepea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'valuable' }
  },
  t2_laser2: {
    name: 'Laser MK2', cost: 20, mergeCost: 10, health: 50, color: [100, 100, 255], size: 20, tier: 2,
    tooltip: "Twice as powerful mining laser with longer range.",
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 10, beamDamageRate: 3, beamWidth: 6, beamDuration: 1, beamFireRate: 6, beamDamageAcrossLength: false, beamAutoLength: true, beamMaxLength: GRID_SIZE * 10 },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t2_peanut: {
    name: 'Peanut', cost: 15, mergeCost: 10, health: 300, color: [220, 200, 150], size: 22, tier: 2,
    tooltip: "Tough armored pea shooter. Has 30 degree inaccuracy.",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_pea', shootRange: GRID_SIZE * 10, shootFireRate: 15, inaccuracy: 30 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_puncher: {
    name: 'Puncher', cost: 15, mergeCost: 5, health: 300, color: [120, 120, 255], size: 22, tier: 2,
    tooltip: "Short range heavy impact beam. Hits enemies and blocks.",
    actionType: ['laserBeam'],
    actionConfig: { beamDamage: 8, beamDamageRate: 6, beamWidth: 10, beamDuration: 1, beamFireRate: 15, beamDamageAcrossLength: false, beamAutoLength: true, beamMaxLength: GRID_SIZE * 2.5 },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t2_tall: {
    name: 'Tallnut', cost: 10, mergeCost: 5, health: 600, color: [140, 140, 150], size: 26, tier: 2,
    tooltip: "Massive defense plate.",
    actionType: [], actionConfig: {}, targetType: [], targetConfig: {}
  },
  t2_mortar: {
    name: 'Mortar', cost: 15, mergeCost: 10, health: 50, color: [180, 100, 40], size: 22, tier: 2,
    tooltip: "Fires AOE shells at enemies.",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_mortar_shell', shootRange: GRID_SIZE * 12, shootFireRate: 120 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_pulse: {
    name: 'Pulser', cost: 20, mergeCost: 15, health: 50, color: [100, 255, 255], size: 22, tier: 2,
    tooltip: "Fires close-range AOE pulse at enemies and blocks.",
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_pulse_tier2', pulseTriggerRadius: GRID_SIZE * 1.5, pulseTriggerBy: ['enemy', 'obstacle'], pulseCooldown: 120, pulseCenteredAtTriggerSource: false },
    targetType: ['enemy', 'obstacle'],
    targetConfig: { enemyPriority: 'closest', obstaclePriority: 'closest' }
  },
  t2_laserexplode: {
    name: 'Exploding Laser', cost: 15, mergeCost: 10, health: 50, color: [150, 40, 40], size: 18, tier: 2,
    tooltip: "Mining laser. Destroyed blocks explode for 40 damage in 1.5 radius.",
    actionType: ['laserBeam'],
    actionConfig: { 
        beamDamage: 5, beamDamageRate: 3, beamWidth: 4, beamDuration: 1, beamFireRate: 6, beamDamageAcrossLength: false, beamAutoLength: true, beamMaxLength: GRID_SIZE * 8,
        spawnBulletOnTargetDeath: 'b_laser_explosion'
    },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable' }
  },
  t2_minespawner: {
    name: 'Mine Launcher', cost: 20, mergeCost: 15, health: 50, color: [255, 20, 20], size: 20, tier: 2,
    tooltip: "Launches floating mines AND acts as a landmine itself.",
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
    name: 'Snowpea', cost: 15, mergeCost: 5, health: 50, color: [200, 250, 255], size: 20, tier: 2,
    tooltip: "Shoots freezing peas that slow enemies.",
    actionType: ['shoot'],
    actionConfig: { bulletTypeKey: 'b_snowpea', shootRange: GRID_SIZE * 8, shootFireRate: 60 },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'random' }
  },
  t2_iceray: {
    name: 'Ice Laser', cost: 10, mergeCost: 0, health: 50, color: [150, 255, 255], size: 18, tier: 2,
    tooltip: "Slows down enemies contacting the laser beam.",
    actionType: ['laserBeam'],
    actionConfig: { 
        beamDamage: 5, 
        beamDamageRate: 6, 
        beamWidth: 4, 
        beamDuration: 1, 
        beamFireRate: 6, 
        beamDamageAcrossLength: true, 
        beamAutoLength: true, 
        beamMaxLength: GRID_SIZE * 8,
        appliedConditions: [{ type: 'c_chilled', duration: 60 }]
    },
    targetType: ['obstacle'],
    targetConfig: { obstaclePriority: 'valuable', enemyPriority: 'closest' }
  },
  t2_spike: {
    name: 'Spikerock', cost: 15, mergeCost: 10, health: 5, color: [220, 220, 240], size: 24, tier: 2,
    tooltip: "Stay underground and damages enemies stepping over it.",
    collideWithEnemy: false,
    renderBehindEnemy: true,
    actionType: ['pulse'],
    actionConfig: { pulseBulletTypeKey: 'b_pulse_tier2', pulseTriggerRadius: GRID_SIZE * 1, pulseTriggerBy: ['enemy'], pulseCooldown: 60, pulseCenteredAtTriggerSource: false },
    targetType: ['enemy'],
    targetConfig: { enemyPriority: 'closest' }
  },
  t2_icebomb: {
    name: 'Ice Bomb', cost: 10, mergeCost: 5, health: 50, color: [180, 240, 255], size: 18, tier: 2,
    tooltip: "Explodes on contact, damaging and freezing enemies.",
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
    name: 'Stunner', cost: 10, mergeCost: 5, health: 50, color: [240, 240, 255], size: 18, tier: 2,
    tooltip: "Emits a stun cloud on contact with enemies. Arms every 1h.",
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
  t3_triplepea: { name: 'Tripeater', color: [0, 200, 50], size: 24, tier: 3, mergeCost: 15, ...placeholderT3 },
  t3_firepea2: { name: 'Firepea MK2', color: [255, 80, 20], size: 24, tier: 3, mergeCost: 20, ...placeholderT3 },
  t3_spinnut: { name: 'Spin Nut', color: [240, 220, 180], size: 26, tier: 3, mergeCost: 15, ...placeholderT3 },
  t3_mortar2: { name: 'Mortar MK2', color: [200, 120, 60], size: 24, tier: 3, mergeCost: 20, ...placeholderT3 },
  t3_snowpea2: { name: 'Snowpea MK2', color: [200, 255, 255], size: 24, tier: 3, mergeCost: 15, ...placeholderT3 },
  t3_inferno: { name: 'Inferno Ray', color: [255, 100, 50], size: 22, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_flamethrower: { name: 'Flamethrower', color: [255, 150, 0], size: 22, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_stickylaser: { name: 'Sticky Laser', color: [100, 255, 200], size: 22, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_repulser: { name: 'Repulser', color: [180, 180, 200], size: 26, tier: 3, mergeCost: 20, ...placeholderT3 },
  t3_snowpeanut: { name: 'Snow Peanut', color: [200, 220, 255], size: 26, tier: 3, mergeCost: 20, ...placeholderT3 },
  t3_skymortar: { name: 'Sky Mortar', color: [150, 100, 255], size: 24, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_laser3: { name: 'Mining Laser MK3', color: [50, 150, 255], size: 24, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_puncher2: { name: 'Puncher MK2', color: [150, 150, 255], size: 24, tier: 3, mergeCost: 20, ...placeholderT3 },
  t3_aoelaser: { name: 'Melting Laser', color: [255, 50, 100], size: 24, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_iceray2: { name: 'Ice Laser MK2', color: [150, 255, 255], size: 24, tier: 3, mergeCost: 20, ...placeholderT3 },
  t3_miningbomb: { name: 'Mining Bomb', color: [100, 80, 60], size: 24, tier: 3, mergeCost: 30, ...placeholderT3 },
  t3_tesla: { name: 'Tesla Laser', color: [200, 200, 255], size: 22, tier: 3, mergeCost: 30, ...placeholderT3 },
  t3_icepuncher: { name: 'Ice Puncher', color: [180, 220, 255], size: 24, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_densnut: { name: 'Densenut', color: [120, 120, 130], size: 28, tier: 3, mergeCost: 20, ...placeholderT3 },
  t3_durian: { name: 'Endurian', color: [100, 150, 50], size: 28, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_spike2: { name: 'Frost Spike', color: [180, 240, 255], size: 28, tier: 3, mergeCost: 25, ...placeholderT3 },
  t3_holonut: { name: 'Holonut', color: [150, 200, 255], size: 26, tier: 3, mergeCost: 30, ...placeholderT3 },
  t3_squash: { name: 'Squash Mine', color: [50, 200, 50], size: 24, tier: 3, mergeCost: 30, ...placeholderT3 },
  t3_frostfield: { name: 'Frost Field', color: [200, 255, 255], size: 24, tier: 3, mergeCost: 30, ...placeholderT3 },
  t3_triberg: { name: 'Iceberg Chain', color: [150, 250, 255], size: 24, tier: 3, mergeCost: 30, ...placeholderT3 }
};
