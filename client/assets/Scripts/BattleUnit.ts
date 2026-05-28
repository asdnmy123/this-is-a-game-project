import { CharConfig } from './Config';

/** 战斗中的角色状态 */
export class BattleUnit {
  id: string;
  name: string;
  classType: string;
  config: CharConfig;

  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  crit: number;
  critDmg: number;
  penetration: number;

  isAlive: boolean;
  isPlayer: boolean;
  teamIndex: number; // 队伍位置 0-2（玩家）或 0-N（敌人）

  constructor(config: CharConfig, isPlayer: boolean, teamIndex: number) {
    this.config = config;
    this.id = config.id;
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
  }

  takeDamage(damage: number): void {
    this.hp = Math.max(0, this.hp - damage);
    if (this.hp <= 0) {
      this.isAlive = false;
    }
  }

  heal(amount: number): void {
    this.hp = Math.min(this.maxHp, this.hp + amount);
  }

  get hpPercent(): number {
    return this.hp / this.maxHp;
  }

  /** 显示的 HP 条信息 */
  get hpText(): string {
    return `${this.hp}/${this.maxHp}`;
  }
}
