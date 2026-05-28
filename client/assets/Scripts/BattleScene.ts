import { _decorator, Component, Node, Label, Button, instantiate, Prefab, Color, Sprite, find } from 'cc';
import { BattleManager, BattleAction, BattlePhase } from './BattleManager';
import { BattleUnit } from './BattleUnit';
import { CHARS, ENEMIES } from './Config';
const { ccclass, property } = _decorator;

/** 字符风格的人物展示 */
const CLASS_ICONS: Record<string, string> = {
  xuanjia: '【甲】',
  fangshi: '【法】',
  jinghong: '【弓】',
  suwen: '【医】',
};

@ccclass('BattleScene')
export class BattleScene extends Component {
  @property({ type: Node })
  playerArea: Node | null = null;

  @property({ type: Node })
  enemyArea: Node | null = null;

  @property({ type: Node })
  logArea: Node | null = null;

  @property({ type: Node })
  actionPanel: Node | null = null;

  @property({ type: Prefab })
  unitCardPrefab: Prefab | null = null;

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Label })
  roundLabel: Label | null = null;

  battleMgr: BattleManager = null!;
  unitNodes: Map<string, { root: Node; hpLabel: Label; nameLabel: Label; iconLabel: Label }> = new Map();

  start() {
    this.initBattle();
  }

  initBattle() {
    // 创建角色
    const player1 = new BattleUnit(CHARS.xuanjia, true, 0);
    const player2 = new BattleUnit(CHARS.fangshi, true, 1);
    const player3 = new BattleUnit(CHARS.jinghong, true, 2);

    const enemy1 = new BattleUnit(ENEMIES.bandit, false, 0);
    const enemy2 = new BattleUnit(ENEMIES.bandit, false, 1);
    const enemy3 = new BattleUnit(ENEMIES.bandit_leader, false, 2);

    this.battleMgr = new BattleManager([player1, player2, player3], [enemy1, enemy2, enemy3]);

    // 渲染初始状态
    this.renderUnits();

    // 回调绑定
    this.battleMgr.onUpdate = () => this.onBattleUpdate();
    this.battleMgr.onAction = (action) => this.onBattleAction(action);

    // 开始战斗
    this.battleMgr.start();
    this.updateUI();
  }

  renderUnits() {
    // 清空
    this.playerArea?.removeAllChildren();
    this.enemyArea?.removeAllChildren();
    this.unitNodes.clear();

    // 渲染玩家
    for (const unit of this.battleMgr.players) {
      const node = this.createUnitNode(unit);
      this.playerArea?.addChild(node);
    }

    // 渲染敌人
    for (const unit of this.battleMgr.enemies) {
      const node = this.createUnitNode(unit);
      this.enemyArea?.addChild(node);
    }
  }

  createUnitNode(unit: BattleUnit): Node {
    const node = new Node(unit.name);
    node.setPosition(0, 0);

    // 图标
    const iconNode = new Node('icon');
    const iconLabel = iconNode.addComponent(Label);
    iconLabel.string = CLASS_ICONS[unit.classType] || '【?】';
    iconLabel.fontSize = 36;
    iconLabel.color = unit.isPlayer ? Color.WHITE : Color.RED;
    iconNode.setPosition(0, 30);

    // 名字
    const nameNode = new Node('name');
    const nameLabel = nameNode.addComponent(Label);
    nameLabel.string = unit.name;
    nameLabel.fontSize = 18;
    nameNode.setPosition(0, 0);

    // HP
    const hpNode = new Node('hp');
    const hpLabel = hpNode.addComponent(Label);
    hpLabel.fontSize = 16;
    hpLabel.color = new Color(100, 255, 100);
    hpNode.setPosition(0, -25);

    node.addChild(iconNode);
    node.addChild(nameNode);
    node.addChild(hpNode);

    // 敌人可点击
    if (!unit.isPlayer) {
      const clickNode = new Node('click');
      clickNode.setPosition(0, 0);
      const btn = clickNode.addComponent(Button);
      const sprite = clickNode.addComponent(Sprite);
      sprite.color = new Color(255, 255, 255, 0); // 透明
      clickNode.setContentSize(120, 100);
      btn.node.on(Button.EventType.CLICK, () => {
        this.onEnemyClicked(unit);
      });
      node.addChild(clickNode);
    }

    this.unitNodes.set(unit.id, { root: node, hpLabel, nameLabel, iconLabel });
    return node;
  }

  /** 点击敌人 - 选择攻击目标 */
  onEnemyClicked(unit: BattleUnit) {
    if (!this.battleMgr.pendingActionUnit) return;
    if (!unit.isAlive) return;

    this.battleMgr.playerAttack(unit.id);
  }

  /** 战斗状态更新 */
  onBattleUpdate() {
    this.updateUI();
  }

  /** 收到 action，刷新显示 */
  onBattleAction(action: BattleAction) {
    this.flashUnit(action.unitId);
    if (action.targetId) {
      this.flashUnit(action.targetId);
    }
  }

  updateUI() {
    // 更新所有单位的 HP 显示
    for (const unit of this.battleMgr.allUnits) {
      const nodes = this.unitNodes.get(unit.id);
      if (!nodes) continue;

      nodes.hpLabel.string = unit.hpText;
      nodes.root.active = unit.isAlive;
    }

    // 轮数
    if (this.roundLabel) {
      this.roundLabel.string = `第 ${this.battleMgr.round} 轮`;
    }

    // 状态
    if (this.statusLabel) {
      switch (this.battleMgr.phase) {
        case 'player_turn':
          if (this.battleMgr.pendingActionUnit) {
            this.statusLabel.string = `${this.battleMgr.pendingActionUnit.name} - 选择目标`;
          } else {
            this.statusLabel.string = '战斗中...';
          }
          break;
        case 'enemy_turn':
          this.statusLabel.string = '敌人行动中...';
          break;
        case 'victory':
          this.statusLabel.string = '🎉 战斗胜利！';
          break;
        case 'defeat':
          this.statusLabel.string = '💀 战斗失败';
          break;
        default:
          this.statusLabel.string = '';
      }
    }

    // 日志
    if (this.logArea) {
      const logLabel = this.logArea.getComponent(Label);
      if (logLabel) {
        const recent = this.battleMgr.log.slice(-10).join('\n');
        logLabel.string = recent;
      }
    }
  }

  flashUnit(unitId: string) {
    // 简单闪烁反馈
    const nodes = this.unitNodes.get(unitId);
    if (!nodes) return;
    const original = nodes.iconLabel.color;
    nodes.iconLabel.color = Color.YELLOW;
    setTimeout(() => {
      nodes.iconLabel.color = original;
    }, 200);
  }
}
