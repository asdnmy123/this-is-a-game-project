import { _decorator, Component, Node, Label, Color, UITransform, Vec3, tween, Tween, Graphics } from 'cc';
import { BattleManager, BattleAction } from './BattleManager';
import { BattleUnit } from './BattleUnit';
import { CHARS, ENEMIES } from './Config';
const { ccclass, property } = _decorator;

/**
 * Changelog (2026-05-28): Fixes from prototype code + UI review
 * - [E1] setContentSize -> UITransform for click hitbox
 * - [W1] Removed empty Sprite from enemy click area, use touch events
 * - [W2] setTimeout -> tween for flash feedback
 * - [S1] Removed unused imports (instantiate, Prefab, find, Button, Sprite)
 * - [B1] Horizontal layout for player/enemy units
 * - [B2] Enemy click area visual indicator (semi-transparent bg + border)
 * - [B3] Damage/heal floating number popups (tween + destroy)
 * - [I1] 古风 color palette applied throughout
 * - [I2] Battle log semi-transparent background
 * - [I3] Victory/defeat: 古风 Chinese text ("凯旋" / "全军覆没"), no emoji
 * - [I5] HP bar with Graphics, color thresholds (绿 > 50%, 金 30-50%, 红 <= 30%)
 * - [I6] Current turn indicator (pulsing bar via tween .repeatForever)
 */

/** 古风配色 */
const COLORS = {
  playerText: new Color(0xE8, 0xD5, 0xB7),  // 宣纸白
  enemyText: new Color(0xC8, 0x4C, 0x4C),   // 朱砂红
  hpGreen: new Color(0x6B, 0xAF, 0x6B),     // 翠竹绿
  hpAmber: new Color(0xD4, 0xA7, 0x6A),     // 琥珀金
  hpDanger: new Color(0xC8, 0x4C, 0x4C),    // 朱砂红
  logText: new Color(0x8B, 0x7D, 0x6B),     // 灰褐
  classColors: {
    xuanjia: new Color(0x8B, 0x45, 0x13),   // 铁锈棕
    fangshi: new Color(0x4A, 0x6F, 0xA5),   // 青黛蓝
    jinghong: new Color(0xB8, 0x86, 0x0B),  // 古铜金
    suwen: new Color(0x6B, 0x8E, 0x6B),     // 苍绿
  },
};

/** 字符风格的人物展示 */
const CLASS_ICONS: Record<string, string> = {
  xuanjia: '【甲】',
  fangshi: '【法】',
  jinghong: '【弓】',
  suwen: '【医】',
};

interface UnitNodeData {
  root: Node;
  iconLabel: Label;
  nameLabel: Label;
  hpFill: Graphics;
  hpLabel: Label;
}

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

  @property({ type: Label })
  statusLabel: Label | null = null;

  @property({ type: Label })
  roundLabel: Label | null = null;

  battleMgr: BattleManager = null!;
  unitNodes: Map<string, UnitNodeData> = new Map();
  private _logBgSetup = false;

  start() {
    this.initBattle();
    this.setupLogArea();
  }

  private setupLogArea() {
    if (!this.logArea || this._logBgSetup) return;
    this._logBgSetup = true;

    const bg = new Node('logBg');
    const gfx = bg.addComponent(Graphics);
    gfx.fillColor = new Color(0x2A, 0x1F, 0x1A, 204);
    gfx.rect(-110, -100, 220, 200);
    gfx.fill();
    bg.setPosition(0, 0);
    this.logArea.addChild(bg, 0);

    const logLabel = this.logArea.getComponent(Label);
    if (logLabel) {
      logLabel.fontSize = 14;
      logLabel.color = COLORS.logText;
      logLabel.lineHeight = 20;
    }
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
    this.playerArea?.removeAllChildren();
    this.enemyArea?.removeAllChildren();
    this.unitNodes.clear();

    const renderGroup = (units: BattleUnit[], parent: Node | null) => {
      const count = units.length;
      const spacing = 130;
      const startX = -((count - 1) * spacing) / 2;
      units.forEach((unit, i) => {
        const node = this.createUnitNode(unit);
        node.setPosition(startX + i * spacing, 0);
        parent?.addChild(node);
      });
    };

    renderGroup(this.battleMgr.players, this.playerArea);
    renderGroup(this.battleMgr.enemies, this.enemyArea);
  }

  createUnitNode(unit: BattleUnit): Node {
    const node = new Node(unit.name);

    // 敌人：半透明背景 + 边框（点击视觉指示）
    if (!unit.isPlayer) {
      const bgNode = new Node('enemyBg');
      const bgGfx = bgNode.addComponent(Graphics);
      bgGfx.fillColor = new Color(0x3C, 0x2A, 0x1E, 100);
      bgGfx.rect(-55, -50, 110, 100);
      bgGfx.fill();
      bgNode.setPosition(0, 0);
      node.addChild(bgNode);

      const borderNode = new Node('enemyBorder');
      const borderGfx = borderNode.addComponent(Graphics);
      borderGfx.fillColor = new Color(0x8B, 0x73, 0x55, 80);
      borderGfx.rect(-57, -52, 114, 104);
      borderGfx.fill();
      borderNode.setPosition(0, 0);
      node.addChild(borderNode);
    }

    // 图标
    const iconNode = new Node('icon');
    const iconLabel = iconNode.addComponent(Label);
    iconLabel.string = CLASS_ICONS[unit.classType] || '【?】';
    iconLabel.fontSize = 36;
    iconNode.setPosition(0, 30);
    const classColor = COLORS.classColors[unit.classType as keyof typeof COLORS.classColors] || COLORS.playerText;
    iconLabel.color = unit.isPlayer ? classColor : COLORS.enemyText;

    // 名字
    const nameNode = new Node('name');
    const nameLabel = nameNode.addComponent(Label);
    nameLabel.string = unit.name;
    nameLabel.fontSize = 18;
    nameLabel.color = unit.isPlayer ? COLORS.playerText : COLORS.enemyText;
    nameNode.setPosition(0, 0);

    // HP 文字
    const hpLabelNode = new Node('hpLabel');
    const hpLabel = hpLabelNode.addComponent(Label);
    hpLabel.string = unit.hpText;
    hpLabel.fontSize = 14;
    hpLabel.color = COLORS.hpGreen;
    hpLabelNode.setPosition(0, -22);

    // HP 条背景
    const hpBgNode = new Node('hpBg');
    const hpBgGfx = hpBgNode.addComponent(Graphics);
    hpBgGfx.fillColor = new Color(0x3A, 0x2A, 0x1A);
    hpBgGfx.rect(-45, -3, 90, 6);
    hpBgGfx.fill();
    hpBgNode.setPosition(0, -33);

    // HP 条填充
    const hpFillNode = new Node('hpFill');
    const hpFillGfx = hpFillNode.addComponent(Graphics);
    hpFillGfx.fillColor = COLORS.hpGreen;
    hpFillGfx.rect(-45, -3, 90, 6);
    hpFillGfx.fill();
    hpFillNode.setPosition(0, -33);

    node.addChild(iconNode);
    node.addChild(nameNode);
    node.addChild(hpLabelNode);
    node.addChild(hpBgNode);
    node.addChild(hpFillNode);

    // 敌人可点击区域（纯 UITransform + 触摸事件）
    if (!unit.isPlayer) {
      const clickNode = new Node('click');
      clickNode.setPosition(0, 0);
      const uiTransform = clickNode.getComponent(UITransform)!;
      uiTransform.setContentSize(120, 100);
      clickNode.on(Node.EventType.TOUCH_END, () => {
        this.onEnemyClicked(unit);
      });
      node.addChild(clickNode);
    }

    this.unitNodes.set(unit.id, { root: node, iconLabel, nameLabel, hpFill: hpFillGfx, hpLabel });
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

      // 伤害/治疗数字弹出
      const targetData = this.unitNodes.get(action.targetId);
      if (targetData) {
        if (action.damage !== undefined) {
          this.showDamageText(targetData.root, action.damage, action.isCrit);
        } else if (action.healAmount !== undefined) {
          this.showHealText(targetData.root, action.healAmount);
        }
      }
    }
  }

  private flashUnit(unitId: string) {
    const data = this.unitNodes.get(unitId);
    if (!data) return;
    const original = data.iconLabel.color.clone();
    Tween.stopAllByTarget(data.iconLabel);
    tween(data.iconLabel)
      .to(0.1, { color: Color.YELLOW })
      .to(0.1, { color: original })
      .start();
  }

  private showDamageText(targetNode: Node, value: number, isCrit: boolean) {
    const node = new Node('damageText');
    const label = node.addComponent(Label);
    label.string = isCrit ? `暴击! ${value}` : `-${value}`;
    label.fontSize = isCrit ? 28 : 22;
    label.color = isCrit ? Color.YELLOW : new Color(0xFF, 0x44, 0x44);
    targetNode.addChild(node);
    node.setPosition(0, 30);
    tween(node)
      .to(0.5, { position: new Vec3(0, 80, 0) }, { easing: 'quadOut' })
      .call(() => node.destroy())
      .start();
  }

  private showHealText(targetNode: Node, value: number) {
    const node = new Node('healText');
    const label = node.addComponent(Label);
    label.string = `+${value}`;
    label.fontSize = 22;
    label.color = new Color(144, 238, 144);
    targetNode.addChild(node);
    node.setPosition(0, 30);
    tween(node)
      .to(0.5, { position: new Vec3(0, 80, 0) }, { easing: 'quadOut' })
      .call(() => node.destroy())
      .start();
  }

  updateUI() {
    // 更新所有单位的 HP
    for (const unit of this.battleMgr.allUnits) {
      const data = this.unitNodes.get(unit.id);
      if (!data) continue;

      data.root.active = unit.isAlive;
      data.hpLabel.string = unit.hpText;

      // 更新 HP 条
      const pct = unit.hpPercent;
      const fillWidth = Math.max(1, 90 * pct);
      const hpColor = pct <= 0.3 ? COLORS.hpDanger
        : pct <= 0.5 ? COLORS.hpAmber
        : COLORS.hpGreen;

      data.hpFill.clear();
      data.hpFill.fillColor = hpColor;
      data.hpFill.rect(-45, -3, fillWidth, 6);
      data.hpFill.fill();

      data.hpLabel.color = hpColor;
    }

    // 轮数
    if (this.roundLabel) {
      this.roundLabel.string = `第 ${this.battleMgr.round} 轮`;
      this.roundLabel.color = COLORS.hpAmber;
      this.roundLabel.fontSize = 20;
    }

    // 状态
    if (this.statusLabel) {
      switch (this.battleMgr.phase) {
        case 'player_turn':
          this.statusLabel.fontSize = 20;
          this.statusLabel.color = COLORS.playerText;
          this.statusLabel.string = this.battleMgr.pendingActionUnit
            ? `${this.battleMgr.pendingActionUnit.name} - 选目标`
            : '战斗中...';
          break;
        case 'enemy_turn':
          this.statusLabel.fontSize = 20;
          this.statusLabel.color = COLORS.playerText;
          this.statusLabel.string = '敌人行动中...';
          break;
        case 'victory':
          this.statusLabel.fontSize = 36;
          this.statusLabel.color = COLORS.hpAmber;
          this.statusLabel.string = '凯旋';
          break;
        case 'defeat':
          this.statusLabel.fontSize = 36;
          this.statusLabel.color = new Color(0x8B, 0x00, 0x00);
          this.statusLabel.string = '全军覆没';
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

    // 当前行动指示
    this.updateTurnIndicator();
  }

  private updateTurnIndicator() {
    // 清除旧指示
    for (const [, data] of this.unitNodes) {
      const old = data.root.getChildByName('turnIndicator');
      if (old) {
        old.removeFromParent();
        old.destroy();
      }
    }

    const currentUnit = this.battleMgr.currentActingUnit;
    if (!currentUnit) return;

    const data = this.unitNodes.get(currentUnit.id);
    if (!data || !data.root.active) return;

    const indicator = new Node('turnIndicator');
    const gfx = indicator.addComponent(Graphics);
    gfx.fillColor = currentUnit.isPlayer ? COLORS.hpAmber : COLORS.enemyText;
    gfx.rect(-40, -2, 80, 4);
    gfx.fill();
    indicator.setPosition(0, -50);
    data.root.addChild(indicator);

    tween(indicator)
      .to(0.5, { scale: new Vec3(1.1, 1, 1) })
      .to(0.5, { scale: Vec3.ONE })
      .repeatForever()
      .start();
  }
}
