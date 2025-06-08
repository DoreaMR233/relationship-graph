// importWorker.js - 处理关系图导入的Web Worker

/**
 * 监听主线程发送的消息
 * 处理关系图导入操作
 * @listens message - Web Worker消息事件
 */
self.addEventListener('message', function(e) {
  const data = e.data;
  
  if (data.action === 'importGraph') {
    try {
      // 解析JSON数据
      const graphData = JSON.parse(data.fileContent);
      
      // 验证数据格式
      if (!graphData.nodes || !graphData.edges || !Array.isArray(graphData.nodes) || !Array.isArray(graphData.edges)) {
        throw new Error('无效的关系图数据格式');
      }
      
      // 验证文件是否为人物关系图
      if (!isValidRelationshipGraph(graphData)) {
        throw new Error('不是有效的人物关系图文件');
      }
      
      // 发送成功消息给主线程
      self.postMessage({
        type: 'success',
        result: graphData
      });
    } catch (error) {
      // 发送错误消息给主线程
      self.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }
});

/**
 * 验证数据是否为有效的人物关系图
 * 检查数据结构、节点和边的必要属性
 * @param {Object} data - 要验证的关系图数据
 * @param {Array} data.nodes - 节点数组
 * @param {Array} data.edges - 边数组
 * @returns {boolean} 是否为有效的人物关系图
 */
function isValidRelationshipGraph(data) {
  // 检查数据结构
  if (!data || !Array.isArray(data.nodes) || !Array.isArray(data.edges)) {
    return false;
  }
  
  // 检查节点数据
  for (const node of data.nodes) {
    if (!node.id || !node.label || node.gender === undefined) {
      return false;
    }
  }
  
  // 检查边数据
  for (const edge of data.edges) {
    if (!edge.id || !edge.from || !edge.to || !edge.label) {
      return false;
    }
  }
  
  return true;
}