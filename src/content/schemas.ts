/** 纯 Zod schema 定义 — 可被测试直接导入 */

import { z } from 'zod';
import config from '../../blog.config';

export const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  category: z.enum(['随笔', '技术', '读书', '生活', '设计']),
  tags: z.array(z.string()).default([]),
  featured: z.boolean().default(false),
  draft: z.boolean().default(false),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  ogImage: z.string().optional(),
  author: z.string().default(config.author),
  lang: z.enum(['zh', 'en']).default(config.lang),
});

export const projectsSchema = z.object({
  title: z.string(),
  description: z.string(),
  pubDate: z.coerce.date(),
  tech: z.array(z.string()).default([]),
  url: z.string().url().optional(),
  repo: z.string().url().optional(),
  cover: z.string().optional(),
  coverAlt: z.string().optional(),
  featured: z.boolean().default(false),
  status: z.enum(['active', 'archived', 'wip']).default('active'),
});
