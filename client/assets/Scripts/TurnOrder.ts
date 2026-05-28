import { BattleUnit } from './BattleUnit';

/** 每轮的出手序列 */
export function buildTurnOrder(units: BattleUnit[]): BattleUnit[] {
  const alive = units.filter(u => u.isAlive);
  return alive.sort((a, b) => b.spd - a.spd);
}
