# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## 项目简介

微信小程序小游戏，回合制对战 + 角色养成的单机游戏。
美术为极简字符风格，中式古风奇幻世界观（大晟王朝/江湖+方术）。
练习项目，不以赚钱为首要目的。

**当前状态**：设计阶段，尚未开始编码。

## 项目结构

```
├── .claude/agents/      自定义 agent（战斗/数值/系统/评审）
├── docs/                设计文档
│   ├── combat/          战斗系统设计
│   ├── system/          系统功能/UI 设计
│   └── narrative/       世界观/剧情（预留）
├── src/                 源码（编码后创建）
├── assets/              资源文件
├── task_plan.md         总体规划
├── findings.md          设计决策记录
├── progress.md          进度日志
```

## 设计文档

详见 `docs/` 目录。文档顶部有状态标记：
- `draft` — 初稿
- `reviewing` — 评审中
- `approved` — 已定稿

### 已定稿设计
| 文档 | 内容 |
|------|------|
| `docs/combat/2026-05-28-turn-order-and-round-flow-design.md` | 回合流程与出手顺序 |
| `docs/combat/2026-05-28-damage-formula-design.md` | 伤害公式与职业数值 |
| `docs/system/2026-05-28-main-interface-and-game-flow-design.md` | 主界面布局与游戏流程 |
| `docs/narrative/2026-05-28-world-setting-and-game-name.md` | 世界观与游戏命名 |

### 已定设计
- **游戏名**：《八方游侠》
- **世界观**：大晟王朝，玩家扮演游侠阁阁主，招募各路游侠平定乱世
- **战斗**：小队回合制（我方3人 vs 敌方1-6+），按速度轮流出手，仇恨系统替代站位
- **职业**：玄甲（坦）、方士（法）、惊鸿（弓）、素问（奶）
- **角色**：有具体角色名（中国古风），固定星级（四/五星），招募获得

### 待定事项
- 技能系统：各职业具体技能
- 养成维度：等级、装备、技能升级等

### 已定技术选型
- **前端框架**：微信小程序原生框架
- **版本管理**：git + GitHub（asdnmy123/this-is-a-game-project）
- **项目跟踪**：planning-with-files 技能

## 工作流

### 设计流程
```
agent 出方案 → 评审 agent 审查 → 修问题 → 定稿(approved)
```

### 已创建的 agent（.claude/agents/）
| agent | 职责 | 颜色 |
|-------|------|------|
| combat-designer | 战斗/技能/Buff/仇恨/AI 设计 | red |
| balance-designer | 伤害公式/成长曲线/概率/经济 | green |
| system-designer | UI/导航/编队/背包/存档/系统流程 | cyan |
| game-design-reviewer | 方案评审/问题排查/对比分析 | yellow |
| narrative-designer | 世界观/剧情/角色故事/命名/文案 | magenta |

### Agent 创建规则
创建新 agent 必须先调用 agent-develop 技能获取规范参考，不得手动凭记忆创建。

### 基础设施
- 版本管理：git + GitHub（asdnmy123/this-is-a-game-project）
- 项目跟踪：planning-with-files 技能（task_plan.md / findings.md / progress.md）

## Git 提交与推送规则

以下情况**自动 commit**，**不自动 push**（需用户要求或用户主动推送时执行）：

| 触发条件 | 内容 |
|---------|------|
| 设计方案通过评审，状态改为 approved | 提交设计文档 + 相关变更 |
| 新建/修改 agent 配置文件 | 提交 agent + 更新 CLAUDE.md |
| 阶段推进（pending → complete） | 提交 task_plan.md 等规划文件 |
| 重要的规划文件更新 | 提交 findings.md / progress.md 等 |
| 项目配置文件变更 | 提交 CLAUDE.md / .gitignore 等 |

**不提交的情况：**
- 每次 Read 文件不提交
- 正在进行的草稿不提交
- 临时测试文件不提交

**原则**：每次 commit 是一个**逻辑完整的变更**，颗粒度大致相当于"做完一件事"。

## 文档维护规则（硬性要求）

每次操作后，对照下表检查需要更新哪些文件：

| 触发条件 | 要更新的文件 | 更新内容 |
|---------|------------|---------|
| 创建/修改了 agent 文件 | `CLAUDE.md` | agent 清单表格 |
| 设计方案通过评审，状态变成 approved | `CLAUDE.md` | 已定稿设计列表 |
| 阶段推进/勾选框变动 | `task_plan.md` | 状态标记和阶段进度 |
| 做了重要决策或发现 | `findings.md` | 新增决策/发现/待办提醒 |
| 完成了任何实质性操作 | `progress.md` | 记录做了什么 |
| 文档路径/结构变了 | `CLAUDE.md` | 项目结构说明 |

**原则**：不需要每次 Read 文件都记 progress，但任何"产出性操作"（写文档、改设计、建文件、提交代码）之后都必须更新。
