/**
 * main.js - 应用程序入口文件
 * 
 * 该文件负责初始化Vue应用程序，导入全局样式和插件，
 * 并将应用程序挂载到DOM中。
 * 
 * @version 1.0.0
 * @module main
 */

// 导入全局样式
import './assets/main.css'

// 导入Vue核心和应用组件
import { createApp } from 'vue'
import App from './App.vue'

// 导入Element Plus UI库及其样式
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

/**
 * 创建Vue应用实例
 * @constant {Object} app - Vue应用实例
 */
const app = createApp(App)

// 注册Element Plus插件
app.use(ElementPlus)

// 将应用挂载到DOM中
app.mount('#app')
