import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import VitePluginCompression from 'vite-plugin-compression'
import { visualizer } from 'rollup-plugin-visualizer'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'
export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isBuild = command === 'build'

  return {
    base: env.VITE_BASE_URL || '/',
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@api': resolve(__dirname, 'src/api'),
        '@comp': resolve(__dirname, 'src/components'),
        '@hooks': resolve(__dirname, 'src/hooks')
      }
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `@import "@/assets/styles/variables.scss";`
        }
      }
    },
    server: {
      port: 3000,
      open: true,
      proxy: {
        '/api': {
          target: env.VITE_API_HOST,
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api/, '')
        }
      }
    },
    optimizeDeps: {
      include: ['vue', 'vue-router', 'pinia', 'axios']
      // 新增：排除完整element-plus预构建，仅按需解析用到的组件
      // exclude: ['element-plus']
    },
    build: {
      chunkSizeWarningLimit: 1200, // 分包告警阈值(KB)
      sourcemap: false,
      assetsInlineLimit: 4096,
      terserOptions: {
        compress: {
          drop_console: isBuild,
          drop_debugger: isBuild
        }
      },
      rollupOptions: {
        // @ts-ignore
        onLog(level, log, defaultHandler) {
          if (log.message.includes('#__PURE__')) return
          defaultHandler(level, log)
        },
        output: {
          chunkFileNames: 'static/js/[name]-[hash].js',
          entryFileNames: 'static/js/[name]-[hash].js',
          assetFileNames: chunkInfo => {
            const fileName = chunkInfo.names?.[0] ?? ''
            const ext = fileName.split('.').pop() ?? '' // 关键兜底

            if (['png', 'jpg', 'jpeg', 'svg', 'webp'].includes(ext)) {
              return 'static/img/[name]-[hash].[ext]'
            }
            if (ext === 'css') return 'static/css/[name]-[hash].[ext]'
            return 'static/other/[name]-[hash].[ext]'
          },
          manualChunks(id) {
            if (id.includes('node_modules')) {
              // 把 element-plus 匹配放到最顶部，优先命中
              if (id.includes('element-plus')) return 'ep-vendor'
              if (id.includes('@vueuse')) return 'vueuse'
              if (id.includes('lodash-es')) return 'lodash'
              if (id.includes('axios')) return 'axios-vendor'
              if (id.includes('vue') || id.includes('vue-router') || id.includes('pinia')) return 'vue-vendor'
              return 'common-vendor'
            }
            if (id.includes('src/components')) return 'components-chunk'
          }
        }
      }
    },
    plugins: [
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia'],
        dts: 'src/types/auto-imports.d.ts',
        eslintrc: { enabled: true },
        resolvers: [ElementPlusResolver({ importStyle: 'css' })]
      }),
      Components({
        dts: 'src/types/components.d.ts',
        resolvers: [
          ElementPlusResolver({
            importStyle: 'css' // 自动引入对应组件单文件css
          })
        ]
      }),
      VitePluginCompression({ threshold: 10240, ext: '.gz' }),
      isBuild &&
        visualizer({
          filename: 'dist/stats.html',
          open: true,
          gzipSize: true, // 显示gzip压缩后体积
          brotliSize: true // 显示brotli压缩后体积
        })
    ].filter(Boolean)
  }
})
