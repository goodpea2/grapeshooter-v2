import { state } from '../state';
import { turretTypes } from '../balanceTurrets';
import { getBaseIngredientsForType } from '../dictionaryTurretMerging';
import { AttachedTurret, WorldTurret } from '../entities';
import { createAttachedTurret, createWorldTurret } from '../class/turret/TurretRegistry';
import { soundEngine } from './audio/soundEngine';
import { MergeVFX, ShopFlyVFX, spawnDamageNumber } from '../vfx/index';
import { triggerUpgradeHook, recalculateAllStats } from './upgrades';
import { getPlayerUpgradeStat } from './playerUpgrades';
import { getHexAxial, axialToWorld, isAdjacent } from '../utils/hex';
import { TYPE_MAP } from '../assetTurret';

export function canSwapTurrets(t1: any, t2: any): boolean {
  if (!t1 || !t2 || t1 === t2 || t1.isFrosted || t2.isFrosted) return false;
  const layer1 = t1.config?.turretLayer || 'normal';
  const layer2 = t2.config?.turretLayer || 'normal';
  if (layer1 === layer2) return true;
  if (t1 instanceof AttachedTurret && t2 instanceof AttachedTurret) {
    const conflictAt2 = state.player.attachments.some(
      (a: any) => a !== t2 && a.hq === t2.hq && a.hr === t2.hr && (a.config?.turretLayer || 'normal') === layer1
    );
    if (conflictAt2) return false;
    const conflictAt1 = state.player.attachments.some(
      (a: any) => a !== t1 && a.hq === t1.hq && a.hr === t1.hr && (a.config?.turretLayer || 'normal') === layer2
    );
    if (conflictAt1) return false;
  }
  return true;
}

export function swapTurrets(t1: any, t2: any) {
  if (!t1 || !t2 || t1 === t2) return;

  // Case 1: Both are AttachedTurrets
  if (t1 instanceof AttachedTurret && t2 instanceof AttachedTurret) {
    const q1 = t1.hq, r1 = t1.hr;
    const q2 = t2.hq, r2 = t2.hr;
    t1.hq = q2; t1.hr = r2; t1.offset = axialToWorld(q2, r2);
    t2.hq = q1; t2.hr = r1; t2.offset = axialToWorld(q1, r1);
    state.vfx.push(new MergeVFX(t1.getWorldPos().x, t1.getWorldPos().y, [255, 255, 255]));
    state.vfx.push(new MergeVFX(t2.getWorldPos().x, t2.getWorldPos().y, [255, 255, 255]));
    soundEngine.playSFXGroup('turret_place');
    recalculateAllStats();
    return;
  }

  // Case 2: Both are WorldTurrets
  if (t1 instanceof WorldTurret && t2 instanceof WorldTurret) {
    const gx1 = t1.gx, gy1 = t1.gy;
    const gx2 = t2.gx, gy2 = t2.gy;
    state.world.removeTurret(gx1, gy1);
    state.world.removeTurret(gx2, gy2);
    t1.gx = gx2; t1.gy = gy2;
    t2.gx = gx1; t2.gy = gy1;
    state.world.addTurret(t1);
    state.world.addTurret(t2);
    state.vfx.push(new MergeVFX(t1.getWorldPos().x, t1.getWorldPos().y, [255, 255, 255]));
    state.vfx.push(new MergeVFX(t2.getWorldPos().x, t2.getWorldPos().y, [255, 255, 255]));
    soundEngine.playSFXGroup('turret_place');
    recalculateAllStats();
    return;
  }

  // Case 3: One is AttachedTurret and one is WorldTurret
  const att = t1 instanceof AttachedTurret ? t1 : t2;
  const wt = t1 instanceof WorldTurret ? t1 : t2;
  if (att && wt) {
    const q = att.hq, r = att.hr;
    const gx = wt.gx, gy = wt.gy;
    const attStartPos = att.getWorldPos().copy();
    const wtStartPos = wt.getWorldPos().copy();

    // Convert attached turret to world turret
    const newWt = createWorldTurret(att.type, gx, gy);
    newWt.pos = attStartPos;
    newWt.health = att.health;
    newWt.maxHealth = att.maxHealth;
    newWt.baseIngredients = att.baseIngredients;
    newWt.stats = att.stats;
    newWt.angle = att.angle;
    newWt.conditions = att.conditions;

    // Convert world turret to attached turret
    const newAtt = createAttachedTurret(wt.type, state.player, q, r);
    newAtt.pos = wtStartPos;
    newAtt.health = wt.health;
    newAtt.maxHealth = wt.maxHealth;
    newAtt.baseIngredients = wt.baseIngredients;
    newAtt.stats = wt.stats;
    newAtt.angle = wt.angle;
    newAtt.conditions = wt.conditions;

    const attIdx = state.player.attachments.indexOf(att);
    if (attIdx !== -1) state.player.attachments[attIdx] = newAtt;
    else state.player.attachments.push(newAtt);

    state.world.removeTurret(gx, gy);
    state.world.addTurret(newWt);

    for (let v of state.vfx) {
      if (v) {
        if (v.target === att) v.target = newWt;
        else if (v.target === wt) v.target = newAtt;
      }
    }

    state.vfx.push(new MergeVFX(newWt.getWorldPos().x, newWt.getWorldPos().y, [255, 255, 255]));
    state.vfx.push(new MergeVFX(newAtt.getWorldPos().x, newAtt.getWorldPos().y, [255, 255, 255]));
    soundEngine.playSFXGroup('turret_place');
    recalculateAllStats();
  }
}

export function executePlacement() {
  if (!state.previewSnapPos) return;
  const activePlacementType = state.isCurrentlyDragging ? state.draggedTurretType : state.selectedTurretType;
  if (!activePlacementType && !state.draggedTurretInstance) return;
  
  // Turret Swap execution (when placing a selected turret onto a non-mergeable turret)
  if (state.swapTargetPreview && state.draggedTurretInstance) {
    swapTurrets(state.draggedTurretInstance, state.swapTargetPreview);
    state.draggedTurretInstance = null;
    state.draggedTurretType = null;
    state.selectedTurretType = null;
    state.isCurrentlyDragging = false;
    state.swapTargetPreview = null;
    state.mergeTargetPreview = null;
    state.previewSnapPos = null;
    return;
  }

  const type = state.draggedTurretInstance ? state.draggedTurretInstance.type : activePlacementType;
  if (!type) return;
  const config = turretTypes[type];
  const isOwned = activePlacementType ? (state.inventory.items[activePlacementType] || 0) > 0 : false;
  const sunCost = config.costs?.sun || config.cost || 0;
  const elixirCost = config.costs?.elixir || 0;
  const soilCost = config.costs?.soil || 0;

  if (state.mergeTargetPreview) {
    if (state.mergeTargetPreview.isPlayerHeal && state.draggedTurretInstance && state.player) {
      state.player.health = Math.min(state.player.maxHealth, state.player.health + 50);
      const dmgVfx = spawnDamageNumber(state.player.pos.x, state.player.pos.y, -50, [100, 255, 100], state.player);
      if (dmgVfx) state.vfx.push(dmgVfx);
      state.vfx.push(new MergeVFX(state.player.pos.x, state.player.pos.y, [100, 255, 120]));
      soundEngine.playSFX('merge');
      triggerUpgradeHook('onMerge', state.draggedTurretInstance, { target: state.player });
      if (state.draggedTurretInstance instanceof AttachedTurret) {
        const idx = state.player.attachments.indexOf(state.draggedTurretInstance);
        if (idx !== -1) state.player.attachments.splice(idx, 1);
      } else if (state.draggedTurretInstance instanceof WorldTurret) {
        state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
      }
      state.draggedTurretInstance = null;
      recalculateAllStats();
      return;
    }

    // Merging logic (Unified for both Attached and World Turrets)
    const mergeCost = state.mergeTargetPreview.cost;
    const isNewPlacement = !!activePlacementType;
    const purchaseCost = (isNewPlacement && !isOwned) ? sunCost : 0;
    const totalSunReq = purchaseCost + mergeCost;
    
    let canAfford = state.sunCurrency >= totalSunReq &&
                    state.elixirCurrency >= (isOwned ? 0 : elixirCost) &&
                    state.soilCurrency >= (isOwned ? 0 : soilCost);
    
    if (canAfford) {
      // Deduct costs
      if (isOwned) {
        state.inventory.items[activePlacementType]--;
        const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
        if (specIdx !== -1) state.inventory.specList.splice(specIdx, 1);
        state.sunCurrency -= mergeCost;
      } else {
        state.sunCurrency -= totalSunReq;
        state.elixirCurrency -= elixirCost;
        state.soilCurrency -= soilCost;
      }

      // Find the target instance
      let targetInstance = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (!targetInstance) {
        targetInstance = state.world.getAllTurrets().find((t: any) => t.uid === state.mergeTargetPreview.uid);
      }

      if (targetInstance) {
        const wPos = targetInstance.getWorldPos();
        let newTurret: any = null;
        if (targetInstance instanceof AttachedTurret) {
          const indexToReplace = state.player.attachments.indexOf(targetInstance);
          newTurret = createAttachedTurret(state.mergeTargetPreview.type, state.player, targetInstance.hq, targetInstance.hr);
          newTurret.baseIngredients = getBaseIngredientsForType(state.mergeTargetPreview.type);
          state.player.attachments[indexToReplace] = newTurret;
        } else if (targetInstance instanceof WorldTurret) {
          newTurret = createWorldTurret(state.mergeTargetPreview.type, targetInstance.gx, targetInstance.gy);
          newTurret.baseIngredients = getBaseIngredientsForType(state.mergeTargetPreview.type);
          state.world.removeTurret(targetInstance.gx, targetInstance.gy);
          state.world.addTurret(newTurret);
        }
        
        state.totalTurretsAcquired++;
        state.vfx.push(new MergeVFX(wPos.x, wPos.y, [255, 255, 255]));
        soundEngine.playSFX('merge');
        if (activePlacementType) state.turretLastUsed[activePlacementType] = state.frames;
        if (newTurret) {
          triggerUpgradeHook('onPlant', newTurret, { isAttached: newTurret instanceof AttachedTurret, pos: newTurret.getWorldPos() });
          recalculateAllStats();
        }
        
        // Clear selected state after merge
        state.selectedTurretType = null;
        
        // If we were dragging an instance, it's now consumed
        if (state.draggedTurretInstance) {
          triggerUpgradeHook('onMerge', state.draggedTurretInstance, {});
          if (state.draggedTurretInstance instanceof AttachedTurret) {
            const idx = state.player.attachments.indexOf(state.draggedTurretInstance);
            if (idx !== -1) state.player.attachments.splice(idx, 1);
          } else if (state.draggedTurretInstance instanceof WorldTurret) {
            state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
          }
          state.draggedTurretInstance = null;
        }
      }
    }
    return;
  }

  if (state.previewWorldSnap) {
    // Placement on WorldGrid (No Merge)
    const { gx, gy } = state.previewWorldSnap;
    
    if (activePlacementType) {
      if (isOwned || (state.sunCurrency >= sunCost && state.elixirCurrency >= elixirCost && state.soilCurrency >= soilCost)) {
        let preservedHp = undefined;
        if (isOwned) {
          state.inventory.items[activePlacementType]--;
          const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
          if (specIdx !== -1) {
            preservedHp = state.inventory.specList[specIdx].hp;
            state.inventory.specList.splice(specIdx, 1);
          }
        } else {
          state.sunCurrency -= sunCost;
          state.elixirCurrency -= elixirCost;
          state.soilCurrency -= soilCost;
        }
        const wt = createWorldTurret(type, gx, gy);
        if (preservedHp !== undefined) wt.health = preservedHp;
        state.world.addTurret(wt);
        state.totalTurretsAcquired++;
        state.turretLastUsed[activePlacementType] = state.frames;
        soundEngine.playSFXGroup('turret_place');
        triggerUpgradeHook('onPlant', wt, { isAttached: false, pos: wt.getWorldPos() });
        recalculateAllStats();
        state.selectedTurretType = null; // Deselect after placement
      }
    } else if (state.draggedTurretInstance) {
      // Moving from hex grid or world grid to world grid
      const preservedHp = state.draggedTurretInstance.health;
      if (state.draggedTurretInstance instanceof AttachedTurret) {
        const startPos = state.draggedTurretInstance.getWorldPos().copy();
        const idx = state.player.attachments.indexOf(state.draggedTurretInstance);
        if (idx !== -1) state.player.attachments.splice(idx, 1);
        const wt = createWorldTurret(type, gx, gy);
        wt.pos = startPos;
        if (preservedHp !== undefined) wt.health = preservedHp;
        wt.maxHealth = state.draggedTurretInstance.maxHealth;
        wt.baseIngredients = state.draggedTurretInstance.baseIngredients;
        wt.stats = state.draggedTurretInstance.stats;
        wt.angle = state.draggedTurretInstance.angle;
        wt.conditions = state.draggedTurretInstance.conditions;
        state.world.addTurret(wt);
        // Transfer all active VFX targeting the old attached turret to the new world turret
        for (let v of state.vfx) {
          if (v && v.target === state.draggedTurretInstance) {
            v.target = wt;
          }
        }
      } else if (state.draggedTurretInstance instanceof WorldTurret) {
        state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
        state.draggedTurretInstance.gx = gx;
        state.draggedTurretInstance.gy = gy;
        state.world.addTurret(state.draggedTurretInstance);
      }
      state.vfx.push(new MergeVFX(state.previewSnapPos.x, state.previewSnapPos.y, [255, 255, 255]));
      state.draggedTurretInstance = null;
    }
    return;
  }

  const snapAxial = getHexAxial(state.previewSnapPos.x - state.player.pos.x, state.previewSnapPos.y - state.player.pos.y);
  
  if (activePlacementType) {
    const config = turretTypes[activePlacementType];
    const isOwned = (state.inventory.items[activePlacementType] || 0) > 0;
    const sunCost = config.costs?.sun || config.cost || 0;
    const elixirCost = config.costs?.elixir || 0;
    const soilCost = config.costs?.soil || 0;

    if (state.mergeTargetPreview) {
      const target = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (target && !target.isFrosted) {
        const mergeCost = state.mergeTargetPreview.cost;
        const purchaseCost = isOwned ? 0 : sunCost;
        let canAfford = state.sunCurrency >= (purchaseCost + mergeCost) &&
                        state.elixirCurrency >= (isOwned ? 0 : elixirCost) &&
                        state.soilCurrency >= (isOwned ? 0 : soilCost);
        
        if (canAfford) {
          triggerUpgradeHook('onMerge', target, {});
          if (isOwned) {
             state.inventory.items[activePlacementType]--;
             // Also remove one instance from specList
             const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
             if (specIdx !== -1) state.inventory.specList.splice(specIdx, 1);
             state.sunCurrency -= mergeCost;
          } else {
             state.sunCurrency -= (purchaseCost + mergeCost);
             state.elixirCurrency -= elixirCost;
             state.soilCurrency -= soilCost;
          }
          const indexToReplace = state.player.attachments.indexOf(target);
          const newTurret = createAttachedTurret(state.mergeTargetPreview.type, state.player, target.hq, target.hr);
          newTurret.baseIngredients = getBaseIngredientsForType(state.mergeTargetPreview.type);
          state.player.attachments[indexToReplace] = newTurret;
          state.totalTurretsAcquired++;
          state.vfx.push(new MergeVFX(target.getWorldPos().x, target.getWorldPos().y, [255, 255, 255]));
          soundEngine.playSFX('merge');
          state.turretLastUsed[activePlacementType] = state.frames;
          triggerUpgradeHook('onPlant', newTurret, { isAttached: true, pos: newTurret.getWorldPos() });
          recalculateAllStats();
        }
      }
    } else {
      const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity');
      const doesCount = config?.countTowardAttachedCapacity !== false && config?.CountTowardAttachedCapacity !== false;
      if (doesCount && state.player.getAttachedCount() >= maxCapacity) {
        state.selectedTurretType = null;
        state.draggedTurretType = null;
        state.draggedTurretInstance = null;
        state.isCurrentlyDragging = false;
        return;
      }
      const canAfford = isOwned || (
        state.sunCurrency >= sunCost &&
        state.elixirCurrency >= elixirCost &&
        state.soilCurrency >= soilCost
      );
      if (canAfford) {
        let preservedHp = undefined;
        if (isOwned) {
          state.inventory.items[activePlacementType]--;
          const specIdx = state.inventory.specList.findIndex((item: any) => item.key === activePlacementType);
          if (specIdx !== -1) {
            preservedHp = state.inventory.specList[specIdx].hp;
            state.inventory.specList.splice(specIdx, 1);
          }
        } else {
          state.sunCurrency -= sunCost;
          state.elixirCurrency -= elixirCost;
          state.soilCurrency -= soilCost;
        }
        const nt = createAttachedTurret(activePlacementType, state.player, snapAxial.q, snapAxial.r);
        if (preservedHp !== undefined) nt.health = preservedHp;
        state.player.attachments.push(nt);
        state.totalTurretsAcquired++;
        state.turretLastUsed[activePlacementType] = state.frames;
        soundEngine.playSFXGroup('turret_place');
        triggerUpgradeHook('onPlant', nt, { isAttached: true, pos: nt.getWorldPos() });
        recalculateAllStats();
      }
    }
  }
  if (state.draggedTurretInstance) {
    const canAffordMerge = state.mergeTargetPreview && state.sunCurrency >= state.mergeTargetPreview.cost;
    if (state.mergeTargetPreview && canAffordMerge) {
      const target = state.player.attachments.find((t: any) => t.uid === state.mergeTargetPreview.uid);
      if (target && !target.isFrosted) {
        state.sunCurrency -= state.mergeTargetPreview.cost;
        const indexToReplace = state.player.attachments.indexOf(target);
        const indexToDelete = state.player.attachments.indexOf(state.draggedTurretInstance);
        
        // If it was a world turret, remove it from world
        if (state.draggedTurretInstance instanceof WorldTurret) {
          state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
        } else {
          state.player.attachments.splice(indexToDelete, 1);
        }

        const newTurret = createAttachedTurret(state.mergeTargetPreview.type, state.player, target.hq, target.hr);
        newTurret.baseIngredients = state.mergeTargetPreview.ingredients;
        state.player.attachments[indexToReplace] = newTurret;
        state.totalTurretsAcquired++;
        state.vfx.push(new MergeVFX(target.getWorldPos().x, target.getWorldPos().y, [255, 255, 255]));
        soundEngine.playSFX('merge');
        triggerUpgradeHook('onPlant', newTurret, { isAttached: true, pos: newTurret.getWorldPos() });
        recalculateAllStats();
      }
    } else if (!state.mergeTargetPreview && state.previewSnapPos) {
      // Only move if NOT attempting a merge (or if merge was impossible/unaffordable, we don't snap to the target)
      if (state.draggedTurretInstance instanceof WorldTurret) {
         const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity') || 6;
         const doesCount = state.draggedTurretInstance.config?.countTowardAttachedCapacity !== false && state.draggedTurretInstance.config?.CountTowardAttachedCapacity !== false;
         if (!doesCount || state.player.getAttachedCount() < maxCapacity) {
           const startPos = state.draggedTurretInstance.getWorldPos().copy();
           const preservedHp = state.draggedTurretInstance.health;
           state.world.removeTurret(state.draggedTurretInstance.gx, state.draggedTurretInstance.gy);
           const nt = createAttachedTurret(state.draggedTurretInstance.type, state.player, snapAxial.q, snapAxial.r);
           nt.pos = startPos;
           if (preservedHp !== undefined) nt.health = preservedHp;
           nt.maxHealth = state.draggedTurretInstance.maxHealth;
           nt.baseIngredients = state.draggedTurretInstance.baseIngredients;
           nt.stats = state.draggedTurretInstance.stats;
           nt.angle = state.draggedTurretInstance.angle;
           nt.conditions = state.draggedTurretInstance.conditions;
           state.player.attachments.push(nt);
           // Transfer all active VFX targeting the old world turret to the new attached turret
           for (let v of state.vfx) {
             if (v && v.target === state.draggedTurretInstance) {
               v.target = nt;
             }
           }
           state.vfx.push(new MergeVFX(state.previewSnapPos.x, state.previewSnapPos.y, [255, 255, 255]));
           soundEngine.playSFXGroup('turret_place');
         }
      } else {
         state.draggedTurretInstance.hq = snapAxial.q;
         state.draggedTurretInstance.hr = snapAxial.r;
         state.draggedTurretInstance.offset = axialToWorld(snapAxial.q, snapAxial.r);
         state.vfx.push(new MergeVFX(state.previewSnapPos.x, state.previewSnapPos.y, [255, 255, 255]));
         soundEngine.playSFXGroup('turret_place');
      }
    }
  }
  state.draggedTurretInstance = null; state.draggedTurretType = null; state.selectedTurretType = null; state.isCurrentlyDragging = false; state.mergeTargetPreview = null; state.previewSnapPos = null; state.swapTargetPreview = null;
}

export function autoPlaceTurret(type: string) {
  const tr = turretTypes[type];
  if (!tr) return;

  const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity');
  const doesCount = tr.countTowardAttachedCapacity !== false && tr.CountTowardAttachedCapacity !== false;
  if (doesCount && state.player.getAttachedCount() >= maxCapacity) return;

  const isOwned = (state.inventory.items[type] || 0) > 0;
  const sunCost = tr.costs?.sun || tr.cost || 0;
  const elixirCost = tr.costs?.elixir || 0;
  const soilCost = tr.costs?.soil || 0;

  const canAfford = isOwned || (
    state.sunCurrency >= sunCost &&
    state.elixirCurrency >= elixirCost &&
    state.soilCurrency >= soilCost
  );

  if (!canAfford) return;

  let bestQ = 0;
  let bestR = 0;
  let found = false;

    if (type === 't_lilypad') {
      // Find closest turret without a lilypad
      let minDist = Infinity;
      for (const att of state.player.attachments) {
        if (att.config.turretLayer === 'ground') continue;
        // Check if there's already a lilypad at this spot
        const hasLily = state.player.attachments.some((a: any) => a.hq === att.hq && a.hr === att.hr && a.config.turretLayer === 'ground');
        if (!hasLily) {
          const wPos = att.getWorldPos();
          const d = dist(state.player.pos.x, state.player.pos.y, wPos.x, wPos.y);
          if (d < minDist) {
            minDist = d;
            bestQ = att.hq;
            bestR = att.hr;
            found = true;
          }
        }
      }
    } else if (type === 't0_puffshroom') {
      const maxCapacity = getPlayerUpgradeStat('turretAttachCapacity') || 6;
      if (state.player.attachments.length < maxCapacity) {
        // Find nearest available spot
        let minDist = Infinity;
        const rangeLimit = 5;
        for (let q = -rangeLimit; q <= rangeLimit; q++) {
          for (let r = -rangeLimit; r <= rangeLimit; r++) {
            if (abs(q) + abs(r) + abs(-q-r) <= rangeLimit * 2) {
              if (q === 0 && r === 0) continue;
              const wPos = axialToWorld(q, r).add(state.player.pos);
              const d = dist(state.player.pos.x, state.player.pos.y, wPos.x, wPos.y);
              
              const occupant = state.player.attachments.find((a: any) => a.hq === q && a.hr === r && (a.config.turretLayer || 'normal') === 'normal');
              if (!occupant && isAdjacent(q, r)) {
                const isClear = !state.world.checkCollision(wPos.x, wPos.y, tr.size * 0.55);
                if (isClear && d < minDist) {
                  minDist = d;
                  bestQ = q;
                  bestR = r;
                  found = true;
                }
              }
            }
          }
        }
      }
    }

  if (found) {
    // Deduct cost
    let preservedHp = undefined;
    if (isOwned) {
      state.inventory.items[type]--;
      const specIdx = state.inventory.specList.findIndex((item: any) => item.key === type);
      if (specIdx !== -1) {
        preservedHp = state.inventory.specList[specIdx].hp;
        state.inventory.specList.splice(specIdx, 1);
      }
    } else {
      state.sunCurrency -= sunCost;
      state.elixirCurrency -= elixirCost;
      state.soilCurrency -= soilCost;
    }

    const nt = createAttachedTurret(type, state.player, bestQ, bestR);
    if (preservedHp !== undefined) nt.health = preservedHp;
    state.player.attachments.push(nt);
    state.totalTurretsAcquired++;
    state.turretLastUsed[type] = state.frames;
    soundEngine.playSFXGroup('turret_place');
    triggerUpgradeHook('onPlant', nt, { isAttached: true, pos: nt.getWorldPos() });
    recalculateAllStats();

    // VFX
    const wPos = nt.getWorldPos();
    const startX = 60; // Approximate sidebar X
    const startY = height / 2;
    const assetKey = `img_${TYPE_MAP[type]}_front`;
    state.uiVfx.push(new ShopFlyVFX(startX, startY, wPos.x, wPos.y, assetKey));
  }
}
