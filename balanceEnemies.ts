
import { GRID_SIZE, HOUR_FRAMES } from './constants';

const PURPLE_BASE = [142, 80, 200];
const PURPLE_ELITE = [100, 40, 180];
const PURPLE_GLOW = [200, 100, 255];

export const enemyTypes: any = {
  e_fast:    { cost: 10, health: 30,  speed: 0.8, size: 22, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 16 }, col: PURPLE_BASE, lootConfigOnDeath: 'e_fast' },
  e_basic:   { cost: 10, health: 60, speed: 0.4, size: 28, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_BASE, lootConfigOnDeath: 'e_basic' },
  e_armor1:  { cost: 20, health: 120, speed: 0.4, size: 32, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_BASE, lootConfigOnDeath: 'e_armor1' },
  e_armor2:  { cost: 40, health: 240, speed: 0.4, size: 34, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_ELITE, lootConfigOnDeath: 'e_armor2' },
  e_armor3:  { cost: 70, health: 480, speed: 0.4, size: 36, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: PURPLE_ELITE, lootConfigOnDeath: 'e_armor3' },
  e_shooting:{ cost: 30, health: 120, speed: 0.3, size: 30, actionType: ['moveDefault', 'shoot'], actionConfig: { bulletTypeKey: 'b_enemy_basic', shootRange: GRID_SIZE*4, shootFireRate: 60 }, col: PURPLE_GLOW, lootConfigOnDeath: 'e_shooting' },
  e_swarm:   { cost: 30, health: 120, speed: 0.3, size: 34, actionType: ['moveDefault', 'meleeAttack', 'spawnEnemy'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 16, enemyTypeToSpawn: ['e_critter'], spawnBudget: 16, spawnRadius: 60, spawnTriggerOnHealthRatio: [0], maxSpawnBudget: 16 }, col: PURPLE_GLOW, lootConfigOnDeath: 'e_swarm' },
  e_critter: { cost: 2,  health: 5,  speed: 0.6, size: 14, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 1, attackFireRate: 15, meleeAttackRange: 4 }, col: [220, 180, 255], lootConfigOnDeath: 'e_critter' },
  e_giant:   { cost: 250, health: 1800, speed: 0.2, size: 60, actionType: ['moveDefault', 'meleeAttack', 'spawnEnemy'], actionConfig: { damage: 100, attackFireRate: 60, meleeAttackRange: 24, enemyTypeToSpawn: ['e_fast'], spawnBudget: 10, spawnRadius: 80, spawnTriggerOnHealthRatio: [0.75, 0.5, 0.25], maxSpawnBudget: 30 }, col: PURPLE_ELITE, lootConfigOnDeath: 'e_giant' },
  e_shooting_giant: { cost: 350, health: 1800, speed: 0.2, size: 60, actionType: ['moveDefault', 'shoot'], actionConfig: { bulletTypeKey: 'b_enemy_giant', shootRange: GRID_SIZE*8, shootFireRate: [6,6,6,6,6,6,6,6,6,240], inaccuracy: 10 }, col: PURPLE_ELITE, lootConfigOnDeath: 'e_shooting_giant' },
  e_fly: { cost: 30, health: 60, speed: 0.5, size: 24, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: [180, 100, 255], lootConfigOnDeath: 'e_fly', isFlying: true },
  e_fly_armor1: { cost: 50, health: 120, speed: 0.5, size: 28, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: [180, 100, 255], lootConfigOnDeath: 'e_fly_armor1', isFlying: true },
  e_fly_armor2: { cost: 80, health: 240, speed: 0.5, size: 32, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8 }, col: [180, 100, 255], lootConfigOnDeath: 'e_fly_armor2', isFlying: true },
  e_snowthrower: { cost: 70, health: 320, speed: 0.3, size: 30, actionType: ['moveDefault', 'shoot'], actionConfig: { bulletTypeKey: 'b_snow', shootRange: GRID_SIZE*4, shootFireRate: [15,15,15,15,15,15,15,15,15,750], inaccuracy: 15 }, col: [150, 220, 255], lootConfigOnDeath: 'e_snowthrower' },
  e_snowthrower_giant: { cost: 750, health: 3000, speed: 0.2, size: 60, actionType: ['moveDefault', 'shoot'], actionConfig: { bulletTypeKey: 'b_snow', shootRange: GRID_SIZE*8, shootFireRate: [10,10,10,30], inaccuracy: 10 }, col: [100, 200, 255], lootConfigOnDeath: 'e_snowthrower_giant' },
  e_poison: { cost: 50, health: 180, speed: 0.4, size: 30, actionType: ['moveDefault', 'meleeAttack', 'spawnGroundFeature'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8, groundFeatureToSpawn: 'gf_poison_gas', spawnCount: 4, spawnRadius: GRID_SIZE*3, spawnTriggerOnHealthRatio: [0] }, col: [100, 255, 100], lootConfigOnDeath: 'e_poison' },
  e_bomb: { cost: 50, health: 120, speed: 0.8, size: 26, actionType: ['moveDefault', 'meleeAttack', 'spawnBullet'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8, bulletTypeToSpawn: 'b_bomb_death', spawnTriggerOnHealthRatio: [0] }, col: [255, 100, 100], lootConfigOnDeath: 'e_bomb' },
  e_rockpuncher: { cost: 120, health: 900, speed: 0.4, size: 40, actionType: ['moveDefault', 'meleeAttack', 'spawnObstacle'], actionConfig: { damage: 10, attackFireRate: 30, meleeAttackRange: 12, obstacleTypeToSpawn: 'o_stone', spawnCount: 2, spawnRadius: GRID_SIZE*3, spawnTriggerOnHealthRatio: [0] }, col: [150, 150, 150], lootConfigOnDeath: 'e_rockpuncher' },
  e_suneater: { cost: 80, health: 320, speed: 0.6, size: 30, actionType: ['stealSun', 'moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 8, stealRange: GRID_SIZE*6, healPerSun: 80, bypassMaxHealth: true, stealSunSpeedMultiplier: 2.0 }, col: [255, 255, 100], lootConfigOnDeath: 'e_suneater' },
  e_fastNoDrop:{ cost: 10, health: 30, speed: 1.0, size: 22, actionType: ['moveDefault', 'meleeAttack'], actionConfig: { damage: 5, attackFireRate: 30, meleeAttackRange: 16 }, col: PURPLE_BASE },
  e_dummyTarget: { cost: 0, health: 50000, speed: 0, size: 60, actionType: [], actionConfig: {}, col: [150, 150, 150] }
};
