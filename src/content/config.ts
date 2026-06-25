/** Content Collection schemas — Zod 驱动的 frontmatter 类型安全校验 */

import { defineCollection, z } from 'astro:content';
import { blogSchema, projectsSchema } from './schemas';

const blog = defineCollection({ type: 'content', schema: blogSchema });
const projects = defineCollection({ type: 'content', schema: projectsSchema });

export const collections = { blog, projects };
