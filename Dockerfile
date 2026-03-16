# Stage 1: Install dependencies and build
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm install
RUN npx prisma generate

COPY . .
RUN npm run build

# Stage 2: Final runtime image
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
# 设置正确的数据库 URL 供生产环境使用
ENV DATABASE_URL="file:/app/prisma/prisma/dev.db"

# 仅复制运行必需的文件
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/.env ./.env

EXPOSE 3000

# 生产环境启动命令
CMD ["npm", "start"]
