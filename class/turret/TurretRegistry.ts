
import { AttachedTurret } from '../attachedTurret';
import { WorldTurret } from '../worldTurret';
import { PeaAttachedTurret, PeaWorldTurret } from './type/t_pea';
import { MinechargeAttachedTurret, MinechargeWorldTurret } from './type/t3_minecharge';

/**
 * Registry for custom turret logic classes.
 * Maps turret type keys to their respective Attached and World class implementations.
 */
export const TurretLogicMap: Record<string, { Attached?: any, World?: any }> = {

  't3_minecharge': { Attached: MinechargeAttachedTurret, World: MinechargeWorldTurret }
};

/**
 * Factory function to create an AttachedTurret instance.
 * Uses a custom class from the registry if available, otherwise falls back to the base AttachedTurret.
 */
export function createAttachedTurret(type: string, parent: any, hq: number, hr: number): AttachedTurret {
  const entry = TurretLogicMap[type];
  if (entry?.Attached) {
    return new entry.Attached(type, parent, hq, hr);
  }
  return new AttachedTurret(type, parent, hq, hr);
}

/**
 * Factory function to create a WorldTurret instance.
 * Uses a custom class from the registry if available, otherwise falls back to the base WorldTurret.
 */
export function createWorldTurret(type: string, gx: number, gy: number): WorldTurret {
  const entry = TurretLogicMap[type];
  if (entry?.World) {
    return new entry.World(type, gx, gy);
  }
  return new WorldTurret(type, gx, gy);
}

/**
 * Copies all active and preserved turret state from one turret instance to another.
 */
export function copyTurretState(from: any, to: any) {
  if (!from || !to) return;
  if (from.health !== undefined) to.health = from.health;
  if (from.maxHealth !== undefined) to.maxHealth = from.maxHealth;
  if (from.baseIngredients) to.baseIngredients = [...from.baseIngredients];
  if (from.stats) to.stats = { ...from.stats };
  if (from.angle !== undefined) to.angle = from.angle;
  if (from.conditions) to.conditions = new Map(from.conditions);
  if (from.conditionData) to.conditionData = new Map(from.conditionData);
  if (from.actionTimers) to.actionTimers = new Map(from.actionTimers);
  if (from.growthProgress !== undefined) to.growthProgress = from.growthProgress;
  if (from.staminaSpent !== undefined) to.staminaSpent = from.staminaSpent;
  if (from.customAssetImg !== undefined) to.customAssetImg = from.customAssetImg;
  if (from.farmStage !== undefined) to.farmStage = from.farmStage;
  if (from.farmGrowthTimer !== undefined) to.farmGrowthTimer = from.farmGrowthTimer;
  if (from.farmHarvestHp !== undefined) to.farmHarvestHp = from.farmHarvestHp;
  if (from.firstStrikeCount !== undefined) to.firstStrikeCount = from.firstStrikeCount;
  if (from.isWaterlogged !== undefined) to.isWaterlogged = from.isWaterlogged;
  if (from.frostLevel !== undefined) to.frostLevel = from.frostLevel;
  if (from.isFrosted !== undefined) to.isFrosted = from.isFrosted;
  if (from.iceCubeHealth !== undefined) to.iceCubeHealth = from.iceCubeHealth;
}

/**
 * Serializes dynamic turret state into a plain object for storage in loot objects / inventory.
 */
export function extractTurretData(t: any): any {
  if (!t) return undefined;
  return {
    health: t.health,
    maxHealth: t.maxHealth,
    baseIngredients: t.baseIngredients ? [...t.baseIngredients] : undefined,
    stats: t.stats ? { ...t.stats } : undefined,
    angle: t.angle,
    actionTimers: t.actionTimers ? Array.from(t.actionTimers.entries()) : undefined,
    growthProgress: t.growthProgress,
    staminaSpent: t.staminaSpent,
    customAssetImg: t.customAssetImg,
    farmStage: t.farmStage,
    farmGrowthTimer: t.farmGrowthTimer,
    farmHarvestHp: t.farmHarvestHp,
    firstStrikeCount: t.firstStrikeCount,
    isWaterlogged: t.isWaterlogged,
    frostLevel: t.frostLevel,
    isFrosted: t.isFrosted,
    iceCubeHealth: t.iceCubeHealth,
  };
}

/**
 * Restores serialized dynamic turret state onto a turret instance.
 */
export function restoreTurretData(t: any, data: any) {
  if (!t || !data) return;
  if (data.health !== undefined) t.health = data.health;
  if (data.maxHealth !== undefined) t.maxHealth = data.maxHealth;
  if (data.baseIngredients) t.baseIngredients = [...data.baseIngredients];
  if (data.stats) t.stats = { ...data.stats };
  if (data.angle !== undefined) t.angle = data.angle;
  if (data.actionTimers) t.actionTimers = new Map(data.actionTimers);
  if (data.growthProgress !== undefined) t.growthProgress = data.growthProgress;
  if (data.staminaSpent !== undefined) t.staminaSpent = data.staminaSpent;
  if (data.customAssetImg !== undefined) t.customAssetImg = data.customAssetImg;
  if (data.farmStage !== undefined) t.farmStage = data.farmStage;
  if (data.farmGrowthTimer !== undefined) t.farmGrowthTimer = data.farmGrowthTimer;
  if (data.farmHarvestHp !== undefined) t.farmHarvestHp = data.farmHarvestHp;
  if (data.firstStrikeCount !== undefined) t.firstStrikeCount = data.firstStrikeCount;
  if (data.isWaterlogged !== undefined) t.isWaterlogged = data.isWaterlogged;
  if (data.frostLevel !== undefined) t.frostLevel = data.frostLevel;
  if (data.isFrosted !== undefined) t.isFrosted = data.isFrosted;
  if (data.iceCubeHealth !== undefined) t.iceCubeHealth = data.iceCubeHealth;
}
