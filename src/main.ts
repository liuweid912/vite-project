import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// markstream-vue — 流式 Markdown 渲染组件（内置代码高亮）
import MarkdownRender from 'markstream-vue'
import 'markstream-vue/index.css'

// PrismJS — 文件查看器的代码语法着色（App.vue 中使用）
// 注意：不导入 prism.css 全局主题，各个组件自行用 :deep() 定义暗色主题的 .token.* 颜色
import 'prismjs/components/prism-typescript'
import 'prismjs/components/prism-bash'
import 'prismjs/components/prism-json'
import 'prismjs/components/prism-python'
import 'prismjs/components/prism-java'
import 'prismjs/components/prism-go'
import 'prismjs/components/prism-markup-templating'
import 'prismjs/components/prism-css'
import 'prismjs/components/prism-scss'
import 'prismjs/components/prism-yaml'
import 'prismjs/components/prism-markdown'
import 'prismjs/components/prism-rust'

// 仅页面用到的组件
import { ElConfigProvider, ElContainer, ElAside, ElHeader, ElMain, ElTag } from 'element-plus'

// 逐个引入对应组件独立CSS，不引入全局index.css
import 'element-plus/es/components/config-provider/style/css'
import 'element-plus/es/components/container/style/css'
import 'element-plus/es/components/aside/style/css'
import 'element-plus/es/components/header/style/css'
import 'element-plus/es/components/main/style/css'
import 'element-plus/es/components/tag/style/css'

const app = createApp(App)

// 批量注册用到的组件
const compList = [ElConfigProvider, ElContainer, ElAside, ElHeader, ElMain, ElTag]
compList.forEach(c => app.use(c))

// 全局注册 markstream-vue 的 MarkdownRender 组件
app.component('MarkdownRender', MarkdownRender)

app.mount('#app')
