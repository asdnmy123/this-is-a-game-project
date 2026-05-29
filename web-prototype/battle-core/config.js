/** 角色基础配置 */

const CHARS = {
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

const ENEMIES = {
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

const SKILLS = {
  xuanjia: {
    normal: { name: '盾击', mult: 80, targetType: 'enemy_single', useDef: true },
    active1: { name: '铁壁嘲讽', mult: 0, targetType: 'all_enemy', cooldown: 4 },
    active2: { name: '护盾援护', mult: 150, targetType: 'ally_single', cooldown: 3, useDef: true },
    passive: { name: '百战之躯', desc: '每损失10%HP，受伤减免+3%，最多30%' },
  },
  fangshi: {
    normal: { name: '符箭', mult: 100, targetType: 'enemy_single' },
    active1: { name: '烈焰符', mult: 130, targetType: 'all_enemy', cooldown: 3 },
    active2: { name: '缚灵咒', mult: 180, targetType: 'enemy_single', cooldown: 3 },
    passive: { name: '通灵', desc: '击杀时所有主动技能冷却-1轮' },
  },
  jinghong: {
    normal: { name: '速射', mult: 100, targetType: 'enemy_single' },
    active1: { name: '破甲箭', mult: 220, targetType: 'enemy_single', cooldown: 3 },
    active2: { name: '鹰眼', mult: 0, targetType: 'self', cooldown: 4 },
    passive: { name: '追猎', desc: '击杀后追击普攻60%伤害，每轮最多一次' },
  },
  suwen: {
    normal: { name: '金针', mult: 100, targetType: 'ally_lowest' },
    active1: { name: '回春术', mult: 320, targetType: 'ally_single', cooldown: 3 },
    active2: { name: '益气汤', mult: 180, targetType: 'all_ally', cooldown: 4 },
    passive: { name: '悬壶', desc: '行动结束时全队治疗 ATK×40%' },
  },
};
