const DEF_CONST = 300;

function calcDamage(attacker, defender, multiplier) {
  let atk = attacker.atk;
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

function calcHeal(healer, multiplier) {
  return Math.floor(healer.atk * multiplier / 100);
}
