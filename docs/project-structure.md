# 项目目录结构规范

状态：approved

---

## 目录树

```
this-is-a-game-project/
│
├── .claude/agents/          # 自定义 agent（已 git 跟踪）
│   ├── combat-designer.md
│   ├── balance-designer.md
│   ├── system-designer.md
│   └── game-design-reviewer.md
│
├── docs/                    # 设计文档（按系统分类）
│   ├── combat/              #   战斗系统
│   ├── system/              #   系统功能/UI
│   ├── narrative/           #   世界观/剧情（预留）
│   └── project-structure.md #   本文件
│
├── src/                     # 源码（开始编码后创建）
│
├── assets/                  # 资源文件（字符模板、配置表等）
│
├── scripts/                 # 工具脚本
│
├── CLAUDE.md                # 项目说明（git 跟踪）
├── task_plan.md             # 总体规划（git 跟踪）
├── findings.md              # 设计决策记录（git 跟踪）
├── progress.md              # 进度日志（git 跟踪）
└── .gitignore
```

## 文件命名规则

| 类型 | 格式 | 示例 |
|------|------|------|
| 设计文档 | `yyyy-mm-dd-简短英文描述.md` | `2026-05-28-turn-order-and-round-flow-design.md` |
| 规范文档 | `简短英文描述.md` | `project-structure.md` |
| 根目录规划文件 | 固定名 | `task_plan.md` / `findings.md` / `progress.md` |

## 文档状态标记

每个设计文档顶部加一行状态标记：

```markdown
状态：draft | reviewing | approved
```

- **draft** — 初稿，评审中或等待评审
- **reviewing** — 正在评审
- **approved** — 已定稿，可以照着实现

## 原则

1. `docs/` 下按系统分目录，不按时间分（不新建 `docs/v2/` 之类的目录）
2. 根目录只放规划文件（`task_plan.md` / `findings.md` / `progress.md`）和项目配置（`CLAUDE.md` / `.gitignore`）
3. 废弃/过时的设计文档移到对应目录下的 `_archive/` 子目录，不删（保留历史）
4. 编码开始后，代码全部放 `src/` 下，按框架规范再细分
