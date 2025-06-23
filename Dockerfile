# 使用Node.js官方镜像作为构建环境
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制包管理文件
COPY package*.json ./

# 安装项目依赖
RUN npm install

# 复制项目文件
COPY . .

ARG VITE_BASE_PATH
RUN if [ -f .env ]; then \
    sed -i "/^VITE_BASE_PATH=/c\VITE_BASE_PATH=$VITE_BASE_PATH" .env; \
    fi

# 构建生产版本，使用.env文件中的配置
RUN npm run build

# 使用Nginx作为生产服务器
FROM nginx:alpine

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制启动脚本
COPY docker-entrypoint.sh /docker-entrypoint.sh

# 确保脚本可执行
RUN chmod +x /docker-entrypoint.sh

# 暴露端口
EXPOSE 80

# 使用启动脚本替代直接启动Nginx
ENTRYPOINT ["/docker-entrypoint.sh"]

# 启动Nginx服务
CMD ["nginx", "-g", "daemon off;"]