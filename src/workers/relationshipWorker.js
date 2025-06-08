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
    // Check the action type
    if (data.action === 'visualizeChain') {
      // Process chain visualization
      const result = visualizeRelationChain(data);
      
      // Send the result back to the main thread
      self.postMessage({
        type: 'chainVisualization',
        result: result
      });
    } else {
      // Default action: calculate relationship
      const result = calculateRelationship(data);
      
      // Send the result back to the main thread
      self.postMessage({
        type: 'result',
        result: result
      });
    }
  } catch (error) {
    // Send any errors back to the main thread
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
 * @returns {Object} 邻接表形式的关系图
 */
function buildRelationshipGraph(nodes, edges) {
  const graph = {};
  
  // Initialize graph
  nodes.forEach(node => {
    graph[node.id] = [];
  });
  
  // Add edges
  edges.forEach(edge => {
    graph[edge.from].push(edge.to);
    // Add reverse edge for bidirectional search
    graph[edge.to].push(edge.from);
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
  const pathSet = new Set(); // For detecting duplicate paths
  
  /**
   * 深度优先搜索辅助函数
   * @param {string} current - 当前节点ID
   * @param {Array} path - 当前路径
   * @param {number} depth - 当前深度
   * @param {Set} currentVisited - 当前路径中已访问的节点集合
   */
  function dfs(current, path, depth, currentVisited = new Set()) {
    // if (depth > maxDepth) return;
    if (current !== start && current !== end && currentVisited.has(current)) return;
    currentVisited.add(current);
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
  
  // Build relationship graph
  const graph = buildRelationshipGraph(nodesData, edgesData);
  
  // Find all possible paths
  const paths = findAllPaths(graph, toNode.id, fromNode.id);
  
  if (paths.length === 0) {
    return {
      error: '未找到两人之间的关系链'
    };
  }
  
  // Convert paths to relationship chains
  const chains = paths.map(path => {
    const relationChain = [];
    if (path.length > 1) {
      for (let i = 0; i < path.length - 1; i++) {
        const fromId = path[i + 1];
        const toId = path[i];
        const fromNode = nodesData.find(n => n.id === fromId);
        const toNode = nodesData.find(n => n.id === toId);
        
        // Find edge from fromId to toId
        let edge = edgesData.find(e => e.from === fromId && e.to === toId);
        let isReverse = false;
        
        // If not found, try reverse edge
        if (!edge) {
          edge = edgesData.find(e => e.from === toId && e.to === fromId);
          isReverse = true;
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
  
  // Calculate titles using relationship.js
  let forwardTitle = [];
  let reverseTitle = [];
  let allChains = [];
  
  try {
    // Calculate titles for all paths
    allChains = chains.map(chain => {
      const relationText = buildRelationText(chain);
      return {
        forward: relationship({ text: relationText, sex: fromNode.gender }),
        reverse: relationship({ text: relationText, reverse: true, sex: toNode.gender })
      };
    });
    
    // Format as display text
    forwardTitle = allChains.map(c => c.forward.join('/'));
    reverseTitle = allChains.map(c => c.reverse.join('/'));
  } catch (error) {
    console.error('计算称谓出错:', error);
    forwardTitle = ['无法计算'];
    reverseTitle = ['无法计算'];
  }
  
  // Format chain descriptions
  const formattedChains = chains.map((chain, index) => {
    let chainDescription = '';
    if (chain.length > 0) {
      const firstItem = chain[0];
      chainDescription = firstItem.to + `是${chain[chain.length - 1].from}的`;
      for (let i = 0; i < chain.length; i++) {
        if (i < chain.length - 1) {
          chainDescription += chain[i].relation + "的";
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
 * @param {Object} data.from - 起始人物节点
 * @param {Object} data.to - 目标人物节点
 * @param {string} data.chain - JSON字符串形式的关系链数据
 * @returns {Object} 可视化数据，包含节点和边
 */
function visualizeRelationChain(data) {
  const { nodes: nodesData, from, to } = data;
  const chain = JSON.parse(data.chain);
  // Get the raw chain data
  const rawChain = chain.rawChain;
  if (!rawChain || rawChain.length === 0) {
    throw new Error('关系链数据不完整');
  }
  
  // Build relation chain network data
  const chainNodes = [];
  const chainEdges = [];
  
  // Track inserted nodes to avoid duplicates
  const insertedNodes = new Set();
  
  // Add starting node
  const fromNode = nodesData.find(n => n.id === from.id);
  if (!fromNode) {
    throw new Error('找不到起始节点');
  }
  
  chainNodes.push({
    id: fromNode.id,
    label: fromNode.name,
    shape: fromNode.shape || 'circle',
    image: fromNode.image,
    color: fromNode.color
  });
  insertedNodes.add(fromNode.id);
  
  // Add intermediate nodes and edges
  for (let i = 0; i < rawChain.length; i++) {
    const item = rawChain[i];
    const toNode = nodesData.find(n => n.id === item.toId);
    
    if (!toNode) {
      console.warn(`找不到节点ID: ${item.toId}`);
      continue;
    }
    
    // Add node if not already added
    if (!insertedNodes.has(toNode.id)) {
      chainNodes.push({
        id: toNode.id,
        label: toNode.name,
        shape: toNode.shape || 'circle',
        image: toNode.image,
        color: toNode.color
      });
      insertedNodes.add(toNode.id);
    }
    
    // Add edge
    chainEdges.push({
      id: item.edgeId,
      from: item.isReverse ? item.toId : item.fromId,
      to: item.isReverse ? item.fromId : item.toId,
      label: item.relation
    });
  }
  
  return {
    chainNodes,
    chainEdges
  };
}