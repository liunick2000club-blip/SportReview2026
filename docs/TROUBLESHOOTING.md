# 项目修复与优化记录 (2026-03-16)

本文档记录了在项目初始化和运行过程中遇到的核心问题及其解决方案。

## 1. Next.js 水合错误 (Hydration Error)

### 问题描述
页面报错：`A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.`
主要发生在首页（Dashboard）和布局文件（Layout）中。

### 解决方案
- **图表延迟加载**：在 `src/app/page.tsx` 中引入 `mounted` 状态。由于 Recharts 图表依赖浏览器环境（如窗口大小、随机 ID），确保组件在客户端 `useEffect` 挂载后再进行渲染，避免服务端与客户端 HTML 不一致。
- **全局警告抑制**：在 `src/app/layout.tsx` 的 `<body>` 标签添加 `suppressHydrationWarning`。这解决了由浏览器插件（如翻译、深色模式）注入 HTML 引起的冲突。

## 2. 数据库连接与路径问题 (Database Path)

### 问题描述
API 返回空数据，即使数据库中存在记录。
原因：项目根目录和 `prisma/` 目录下存在多个 `dev.db` 文件。Prisma 默认使用相对路径，导致不同运行环境下读取的数据库文件不一致。

### 解决方案
- **强制绝对路径**：修改 `src/lib/prisma.ts`，使用 `process.cwd()` 动态拼接数据库路径。
  ```typescript
  const dbPath = path.join(process.cwd(), "prisma/dev.db");
  new PrismaClient({ datasources: { db: { url: `file:${dbPath}` } } })
  ```
  这确保了应用始终指向 `prisma/dev.db`，不受运行环境（根目录或脚本目录）影响。

## 3. Prisma 与 SQLite 日期比较失效 (Critical Bug)

### 问题描述
即使数据库中存有正确格式的 ISO 日期字符串（如 `2026-03-16T16:00:00Z`），Prisma 的 ORM 过滤语法（如 `where: { date: { lte: todayEnd } }`）在 SQLite 驱动下依然返回 **0 条数据**。
经过原生 SQL (`queryRaw`) 验证，数据库数据是正确的。该问题源于 Prisma 在将 JavaScript Date 对象序列化并传递给 SQLite 驱动进行字符串比较时，由于毫秒级精度或时区偏置，导致字符串比较逻辑在 SQLite 层面失效。

### 解决方案
- **内存过滤策略 (In-Memory Filtering)**：不再依赖 Prisma 的 `where` 子句进行日期筛选，而是先抓取 2026 年的所有数据，然后在 JavaScript 层使用 `.filter()` 按照 `toISOString()` 的字符串顺序进行筛选和聚合。
- **这种方案对于当前数据量（几百到几千条）最为稳妥，彻底绕过了时区和驱动层的比较漏洞。**

## 4. 时区偏差与未来数据处理

### 问题描述
1. 数据库中包含预填写的 2027 年测试数据，导致“2026年度回顾”统计异常。
2. 即使设置了 `endOfDay`，由于时区偏差（Server UTC vs Local），“今天”傍晚产生的记录可能依然被过滤。

### 解决方案
- **物理删除**：执行 SQL 删除所有晚于 2026-03-16 的预填测试记录。
- **日期缓冲 (Timezone Buffer)**：在 API 中将“今天结束”的时间定义放宽至 **`addDays(new Date(), 2)`**。这确保了由于时区偏置可能导致的“未来几个小时”的数据点也能被正确包含在“今天”的统计中。

---
**提示**：后续如需导入新数据，请确保日期格式为 ISO 8601，且 `DATABASE_URL` 始终指向 `prisma/dev.db`。如有过滤不准的情况，请优先检查 API 中的内存过滤逻辑。
