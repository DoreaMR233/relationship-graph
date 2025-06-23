#!/bin/sh

# 设置错误时退出
set -e

# 定义HTML文件路径
HTML_DIR="/usr/share/nginx/html"
HTML_FILE="$HTML_DIR/index.html"

# 检查是否设置了VITE_BASE_PATH环境变量
# if [ -n "$VITE_BASE_PATH" ]; then
#   #  echo "正在配置资源路径前缀: /$VITE_BASE_PATH/"
  
#   # 使用sed替换index.html中的所有资源路径前缀
#   # 将"/assets/替换为/$VITE_BASE_PATH/assets/
#   sed -i "s|/assets/|/$VITE_BASE_PATH/assets/|g" $HTML_FILE
  
#   # 替换CSS和JS文件中的资源路径
#   if [ -d "$HTML_DIR/assets" ]; then
#     # 查找所有CSS和JS文件
#     find "$HTML_DIR/assets" -type f \( -name "*.css" -o -name "*.js" \) | while read -r file; do
#       # 替换文件中的资源路径
#       sed -i "s|/assets/|/$VITE_BASE_PATH/assets/|g" "$file"
#     done
#   fi
  
#   echo "资源路径前缀配置成功"
# else
#   echo "未设置VITE_BASE_PATH环境变量，将使用默认路径"
# fi

# 定义环境变量文件路径
ENV_FILE="/app/.env"

# 加载.env文件中的环境变量
if [ -f "$ENV_FILE" ]; then
  echo "正在加载 .env 文件中的环境变量..."
  # 创建临时文件，过滤掉注释行和空行
  grep -v "^#" "$ENV_FILE" | grep -v "^$" > /tmp/env_vars
  while IFS="=" read -r key value; do
    # 去除可能的引号
    value=$(echo $value | sed -e "s/^[\"\']//" -e "s/[\"\']$//")
    # 导出环境变量
    export "$key=$value"
    echo "从 .env 加载: $key=$value"
  done < /tmp/env_vars
  rm /tmp/env_vars
fi
# 显示资源路径前缀
echo "资源路径前缀: $VITE_BASE_PATH"

# 显示启动信息
echo "启动Nginx服务器..."

# 执行CMD命令（启动Nginx）
exec "$@"