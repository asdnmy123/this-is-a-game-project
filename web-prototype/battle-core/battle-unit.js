let _unitIdCounter = 0;

class BattleUnit {
  constructor(config, isPlayer, teamIndex) {
    this.config = config;
    this.id = config.id + '_' + (_unitIdCounter++);
    this.name = config.name;
    this.classType = config.classType;
    this.isPlayer = isPlayer;
    this.teamIndex = teamIndex;

    this.maxHp = config.hp;
    this.hp = config.hp;
    this.atk = config.atk;
    this.def = config.def;
    this.spd = config.spd;
    this.crit = config.crit;
    this.critDmg = config.critDmg;
    this.penetration = config.penetration;
    this.isAlive = true;

    // 技能冷却跟踪：active1/active2 的剩余冷却轮数（0=可用）
    this.cooldowns = { active1: 0, active2: 0 };
  }

  /** 每轮开始时将冷却减 1（不低于 0） */
  reduceCooldowns() {
    if (this.cooldowns.active1 > 0) this.cooldowns.active1--;
    if (this.cooldowns.active2 > 0) this.cooldowns.active2--;
  }

  takeDamage(damage) {
    this.hp = Math.max(0, this.hp - damage);
    if (this.hp <= 0) {
      this.isAlive = false;
    }
  }

  heal(amount) {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  get hpPercent() {
    return this.hp / this.maxHp;
  }

  get hpText() {
    return this.hp + '/' + this.maxHp;
  }
}
