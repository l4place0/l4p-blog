/** RSS 2.0 feed — 查询 blog 集合，过滤草稿 */

import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context: { site: URL }) {
  // RSS 始终排除草稿（与其他页面不同，RSS 是面向订阅者的）
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  return rss({
    title: 'l4.place',
    description: '复古文艺风格的个人博客',
    site: context.site,
    items: posts
      .sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
      .map((post) => ({
        title: post.data.title,
        description: post.data.description,
        pubDate: post.data.pubDate,
        link: `/blog/${post.id}/`,
      })),
    customData: '<language>zh-CN</language>',
  });
}
