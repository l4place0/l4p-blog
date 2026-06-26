# 2026-06-26 Phase 3: 多平台同步 CLI

## 概述

为博客构建多平台内容分发 CLI 工具，支持将 MDX 文章自动转换并同步到知乎、掘金等平台。采用插件化适配器架构，核心引擎负责文章扫描与执行调度，各平台适配器负责内容格式转换与元数据生成。同步状态通过独立 JSON 文件追踪，避免污染文章 frontmatter。

---

## 变更清单

| 编号 | 提交 | 变更内容 | 状态 |
|---|---|---|---|
| 3.1 | `801ead5` | 插件架构 + 核心引擎（CLI 入口、文章扫描、同步执行） | ✅ |
| 3.2 | `087bc0c` | 知乎适配器（JSX 移除、frontmatter 生成、分类映射） | ✅ |
| 3.3 | `25ed10f` | 掘金适配器（代码块标准化、掘金 frontmatter） | ✅ |
| 3.4 | `3bb5eb5` → `56a739e` | 同步状态追踪（frontmatter → 独立 JSON 文件） | ✅ |
| 3.5 | `19c4ca7` | AI 友好接口 + CLI 文档 | ✅ |

---

## 3.1 插件架构 + 核心引擎

**新增目录**：`scripts/sync/`

**核心文件**：

| 文件 | 职责 |
|---|---|
| `types.ts` | 类型定义：`Post`、`PlatformAdapter`、`SyncResult`、`SyncManifest`、`SyncOptions` |
| `core.ts` | 核心引擎：文章扫描、frontmatter 解析、Obsidian 预处理集成、同步执行调度 |
| `index.ts` | CLI 入口：参数解析、适配器注册、命令分发 |

**CLI 参数**：

| 参数 | 说明 |
|---|---|
| `--manifest` | 输出同步清单（文章 × 平台矩阵） |
| `--dry-run` | 预览模式，不实际写入文件 |
| `--json` | JSON 格式输出 |
| `--post=<slug>` | 同步指定文章 |
| `--platform=<name>` | 同步到指定平台 |
| `--force` | 强制重新同步（忽略已同步状态） |

**依赖变更**：添加 `tsx` 运行时依赖，注册 npm scripts：

```json
{
  "sync": "tsx scripts/sync/index.ts",
  "sync:dry": "tsx scripts/sync/index.ts --dry-run"
}
```

---

## 3.2 知乎适配器

**新增文件**：`scripts/sync/adapters/zhihu.ts`

**核心函数**：

| 函数 | 功能 |
|---|---|
| `removeJsxComponents()` | 移除 MDX 特有语法：JSX 标签、import 语句 |
| `buildFrontmatter()` | 生成知乎格式 frontmatter |
| `mapCategory()` | 博客分类 → 知乎分类映射 |
| `adaptForZhihu()` | 知乎 Markdown 格式适配 |

**处理流程**：`transform()` 依次执行 JSX 移除 → 知乎 Markdown 适配 → frontmatter 生成，输出可直接粘贴到知乎编辑器的 Markdown 文本。

---

## 3.3 掘金适配器

**新增文件**：`scripts/sync/adapters/juejin.ts`

**核心函数**：

| 函数 | 功能 |
|---|---|
| `adaptForJuejin()` | 代码块标准化：为无语言标识的代码块添加 `text` 标识 |
| `buildFrontmatter()` | 掘金特定 frontmatter 生成 |

**掘金 frontmatter 特性**：
- `theme: 'smart'` 自动主题
- 标签限制 3 个
- `public: true` 公开发布

**问题**：`removeJsxComponents()` 和 `buildFrontmatter()` 在知乎和掘金适配器中各有一份实现，逻辑重复，应提取为共享工具函数。

---

## 3.4 同步状态追踪

**初次实现**（`3bb5eb5`）：将 `syndicated` 状态直接写入文章 frontmatter。

**问题**：YAML 解析错误 + 重复键导致构建失败。frontmatter 是 Astro 内容集合的 schema 入口，写入非声明字段会破坏构建管线。

**重写方案**（`56a739e`）：改用独立 JSON 文件 `scripts/sync/.sync-state.json` 追踪状态。

**新增文件**：`scripts/sync/formatters/frontmatter.ts`

**导出函数**：

| 函数 | 功能 |
|---|---|
| `isSynced(slug, platform)` | 检查文章是否已同步到指定平台 |
| `markSynced(slug, platform)` | 标记文章已同步 |
| `getSyncStatus(slug)` | 获取文章在所有平台的同步状态 |

**.gitignore**：排除 `scripts/sync/.sync-state.json`，不纳入版本控制。

---

## 3.5 AI 友好接口

**新增文件**：
- `scripts/sync/ai-interface.ts` — 结构化输入输出类型
- `scripts/sync/README.md` — CLI 使用文档

**类型定义**：

| 类型 | 说明 |
|---|---|
| `AICommand` | AI 输入：`action`（manifest/sync/status）、`post`、`platform`、`dryRun`、`force` |
| `AIResponse` | AI 输出：`success`、`data`、`errors`（含 `code` + `suggestion`）、`summary` |
| `ERROR_CODES` | 错误码常量 |

**注意**：AI 接口模块目前未集成到 CLI 入口（`index.ts` 未 import），属于预留接口。

---

## 文件结构变更

```
scripts/sync/
├── index.ts                          # 新增：CLI 入口
├── core.ts                           # 新增：核心引擎
├── types.ts                          # 新增：类型定义
├── ai-interface.ts                   # 新增：AI 友好接口（未集成）
├── README.md                         # 新增：CLI 使用文档
├── adapters/
│   ├── zhihu.ts                      # 新增：知乎适配器
│   └── juejin.ts                     # 新增：掘金适配器
├── formatters/
│   └── frontmatter.ts                # 新增：同步状态管理
└── .sync-state.json                  # 运行时生成，已 gitignore

package.json                          # 修改：添加 tsx 依赖、sync/sync:dry scripts
.gitignore                            # 修改：排除 .sync-state.json
```

---

## 遗留问题

| 问题 | 说明 | 优先级 |
|---|---|---|
| 适配器代码重复 | `removeJsxComponents` 和 `buildFrontmatter` 在 zhihu/juejin 中重复实现，应提取为 `formatters/` 下的共享工具 | 中 |
| AI 接口未集成 | `ai-interface.ts` 是死代码，`index.ts` 未 import，需接入 CLI 入口 | 中 |
| 缺少单元测试 | 同步模块无测试覆盖，适配器转换逻辑和状态管理应有测试 | 高 |
| 正则边界情况 | `removeJsxComponents` 对嵌套同名组件（如 `<Tip><Tip>...</Tip></Tip>`）和无空格自闭合标签（如 `<Component/>`）处理不完善 | 低 |
