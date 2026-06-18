# Vue3 + TypeScript + Vite 通用前端工程模板

## 项目介绍

基于 Vite + Vue3 + TypeScript 搭建标准化前端工程模板，内置完整工程化构建、代码规范、Git 提交校验全链路能力，统一团队开发标准，适配后台管理、H5 等各类前端业务场景。

## 一、工程化能力

### 1. 基础环境配置

- **路径别名**：全局 `@` 映射 `src`，Vite / TS / VSCode 三方同步识别，简化文件导入路径
- **多环境变量**：区分开发、测试、生产环境，独立配置接口域名、功能开关、埋点等变量，提供 TS 类型约束
- **本地跨域代理**：Vite 内置代理配置，本地开发一键解决接口跨域，无需额外中间层

### 2. 自动导入（减少重复代码）

集成 `unplugin-auto-import` + `unplugin-vue-components`

1. 自动导入 Vue 内置 API（ref / reactive / computed / onMounted 等），无需手动 import
2. 全局组件自动识别引入，页面直接使用无需单独导入
3. 支持主流 UI 组件库（Element Plus / NaiveUI 等）按需自动导入，减小打包体积

### 3. 开发构建提速

- Vite 依赖预构建配置，缓存第三方依赖，大幅提升冷启动、热更新速度
- 配置依赖强制预构建/排除列表，解决 ESM 依赖兼容问题

### 4. 生产打包优化

1. **Rollup 分包策略**
   Vue、路由、状态库、UI 组件库等第三方依赖单独拆分 chunk，利用浏览器并行加载，优化首屏速度
2. **Gzip 产物压缩**
   打包自动生成 `.gz` 压缩文件，配合 Nginx 开启服务端压缩，降低网络传输体积
3. **产物精简处理**
   - 生产环境清除 `console`、`debugger` 调试日志
   - JS / CSS / 静态资源分离打包，静态文件添加哈希后缀，长效利用浏览器缓存
4. **打包体积分析**
   内置可视化体积分析插件，一键查看各依赖占用大小，快速定位大体积包，整体打包体积可降低约 40%

## 二、代码规范体系 ESLint + Prettier

统一团队编码格式与语法校验，杜绝格式冲突、语法隐患：

1. ESLint：校验 TS / Vue 语法、变量规范、潜在代码错误
2. Prettier：统一缩进、引号、换行、逗号、模板排版等格式规则
3. 内置冲突兼容配置，消除 ESLint 与 Prettier 规则冲突

### 配套脚本

```bash
# 全局校验全项目代码规范
npm run lint

# 自动修复可格式化的代码问题
npm run lint:fix
```

## 三、Git 提交全流程约束 husky + lint-staged + commitlint

### 1. pre-commit 文件校验

仅校验本次提交修改文件，不全局扫描，兼顾效率与规范：

- 自动执行 Prettier 格式化 + ESLint 语法校验
- 代码违规直接阻断提交，保证入库代码统一规范

### 2. commit-msg 提交信息校验

遵循 `config-conventional` 语义化提交规范，拦截无意义、不规范 commit，便于版本迭代、日志生成、Bug 追溯。

#### 提交类型规范

| 类型     | 说明                                       |
| -------- | ------------------------------------------ |
| feat     | 新增页面、功能、交互                       |
| fix      | 修复线上/开发 Bug                          |
| docs     | 仅修改项目文档、注释                       |
| style    | 纯格式调整（空格、换行、分号），无逻辑变更 |
| refactor | 代码重构，无新增功能、无 Bug 修复          |
| perf     | 性能优化（渲染、请求、打包、加载速度等）   |
| test     | 新增/修改单元测试、E2E 测试用例            |
| chore    | 构建脚本、依赖、工程配置、工具调整         |
| revert   | 回滚历史提交记录                           |

## 四、项目安装与启动

### 1. 安装依赖

```bash
npm install
```

### 2. 本地开发启动

```bash
# 开发环境
npm run dev

# 测试环境
npm run dev:test
```

### 3. 生产打包

```bash
# 生产环境打包
npm run build

# 打包并打开体积分析面板
npm run build:analyze
```

### 4. 代码规范处理

```bash
# 校验代码规范
npm run lint

# 自动格式化修复
npm run lint:fix
```

## 五、模板解决的团队痛点

1. 团队代码风格混乱，合并代码产生大量格式冲突
2. 调试日志、语法隐患流入线上环境
3. Git 提交记录杂乱无章，迭代追溯、版本日志难以维护
4. 项目冷启动缓慢、打包体积臃肿，页面加载性能差
5. 多环境、跨域、路径别名等基础配置重复搭建，重复造轮子

## 六、工程化工具清单

- 构建：Vite、Rollup
- 语言：Vue3、TypeScript
- 自动导入：unplugin-auto-import、unplugin-vue-components
- 代码规范：ESLint、Prettier
- Git 校验：husky、lint-staged、commitlint
- 打包优化：vite-plugin-compression、rollup 分包、rollup-plugin-visualizer
- 环境管理：dotenv、vite 环境变量配置
