// Vue 单文件组件类型声明（核心必需）
declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// ====================== 静态资源文件声明（规范带类型） ======================
// 图片格式
declare module '*.svg' {
  const src: string
  export default src
}
declare module '*.png' {
  const src: string
  export default src
}
declare module '*.jpg' {
  const src: string
  export default src
}
declare module '*.jpeg' {
  const src: string
  export default src
}
declare module '*.gif' {
  const src: string
  export default src
}
declare module '*.webp' {
  const src: string
  export default src
}
declare module '*.ico' {
  const src: string
  export default src
}
declare module '*.bmp' {
  const src: string
  export default src
}
declare module '*.tiff' {
  const src: string
  export default src
}

// 样式文件 css / scss / sass / less
declare module '*.css'
declare module '*.scss'
declare module '*.sass'
declare module '*.less'

// 字体文件
declare module '*.ttf' {
  const src: string
  export default src
}
declare module '*.woff' {
  const src: string
  export default src
}
declare module '*.woff2' {
  const src: string
  export default src
}
declare module '*.eot' {
  const src: string
  export default src
}
declare module '*.otf' {
  const src: string
  export default src
}

// 多媒体文件
declare module '*.mp4' {
  const src: string
  export default src
}
declare module '*.mp3' {
  const src: string
  export default src
}
declare module '*.wav' {
  const src: string
  export default src
}
declare module '*.ogg' {
  const src: string
  export default src
}

// ====================== Vite 全局环境变量类型 ======================
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_API_BASE_URL: string
  readonly VITE_UPLOAD_URL: string
  readonly VITE_APP_ENV: 'dev' | 'test' | 'prod'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// ====================== 全局自定义属性（挂载window） ======================
declare interface Window {
  $message: any
  __APP_VERSION__: string
}