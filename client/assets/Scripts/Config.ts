/** 角色基础配置 */
export interface CharConfig {
  id: string;
  name: string;
  classType: 'xuanjia' | 'fangshi' | 'jinghong' | 'suwen';
  atk: number;
  def: number;
  hp: number;
  spd: number;
  crit: number;     // 暴击率 0-1
  critDmg: number;  // 暴击伤害倍率
  penetration: number; // 穿透 0-1
}

export interface SkillConfig {
  name: string;
  multiplier: number;    // 倍率 %
  type: 'normal' | 'active' | 'passive';
  cooldown: number;
  targetType: 'enemy_single' | 'enemy_all' | 'ally_single' | 'ally_all' | 'self';
}

export const CHARS: Record<string, CharConfig> = {
  xuanjia: {
    id: 'xuanjia', name: '玄甲·卫岳', classType: 'xuanjia',
    atk: 320, def: 400, hp: 4800, spd: 80,
    crit: 0.03, critDmg: 1.5, penetration: 0,
  },
  fangshi: {
    id: 'fangshi', name: '方士·青崖', classType: 'fangshi',
    atk: 500, def: 200, hp: 2800, spd: 120,
    crit: 0.05, critDmg: 1.5, penetration: 0.3,
  },
  jinghong: {
    id: 'jinghong', name: '惊鸿·苏玄', classType: 'jinghong',
    atk: 440, def: 280, hp: 3400, spd: 150,
    crit: 0.15, critDmg: 1.6, penetration: 0,
  },
  suwen: {
    id: 'suwen', name: '素问·茯苓', classType: 'suwen',
    atk: 280, def: 280, hp: 3600, spd: 100,
    crit: 0.03, critDmg: 1.5, penetration: 0,
  },
};

export const ENEMIES: Record<string, CharConfig> = {
  bandit: {
    id: 'bandit', name: '山贼喽啰', classType: 'xuanjia',
    atk: 200, def: 150, hp: 1500, spd: 100,
    crit: 0.05, critDmg: 1.5, penetration: 0,
  },
  bandit_leader: {
    id: 'bandit_leader', name: '山贼头目', classType: 'fangshi',
    atk: 350, def: 200, hp: 3000, spd: 110,
    crit: 0.1, critDmg: 1.5, penetration: 0.1,
  },
};
