<!--
 App.vue - 应用程序主组件
 
 该组件是整个应用的根组件，负责组织应用的整体结构。
 它包含应用标题和主要的人物关系图组件。
 
 @version 1.0.0
 @component App
-->

<template>
  <div class="app-container">
    <h1 class="app-title">人物关系图制作器</h1>
    <RelationshipGraph />
  </div>
</template>

<script setup>
/**
 * 导入RelationshipGraph组件
 * 该组件是应用的核心功能组件，负责人物关系图的创建、编辑和可视化
 */
import RelationshipGraph from './components/RelationshipGraph.vue';
</script>

<style>
/* 全局样式 */
body {
  margin: 0;
  padding: 0;
  font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  background-color: #f5f7fa;
  color: #2c3e50;
}

/* 应用容器样式 */
.app-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

/* 标题样式 */
.app-title {
  color: #409EFF;
  margin-bottom: 20px;
  text-align: center;
}
</style>
