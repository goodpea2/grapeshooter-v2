import { enemyTypes } from '../balanceEnemies';

export interface PaletteItem {
  key: string;
  name: string;
  category: 'obstacles' | 'overlays' | 'liquids' | 'groundFeatures' | 'entities' | 'turrets' | 'flags';
  subCategory?: string;
  desc: string;
  color?: number[];
  icon?: string;
}

export function getAllEnemyTypesList(): { key: string; label: string }[] {
  return Object.keys(enemyTypes).map(key => ({
    key,
    label: key
  }));
}

export const ALL_ENEMY_TYPES_LIST: { key: string; label: string }[] = Object.keys(enemyTypes).map(key => ({
  key,
  label: key
}));
