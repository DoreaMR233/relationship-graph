<template>
  <div class="relationship-graph-container">
    <div class="toolbar">
      <div class="toolbar-row">
        <el-button-group>
          <el-button type="primary" @click="handleNewGraph">新建</el-button>
          <el-button type="primary" @click="handleExport">导出</el-button>
          <el-button type="primary" @click="handleImport">导入</el-button>
        </el-button-group>
        
        <el-button-group>
          <el-button type="primary" @click="handleCreateNode">创建节点</el-button>
          <el-button type="primary" @click="handleCreateRelation">创建关系</el-button>
          <el-button type="primary" @click="handleCalculateRelation">计算人物关系</el-button>
        </el-button-group>
      </div>

      <div class="toolbar-row">
        <el-button-group>
          <el-button type="primary" @click="handleZoomIn"><el-icon><ZoomIn /></el-icon></el-button>
          <el-button type="primary" @click="handleZoomOut"><el-icon><ZoomOut /></el-icon></el-button>
          <el-button type="primary" @click="handleFitScreen"><el-icon><FullScreen /></el-icon></el-button>
        </el-button-group>
        
        <el-button-group>
          <el-button type="primary" @click="showHelpDialog"><el-icon><QuestionFilled /></el-icon> 使用帮助</el-button>
        </el-button-group>

        <el-button-group>
          <el-button type="primary" @click="handleUndo" :disabled="!canUndo"><el-icon><Back /></el-icon></el-button>
          <el-button type="primary" @click="handleRedo" :disabled="!canRedo"><el-icon><Right /></el-icon></el-button>
        </el-button-group>
      </div>
    </div>
    
    <div ref="networkContainer" class="network-container"></div>
    
    <!-- 节点创建对话框 -->
    <el-dialog v-model="nodeDialogVisible" :title="nodeDialogType === 'create' ? '创建节点' : '编辑节点'" width="30%">
      <el-form :model="nodeForm" label-width="80px">
        <el-form-item label="姓名" required>
          <el-input v-model="nodeForm.name" placeholder="请输入姓名"></el-input>
        </el-form-item>
        <el-form-item label="性别">
          <el-radio-group v-model="nodeForm.gender">
            <el-radio :label="1">男</el-radio>
            <el-radio :label="0">女</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="年龄">
          <el-input-number v-model="nodeForm.age" :min="0" :max="150"></el-input-number>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="nodeForm.description" type="textarea" placeholder="请输入描述"></el-input>
        </el-form-item>
        <el-form-item label="头像URL">
          <el-input v-model="nodeForm.image" placeholder="请输入头像图片URL"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="nodeDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmNodeDialog">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 关系创建对话框 -->
    <el-dialog v-model="relationDialogVisible" :title="relationDialogType === 'create' ? '创建关系' : '编辑关系'" width="30%">
      <el-form :model="relationForm" label-width="80px">
        <el-form-item label="关系名称" required>
          <el-input v-model="relationForm.name" placeholder="请输入关系名称"></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="relationDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="confirmRelationDialog">确定</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 计算关系结果对话框 -->
    
<el-dialog v-model="calculateDialogVisible" title="人物关系计算结果" width="50%">
      <div v-if="calculateResult.from && calculateResult.to">
        <h3>{{ calculateResult.from.name }} 与 {{ calculateResult.to.name }} 的关系</h3>
        
        <el-table :data="calculateResult.chains" :max-height="calculateResult.chains?.length > 5 ? '300px' : null" style="width: 100%" @row-click="showRelationChain">
  <el-table-column prop="chain" label="关系链"></el-table-column>
  <el-table-column label="称谓" width="300">
    <template #default="{ row }">
      <div class="title-container">
        <div class="title-item">
          <span class="title-label">正向：</span>
          <el-tag type="success">{{ row.forward }}</el-tag>
        </div>
        <div class="title-item">
          <span class="title-label">反向：</span>
          <el-tag type="warning">{{ row.reverse }}</el-tag>
        </div>
      </div>
    </template>
  </el-table-column>
</el-table>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="calculateDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 关系链可视化对话框 -->
    <el-dialog v-model="chainDialogVisible" title="关系链可视化" width="60%">
      <div ref="chainNetworkContainer" class="chain-network-container"></div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="chainDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
    
    <!-- 文件上传组件 -->
    <input ref="fileInput" type="file" style="display: none" accept=".json" @change="handleFileSelected" />    
    
    <!-- 使用帮助对话框 -->
    <el-dialog v-model="helpDialogVisible" title="使用帮助" width="60%">
      <div class="help-content">
        <h3>基本操作指南</h3>
        <ol>
          <li>
            <strong>创建节点：</strong>
            <p>点击"创建节点"按钮，在弹出框中填写人物的姓名、性别、年龄、描述、头像图片URL，点击"确定"按钮进入创建节点模式，然后点击画布空白处在鼠标光标处创建人物节点。</p>
          </li>
          <li>
            <strong>修改/删除节点：</strong>
            <p>右击人物节点可以选择修改人物节点信息或删除人物节点。</p>
          </li>
          <li>
            <strong>创建关系：</strong>
            <p>点击"创建关系"按钮进入创建关系模式，依次点击人物节点A和人物节点B，在弹出框中填写关系名称，点击"确定"按钮创建人物节点间关系。（A为关系起点，B为关系终点）</p>
          </li>
          <li>
            <strong>修改/删除关系：</strong>
            <p>点击关系线可以选择修改关系或删除关系。</p>
          </li>
          <li>
            <strong>文件操作：</strong>
            <p>页面上有新建（清空当前人物关系图）、导出（将当前关系图导出为JSON文件）、导入（选择JSON文件，判断文件是否为人物关系图，如果是则清空当前人物关系图，并根据JSON文件绘制人物关系图。如果不是则弹出错误警告）按钮。</p>
          </li>
          <li>
            <strong>视图控制：</strong>
            <p>页面上有放大、缩小、适应屏幕按钮，用于调节人物关系图大小。</p>
          </li>
          <li>
            <strong>计算人物关系：</strong>
            <p>点击"计算人物关系"按钮进入计算人物关系模式，依次点击人物节点A和人物节点B，在弹出框中查看A和B之间的所有关系链及称谓。点击某一条关系链时，会显示此条关系链的关系图。</p>
          </li>
          <li>
            <strong>撤销/恢复：</strong>
            <p>使用前一步和后一步按钮可以撤销和恢复操作。</p>
          </li>
        </ol>
        
        <h3>显示说明</h3>
        <ul>
          <li>人物节点为圆形，在人物节点下方显示人物姓名。</li>
          <li>如果有头像图片URL，则圆形内填充头像图片，否则为纯色。</li>
          <li>人物节点间关系线显示箭头，并在关系线中间显示关系名称。</li>
        </ul>
      </div>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="helpDialogVisible = false">关闭</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue';
import { Network, DataSet } from 'vis-network/standalone';
import { saveAs } from 'file-saver';
import { ElMessage, ElMessageBox, ElLoading } from 'element-plus';
import { ZoomIn, ZoomOut, FullScreen, Back, Right, QuestionFilled } from '@element-plus/icons-vue';

// 网络图容器引用
/**
 * 主网络图容器的引用，用于渲染人物关系图
 * @type {import('vue').Ref<HTMLElement>}
 */
const networkContainer = ref(null);

/**
 * 关系链网络图容器的引用，用于渲染特定关系链的可视化
 * @type {import('vue').Ref<HTMLElement>}
 */
const chainNetworkContainer = ref(null);

/**
 * 文件输入元素的引用，用于导入关系图文件
 * @type {import('vue').Ref<HTMLInputElement>}
 */
const fileInput = ref(null);

// 网络图实例
/**
 * 主网络图实例，用于管理和操作人物关系图
 * @type {import('vis-network').Network}
 */
let network = null;

/**
 * 关系链网络图实例，用于展示特定关系链
 * @type {import('vis-network').Network}
 */
let chainNetwork = null;

// 数据集
/**
 * 节点数据集，存储所有人物节点
 * @type {import('vis-network').DataSet}
 */
let nodes = new DataSet([]);

/**
 * 边数据集，存储所有关系连接
 * @type {import('vis-network').DataSet}
 */
let edges = new DataSet([]);

// 历史记录
/**
 * 历史记录对象，用于实现撤销和重做功能
 * @type {Object}
 * @property {Array} past - 过去的状态记录
 * @property {Array} future - 未来的状态记录（用于重做）
 * @property {Object} current - 当前状态
 */
const history = reactive({
  past: [],
  future: [],
  current: { nodes: [], edges: [] }
});

// 计算属性
/**
 * 是否可以执行撤销操作
 * @type {import('vue').Ref<boolean>}
 */
const canUndo = ref(false);

/**
 * 是否可以执行重做操作
 * @type {import('vue').Ref<boolean>}
 */
const canRedo = ref(false);

// 模式状态
/**
 * 当前操作模式
 * @type {import('vue').Ref<string>}
 * @description 可能的值: 'normal', 'createNode', 'createRelation', 'calculateRelation'
 */
const mode = ref('normal'); // normal, createNode, createRelation, calculateRelation

// 对话框状态
/**
 * 节点对话框是否可见
 * @type {import('vue').Ref<boolean>}
 */
const nodeDialogVisible = ref(false);

/**
 * 节点对话框类型
 * @type {import('vue').Ref<string>}
 * @description 可能的值: 'create', 'edit'
 */
const nodeDialogType = ref('create'); // create, edit

/**
 * 节点表单数据
 * @type {Object}
 * @property {string|null} id - 节点ID，新建时为null
 * @property {string} name - 节点名称
 * @property {number} gender - 性别，1为男，0为女
 * @property {number} age - 年龄
 * @property {string} description - 描述
 * @property {string} image - 头像URL
 */
const nodeForm = reactive({
  id: null,
  name: '',
  gender: 1,
  age: 30,
  description: '',
  image: ''
});

/**
 * 关系对话框是否可见
 * @type {import('vue').Ref<boolean>}
 */
const relationDialogVisible = ref(false);

/**
 * 关系对话框类型
 * @type {import('vue').Ref<string>}
 * @description 可能的值: 'create', 'edit'
 */
const relationDialogType = ref('create'); // create, edit

/**
 * 关系表单数据
 * @type {Object}
 * @property {string|null} id - 关系ID，新建时为null
 * @property {string|null} from - 起始节点ID
 * @property {string|null} to - 目标节点ID
 * @property {string} name - 关系名称
 */
const relationForm = reactive({
  id: null,
  from: null,
  to: null,
  name: ''
});

/**
 * 帮助对话框是否可见
 * @type {import('vue').Ref<boolean>}
 */
const helpDialogVisible = ref(false);


/**
 * 计算关系结果对话框是否可见
 * @type {import('vue').Ref<boolean>}
 */
const calculateDialogVisible = ref(false);

/**
 * 计算关系结果数据
 * @type {Object}
 * @property {Object|null} from - 起始人物节点
 * @property {Object|null} to - 目标人物节点
 * @property {Array} chains - 关系链数组
 * @property {string} forwardTitle - 正向称谓
 * @property {string} reverseTitle - 反向称谓
 */
const calculateResult = reactive({
  from: null,
  to: null,
  chains: [],
  forwardTitle: '',
  reverseTitle: ''
});

/**
 * 关系链可视化对话框是否可见
 * @type {import('vue').Ref<boolean>}
 */
const chainDialogVisible = ref(false);

// 临时变量
/**
 * 临时存储节点创建位置
 * @type {Object}
 * @property {number} x - 横坐标
 * @property {number} y - 纵坐标
 */
let tempNodePosition = { x: 0, y: 0 };

/**
 * 临时存储关系的起点和终点节点ID
 * @type {Object}
 * @property {string|null} from - 起始节点ID
 * @property {string|null} to - 目标节点ID
 */
let tempRelationNodes = { from: null, to: null };

/**
 * 组件挂载时初始化网络图
 */
onMounted(() => {
  initNetwork();
});

/**
 * 初始化主网络图
 * 设置节点和边的样式，配置物理引擎参数，注册事件监听器
 */
function initNetwork() {
  const container = networkContainer.value;
    if (!container) return;
  
  const data = {
    nodes: nodes,
    edges: edges
  };
  
  const options = {
    nodes: {
      shape: 'circle',
      size: 30,
      font: {
        size: 14,
        face: 'Arial',
        align: 'bottom', // 在节点下方显示姓名
        vadjust: 10 // 调整文字垂直位置
      },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      arrows: {
        to: { enabled: true, scaleFactor: 1 } // 显示箭头
      },
      font: {
        size: 12,
        align: 'middle', // 在关系线中间显示关系名称
        background: 'rgba(255, 255, 255, 0.7)' // 文字背景，提高可读性
      },
      color: {
        color: '#848484',
        highlight: '#848484',
        hover: '#848484'
      },
      smooth: {
        type: 'continuous',
        forceDirection: 'none'
      }
    },
    physics: {
      stabilization: true,
      barnesHut: {
        gravitationalConstant: -2000,
        centralGravity: 0.1,
        springLength: 150,
        springConstant: 0.04,
        damping: 0.09
      }
    },
    manipulation: {
      enabled: false
    },
    interaction: {
      navigationButtons: true,
      keyboard: true,
      hover: true,

    }
  };
  
  network = new Network(container, data, {
    ...options,
    interaction: {
      ...options.interaction,
      zoomView: false
    }
  });
  
  // 添加主动事件监听器（可以调用 preventDefault）
  container.addEventListener('wheel', (e) => {
    e.preventDefault();
  }, { passive: false }); // 必须设置为 passive: false 才能调用 preventDefault
  
  // 添加被动事件监听器（提高滚动性能）
  container.addEventListener('wheel', () => {}, { passive: true });
  
  // 注册事件
  network.on('click', handleNetworkClick);
  network.on('oncontext', handleNetworkContextMenu);
  
  // 初始化历史记录
  // saveState();
  // updateHistoryButtons();
}

/**
 * 初始化关系链网络图
 * @param {Object} chainData - 关系链数据，包含节点和边
 */
function initChainNetwork(chainData) {
  const container = chainNetworkContainer.value;
  
  // 添加空值检查和安全访问
  if (chainNetwork && container && container.hasChildNodes) {
    chainNetwork.destroy();
    chainNetwork = null;
  }
  
  const options = {
    nodes: {
      shape: 'circle',
      size: 30,
      font: {
        size: 14,
        face: 'Arial',
        align: 'bottom', // 在节点下方显示姓名
        vadjust: 10 // 调整文字垂直位置
      },
      borderWidth: 2,
      shadow: true
    },
    edges: {
      arrows: {
        to: { enabled: true, scaleFactor: 1 } // 显示箭头
      },
      font: {
        size: 12,
        align: 'middle', // 在关系线中间显示关系名称
        background: 'rgba(255, 255, 255, 0.7)' // 文字背景，提高可读性
      },
      color: {
        color: '#848484',
        highlight: '#848484',
        hover: '#848484'
      },
      smooth: {
        type: 'continuous',
        forceDirection: 'none'
      }
    },
    physics: {
      stabilization: true
    },
    manipulation: {
      enabled: false
    }
  };
  if (container) {
    chainNetwork = new Network(container, chainData, options);
  } else {
    console.error('关系链容器未正确初始化');
  }
}

/**
 * 处理网络图点击事件
 * 根据当前模式执行不同操作：创建节点、选择关系节点、计算关系或显示节点/边操作菜单
 * @param {Object} params - 点击事件参数
 */
function handleNetworkClick(params) {
  const nodeId = params.nodes[0];
  const edgeId = params.edges[0];
  
  if (mode.value === 'createNode') {
    // 创建节点模式下，在点击位置创建节点
    if (!nodeId && !edgeId) { // 确保点击的是空白处
      tempNodePosition = params.pointer.canvas;
      // 使用已填写的节点信息创建节点
      createNode();
    }
  } else if (mode.value === 'createRelation') {
    // 创建关系模式下，选择节点
    if (nodeId) {
      if (!tempRelationNodes.from) {
        tempRelationNodes.from = nodeId;
        ElMessage.info(`已选择起点: ${nodes.get(nodeId).label}`);
      } else if (!tempRelationNodes.to) {
        if (nodeId === tempRelationNodes.from) {
          ElMessage.warning('不能选择相同的节点作为起点和终点');
          return;
        }
        tempRelationNodes.to = nodeId;
        openRelationDialog('create');
      }
    }
  } else if (mode.value === 'calculateRelation') {
    // 计算关系模式下，选择节点
    if (nodeId) {
      if (!tempRelationNodes.from) {
        tempRelationNodes.from = nodeId;
        ElMessage.info(`已选择第一个人物: ${nodes.get(nodeId).label}`);
      } else if (!tempRelationNodes.to) {
        // if (nodeId === tempRelationNodes.from) {
        //   ElMessage.warning('不能选择相同的人物');
        //   return;
        // }
        tempRelationNodes.to = nodeId;
        calculateRelationship();
      }
    }
  } else {
    // 普通模式下
    if (nodeId) {
      // 点击节点，显示编辑/删除菜单
      const node = nodes.get(nodeId);
      ElMessageBox.confirm(
        '请选择操作',
        '节点操作',
        {
          confirmButtonText: '编辑',
          cancelButtonText: '删除',
          distinguishCancelAndClose: true,
          type: 'info'
        }
      )
        .then(() => {
          // 编辑节点
          const nodeData = nodes.get(nodeId);
          nodeForm.id = nodeId;
          nodeForm.name = nodeData.name || '';
          nodeForm.gender = nodeData.gender !== undefined ? nodeData.gender : 1;
          nodeForm.age = nodeData.age || 30;
          nodeForm.description = nodeData.description || '';
          nodeForm.image = nodeData.image || '';
          openNodeDialog('edit');
        })
        .catch(action => {
          if (action === 'cancel') {
            // 删除节点
            deleteNode(nodeId);
          }
        });
    } else if (edgeId) {
      // 点击关系线，显示编辑/删除菜单
      ElMessageBox.confirm(
        '请选择操作',
        '关系操作',
        {
          confirmButtonText: '编辑',
          cancelButtonText: '删除',
          distinguishCancelAndClose: true,
          type: 'info'
        }
      )
        .then(() => {
          // 编辑关系
          const edgeData = edges.get(edgeId);
          relationForm.id = edgeId;
          relationForm.from = edgeData.from;
          relationForm.to = edgeData.to;
          relationForm.name = edgeData.label || '';
          openRelationDialog('edit');
        })
        .catch(action => {
          if (action === 'cancel') {
            // 删除关系
            deleteRelation(edgeId);
          }
        });
    }
  }
}

/**
 * 处理网络图右键菜单事件
 * 显示节点或边的编辑/删除菜单
 * @param {Object} params - 右键菜单事件参数
 */
function handleNetworkContextMenu(params) {
  const nodeId = params.nodes[0];
  const edgeId = params.edges[0];
  
  if (nodeId) {
    // 右键点击节点，显示编辑/删除菜单
    ElMessageBox.confirm(
      '请选择操作',
      '节点操作',
      {
        confirmButtonText: '编辑',
        cancelButtonText: '删除',
        distinguishCancelAndClose: true,
        type: 'info'
      }
    )
      .then(() => {
        // 编辑节点
        const nodeData = nodes.get(nodeId);
        nodeForm.id = nodeId;
        nodeForm.name = nodeData.name || '';
        nodeForm.gender = nodeData.gender !== undefined ? nodeData.gender : 1;
        nodeForm.age = nodeData.age || 30;
        nodeForm.description = nodeData.description || '';
        nodeForm.image = nodeData.image || '';
        openNodeDialog('edit');
      })
      .catch(action => {
        if (action === 'cancel') {
          // 删除节点
          deleteNode(nodeId);
        }
      });
  } else if (edgeId) {
    // 右键点击边，显示编辑/删除菜单
    ElMessageBox.confirm(
      '请选择操作',
      '关系操作',
      {
        confirmButtonText: '编辑',
        cancelButtonText: '删除',
        distinguishCancelAndClose: true,
        type: 'info'
      }
    )
      .then(() => {
        // 编辑关系
        const edgeData = edges.get(edgeId);
        relationForm.id = edgeId;
        relationForm.from = edgeData.from;
        relationForm.to = edgeData.to;
        relationForm.name = edgeData.label || '';
        openRelationDialog('edit');
      })
      .catch(action => {
        if (action === 'cancel') {
          // 删除关系
          deleteRelation(edgeId);
        }
      });
  }
}

/**
 * 打开节点对话框
 * @param {string} type - 对话框类型，'create'或'edit'
 */
function openNodeDialog(type) {
  nodeDialogType.value = type;
  if (type === 'create') {
    nodeForm.id = null;
    nodeForm.name = '';
    nodeForm.gender = 1;
    nodeForm.age = 30;
    nodeForm.description = '';
    nodeForm.image = '';
  }
  nodeDialogVisible.value = true;
}

/**
 * 确认节点对话框
 * 创建模式下进入创建节点状态，编辑模式下更新节点
 */
function confirmNodeDialog() {
  if (!nodeForm.name.trim()) {
    ElMessage.error('姓名不能为空');
    return;
  }
  
  if (nodeDialogType.value === 'create') {
    // 进入创建节点模式
    mode.value = 'createNode';
    nodeDialogVisible.value = false;
    ElMessage.info('已进入创建节点模式，请点击画布空白处创建人物节点');
  } else {
    updateNode();
    nodeDialogVisible.value = false;
  }
}

/**
 * 打开关系对话框
 * @param {string} type - 对话框类型，'create'或'edit'
 */
function openRelationDialog(type) {
  relationDialogType.value = type;
  if (type === 'create') {
    relationForm.id = null;
    relationForm.name = '';
  }
  relationDialogVisible.value = true;
}

/**
 * 确认关系对话框
 * 创建模式下创建新关系，编辑模式下更新关系
 */
function confirmRelationDialog() {
  if (!relationForm.name.trim()) {
    ElMessage.error('关系名称不能为空');
    return;
  }
  
  if (relationDialogType.value === 'create') {
    createRelation();
  } else {
    updateRelation();
  }
  
  relationDialogVisible.value = false;
  
  // 重置临时变量
  if (relationDialogType.value === 'create') {
    tempRelationNodes = { from: null, to: null };
    mode.value = 'normal';
  }
}

/**
 * 创建节点
 * 根据表单数据创建新的人物节点
 */
function createNode() {
  const nodeId = "node_"+Date.now().toString();
  const nodeColor = nodeForm.gender === 1 ? '#7CB9E8' : '#F4C2C2';
  
  const nodeData = {
    id: nodeId,
    label: nodeForm.name,
    name: nodeForm.name,
    gender: nodeForm.gender,
    age: nodeForm.age,
    description: nodeForm.description,
    image: nodeForm.image ? nodeForm.image : undefined,
    color: {
      background: nodeColor,
      border: nodeForm.gender === 1 ? '#0000FF' : '#FF00FF',
      highlight: {
        background: nodeColor,
        border: nodeForm.gender === 1 ? '#0000FF' : '#FF00FF'
      }
    },
    x: tempNodePosition.x,
    y: tempNodePosition.y
  };
  
  // 如果有图片，设置图片属性
  if (nodeForm.image) {
    nodeData.shape = 'circularImage';
    nodeData.image = nodeForm.image;
  } else {
    nodeData.shape = 'circle';
    delete nodeData.image;
  }
  
  nodes.add(nodeData);
  saveState();
  
  // 退出创建节点模式
  mode.value = 'normal';
  ElMessage.success('节点创建成功');
}

/**
 * 更新节点
 * 根据表单数据更新现有人物节点
 */
function updateNode() {
  const nodeId = nodeForm.id;
  const nodeColor = nodeForm.gender === 1 ? '#7CB9E8' : '#F4C2C2';
  
  const nodeData = {
    id: nodeId,
    label: nodeForm.name,
    name: nodeForm.name,
    gender: nodeForm.gender,
    age: nodeForm.age,
    description: nodeForm.description,
    image: nodeForm.image ? nodeForm.image : undefined,
    color: {
      background: nodeColor,
      border: nodeForm.gender === 1 ? '#0000FF' : '#FF00FF',
      highlight: {
        background: nodeColor,
        border: nodeForm.gender === 1 ? '#0000FF' : '#FF00FF'
      }
    }
  };
  
  // 如果有图片，设置图片属性
  if (nodeForm.image) {
    nodeData.shape = 'circularImage';
    nodeData.image = nodeForm.image;
  } else {
    nodeData.shape = 'circle';
    delete nodeData.image;
  }
  
  nodes.update(nodeData);
  saveState();
  
  ElMessage.success('节点更新成功');
}

/**
 * 删除节点
 * 删除指定ID的节点及其相关的所有边
 * @param {string} nodeId - 要删除的节点ID
 */
function deleteNode(nodeId) {
  // 获取与该节点相关的所有边
  const connectedEdges = network.getConnectedEdges(nodeId);
  
  // 删除相关的边
  if (connectedEdges.length > 0) {
    edges.remove(connectedEdges);
  }
  
  // 删除节点
  nodes.remove(nodeId);
  saveState();
  
  ElMessage.success('节点删除成功');
}

/**
 * 创建关系
 * 根据表单数据创建新的关系边
 */
function createRelation() {
  const edgeId = Date.now().toString();
  
  const edgeData = {
    id: edgeId,
    from: tempRelationNodes.from,
    to: tempRelationNodes.to,
    label: relationForm.name
  };
  
  edges.add(edgeData);
  saveState();
  
  ElMessage.success('关系创建成功');
}

/**
 * 更新关系
 * 根据表单数据更新现有关系边
 */
function updateRelation() {
  const edgeId = relationForm.id;
  
  const edgeData = {
    id: edgeId,
    from: relationForm.from,
    to: relationForm.to,
    label: relationForm.name
  };
  
  edges.update(edgeData);
  saveState();
  
  ElMessage.success('关系更新成功');
}

/**
 * 删除关系
 * 删除指定ID的关系边
 * @param {string} edgeId - 要删除的关系边ID
 */
function deleteRelation(edgeId) {
  edges.remove(edgeId);
  saveState();
  
  ElMessage.success('关系删除成功');
}

/**
 * 计算人物关系
 * 使用Web Worker计算两个选定人物节点之间的所有可能关系
 */
function calculateRelationship() {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在计算人物关系',
    background: 'rgba(0, 0, 0, 0.7)'
  });
  
  try {
    const fromNode = nodes.get(tempRelationNodes.from);
    const toNode = nodes.get(tempRelationNodes.to);
    
    if (!fromNode || !toNode) {
      ElMessage.error('无法找到选中的人物节点');
      loadingInstance.close();
      return;
    }
    
    // 创建Web Worker来处理计算
    const worker = new Worker(new URL('../workers/relationshipWorker.js', import.meta.url), { type: 'module' });
    
    // 监听Worker的消息
    worker.addEventListener('message', function(e) {
      const data = e.data;
      
      if (data.type === 'result') {
        const result = data.result;
        
        if (result.error) {
          ElMessage.warning(result.error);
          tempRelationNodes = { from: null, to: null };
          mode.value = 'normal';
        } else {
          // 设置计算结果
          calculateResult.from = result.from;
          calculateResult.to = result.to;
          calculateResult.chains = result.chains;
          calculateResult.forwardTitle = result.forwardTitle;
          calculateResult.reverseTitle = result.reverseTitle;
          
          // 显示结果对话框
          calculateDialogVisible.value = true;
        }
      } else if (data.type === 'error') {
        console.error('Worker错误:', data.error);
        ElMessage.error('计算过程中发生错误: ' + data.error);
      }
      
      // 重置临时变量
      tempRelationNodes = { from: null, to: null };
      mode.value = 'normal';
      
      // 关闭加载提示
      loadingInstance.close();
      
      // 终止Worker
      worker.terminate();
    });
    
    // 处理Worker错误
    worker.addEventListener('error', function(error) {
      console.error('Worker错误:', error);
      ElMessage.error('计算过程中发生错误');
      
      // 重置临时变量
      tempRelationNodes = { from: null, to: null };
      mode.value = 'normal';
      
      // 关闭加载提示
      loadingInstance.close();
      
      // 终止Worker
      worker.terminate();
    });
    
    // 发送数据到Worker
    worker.postMessage({
      fromNode: fromNode,
      toNode: toNode,
      nodesData: nodes.get(),
      edgesData: edges.get()
    });
  } catch (error) {
    console.error('启动Worker错误:', error);
    ElMessage.error('启动计算过程失败: ' + error.message);
    loadingInstance.close();
    
    // 重置临时变量
    tempRelationNodes = { from: null, to: null };
    mode.value = 'normal';
  }
}

/**
 * 显示关系链
 * 可视化展示特定的关系链
 * @param {Object} row - 关系链数据行
 */
function showRelationChain(row) {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在生成关系链可视化',
    background: 'rgba(0, 0, 0, 0.7)'
  });
  
  try {
    const chainIndex = row.index;
    const chain = calculateResult.chains[chainIndex];

    if (!chain) {
      ElMessage.error('关系链数据不完整');
      loadingInstance.close();
      return;
    }
    
    // 创建Web Worker来处理关系链可视化
    const worker = new Worker(new URL('../workers/relationshipWorker.js', import.meta.url), { type: 'module' });
    
    // 监听Worker的消息
    worker.addEventListener('message', function(e) {
      const data = e.data;
      
      if (data.type === 'chainVisualization') {
        const result = data.result;
        
        // 显示关系链对话框
        chainDialogVisible.value = true;

        // 初始化关系链网络图
        nextTick(() => {
          initChainNetwork({
            nodes: new DataSet(result.chainNodes),
            edges: new DataSet(result.chainEdges)
          });
        });
      } else if (data.type === 'error') {
        console.error('Worker错误:', data.error);
        ElMessage.error('生成关系链可视化过程中发生错误: ' + data.error);
      }
      
      // 关闭加载提示
      loadingInstance.close();
      
      // 终止Worker
      worker.terminate();
    });
    
    // 处理Worker错误
    worker.addEventListener('error', function(error) {
      console.error('Worker错误:', error);
      ElMessage.error('生成关系链可视化过程中发生错误');
      
      // 关闭加载提示
      loadingInstance.close();
      
      // 终止Worker
      worker.terminate();
    });
    
    // 只传递必要的数据给Worker，避免无法克隆的对象
    const fromNode = {
      id: calculateResult.from.id,
      name: calculateResult.from.name,
      gender: calculateResult.from.gender
    };
    
    const toNode = {
      id: calculateResult.to.id,
      name: calculateResult.to.name,
      gender: calculateResult.to.gender
    };
    
    // 简化节点数据，只保留必要的属性
    const simplifiedNodes = nodes.get().map(node => ({
      id: node.id,
      name: node.name || node.label,
      shape: node.shape,
      image: node.image,
      color: node.color,
      gender: node.gender
    }));
    // 发送数据到Worker
    worker.postMessage({
      action: 'visualizeChain',
      chain: JSON.stringify(chain),
      nodes: simplifiedNodes,
      from: fromNode,
      to: toNode
    });
  } catch (error) {
    console.error('启动Worker错误:', error);
    ElMessage.error('启动关系链可视化过程失败: ' + error.message);
    loadingInstance.close();
  }
}

/**
 * 保存当前状态到历史记录
 * 用于实现撤销和重做功能
 */
function saveState() {
  const currentState = {
    nodes: nodes.get(),
    edges: edges.get()
  };
  
  history.past.push(JSON.parse(JSON.stringify(history.current)));
  history.current = JSON.parse(JSON.stringify(currentState));
  history.future = [];
  
  updateHistoryButtons();
}

/**
 * 更新历史按钮状态
 * 根据历史记录状态更新撤销和重做按钮的可用性
 */
function updateHistoryButtons() {
  canUndo.value = history.past.length > 0;
  canRedo.value = history.future.length > 0;
}

/**
 * 处理撤销操作
 * 恢复到上一个状态
 */
function handleUndo() {
  if (history.past.length === 0) return;
  
  const previousState = history.past.pop();
  history.future.unshift(JSON.parse(JSON.stringify(history.current)));
  history.current = JSON.parse(JSON.stringify(previousState));
  
  // 更新网络图
  nodes.clear();
  edges.clear();
  nodes.add(history.current.nodes);
  edges.add(history.current.edges);
  
  updateHistoryButtons();
  ElMessage.success('已撤销上一步操作');
}

/**
 * 处理重做操作
 * 恢复到下一个状态
 */
function handleRedo() {
  if (history.future.length === 0) return;
  
  const nextState = history.future.shift();
  history.past.push(JSON.parse(JSON.stringify(history.current)));
  history.current = JSON.parse(JSON.stringify(nextState));
  
  // 更新网络图
  nodes.clear();
  edges.clear();
  nodes.add(history.current.nodes);
  edges.add(history.current.edges);
  
  updateHistoryButtons();
  ElMessage.success('已恢复下一步操作');
}

/**
 * 处理创建节点按钮点击
 * 打开创建节点对话框
 */
function handleCreateNode() {
  openNodeDialog('create');
}

/**
 * 处理创建关系按钮点击
 * 进入创建关系模式
 */
function handleCreateRelation() {
  mode.value = 'createRelation';
  tempRelationNodes = { from: null, to: null };
  ElMessage.info('已进入创建关系模式，请先后点击两个节点，第一个为关系起点，第二个为关系终点');
}

/**
 * 处理计算关系按钮点击
 * 进入计算人物关系模式
 */
function handleCalculateRelation() {
  mode.value = 'calculateRelation';
  tempRelationNodes = { from: null, to: null };
  ElMessage.info('已进入计算人物关系模式，请依次点击两个人物节点，计算它们之间的关系');
}

/**
 * 处理放大按钮点击
 * 放大网络图
 */
function handleZoomIn() {
  const scale = network.getScale();
  network.moveTo({ scale: scale * 1.2 });
}

/**
 * 处理缩小按钮点击
 * 缩小网络图
 */
function handleZoomOut() {
  const scale = network.getScale();
  network.moveTo({ scale: scale / 1.2 });
}

/**
 * 处理适应屏幕按钮点击
 * 调整网络图以适应屏幕
 */
function handleFitScreen() {
  network.fit();
}

/**
 * 处理帮助按钮点击
 * 显示使用帮助对话框
 */
function showHelpDialog() {
  helpDialogVisible.value = true;
}

/**
 * 处理新建图按钮点击
 * 清空当前关系图
 */
function handleNewGraph() {
  ElMessageBox.confirm('确定要清空当前关系图吗？', '提示', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    // 正确重置历史记录
    history.past = [];
    history.future = [];
    history.current = { nodes: [], edges: [] };
    nodes.clear();
    edges.clear();
    updateHistoryButtons();
    // saveState();
    ElMessage.success('关系图已清空');
  }).catch(() => {});
}

/**
 * 处理导出按钮点击
 * 将当前关系图导出为JSON文件
 */
function handleExport() {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在导出文件',
    background: 'rgba(0, 0, 0, 0.7)'
  });
  const data = {
    nodes: nodes.get(),
    edges: edges.get(),
    history: {
      past: history.past,
      future: history.future,
      current: history.current
    }
  };
  
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  saveAs(blob, 'relationship-graph.json');
  
  ElMessage.success('关系图已导出');
  loadingInstance.close();
}

/**
 * 处理导入按钮点击
 * 触发文件选择对话框
 */
function handleImport() {
  const loadingInstance = ElLoading.service({
    lock: true,
    text: '正在导入文件',
    background: 'rgba(0, 0, 0, 0.7)'
  });
  fileInput.value.click();
  loadingInstance.close();
}

/**
 * 处理文件选择
 * 读取并解析选择的JSON文件
 * @param {Event} event - 文件选择事件
 */
function handleFileSelected(event) {
  const file = event.target.files[0];
  if (!file) {
    return;
  }
  
  // 创建Web Worker来处理文件解析和验证
  const worker = new Worker(new URL('../workers/importWorker.js', import.meta.url), { type: 'module' });
  
  // 监听Worker的消息
  worker.addEventListener('message', function(e) {
    const data = e.data;
    
    if (data.type === 'success') {
      const graphData = data.result;
      
      // 清空当前图
      nodes.clear();
      edges.clear();
      
      // 分批导入新数据以提高性能
      const batchSize = 100;
      const nodeChunks = chunkArray(graphData.nodes, batchSize);
      const edgeChunks = chunkArray(graphData.edges, batchSize);
      
      // 使用requestAnimationFrame分批添加节点
      let nodeIndex = 0;
      function addNodeBatch() {
        if (nodeIndex < nodeChunks.length) {
          nodes.add(nodeChunks[nodeIndex]);
          nodeIndex++;
          requestAnimationFrame(addNodeBatch);
        } else {
          // 节点添加完成后，开始添加边
          let edgeIndex = 0;
          function addEdgeBatch() {
            if (edgeIndex < edgeChunks.length) {
              edges.add(edgeChunks[edgeIndex]);
              edgeIndex++;
              requestAnimationFrame(addEdgeBatch);
            } else {
              // 恢复历史记录
              if (graphData.history) {
                history.past = graphData.history.past;
                history.future = graphData.history.future;
                history.current = graphData.history.current;
              }
              
              // 保存状态
              saveState();
              
              ElMessage.success('关系图导入成功');
              // 导入成功后，自动适应屏幕
              nextTick(() => {
                handleFitScreen();
              });
              
            }
          }
          requestAnimationFrame(addEdgeBatch);
        }
      }
      requestAnimationFrame(addNodeBatch);
      
    } else if (data.type === 'error') {
      ElMessage.error('导入失败：' + data.error);
    }
    
    // 终止Worker
    worker.terminate();
    
    // 重置文件输入
    event.target.value = '';
  });
  
  // 处理Worker错误
  worker.addEventListener('error', function(error) {
    console.error('Worker错误:', error);
    ElMessage.error('导入过程中发生错误');
    loadingInstance.close();
    worker.terminate();
    event.target.value = '';
  });
  
  // 读取文件内容并发送到Worker
  const reader = new FileReader();
  reader.onload = (e) => {
    worker.postMessage({
      action: 'importGraph',
      fileContent: e.target.result
    });
  };
  reader.readAsText(file);
}

/**
 * 将数组分割成多个小数组
 * 用于分批处理大量数据
 * @param {Array} array - 要分割的数组
 * @param {number} chunkSize - 每个小数组的大小
 * @returns {Array} 分割后的小数组集合
 */
function chunkArray(array, chunkSize) {
  const chunks = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
}

/**
 * 验证是否为有效的人物关系图
 * 检查导入的JSON数据结构是否符合要求
 * @param {Object} data - 要验证的数据
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
</script>

<style scoped>
.relationship-graph-container {
  display: flex;
  flex-direction: column;
  align-items: center; /* 使内容水平居中 */
  min-height: 100vh;
  width: 100%;
  padding: 20px;
  box-sizing: border-box;
}

.toolbar {
  display: flex;
  flex-direction: column; /* 改为纵向排列 */
  justify-content: center; /* 工具栏居中 */
  align-items: center; /* 水平居中 */
  margin-bottom: 20px;
  gap: 15px; /* 增加行间距 */
  width: 100%;
  max-width: 1200px; /* 限制最大宽度 */
}

.toolbar-row {
  display: flex;
  justify-content: center; /* 每行内容居中 */
  gap: 10px; /* 按钮组之间的间距 */
  flex-wrap: wrap; /* 允许在小屏幕上换行 */
  width: 100%;
}

.network-container {
  width: 120%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.chain-network-container {
  height: 400px;
  width: 100%;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  overflow: hidden;
  background-color: #f5f7fa;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.help-content {
  line-height: 1.6;
  color: #333;
}

.help-content h3 {
  margin-top: 20px;
  margin-bottom: 15px;
  color: #409EFF;
  border-bottom: 1px solid #EBEEF5;
  padding-bottom: 8px;
}

.help-content ol, .help-content ul {
  padding-left: 20px;
}

.help-content li {
  margin-bottom: 12px;
}

.help-content p {
  margin: 8px 0;
}
</style>