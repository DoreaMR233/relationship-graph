#!/bin/sh

# 设置错误时退出
set -e

# 定义HTML文件路径
HTML_DIR="/usr/share/nginx/html"
HTML_FILE="$HTML_DIR/index.html"

# 检查是否设置了BASE_PATH环境变量
if [ -n "$BASE_PATH" ]; then
  echo "Configuring resource path prefix: /$BASE_PATH/"
  
  # 使用sed替换index.html中的所有资源路径前缀
  # 将"/assets/替换为/$BASE_PATH/assets/
  sed -i "s|/assets/|/$BASE_PATH/assets/|g" $HTML_FILE
  
  # 替换CSS和JS文件中的资源路径
  if [ -d "$HTML_DIR/assets" ]; then
    # 查找所有CSS和JS文件
    find "$HTML_DIR/assets" -type f \( -name "*.css" -o -name "*.js" \) | while read -r file; do
      # 替换文件中的资源路径
      sed -i "s|/assets/|/$BASE_PATH/assets/|g" "$file"
    done
  fi
  
  echo "资源路径前缀配置成功"
else
  echo "未设置BASE_PATH环境变量，将使用默认路径"
fi

# 执行CMD命令（启动Nginx）
exec "$@"