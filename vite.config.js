/**
 * vite.config.js - Vite构建工具配置文件
 * 
 * 该文件配置Vite构建工具的行为，包括插件、路径别名等。
 * 详细文档: https://vite.dev/config/
 */

// 导入Node.js URL模块，用于处理文件路径
import { fileURLToPath, URL } from 'node:url'

// 导入Vite核心API和插件
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'        // Vue 3支持插件
import vueDevTools from 'vite-plugin-vue-devtools'  // Vue开发工具插件

// 获取环境变量中的VITE_BASE_PATH，如果未设置则默认为空字符串
const basePath = import.meta.env.VITE_BASE_PATH || '';

// Vite配置
export default defineConfig({
  plugins: [
    vue(),                // 启用Vue 3支持
    vueDevTools(),       // 启用Vue开发者工具
  ],
  base: basePath ? `/${basePath}/` : '/',  // 设置资源基础路径
  resolve: {
    alias: {
      // 设置@别名指向src目录，方便导入
      '@': fileURLToPath(new URL('./src', import.meta.url))
    },
  },
})
