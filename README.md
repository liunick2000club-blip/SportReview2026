# SportReview 2026

SportReview 是一款高度定制化的运动记录与财务分析应用，专为 2026 年的健康生活与精准开支管理打造。

## 🚀 核心特性

- **多维运动追踪**：支持攀岩、跑步、骑行及多种自定义运动类型的记录与复盘。
- **智能财务逻辑**：
  - **年费摊销**：自动计算年度会员费（如 3288元/年）的每日摊销成本。
  - **自动计费**：针对特定场馆（如 Cliffs 68元/次，环岛 70元/次）实现零手动计费。
  - **额外开支**：支持在任何活动记录中累加备注中的现金消费。
- **动态数据看板**：
  - **场馆分布饼图**：直观展示攀岩热点。
  - **跑步/骑行月度趋势**：折线图追踪体能进步。
  - **数据穿透**：点击图表任意节点，即刻跳转并筛选相关历史明细。
- **钉钉自动化集成**：
  - **智能提醒**：深夜汇总今日运动，清晨自动补漏昨日记录。
  - **聊天即记录**：支持通过钉钉消息（Outgoing Webhook）直接解析并录入运动数据。

## 🛠 技术栈

- **框架**：[Next.js 15+](https://nextjs.org/) (App Router)
- **数据库**：[SQLite](https://www.sqlite.org/) 配合 [Prisma ORM](https://www.prisma.io/)
- **图表**：[Recharts](https://recharts.org/)
- **UI**：Tailwind CSS + Lucide Icons
- **工具**：date-fns, iconv-lite

## 📦 快速开始

1. **安装依赖**：
   ```bash
   npm install
   ```

2. **环境配置**：
   在根目录创建 `.env` 文件并配置以下变量：
   ```env
   DATABASE_URL="file:./dev.db"
   BASE_URL="http://localhost:3000"
   DINGTALK_WEBHOOK_URL="你的钉钉机器人Webhook"
   DINGTALK_KEYWORD="你的钉钉安全关键词"
   ```

3. **初始化数据库**：
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **启动开发服务器**：
   ```bash
   npm run dev
   ```

## 📅 定时任务配置

系统依赖两个关键时间点的 API 调用来触发钉钉推送：
- **23:30**：触发当日回顾。
- **08:30**：触发昨日补漏。

在 Windows 下建议使用 `schtasks` 或任务计划程序配置指向 `/api/cron/reminder` 的 GET 请求。

## 📝 贡献说明

本项目由 Gemini CLI 协作开发，旨在探索个人数据主权与自动化记录的最佳实践。

---
*SportReview · 2026 Archive*
