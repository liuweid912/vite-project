# Code Wiki — Vite + Vue3 + TypeScript 前端工程模板

## 一、项目概述

| 项目属性     | 说明                                                                                                          |
| ------------ | ------------------------------------------------------------------------------------------------------------- |
| **项目名称** | `vite-vue-ts-template`                                                                                        |
| **版本**     | 1.0.0                                                                                                         |
| **技术栈**   | Vue 3 + TypeScript + Vite                                                                                     |
| **项目定位** | 标准化前端工程模板，内置完整工程化构建、代码规范、Git 提交校验全链路能力，适配后台管理、H5 等各类前端业务场景 |
| **包管理器** | npm / pnpm                                                                                                    |

---

## 二、项目整体架构

```
vite-project/
├── .husky/                          # Git hooks 配置
│   ├── commit-msg                   # 提交信息校验 hook
│   └── pre-commit                   # 提交前代码检查 hook
├── .vscode/
│   └── extensions.json              # 推荐 VS Code 插件
├── public/
│   ├── favicon.svg                  # 网站图标
│   └── icons.svg                    # SVG 图标精灵
├── src/                             # 核心源码
│   ├── assets/                      # 静态资源（图片等）
│   │   ├── hero.png
│   │   ├── vite.svg
│   │   └── vue.svg
│   ├── components/                  # Vue 组件
│   │   ├── HelloWorld.vue           # Vite 默认示例组件
│   │   ├── aIchat.vue               # AI 智能助手聊天组件
│   │   └── ...                      # （按需新增业务组件）
│   ├── types/                       # TypeScript 类型声明
│   │   ├── auto-imports.d.ts        # unplugin-auto-import 自动生成的类型
│   │   └── components.d.ts          # unplugin-vue-components 自动生成的类型
│   ├── App.vue                      # 根组件（管理后台布局）
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
| **生产构建**   | 代码分包、Gzip 压缩、清除 console/debugger、静态资源分类输出                         |
| **插件系统**   | Vue SFC 编译、自动导入、组件自动注册、压缩、体积分析                                 |

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

- `element-plus` → `ep-vendor`
- `@vueuse` → `vueuse`
- `lodash-es` → `lodash`
- `axios` → `axios-vendor`
- `vue` / `vue-router` / `pinia` → `vue-vendor`
- 其余 `node_modules` → `common-vendor`
- `src/components` → `components-chunk`

### 3.2 应用入口层 — `src/main.ts`

负责 Vue 应用的初始化与插件注册。

| 职责                      | 说明                                                             |
| ------------------------- | ---------------------------------------------------------------- |
| **创建应用**              | `createApp(App)`                                                 |
| **Element Plus 组件注册** | 手动按需注册 21 个组件，避免全量引入                             |
| **Element Plus 样式引入** | 逐个引入对应组件的独立 CSS，不引入全局 `index.css`，减小打包体积 |
| **图标注册**              | 注册 8 个 `@element-plus/icons-vue` 图标为全局组件               |
| **挂载**                  | `app.mount('#app')`                                              |

#### 已注册的 Element Plus 组件

`ElConfigProvider`, `ElContainer`, `ElAside`, `ElHeader`, `ElMain`, `ElMenu`, `ElMenuItem`, `ElCard`, `ElTable`, `ElTableColumn`, `ElTag`, `ElAvatar`, `ElCheckbox`, `ElInput`, `ElSelect`, `ElOption`, `ElForm`, `ElFormItem`, `ElRadioGroup`, `ElRadioButton`, `ElButton`

#### 已注册的图标

`Bell`, `DataBoard`, `Refresh`, `Search`, `Setting`, `Tickets`, `TrendCharts`, `User`

### 3.3 根组件 — `src/App.vue`

管理后台的整体布局页面，包含侧边导航、顶部 Header、内容区域和 AI 助手。

**布局结构**：

```
el-config-provider
└── el-container.admin-layout
    ├── el-aside.admin-sidebar (236px)
    │   ├── .brand (品牌标识)
    │   └── el-menu.side-menu (5 个导航项)
    └── el-container
        ├── el-header.admin-header (64px)
        │   ├── 标题 + 描述
        │   └── .header-actions (搜索框 + 通知按钮 + 头像)
        └── el-main.admin-main
            ├── .stat-grid (4 个统计卡片)
            ├── .content-grid
            │   ├── 近期订单表格
            │   └── 快捷操作表单
            └── 今日待办列表
```

#### 数据模型

| 数据       | 类型                   | 说明                                                   |
| ---------- | ---------------------- | ------------------------------------------------------ |
| `keyword`  | `ref<string>`          | 搜索关键字                                             |
| `stats`    | 数组常量               | 4 个统计指标（今日收入、活跃用户、待处理工单、转化率） |
| `orders`   | 数组                   | 5 条示例订单数据                                       |
| `taskForm` | `reactive`             | 快捷任务表单（名称、负责人、优先级）                   |
| `todos`    | `reactive<TodoItem[]>` | 4 条今日待办事项                                       |

#### 响应式布局

- **≤1100px**：统计卡片 2 列，内容区域单列
- **≤760px**：隐藏侧边栏，Header 改为纵向堆叠

### 3.4 AI 智能助手组件 — `src/components/aIchat.vue`

一个基于 SSE (Server-Sent Events) 流式对话的 AI 聊天窗口组件。

**功能特性**：

- 浮动按钮触发打开/关闭聊天窗口
- 支持流式文本回复（Streaming）
- 支持上传图片并预览
- 图片全屏查看器
- 进入/离开动画过渡
- 移动端自适应

**核心逻辑** (`send` 函数)：

1. 获取用户输入文本和图片
2. 添加到消息列表并滚动到底部
3. 向 `http://127.0.0.1:3001/api/chat` 发起 POST 请求
4. 使用 `ReadableStream` 读取 SSE 流式响应
5. 解析 `data:` 格式的 SSE 消息，实时追加到 AI 回复
6. 异常处理（网络错误、空响应等）

**状态管理**：
| 状态 | 类型 | 说明 |
|------|------|------|
| `open` | `ref<boolean>` | 窗口打开/关闭 |
| `messages` | `ref<Message[]>` | 聊天消息列表 |
| `inputText` | `ref<string>` | 输入框文本 |
| `loading` | `ref<boolean>` | 发送中状态 |
| `selectedImage` | `ref<SelectedImage \| null>` | 选中的待发送图片 |
| `previewImageUrl` | `ref<string>` | 预览图片 URL |

### 3.5 示例组件 — `src/components/HelloWorld.vue`

Vite 脚手架默认生成的示例组件，展示 Vite + Vue Logo 及 HMR 功能演示。包含计数器按钮和 Vite 社区链接。

### 3.6 类型声明 — `src/env.d.ts`

| 声明区域     | 内容                                                                                               |
| ------------ | -------------------------------------------------------------------------------------------------- |
| **Vue SFC**  | `*.vue` 文件模块声明                                                                               |
| **静态资源** | 图片、字体、多媒体文件（共 20+ 种格式）的类型声明                                                  |
| **环境变量** | `ImportMetaEnv` 接口定义（含 VITE_APP_TITLE / VITE_API_BASE_URL / VITE_UPLOAD_URL / VITE_APP_ENV） |
| **全局扩展** | `Window` 接口扩展（$message、**APP_VERSION**）                                                     |

### 3.7 环境变量配置

| 文件        | 模式   | VITE_BASE_URL | VITE_API_URL            |
| ----------- | ------ | ------------- | ----------------------- |
| `.env.dev`  | `dev`  | `/`           | `http://localhost:8000` |
| `.env.prod` | `prod` | `/admin/`     | `https://api.prod.com`  |
| `.env.test` | `test` | （空）        | （空）                  |

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
强制使用 Conventional Commits 规范，允许的 type：
`feat` | `fix` | `docs` | `style` | `refactor` | `perf` | `test` | `chore` | `revert`

### 4.3 自动导入 — unplugin-auto-import + unplugin-vue-components

**AutoImport**：

- 自动导入 Vue API（ref, reactive, computed, onMounted 等）
- 自动导入 Vue Router API（useRouter, useRoute）
- 自动导入 Pinia API（defineStore, storeToRefs 等）
- Element Plus 组件样式的按需自动导入

**Components**：

- 自动注册 `src/components/` 下的全局组件
- Element Plus 组件按需自动注册

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
        ├── src/App.vue
        │     ├── Element Plus 组件（21 个组件）
        │     ├── @element-plus/icons-vue（8 个图标）
        │     └── src/components/aIchat.vue
        │           └── fetch API → http://127.0.0.1:3001/api/chat
        ├── src/style.css
        └── Element Plus CSS（逐个组件独立引入）

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

## 六、关键类与函数说明

### 6.1 Vite 配置函数

| 函数/配置                                    | 位置                   | 说明                                                         |
| -------------------------------------------- | ---------------------- | ------------------------------------------------------------ |
| `defineConfig(({ command, mode }) => {...})` | `vite.config.ts:9`     | 根配置函数，根据 `mode` 加载环境变量，返回完整 Vite 配置对象 |
| `loadEnv(mode, process.cwd(), '')`           | `vite.config.ts:10`    | 加载 `.env.[mode]` 文件中的环境变量                          |
| `manualChunks(id)`                           | `vite.config.ts:75-86` | 自定义分包策略，按依赖库名称拆分 chunk                       |

### 6.2 应用入口

| 函数                             | 位置         | 说明                       |
| -------------------------------- | ------------ | -------------------------- |
| `createApp(App)`                 | `main.ts:56` | 创建 Vue 应用实例          |
| `app.use(component)`             | `main.ts:82` | 批量注册 Element Plus 组件 |
| `app.component(icon.name, icon)` | `main.ts:87` | 批量注册图标为全局组件     |
| `app.mount('#app')`              | `main.ts:90` | 挂载到 DOM                 |

### 6.3 核心组件函数

| 函数                       | 位置             | 说明                                                   |
| -------------------------- | ---------------- | ------------------------------------------------------ |
| `send()`                   | `aIchat.vue:95`  | 发送消息：读取输入、POST 到 AI 接口、处理 SSE 流式响应 |
| `openChat()`               | `aIchat.vue:89`  | 打开聊天窗口并滚动到底部                               |
| `openImagePicker()`        | `aIchat.vue:167` | 触发文件选择器（图片上传）                             |
| `handleImageChange(event)` | `aIchat.vue:171` | 处理图片文件选择，创建 ObjectURL 预览                  |
| `removeImage()`            | `aIchat.vue:187` | 移除已选图片并释放 ObjectURL                           |
| `previewImage(msg)`        | `aIchat.vue:195` | 打开图片全屏预览                                       |
| `closeImageViewer()`       | `aIchat.vue:201` | 关闭图片全屏预览                                       |
| `scrollToBottom()`         | `aIchat.vue:206` | 滚动聊天区域到底部                                     |

### 6.4 类型定义

| 类型/接口       | 位置               | 说明                                                  |
| --------------- | ------------------ | ----------------------------------------------------- |
| `Message`       | `aIchat.vue:66-71` | 聊天消息类型（role / content / imageUrl / imageName） |
| `SelectedImage` | `aIchat.vue:73-77` | 选中图片类型（file / name / url）                     |
| `TodoItem`      | `App.vue:229-235`  | 待办事项接口（title / time / label / type / done）    |
| `TagStatus`     | `App.vue:227`      | 标签状态联合类型                                      |
| `ImportMetaEnv` | `env.d.ts:94-99`   | 环境变量类型接口                                      |
| `Window`        | `env.d.ts:106-109` | window 全局扩展接口                                   |

---

## 七、项目运行方式

### 7.1 安装依赖

```bash
# 使用 npm
npm install

# 或使用 pnpm
pnpm install
```

### 7.2 本地开发

```bash
# 开发环境（加载 .env.dev，端口 3000，自动打开浏览器）
npm run dev

# 或指定模式
npx vite --mode dev
```

### 7.3 生产构建

```bash
# 生产环境打包（加载 .env.prod）
npm run build

# 打包并打开体积分析面板
npm run build:analyze
```

### 7.4 预览构建产物

```bash
npm run preview
```

### 7.5 代码规范检查

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

### 7.6 脚本速查表

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

## 八、开发规范速查

### 8.1 Git 提交规范

```
<type>: <描述>

# feat: 新增用户管理页面
# fix: 修复订单列表分页错误
# chore: 更新依赖版本
```

### 8.2 路径别名

| 别名     | 映射路径          |
| -------- | ----------------- |
| `@`      | `src/`            |
| `@api`   | `src/api/`        |
| `@comp`  | `src/components/` |
| `@hooks` | `src/hooks/`      |

### 8.3 编码约定

- TypeScript 严格模式开启
- 未使用的变量/参数会报错（`_` 前缀的参数除外）
- 禁止 `console.log`（允许 `console.warn` / `console.error`）
- 禁止 `debugger`
- 组件名允许多个单词（`vue/multi-word-component-names` 关闭）

---

## 九、扩展指引

### 9.1 新增页面

1. 在 `src/views/`（需新建）下创建 Vue 文件
2. 配置 `vue-router` 路由表
3. 在 `App.vue` 的侧边菜单中添加导航项

### 9.2 新增 API 模块

1. 在 `src/api/`（需新建）下创建模块文件
2. 使用 `axios` 封装请求
3. 通过 `@api` 别名引用

### 9.3 新增状态管理

1. 在 `src/stores/`（需新建）下创建 Pinia Store
2. 使用 `defineStore` 定义
3. 通过自动导入无需手动 import
