<!--
  FileTree.vue — 递归文件树组件

  功能：
  - 递归渲染文件/文件夹目录树
  - 文件夹可展开/折叠
  - 文件支持点击选中
  - 根据文件扩展名显示不同图标
-->
<template>
  <!-- 文件树列表 -->
  <ul class="file-tree">
    <li v-for="node in nodes" :key="node.path" class="tree-node">
      <!-- 单个节点标签：文件夹可展开/折叠，文件可选中 -->
      <div
        class="node-label"
        :class="{
          selected: node.path === selectedPath, // 选中态高亮
          'is-file': node.type === 'file', // 文件节点
          'is-folder': node.type === 'folder', // 文件夹节点
          expanded: node.type === 'folder' && modelValue.has(node.path) // 展开态
        }"
        :style="{ paddingLeft: depth * 16 + 8 + 'px' }"
        @click="handleClick(node)"
      >
        <!-- 文件夹展开/折叠箭头 -->
        <span class="node-arrow" v-if="node.type === 'folder'">
          {{ modelValue.has(node.path) ? '▾' : '▸' }}
        </span>
        <span class="node-arrow spacer" v-else></span>

        <!-- 文件类型图标 -->
        <span class="node-icon" :class="iconClass(node)"></span>

        <!-- 文件/文件夹名称 -->
        <span class="node-name">{{ node.name }}</span>
      </div>

      <!-- 递归渲染子节点：仅文件夹展开时显示 -->
      <FileTree
        v-if="node.type === 'folder' && modelValue.has(node.path)"
        :nodes="node.children || []"
        :selected-path="selectedPath"
        :depth="depth + 1"
        :model-value="modelValue"
        @update:model-value="v => $emit('update:modelValue', v)"
        @select="p => $emit('select', p)"
      />
    </li>
  </ul>
</template>

<script setup lang="ts">
  import type { TreeNode } from '../types/tree'

  // 明确组件名称，使递归引用生效
  defineOptions({ name: 'FileTree' })

  // Props 定义：含默认值
  const props = withDefaults(
    defineProps<{
      nodes: TreeNode[] // 树节点数据
      selectedPath: string // 当前选中文件路径
      depth?: number // 当前递归深度（用于缩进）
      modelValue: Set<string> // 已展开的文件夹路径集合
    }>(),
    {
      depth: 0 // 根节点深度为 0
    }
  )

  // 事件定义
  const emit = defineEmits<{
    select: [path: string] // 选中文件事件
    'update:modelValue': [value: Set<string>] // 更新展开集合事件
  }>()

  /**
   * 节点点击处理
   * - 文件夹：切换展开/折叠状态
   * - 文件：触发选中事件
   */
  const handleClick = (node: TreeNode) => {
    if (node.type === 'folder') {
      // 切换文件夹展开状态
      const next = new Set(props.modelValue)
      if (next.has(node.path)) {
        next.delete(node.path) // 已展开 → 折叠
      } else {
        next.add(node.path) // 已折叠 → 展开
      }
      emit('update:modelValue', next)
    } else {
      // 选中文件
      emit('select', node.path)
    }
  }

  /**
   * 根据文件扩展名返回对应的 CSS 图标类名
   * 支持常见前端文件类型
   */
  const iconClass = (node: TreeNode) => {
    if (node.type === 'folder') return 'folder-icon'
    const ext = node.name.split('.').pop()?.toLowerCase() || ''
    const map: Record<string, string> = {
      vue: 'vue-icon', // Vue 单文件组件
      ts: 'ts-icon', // TypeScript
      tsx: 'ts-icon', // TSX
      js: 'js-icon', // JavaScript
      jsx: 'js-icon', // JSX
      json: 'json-icon', // JSON
      css: 'css-icon', // 样式表
      scss: 'scss-icon', // SCSS
      html: 'html-icon', // HTML
      md: 'md-icon', // Markdown
      svg: 'image-icon', // SVG 图片
      png: 'image-icon', // PNG 图片
      bash: 'shell-icon', // Shell 脚本
      dts: 'ts-icon' // TypeScript 类型声明
    }
    return map[ext] || 'file-icon' // 默认文件图标
  }
</script>

<style scoped>
  /* 文件树容器：去除默认列表样式 */
  .file-tree {
    list-style: none;
    margin: 0;
    padding: 6px 0;
  }

  .tree-node {
    margin: 0;
    padding: 0;
  }

  /* 节点标签行：flex 布局，容纳箭头+图标+名称 */
  .node-label {
    display: flex;
    align-items: center;
    gap: 4px;
    height: 30px;
    cursor: pointer;
    border-radius: 4px;
    margin: 1px 6px;
    color: #aeb7c8;
    font-size: 13px;
    user-select: none;
    transition: background 0.15s;
  }

  .node-label:hover {
    background: rgba(255, 255, 255, 0.06);
    color: #e0e4eb;
  }

  /* 选中文件高亮 */
  .node-label.selected {
    background: #2563eb !important;
    color: #fff;
  }

  /* 展开/折叠箭头 */
  .node-arrow {
    flex-shrink: 0;
    width: 16px;
    text-align: center;
    font-size: 11px;
    color: #6b7a93;
  }

  /* 文件节点占位（保持对齐） */
  .node-arrow.spacer {
    visibility: hidden;
  }

  .node-label.selected .node-arrow {
    color: rgba(255, 255, 255, 0.7);
  }

  /* 文件类型图标方块 */
  .node-icon {
    flex-shrink: 0;
    width: 18px;
    height: 18px;
    border-radius: 3px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: 700;
  }

  /* 文件夹图标（展开/折叠两种状态） */
  .folder-icon {
    background: rgba(250, 204, 21, 0.2);
    color: #facc15;
  }
  .folder-icon::before {
    content: '📁';
    font-size: 13px;
  }
  .node-label.expanded .folder-icon::before {
    content: '📂';
  }

  /* 以下为各文件类型图标样式 */
  .vue-icon {
    background: rgba(66, 184, 131, 0.2);
    color: #42b883;
  }
  .vue-icon::before {
    content: 'V';
  }

  .ts-icon {
    background: rgba(49, 120, 198, 0.2);
    color: #3178c6;
  }
  .ts-icon::before {
    content: 'T';
  }

  .js-icon {
    background: rgba(247, 223, 30, 0.2);
    color: #f7df1e;
  }
  .js-icon::before {
    content: 'JS';
    font-size: 8px;
  }

  .json-icon {
    background: rgba(93, 176, 114, 0.2);
    color: #5db072;
  }
  .json-icon::before {
    content: '{ }';
    font-size: 9px;
  }

  .css-icon {
    background: rgba(21, 114, 182, 0.2);
    color: #1572b6;
  }
  .css-icon::before {
    content: '#';
  }

  .html-icon {
    background: rgba(227, 76, 38, 0.2);
    color: #e34c26;
  }
  .html-icon::before {
    content: '<>';
    font-size: 9px;
  }

  .md-icon {
    background: rgba(9, 105, 218, 0.2);
    color: #0969da;
  }
  .md-icon::before {
    content: 'M';
  }

  .image-icon {
    background: rgba(233, 30, 99, 0.2);
    color: #e91e63;
  }
  .image-icon::before {
    content: '🖼';
    font-size: 12px;
  }

  .shell-icon {
    background: rgba(0, 0, 0, 0.25);
    color: #8b949e;
  }
  .shell-icon::before {
    content: '>_';
    font-size: 9px;
  }

  .file-icon {
    background: rgba(148, 163, 184, 0.15);
    color: #94a3b8;
  }
  .file-icon::before {
    content: '📄';
    font-size: 12px;
  }

  /* 文件名溢出省略 */
  .node-name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
</style>
