# 2026-06-26 Phase 1: 地基修复

## 概述

修复博客项目中的基础性问题：Pagefind 搜索路径在子路径部署下失效、博客配置硬编码分散、冗余 frontmatter 字段，以及附件目录缺失导致 Astro 5 deprecation 警告。

---

## 变更清单

| 编号 | 提交 | 变更内容 | 状态 |
|---|---|---|---|
| 1.1 | `0a047ec` → `db0ff9d` | 修复 Pagefind 搜索路径缺少 base 前缀 | ✅ |
| 1.2 | `f0485e9` → `db0ff9d` | 创建 `blog.config.ts` 全局配置 | ✅ |
| 1.3 | `2858a55` | 清理 mdx 文章冗余 `lang` 字段 | ✅ |
| 1.4 | `dca889e` | 创建 `attachments` 内容集合目录 | ✅ |

---

## 1.1 修复 Pagefind 搜索路径

**问题**：`SearchDialog.astro` 和 `search.astro` 中 Pagefind import 路径硬编码为 `/_pagefind/pagefind.js`，缺少 `base: '/l4p-blog'` 前缀，导致在 GitHub Pages 子路径部署下搜索功能完全失效。

**初次尝试**：在 `<script is:inline>` 中直接使用 `import.meta.env.BASE_URL` 拼接路径。但 `is:inline` 脚本不经 Vite 处理，环境变量替换不会生效，浏览器拿到的是字面量字符串。

**最终方案**：在 frontmatter 中声明 `const baseUrl = import.meta.env.BASE_URL`，通过 `define:vars` 将其传入 inline script：

```astro
---
const baseUrl = import.meta.env.BASE_URL;
---
<script is:inline define:vars={{ baseUrl }}>
  const pagefind = await import(`${baseUrl}_pagefind/pagefind.js`);
</script>
```

**教训**：Astro 的 `is:inline` 脚本跳过 Vite 构建管线，`import.meta.env.*` 不会被替换。需要通过 `define:vars` 桥接 frontmatter 变量与 inline script。

---

## 1.2 创建全局博客配置

**问题**：`author`、`lang`、`postsPerPage` 等配置值硬编码在各组件中，修改时需要逐一查找替换。

**方案**：新建 `src/blog.config.ts`，集中管理博客配置：

```typescript
export const blogConfig = {
  author: 'L4place',
  lang: 'zh',
  postsPerPage: 10,
} as const;
```

**关联改动**：

- `src/content.config.ts`（schemas.ts）：`author` 和 `lang` 默认值改为从 config 读取
- `src/pages/blog/index.astro`：`POSTS_PER_PAGE` 常量改为从 config 读取

**修复**：初次实现中 `blog/index.astro` 的 import 路径少了一层 `../`（`../../blog.config` 应为 `../../../blog.config`），代码审查后修正。

---

## 1.3 清理冗余 frontmatter

**问题**：`src/content/blog/` 下两篇 mdx 文章显式声明了 `lang: "zh"`，与 `blog.config.ts` 默认值重复。

**改动**：移除这两篇文章中的 `lang: "zh"` 字段，由全局配置的默认值统一覆盖，避免多处维护同一值。

---

## 1.4 创建附件目录

**问题**：Astro 5 要求所有内容集合在 `config.ts` 中显式定义，否则会产生 deprecation 警告。项目缺少用于存放图片等附件的集合目录。

**改动**：

- 新建 `src/content/attachments/` 目录，含 `.gitkeep`（占位）和 `README.md`（使用说明）
- 在 `config.ts` 中显式定义 `attachments` 集合

---

## 文件结构变更

```
src/
├── blog.config.ts                    # 新增：全局博客配置
├── content/
│   ├── config.ts                     # 修改：author/lang 读取 config，新增 attachments 集合
│   ├── attachments/                  # 新增：附件目录
│   │   ├── .gitkeep
│   │   └── README.md
│   └── blog/
│       └── *.mdx                     # 修改：移除冗余 lang 字段
└── pages/
    ├── blog/
    │   └── index.astro              # 修改：POSTS_PER_PAGE 读取 config
    └── search.astro                 # 修改：Pagefind 路径修复
```
