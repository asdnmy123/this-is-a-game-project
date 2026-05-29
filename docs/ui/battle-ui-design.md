# 战斗界面 UI 美化设计方案

日期：2026-05-28
状态：draft

---

## 一、设计目标

1. **匹配设计文档第五节"战斗画面布局"** — 四分区布局：敌人面板在上，我方面板在中下，行动日志在下方，操作栏在最底
2. **极简字符风格** — 只靠 Unicode 字符、颜色、纯色矩形做视觉效果，不使用外部图片
3. **古风统一调性** — 深棕背景 + 暖色文字，保持武侠氛围
4. **职业可识别性** — 每个职业有专属颜色和标记，瞄一眼就知道谁是谁
5. **信息优先级明确** — 当前行动高亮 > 单位状态 > 日志 > 操作按钮

---

## 二、节点结构树

完整的节点层级关系，从 `BattleScene.node` 往下：

```
BattleScene (this.node)
│
├── bg                            (Graphics)      — 全屏背景 #1A1410
│
├── headerArea                    (Node)          — 顶部信息栏
│   ├── roundLabel                (Label)         — "第 3 / 20 轮"
│   ├── enemyCountLabel           (Label)         — "敌方: 4/6 存活"
│   └── headerDivider             (Graphics)      — 分割线
│
├── enemyPanel                    (Node)          — 敌方面板容器
│   ├── enemyPanelTitle           (Label)         — "── 敌  方 ──"
│   ├── enemyCards                (Node)          — 敌人卡片容器
│   │   ├── enemyCard_0           (Node)          — 第 0 号敌人卡片
│   │   │   ├── cardBg            (Graphics)      — 卡片背景
│   │   │   ├── highlightBorder   (Graphics)      — 行动中高亮边框（默认隐藏）
│   │   │   ├── iconLabel         (Label)         — "◈"
│   │   │   ├── nameLabel         (Label)         — "山贼头目"
│   │   │   ├── levelLabel        (Label)         — "Lv.12"（可选，从配置读）
│   │   │   ├── targetMarker      (Label)         — "[集火]"（可选标记）
│   │   │   ├── hpBarBg           (Graphics)      — HP 条背景
│   │   │   ├── hpBarFill         (Graphics)      — HP 条填充
│   │   │   └── hpLabel           (Label)         — "3420/4500"
│   │   ├── enemyCard_1           (Node)          — 同上的敌人卡片
│   │   └── enemyCard_...         (Node)
│   └── collapsedRow              (Node)          — 喽啰折叠行（>3 小怪时显示）
│       ├── collapsedIcon         (Label)         — "喽啰 ×4"
│       ├── collapsedHpBarBg      (Graphics)
│       ├── collapsedHpBarFill    (Graphics)
│       └── collapsedHpLabel      (Label)         — "6400/12800"
│
├── playerPanel                    (Node)          — 我方面板容器
│   ├── playerPanelTitle          (Label)         — "── 我  方 ──"
│   ├── playerCards               (Node)          — 玩家卡片容器
│   │   ├── playerCard_0          (Node)          — 第 0 号玩家卡片
│   │   │   ├── cardBg            (Graphics)      — 卡片背景
│   │   │   ├── highlightBorder   (Graphics)      — 行动中高亮边框
│   │   │   ├── classIcon         (Label)         — "【甲】" 职业标记
│   │   │   ├── nameLabel         (Label)         — "卫岳"
│   │   │   ├── levelLabel        (Label)         — "Lv.12"
│   │   │   ├── buffIcons         (Label)         — "[盾][增强]"（Buff 标记）
│   │   │   ├── hpBarBg           (Graphics)
│   │   │   ├── hpBarFill         (Graphics)
│   │   │   └── hpLabel           (Label)         — "1200/1500"
│   │   ├── playerCard_1          (Node)
│   │   └── playerCard_2          (Node)
│   └── panelDivider              (Graphics)
│
├── actionOrderBar                 (Node)          — 出手顺序条
│   ├── orderLabel                (Label)         — "出手│▶苏玄│头目│白芷│喽啰│卫岳│"
│   └── orderDivider              (Graphics)      — 分割线
│
├── logPanel                       (Node)          — 行动日志面板
│   ├── logTitle                  (Label)         — "── 战  况 ──"
│   ├── logScroll                 (Node)          — 日志滚动容器
│   │   ├── logLine0              (Label)         — ">>> 苏玄 使用「火球术」→ 山贼喽啰"
│   │   ├── logLine1              (Label)         — "      造成 342 伤害"
│   │   └── logLine2              (Label)         — "      山贼喽啰灼烧 2 轮"
│   └── logDivider                (Graphics)
│
├── actionBar                      (Node)          — 操作栏
│   ├── skillBtn1                 (Node)          — 技能按钮 1
│   │   └── label                 (Label)         — "[1] 火球术"
│   ├── skillBtn2                 (Node)          — 技能按钮 2
│   │   └── label                 (Label)         — "[2] 冰冻术"
│   ├── attackBtn                 (Node)          — 普攻按钮
│   │   └── label                 (Label)         — "[3] 普攻"
│   ├── defendBtn                 (Node)          — 防御按钮
│   │   └── label                 (Label)         — "[4] 防御"
│   ├── itemBtn                   (Node)          — 道具按钮
│   │   └── label                 (Label)         — "[5] 道具"
│   └── autoBtn                   (Node)          — 自动按钮
│       └── label                 (Label)         — "[自动]"
│
└── floatingTextPool              (Node)          — 浮动文字容器（伤害/治疗弹出）
    └── (动态生成的 Label 节点，Tween 动画后销毁)
```

### 关键设计说明

- **卡片容器**（enemyCards / playerCards）作为中间层，方便整体控制卡片排列（水平居中、间距）
- **高亮边框** 每个卡片都带，默认隐藏，当前行动单元时显示
- **折叠行** 在 enemyCards 同级，不是一个"节点"，出现时隐藏被折叠的卡片
- **日志滚动容器** 用多个 Label 而不是一个多行 Label，方便逐行动画（新日志淡入）
- **浮动文字节点** 动态创建，播放完 Tween 后自动销毁

---

## 三、颜色方案

全部使用十六进制值，标注用途和对应 CSS/设计参考名。

### 3.1 基础色调

| 颜色值 | 用途 | 说明 |
|--------|------|------|
| `#1A1410` | 主背景色 | 深棕，像旧纸或木纹底色 |
| `#2A1F1A` | 卡片背景（玩家） | 半透明，alpha=0.8 |
| `#3C2A1E` | 卡片背景（敌人） | 比玩家略暗，区分敌我 |
| `#4A3828` | 分割线/边框 | 中等棕色线条 |
| `#1A1410CC` | 面板区域背景 | 通透的底色叠加 |

### 3.2 文字色

| 颜色值 | 用途 | 说明 |
|--------|------|------|
| `#E8D5B7` | 主要文字 | 暖白/羊皮纸色，阅读舒适 |
| `#C8C0B0` | 辅助文字 | 略暗的次要信息（等级、标签） |
| `#8B7D6B` | 日志文字/提示 | 低饱和棕色，不抢眼 |
| `#6B5D4B` | 禁用/不可操作 | 灰棕色，灰显状态 |

### 3.3 HP 条

| 颜色值 | 触发条件 | 说明 |
|--------|---------|------|
| `#6BAF6B` | HP > 50% | 翠竹绿，安全 |
| `#D4A76A` | 30% < HP <= 50% | 琥珀色，警戒 |
| `#C84C4C` | HP <= 30% | 血色，危险 |
| `#3A2A1A` | HP 条背景 | 深槽色，衬托填充色 |

### 3.4 职业色（Badge/标记专用）

| 颜色值 | 职业 | 设计理由 |
|--------|------|---------|
| `#8B4513` | 玄甲（坦克） | 铁锈棕，厚重/防御感 |
| `#4A6FA5` | 方士（法师） | 石板蓝，冷静/法术感 |
| `#B8860B` | 惊鸿（弓手） | 暗金黄，锐利/爆发感 |
| `#6B8E6B` | 素问（奶妈） | 鼠尾绿，温和/治疗感 |

职业色用在三个地方：
- 玩家卡片的 `【职业】` 标记文字颜色
- 卡片左边框（一小竖条，纯色 Graphic 矩形）
- 出手顺序条中的角色名颜色

### 3.5 反馈特效色

| 颜色值 | 用途 | 说明 |
|--------|------|------|
| `#FF4444` | 伤害数字 | 亮红，直观"掉血" |
| `#90EE90` | 治疗数字 | 亮绿，直观"回血" |
| `#FFD700` | 暴击标记/数字 | 金色，醒目 |
| `#D4A76A` | 胜利横幅 | 琥珀金 |
| `#8B0000` | 失败横幅 | 暗红 |
| `#D4A76A` | 当前行动高亮边框 | 琥珀色描边 |

### 3.6 按钮状态色

| 颜色值 | 状态 | 说明 |
|--------|------|------|
| `#E8D5B7` | 可用按钮文字 | 同主文字色 |
| `#6B5D4B` | 禁用按钮文字 | 灰显 |
| `#FFD700` | 按钮点击反馈 | 闪烁一瞬间金色 |

---

## 四、布局坐标

基准：Cocos Creator 坐标系，设计分辨率 720×1280（竖屏手机）。

屏幕范围：
- 安全区：x [-340, 340], y [-580, 580]
- 内容区：x [-330, 330], y [-560, 560]

### 4.1 纵向总布局

```
y = 560                 ← 顶部安全区边界
─────────────────────────────────
y = 530  第 3 / 20 轮    敌方: 4/6 存活     ← 顶栏
y = 510  ─────────────────────────────────  ← 分割线
y = 490  ── 敌  方 ──                       ← 敌方标题
y = 460 ~ 240  敌人卡片（根据数量自适应）    ← 敌方面板
y = 230  ─────────────────────────────────  ← 分割线
y = 210  ── 我  方 ──                       ← 我方标题
y = 180 ~ 80  玩家卡片                       ← 我方面板
y = 70   出手│卫岳│苏玄│头目│喽啰│白芷│    ← 出手顺序条
y = 40   ─────────────────────────────────  ← 分割线
y = 20   ── 战  况 ──                       ← 日志标题
y = -5 ~ -200  日志内容区（3-4 行）         ← 日志面板
y = -220 ─────────────────────────────────  ← 分割线
y = -250 ~ -350  操作栏（两行按钮）         ← 操作栏
y = -400                                   ← 底部填充区
─────────────────────────────────
y = -560                ← 底部安全区边界
```

### 4.2 各区域精确坐标

#### 顶栏 (headerArea)
```
roundLabel
  position: (-160, 530)
  fontSize: 15
  horizontalAlign: LEFT
  string: "第 3 / 20 轮"

enemyCountLabel
  position: (330, 530)
  fontSize: 15
  horizontalAlign: RIGHT
  string: "敌方: 4/6 存活"

headerDivider
  line: (-330, 510) to (330, 510)
  lineWidth: 1
  strokeColor: #4A3828
```

#### 敌方标题
```
enemyPanelTitle
  position: (0, 490)
  fontSize: 14
  string: "── 敌  方 ──"
```

#### 敌方卡片区域 (enemyCards)
```
敌人卡片容器: enemyCards
  position: (0, 350)  — 垂直居中在 240~460 之间
  
  每张敌人卡片尺寸: 150w × 72h
  
  3 个敌人时: 水平间隔 110px
    card_0: (-110, 0)
    card_1: (0, 0)
    card_2: (110, 0)
  
  4-6 个敌人时（带折叠）:
    头目单独一行: (0, 40)
    精英单独一行: (0, -20)
    折叠行: (0, -80)
      "喽啰 ×N  总血量 ████████░░  6400/12800"
```

#### 分割线 2
```
line: (-330, 230) to (330, 230)
```

#### 我方标题
```
playerPanelTitle
  position: (0, 210)
  fontSize: 14
  string: "── 我  方 ──"
```

#### 我方卡片区域 (playerCards)
```
玩家卡片容器: playerCards
  position: (0, 130)  — 垂直居中在 80~180 之间
  
  每张玩家卡片尺寸: 160w × 65h
  
  3 个玩家，水平间隔 130px:
    card_0: (-130, 0)   — 玄甲
    card_1: (0, 0)       — 方士/惊鸿
    card_2: (130, 0)     — 素问
```

#### 出手顺序条 (actionOrderBar)
```
actionOrderBar
  position: (0, 70)
  
orderLabel
  position: (0, 0)
  fontSize: 12
  string: "出手│苏玄│头目│白芷│喽啰│卫岳│"
  说明: 当前出手的角色用 ▶ 标记前缀 + 高亮颜色
  格式: "出手│▶苏玄│头目│白芷│喽啰│卫岳│"
  
orderDivider
  line: (-330, 40) to (330, 40)
```

#### 日志面板 (logPanel)
```
logTitle
  position: (0, 20)
  fontSize: 12
  string: "── 战  况 ──"

logScroll
  position: (-310, -90)
  日志行从下往上排列，最新一行在最下面
  
  每行 Label 参数:
    fontSize: 12
    lineHeight: 18
    horizontalAlign: LEFT
    color: #8B7D6B
    
  行位置（从下到上，最新在最下）:
    line_lastest:  (0, -30)   — 最新
    line_prev:     (0, -50)   — 前一条
    line_oldest:   (0, -70)   — 最旧
  
  日志行示例:
    ">>> 苏玄 使用「火球术」→ 山贼喽啰"
    "      造成 342 伤害"
    "      山贼喽啰灼烧 2 轮"

logDivider
  line: (-330, -220) to (330, -220)
```

#### 操作栏 (actionBar)
```
actionBar
  position: (0, -300)  — 垂直居中在 -250~-350 之间

第 1 行按钮（技能）:
  水平居中排列，间距 90px
  btn1: (-135, 15) — "[1] 火球术"
  btn2: (-45, 15)  — "[2] 冰冻术"  
  btn3: (45, 15)   — "[3] 普攻"
  btn4: (135, 15)  — "[4] 防御"

第 2 行按钮（功能）:
  水平居中排列，间距 120px
  btn5: (-60, -15) — "[5] 道具"
  autoBtn: (60, -15) — "【自动】"（选中态）或 "[自动]"（未选中）

按钮参数:
  fontSize: 14
  padding: 4px 左右
  点击反馈: 文字闪烁（[文字] → 瞬间变黄再恢复）
  禁用态: 文字颜色变 #6B5D4B + 圆括号包围 "(火球术)"
```

### 4.3 卡片内部子节点坐标

#### 敌人卡片（宽 150，高 72）
```
cardBg (Graphics)
  rect: (-75, -36, 150, 72)
  fillColor: #3C2A1ECC

highlightBorder (Graphics)  — 默认隐藏
  rect: (-75, -36, 150, 72)
  strokeColor: #D4A76A
  lineWidth: 2

iconLabel (Label)
  position: (-60, 12)
  string: "◈"
  fontSize: 14
  color: #E8D5B7

nameLabel (Label)
  position: (-35, 12)
  string: "山贼头目"
  fontSize: 14
  horizontalAlign: LEFT
  color: #E8D5B7

levelLabel (Label)
  position: (65, 12)
  string: "Lv.12"
  fontSize: 11
  horizontalAlign: RIGHT
  color: #C8C0B0

targetMarker (Label)  — 可选，默认隐藏
  position: (50, -8)
  string: "【集火】"
  fontSize: 10
  color: #C84C4C

hpBarBg (Graphics)
  position: (0, -18)
  rect: (-60, -3, 120, 6)  — 宽 120px, 高 6px
  fillColor: #3A2A1A

hpBarFill (Graphics)
  position: (0, -18)
  rect: (-60, -3, 120 × hpPercent, 6)
  fillColor: 根据 hpPercent 变化

hpLabel (Label)
  position: (65, -18)
  string: "3420/4500"
  fontSize: 10
  horizontalAlign: RIGHT
  color: 同 HP 填充色
```

#### 玩家卡片（宽 160，高 65）

```
cardBg (Graphics)
  rect: (-80, -32, 160, 65)
  fillColor: #2A1F1ACC

highlightBorder (Graphics)  — 默认隐藏
  rect: (-80, -32, 160, 65)
  strokeColor: #D4A76A
  lineWidth: 2

classIcon (Label)
  position: (-68, 15)
  string: "【甲】"
  fontSize: 14
  color: 对应职业色（#8B4513）

nameLabel (Label)
  position: (-25, 15)
  string: "卫岳"
  fontSize: 14
  horizontalAlign: LEFT
  color: #E8D5B7

levelLabel (Label)
  position: (70, 15)
  string: "Lv.12"
  fontSize: 11
  horizontalAlign: RIGHT
  color: #C8C0B0

buffIcons (Label)
  position: (0, 0)
  string: "[盾][增强]"  — 有 buff 时显示
  fontSize: 10
  color: #D4A76A

hpBarBg (Graphics)
  position: (0, -18)
  rect: (-65, -3, 130, 6)
  fillColor: #3A2A1A

hpBarFill (Graphics)
  position: (0, -18)
  rect: (-65, -3, 130 × hpPercent, 6)
  fillColor: 根据 hpPercent 变化

hpLabel (Label)
  position: (70, -18)
  string: "1200/1500"
  fontSize: 10
  horizontalAlign: RIGHT
  color: 同 HP 填充色
```

---

## 五、组件类型清单

| 节点 | 组件 | 参数 |
|------|------|------|
| bg | Graphics | fillColor = #1A1410, rect(-360, -640, 720, 1280) |
| 1. | Graphics | fillColor = 分割线色, 水平线 rect |
| 2. | Label | fontSize, color, string — 最常用的文字组件 |
| 3. | UITransform | 挂到可点击的按钮节点上，setContentSize 设置点击区域 |
| 3b. | (Node event) | buttonNode.on(Node.EventType.TOUCH_END, callback) |
| 4. | Tween | 动画系统，用于浮动数字、闪烁反馈 |

不需要 Sprite 组件（无图片），不需要 RichText（纯 Label 足够）。

### 组件选择理由

- **Graphics 画矩形框**：比 Sprite + 纯色纹理更轻量，直接在代码中定义形状
- **Label 做按钮**：字符风格下按钮就是文字，通过 `[括号]` 和颜色变化表示状态
- **UITransform 做点击区域**：文字本身点击区域太小，用 UITransform 扩展点击热区
- **Tween 做动画**：Cocos Creator 内置 tween，足够做弹出/闪烁/移动

---

## 六、数据绑定

### 6.1 UI 节点 ↔ BattleManager 数据映射

| UI 节点 | 数据源 | 更新时机 | 更新方式 |
|---------|--------|---------|---------|
| roundLabel | `battleMgr.round` + `总轮数` | 每轮开始 | `string = `第 ${round} / 20 轮`` |
| enemyCountLabel | `battleMgr.enemies.filter(e=>e.isAlive).length` | 每次 unit 死亡 | `string = `敌方: ${alive}/${total} 存活`` |
| enemyCards | `battleMgr.enemies` | 战斗开始（init） | renderUnits() |
| playerCards | `battleMgr.players` | 战斗开始（init） | renderUnits() |
| 卡片.iconLabel | `unit.classType` → CLASS_ICONS map | 创建时 | `CLASS_ICONS[unit.classType]` (如 `【甲】`) |
| 卡片.nameLabel | `unit.name` | 创建时 | `unit.name` |
| 卡片.levelLabel | `unit.level` | 创建时/升级 | `Lv.${unit.level}` |
| 卡片.hpBarFill | `unit.hpPercent` | 每次受伤/治疗 | `rect(-w/2, -3, w*hpPercent, 6)` |
| 卡片.hpLabel | `unit.hpText` (hp/maxHp) | 每次受伤/治疗 | `unit.hpText` |
| 卡片.hpFill color | `unit.hpPercent` | 每次更新 | `<=0.3 ? red : <=0.5 ? amber : green` |
| 卡片.highlightBorder | `battleMgr.currentActingUnit?.id === unit.id` | currentActingUnit 变化 | `.active = true/false` |
| 卡片.cardBg color | `unit.isPlayer` | 创建时 | player=#2A1F1A, enemy=#3C2A1E |
| 卡片.classIcon color | `unit.classType` → CLASS_COLORS map | 创建时 | 职业对应色 |
| 卡片.active | `unit.isAlive` | 每次 unit 死亡 | `node.active = unit.isAlive` |
| orderLabel | `battleMgr.turnOrder` 数组 | 每轮开始 | 拼接字符串，当前行动高亮 |
| logLabel | `battleMgr.log` 末尾 N 条 | onAction 回调 | 更新最后 3-4 行 |
| 各按钮 | `battleMgr.pendingActionUnit?.skills` | pendingActionUnit 变化 | 根据技能列表渲染按钮 |
| 按钮状态 | `battleMgr.phase === 'player_turn'` | phase 变化 | 可用/禁用切换 |
| floatingText | BattleAction.damage/healAmount | onAction 回调 | 动态创建 Label + Tween |

### 6.2 关键回调

```
battleMgr.onUpdate → updateUI()
  - 更新所有 unit 卡片的 HP、高亮、存活状态
  - 更新轮次信息、敌人存活数
  - 更新出手顺序条
  - 更新阶段文字/按钮状态

battleMgr.onAction → onBattleAction(action)
  - 创建浮动伤害/治疗数字
  - 更新日志内容
  - 暴击时额外特效
```

### 6.3 职业标记映射表

```typescript
const CLASS_ICONS: Record<string, string> = {
  xuanjia:  '【甲】',    // 坦克 - 铁锈棕 #8B4513
  fangshi:  '【法】',    // 法师 - 石板蓝 #4A6FA5
  jinghong: '【弓】',    // 弓手 - 暗金黄 #B8860B
  suwen:    '【医】',    // 奶妈 - 鼠尾绿 #6B8E6B
};
```

敌人统一用 `◈` 符号（白/红色），不显示职业标记。

### 6.4 敌人折叠逻辑

```
// 在 updateUI() 中处理
const aliveEnemies = battleMgr.enemies.filter(e => e.isAlive);
const boss = aliveEnemies.find(e => e.config.isBoss);  // 如果有 Boss 标记
const elites = aliveEnemies.filter(e => e.config.isElite);
const minions = aliveEnemies.filter(e => !e.config.isBoss && !e.config.isElite);

// 折叠条件: minions.length >= 3
if (minions.length >= 3) {
  // 隐藏所有 minion 卡片
  // 显示 collapsedRow
  // collapsedRow 显示 "喽啰 ×N" + 总 HP 条
} else {
  // 显示所有卡片
  // 隐藏 collapsedRow
}
```

---

## 七、动画与反馈

### 7.1 浮动数字

| 类型 | 颜色 | 字体大小 | 动画 |
|------|------|---------|------|
| 伤害 | `#FF4444` | 20 | 从目标位置向上飘 50px + 淡出，0.5s |
| 暴击 | `#FFD700` | 28 | 同上，但文字前加 "暴击!"，字体更大 |
| 治疗 | `#90EE90` | 20 | 同上，文字前加 "+" |
| 击杀 | `#FF4444` | 24 | 飘起 + 停留 0.3s 再消失，文字加 "——击杀!" |

### 7.2 当前行动指示

```
当前行动单元的高亮边框:
  Tween: 边框透明度从 0.3 → 1.0 → 0.3 循环呼吸（0.8s 周期）
  颜色: #D4A76A (琥珀色)
  同时出手顺序条中对应名字高亮
```

### 7.3 HP 条过渡

```typescript
// HP 变化时，不瞬间跳变
// 用 Tween 让 hpBarFill 的宽度逐渐变化（0.2s）
// 如果受伤较大（>30% HP），额外闪一下红色遮罩（0.1s）
```

### 7.4 按钮反馈

| 操作 | 反馈 |
|------|------|
| 点击可用按钮 | `[文字]` → 瞬间变为 `#FFD700` 色 + 恢复 ← 0.15s |
| 禁用按钮点击 | 无反应或文字抖动 0.1s（向左偏移 2px 再复位） |
| 自动按钮切换 | 切换 `[自动]` ↔ `【自动】` |
| 选择目标提示 | statusLabel 显示 "请选择目标", 可用目标卡片闪烁 |

### 7.5 回合过渡

```
新轮次:
  顶部 roundLabel 闪烁一次（#FFD700 闪 0.2s 恢复）
  orderLabel 刷新出手顺序
  日志追加 "—— 第 X 轮 ——" 分割行
```

---

## 八、极限状态处理

### 8.1 6 敌人满员

```
布局策略（匹配设计文档 5.1 节）:
  头目单独一行（上方）+ 精英单独一行（中间）+ 喽啰折叠行（下方）
  
  折叠行格式:
    "喽啰 ×4  ████████░░░░░░░░  总血量"
    "██████████░░░░░░░░░░░░░░░░  6400/12800"
    （两行：上行显示数量 + 总 HP 比例，下行显示具体数值）
  
  点击折叠行 → 展开显示各喽啰详情（可选功能）
```

### 8.2 0 敌人存活

- enemyCards 全部 inactive
- 进入 victory 阶段，enemyCountLabel 显示 "敌方: 0/6 已全歼"
- 不显示操作栏（战斗已结束）

### 8.3 玩家角色死亡

- 死亡角色卡片 active = false（不显示）
- 剩余卡片重新排列，居中

### 8.4 全阵亡

- playerCards 全部 inactive
- 进入 defeat 阶段
- 操作栏替换为 [重试] / [撤退] 按钮
- 半透明深色遮罩覆盖战斗区域

### 8.5 敌人无可用技能

- 当 `pendingActionUnit.skills.length === 0`（无技能配置时）
- 操作栏只显示 `[普攻]` 和 `[防御]`，其余按钮禁用

### 8.6 待机态（敌人行动中/回合过渡）

- 操作栏所有按钮设为禁用态（文字变 #6B5D4B + 圆括号包围）
- 日志更新显示敌方行动
- 当前行动敌人卡片高亮

---

## 九、与当前代码的差异对照

| 当前代码（BattleScene.ts） | 新方案 | 改动量 |
|---------------------------|--------|--------|
| 无 enemyCountLabel | 新增 "敌方: 4/6 存活" | 新增 |
| 轮次仅显示数字 | 改为 "第 X / 20 轮" 格式 | 小改 |
| 无分割线 | 添加 4 条装饰性分割线 | 新增 |
| 无面板标题 | 添加 "── 敌方 ──" / "── 我方 ──" | 新增 |
| 无卡片背景 | 添加 cardBg（半透明矩形） | 新增 |
| 无出手顺序条 | 添加 actionOrderBar | 新增 |
| statusLabel 在画面中央占位 | 移除（功能整合到出手顺序条和操作栏） | 删除重建 |
| 无操作按钮 | 添加两行操作栏 | 新增 |
| 无高亮边框 | 添加 highlightBorder + 呼吸动画 | 新增 |
| 敌人 HP 条显示全名 | 保留，微调字体和间距 | 小改 |
| 浮动数字只有上飘 | 增加暴击/治疗/击杀区分 | 小改 |
| 提示文字 "点击敌人选择目标" | 整合到 statusLabel 或操作栏上方提示行 | 修改 |
| 日志单行显示 | 改为多行独立 Label + 滚动更新 | 修改 |
| 敌人无 bgSpacing 区分 | 用 cardBg 做视觉背景 | 小改 |
| 敌人仅 3 个时 | 支持折叠逻辑（>3 小怪） | 新增 |
| 游戏标题 "八方游侠" 在画面顶部 | 移除（战斗中不需要游戏标题） | 删除 |

---

## 十、实施建议

### 10.1 实施顺序

建议 cocos-dev 按以下顺序实现，确保每步都可预览：

1. **顶栏 + 分割线** — roundLabel, enemyCountLabel, divider（5 分钟可验证）
2. **卡片美化** — 添加 cardBg, 调整卡片间距和样式（10 分钟）
3. **面板标题** — 添加 "── 敌方 ──" / "── 我方 ──"（5 分钟）
4. **出手顺序条** — 从 turnOrder 渲染（15 分钟）
5. **操作栏** — 基本按钮布局 + 点击交互（20 分钟）
6. **高亮边框** — currentActingUnit 绑定 + 呼吸动画（10 分钟）
7. **日志多行** — 从单行改为多行 Label 独立控制（10 分钟）
8. **浮动数字增强** — 暴击/治疗/击杀区分（10 分钟）
9. **HP 条过渡动画** — Tween 宽度变化（10 分钟）
10. **敌人折叠** — 逻辑条件 + 折叠行渲染（15 分钟）
11. **按钮状态管理** — 禁用态、点击反馈（10 分钟）
12. **移除旧 statusLabel** — 最后清理（5 分钟）

总预估：约 2 小时

### 10.2 需要 BattleManager 配合修改的点

- `BattleUnit` 需要增加 `level` 属性（目前没有，从 Config 也不读等级）
- `CharConfig` 需要增加可选的 `isBoss` / `isElite` 标记（用于折叠逻辑）
- `BattleManager` 的 `turnOrder` 需要暴露给 UI（已经暴露 `battleMgr.turnOrder`）
- `BattleUnit` 的 `classType` 类型定义已足够

### 10.3 未覆盖的功能（后续阶段实现）

- Buff/Debuff 图标显示（目前 GameBuff 系统未接入）
- 技能按钮具体的技能数据绑定（目前无技能配置）
- 道具弹出列表
- 自动战斗策略选择
- 战斗结算过渡动画
