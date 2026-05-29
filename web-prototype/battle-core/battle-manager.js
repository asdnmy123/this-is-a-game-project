class BattleManager {
  constructor(players, enemies) {
    this.players = players;
    this.enemies = enemies;
    this.allUnits = players.concat(enemies);

    this.turnOrder = [];
    this.currentTurnIndex = 0;
    this.round = 0;
    this.phase = 'round_start';

    this.currentActingUnit = null;
    this.pendingActionUnit = null;
    this.pendingSkill = 'normal';  // 当前选中技能 key：'normal' | 'active1' | 'active2'
    this.validTargets = [];

    this.log = [];
    this.onUpdate = null;
    this.onAction = null;
  }

  start() {
    this.round = 0;
    this.addLog('======== 战斗开始 ========');
    this.startNewRound();
  }

  startNewRound() {
    this.round++;
    this.currentActingUnit = null;
    this.addLog('\n--- 第 ' + this.round + ' 轮 ---');

    // 每轮开始时所有存活单位的技能冷却 -1
    this.allUnits.forEach(function(u) {
      if (u.isAlive) u.reduceCooldowns();
    });

    this.turnOrder = buildTurnOrder(this.allUnits);
    this.currentTurnIndex = 0;
    this.phase = 'player_turn';
    this.processNextTurn();
  }

  processNextTurn() {
    if (this.checkBattleEnd()) return;

    while (this.currentTurnIndex < this.turnOrder.length) {
      var unit = this.turnOrder[this.currentTurnIndex];
      if (unit.isAlive) break;
      this.currentTurnIndex++;
    }

    if (this.currentTurnIndex >= this.turnOrder.length) {
      this.phase = 'round_end';
      this.startNewRound();
      return;
    }

    var current = this.turnOrder[this.currentTurnIndex];
    this.currentActingUnit = current;
    this.addLog(current.name + ' 的回合');

    if (current.isPlayer) {
      this.phase = 'player_turn';
      this.pendingActionUnit = current;
      this.validTargets = this.enemies.filter(function(e) { return e.isAlive; });
      if (this.onUpdate) this.onUpdate();
    } else {
      this.phase = 'enemy_turn';
      this.enemyAct(current);
    }
  }

  /** 获取某单位的可用技能列表（含冷却状态），供 UI 渲染技能按钮 */
  getAvailableSkills(unit) {
    var classSkills = SKILLS[unit.classType];
    if (!classSkills) return [];

    var result = [];

    // 普攻始终可用
    var norm = classSkills.normal;
    result.push({
      key: 'normal', name: norm.name, mult: norm.mult,
      targetType: norm.targetType, useDef: norm.useDef || false,
      cooldown: 0, isActive: false,
    });

    // 主动技能（检查冷却）
    if (unit.cooldowns) {
      ['active1', 'active2'].forEach(function(key) {
        var skill = classSkills[key];
        if (!skill) return;
        result.push({
          key: key, name: skill.name, mult: skill.mult,
          targetType: skill.targetType, useDef: skill.useDef || false,
          cooldown: unit.cooldowns[key] || 0, isActive: true,
        });
      });
    }

    return result;
  }

  /**
   * 执行当前行动（取代原来的 playerAttack）
   * @param {string|null} targetId - 选中的目标 ID（AOE/自身类可传 null）
   */
  executeAction(targetId) {
    if (!this.pendingActionUnit) return;

    var attacker = this.pendingActionUnit;
    var skillKey = this.pendingSkill || 'normal';
    var classSkills = SKILLS[attacker.classType];
    var skillData = classSkills[skillKey] || classSkills.normal;

    // 清空待行动状态
    this.pendingActionUnit = null;
    this.pendingSkill = 'normal';

    var self = this;

    // 根据 targetType 分发
    switch (skillData.targetType) {
      case 'enemy_single':
        self._execEnemySingle(attacker, targetId, skillData, skillKey);
        break;
      case 'all_enemy':
        self._execAllEnemy(attacker, skillData, skillKey);
        break;
      case 'ally_single':
        self._execAllySingle(attacker, targetId, skillData, skillKey);
        break;
      case 'all_ally':
        self._execAllAlly(attacker, skillData, skillKey);
        break;
      case 'ally_lowest':
        self._execAllyLowest(attacker, skillData, skillKey);
        break;
      case 'self':
        self._execSelf(attacker, skillData, skillKey);
        break;
    }

    this.currentTurnIndex++;
    if (this.onUpdate) this.onUpdate();
    this.processNextTurn();
  }

  // ---------- 技能目标处理 helper ----------

  /** 单体攻击敌人 */
  _execEnemySingle(attacker, targetId, skillData, skillKey) {
    var target = this.allUnits.find(function(u) { return u.id === targetId; });
    if (!target || !target.isAlive) return;
    this.doAttack(attacker, target, skillData.mult, skillData.name);
    if (skillKey !== 'normal') attacker.cooldowns[skillKey] = skillData.cooldown;
  }

  /** 全体敌人 */
  _execAllEnemy(attacker, skillData, skillKey) {
    var targets = this.enemies.filter(function(e) { return e.isAlive; });
    var self = this;

    if (skillData.mult > 0) {
      targets.forEach(function(t) {
        self.doAttack(attacker, t, skillData.mult, skillData.name);
      });
    } else {
      // mult=0 的纯效果技能（如铁壁嘲讽），暂不实现 debuff，只记日志
      self.addLog(attacker.name + ' 使用 ' + skillData.name);
      if (self.onAction) {
        self.onAction({
          unitId: attacker.id, actionType: 'skill', skillName: skillData.name,
          targetId: attacker.id, damage: 0, isCrit: false, killed: false,
        });
      }
    }

    if (skillKey !== 'normal') attacker.cooldowns[skillKey] = skillData.cooldown;
  }

  /** 单体友方（治疗 / 护盾援护） */
  _execAllySingle(attacker, targetId, skillData, skillKey) {
    var target = this.allUnits.find(function(u) { return u.id === targetId; });
    if (!target || !target.isAlive) return;

    if (skillData.useDef) {
      // 护盾援护：用 DEF 计算治疗量
      var heal = Math.floor(attacker.def * skillData.mult / 100);
      target.heal(heal);
      this.addLog(attacker.name + ' 使用 ' + skillData.name + ' 为 ' + target.name + ' 护盾回复 ' + heal + ' 点生命');
      if (this.onAction) {
        this.onAction({
          unitId: attacker.id, actionType: 'heal', skillName: skillData.name,
          targetId: target.id, healAmount: heal, isCrit: false, killed: false,
        });
      }
    } else {
      this.doHeal(attacker, target, skillData.name, skillData.mult);
    }

    if (skillKey !== 'normal') attacker.cooldowns[skillKey] = skillData.cooldown;
  }

  /** 全体友方治疗 */
  _execAllAlly(attacker, skillData, skillKey) {
    var targets = this.players.filter(function(p) { return p.isAlive; });
    var self = this;
    targets.forEach(function(t) {
      self.doHeal(attacker, t, skillData.name, skillData.mult);
    });
    if (skillKey !== 'normal') attacker.cooldowns[skillKey] = skillData.cooldown;
  }

  /** 血量百分比最低友方（素问普攻） */
  _execAllyLowest(attacker, skillData, skillKey) {
    var target = this.players
      .filter(function(p) { return p.isAlive; })
      .sort(function(a, b) { return a.hpPercent - b.hpPercent; })[0];
    if (!target) return;
    this.doHeal(attacker, target, skillData.name, skillData.mult);
    if (skillKey !== 'normal') attacker.cooldowns[skillKey] = skillData.cooldown;
  }

  /** 自身（鹰眼），暂不实现 buff，只占位 */
  _execSelf(attacker, skillData, skillKey) {
    this.addLog(attacker.name + ' 使用 ' + skillData.name + '，施放成功');
    if (this.onAction) {
      this.onAction({
        unitId: attacker.id, actionType: 'skill', skillName: skillData.name,
        targetId: attacker.id, damage: 0, isCrit: false, killed: false,
      });
    }
    if (skillKey !== 'normal') attacker.cooldowns[skillKey] = skillData.cooldown;
  }

  doAttack(attacker, target, mult, skillName) {
    var result = calcDamage(attacker, target, mult);
    var damage = result.damage;
    var isCrit = result.isCrit;
    var critTag = isCrit ? '【暴击】' : '';
    target.takeDamage(damage);
    var killed = !target.isAlive;

    var displayName = skillName || '普攻';
    this.addLog(critTag + attacker.name + ' 使用 ' + displayName + ' 攻击 ' + target.name + '，造成 ' + damage + ' 点伤害' + (killed ? '，击杀了！' : ''));
    if (this.onAction) {
      this.onAction({
        unitId: attacker.id, actionType: 'attack', skillName: displayName,
        targetId: target.id, damage: damage, isCrit: isCrit, killed: killed,
      });
    }
  }

  doHeal(healer, target, skillName, mult) {
    var pct = mult || 100;
    var heal = calcHeal(healer, pct);
    target.heal(heal);
    var displayName = skillName || '金针';
    this.addLog(healer.name + ' 使用 ' + displayName + ' 治疗 ' + target.name + '，回复 ' + heal + ' 点生命');
    if (this.onAction) {
      this.onAction({
        unitId: healer.id, actionType: 'heal', skillName: displayName,
        targetId: target.id, healAmount: heal, isCrit: false, killed: false,
      });
    }
  }

  enemyAct(unit) {
    var targets = this.players.filter(function(p) { return p.isAlive; });
    if (targets.length === 0) return;

    var target = targets[Math.floor(Math.random() * targets.length)];
    this.doAttack(unit, target, 100);
    this.currentTurnIndex++;
    if (this.onUpdate) this.onUpdate();
    this.processNextTurn();
  }

  checkBattleEnd() {
    var alivePlayers = this.players.filter(function(p) { return p.isAlive; }).length;
    var aliveEnemies = this.enemies.filter(function(e) { return e.isAlive; }).length;

    if (aliveEnemies === 0) {
      this.phase = 'victory';
      this.currentActingUnit = null;
      this.addLog('\n======== 战斗胜利！=======');
      if (this.onUpdate) this.onUpdate();
      return true;
    }
    if (alivePlayers === 0) {
      this.phase = 'defeat';
      this.currentActingUnit = null;
      this.addLog('\n======== 战斗失败 ========');
      if (this.onUpdate) this.onUpdate();
      return true;
    }
    return false;
  }

  addLog(msg) {
    this.log.push(msg);
  }
}

function buildTurnOrder(units) {
  var alive = units.filter(function(u) { return u.isAlive; });
  return alive.sort(function(a, b) { return b.spd - a.spd; });
}
