<!--
  App.vue — 应用根组件（文件浏览器）

  功能：
  - 左侧边栏：用户点击"打开文件夹"选择目录 → 展示文件目录树
  - 右侧主区域：点击文件 → 读取并展示文件内容（带行号）
  - 底部：AI 智能助手（浮动聊天组件）
-->
<template>
  <el-config-provider>
    <el-container class="app-layout">
      <!-- ============ 左侧边栏：文件夹选择 + 文件树 ============ -->
      <el-aside class="app-sidebar" width="260px">
        <!-- 侧栏顶部：品牌标识 + 打开文件夹按钮 -->
        <div class="sidebar-header">
          <div class="brand-mark">📁</div>
          <div class="brand-text">
            <strong>文件浏览器</strong>
            <span v-if="folders.length">{{ folders.length }} 个文件夹已打开</span>
            <span v-else>选择文件夹开始浏览</span>
          </div>
        </div>

        <!-- 打开文件夹按钮 -->
        <div class="sidebar-actions">
          <button class="open-folder-btn" @click="openFolder" :disabled="loading">
            <span class="btn-icon">📂</span>
            <span>{{ loading ? '正在打开...' : '打开文件夹' }}</span>
          </button>
          <!-- 清除所有文件夹按钮（仅在有已打开的文件夹时显示） -->
          <button v-if="folders.length > 0" class="clear-btn" @click="clearAllFolders" title="关闭所有文件夹">
            ✕ 清除
          </button>
        </div>

        <!-- 文件树容器 -->
        <div class="tree-wrapper">
          <!-- 空状态：未选择文件夹 -->
          <div v-if="!folders.length && !loading" class="tree-empty">
            <p>点击上方按钮选择一个或多个文件夹</p>
            <p class="tree-empty-hint">支持同时打开多个文件夹</p>
          </div>

          <!-- 文件树组件 -->
          <FileTree
            v-else
            :nodes="fileTree"
            :selected-path="selectedPath"
            :depth="0"
            :model-value="expandedSet"
            @select="onFileSelect"
            @update:model-value="expandedSet = $event"
          />
        </div>
      </el-aside>

      <!-- ============ 右侧：Header + 文件内容查看器 ============ -->
      <el-container>
        <!-- 顶部栏：显示当前文件路径和语言 -->
        <el-header class="app-header" height="52px">
          <div class="header-left">
            <span class="header-icon">📄</span>
            <span class="header-title">{{ currentFile?.name || '文件浏览器' }}</span>
            <span v-if="currentFile" class="header-path">{{ currentFile.path }}</span>
          </div>
          <div class="header-actions">
            <!-- 语言标签 -->
            <el-tag v-if="currentFile" size="small" effect="plain">
              {{ currentFile.language || 'text' }}
            </el-tag>
          </div>
        </el-header>

        <!-- 文件标签栏：已打开的文件列表，支持切换和关闭 -->
        <div class="tab-bar" v-if="openedFiles.length > 0">
          <div
            v-for="tab in openedFiles"
            :key="tab.path"
            class="tab-item"
            :class="{ active: tab.path === selectedPath }"
            @click="switchTab(tab.path)"
          >
            <span class="tab-icon">{{ getFileIcon(tab.name) }}</span>
            <span class="tab-name">{{ tab.name }}</span>
            <span class="tab-close" @click="closeTab(tab.path, $event)" title="关闭">×</span>
          </div>
        </div>

        <!-- 主内容区：文件内容展示 -->
        <el-main class="app-main">
          <!-- 未选择文件夹时的空状态 -->
          <div v-if="!folders.length" class="empty-state">
            <div class="empty-icon">📂</div>
            <h2>文件浏览器</h2>
            <p>点击左侧「打开文件夹」选择一个或多个目录，即可浏览文件</p>
          </div>

          <!-- 已选择文件夹但未选文件 -->
          <div v-else-if="!currentFile" class="empty-state">
            <div class="empty-icon">👆</div>
            <h2>选择文件</h2>
            <p>从左侧目录树点击一个文件查看内容</p>
          </div>

          <!-- 正在加载文件内容 -->
          <div v-else-if="readingFile" class="empty-state">
            <div class="empty-icon">⏳</div>
            <p>正在读取文件...</p>
          </div>

          <!-- 文件内容展示区域 -->
          <div v-else class="code-viewer">
            <!-- 仿 VSCode 工具栏（红黄绿圆点 + 文件名） -->
            <div class="code-toolbar">
              <span class="toolbar-item">
                <span class="toolbar-dot" style="background: #ff5f57"></span>
                <span class="toolbar-dot" style="background: #febc2e"></span>
                <span class="toolbar-dot" style="background: #28c840"></span>
              </span>
              <span class="toolbar-filename">{{ currentFile.name }}</span>
            </div>

            <!-- 代码主体：行号 + 着色后的代码 -->
            <div class="code-body">
              <!-- 左侧行号列 -->
              <div class="line-numbers">
                <div v-for="n in lineCount" :key="n" class="line-num">{{ n }}</div>
              </div>
              <!-- 右侧代码内容列（语法高亮） -->
              <div class="code-content">
                <div
                  v-for="(line, idx) in highlightedLines"
                  :key="idx"
                  class="code-line"
                  :class="{ 'line-empty': !line || !line.replace(/<[^>]+>/g, '').trim() }"
                >
                  <pre><code v-html="line || ' '"></code></pre>
                </div>
              </div>
            </div>
          </div>
        </el-main>
      </el-container>
    </el-container>

    <!-- AI 智能助手（保持原有组件） -->
    <AIChat />
  </el-config-provider>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import AIChat from './components/aIchat.vue'
  import type { TreeNode } from './types/tree'

  // highlight.js — 代码语法着色
  import hljs from 'highlight.js'
  // GitHub 主题（浅色背景，适配代码查看器）
  import 'highlight.js/styles/github.css'

  // ============================================================
  // 类型定义
  // ============================================================

  /** 已打开的文件标签（右侧标签栏） */
  interface OpenedFile {
    path: string // 含文件夹前缀的唯一路径
    name: string // 文件名（显示用）
    language: string
    content: string // 已缓存的文件内容
  }

  // 文件扩展名 → 语言标签的映射表
  const langMap: Record<string, string> = {
    vue: 'vue',
    ts: 'typescript',
    tsx: 'tsx',
    js: 'javascript',
    jsx: 'jsx',
    json: 'json',
    css: 'css',
    scss: 'scss',
    html: 'html',
    md: 'markdown',
    bash: 'bash',
    yml: 'yaml',
    yaml: 'yaml',
    xml: 'xml',
    py: 'python',
    java: 'java',
    go: 'go',
    rust: 'rust',
    cpp: 'cpp',
    c: 'c',
    h: 'c',
    hpp: 'cpp'
  }

  // ============================================================
  // 响应式状态
  // ============================================================

  /**
   * 文件夹列表 —— 每个条目记录一个已打开的文件夹
   * 支持同时打开多个文件夹，每个文件夹独立构建子树
   */
  const folders = ref<
    Array<{
      id: number
      name: string
      nodes: TreeNode[]
    }>
  >([])

  /** 自增 ID 计数器，确保每个文件夹的唯一标识 */
  let folderIdCounter = 0

  /** 当前选中文件的路径（含文件夹前缀，如 __folder_0/package.json） */
  const selectedPath = ref('')

  /** 已展开的文件夹路径集合 */
  const expandedSet = ref(new Set<string>())

  /** 当前文件内容（异步读取后更新） */
  const fileContent = ref('')

  /** 加载状态：正在打开文件夹 */
  const loading = ref(false)

  /** 加载状态：正在读取文件 */
  const readingFile = ref(false)

  /** 已打开的文件标签列表（右侧标签栏） */
  const openedFiles = ref<OpenedFile[]>([])

  // ============================================================
  // 计算属性
  // ============================================================

  /**
   * 给节点树递归添加路径前缀
   * 确保不同文件夹中的同名文件拥有全局唯一的路径
   */
  const prefixPaths = (nodes: TreeNode[], prefix: string): TreeNode[] => {
    return nodes.map(n => ({
      ...n,
      path: `${prefix}${n.path}`,
      children: n.children ? prefixPaths(n.children, prefix) : undefined
    }))
  }

  /**
   * 文件树数据：将所有已打开的文件夹作为根级别节点，
   * 各文件夹内的路径自动添加前缀以保持唯一性
   */
  const fileTree = computed(() => {
    return folders.value.map(f => ({
      name: f.name,
      type: 'folder' as const,
      path: `__folder_${f.id}`,
      children: prefixPaths(f.nodes, `__folder_${f.id}`)
    }))
  })

  /** 从文件树中查找当前选中文件的节点 */
  const currentFile = computed(() => {
    if (!selectedPath.value) return null
    return findNode(fileTree.value, selectedPath.value)
  })

  /** 文件内容按行分割（用于渲染行号和代码） */
  const codeLines = computed(() => fileContent.value.split('\n'))

  /** 总行数 */
  const lineCount = computed(() => codeLines.value.length)

  /**
   * 根据文件名返回图标字符
   * 与 FileTree 组件中的图标保持一致
   */
  const getFileIcon = (name: string): string => {
    const ext = name.split('.').pop()?.toLowerCase() || ''
    const icons: Record<string, string> = {
      vue: 'V',
      ts: 'T',
      tsx: 'T',
      js: 'JS',
      jsx: 'R',
      json: '{ }',
      css: '#',
      html: '<>',
      md: 'M',
      svg: '🖼',
      png: '🖼',
      bash: '>_'
    }
    return icons[ext] || '📄'
  }

  /**
   * 语法高亮处理
   * 使用 highlight.js 将代码转换为带着色标记的 HTML
   * 按行分割后逐行渲染，保持与行号对齐
   *
   * 注意：
   * - highlight.js 无内置 vue 语言，.vue 文件映射为 html
   *   （html 语言能识别 <template>/<script>/<style> 并分别高亮）
   */
  const highlightedLines = computed(() => {
    const content = fileContent.value
    if (!content) return []

    // 获取当前文件的语言
    let lang = currentFile.value?.language || ''

    // highlight.js 没有内置 'vue' 语言，映射为 'html'
    // html 模式能高亮 <template> 部分，并自动切换 JS/CSS 高亮
    if (lang === 'vue') lang = 'html'

    try {
      // 使用 highlight.js 进行语法高亮
      const result = hljs.highlight(content, {
        language: lang,
        ignoreIllegals: true // 语言不匹配时降级为纯文本
      })
      // 按换行符分割高亮后的 HTML，逐行渲染
      return result.value.split('\n')
    } catch {
      // 降级：纯文本 HTML 转义后显示
      const escaped = content.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      return escaped.split('\n')
    }
  })

  // ============================================================
  // 方法
  // ============================================================

  /**
   * 在树中递归查找指定路径的节点
   * @param nodes - 树节点数组
   * @param path  - 目标路径
   */
  const findNode = (nodes: TreeNode[], path: string): TreeNode | null => {
    for (const node of nodes) {
      if (node.path === path) return node
      if (node.children) {
        const found = findNode(node.children, path)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 递归遍历文件夹，构建 TreeNode 树
   * @param dirHandle  - 目录句柄
   * @param parentPath - 父路径（用于拼接）
   * @returns TreeNode 数组
   */
  const walkDirectory = async (
    // @ts-ignore — FileSystemDirectoryHandle 在部分 TS 版本中作为类型使用
    dirHandle: FileSystemDirectoryHandle,
    parentPath: string
  ): Promise<TreeNode[]> => {
    const nodes: TreeNode[] = []
    // 使用 for-await-of 遍历目录条目（异步迭代器）
    // @ts-ignore — FileSystemDirectoryHandle.values() 在部分 TS 版本中类型未覆盖
    for await (const entry of (dirHandle as any).values()) {
      // 拼接完整路径
      const path = parentPath ? `${parentPath}/${entry.name}` : `/${entry.name}`

      if (entry.kind === 'directory') {
        // === 子目录：递归遍历 ===
        const children = await walkDirectory(entry, path)
        nodes.push({
          name: entry.name,
          type: 'folder',
          path,
          children
        })
      } else {
        // === 文件：创建节点，保存句柄用于后续读取 ===
        const ext = entry.name.split('.').pop()?.toLowerCase() || ''
        nodes.push({
          name: entry.name,
          type: 'file',
          path,
          language: langMap[ext] || ext,
          handle: entry
        })
      }
    }
    // 排序：文件夹在前 → 文件在后，同类型按名称排序
    nodes.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'folder' ? -1 : 1
      return a.name.localeCompare(b.name)
    })
    return nodes
  }

  /**
   * 打开文件夹选择器
   * 使用 File System Access API，每次调用都会将新文件夹追加到列表中
   * 支持多次点击打开多个不同的文件夹
   */
  const openFolder = async () => {
    // 检查浏览器是否支持 showDirectoryPicker
    // @ts-ignore — showDirectoryPicker 在部分 TS 版本 DOM 类型中未声明
    if (!('showDirectoryPicker' in window)) {
      alert('当前浏览器不支持文件夹选择功能。\n请使用 Chrome / Edge 等 Chromium 内核浏览器。')
      return
    }

    loading.value = true
    try {
      // 弹出系统文件夹选择器
      // @ts-ignore — showDirectoryPicker 类型声明
      const handle = await (window as any).showDirectoryPicker()

      // 为每个新文件夹分配唯一 ID，用于路径前缀
      const id = folderIdCounter++
      const prefix = `__folder_${id}`

      // 递归遍历文件夹，构建子树
      const nodes = await walkDirectory(handle, '')

      // 追加到文件夹列表（而非替换）
      folders.value = [...folders.value, { id, name: handle.name, nodes }]

      // 自动展开新文件夹的根节点
      expandedSet.value = new Set([...expandedSet.value, prefix])

      // 选中状态不变（不清除当前打开的文档）
    } catch (err) {
      // 用户取消选择时不报错
      if ((err as DOMException).name !== 'AbortError') {
        console.error('打开文件夹失败:', err)
        alert('打开文件夹失败，请重试。')
      }
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除所有已打开的文件夹，重置全部状态
   */
  const clearAllFolders = () => {
    folders.value = []
    openedFiles.value = [] // 同时关闭所有已打开的文件标签
    selectedPath.value = ''
    fileContent.value = ''
    expandedSet.value = new Set()
  }

  /**
   * 文件选中处理
   * 使用 FileSystemFileHandle 异步读取文件内容，
   * 同时记录到右侧标签栏，支持后续切换
   */
  const onFileSelect = async (path: string) => {
    selectedPath.value = path
    fileContent.value = ''
    readingFile.value = true

    // 从文件树中查找节点
    const node = findNode(fileTree.value, path)
    if (node?.handle) {
      try {
        // 通过 File System Access API 读取文件
        // @ts-ignore — FileSystemFileHandle.getFile()
        const file = await node.handle.getFile()
        const content = await file.text()
        fileContent.value = content

        // 记录到标签栏（如果尚未存在）
        const existing = openedFiles.value.find(f => f.path === path)
        if (!existing) {
          openedFiles.value = [
            ...openedFiles.value,
            {
              path,
              name: node.name,
              language: node.language || 'text',
              content // 缓存文件内容
            }
          ]
        } else {
          // 更新缓存内容
          existing.content = content
        }
      } catch (err) {
        console.error('读取文件失败:', err)
        fileContent.value = `// 读取文件失败: ${err}\n// 文件可能已被移动或权限不足`
      } finally {
        readingFile.value = false
      }
    } else {
      readingFile.value = false
    }
  }

  /**
   * 切换到标签栏中的某个文件
   * 直接从缓存中恢复内容，无需重新读取
   */
  const switchTab = (path: string) => {
    if (path === selectedPath.value) return // 已是当前激活标签
    const tab = openedFiles.value.find(f => f.path === path)
    if (tab) {
      selectedPath.value = path
      fileContent.value = tab.content // 从缓存恢复内容
    }
  }

  /**
   * 关闭标签栏中的某个文件
   * 如果关闭的是当前激活标签，则自动切换到相邻标签
   */
  const closeTab = (path: string, event: MouseEvent) => {
    event.stopPropagation() // 阻止触发标签切换
    const idx = openedFiles.value.findIndex(f => f.path === path)
    if (idx === -1) return

    // 移除该标签
    const next = openedFiles.value.filter(f => f.path !== path)

    // 如果关闭的是当前激活标签，切换到相邻标签
    if (path === selectedPath.value) {
      // 优先切到右侧，否则切到左侧，否则清空
      const newIdx = Math.min(idx, next.length - 1)
      if (next.length > 0 && newIdx >= 0) {
        const tab = next[newIdx]
        selectedPath.value = tab.path
        fileContent.value = tab.content
      } else {
        selectedPath.value = ''
        fileContent.value = ''
      }
    }

    openedFiles.value = next
  }
</script>

<style scoped>
  /* ============================================================
     整体布局
     ============================================================ */
  .app-layout {
    min-height: 100vh;
    background: #f4f6f9;
  }

  /* ============================================================
     左侧边栏
     ============================================================ */
  .app-sidebar {
    background: #141a28;
    color: #fff;
    border-right: 1px solid rgba(255, 255, 255, 0.06);
    display: flex;
    flex-direction: column;
    overflow: hidden;
    height: 100vh; /* 固定为视口高度，不随内容撑开 */
    position: sticky; /* 粘性定位，保持固定在左侧 */
    top: 0;
    flex-shrink: 0;
  }

  /* 侧栏顶部：品牌标识 + 文件夹名 */
  .sidebar-header {
    height: 52px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    flex-shrink: 0;
  }

  .brand-mark {
    font-size: 20px;
    line-height: 1;
  }

  .brand-text strong {
    display: block;
    color: #e8ecf1;
    font-size: 14px;
    line-height: 1.2;
  }

  .brand-text span {
    display: block;
    color: #6b7a93;
    font-size: 11px;
    margin-top: 1px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  /* 打开文件夹按钮 */
  .sidebar-actions {
    padding: 10px 12px;
    flex-shrink: 0;
  }

  .open-folder-btn {
    width: 100%;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.04);
    color: #c8d0dc;
    font-size: 13px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .open-folder-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    border-color: rgba(255, 255, 255, 0.35);
    color: #fff;
  }

  .open-folder-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .btn-icon {
    font-size: 15px;
  }

  /* 清除所有文件夹按钮 */
  .clear-btn {
    width: 100%;
    height: 28px;
    margin-top: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    background: transparent;
    color: #8b95a5;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .clear-btn:hover {
    background: rgba(239, 68, 68, 0.15);
    border-color: rgba(239, 68, 68, 0.3);
    color: #ef4444;
  }

  /* 文件树容器（可滚动） */
  .tree-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .tree-wrapper::-webkit-scrollbar {
    width: 5px;
  }
  .tree-wrapper::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }

  /* 空状态提示 */
  .tree-empty {
    padding: 24px 16px;
    text-align: center;
    color: #6b7a93;
    font-size: 13px;
    line-height: 1.6;
  }

  .tree-empty-hint {
    color: #4a556b;
    font-size: 11px;
    margin-top: 4px;
  }

  /* ============================================================
     顶部 Header
     ============================================================ */
  .app-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }

  .header-left {
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
  }

  .header-icon {
    font-size: 16px;
    flex-shrink: 0;
  }

  .header-title {
    font-weight: 600;
    color: #1f2937;
    font-size: 14px;
    white-space: nowrap;
  }

  .header-path {
    color: #8b95a5;
    font-size: 12px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .header-actions {
    flex-shrink: 0;
  }

  /* ============================================================
     文件标签栏
     ============================================================ */
  .tab-bar {
    display: flex;
    align-items: center;
    gap: 0;
    height: 36px;
    background: #f0f2f5;
    border-bottom: 1px solid #e5e7eb;
    overflow-x: auto;
    overflow-y: hidden;
    flex-shrink: 0;
    padding: 0 4px;
  }

  /* 隐藏标签栏滚动条（保持简洁） */
  .tab-bar::-webkit-scrollbar {
    height: 0;
  }

  .tab-item {
    display: flex;
    align-items: center;
    gap: 5px;
    height: 28px;
    padding: 0 10px;
    margin: 0 1px;
    border-radius: 4px 4px 0 0;
    font-size: 12px;
    color: #6b7280;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: all 0.12s;
    flex-shrink: 0;
    border: 1px solid transparent;
    border-bottom: none;
    position: relative;
    top: 1px;
  }

  .tab-item:hover {
    background: #e5e7eb;
    color: #374151;
  }

  /* 激活标签 */
  .tab-item.active {
    background: #fff;
    color: #1f2937;
    font-weight: 500;
    border-color: #e5e7eb;
  }

  .tab-icon {
    font-size: 11px;
    font-weight: 700;
    flex-shrink: 0;
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 2px;
    color: #6b7280;
  }

  .tab-close {
    width: 16px;
    height: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 3px;
    font-size: 14px;
    line-height: 1;
    color: #9ca3af;
    flex-shrink: 0;
    transition: all 0.1s;
    margin-left: 2px;
  }

  .tab-close:hover {
    background: #d1d5db;
    color: #374151;
  }

  /* ============================================================
     主内容区域
     ============================================================ */
  .app-main {
    padding: 20px;
  }

  /* ----- 空状态 ----- */
  .empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: calc(100vh - 140px);
    color: #8b95a5;
  }

  .empty-icon {
    font-size: 56px;
    margin-bottom: 16px;
  }

  .empty-state h2 {
    margin: 0 0 8px;
    color: #374151;
    font-size: 20px;
  }

  .empty-state p {
    margin: 0;
    color: #9ca3af;
    font-size: 14px;
  }

  /* ----- 代码查看器 ----- */
  .code-viewer {
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #e5e7eb;
    background: #fff;
    display: flex;
    flex-direction: column;
    /* 减去 Header + Main padding，填满视口高度 */
    height: calc(100vh - 135px);
  }

  /* 工具栏：仿 VSCode 风格 */
  .code-toolbar {
    height: 40px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 0 14px;
    background: #1e293b;
    color: #94a3b8;
    font-size: 12px;
    flex-shrink: 0;
  }

  .toolbar-item {
    display: flex;
    gap: 6px;
  }

  .toolbar-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .toolbar-filename {
    color: #cbd5e1;
    font-weight: 500;
  }

  /* 代码主体：flex 行布局（行号 + 代码） */
  .code-body {
    display: flex;
    font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', 'Consolas', monospace;
    font-size: 13px;
    line-height: 1.6;
    flex: 1;
    min-height: 0;
  }

  /* 行号列 */
  .line-numbers {
    flex-shrink: 0;
    padding: 12px 0;
    background: #f8fafc;
    border-right: 1px solid #e5e7eb;
    text-align: right;
    user-select: none;
  }

  .line-num {
    padding: 0 14px 0 10px;
    color: #94a3b8;
    font-size: 12px;
  }

  /* 代码内容列（横向可滚动） */
  .code-content {
    flex: 1;
    padding: 12px 0;
    overflow-x: auto;
    background: #fcfcfd;
  }

  /* 确保 highlight.js 主题不覆盖代码查看器的背景 */
  .code-content pre,
  .code-content code {
    background: transparent !important;
  }

  /* 单行代码行：默认文字色 */
  .code-line {
    padding: 0 16px;
  }

  .code-line pre {
    margin: 0;
    font-family: inherit;
    font-size: inherit;
    color: #334155;
  }

  .code-line code {
    font-family: inherit;
    font-size: inherit;
    white-space: pre;
    /* 取消颜色继承，让 hljs 的 span 完全控制着色 */
    color: initial;
  }

  /* ── 代码语法着色覆盖 ──
     由于 <style scoped> 会为选择器添加 data 属性，
     v-html 渲染的 hljs span 没有该属性，导致 hljs
     全局样式可能被 scoped 的父级颜色覆盖。
     在此显式定义常见着色类，确保高亮生效。 */

  /* 注释：灰色斜体 */
  .code-content :deep(.hljs-comment),
  .code-content :deep(.hljs-quote),
  .code-content :deep(.hljs-doctag) {
    color: #6a737d !important;
    font-style: italic;
  }

  /* 关键字：蓝色 */
  .code-content :deep(.hljs-keyword),
  .code-content :deep(.hljs-selector-tag),
  .code-content :deep(.hljs-type),
  .code-content :deep(.hljs-title.class_),
  .code-content :deep(.hljs-built_in) {
    color: #d73a49 !important;
  }

  /* 字符串：绿色 */
  .code-content :deep(.hljs-string),
  .code-content :deep(.hljs-attribute) {
    color: #032f62 !important;
  }

  /* 数字 */
  .code-content :deep(.hljs-number),
  .code-content :deep(.hljs-literal) {
    color: #005cc5 !important;
  }

  /* 函数名/方法 */
  .code-content :deep(.hljs-title),
  .code-content :deep(.hljs-title.function_) {
    color: #6f42c1 !important;
  }

  /* HTML 标签 */
  .code-content :deep(.hljs-tag),
  .code-content :deep(.hljs-name),
  .code-content :deep(.hljs-attr) {
    color: #22863a !important;
  }

  /* CSS 属性 */
  .code-content :deep(.hljs-attribute),
  .code-content :deep(.hljs-selector-class) {
    color: #e36209 !important;
  }

  /* 空行隐藏内容（保持行号对齐） */
  .line-empty pre {
    color: transparent;
  }

  /* ============================================================
     响应式布局
     ============================================================ */
  @media (max-width: 760px) {
    .app-sidebar {
      display: none;
    }
  }
</style>
