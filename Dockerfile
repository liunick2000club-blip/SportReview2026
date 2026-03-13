# 使用轻量级 Node.js 镜像
FROM node:20-alpine AS builder

WORKDIR /app

# 复制 package.json 和 lock 文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装依赖并生成 Prisma 客户端
RUN npm install
RUN npx prisma generate

# 复制所有源代码
COPY . .

# 构建生产环境代码
RUN npm run build

# --- 运行阶段 ---
FROM node:20-alpine AS runner

WORKDIR /app

# 仅从构建阶段复制必要文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/dev.db ./dev.db
COPY --from=builder /app/.env ./.env

# 暴露端口
EXPOSE 3000

# 启动命令
CMD ["npm", "start"]
