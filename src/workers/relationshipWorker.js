// relationshipWorker.js - 处理人物关系计算的Web Worker

import relationship from 'relationship.js';

/**
 * 主要的 Web Worker 事件监听器
 * 处理关系计算和关系链可视化请求
 * @listens message - Web Worker消息事件
 */
self.addEventListener('message', function(e) {
  const data = e.data;
  
  try {
    // 检查操作类型
    if (data.action === 'visualizeChain') {
      // 处理关系链可视化
      const result = visualizeRelationChain(data);
      
      // 将结果发送回主线程
      self.postMessage({
        type: 'chainVisualization',
        result: result
      });
    } else {
      // 默认操作：计算人物关系
      const result = calculateRelationship(data);
      
      // 将结果发送回主线程
      self.postMessage({
        type: 'result',
        result: result
      });
    }
  } catch (error) {
    // 将错误发送回主线程
    self.postMessage({
      type: 'error',
      error: error.message
    });
  }
});

/**
 * 从节点和边构建关系图
 * @param {Array} nodes - 节点数组
 * @param {Array} edges - 边数组
 * @param {boolean} isReverse - 是否反向构建图，默认为false
 * @returns {Object} 邻接表形式的关系图
 */
function buildRelationshipGraph(nodes, edges, isReverse = false) {
  const graph = {};
  
  // 初始化图结构
  nodes.forEach(node => {
    graph[node.id] = [];
  });
  
  // 添加边
  edges.forEach(edge => {
    if(isReverse){
      graph[edge.from].push(edge.to);
      // 为双向搜索添加反向边
      graph[edge.to].push(edge.from);
    }else{
      graph[edge.from].push(edge.from);
      graph[edge.to].push(edge.to);
    }
  });
  
  return graph;
}

/**
 * 查找起始节点和终止节点之间的所有路径
 * 使用深度优先搜索算法
 * @param {Object} graph - 邻接表形式的关系图
 * @param {string} start - 起始节点ID
 * @param {string} end - 终止节点ID
 * @param {number} maxDepth - 最大搜索深度，默认为5
 * @returns {Array} 所有可能路径的数组
 */
function findAllPaths(graph, start, end, maxDepth = 5) {
  const paths = [];
  const pathSet = new Set(); // 用于检测重复路径
  
  /**
   * 深度优先搜索辅助函数
   * @param {string} current - 当前节点ID
   * @param {Array} path - 当前路径
   * @param {number} depth - 当前深度
   * @param {Set} currentVisited - 当前路径中已访问的节点集合
   */
  function dfs(current, path, depth, currentVisited = new Set()) {
    // if (depth > maxDepth) return;
    // if (current !== start && current !== end && currentVisited.has(current)) return;
    if (currentVisited.has(current)) return;
    // 保证起始节点和终止节点只被访问一次
    if(current !== end){
      currentVisited.add(current);
    }else if(depth >0){
      currentVisited.add(current);
    }
    path.push(current);
    
    if (current === end) {
      const pathStr = path.join(',');
      if (!pathSet.has(pathStr)) {
        pathSet.add(pathStr);
        paths.push([...path]);
      }
    }
    
    if (start === end || current !== end) {
      for (const neighbor of graph[current]) {
        // if (depth < maxDepth) { // 通过深度限制防止无限循环
        //   dfs(neighbor, path, depth + 1,currentVisited);
        // }
        dfs(neighbor, path, depth + 1, currentVisited);
      }
    }
    
    path.pop();
    currentVisited.delete(current);
  }
  
  dfs(start, [], 0);
  return paths;
}

/**
 * 构建用于relationship.js的关系文本
 * @param {Array} chain - 关系链数组
 * @returns {string} 格式化的关系文本
 */
function buildRelationText(chain) {
  const relationParts = [];
  
  for (const item of chain) {
    const relation = mapRelationToStandard(item.relation);
    if (relation) {
      relationParts.push(relation);
    }
  }
  
  return relationParts.join('的');
}

/**
 * 将自定义关系映射到标准关系
 * @param {string} relation - 自定义关系名称
 * @returns {string} 标准关系名称
 */
function mapRelationToStandard(relation) {
  const relationMap = {
    '父亲': '爸爸',
    '母亲': '妈妈',
    '儿子': '儿子',
    '女儿': '女儿',
    '丈夫': '老公',
    '妻子': '老婆',
    '兄弟': '兄弟',
    '姐妹': '姐妹',
    '哥哥': '哥哥',
    '弟弟': '弟弟',
    '姐姐': '姐姐',
    '妹妹': '妹妹'
  };
  
  return relationMap[relation] || relation;
}

/**
 * 根据年龄获取准确称谓
 * @param {Object} from - 起始人物节点
 * @param {Object} to - 结束人物节点
 * @param {Array} relationshipText - 通过relationship.js计算得出的称谓数组
 * @returns {Array} 准确称谓数组
 */
function getAccurateRelation(from, to, relationshipText){
  const accurateRelationText = [];
  if(relationshipText.length === 0){
    accurateRelationText.push("无法计算") ;
  }else if(from.id === to.id && relationshipText.length === 3 && relationshipText[2] === "自己"){
    accurateRelationText.push(relationshipText[2]);
  }else if(relationshipText.length > 1){
    if(from.age > to.age){
      accurateRelationText.push(relationshipText[0]);
    }else if(from.age < to.age){
      accurateRelationText.push(relationshipText[1]);
    }else if(from.age === to.age){
      accurateRelationText.push(relationshipText[0]);
      accurateRelationText.push(relationshipText[1]);
    }
  }else{
    relationshipText.map(c => accurateRelationText.push(c))
  }
  return accurateRelationText;
}

/**
 * 主要的关系计算函数
 * 计算两个人物节点之间的所有可能关系
 * @param {Object} data - 输入数据
 * @param {Object} data.fromNode - 起始人物节点
 * @param {Object} data.toNode - 目标人物节点
 * @param {Array} data.nodesData - 所有节点数据
 * @param {Array} data.edgesData - 所有边数据
 * @returns {Object} 计算结果，包含关系链和称谓
 */
function calculateRelationship(data) {
  const { fromNode, toNode, nodesData, edgesData } = data;
  
  // 构建关系图
  const graph = buildRelationshipGraph(nodesData, edgesData, true);
  
  // 查找所有可能的路径
  const paths = findAllPaths(graph, toNode.id, fromNode.id);
  
  if (paths.length === 0) {
    return {
      error: '未找到两人之间的关系链'
    };
  }
  
  // 将路径转换为关系链
  const chains = paths.map(path => {
    const relationChain = [];
    if (path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        const fromId = path[i];
        const toId = path[i + 1];
        const fromNode = nodesData.find(n => n.id === fromId);
        const toNode = nodesData.find(n => n.id === toId);
        
        // 查找从toId到fromId的边
        let edge = edgesData.find(e => e.from === toId && e.to === fromId);
        let isReverse = true;
        
        // 如果没找到，尝试查找反向边
        if (!edge) {
          edge = edgesData.find(e => e.from === fromId && e.to === toId);
          isReverse = false;
        }
        
        if (edge) {
          relationChain.push({
            from: fromNode.name,
            to: toNode.name,
            relation: edge.label,
            fromId: fromId,
            toId: toId,
            edgeId: edge.id,
            isReverse: isReverse
          });
        }
      }
    } else {
      const fromId = path[0];
      const toId = path[0];
      const fromNode = nodesData.find(n => n.id === fromId);
      const toNode = nodesData.find(n => n.id === toId);

      relationChain.push({
        from: fromNode.name,
        to: toNode.name,
        relation: "自己",
        fromId: fromId,
        toId: toId,
        edgeId: null,
        isReverse: false
      });
    }
    return relationChain;
  });
  // 使用relationship.js计算称谓
  let forwardTitle = [];
  let reverseTitle = [];
  let allChains = [];
  
  try {
    // 计算所有路径的称谓
    allChains = chains.map(chain => {
      // 由于关系链是从结束节点到起始节点的顺序，所以在计算称谓时正向称谓要开启翻转，反向称谓不需要翻转
      const relationText = buildRelationText(chain);
      let forwardName = relationship({ text: relationText, reverse: true, sex: fromNode.gender });
      forwardName = getAccurateRelation(toNode, fromNode, forwardName);
      let reverseName = relationship({ text: relationText, reverse: false, sex: fromNode.gender });
      reverseName = getAccurateRelation(fromNode, toNode, reverseName);
      return {
        forward: forwardName,
        reverse: reverseName
      };
    });
    // 格式化为显示文本
    forwardTitle = allChains.map(c => c.forward.join('/'));
    reverseTitle = allChains.map(c => c.reverse.join('/'));
  } catch (error) {
    console.error('计算称谓出错:', error);
    forwardTitle = ['无法计算'];
    reverseTitle = ['无法计算'];
  }
  // 格式化关系链描述
  const formattedChains = chains.map((chain, index) => {
    let chainDescription = '';
    
    if (chain.length > 0) {
      // 关系链是从结束节点到起始节点的顺序，所以需要调整顺序
      chainDescription = chain[chain.length - 1].to + `是${chain[0].from}的`;
      for (let i = 0; i < chain.length; i++) {
        if (i < chain.length - 1) {
          chainDescription += chain[i].relation + `（${chain[i].to}）的`;
        } else {
          chainDescription += chain[i].relation;
        }
      }
    }
    
    return {
      index,
      chain: chainDescription,
      forward: forwardTitle[index],
      reverse: reverseTitle[index],
      rawChain: chain
    };
  });
  
  return {
    from: fromNode,
    to: toNode,
    chains: formattedChains,
    forwardTitle: forwardTitle,
    reverseTitle: reverseTitle
  };
}

/**
 * 可视化关系链函数
 * 将关系链数据转换为网络图可视化数据
 * @param {Object} data - 输入数据
 * @param {Array} data.nodes - 所有节点数据
 * @param {Array} data.edges - 所有边数据
 * @param {string} data.chain - JSON字符串形式的关系链数据
 * @returns {Object} 可视化数据，包含节点和边
 */
function visualizeRelationChain(data) {
  const chain = JSON.parse(data.chain);
  const nodesData = data.nodes;
  const edgesData = data.edges;
  // 获取原始关系链数据
  const rawChain = chain.rawChain;
  if (!rawChain || rawChain.length === 0) {
    throw new Error('关系链数据不完整');
  }
  // 构建关系链网络数据
  const chainNodes = [];
  const chainEdges = [];
  
  // 跟踪已插入的节点以避免重复
  const insertedNodes = new Set();
  
  // 添加起始节点
  const fromNode = nodesData.find(n => n.id === rawChain[0].fromId);
  if (!fromNode) {
    throw new Error('找不到起始节点');
  }
  
  chainNodes.push(fromNode);
  insertedNodes.add(fromNode.id);
  
  if(rawChain.length > 1){
    // 添加中间节点和边
    for (let i = 0; i < rawChain.length; i++) {
      const toNode = nodesData.find(n => n.id === rawChain[i].toId);
      
      if (!toNode) {
        console.warn(`找不到节点ID: ${rawChain[i].toId}`);
        continue;
      }
      
      // 如果节点尚未添加，则添加节点
      if (!insertedNodes.has(toNode.id)) {
        chainNodes.push(toNode);
        insertedNodes.add(toNode.id);
      }
      
      // 添加边
      const edge = edgesData.find(n => n.id === rawChain[i].edgeId);
      chainEdges.push(edge);
    }
  }else{
    const edge = {
      id: null,
      from: rawChain[0].fromId,
      to: rawChain[0].toId,
      label: rawChain[0].relation
    }
    chainEdges.push(edge);
  }
  
  return {
    chainNodes,
    chainEdges
  };
}