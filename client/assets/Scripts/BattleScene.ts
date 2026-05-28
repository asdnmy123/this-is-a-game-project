import { _decorator, Component, Node, Label, Color, UITransform, Vec3, tween, Tween, Graphics } from 'cc';
import { BattleManager, BattleAction } from './BattleManager';
import { BattleUnit } from './BattleUnit';
import { CHARS, ENEMIES } from './Config';
const { ccclass } = _decorator;

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
};

const CLASS_ICONS: Record<string, string> = {
  xuanjia: '【甲】', fangshi: '【法】',
  jinghong: '【弓】', suwen: '【医】',
};

interface UnitNodeData {
  root: Node; iconLabel: Label; nameLabel: Label;
  hpFill: Graphics; hpLabel: Label;
}

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
    const bg = new Node('bg');
    const bgGfx = bg.addComponent(Graphics);
    bgGfx.fillColor = C.bg;
    bgGfx.rect(-360, -640, 720, 1280);
    bgGfx.fill();
    this.node.addChild(bg);

    const titleNode = new Node('title');
    const t = titleNode.addComponent(Label);
    t.string = '八 方 游 侠'; t.fontSize = 26;
    t.color = C.playerText;
    titleNode.setPosition(0, 300);
    this.node.addChild(titleNode);

    const rn = new Node('round');
    this.roundLabel = rn.addComponent(Label);
    this.roundLabel.fontSize = 16; this.roundLabel.color = C.hpAmber;
    rn.setPosition(0, 270);
    this.node.addChild(rn);

    this.enemyArea = new Node('enemyArea');
    this.enemyArea.setPosition(0, 160);
    this.node.addChild(this.enemyArea);

    const sn = new Node('status');
    this.statusLabel = sn.addComponent(Label);
    this.statusLabel.fontSize = 18; this.statusLabel.color = C.playerText;
    sn.setPosition(0, 40);
    this.node.addChild(sn);

    this.playerArea = new Node('playerArea');
    this.playerArea.setPosition(0, -120);
    this.node.addChild(this.playerArea);

    const ln = new Node('log');
    this.logLabel = ln.addComponent(Label);
    this.logLabel.fontSize = 12; this.logLabel.color = C.logText;
    this.logLabel.lineHeight = 16;
    this.logLabel.horizontalAlign = Label.HorizontalAlign.LEFT;
    this.logLabel.verticalAlign = Label.VerticalAlign.BOTTOM;
    ln.setPosition(-340, -300);
    this.node.addChild(ln);

    const hn = new Node('hint');
    const hl = hn.addComponent(Label);
    hl.string = '点击敌人选择攻击目标';
    hl.fontSize = 14; hl.color = new Color(0x8B, 0x7D, 0x6B, 150);
    hn.setPosition(0, -300);
    this.node.addChild(hn);

    this.initBattle();
  }

  private initBattle() {
    const p1 = new BattleUnit(CHARS.xuanjia, true, 0);
    const p2 = new BattleUnit(CHARS.fangshi, true, 1);
    const p3 = new BattleUnit(CHARS.jinghong, true, 2);
    const e1 = new BattleUnit(ENEMIES.bandit, false, 0);
    const e2 = new BattleUnit(ENEMIES.bandit, false, 1);
    const e3 = new BattleUnit(ENEMIES.bandit_leader, false, 2);

    this.battleMgr = new BattleManager([p1, p2, p3], [e1, e2, e3]);
    this.battleMgr.onUpdate = () => this.updateUI();
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
      const spacing = 120;
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

    if (!unit.isPlayer) {
      const bgN = new Node('enemyBg');
      const g = bgN.addComponent(Graphics);
      g.fillColor = new Color(0x3C, 0x2A, 0x1E, 100);
      g.rect(-50, -42, 100, 85); g.fill();
      node.addChild(bgN);
    }

    const iN = new Node('icon');
    const iL = iN.addComponent(Label);
    iL.string = CLASS_ICONS[unit.classType] || '【?】';
    iL.fontSize = 28;
    iN.setPosition(0, 25);
    iL.color = unit.isPlayer ? C.playerText : C.enemyText;

    const nN = new Node('name');
    const nL = nN.addComponent(Label);
    nL.string = unit.name;
    nL.fontSize = 13;
    nL.color = unit.isPlayer ? C.playerText : C.enemyText;

    const hN = new Node('hpLabel');
    const hL = hN.addComponent(Label);
    hL.fontSize = 11; hL.color = C.hpGreen;
    hL.string = unit.hpText;
    hN.setPosition(0, -20);

    const hBg = new Node('hpBg');
    const hb = hBg.addComponent(Graphics);
    hb.fillColor = C.hpBarBg;
    hb.rect(-35, -2, 70, 4); hb.fill();
    hBg.setPosition(0, -30);

    const hFill = new Node('hpFill');
    const hf = hFill.addComponent(Graphics);
    hf.fillColor = C.hpGreen;
    hf.rect(-35, -2, 70, 4); hf.fill();
    hFill.setPosition(0, -30);

    node.addChild(iN); node.addChild(nN);
    node.addChild(hN); node.addChild(hBg); node.addChild(hFill);

    if (!unit.isPlayer) {
      const cN = new Node('click');
      const ut = cN.addComponent(UITransform);
      ut.setContentSize(100, 85);
      cN.on(Node.EventType.TOUCH_END, () => {
        if (this.battleMgr.pendingActionUnit && unit.isAlive) {
          this.battleMgr.playerAttack(unit.id);
        }
      });
      node.addChild(cN);
    }

    this.unitNodes.set(unit.id, { root: node, iconLabel: iL, nameLabel: nL, hpFill: hf, hpLabel: hL });
    return node;
  }

  private onBattleAction(action: BattleAction) {
    if (action.targetId) {
      const td = this.unitNodes.get(action.targetId);
      if (td) {
        if (action.damage !== undefined) this.popText(td.root, action.damage, action.isCrit, false);
        else if (action.healAmount !== undefined) this.popText(td.root, action.healAmount, false, true);
      }
    }
  }

  private popText(target: Node, value: number, isCrit: boolean, isHeal: boolean) {
    const n = new Node('pop');
    const l = n.addComponent(Label);
    if (isHeal) { l.string = `+${value}`; l.fontSize = 20; l.color = C.healText; }
    else if (isCrit) { l.string = `暴击!${value}`; l.fontSize = 26; l.color = Color.YELLOW; }
    else { l.string = `-${value}`; l.fontSize = 20; l.color = C.damageText; }
    target.addChild(n);
    n.setPosition(0, 30);
    tween(n).to(0.5, { position: new Vec3(0, 80, 0) }).call(() => n.destroy()).start();
  }

  private updateUI() {
    for (const unit of this.battleMgr.allUnits) {
      const d = this.unitNodes.get(unit.id);
      if (!d) continue;
      d.root.active = unit.isAlive;
      d.hpLabel.string = unit.hpText;
      const pct = unit.hpPercent;
      const fw = Math.max(1, 70 * pct);
      const hc = pct <= 0.3 ? C.hpRed : pct <= 0.5 ? C.hpAmber : C.hpGreen;
      d.hpFill.clear(); d.hpFill.fillColor = hc; d.hpFill.rect(-35, -2, fw, 4); d.hpFill.fill();
      d.hpLabel.color = hc;
    }
    this.roundLabel.string = `第 ${this.battleMgr.round} 轮`;

    switch (this.battleMgr.phase) {
      case 'player_turn':
        this.statusLabel.fontSize = 18; this.statusLabel.color = C.playerText;
        this.statusLabel.string = this.battleMgr.pendingActionUnit
          ? `${this.battleMgr.pendingActionUnit.name} → 点敌人攻击` : '';
        break;
      case 'enemy_turn':
        this.statusLabel.string = '敌人行动中...'; break;
      case 'victory':
        this.statusLabel.fontSize = 36; this.statusLabel.color = C.victory;
        this.statusLabel.string = '凯  旋'; break;
      case 'defeat':
        this.statusLabel.fontSize = 36; this.statusLabel.color = C.defeat;
        this.statusLabel.string = '全军覆没'; break;
    }
    this.logLabel.string = this.battleMgr.log.slice(-8).join('\n');
  }
}
