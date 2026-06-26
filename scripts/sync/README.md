# 多平台同步 CLI

## 基本用法

```bash
npm run sync                              # 同步所有未同步文章
npm run sync -- --post=hello-world        # 同步指定文章
npm run sync -- --platform=zhihu          # 只同步到指定平台
npm run sync -- --dry-run                 # 预览模式
npm run sync -- --force                   # 强制重新同步
```

## AI 友好接口

```bash
# JSON 输出模式
npm run sync -- --json                    # 输出 JSON 格式的同步结果
npm run sync -- --manifest --json         # 输出 JSON 格式的文章清单

# 结构化输入
npm run sync -- --json-input '{"action":"manifest"}'
npm run sync -- --json-input '{"action":"sync","post":"hello-world","platform":"zhihu"}'
```

## 错误码

| 代码 | 含义 | 建议 |
|------|------|------|
| POST_NOT_FOUND | 文章不存在 | 使用 --manifest 查看列表 |
| PLATFORM_NOT_FOUND | 平台不存在 | 使用 --manifest 查看平台 |
| ADAPTER_ERROR | 适配器执行失败 | 检查内容格式 |
| ALREADY_SYNCED | 已同步 | 使用 --force 强制 |

## 添加新平台

1. 在 `adapters/` 目录创建新适配器文件
2. 实现 `PlatformAdapter` 接口
3. 在 `index.ts` 中注册适配器
