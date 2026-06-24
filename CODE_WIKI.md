# Code Wiki — Web 文件浏览器 + AI 智能助手

## 一、项目概述

| 项目属性     | 说明                                                                    |
| ------------ | ----------------------------------------------------------------------- |
| **项目名称** | `vite-vue-ts-template`                                                  |
| **版本**     | 1.0.0                                                                   |
| **技术栈**   | Vue 3 + TypeScript + Vite + Element Plus                                |
| **项目定位** | 基于 File System Access API 的 Web 文件浏览器，集成 AI 流式对话助手     |
| **核心功能** | 本地文件夹浏览、文件语法高亮查看、多标签页管理、AI 智能对话（SSE 流式） |
| **包管理器** | npm / pnpm                                                              |

---

## 二、项目整体架构

```
vite-project/
├── .husky/                          # Git hooks 配置
│   ├── commit-msg                   # 提交信息校验 hook（commitlint）
│   └── pre-commit                   # 提交前代码检查 hook（lint-staged）
├── .vscode/
│   └── extensions.json              # 推荐 VS Code 插件
├── public/
│   ├── favicon.svg                  # 网站图标
│   └── icons.svg                    # SVG 图标精灵
├── src/                             # 核心源码
│   ├── assets/                      # 静态资源（图片）
│   │   ├── hero.png
│   │   ├── vite.svg
│   │   └── vue.svg
│   ├── components/                  # Vue 组件
│   │   ├── FileTree.vue             # 递归文件树组件
│   │   ├── aIchat.vue               # AI 智能助手聊天组件（流式对话）
│   │   └── HelloWorld.vue           # Vite 脚手架默认示例（未在 App 中引用）
│   ├── types/                       # TypeScript 类型声明
│   │   ├── auto-imports.d.ts        # unplugin-auto-import 自动生成的类型
│   │   ├── components.d.ts          # unplugin-vue-components 自动生成的类型
│   │   └── tree.ts                  # TreeNode 文件树节点类型
│   ├── App.vue                      # 根组件：文件浏览器主界面
│   ├── env.d.ts                     # 全局类型声明（Vue SFC、资源文件、环境变量）
│   ├── main.ts                      # 应用入口
│   └── style.css                    # 全局样式
├── .env.dev                         # 开发环境变量
├── .env.prod                        # 生产环境变量
├── .env.test                        # 测试环境变量（暂空）
├── .eslintrc-auto-import.json       # ESLint 自动导入全局配置
├── .gitignore
├── .prettierignore
├── .prettierrc                      # Prettier 格式化配置
├── commitlint.config.js             # Commitlint 提交规范配置
├── eslint.config.js                 # ESLint 配置（Flat 格式）
├── index.html                       # HTML 入口
├── package.json
├── tsconfig.json                    # TypeScript 配置
├── tsconfig.node.json               # Node 侧 TypeScript 配置
└── vite.config.ts                   # Vite 构建配置
```

---

## 三、主要模块职责

### 3.1 构建配置层 — `vite.config.ts`

Vite 构建系统的核心配置文件，涵盖开发服务器、编译优化、打包策略全流程。

| 配置项         | 职责                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ |
| **路径别名**   | `@` → `src/`, `@api` → `src/api`, `@comp` → `src/components`, `@hooks` → `src/hooks` |
| **开发服务器** | 端口 3000，自动打开浏览器，配置 `/api` 代理转发到后端地址                            |
| **CSS 预处理** | 集成 SCSS，自动注入全局变量文件                                                      |
| **依赖预构建** | 强制预构建 `vue` / `vue-router` / `pinia` / `axios`，加速冷启动                      |
| **生产构建**   | 代码分包、Gzip 压缩（阈值 10KB）、清除 console/debugger、静态资源分类输出            |
| **插件系统**   | Vue SFC 编译、自动导入、组件自动注册、Gzip 压缩、体积分析                            |

#### 关键配置详解

**环境变量加载**：根据 `--mode` 参数加载对应 `.env.[mode]` 文件，通过 `loadEnv` 注入到构建流程。

**代理配置**：

```js
proxy: {
  '/api': {
    target: env.VITE_API_HOST,  // 从环境变量读取
    changeOrigin: true,
    rewrite: path => path.replace(/^\/api/, '')
  }
}
```

**分包策略** (`manualChunks`)：

| 匹配库                         | 分块名称           |
| ------------------------------ | ------------------ |
| `element-plus`                 | `ep-vendor`        |
| `@vueuse`                      | `vueuse`           |
| `lodash-es`                    | `lodash`           |
| `axios`                        | `axios-vendor`     |
| `vue` / `vue-router` / `pinia` | `vue-vendor`       |
| 其余 `node_modules`            | `common-vendor`    |
| `src/components`               | `components-chunk` |

### 3.2 应用入口层 — `src/main.ts`

负责 Vue 应用的初始化与插件注册。

| 职责                      | 说明                                                                 |
| ------------------------- | -------------------------------------------------------------------- |
| **创建应用**              | `createApp(App)`                                                     |
| **Element Plus 组件注册** | 手动按需注册 21 个组件，避免全量引入                                 |
| **Element Plus 样式引入** | 逐个引入对应组件的独立 CSS，不引入全局 `index.css`，减小打包体积     |
| **图标注册**              | 注册 8 个 `@element-plus/icons-vue` 图标为全局组件                   |
| **markstream-vue 注册**   | 全局注册 `MarkdownRender` 组件，用于 AI 助手的流式 Markdown 渲染     |
| **PrismJS 语言组件导入**  | 导入 12 种语言组件（ts, bash, json, python, java, go, css, scss 等） |
| **挂载**                  | `app.mount('#app')`                                                  |

**已注册的 Element Plus 组件**：

`ElConfigProvider`, `ElContainer`, `ElAside`, `ElHeader`, `ElMain`, `ElMenu`, `ElMenuItem`, `ElCard`, `ElTable`, `ElTableColumn`, `ElTag`, `ElAvatar`, `ElCheckbox`, `ElInput`, `ElSelect`, `ElOption`, `ElForm`, `ElFormItem`, `ElRadioGroup`, `ElRadioButton`, `ElButton`

**已注册的图标**：

`Bell`, `DataBoard`, `Refresh`, `Search`, `Setting`, `Tickets`, `TrendCharts`, `User`

### 3.3 根组件 — `src/App.vue`（文件浏览器）

项目的主界面组件，实现了一个完整的 Web 文件浏览器。

**布局结构**：

```
el-config-provider
└── el-container.app-layout
    ├── el-aside.app-sidebar (260px)          ← 左侧深色侧栏
    │   ├── .sidebar-header (品牌标识)
    │   ├── .sidebar-actions (打开文件夹按钮 + 清除按钮)
    │   └── .tree-wrapper
    │       └── FileTree (递归文件树组件)
    │
    └── el-container                           ← 右侧内容区域
        ├── el-header.app-header (52px)        ← 顶部栏：当前文件名 + 路径
        ├── .tab-bar (36px)                    ← 文件标签栏（多标签切换）
        └── el-main.app-main                   ← 代码查看器
            └── .code-viewer
                ├── .code-toolbar (仿 VSCode 红黄绿圆点)
                └── .code-body
                    ├── .line-numbers (行号列)
                    └── .code-content (PrismJS 语法高亮代码)
```

#### 核心数据状态

| 数据           | 类型                          | 说明                                       |
| -------------- | ----------------------------- | ------------------------------------------ |
| `folders`      | `ref<Array<{id,name,nodes}>>` | 已打开的文件夹列表，每个文件夹独立构建子树 |
| `selectedPath` | `ref<string>`                 | 当前选中文件的唯一路径                     |
| `expandedSet`  | `ref<Set<string>>`            | 已展开的文件夹路径集合                     |
| `fileContent`  | `ref<string>`                 | 当前文件的文本内容                         |
| `openedFiles`  | `ref<OpenedFile[]>`           | 已打开的文件标签列表（含缓存内容）         |
| `loading`      | `ref<boolean>`                | 文件夹打开中状态                           |
| `readingFile`  | `ref<boolean>`                | 文件读取中状态                             |

#### 核心方法

| 方法                    | 说明                                                               |
| ----------------------- | ------------------------------------------------------------------ |
| `openFolder()`          | 调用 `showDirectoryPicker` 打开系统文件夹选择器，递归遍历构建树    |
| `clearAllFolders()`     | 清除所有已打开的文件夹，重置全部状态                               |
| `onFileSelect(path)`    | 选中文件 → 通过 `FileSystemFileHandle` 异步读取内容 → 添加到标签栏 |
| `switchTab(path)`       | 从标签栏切换到已打开的文件（从缓存恢复内容，无需重新读取）         |
| `closeTab(path, event)` | 关闭标签，自动切换到相邻标签                                       |
| `walkDirectory()`       | 递归遍历目录，构建 TreeNode 树（文件夹在前，按名称排序）           |

#### 关键技术要点

- **File System Access API**：使用 `window.showDirectoryPicker()` 打开本地文件夹，通过 `FileSystemDirectoryHandle` 递归遍历目录结构
- **路径唯一性**：每个文件夹分配唯一 ID（`__folder_{id}`），作为所有子路径的前缀，避免多文件夹场景下路径冲突
- **语法高亮**：使用 PrismJS 对代码进行着色，Vue 文件映射为 HTML 语法进行高亮
- **标签缓存**：已打开的文件内容缓存在 `openedFiles` 中，切换标签时无需重新读取磁盘文件
- **行号渲染**：代码按行分割，左侧行号列与右侧代码列通过索引对齐

### 3.4 文件树组件 — `src/components/FileTree.vue`

递归渲染文件/文件夹目录树的独立组件。

**Props**：

| 属性           | 类型              | 说明                              |
| -------------- | ----------------- | --------------------------------- |
| `nodes`        | `TreeNode[]`      | 树节点数据                        |
| `selectedPath` | `string`          | 当前选中文件路径（高亮标识）      |
| `depth`        | `number` (默认 0) | 当前递归深度，用于缩进计算        |
| `modelValue`   | `Set<string>`     | 已展开的文件夹路径集合（v-model） |

**Events**：

| 事件                | 载荷           | 说明               |
| ------------------- | -------------- | ------------------ |
| `select`            | `path: string` | 文件被选中时触发   |
| `update:modelValue` | `Set<string>`  | 展开集合变化时触发 |

**核心逻辑**：

- `handleClick(node)`：点击文件夹切换展开/折叠状态，点击文件触发选中事件
- `iconClass(node)`：根据文件扩展名返回对应 CSS 图标类名（支持 12+ 种文件类型）
- 使用 `defineOptions({ name: 'FileTree' })` 声明组件名，使递归引用生效
- 文件夹展开状态通过 `modelValue`（`Set<string>`）驱动，支持向上同步状态

**文件图标映射**：

| 扩展名               | 图标样式        |
| -------------------- | --------------- |
| `vue`                | 绿色 V 标记     |
| `ts` / `tsx` / `dts` | 蓝色 T 标记     |
| `js` / `jsx`         | 黄色 JS 标记    |
| `json`               | 绿色 `{ }` 标记 |
| `css`                | 蓝色 `#` 标记   |
| `html`               | 橙色 `<>` 标记  |
| `md`                 | 蓝色 M 标记     |
| `svg` / `png`        | 粉色图片图标    |
| 文件夹（展开）       | 📂 图标         |
| 文件夹（折叠）       | 📁 图标         |
| 其他文件             | 📄 图标         |

### 3.5 AI 智能助手组件 — `src/components/aIchat.vue`

基于 SSE (Server-Sent Events) 流式对话的 AI 聊天窗口组件，支持代码块语法高亮、图片上传预览、悬浮球拖拽吸附等功能。

**功能特性**：

- 右下角悬浮球（可拖拽吸附左右边缘）
- SSE 流式文本回复（逐块渲染）
- markstream-vue 流式 Markdown 渲染
- PrismJS 代码块语法高亮（深色主题）
- 图片上传与内联预览
- 图片全屏查看器
- 进入/离开动画过渡
- 移动端自适应

**核心状态**：

| 状态              | 类型                         | 说明                   |
| ----------------- | ---------------------------- | ---------------------- |
| `open`            | `ref<boolean>`               | 窗口打开/关闭          |
| `messages`        | `ref<Message[]>`             | 聊天消息列表           |
| `inputText`       | `ref<string>`                | 输入框文本             |
| `loading`         | `ref<boolean>`               | 发送中状态             |
| `selectedImage`   | `ref<SelectedImage \| null>` | 选中的待发送图片       |
| `previewImageUrl` | `ref<string>`                | 预览图片 URL           |
| `dockLeft`        | `ref<number>`                | 悬浮球水平偏移（像素） |
| `dockBottom`      | `ref<number>`                | 悬浮球垂直偏移（像素） |
| `isDragging`      | `ref<boolean>`               | 悬浮球拖拽中           |

**核心方法**：

| 方法                                      | 说明                                                                    |
| ----------------------------------------- | ----------------------------------------------------------------------- |
| `send()`                                  | 发送消息 → POST 到 `http://127.0.0.1:3001/api/chat` → 处理 SSE 流式响应 |
| `openChat()`                              | 打开聊天窗口（区分拖拽与点击）                                          |
| `onDragStart / onDragMove / onDragEnd`    | 鼠标拖拽悬浮球，松手后水平吸附到最近的左右边缘                          |
| `onTouchStart / onTouchMove / onTouchEnd` | 移动端触摸拖拽悬浮球，逻辑同上                                          |
| `openImagePicker()`                       | 触发文件选择器（图片上传）                                              |
| `handleImageChange(event)`                | 处理图片文件选择，创建 ObjectURL 预览                                   |
| `removeImage()`                           | 移除已选图片并释放 ObjectURL                                            |
| `previewImage(msg)`                       | 打开图片全屏预览                                                        |
| `closeImageViewer()`                      | 关闭图片全屏预览                                                        |
| `scrollToBottom()`                        | 滚动聊天区域到底部                                                      |

**SSE 流式对话流程**：

1. 用户输入文本（可选附带图片）→ 添加到消息列表
2. 在消息列表末尾推入一条空的 AI 消息占位
3. 向 `http://127.0.0.1:3001/api/chat` 发起 POST 请求
4. 通过 `ReadableStream` 读取响应体
5. 逐行解析 SSE 格式的 `data:` 消息
6. 解析 JSON 提取 `choices[0].delta.content`，实时追加到 AI 消息
7. 遇到 `[DONE]` 标志或流结束 → 完成
8. 异常处理：网络错误显示提示信息

**PrismJS 自定义代码块**：

- 使用 `markstream-vue` 的 `setCustomComponents` 注册 `PrismCodeBlock` 组件
- 覆盖默认代码块渲染，用 PrismJS 进行语法高亮
- 深色主题样式（`hljs-code-block`），适配聊天气泡背景

---

## 四、工程化工具链

### 4.1 代码规范 — ESLint + Prettier

**ESLint** (`eslint.config.js`)：

- 继承 `@eslint/js` 推荐规则 + Vue 推荐规则 + Prettier 兼容配置
- 使用 TypeScript 解析器 (`@typescript-eslint/parser`)
- 规则：禁止 `console`（允许 warn/error）、禁止 `debugger`、禁止未使用变量
- 忽略：`dist`、`node_modules`、`*.d.ts`、`vite.config.ts`

**Prettier** (`.prettierrc`)：
| 规则 | 值 |
|------|-----|
| 分号 | 无 |
| 单引号 | 是 |
| 缩进 | 2 空格 |
| 尾逗号 | 无 |
| 行宽 | 120 |
| 箭头括号 | 避免 |
| Vue 缩进 | 启用 |

### 4.2 Git 提交规范 — Husky + Lint-Staged + Commitlint

**pre-commit hook** (`.husky/pre-commit`)：

```
npx --no lint-staged --no-revert
```

仅对暂存区文件执行 ESLint 修复 + Prettier 格式化。

**commit-msg hook** (`.husky/commit-msg`)：

```
npx --no -- commitlint --edit $1
```

**commitlint 规则** (`commitlint.config.js`)：

强制使用 Conventional Commits 规范，允许的 `type`：
`feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore` | `revert`

### 4.3 自动导入 — unplugin-auto-import + unplugin-vue-components

**AutoImport**：

- 自动导入 Vue API（ref, reactive, computed, onMounted 等）
- 自动导入 Vue Router API（useRouter, useRoute）
- 自动导入 Pinia API（defineStore, storeToRefs 等）
- Element Plus 组件样式的按需自动导入

**Components**：

- 自动注册 `src/components/` 下的全局组件
- Element Plus 组件按需自动注册（使用 `ElementPlusResolver`）

### 4.4 构建优化

| 优化项       | 实现方式                                                     |
| ------------ | ------------------------------------------------------------ |
| 代码分包     | Rollup `manualChunks` 按库拆分                               |
| Gzip 压缩    | `vite-plugin-compression`（阈值 10KB）                       |
| 控制台清除   | `terserOptions.drop_console/drop_debugger`                   |
| 静态资源分类 | JS → `static/js/`，CSS → `static/css/`，图片 → `static/img/` |
| 体积分析     | `rollup-plugin-visualizer`，打包后自动打开分析面板           |

---

## 五、依赖关系图

```
index.html
  └── src/main.ts
        ├── src/App.vue                     ← 文件浏览器根组件
        │     ├── Element Plus 组件         ← 按需注册（ElContainer, ElAside 等）
        │     ├── @element-plus/icons-vue   ← 8 个图标全局注册
        │     ├── FileTree.vue              ← 递归文件树组件
        │     │     └── types/tree.ts       ← TreeNode 类型
        │     └── AIChat.vue                ← AI 聊天助手（Teleport 到 body）
        │           ├── markstream-vue      ← 流式 Markdown 渲染
        │           ├── PrismJS             ← 代码语法高亮（12 种语言）
        │           └── fetch API → POST http://127.0.0.1:3001/api/chat
        └── src/style.css                   ← 全局样式

项目级配置依赖：
vite.config.ts → @vitejs/plugin-vue, unplugin-auto-import,
                  unplugin-vue-components, vite-plugin-compression,
                  rollup-plugin-visualizer, sass

eslint.config.js → @eslint/js, eslint-plugin-vue, eslint-plugin-prettier,
                   eslint-config-prettier, @typescript-eslint/parser,
                   @typescript-eslint/eslint-plugin

commitlint.config.js → @commitlint/config-conventional

.husky/ → husky, lint-staged, commitlint
```

---

## 六、关键类型与函数说明

### 6.1 核心类型定义

#### TreeNode — 文件树节点类型 (`src/types/tree.ts`)

```typescript
interface TreeNode {
  name: string // 文件/文件夹名
  type: 'file' | 'folder' // 节点类型
  path: string // 唯一路径标识
  children?: TreeNode[] // 子节点（仅文件夹有）
  language?: string // 文件语言（用于显示语言标签）
  handle?: FileSystemFileHandle // 文件系统句柄（仅文件有，用于异步读取内容）
}
```

#### OpenedFile — 已打开文件标签 (`App.vue`)

```typescript
interface OpenedFile {
  path: string // 含文件夹前缀的唯一路径
  name: string // 文件名
  language: string // 语言标签
  content: string // 已缓存的文件内容
}
```

#### Message — 聊天消息类型 (`aIchat.vue`)

```typescript
type Message = {
  role: 'user' | 'ai' // 消息角色
  content: string // 文本内容
  imageUrl?: string // 图片 URL
  imageName?: string // 图片名称
}
```

#### 环境变量类型 (`src/env.d.ts`)

```typescript
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_UPLOAD_URL: string
  readonly VITE_APP_ENV: 'dev' | 'test' | 'prod'
}
```

### 6.2 Vite 配置函数

| 函数/配置                                    | 位置                   | 说明                                                         |
| -------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `defineConfig(({ command, mode }) => {...})` | `vite.config.ts:9`     | 根配置函数，根据 `mode` 加载环境变量，返回完整 Vite 配置对象 |
| `loadEnv(mode, process.cwd(), '')`           | `vite.config.ts:10`    | 加载 `.env.[mode]` 文件中的环境变量                          |
| `manualChunks(id)`                           | `vite.config.ts:75-86` | 自定义分包策略，按依赖库名称拆分 chunk                       |

### 6.3 App.vue 关键方法

| 方法                         | 行号      | 说明                                                     |
| ---------------------------- | --------- | -------------------------------------------------------- |
| `openFolder()`               | 第 417 行 | 调用 `showDirectoryPicker` 打开文件夹，递归遍历构建树    |
| `walkDirectory(dirHandle)`   | 第 371 行 | 递归遍历目录，按"文件夹→文件"排序返回 TreeNode 数组      |
| `onFileSelect(path)`         | 第 472 行 | 选中文件，通过 FileSystemFileHandle 读取内容，加入标签栏 |
| `switchTab(path)`            | 第 518 行 | 切换标签，从缓存恢复文件内容                             |
| `closeTab(path, event)`      | 第 531 行 | 关闭标签，自动切换到相邻标签                             |
| `clearAllFolders()`          | 第 459 行 | 清除所有文件夹，重置全部状态                             |
| `findNode(nodes, path)`      | 第 354 行 | 在树中递归查找指定路径的节点                             |
| `prefixPaths(nodes, prefix)` | 第 252 行 | 给节点树递归添加路径前缀，确保多文件夹路径唯一           |
| `getFileIcon(name)`          | 第 289 行 | 根据文件名返回图标字符                                   |

### 6.4 FileTree.vue 关键方法

| 方法                | 行号      | 说明                                          |
| ------------------- | --------- | --------------------------------------------- |
| `handleClick(node)` | 第 83 行  | 文件夹切换展开/折叠，文件触发选中事件         |
| `iconClass(node)`   | 第 103 行 | 根据文件扩展名返回 CSS 图标类名（12+ 种类型） |

### 6.5 aIchat.vue 关键方法

| 方法                       | 行号      | 说明                                     |
| -------------------------- | --------- | ---------------------------------------- |
| `send()`                   | 第 333 行 | 发送消息，处理 SSE 流式响应              |
| `onDragStart(e)`           | 第 221 行 | 悬浮球鼠标拖拽开始                       |
| `onDragMove(e)`            | 第 236 行 | 悬浮球鼠标拖拽移动，边界约束             |
| `onDragEnd()`              | 第 254 行 | 悬浮球拖拽结束，水平吸附到最近的左右边缘 |
| `onTouchStart(e)`          | 第 271 行 | 悬浮球触摸拖拽开始（移动端）             |
| `onTouchMove(e)`           | 第 287 行 | 悬浮球触摸拖拽移动（移动端）             |
| `onTouchEnd()`             | 第 307 行 | 悬浮球触摸拖拽结束，水平吸附（移动端）   |
| `openImagePicker()`        | 第 411 行 | 触发图片文件选择器                       |
| `handleImageChange(event)` | 第 415 行 | 处理图片选择，创建 ObjectURL             |
| `previewImage(msg)`        | 第 439 行 | 打开图片全屏预览                         |
| `scrollToBottom()`         | 第 450 行 | 滚动聊天区域到底部                       |

### 6.6 langMap — 文件扩展名与语言标签映射 (`App.vue`)

| 扩展名                                      | 语言标签        |
| ------------------------------------------- | --------------- |
| `vue`                                       | `vue`           |
| `ts`                                        | `typescript`    |
| `tsx`                                       | `tsx`           |
| `js` / `jsx`                                | `javascript`    |
| `json`                                      | `json`          |
| `css` / `scss`                              | `css` / `scss`  |
| `html` / `xml`                              | `html` / `xml`  |
| `md`                                        | `markdown`      |
| `py` / `java` / `go` / `rust` / `cpp` / `c` | 对应语言名      |
| `bash` / `yml` / `yaml`                     | `bash` / `yaml` |

---

## 七、环境变量配置

| 文件        | 模式   | `VITE_BASE_URL` | `VITE_API_URL`          |
| ----------- | ------ | --------------- | ----------------------- |
| `.env.dev`  | `dev`  | `/`             | `http://localhost:8000` |
| `.env.prod` | `prod` | `/admin/`       | `https://api.prod.com`  |
| `.env.test` | `test` | （空）          | （空）                  |

---

## 八、项目运行方式

### 8.1 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 8.2 本地开发

```bash
# 开发环境（加载 .env.dev，端口 3000，自动打开浏览器）
npm run dev

# 或指定模式
npx vite --mode dev
```

### 8.3 生产构建

```bash
# 生产环境打包（加载 .env.prod）
npm run build

# 打包并打开体积分析面板
npm run build:analyze
```

### 8.4 预览构建产物

```bash
npm run preview
```

### 8.5 代码规范检查

```bash
# 校验所有源码
npm run lint

# 自动修复
npm run lint:fix

# Prettier 格式化
npm run format

# Prettier 格式校验
npm run format:check
```

### 8.6 AI 后端服务说明

AI 聊天功能需要配套的后端服务支持，端点地址为 `http://127.0.0.1:3001/api/chat`，采用 SSE (Server-Sent Events) 流式响应格式：

- 请求方式：`POST`
- 请求头：`Content-Type: application/json`
- 请求体：`{ "text": "用户消息内容" }`
- 响应格式：每行以 `data: ` 开头，后接 JSON 数据
- JSON 格式：`{ "choices": [{ "delta": { "content": "文本片段" } }] }`
- 结束标志：`data: [DONE]`

### 8.7 浏览器兼容性

文件浏览器功能依赖 **File System Access API**（`showDirectoryPicker`），需要 **Chromium 内核浏览器**（Chrome / Edge）支持。

### 8.8 脚本速查表

| 命令                    | 功能                                    |
| ----------------------- | --------------------------------------- |
| `npm run dev`           | 开发服务器（mode=dev）                  |
| `npm run build`         | TypeScript 检查 + 生产构建（mode=prod） |
| `npm run build:analyze` | 构建 + 体积分析                         |
| `npm run preview`       | 预览构建产物                            |
| `npm run lint`          | ESLint 校验                             |
| `npm run lint:fix`      | ESLint 自动修复                         |
| `npm run format`        | Prettier 格式化                         |
| `npm run format:check`  | Prettier 格式校验                       |

---

## 九、开发规范速查

### 9.1 路径别名

| 别名     | 映射路径          |
| -------- | ----------------- |
| `@`      | `src/`            |
| `@api`   | `src/api/`        |
| `@comp`  | `src/components/` |
| `@hooks` | `src/hooks/`      |

### 9.2 编码约定

- TypeScript 严格模式开启
- 未使用的变量/参数会报错（`_` 前缀的参数除外）
- 禁止 `console.log`（允许 `console.warn` / `console.error`）
- 禁止 `debugger`
- 组件名允许多个单词（`vue/multi-word-component-names` 关闭）
- 无分号、单引号、行宽 120
- 箭头参数不加括号（单参数时）

### 9.3 Git 提交规范

```
<type>: <描述>

# 示例：
# feat: 新增文件拖拽上传功能
# fix: 修复大文件读取时内存溢出问题
# chore: 升级 element-plus 依赖版本
```

### 9.4 扩展指引

**修改文件树**：在 `App.vue` 的 `walkDirectory` 函数中调整遍历逻辑，或修改 `FileTree.vue` 的图标映射表。

**添加语法高亮语言**：在 `src/main.ts` 中导入对应 `prismjs/components/prism-xxx` 模块，同时在 `App.vue` 的 `langMap` 中添加映射。

**更换 AI 后端地址**：在 `aIchat.vue` 的 `send()` 方法中修改 `fetch` 的 URL 地址。

**新增 Element Plus 组件**：在 `src/main.ts` 的 `compList` 数组中添加组件引用，同时导入对应 CSS 样式文件。
