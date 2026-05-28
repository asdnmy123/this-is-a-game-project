import { _decorator, Component, Node, Label, Color, UITransform, Vec3, tween, Tween, Graphics, Canvas } from 'cc';
import { BattleManager, BattleAction } from './BattleManager';
import { BattleUnit } from './BattleUnit';
import { CHARS, ENEMIES } from './Config';
const { ccclass } = _decorator;

/** 古风配色 */
const C = {
  bg: new Color(0x1A, 0x14, 0x10),
  cardBg: new Color(0x2A, 0x1F, 0x1A, 204),
  playerText: new Color(0xE8, 0xD5, 0xB7),
  enemyText: new Color(0xC8, 0x4C, 0x4C),
  hpGreen: new Color(0x6B, 0xAF, 0x6B),
  hpAmber: new Color(0xD4, 0xA7, 0x6A),
  hpRed: new Color(0xC8, 0x4C, 0x4C),
  logText: new Color(0x8B, 0x7D, 0x6B),
  damageText: new Color(0xFF, 0x44, 0x44),
  healText: new Color(0x90, 0xEE, 0x90),
  xuanjia: new Color(0x8B, 0x45, 0x13),
  fangshi: new Color(0x4A, 0x6F, 0xA5),
  jinghong: new Color(0xB8, 0x86, 0x0B),
  suwen: new Color(0x6B, 0x8E, 0x6B),
  victory: new Color(0xD4, 0xA7, 0x6A),
  defeat: new Color(0x8B, 0x00, 0x00),
  hpBarBg: new Color(0x3A, 0x2A, 0x1A),
  enemyBg: new Color(0x3C, 0x2A, 0x1E, 100),
  enemyBorder: new Color(0x8B, 0x73, 0x55, 80),
};

const CLASS_ICONS: Record<string, string> = {
  xuanjia: '【甲】', fangshi: '【法】',
  jinghong: '【弓】', suwen: '【医】',
};

interface UnitNodeData {
  root: Node; iconLabel: Label; nameLabel: Label;
  hpFill: Graphics; hpLabel: Label;
}

const WIN_SIZE = { w: 720, h: 1280 };

@ccclass('BattleScene')
export class BattleScene extends Component {
  private battleMgr!: BattleManager;
  private unitNodes = new Map<string, UnitNodeData>();
  private playerArea!: Node;
  private enemyArea!: Node;
  private logLabel!: Label;
  private statusLabel!: Label;
  private roundLabel!: Label;

  start() {
    this.buildUI();
    this.initBattle();
  }

  /** 全自动搭建 UI —— 不需要编辑器拖节点 */
  private buildUI() {
    // Canvas
    let canvas = this.getComponent(Canvas);
    if (!canvas) canvas = this.addComponent(Canvas);

    // 背景色
    const bg = new Node('bg');
    const bgGfx = bg.addComponent(Graphics);
    bgGfx.fillColor = C.bg;
    bgGfx.rect(-WIN_SIZE.w / 2, -WIN_SIZE.h / 2, WIN_SIZE.w, WIN_SIZE.h);
    bgGfx.fill();
    this.node.addChild(bg);

    // 标题
    const titleNode = new Node('title');
    const titleLbl = titleNode.addComponent(Label);
    titleLbl.string = '八 方 游 侠';
    titleLbl.fontSize = 28;
    titleLbl.color = C.playerText;
    titleLbl.lineHeight = 36;
    titleNode.setPosition(0, 560);
    this.node.addChild(titleNode);

    // 轮数
    const roundNode = new Node('roundLabel');
    this.roundLabel = roundNode.addComponent(Label);
    this.roundLabel.fontSize = 18;
    this.roundLabel.color = C.hpAmber;
    roundNode.setPosition(0, 520);
    this.node.addChild(roundNode);

    // 敌人区域（顶部）
    this.enemyArea = new Node('enemyArea');
    this.enemyArea.setPosition(0, 400);
    this.node.addChild(this.enemyArea);

    // 状态文字
    const statusNode = new Node('statusLabel');
    this.statusLabel = statusNode.addComponent(Label);
    this.statusLabel.fontSize = 20;
    this.statusLabel.color = C.playerText;
    this.statusLabel.lineHeight = 30;
    statusNode.setPosition(0, 280);
    this.node.addChild(statusNode);

    // 分隔线
    const line = new Node('divider');
    const lineGfx = line.addComponent(Graphics);
    lineGfx.fillColor = new Color(0x8B, 0x73, 0x55, 100);
    lineGfx.rect(-200, 0, 400, 1);
    lineGfx.fill();
    line.setPosition(0, 230);
    this.node.addChild(line);

    // 玩家区域（底部）
    this.playerArea = new Node('playerArea');
    this.playerArea.setPosition(0, 100);
    this.node.addChild(this.playerArea);

    // 日志区域（左下角）
    const logNode = new Node('logArea');
    this.logLabel = logNode.addComponent(Label);
    this.logLabel.fontSize = 13;
    this.logLabel.color = C.logText;
    this.logLabel.lineHeight = 18;
    this.logLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.logLabel.verticalAlign = Label.VerticalAlign.BOTTOM;
    logNode.setPosition(-340, -580);

    const logBg = new Node('logBg');
    const logBgGfx = logBg.addComponent(Graphics);
    logBgGfx.fillColor = C.cardBg;
    logBgGfx.rect(-10, -10, 230, 220);
    logBgGfx.fill();
    logBg.setPosition(0, 0);
    logNode.addChild(logBg);

    const uiTransform = logNode.getComponent(UITransform)!;
    uiTransform.setContentSize(220, 220);
    this.node.addChild(logNode);

    // 操作提示（底部中央）
    const hint = new Node('hint');
    const hintLbl = hint.addComponent(Label);
    hintLbl.string = '点击敌人选择攻击目标';
    hintLbl.fontSize = 14;
    hintLbl.color = new Color(0x8B, 0x7D, 0x6B, 150);
    hint.setPosition(0, -560);
    this.node.addChild(hint);
  }

  private initBattle() {
    const p1 = new BattleUnit(CHARS.xuanjia, true, 0);
    const p2 = new BattleUnit(CHARS.fangshi, true, 1);
    const p3 = new BattleUnit(CHARS.jinghong, true, 2);
    const e1 = new BattleUnit(ENEMIES.bandit, false, 0);
    const e2 = new BattleUnit(ENEMIES.bandit, false, 1);
    const e3 = new BattleUnit(ENEMIES.bandit_leader, false, 2);

    this.battleMgr = new BattleManager([p1, p2, p3], [e1, e2, e3]);
    this.battleMgr.onUpdate = () => this.onBattleUpdate();
    this.battleMgr.onAction = (a) => this.onBattleAction(a);
    this.renderUnits();
    this.battleMgr.start();
    this.updateUI();
  }

  private renderUnits() {
    this.playerArea.removeAllChildren();
    this.enemyArea.removeAllChildren();
    this.unitNodes.clear();

    const render = (units: BattleUnit[], parent: Node) => {
      const spacing = 140;
      const startX = -((units.length - 1) * spacing) / 2;
      units.forEach((u, i) => {
        const n = this.createUnitNode(u);
        n.setPosition(startX + i * spacing, 0);
        parent.addChild(n);
      });
    };

    render(this.battleMgr.players, this.playerArea);
    render(this.battleMgr.enemies, this.enemyArea);
  }

  private createUnitNode(unit: BattleUnit): Node {
    const node = new Node(unit.name);

    // 敌人背景
    if (!unit.isPlayer) {
      const bg = nd('enemyBg');
      const g = bg.addComponent(Graphics);
      g.fillColor = C.enemyBg; g.rect(-55, -45, 110, 95); g.fill();
      node.addChild(bg);
      const br = nd('enemyBorder');
      const g2 = br.addComponent(Graphics);
      g2.fillColor = C.enemyBorder; g2.rect(-57, -47, 114, 99); g2.fill();
      node.addChild(br);
    }

    // 职业图标
    const icon = nd('icon');
    const il = icon.addComponent(Label);
    il.string = CLASS_ICONS[unit.classType] || '【?】';
    il.fontSize = 36;
    icon.setPosition(0, 30);
    const cc = (C as any)[unit.classType];
    il.color = unit.isPlayer ? (cc || C.playerText) : C.enemyText;

    // 名字
    const name = nd('name');
    const nl = name.addComponent(Label);
    nl.string = unit.name;
    nl.fontSize = 16;
    nl.color = unit.isPlayer ? C.playerText : C.enemyText;

    // HP 文字
    const hpL = nd('hpLabel');
    const hl = hpL.addComponent(Label);
    hl.fontSize = 13;
    hl.color = C.hpGreen;
    hl.string = unit.hpText;
    hpL.setPosition(0, -20);

    // HP 条背景
    const hpBg = nd('hpBg');
    const hb = hpBg.addComponent(Graphics);
    hb.fillColor = C.hpBarBg;
    hb.rect(-42, -3, 84, 5); hb.fill();
    hpBg.setPosition(0, -32);

    // HP 条填充
    const hpFill = nd('hpFill');
    const hf = hpFill.addComponent(Graphics);
    hf.fillColor = C.hpGreen;
    hf.rect(-42, -3, 84, 5); hf.fill();
    hpFill.setPosition(0, -32);

    node.addChild(icon); node.addChild(name);
    node.addChild(hpL); node.addChild(hpBg); node.addChild(hpFill);

    // 敌人点击
    if (!unit.isPlayer) {
      const click = nd('click');
      const ut = click.addComponent(UITransform);
      ut.setContentSize(120, 100);
      click.on(Node.EventType.TOUCH_END, () => {
        if (this.battleMgr.pendingActionUnit && unit.isAlive) {
          this.battleMgr.playerAttack(unit.id);
        }
      });
      node.addChild(click);
    }

    this.unitNodes.set(unit.id, { root: node, iconLabel: il, nameLabel: nl, hpFill: hf, hpLabel: hl });
    return node;

    function nd(name: string) { const n = new Node(name); return n; }
  }

  private onBattleUpdate() { this.updateUI(); }

  private onBattleAction(action: BattleAction) {
    this.flashUnit(action.unitId);
    if (action.targetId) {
      this.flashUnit(action.targetId);
      const td = this.unitNodes.get(action.targetId);
      if (td) {
        if (action.damage !== undefined) this.popText(td.root, action.damage, action.isCrit, false);
        else if (action.healAmount !== undefined) this.popText(td.root, action.healAmount, false, true);
      }
    }
  }

  private flashUnit(id: string) {
    const d = this.unitNodes.get(id); if (!d) return;
    const orig = d.iconLabel.color.clone();
    Tween.stopAllByTarget(d.iconLabel);
    tween(d.iconLabel).to(0.1, { color: Color.YELLOW }).to(0.1, { color: orig }).start();
  }

  private popText(target: Node, value: number, isCrit: boolean, isHeal: boolean) {
    const n = new Node('pop');
    const l = n.addComponent(Label);
    if (isHeal) { l.string = `+${value}`; l.fontSize = 22; l.color = C.healText; }
    else if (isCrit) { l.string = `暴击! ${value}`; l.fontSize = 28; l.color = Color.YELLOW; }
    else { l.string = `-${value}`; l.fontSize = 22; l.color = C.damageText; }
    target.addChild(n);
    n.setPosition(0, 30);
    tween(n).to(0.6, { position: new Vec3(0, 90, 0) }).call(() => n.destroy()).start();
  }

  private updateUI() {
    for (const unit of this.battleMgr.allUnits) {
      const d = this.unitNodes.get(unit.id); if (!d) continue;
      d.root.active = unit.isAlive;
      d.hpLabel.string = unit.hpText;
      const pct = unit.hpPercent;
      const fw = Math.max(1, 84 * pct);
      const hc = pct <= 0.3 ? C.hpRed : pct <= 0.5 ? C.hpAmber : C.hpGreen;
      d.hpFill.clear(); d.hpFill.fillColor = hc; d.hpFill.rect(-42, -3, fw, 5); d.hpFill.fill();
      d.hpLabel.color = hc;
    }

    this.roundLabel.string = `第 ${this.battleMgr.round} 轮`;

    switch (this.battleMgr.phase) {
      case 'player_turn':
        this.statusLabel.fontSize = 20; this.statusLabel.color = C.playerText;
        this.statusLabel.string = this.battleMgr.pendingActionUnit
          ? `${this.battleMgr.pendingActionUnit.name} · 点击敌人攻击` : '战斗中...';
        break;
      case 'enemy_turn':
        this.statusLabel.fontSize = 20; this.statusLabel.color = C.playerText;
        this.statusLabel.string = '敌人行动中...';
        break;
      case 'victory':
        this.statusLabel.fontSize = 42; this.statusLabel.color = C.victory;
        this.statusLabel.string = '凯  旋';
        break;
      case 'defeat':
        this.statusLabel.fontSize = 42; this.statusLabel.color = C.defeat;
        this.statusLabel.string = '全军覆没';
        break;
    }

    this.logLabel.string = this.battleMgr.log.slice(-8).join('\n');
    this.updateTurnIndicator();
  }

  private updateTurnIndicator() {
    for (const [, d] of this.unitNodes) {
      const old = d.root.getChildByName('indicator');
      if (old) { old.removeFromParent(); old.destroy(); }
    }
    const cu = this.battleMgr.currentActingUnit;
    if (!cu) return;
    const d = this.unitNodes.get(cu.id);
    if (!d || !d.root.active) return;
    const ind = new Node('indicator');
    const g = ind.addComponent(Graphics);
    g.fillColor = C.hpAmber;
    g.rect(-35, -1, 70, 3); g.fill();
    ind.setPosition(0, -48);
    d.root.addChild(ind);
    tween(ind).to(0.5, { scale: new Vec3(1.15, 1, 1) }).to(0.5, { scale: Vec3.ONE }).repeatForever().start();
  }
}
