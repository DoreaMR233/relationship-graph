# 人物关系图制作器 Docker 部署指南

本文档提供了使用 Docker 部署人物关系图制作器应用的详细说明，包括一体化 Dockerfile 和 Docker Compose 两种部署方式。

## 目录

- [前提条件](#前提条件)
- [项目结构](#项目结构)
- [使用 Docker Compose 部署](#使用-docker-compose-部署)
- [使用 Docker Run 部署](#使用-docker-run-部署)
- [配置参数](#配置参数)
  - [配置文件变量](#配置文件变量)
- [常见问题](#常见问题)

## 前提条件

在开始部署人物关系图制作器之前，请确保您的系统满足以下要求：

1. 已安装 Docker（推荐 20.10.0 或更高版本）
2. 已安装 Docker Compose（如果使用 Docker Compose 部署，推荐 2.0.0 或更高版本）
3. 可用的网络连接（用于拉取 Docker 镜像）
4. 至少 512MB 可用内存
5. 至少 1GB 可用磁盘空间

## 项目结构

人物关系图制作器的 Docker 相关文件结构如下：

```text
├── docker/               # Docker部署相关文件
│   ├── Dockerfile            # Docker 镜像构建文件
│   ├── docker-compose.yml    # Docker Compose 配置文件
│   ├── docker-entrypoint.sh  # 容器启动脚本
│   ├── nginx.conf            # Docker容器中Nginx的配置文件
│   └── Docker.md             # Docker部署指南
└── .env.example          # 环境变量示例文件
```

## 使用 Docker Compose 部署

使用 Docker Compose 是部署人物关系图制作器最简单的方法，特别适合需要管理多个容器或需要简化部署流程的场景。

### 步骤 1：准备环境变量

复制项目中的 `.env.example` 文件为 `.env`，并根据需要修改其中的配置：

```bash
cp .env.example .env
# 然后编辑 .env 文件，设置所需的环境变量
```

### 步骤 2：启动服务

```bash
# 构建并启动容器
docker-compose up -d

# 如果需要重新构建
docker-compose up -d --build
```

### 步骤 3：访问应用

- 不设置前缀时：在浏览器中打开 `http://localhost:80`（或在 .env 中配置的端口）
- 设置前缀时：在浏览器中打开 `http://localhost:80/your_path_prefix`

### 步骤 4：停止服务

```bash
docker-compose down
```

## 使用 Docker Run 部署

如果您不需要 Docker Compose 的复杂功能，可以直接使用 Docker 命令来部署应用。

### 步骤 1：构建 Docker 镜像

```bash
docker build -t relationship-graph .
```

### 步骤 2：运行 Docker 容器

```bash
# 不设置资源路径前缀
docker run -d -p 80:80 --name relationship-graph relationship-graph

# 设置资源路径前缀为 "app"
docker run -d -p 80:80 -e VITE_BASE_PATH=app --name relationship-graph relationship-graph
```

### 步骤 3：访问网站

- 不设置前缀时：在浏览器中打开 `http://localhost:80`
- 设置前缀为 "app" 时：在浏览器中打开 `http://localhost:80/app`

### 步骤 4：停止和删除容器

```bash
docker stop relationship-graph
docker rm relationship-graph
```

## 配置参数

### 配置文件变量

**VITE_BASE_PATH 参数优先级（从高到低）：**

1. **环境变量指定** - 最高优先级，会覆盖其他所有配置
   - 使用 `docker run -e VITE_BASE_PATH=xxx` 或 `docker-compose.yml environment` 指定
2. **docker-compose.yml 中的 args** - 构建参数，优先级次之
   - 在 `docker-compose.yml` 的 `build.args` 中指定
3. **.env 文件中的配置** - 默认配置，优先级最低
   - 在 `.env` 文件中设置 `VITE_BASE_PATH=xxx`

以下是可用的配置变量：

| 变量名称           | 变量中文名  | 变量作用                   | 变量默认值  |
|----------------|--------|------------------------|--------|
| VITE_BASE_PATH | 资源路径前缀 | 配置应用的资源路径前缀，用于在子目录部署应用 | 空（无前缀） |

## 常见问题

### 1. 容器启动但无法访问应用

**问题**：Docker 容器成功启动，但无法在浏览器中访问应用。

**解决方案**：

- 检查端口映射是否正确（`docker ps` 查看）
- 确认防火墙设置允许访问映射的端口
- 检查容器日志（`docker logs relationship-graph`）查找错误信息

### 2. 资源路径前缀配置不生效

**问题**：设置了 `VITE_BASE_PATH`，但应用仍然无法正确加载资源。

**解决方案**：

- 确保在构建镜像时已正确设置 `VITE_BASE_PATH`
- 如果使用预构建镜像，确保在运行容器时通过环境变量传递了 `VITE_BASE_PATH`
- 检查 `.env` 文件中的配置是否正确

### 3. 镜像构建失败

**问题**：执行 `docker build` 命令时构建失败。

**解决方案**：

- 确保 Docker 守护进程正在运行
- 检查系统资源（磁盘空间、内存）是否充足
- 尝试使用 `--no-cache` 选项重新构建：`docker build --no-cache -t relationship-graph .`

### 4. Docker Compose 启动失败

**问题**：执行 `docker-compose up` 命令时启动失败。

**解决方案**：

- 确保 Docker Compose 已正确安装
- 检查 `docker-compose.yml` 文件语法是否正确
- 尝试使用 `docker-compose up --force-recreate` 强制重新创建容器
