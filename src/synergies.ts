import { state } from '../state';
import { GRID_SIZE } from '../constants';
import { getNeighbors, getTurretClasses, getUpgradeDefinition } from './upgrades';
import { turretTypes } from '../balanceTurrets';
import { CLASS_ICON_MAP } from '../ui/richText';
import { getHexAxial } from '../utils/hex';


export type SynergyClass =
  | 'leaf'
  | 'shard'
  | 'fuel'
  | 'ice'
  | 'shell'
  | 'shooter'
  | 'miner'
  | 'explosive'
  | 'absorb'
  | 'cross_buff'
  | 'suppression'
  | 'electric';

export interface SynergyLink {
  source: any;
  target: any;
  sourcePos: { x: number; y: number };
  targetPos: { x: number; y: number };
  type: SynergyClass;
  label: string;
  color: [number, number, number];
  isActive: boolean;
  isSuppression?: boolean;
  step?: { current: number; required: number };
  isGhost?: boolean;
  isCompletingStep?: boolean;
}

export interface TurretRuneInfo {
  turret: any;
  pos: { x: number; y: number };
  type: SynergyClass;
  color: [number, number, number];
  label: string;
  step: { current: number; required: number };
  isSatisfied: boolean;
}

export const SYNERGY_COLORS: Record<string, [number, number, number]> = {
  leaf: [74, 222, 128],        // Fresh emerald green
  shard: [56, 189, 248],       // Electric cyan
  fuel: [251, 146, 60],        // Warm blazing orange
  ice: [147, 197, 253],        // Crisp ice blue
  shell: [234, 179, 8],        // Warm golden shield
  armor: [234, 179, 8],
  absorb: [250, 204, 21],      // Aegis gold
  cross_buff: [52, 211, 153],  // Radiant resonance
  suppression: [244, 63, 94],  // Crimson rose drain / suppression
  electric: [103, 232, 249],   // Tesla lightning cyan
  shooter: [168, 85, 247],     // Amethyst purple
  miner: [245, 158, 11],       // Topaz amber
  explosive: [239, 68, 68]     // Ruby red
};

export function normalizeClassToSynergy(cls: string): SynergyClass {
  const c = cls.replace(/^c_/, '').toLowerCase();
  if (c === 'leaf') return 'leaf';
  if (c === 'shard') return 'shard';
  if (c === 'fuel') return 'fuel';
  if (c === 'ice') return 'ice';
  if (c === 'shell' || c === 'armor' || c === 'wall') return 'shell';
  if (c === 'shooter') return 'shooter';
  if (c === 'miner') return 'miner';
  if (c === 'explosive' || c === 'explode') return 'explosive';
  return 'leaf';
}

export function formatClassTag(targetClass: string): string {
  if (!targetClass) return '<bonus>';
  const clean = targetClass.replace(/^c_/, '').toLowerCase();
  return `<c_${clean}>`;
}

/**
 * Formats any stat modifier bonus (positive buff or negative nerf) into a compact label.
 */
export function formatModifierBonus(bonus: any, multiplier: number = 1): string {
  if (!bonus) return '';
  const parts: string[] = [];
  if (bonus.damageMult !== undefined) {
    const val = Math.round(bonus.damageMult * multiplier * 100);
    parts.push(`dmg${val >= 0 ? '+' : ''}${val}%`);
  }
  if (bonus.firerateMult !== undefined) {
    const val = Math.round(bonus.firerateMult * multiplier * 100);
    parts.push(`fr${val >= 0 ? '+' : ''}${val}%`);
  }
  if (bonus.rangeMult !== undefined) {
    const val = Math.round(bonus.rangeMult * multiplier * 100);
    parts.push(`range${val >= 0 ? '+' : ''}${val}%`);
  }
  if (bonus.damageAdd !== undefined) {
    const val = Math.round(bonus.damageAdd * multiplier);
    parts.push(`dmg${val >= 0 ? '+' : ''}${val}`);
  }
  if (bonus.shieldRadius !== undefined) {
    const val = Math.round(bonus.shieldRadius * multiplier);
    parts.push(`shield${val >= 0 ? '+' : ''}${val}`);
  }
  if (bonus.aoeRadiusMult !== undefined) {
    const val = Math.round(bonus.aoeRadiusMult * multiplier * 100);
    parts.push(`aoe${val >= 0 ? '+' : ''}${val}%`);
  }
  if (bonus.aoeDamageMult !== undefined) {
    const val = Math.round(bonus.aoeDamageMult * multiplier * 100);
    parts.push(`aoe dmg${val >= 0 ? '+' : ''}${val}%`);
  }
  if (bonus.puddleRadiusMult !== undefined) {
    const val = Math.round(bonus.puddleRadiusMult * multiplier * 100);
    parts.push(`area${val >= 0 ? '+' : ''}${val}%`);
  }
  if (bonus.puddleDamageMult !== undefined) {
    const val = Math.round(bonus.puddleDamageMult * multiplier * 100);
    parts.push(`burn${val >= 0 ? '+' : ''}${val}%`);
  }
  if (bonus.healthAdd !== undefined) {
    const val = Math.round(bonus.healthAdd * multiplier);
    parts.push(`${val >= 0 ? '+' : ''}${val} hp`);
  }
  if (bonus.healthMult !== undefined) {
    const val = Math.round(bonus.healthMult * multiplier * 100);
    parts.push(`${val >= 0 ? '+' : ''}${val}% hp`);
  }
  if (bonus.knockbackMult !== undefined) {
    const val = Math.round(bonus.knockbackMult * multiplier * 100);
    parts.push(`kb${val >= 0 ? '+' : ''}${val}%`);
  }
  return parts.join(', ') || 'buff';
}

/**
 * Draws a compact speech bubble matching the merge cost UI styling and exact text size (textSize 6),
 * supporting inline class icons like <c_leaf>.
 */
export function drawSynergySpeechBubble(
  x: number,
  y: number,
  label: string,
  type: string = 'buff',
  alpha: number = 255
) {
  push();
  translate(x, y);

  // Exact requirement: follow text size of merging costs (textSize 6)
  textSize(6);

  // Parse text and embedded icon tags (e.g. <c_leaf>, [c_leaf])
  const normalized = (label || '').replace(/\[([^\]]+)\]/g, '<$1>');
  const rawTokens = normalized.split(/(<[^>]+>)/g).filter(t => t.length > 0);
  const tokens: Array<{ type: 'text' | 'icon'; text?: string; img?: any; w: number }> = [];
  let contentW = 0;

  for (const token of rawTokens) {
    if (token.startsWith('<') && token.endsWith('>')) {
      const tag = token.slice(1, -1).trim();
      const lowerTag = tag.toLowerCase();
      const iconKey = CLASS_ICON_MAP[tag] || CLASS_ICON_MAP[lowerTag] || (state.assets?.[tag] ? tag : null);
      const icon = iconKey ? state.assets?.[iconKey] : null;

      if (icon) {
        const iconSize = 7.5;
        tokens.push({ type: 'icon', img: icon, w: iconSize });
        contentW += iconSize + 1.5;
      } else {
        // Fallback to text tag if icon asset not yet loaded
        const fallbackText = `[${tag.replace(/^c_/, '')}]`;
        const tw = drawingContext?.measureText ? drawingContext.measureText(fallbackText).width : fallbackText.length * 3.8;
        tokens.push({ type: 'text', text: fallbackText, w: tw });
        contentW += tw;
      }
    } else {
      const tw = drawingContext?.measureText ? drawingContext.measureText(token).width : token.length * 3.8;
      tokens.push({ type: 'text', text: token, w: tw });
      contentW += tw;
    }
  }

  const bubbleW = Math.max(22, contentW + 8);
  const bubbleH = 12;
  const bubbleY = -18; // Above turret / slot

  // Bubble color theme
  let bgColor: [number, number, number] = [18, 38, 28]; // Dark forest green
  let borderColor: [number, number, number] = [74, 222, 128]; // Emerald
  let textColor: [number, number, number] = [230, 255, 235];

  const lower = label.toLowerCase();
  if (type === 'suppression' || type === 'debuff' || type === 'nerf' || label.includes('-') || lower.includes('lock') || lower.includes('unprotected')) {
    bgColor = [45, 18, 24];
    borderColor = [244, 63, 94];
    textColor = [255, 180, 190];
  } else if (type === 'shard' || lower.includes('rng') || lower.includes('range')) {
    bgColor = [16, 32, 48];
    borderColor = [56, 189, 248];
    textColor = [200, 240, 255];
  } else if (type === 'shell' || type === 'absorb' || lower.includes('protect') || lower.includes('hp')) {
    bgColor = [36, 32, 14];
    borderColor = [250, 204, 21];
    textColor = [255, 245, 180];
  } else if (type === 'fuel' || lower.includes('burn') || lower.includes('area') || lower.includes('aoe')) {
    bgColor = [42, 24, 14];
    borderColor = [251, 146, 60];
    textColor = [255, 230, 190];
  }

  // Draw bubble tail pointing down at (x, y)
  fill(borderColor[0], borderColor[1], borderColor[2], alpha);
  noStroke();
  triangle(0, bubbleY + bubbleH / 2 + 3, -3, bubbleY + bubbleH / 2 - 1, 3, bubbleY + bubbleH / 2 - 1);

  // Draw bubble body
  rectMode(CENTER);
  fill(bgColor[0], bgColor[1], bgColor[2], alpha);
  stroke(borderColor[0], borderColor[1], borderColor[2], alpha);
  strokeWeight(1);
  rect(0, bubbleY, bubbleW, bubbleH, 3);

  // Draw content (text and embedded icons) centered inside bubble
  let cursorX = -contentW / 2;
  textAlign(LEFT, CENTER);
  imageMode(CENTER);
  noStroke();

  for (const t of tokens) {
    if (t.type === 'icon' && t.img) {
      image(t.img, cursorX + t.w / 2, bubbleY, t.w, t.w);
      cursorX += t.w + 1.5;
    } else if (t.text) {
      fill(textColor[0], textColor[1], textColor[2], alpha);
      text(t.text, cursorX, bubbleY);
      cursorX += t.w;
    }
  }

  pop();
}

/**
 * Scan all active base attachments and world turrets to extract active synergy links
 * and stepped synergy runes.
 */
export function getAllActiveSynergies(): { links: SynergyLink[]; runes: TurretRuneInfo[] } {
  const links: SynergyLink[] = [];
  const runes: TurretRuneInfo[] = [];
  const processedPairKeys = new Set<string>();

  const allTurrets = [
    ...(state.player?.attachments || []),
    ...(state.world?.getAllTurrets ? state.world.getAllTurrets() : [])
  ];

  for (const turret of allTurrets) {
    if (!turret || turret.health <= 0 || turret.isDying) continue;
    const tPos = turret.getWorldPos ? turret.getWorldPos() : turret.pos;
    if (!tPos) continue;

    const neighbors = getNeighbors(turret);
    const upgradeIds = state.turretUpgrades?.[turret.type] || [];

    // 1. Conditionals on this turret (Incoming buffs from neighbors)
    for (const uId of upgradeIds) {
      const upgrade = getUpgradeDefinition(uId, turret.type);
      if (!upgrade?.conditionals) continue;

      for (const cond of upgrade.conditionals) {
        if (cond.type === 'neighbor_count' || cond.type === 'neighbor_type') {
          const targetClass = cond.targetClass || '';
          const targetType = (cond as any).targetType;
          const matchingNeighbors = neighbors.filter((n: any) => {
            if (!n || n.health <= 0 || n.isDying) return false;
            if (targetType) return n.type === targetType;
            const classes = getTurretClasses(n.type);
            return !targetClass || classes.includes(targetClass) || classes.includes(targetClass.replace('c_', ''));
          });

          // Sort deterministically for stable group indexing
          matchingNeighbors.sort((a: any, b: any) => {
            const ap = a.getWorldPos ? a.getWorldPos() : a.pos;
            const bp = b.getWorldPos ? b.getWorldPos() : b.pos;
            if (!ap || !bp) return 0;
            if (Math.abs(ap.y - bp.y) > 0.5) return ap.y - bp.y;
            return ap.x - bp.x;
          });

          const synType = targetType ? 'shooter' : normalizeClassToSynergy(targetClass);
          const color = SYNERGY_COLORS[synType] || SYNERGY_COLORS.leaf;
          const step = (cond as any).step || 1;
          const count = matchingNeighbors.length;
          const isActive = count >= step;
          const tag = targetType ? `[${targetType.replace(/^t\d+_/, '')}]` : formatClassTag(targetClass);
          const singleBonusLabel = formatModifierBonus(cond.bonus, 1);

          if (step > 1) {
            runes.push({
              turret,
              pos: tPos,
              type: synType,
              color,
              label: singleBonusLabel,
              step: { current: Math.min(count, step), required: step },
              isSatisfied: isActive
            });
          }

          for (let i = 0; i < matchingNeighbors.length; i++) {
            const n = matchingNeighbors[i];
            const nPos = n.getWorldPos ? n.getWorldPos() : n.pos;
            if (!nPos) continue;

            let linkLabel = '';
            if (step > 1) {
              const slotInGroup = (i % step) + 1;
              if (slotInGroup < step) {
                linkLabel = `${tag} ${slotInGroup}/${step} ->`;
              } else {
                linkLabel = `${singleBonusLabel} ->`;
              }
            } else {
              linkLabel = `${singleBonusLabel} ->`;
            }

            links.push({
              source: n,
              target: turret,
              sourcePos: nPos,
              targetPos: tPos,
              type: synType,
              label: linkLabel,
              color,
              isActive,
              step: step > 1 ? { current: count, required: step } : undefined
            });
          }
        }
      }
    }

    // 2. Outgoing cross-buffs
    // u_t2_wallaser_5: While on max health, neighboring plants' Max Health +100
    if (turret.type === 't2_wallaser' && upgradeIds.includes('u_t2_wallaser_5')) {
      const isFullHp = turret.health >= (turret.maxHealth || turret.config?.maxHealth || 150);
      if (isFullHp) {
        for (const n of neighbors) {
          if (!n || n.health <= 0 || n.isDying) continue;
          const nPos = n.getWorldPos ? n.getWorldPos() : n.pos;
          if (!nPos) continue;
          links.push({
            source: turret,
            target: n,
            sourcePos: tPos,
            targetPos: nPos,
            type: 'cross_buff',
            label: '-> +100 hp',
            color: SYNERGY_COLORS.cross_buff,
            isActive: true
          });
        }
      }
    }

    // u_t2_torchwood_5: Neighboring [c_leaf]'s range +10%
    if (turret.type === 't2_torchwood' && upgradeIds.includes('u_t2_torchwood_5')) {
      for (const n of neighbors) {
        if (!n || n.health <= 0 || n.isDying) continue;
        const classes = getTurretClasses(n.type);
        if (classes.includes('c_leaf') || classes.includes('leaf')) {
          const nPos = n.getWorldPos ? n.getWorldPos() : n.pos;
          if (!nPos) continue;
          links.push({
            source: turret,
            target: n,
            sourcePos: tPos,
            targetPos: nPos,
            type: 'fuel',
            label: '-> range+10%',
            color: SYNERGY_COLORS.fuel,
            isActive: true
          });
        }
      }
    }

    // 3. Protection / Damage Absorption links (Wall-nut, Tallnut, Icewall)
    if (turret.activeStats?.absorbNeighborDamage || upgradeIds.includes('u_t_wall_3') || upgradeIds.includes('u_t2_tall_3') || upgradeIds.includes('u_t2_icewall_5')) {
      for (const n of neighbors) {
        if (!n || n.health <= 0 || n.isDying) continue;
        const nPos = n.getWorldPos ? n.getWorldPos() : n.pos;
        if (!nPos) continue;
        links.push({
          source: turret,
          target: n,
          sourcePos: tPos,
          targetPos: nPos,
          type: 'absorb',
          label: '-> protected',
          color: SYNERGY_COLORS.absorb,
          isActive: true
        });
      }
    }

    // 4. Sacrificial / Suppression links
    // u_t3_triplepea_5: Neighboring [c_shell]'s max health -20%
    if (turret.type === 't3_triplepea' && upgradeIds.includes('u_t3_triplepea_5')) {
      for (const n of neighbors) {
        if (!n || n.health <= 0 || n.isDying) continue;
        const classes = getTurretClasses(n.type);
        if (classes.includes('c_shell') || classes.includes('shell')) {
          const nPos = n.getWorldPos ? n.getWorldPos() : n.pos;
          if (!nPos) continue;
          links.push({
            source: turret,
            target: n,
            sourcePos: tPos,
            targetPos: nPos,
            type: 'suppression',
            label: '-> -20% hp',
            color: SYNERGY_COLORS.suppression,
            isActive: true,
            isSuppression: true
          });
        }
      }
    }

    // u_t3_firepea2_2: Deactivates neighboring [c_ice]
    if (turret.type === 't3_firepea2' && upgradeIds.includes('u_t3_firepea2_2')) {
      for (const n of neighbors) {
        if (!n || n.health <= 0 || n.isDying) continue;
        const classes = getTurretClasses(n.type);
        if (classes.includes('c_ice') || classes.includes('ice') || n.type.includes('ice')) {
          const nPos = n.getWorldPos ? n.getWorldPos() : n.pos;
          if (!nPos) continue;
          links.push({
            source: turret,
            target: n,
            sourcePos: tPos,
            targetPos: nPos,
            type: 'suppression',
            label: '-> freeze lock',
            color: SYNERGY_COLORS.suppression,
            isActive: true,
            isSuppression: true
          });
        }
      }
    }

    // 5. Tesla Electric Chain links
    if (turret.type === 't3_tesla') {
      for (const other of allTurrets) {
        if (other === turret || other.type !== 't3_tesla' || other.health <= 0 || other.isDying) continue;
        const pairKey = [turret.uid, other.uid].sort().join(':');
        if (processedPairKeys.has(pairKey)) continue;
        processedPairKeys.add(pairKey);

        const oPos = other.getWorldPos ? other.getWorldPos() : other.pos;
        if (!oPos) continue;
        const dSq = (tPos.x - oPos.x) ** 2 + (tPos.y - oPos.y) ** 2;
        if (dSq <= (GRID_SIZE * 10) ** 2) {
          links.push({
            source: turret,
            target: other,
            sourcePos: tPos,
            targetPos: oPos,
            type: 'electric',
            label: 'tesla chain',
            color: SYNERGY_COLORS.electric,
            isActive: true
          });
        }
      }
    }
  }

  return { links, runes };
}

/**
 * Calculates total estimated buff/nerf changes to the candidate turret if placed at a specific spot.
 */
export function getBuffsToCandidateAtSpot(
  candidateType: string,
  candidateInstance: any,
  pos: { x: number; y: number },
  isAttached: boolean,
  axialQ?: number,
  axialR?: number,
  gx?: number,
  gy?: number
): { text: string; type: string } | null {
  if (!candidateType) return null;

  const candidateClasses = getTurretClasses(candidateType);
  const candidateUpgrades: string[] = Array.from(new Set<string>((state.turretUpgrades?.[candidateType] || []) as string[]));
  const buffs: string[] = [];

  // 1. Gather neighbors for this spot
  const neighbors: any[] = [];
  if (isAttached && axialQ !== undefined && axialR !== undefined && state.player) {
    const hexDirs = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, 1]];
    for (const [dq, dr] of hexDirs) {
      const nq = axialQ + dq;
      const nr = axialR + dr;
      const n = state.player.attachments.find((a: any) => a.hq === nq && a.hr === nr && a !== candidateInstance && a.health > 0 && !a.isDying);
      if (n && !neighbors.includes(n)) neighbors.push(n);
    }
  } else if (gx !== undefined && gy !== undefined && state.world) {
    const allWorld = state.world.getAllTurrets ? state.world.getAllTurrets() : [];
    for (const wt of allWorld) {
      if (wt === candidateInstance || wt.health <= 0 || wt.isDying) continue;
      const dx = Math.abs(wt.gx - gx);
      const dy = Math.abs(wt.gy - gy);
      if (dx <= 1 && dy <= 1 && dx + dy > 0) {
        if (!neighbors.includes(wt)) neighbors.push(wt);
      }
    }
  } else {
    const all = [...(state.player?.attachments || []), ...(state.world?.getAllTurrets ? state.world.getAllTurrets() : [])];
    for (const ot of all) {
      if (ot === candidateInstance || ot.health <= 0 || ot.isDying) continue;
      const wPos = ot.getWorldPos ? ot.getWorldPos() : ot.pos;
      if (wPos && dist(pos.x, pos.y, wPos.x, wPos.y) <= GRID_SIZE * 1.5) {
        if (!neighbors.includes(ot)) neighbors.push(ot);
      }
    }
  }

  // 2. Evaluate candidate's own conditional neighbor upgrades (buffs, group progress, alone, empty spots)
  for (const uId of candidateUpgrades) {
    const upgrade = getUpgradeDefinition(uId, candidateType);
    if (!upgrade?.conditionals) continue;

    for (const cond of upgrade.conditionals) {
      if (cond.type === 'neighbor_count') {
        const targetClass = cond.targetClass || '';
        const matching = neighbors.filter((n: any) => {
          const classes = getTurretClasses(n.type);
          return !targetClass || classes.includes(targetClass) || classes.includes(targetClass.replace('c_', ''));
        });
        const step = (cond as any).step || 1;
        const count = matching.length;
        if (count >= step) {
          const multiplier = Math.floor(count / step);
          buffs.push(formatModifierBonus(cond.bonus, multiplier));
        } else if (step > 1 && count > 0) {
          buffs.push(`${formatClassTag(targetClass)} ${count}/${step}`);
        }
      } else if (cond.type === 'neighbor_type') {
        const targetType = (cond as any).targetType;
        const matching = neighbors.filter((n: any) => n.type === targetType);
        if (matching.length > 0) {
          buffs.push(formatModifierBonus(cond.bonus, matching.length));
        }
      } else if (cond.type === 'alone') {
        if (neighbors.length === 0) {
          buffs.push(formatModifierBonus(cond.bonus, 1));
        }
      } else if (cond.type === 'empty_neighbor_count') {
        const maxSlots = isAttached ? 6 : 8;
        const emptyCount = Math.max(0, maxSlots - neighbors.length);
        if (emptyCount > 0) {
          buffs.push(formatModifierBonus(cond.bonus, emptyCount));
        }
      }
    }
  }

  // 2b. Random roll upgrades on candidate
  for (const uId of candidateUpgrades) {
    if (uId === 'u_dmg_20_n_random' || uId === 'u_firerate_20_n_random') {
      const rolledList = state.upgradeData?.[candidateType]?.[uId] || [];
      for (const rolled of rolledList) {
        if (rolled) {
          const matchingCount = neighbors.filter((n: any) => {
            const classes = getTurretClasses(n.type);
            return classes.includes(rolled) || classes.includes(rolled.replace('c_', ''));
          }).length;
          if (matchingCount > 0) {
            const bonus = uId === 'u_dmg_20_n_random' ? { damageMult: 0.2 } : { firerateMult: 0.2 };
            buffs.push(formatModifierBonus(bonus, matchingCount));
          }
        }
      }
    }
  }

  // 3. Evaluate incoming cross-buffs, protections, and nerfs FROM neighbors
  for (const n of neighbors) {
    const nUpgrades = state.turretUpgrades?.[n.type] || [];
    // Cross-buffs
    if (n.type === 't2_wallaser' && nUpgrades.includes('u_t2_wallaser_5')) {
      const isFull = n.health >= (n.maxHealth || 150);
      if (isFull) buffs.push('+100 hp');
    }
    if (n.type === 't2_torchwood' && nUpgrades.includes('u_t2_torchwood_5')) {
      if (candidateClasses.includes('c_leaf') || candidateClasses.includes('leaf')) buffs.push('range+10%');
    }
    // Protection (candidate is the receiver -> protected)
    if (n.activeStats?.absorbNeighborDamage) {
      buffs.push('protected');
    }
    // Nerfs from neighbor to candidate
    if (n.type === 't3_triplepea' && nUpgrades.includes('u_t3_triplepea_5')) {
      if (candidateClasses.includes('c_shell') || candidateClasses.includes('shell')) {
        buffs.push('-20% hp');
      }
    }
    if (n.type === 't3_firepea2' && nUpgrades.includes('u_t3_firepea2_2')) {
      if (candidateClasses.includes('c_ice') || candidateClasses.includes('ice') || candidateType.includes('ice')) {
        buffs.push('freeze lock');
      }
    }
  }

  const uniqueBuffs = Array.from(new Set(buffs.filter(Boolean)));
  if (uniqueBuffs.length === 0) return null;
  const text = `-> ${uniqueBuffs.slice(0, 2).join(', ')}`;
  const lower = text.toLowerCase();
  let type = 'buff';
  if (lower.includes('-') || lower.includes('lock') || lower.includes('freeze')) {
    type = 'nerf';
  } else if (lower.includes('protect') || lower.includes('hp')) {
    type = 'absorb';
  } else if (lower.includes('rng') || lower.includes('range')) {
    type = 'shard';
  } else if (lower.includes('burn') || lower.includes('area') || lower.includes('aoe')) {
    type = 'fuel';
  }
  return { text, type };
}

/**
 * Computes all stat modifications (buffs, nerfs, protections, group steps)
 * that a neighbor turret receives or loses when candidateType is added or removed.
 */
function computeNeighborStatModifications(
  n: any,
  candidateType: string,
  isGaining: boolean,
  draggedInstance: any = null
): { label: string; type: string } | null {
  if (!n || n.health <= 0 || n.isDying || !candidateType) return null;

  const candidateClasses = getTurretClasses(candidateType);
  const nUpgrades = state.turretUpgrades?.[n.type] || [];
  const nClasses = getTurretClasses(n.type);
  const candidateUpgrades = state.turretUpgrades?.[candidateType] || [];

  // Base neighbors of n without draggedInstance
  const baseNeighbors = getNeighbors(n).filter((other: any) => other !== draggedInstance && other.health > 0 && !other.isDying);

  const mods: Array<{ label: string; type: string }> = [];

  // 1. Conditional Upgrades on n
  for (const uId of nUpgrades) {
    const upg = getUpgradeDefinition(uId, n.type);
    if (!upg?.conditionals) continue;

    for (const cond of upg.conditionals) {
      if (cond.type === 'neighbor_count') {
        const targetClass = cond.targetClass || '';
        const matches = targetClass && (
          candidateClasses.includes(targetClass) ||
          candidateClasses.includes(targetClass.replace('c_', '')) ||
          candidateClasses.includes(`c_${targetClass}`)
        );

        if (matches) {
          const matchingBaseCount = baseNeighbors.filter((cn: any) => {
            const classes = getTurretClasses(cn.type);
            return classes.includes(targetClass) || classes.includes(targetClass.replace('c_', '')) || classes.includes(`c_${targetClass}`);
          }).length;

          const step = (cond as any).step || 1;
          const synType = normalizeClassToSynergy(targetClass);

          if (isGaining) {
            const newCount = matchingBaseCount + 1;
            if (step > 1) {
              const posInGroup = newCount % step;
              if (posInGroup === 0) {
                mods.push({ label: formatModifierBonus(cond.bonus, 1), type: synType });
              } else {
                mods.push({ label: `${formatClassTag(targetClass)} ${posInGroup}/${step}`, type: synType });
              }
            } else {
              mods.push({ label: formatModifierBonus(cond.bonus, 1), type: synType });
            }
          } else {
            const oldCount = matchingBaseCount + 1;
            const newCount = matchingBaseCount;
            if (step > 1) {
              if (oldCount % step === 0) {
                mods.push({ label: formatModifierBonus(cond.bonus, -1), type: 'nerf' });
              } else {
                const posInGroup = newCount % step;
                mods.push({ label: `${formatClassTag(targetClass)} ${posInGroup}/${step}`, type: 'nerf' });
              }
            } else {
              mods.push({ label: formatModifierBonus(cond.bonus, -1), type: 'nerf' });
            }
          }
        }
      } else if (cond.type === 'neighbor_type') {
        const targetType = (cond as any).targetType;
        if (candidateType === targetType) {
          if (isGaining) {
            mods.push({ label: formatModifierBonus(cond.bonus, 1), type: 'shooter' });
          } else {
            mods.push({ label: formatModifierBonus(cond.bonus, -1), type: 'nerf' });
          }
        }
      } else if (cond.type === 'empty_neighbor_count') {
        if (isGaining) {
          mods.push({ label: formatModifierBonus(cond.bonus, -1), type: 'nerf' });
        } else {
          mods.push({ label: formatModifierBonus(cond.bonus, 1), type: 'buff' });
        }
      } else if (cond.type === 'alone') {
        if (isGaining) {
          if (baseNeighbors.length === 0) {
            mods.push({ label: formatModifierBonus(cond.bonus, -1), type: 'nerf' });
          }
        } else {
          if (baseNeighbors.length === 0) {
            mods.push({ label: `${formatModifierBonus(cond.bonus, 1)} (alone)`, type: 'buff' });
          }
        }
      }
    }
  }

  // 2. Random roll upgrades on n
  for (const uId of nUpgrades) {
    if (uId === 'u_dmg_20_n_random' || uId === 'u_firerate_20_n_random') {
      const rolledList = state.upgradeData?.[n.type]?.[uId] || [];
      for (const rolled of rolledList) {
        if (rolled && (candidateClasses.includes(rolled) || candidateClasses.includes(rolled.replace('c_', '')))) {
          const bonus = uId === 'u_dmg_20_n_random' ? { damageMult: 0.2 } : { firerateMult: 0.2 };
          if (isGaining) {
            mods.push({ label: formatModifierBonus(bonus, 1), type: 'buff' });
          } else {
            mods.push({ label: formatModifierBonus(bonus, -1), type: 'nerf' });
          }
        }
      }
    }
  }

  // 3. Cross-buffs and synergies from Candidate to Neighbor
  if (candidateType === 't2_wallaser' && candidateUpgrades.includes('u_t2_wallaser_5')) {
    const isFull = draggedInstance ? draggedInstance.health >= (draggedInstance.maxHealth || 150) : true;
    if (isFull) {
      if (isGaining) {
        mods.push({ label: '+100 hp', type: 'cross_buff' });
      } else {
        mods.push({ label: '-100 hp', type: 'nerf' });
      }
    }
  }

  if (candidateType === 't2_torchwood' && candidateUpgrades.includes('u_t2_torchwood_5') && (nClasses.includes('c_leaf') || nClasses.includes('leaf'))) {
    if (isGaining) {
      mods.push({ label: 'range+10%', type: 'fuel' });
    } else {
      mods.push({ label: 'range-10%', type: 'nerf' });
    }
  }

  const hasCandidateAbsorb = candidateUpgrades.includes('u_t_wall_3') ||
    candidateUpgrades.includes('u_absorb_neighbor_dmg') ||
    candidateUpgrades.includes('u_t2_tall_3') ||
    candidateUpgrades.includes('u_t2_icewall_5') ||
    (draggedInstance?.activeStats?.absorbNeighborDamage);

  if (hasCandidateAbsorb) {
    if (isGaining) {
      mods.push({ label: 'protected', type: 'absorb' });
    } else {
      mods.push({ label: 'unprotected', type: 'nerf' });
    }
  }

  if (candidateType === 't3_triplepea' && candidateUpgrades.includes('u_t3_triplepea_5') && (nClasses.includes('c_shell') || nClasses.includes('shell'))) {
    if (isGaining) {
      mods.push({ label: '-20% hp', type: 'nerf' });
    } else {
      mods.push({ label: '+20% hp', type: 'buff' });
    }
  }

  if (candidateType === 't3_firepea2' && candidateUpgrades.includes('u_t3_firepea2_2') && (nClasses.includes('c_ice') || nClasses.includes('ice') || n.type.includes('ice'))) {
    if (isGaining) {
      mods.push({ label: 'freeze lock', type: 'nerf' });
    } else {
      mods.push({ label: 'unlocked', type: 'buff' });
    }
  }

  if (mods.length === 0) return null;

  const uniqueLabels = Array.from(new Set(mods.map(m => m.label)));
  const hasNerf = mods.some(m => m.type === 'nerf' || m.type === 'suppression' || m.label.includes('-') || m.label.includes('lock') || m.label.includes('unprotected'));
  const primaryType = hasNerf ? 'nerf' : mods[0].type;

  return {
    label: `-> ${uniqueLabels.join(', ')}`,
    type: primaryType
  };
}

/**
 * When hovering a picked turret over a spot, finds each would-be-affected neighbor
 * and returns what stat modification (buff or nerf) it will receive ("-> <stat>").
 *
 * Symmetrical Delta Logic:
 * - New neighbors (gaining the turret) receive positive modifications ("+N%").
 * - Old neighbors (losing the turret as it moves away) receive deductions ("-N%").
 * - Neighbors persisting between both old and new spots receive 0 net change.
 */
export function getEffectsOnNeighborsWhenPlacedAt(
  candidateType: string,
  spotPos: { x: number; y: number },
  axialQ?: number,
  axialR?: number,
  isAttached: boolean = true,
  draggedInstance: any = null
): Map<any, { label: string; type: string }> {
  const affected = new Map<any, { label: string; type: string }>();
  if (!candidateType) return affected;

  const hexDirs = [[1, 0], [-1, 0], [0, -1], [0, 1], [1, -1], [-1, 1]];

  // 1. Find new neighbors of the target spot
  const newNeighbors: any[] = [];
  if (isAttached && axialQ !== undefined && axialR !== undefined && state.player) {
    for (const [dq, dr] of hexDirs) {
      const nq = axialQ + dq;
      const nr = axialR + dr;
      const n = state.player.attachments.find((a: any) => 
        a.hq === nq && a.hr === nr && 
        a !== draggedInstance && 
        a.health > 0 && !a.isDying
      );
      if (n && !newNeighbors.includes(n)) newNeighbors.push(n);
    }
  } else {
    const allWorld = state.world?.getAllTurrets ? state.world.getAllTurrets() : [];
    for (const wt of allWorld) {
      if (wt === draggedInstance || wt.health <= 0 || wt.isDying) continue;
      const wPos = wt.getWorldPos ? wt.getWorldPos() : wt.pos;
      if (wPos && dist(spotPos.x, spotPos.y, wPos.x, wPos.y) <= GRID_SIZE * 1.6) {
        if (!newNeighbors.includes(wt)) newNeighbors.push(wt);
      }
    }
  }

  // 2. Find old neighbors of the dragged instance at its current spot
  const oldNeighbors: any[] = [];
  if (draggedInstance) {
    if (draggedInstance.hq !== undefined && draggedInstance.hr !== undefined && state.player) {
      for (const [dq, dr] of hexDirs) {
        const nq = draggedInstance.hq + dq;
        const nr = draggedInstance.hr + dr;
        const n = state.player.attachments.find((a: any) => 
          a.hq === nq && a.hr === nr && 
          a !== draggedInstance && 
          a.health > 0 && !a.isDying
        );
        if (n && !oldNeighbors.includes(n)) oldNeighbors.push(n);
      }
    } else if (draggedInstance.gx !== undefined && draggedInstance.gy !== undefined && state.world) {
      const allWorld = state.world.getAllTurrets ? state.world.getAllTurrets() : [];
      for (const wt of allWorld) {
        if (wt === draggedInstance || wt.health <= 0 || wt.isDying) continue;
        if (Math.abs(wt.gx - draggedInstance.gx) <= 1 && Math.abs(wt.gy - draggedInstance.gy) <= 1) {
          if (!oldNeighbors.includes(wt)) oldNeighbors.push(wt);
        }
      }
    } else {
      const curNeighbors = getNeighbors(draggedInstance);
      for (const on of curNeighbors) {
        if (on && on !== draggedInstance && on.health > 0 && !on.isDying && !oldNeighbors.includes(on)) {
          oldNeighbors.push(on);
        }
      }
    }
  }

  // 3. New neighbors gaining the turret (+N%)
  const gainingNeighbors = newNeighbors.filter(n => !oldNeighbors.includes(n));
  for (const n of gainingNeighbors) {
    const mod = computeNeighborStatModifications(n, candidateType, true, draggedInstance);
    if (mod) affected.set(n, mod);
  }

  // 4. Old neighbors losing the turret as it moves away (-N%)
  const losingNeighbors = oldNeighbors.filter(n => !newNeighbors.includes(n));
  for (const n of losingNeighbors) {
    const mod = computeNeighborStatModifications(n, candidateType, false, draggedInstance);
    if (mod) affected.set(n, mod);
  }

  return affected;
}

/**
 * When hovering an attached turret in gameplay, finds all buff sources (neighbors providing buffs)
 * and returns their positions and specific bonus labels.
 *
 * Rules:
 * - Only displays the participant's contributed amount, not the total amount.
 * - When part of a group requirement (e.g. for every 3 participants):
 *   - 1st participant: "[c_leaf] 1/3"
 *   - 2nd participant: "[c_leaf] 2/3"
 *   - 3rd participant: "dmg+100%" (unlocked group bonus)
 * - Also includes incoming/outgoing nerfs (e.g. "-20% hp", "freeze lock") and protections ("protected").
 */
export function getBuffSourcesForHoveredTurret(
  hoveredTurret: any
): Array<{ targetTurret: any; pos: { x: number; y: number }; label: string; type: string }> {
  if (!hoveredTurret || hoveredTurret.health <= 0 || hoveredTurret.isDying) return [];

  const neighbors = getNeighbors(hoveredTurret);
  const myUpgrades = state.turretUpgrades?.[hoveredTurret.type] || [];
  const myClasses = getTurretClasses(hoveredTurret.type);

  const turretSourceMap = new Map<any, Array<{ label: string; type: string }>>();
  const addSource = (t: any, label: string, type: string) => {
    if (!t) return;
    if (!turretSourceMap.has(t)) turretSourceMap.set(t, []);
    turretSourceMap.get(t)!.push({ label, type });
  };

  // 1. Buffs given TO hoveredTurret by neighbors (Conditionals on hoveredTurret)
  for (const uId of myUpgrades) {
    const upg = getUpgradeDefinition(uId, hoveredTurret.type);
    if (!upg?.conditionals) continue;

    for (const cond of upg.conditionals) {
      if (cond.type === 'neighbor_count' || cond.type === 'neighbor_type') {
        const targetClass = cond.targetClass || '';
        const targetType = (cond as any).targetType;
        const matchingNeighbors = neighbors.filter((n: any) => {
          if (!n || n.health <= 0 || n.isDying) return false;
          if (targetType) return n.type === targetType;
          const classes = getTurretClasses(n.type);
          return !targetClass || classes.includes(targetClass) || classes.includes(targetClass.replace('c_', ''));
        });

        if (matchingNeighbors.length === 0) continue;

        // Deterministic sorting of participants
        matchingNeighbors.sort((a: any, b: any) => {
          const ap = a.getWorldPos ? a.getWorldPos() : a.pos;
          const bp = b.getWorldPos ? b.getWorldPos() : b.pos;
          if (!ap || !bp) return 0;
          if (Math.abs(ap.y - bp.y) > 0.5) return ap.y - bp.y;
          return ap.x - bp.x;
        });

        const step = (cond as any).step || 1;
        const tag = targetType ? `[${targetType.replace(/^t\d+_/, '')}]` : formatClassTag(targetClass);
        const singleBonusLabel = formatModifierBonus(cond.bonus, 1);
        const synType = targetType ? 'shooter' : normalizeClassToSynergy(targetClass);

        if (step > 1) {
          // Stepped group requirement:
          // 1st participant: "<c_leaf> 1/3 ->"
          // 2nd participant: "<c_leaf> 2/3 ->"
          // 3rd participant: "dmg+100% ->"
          for (let i = 0; i < matchingNeighbors.length; i++) {
            const n = matchingNeighbors[i];
            const slotInGroup = (i % step) + 1;
            if (slotInGroup < step) {
              addSource(n, `${tag} ${slotInGroup}/${step} ->`, synType);
            } else {
              addSource(n, `${singleBonusLabel} ->`, synType);
            }
          }
        } else {
          // Single contribution per participant (giver is indicated as "->" after the stat)
          for (const n of matchingNeighbors) {
            addSource(n, `${singleBonusLabel} ->`, synType);
          }
        }
      }
    }
  }

  // 2. Incoming cross-buffs, protections, and nerfs FROM neighbors TO hoveredTurret (Neighbor is the giver ->)
  for (const n of neighbors) {
    if (!n || n.health <= 0 || n.isDying) continue;
    const nUpgrades = state.turretUpgrades?.[n.type] || [];

    if (n.type === 't2_wallaser' && nUpgrades.includes('u_t2_wallaser_5')) {
      const isFull = n.health >= (n.maxHealth || 150);
      if (isFull) addSource(n, '+100 hp ->', 'cross_buff');
    }
    if (n.type === 't2_torchwood' && nUpgrades.includes('u_t2_torchwood_5') && (myClasses.includes('c_leaf') || myClasses.includes('leaf'))) {
      addSource(n, 'range+10% ->', 'fuel');
    }
    if (n.activeStats?.absorbNeighborDamage) {
      addSource(n, 'protector ->', 'absorb');
    }
    if (n.type === 't3_triplepea' && nUpgrades.includes('u_t3_triplepea_5') && (myClasses.includes('c_shell') || myClasses.includes('shell'))) {
      addSource(n, '-20% hp ->', 'suppression');
    }
    if (n.type === 't3_firepea2' && nUpgrades.includes('u_t3_firepea2_2') && (myClasses.includes('c_ice') || myClasses.includes('ice') || hoveredTurret.type.includes('ice'))) {
      addSource(n, 'freeze lock ->', 'suppression');
    }
  }

  // 3. Outgoing cross-buffs, protections, and nerfs FROM hoveredTurret TO neighbors (Neighbor is the receiver ->)
  if (hoveredTurret.type === 't3_triplepea' && myUpgrades.includes('u_t3_triplepea_5')) {
    for (const n of neighbors) {
      if (!n || n.health <= 0 || n.isDying) continue;
      const classes = getTurretClasses(n.type);
      if (classes.includes('c_shell') || classes.includes('shell')) {
        addSource(n, '-> -20% hp', 'suppression');
      }
    }
  }
  if (hoveredTurret.type === 't3_firepea2' && myUpgrades.includes('u_t3_firepea2_2')) {
    for (const n of neighbors) {
      if (!n || n.health <= 0 || n.isDying) continue;
      const classes = getTurretClasses(n.type);
      if (classes.includes('c_ice') || classes.includes('ice') || n.type.includes('ice')) {
        addSource(n, '-> freeze lock', 'suppression');
      }
    }
  }
  if (hoveredTurret.activeStats?.absorbNeighborDamage) {
    addSource(hoveredTurret, 'protector ->', 'absorb');
    for (const n of neighbors) {
      if (!n || n.health <= 0 || n.isDying) continue;
      addSource(n, '-> protected', 'absorb');
    }
  }
  if (hoveredTurret.type === 't2_wallaser' && myUpgrades.includes('u_t2_wallaser_5')) {
    const isFull = hoveredTurret.health >= (hoveredTurret.maxHealth || 150);
    if (isFull) {
      for (const n of neighbors) {
        if (!n || n.health <= 0 || n.isDying) continue;
        addSource(n, '-> +100 hp', 'cross_buff');
      }
    }
  }
  if (hoveredTurret.type === 't2_torchwood' && myUpgrades.includes('u_t2_torchwood_5')) {
    for (const n of neighbors) {
      if (!n || n.health <= 0 || n.isDying) continue;
      const classes = getTurretClasses(n.type);
      if (classes.includes('c_leaf') || classes.includes('leaf')) {
        addSource(n, '-> range+10%', 'fuel');
      }
    }
  }

  // 4. Alone or Empty Neighbor bonuses active on hoveredTurret itself when it has no neighbors
  if (neighbors.length === 0) {
    for (const uId of myUpgrades) {
      const upg = getUpgradeDefinition(uId, hoveredTurret.type);
      if (!upg?.conditionals) continue;
      for (const cond of upg.conditionals) {
        if (cond.type === 'alone') {
          addSource(hoveredTurret, `${formatModifierBonus(cond.bonus, 1)} (alone)`, 'buff');
        }
      }
    }
  }

  // Combine multiple labels for the same turret into 1 clean speech bubble
  const results: Array<{ targetTurret: any; pos: { x: number; y: number }; label: string; type: string }> = [];
  for (const [turret, items] of turretSourceMap.entries()) {
    const wPos = turret.getWorldPos ? turret.getWorldPos() : turret.pos;
    if (!wPos) continue;

    const uniqueLabels = Array.from(new Set(items.map(it => it.label)));
    const hasSuppression = items.some(it => it.type === 'suppression' || it.type === 'nerf' || it.label.includes('-') || it.label.includes('lock'));
    const primaryType = hasSuppression ? 'suppression' : items[0].type;

    results.push({
      targetTurret: turret,
      pos: wPos,
      label: uniqueLabels.join(', '),
      type: primaryType
    });
  }

  return results;
}

/**
 * Main Synergy Ground Rendering System.
 * Renders base hex links, active elemental conduits, moving energy motes, and socket runes on ground level.
 */
export function drawSynergySystem() {
  const hovered = state.hoveredTurretInstance;
  const isDraggingOrPlacing = state.isCurrentlyDragging || state.selectedTurretType || state.draggedTurretType || state.draggedTurretInstance;

  // 1. Draw Structural Base Hex Connections
  drawBaseHexStructuralGrid();

  // 2. Fetch and Draw Active Gameplay Synergies
  const { links, runes } = getAllActiveSynergies();

  push();
  for (let i = 0; i < links.length; i++) {
    const link = links[i];
    const isConnectedToHovered = hovered && (link.source === hovered || link.target === hovered);

    // Alpha level: subtle ambient when idle, bright when hovered or dragging
    let alpha = 85;
    let weight = 1.8;
    if (isConnectedToHovered) {
      alpha = 240;
      weight = 2.8;
    } else if (isDraggingOrPlacing) {
      alpha = 130;
      weight = 2.0;
    }

    const [r, g, b] = link.color;

    // Draw main conduit line
    stroke(r, g, b, alpha);
    strokeWeight(weight);
    line(link.sourcePos.x, link.sourcePos.y, link.targetPos.x, link.targetPos.y);

    // Draw animated moving energy mote along the active conduit
    if (link.isActive) {
      const moteProgress = (state.frames * 0.035 + (i * 0.23)) % 1;
      const mx = lerp(link.sourcePos.x, link.targetPos.x, moteProgress);
      const my = lerp(link.sourcePos.y, link.targetPos.y, moteProgress);

      noStroke();
      fill(255, 255, 255, isConnectedToHovered ? 255 : 180);
      ellipse(mx, my, isConnectedToHovered ? 5 : 3.5);

      fill(r, g, b, isConnectedToHovered ? 160 : 90);
      ellipse(mx, my, isConnectedToHovered ? 9 : 6);
    }
  }
  pop();

  // 3. Draw Stepped Synergy Runes on Plant Bases
  drawSteppedRunes(runes);
}

/**
 * Draws the subtle structural hex grid links between player and attachments.
 */
function drawBaseHexStructuralGrid() {
  if (!state.player || !state.player.attachments || state.player.attachments.length === 0) return;

  push();
  stroke(255, 255, 255, 45);
  strokeWeight(1.2);

  const hexDirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, -1], [-1, 1]];
  for (const t of state.player.attachments) {
    if (t.hq === undefined || t.health <= 0 || t.isDying) continue;
    const wPos = t.getWorldPos();

    for (const [dq, dr] of hexDirs) {
      const nq = t.hq + dq;
      const nr = t.hr + dr;
      if (nq === 0 && nr === 0) {
        line(wPos.x, wPos.y, state.player.pos.x, state.player.pos.y);
      } else {
        const neighbor = state.player.attachments.find((a: any) => a.hq === nq && a.hr === nr);
        if (neighbor && (neighbor.hq > t.hq || (neighbor.hq === t.hq && neighbor.hr > t.hr))) {
          const nwPos = neighbor.getWorldPos();
          line(wPos.x, wPos.y, nwPos.x, nwPos.y);
        }
      }
    }
  }
  pop();
}

/**
 * Renders small stepped socket runes on the base of turrets that require multiple neighbors.
 */
function drawSteppedRunes(runes: TurretRuneInfo[]) {
  if (runes.length === 0) return;

  push();
  rectMode(CENTER);
  textAlign(CENTER, CENTER);

  for (const rune of runes) {
    const { pos, color, step, isSatisfied } = rune;
    const [r, g, b] = color;
    const pulse = sin(state.frames * 0.08) * 2;
    const runeY = pos.y + 11;

    // Background socket plate
    const plateWidth = step.required * 7 + 6;
    fill(14, 28, 22, 210);
    stroke(r, g, b, isSatisfied ? 220 : 100);
    strokeWeight(1.2);
    rect(pos.x, runeY, plateWidth, 8, 3);

    // Glowing outer halo if fully satisfied
    if (isSatisfied) {
      noFill();
      stroke(r, g, b, 70 + sin(state.frames * 0.1) * 35);
      strokeWeight(1);
      rect(pos.x, runeY, plateWidth + pulse, 10 + pulse, 4);
    }

    // Micro pips
    const startX = pos.x - ((step.required - 1) * 7) / 2;
    for (let p = 0; p < step.required; p++) {
      const pipX = startX + p * 7;
      const isLit = p < step.current;

      if (isLit) {
        fill(r, g, b, 240);
        stroke(255, 255, 255, 200);
        strokeWeight(0.8);
        ellipse(pipX, runeY, 4);
      } else {
        fill(40, 50, 45, 180);
        stroke(r, g, b, 60);
        strokeWeight(0.8);
        ellipse(pipX, runeY, 3);
      }
    }
  }
  pop();
}

/**
 * High-Level Overlay Pass for Synergy Speech Bubbles:
 * - Renders on the EXACT SAME LAYER as turretMergeCost
 * - Prioritizes turretMergeCost: if a merge candidate exists on that spot/turret, synergy text is suppressed!
 * - When picking up a turret: draws total-estimated-buff-change on each available spot.
 * - When hovering over a spot: draws stat modifications on top of each would-be-affected turret.
 * - When hovering an attached turret in gameplay: shows all its buff sources on top of the source turrets.
 */
export function drawSynergyOverlayPass(
  mergeCandidates: any[] = [],
  availableSpots: Array<{ pos: any; q?: number; r?: number; gx?: number; gy?: number; isAttached: boolean }> = [],
  bestSnap: any = null,
  draggedType: string | null = null,
  draggedInstance: any = null
) {
  const isDraggingOrPlacing = !!(draggedType || draggedInstance || state.isCurrentlyDragging);

  // Helper to check if a location is already displaying a merge cost bubble
  const isBlockedByMerge = (x: number, y: number) => {
    return mergeCandidates.some((c: any) => dist(c.wPos.x, c.wPos.y, x, y) < 18);
  };

  // ==========================================
  // CASE A: Picking up / Placing a turret
  // ==========================================
  if (isDraggingOrPlacing && draggedType) {
    // Only display indicators on the currently hovered spot instead of all available spots
    if (bestSnap) {
      if (isBlockedByMerge(bestSnap.x, bestSnap.y)) return;
      if (state.swapTargetPreview && dist(state.swapTargetPreview.getWorldPos().x, state.swapTargetPreview.getWorldPos().y, bestSnap.x, bestSnap.y) < 20) return;

      const matchedSpot = availableSpots.find(s => dist(s.pos.x, s.pos.y, bestSnap.x, bestSnap.y) < 1.0);
      const isAttachedSnap = matchedSpot ? matchedSpot.isAttached : !state.previewWorldSnap;

      let snapQ = matchedSpot?.q;
      let snapR = matchedSpot?.r;
      if (isAttachedSnap && (snapQ === undefined || snapR === undefined) && state.player) {
        const axial = getHexAxial(bestSnap.x - state.player.pos.x, bestSnap.y - state.player.pos.y);
        snapQ = axial.q;
        snapR = axial.r;
      }

      let snapGx = matchedSpot?.gx ?? state.previewWorldSnap?.gx;
      let snapGy = matchedSpot?.gy ?? state.previewWorldSnap?.gy;
      if (!isAttachedSnap && (snapGx === undefined || snapGy === undefined)) {
        snapGx = Math.floor(bestSnap.x / GRID_SIZE);
        snapGy = Math.floor(bestSnap.y / GRID_SIZE);
      }

      const isOwnSnap = draggedInstance && (
        (isAttachedSnap && snapQ !== undefined && snapR !== undefined && draggedInstance.hq === snapQ && draggedInstance.hr === snapR) ||
        (!isAttachedSnap && snapGx !== undefined && snapGy !== undefined && draggedInstance.gx === snapGx && draggedInstance.gy === snapGy)
      );

      // If hovering over the turret's original spot: no changes (zero net delta)
      if (isOwnSnap) return;

      // 1. Draw indicator ONLY on the currently hovered spot
      const buffResult = getBuffsToCandidateAtSpot(
        draggedType,
        draggedInstance,
        bestSnap,
        isAttachedSnap,
        snapQ,
        snapR,
        snapGx,
        snapGy
      );

      if (buffResult) {
        drawSynergySpeechBubble(bestSnap.x, bestSnap.y, buffResult.text, buffResult.type);
      }

      // 2. Draw stat modifications on top of each would-be-affected neighbor (new +N%, old -N%)
      const affectedNeighbors = getEffectsOnNeighborsWhenPlacedAt(
        draggedType,
        bestSnap,
        snapQ,
        snapR,
        isAttachedSnap,
        draggedInstance
      );

      for (const [neighbor, effect] of affectedNeighbors) {
        if (neighbor === draggedInstance) continue;
        const wPos = neighbor.getWorldPos ? neighbor.getWorldPos() : neighbor.pos;
        if (!wPos || isBlockedByMerge(wPos.x, wPos.y)) continue;

        drawSynergySpeechBubble(wPos.x, wPos.y, effect.label, effect.type);
      }
    }
    return;
  }

  // ==========================================
  // CASE B: Normal Gameplay - Hovering an attached turret with buffs/nerfs
  // ==========================================
  if (state.hoveredTurretInstance && !state.isCurrentlyDragging) {
    const hovered = state.hoveredTurretInstance;
    const buffSources = getBuffSourcesForHoveredTurret(hovered);

    for (const src of buffSources) {
      if (isBlockedByMerge(src.pos.x, src.pos.y)) continue;
      drawSynergySpeechBubble(src.pos.x, src.pos.y, src.label, src.type);
    }
  }
}
