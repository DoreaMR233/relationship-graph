# 人物关系图制作器 (Relationship Graph)

一个基于Vue 3和vis-network的交互式人物关系图制作工具，可以创建、编辑、计算和可视化人物之间的关系网络。

## 目录

- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [API接口](#api接口)
- [使用说明](#使用说明)
  - [本地部署](#本地部署)
  - [Docker部署](#docker部署)
  - [配置文件说明](#配置文件说明)
- [功能描述](#功能描述)
  - [基本操作指南](#基本操作指南)
  - [显示说明](#显示说明)
- [许可证](#许可证)

## 项目结构

```
├── src/                  # 源代码目录
│   ├── assets/           # 静态资源
│   ├── components/       # 组件
│   │   └── RelationshipGraph.vue  # 关系图主组件
│   ├── workers/          # Web Workers
│   │   ├── importWorker.js        # 导入处理
│   │   └── relationshipWorker.js  # 关系计算
│   ├── App.vue           # 主应用组件
│   └── main.js           # 应用入口
├── public/               # 公共资源目录
├── img/                  # 图片资源
├── Dockerfile            # Docker镜像构建文件
├── docker-compose.yml    # Docker Compose配置
├── docker-entrypoint.sh  # Docker容器启动脚本
├── .env.example          # 环境变量示例
└── vite.config.js        # Vite配置文件
```

## 技术栈

- **前端框架**: Vue 3 - 提供响应式UI和组件化开发
- **构建工具**: Vite - 提供快速的开发服务器和优化的构建
- **UI组件库**: Element Plus - 提供丰富的UI组件
- **可视化库**: vis-network - 提供网络图可视化功能
- **关系计算**: relationship.js - 提供中文人物关系计算
- **并行计算**: Web Workers - 处理复杂计算而不阻塞UI
- **容器化**: Docker - 提供一致的部署环境

## API接口

本项目是一个纯前端应用，不依赖后端API。所有数据处理和计算都在浏览器中完成。主要功能通过以下内部模块实现：

- **关系计算模块**: 使用relationship.js库计算人物之间的关系链
- **图形渲染模块**: 使用vis-network库渲染关系网络图
- **数据导入导出**: 支持JSON格式的关系图数据导入导出

## 使用说明

### 本地部署

1. 克隆项目

   ```bash
   git clone <repository-url>
   cd relationship-graph
   ```

2. 安装依赖

   ```bash
   npm install
   ```

3. 开发环境运行

   ```bash
   npm run dev
   ```

4. 构建生产版本

   ```bash
   npm run build
   ```

### Docker部署

本项目支持使用Docker进行部署，详细说明请参考[Docker部署指南](./Docker.md)。

简要步骤：

1. 使用Docker Compose部署（推荐）

   ```bash
   # 构建并启动容器
   docker-compose up -d
   ```

2. 使用Docker命令部署

   ```bash
   # 构建Docker镜像
   docker build -t relationship-graph .
   
   # 运行Docker容器
   docker run -d -p 80:80 relationship-graph
   ```

### 配置文件说明

#### .env 文件

`.env`文件用于配置应用的环境变量，主要包含：

```
# 资源路径前缀配置
# 如果需要在子目录下部署应用，请设置此值，填写时不要带上前后斜杠
# 例如：VITE_BASE_PATH=app 将使应用在 /app/ 路径下可访问
VITE_BASE_PATH=
```

#### docker-compose.yml

`docker-compose.yml`文件定义了Docker Compose的服务配置：

```yaml
services:
  relationship-graph:
    build:
      context: .
      dockerfile: Dockerfile
      args:
        # 资源路径前缀，可选，默认为空，填写时不要带上前后斜杠
        - VITE_BASE_PATH=
    image: relationship-graph
    container_name: relationship-graph
    ports:
      - "9582:80"
    environment:
      - VITE_BASE_PATH=${VITE_BASE_PATH:-}
    restart: always
```

#### docker-entrypoint.sh

`docker-entrypoint.sh`是Docker容器的入口脚本，主要功能：

- 加载`.env`文件中的环境变量
- 配置资源路径前缀
- 启动Nginx服务器

## 功能描述

### 基本操作指南

1. **创建节点**  
   点击"创建节点"按钮，在弹出框中填写人物的姓名、性别、年龄、描述、头像图片URL，点击"确定"按钮进入创建节点模式，然后点击画布空白处在鼠标光标处创建人物节点。

2. **修改/删除节点**  
   右击人物节点可以选择修改人物节点信息或删除人物节点。

3. **创建关系**  
   点击"创建关系"按钮进入创建关系模式，依次点击人物节点A和人物节点B，在弹出框中填写关系名称，点击"确定"按钮创建人物节点间关系。（A为关系起点，B为关系终点，关系名称应为"B对A的称谓"）

4. **修改/删除关系**  
   点击关系线可以选择修改关系或删除关系。

5. **文件操作**  
   页面上有新建（清空当前人物关系图）、导出（将当前关系图导出为JSON文件）、导入（选择JSON文件，判断文件是否为人物关系图，如果是则清空当前人物关系图，并根据JSON文件绘制人物关系图。如果不是则弹出错误警告）按钮。

6. **视图控制**  
   页面上有放大、缩小、适应屏幕按钮，用于调节人物关系图大小。

7. **计算人物关系**  
   点击"计算人物关系"按钮进入计算人物关系模式，依次点击人物节点A和人物节点B，在弹出框中查看A和B之间的所有关系链及称谓。点击某一条关系链时，会显示此条关系链的关系图。

8. **撤销/恢复**  
   使用前一步和后一步按钮可以撤销和恢复操作。

### 显示说明

- 人物节点为圆形，在人物节点下方显示人物姓名。
- 如果有头像图片URL，则圆形内填充头像图片，否则为纯色。
- 人物节点间关系线显示箭头，并在关系线中间显示关系名称。

## 许可证

本项目采用[MIT许可证](./LICENSE)。
