# 2026-06-26 Phase 2: Obsidian 写作体验

## 概述

为博客引入 Obsidian 风格写作支持：语法预处理器（wikilink/embed/callout/highlight）接入 Astro 渲染管线、附件路径映射通过 symlink 实现自动部署、草稿机制支持 dev 可见 + build 排除，以及内容完整性验证增强。

---

## 变更清单

| 编号 | 提交 | 变更内容 | 状态 |
|---|---|---|---|
| 2.1 | `ef8032f` | Obsidian 语法预处理器（wikilink/embed/callout/highlight） | ✅ |
| 2.2 | `4402f37` | 附件路径映射（public symlink） | ✅ |
| 2.3 | `3e24754` | 草稿机制（dev 可见 + 标记，build 排除） | ✅ |
| 2.4 | `95577c3` | 写作验证增强（必填字段、日期、孤立附件） | ✅ |
| 2.R | `a976c16` | 审查修复：remark 插件集成 + slug 草稿修复 | ✅ |

---

## 2.1 Obsidian 语法预处理器

**新增文件**：
- `src/utils/obsidian-preprocess.ts` — 语法转换引擎
- `src/utils/__tests__/obsidian-preprocess.test.ts` — 29 个测试用例

**支持的语法**：

| 语法 | 输入 | 输出 |
|---|---|---|
| Wikilink | `[[页面名]]` | `<a href="...">页面名</a>` |
| Embed | `![[image.png]]` | `<img src="/attachments/image.png">` |
| Callout | `> [!note] 标题` | `<aside class="callout callout-note">` |
| Highlight | `==高亮==` | `<mark>高亮</mark>` |

**问题**：初次实现时预处理器仅作为独立函数存在，未接入 Astro 的 Markdown 渲染管线，属于死代码。审查后在 2.R 中修复（见下文）。

---

## 2.2 附件路径映射

**方案**：创建符号链接 `public/attachments -> ../src/content/attachments`

Astro 构建时自动将 `public/` 目录内容复制到 `dist/`，因此附件图片在部署后的 `/attachments/` 路径下可直接访问。Obsidian 文章中引用的 `![[image.png]]` 经预处理器转换后指向该路径。

**注意**：Windows 环境需先执行 `git config core.symlinks true`，否则 symlink 会退化为普通文本文件。

---

## 2.3 草稿机制

**改动范围**：

| 文件 | 改动 |
|---|---|
| `src/pages/blog/index.astro` | `getCollection` 添加 `isDev \|\| !data.draft` 过滤 |
| `src/pages/blog/category/[category].astro` | 同上 |
| `src/pages/blog/tag/[tag].astro` | 同上 |
| `src/pages/index.astro` | 同上 |
| `src/components/ArticleCard.astro` | 草稿文章标题旁显示 `[草稿]` 标记 |

**行为**：
- **dev 模式**：草稿可见，ArticleCard 显示 `[草稿]` 标记
- **build 模式**：草稿从所有列表页排除
- **RSS**：始终排除草稿（不受 dev/build 影响）

**问题**：初次实现遗漏了 `src/pages/blog/[...slug].astro` 详情页，导致 dev 模式下草稿文章 404。审查后在 2.R 中修复。

---

## 2.4 写作验证增强

**改动文件**：`src/__tests__/content-integrity.test.ts`（+54 行）

新增三项验证：
- **必填字段检查**：`title`、`description`、`pubDate` 缺失时报错
- **未来日期检查**：`pubDate` 晚于当前时间时报错
- **孤立附件检测**：`attachments/` 中存在未被任何文章引用的文件时报错

**限制**：`parseFrontmatter` 为简易实现，不支持多行 YAML 值。

---

## 2.R 审查修复

**新增文件**：`src/utils/remark-obsidian.ts`

将 `obsidian-preprocess.ts` 包装为 remark 插件，在 AST 层面处理 wikilink/embed/highlight/callout，使其真正接入 Astro 的 Markdown 渲染管线。

**配置变更**：`astro.config.mjs` 注册 `remarkObsidian` 到 `markdown.remarkPlugins`。

**草稿修复**：`src/pages/blog/[...slug].astro` 的 `getStaticPaths` 从硬编码 `!data.draft` 改为 `isDev || !data.draft`，与其余页面保持一致。

---

## 文件结构变更

```
src/
├── utils/
│   ├── obsidian-preprocess.ts          # 新增：Obsidian 语法转换引擎
│   ├── remark-obsidian.ts              # 新增：remark 插件包装
│   └── __tests__/
│       └── obsidian-preprocess.test.ts # 新增：29 个测试用例
├── pages/
│   ├── index.astro                     # 修改：草稿过滤
│   └── blog/
│       ├── index.astro                 # 修改：草稿过滤
│       ├── [...slug].astro             # 修改：草稿过滤（审查修复）
│       ├── category/[category].astro   # 修改：草稿过滤
│       └── tag/[tag].astro             # 修改：草稿过滤
├── components/
│   └── ArticleCard.astro               # 修改：草稿标记显示
└── __tests__/
    └── content-integrity.test.ts       # 修改：验证增强

public/
└── attachments -> ../src/content/attachments  # 新增：符号链接

astro.config.mjs                        # 修改：注册 remarkObsidian 插件
```
