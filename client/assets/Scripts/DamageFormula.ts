import { BattleUnit } from './BattleUnit';

const DEF_CONST = 300;

/**
 * 伤害公式（简化版 MVP）
 * Step 1: baseDamage = ATK × mult / 100
 * Step 2: 防御减免 = DEF / (DEF + DEF_CONST)
 * Step 3: 穿透减免 = DEF × (1 - 穿透)
 * Step 4: 暴击判定
 * Step 5: 波动（MVP 固定取 1.0）
 * Step 6: 保底 1
 */
export function calcDamage(
  attacker: BattleUnit,
  defender: BattleUnit,
  multiplier: number,
): { damage: number; isCrit: boolean } {
  // Step 1: 基础伤害
  let atk = attacker.atk;
  // 玄甲用 DEF 替代 ATK
  if (attacker.classType === 'xuanjia') {
    atk = attacker.def;
  }
  let damage = Math.floor(atk * multiplier / 100);

  // Step 2-3: 防御减免（穿透修正）
  const effectiveDef = defender.def * (1 - attacker.penetration);
  const defenseReduction = effectiveDef / (effectiveDef + DEF_CONST);
  damage = Math.floor(damage * (1 - defenseReduction));

  // Step 4: 保底
  damage = Math.max(1, damage);

  // Step 5: 暴击
  let isCrit = false;
  if (Math.random() < attacker.crit) {
    damage = Math.floor(damage * attacker.critDmg);
    isCrit = true;
  }

  return { damage, isCrit };
}

/** 治疗计算 */
export function calcHeal(
  healer: BattleUnit,
  multiplier: number,
): number {
  return Math.floor(healer.atk * multiplier / 100);
}
