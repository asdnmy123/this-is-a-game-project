import { BattleUnit } from './BattleUnit';
import { buildTurnOrder } from './TurnOrder';
import { calcDamage, calcHeal } from './DamageFormula';

export interface BattleAction {
  unitId: string;
  actionType: 'attack' | 'skill' | 'heal';
  skillName: string;
  targetId: string;
  damage?: number;
  healAmount?: number;
  isCrit: boolean;
  killed: boolean;
}

export type BattlePhase = 'round_start' | 'player_turn' | 'enemy_turn' | 'round_end' | 'victory' | 'defeat';

export class BattleManager {
  players: BattleUnit[] = [];
  enemies: BattleUnit[] = [];
  allUnits: BattleUnit[] = [];

  turnOrder: BattleUnit[] = [];
  currentTurnIndex: number = 0;
  round: number = 0;
  phase: BattlePhase = 'round_start';

  /** 当前正在行动的角色（用于 UI 行动指示） */
  currentActingUnit: BattleUnit | null = null;
  /** 当前需要玩家选择目标 */
  pendingActionUnit: BattleUnit | null = null;
  /** 当前可以攻击的目标列表 */
  validTargets: BattleUnit[] = [];

  /** 战斗日志 */
  log: string[] = [];

  /** 回调 - 当战斗状态变更时通知 UI */
  onUpdate: (() => void) | null = null;
  onAction: ((action: BattleAction) => void) | null = null;

  constructor(playerConfigs: BattleUnit[], enemyConfigs: BattleUnit[]) {
    this.players = playerConfigs;
    this.enemies = enemyConfigs;
    this.allUnits = [...this.players, ...this.enemies];
  }

  /** 开始战斗 */
  start(): void {
    this.round = 0;
    this.addLog('======== 战斗开始 ========');
    this.startNewRound();
  }

  /** 开始新的一轮 */
  startNewRound(): void {
    this.round++;
    this.currentActingUnit = null;
    this.addLog(`\n--- 第 ${this.round} 轮 ---`);
    this.turnOrder = buildTurnOrder(this.allUnits);
    this.currentTurnIndex = 0;
    this.phase = 'player_turn';
    this.processNextTurn();
  }

  /** 处理下一个角色的行动 */
  processNextTurn(): void {
    // 先检查胜负
    if (this.checkBattleEnd()) return;

    // 跳过己方已死的
    while (this.currentTurnIndex < this.turnOrder.length) {
      const unit = this.turnOrder[this.currentTurnIndex];
      if (unit.isAlive) break;
      this.currentTurnIndex++;
    }

    if (this.currentTurnIndex >= this.turnOrder.length) {
      // 所有人都动完了，进入下一轮
      this.phase = 'round_end';
      this.startNewRound();
      return;
    }

    const current = this.turnOrder[this.currentTurnIndex];
    this.currentActingUnit = current;
    this.addLog(`${current.name} 的回合`);

    if (current.isPlayer) {
      // 玩家角色 - 等待选择目标
      this.phase = 'player_turn';
      this.pendingActionUnit = current;
      this.validTargets = this.enemies.filter(e => e.isAlive);
      this.onUpdate?.();
    } else {
      // 敌人 - AI 自动行动
      this.phase = 'enemy_turn';
      this.enemyAct(current);
    }
  }

  /** 玩家选择一个目标进行攻击 */
  playerAttack(targetId: string): void {
    if (!this.pendingActionUnit) return;

    const attacker = this.pendingActionUnit;
    const target = this.allUnits.find(u => u.id === targetId);
    if (!target || !target.isAlive) return;

    this.pendingActionUnit = null;

    if (attacker.classType === 'suwen') {
      this.doHeal(attacker, target);
    } else {
      this.doAttack(attacker, target, 100);
    }

    this.currentTurnIndex++;
    this.onUpdate?.();
    this.processNextTurn();
  }

  /** 执行一次普通攻击 */
  doAttack(attacker: BattleUnit, target: BattleUnit, mult: number): void {
    const { damage, isCrit } = calcDamage(attacker, target, mult);
    const critTag = isCrit ? '【暴击】' : '';
    target.takeDamage(damage);
    const killed = !target.isAlive;

    this.addLog(`${critTag}${attacker.name} 攻击 ${target.name}，造成 ${damage} 点伤害${killed ? '，击杀了！' : ''}`);
    this.onAction?.({
      unitId: attacker.id, actionType: 'attack', skillName: '普攻',
      targetId: target.id, damage, isCrit, killed,
    });
  }

  doHeal(healer: BattleUnit, target: BattleUnit): void {
    const heal = calcHeal(healer, 100);
    target.heal(heal);
    this.addLog(`${healer.name} 治疗 ${target.name}，回复 ${heal} 点生命`);
    this.onAction?.({
      unitId: healer.id, actionType: 'heal', skillName: '金针',
      targetId: target.id, healAmount: heal, isCrit: false, killed: false,
    });
  }

  /** 敌人 AI：随机攻击一个存活的玩家 */
  enemyAct(unit: BattleUnit): void {
    const targets = this.players.filter(p => p.isAlive);
    if (targets.length === 0) return;

    const target = targets[Math.floor(Math.random() * targets.length)];
    this.doAttack(unit, target, 100);
    this.currentTurnIndex++;
    this.onUpdate?.();
    this.processNextTurn();
  }

  /** 检查战斗是否结束 */
  checkBattleEnd(): boolean {
    const alivePlayers = this.players.filter(p => p.isAlive).length;
    const aliveEnemies = this.enemies.filter(e => e.isAlive).length;

    if (aliveEnemies === 0) {
      this.phase = 'victory';
      this.currentActingUnit = null;
      this.addLog('\n======== 战斗胜利！========');
      this.onUpdate?.();
      return true;
    }
    if (alivePlayers === 0) {
      this.phase = 'defeat';
      this.currentActingUnit = null;
      this.addLog('\n======== 战斗失败 ========');
      this.onUpdate?.();
      return true;
    }
    return false;
  }

  addLog(msg: string): void {
    this.log.push(msg);
  }
}
