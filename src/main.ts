import { createApp } from 'vue'
import App from './App.vue'
import './style.css'

// 仅你页面用到的组件
import {
  ElConfigProvider,
  ElContainer,
  ElAside,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElCard,
  ElTable,
  ElTableColumn,
  ElTag,
  ElAvatar,
  ElCheckbox,
  ElInput,
  ElSelect,
  ElOption,
  ElForm,
  ElFormItem,
  ElRadioGroup,
  ElRadioButton,
  ElButton
} from 'element-plus'

// 逐个引入对应组件独立CSS，不引入全局index.css
import 'element-plus/es/components/config-provider/style/css'
import 'element-plus/es/components/container/style/css'
import 'element-plus/es/components/aside/style/css'
import 'element-plus/es/components/header/style/css'
import 'element-plus/es/components/main/style/css'
import 'element-plus/es/components/menu/style/css'
import 'element-plus/es/components/menu-item/style/css'
import 'element-plus/es/components/card/style/css'
import 'element-plus/es/components/table/style/css'
import 'element-plus/es/components/table-column/style/css'
import 'element-plus/es/components/tag/style/css'
import 'element-plus/es/components/avatar/style/css'
import 'element-plus/es/components/checkbox/style/css'
import 'element-plus/es/components/input/style/css'
import 'element-plus/es/components/select/style/css'
import 'element-plus/es/components/option/style/css'
import 'element-plus/es/components/form/style/css'
import 'element-plus/es/components/form-item/style/css'
import 'element-plus/es/components/radio-group/style/css'
import 'element-plus/es/components/radio-button/style/css'
import 'element-plus/es/components/button/style/css'

// 页面用到的图标，手动引入注册
import { Bell, DataBoard, Refresh, Search, Setting, Tickets, TrendCharts, User } from '@element-plus/icons-vue'

const app = createApp(App)

// 批量注册用到的组件
const compList = [
  ElConfigProvider,
  ElContainer,
  ElAside,
  ElHeader,
  ElMain,
  ElMenu,
  ElMenuItem,
  ElCard,
  ElTable,
  ElTableColumn,
  ElTag,
  ElAvatar,
  ElCheckbox,
  ElInput,
  ElSelect,
  ElOption,
  ElForm,
  ElFormItem,
  ElRadioGroup,
  ElRadioButton,
  ElButton
]
compList.forEach(c => app.use(c))

// 注册图标
const iconList = [Bell, DataBoard, Refresh, Search, Setting, Tickets, TrendCharts, User]
iconList.forEach(icon => {
  if (icon.name) app.component(icon.name, icon)
})

app.mount('#app')
