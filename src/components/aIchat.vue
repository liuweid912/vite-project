<!--
  aIchat.vue — AI 智能助手聊天组件

  功能：
  - SSE 流式对话
  - 代码块自动识别 + highlight.js 语法着色
  - 图片上传与预览
  - 悬浮球可拖拽吸附左右边缘
-->
<template>
  <Teleport to="body">
    <!-- ============ 聊天窗口 ============ -->
    <transition name="chat-window" @after-enter="onAfterEnter">
      <section v-show="open" class="ai-chat-window" aria-label="AI 智能助手">
        <header class="chat-header">
          <div>
            <h2>AI 智能助手</h2>
            <p>实时对话 · 流式回复</p>
          </div>
          <button class="icon-button" type="button" aria-label="关闭聊天" @click="open = false">×</button>
        </header>

        <div ref="chatBody" class="chat-body" @scroll="onChatScroll">
          <div v-for="(msg, idx) in messages" :key="idx" class="chat-message" :class="msg.role">
            <div class="avatar" :class="`${msg.role}-avatar`">
              {{ msg.role === 'user' ? '我' : 'AI' }}
            </div>
            <div class="message-content">
              <span class="message-name">{{ msg.role === 'user' ? '我' : 'AI 助手' }}</span>

              <div v-if="loading && msg.role === 'ai' && !msg.content" class="bubble typing-bubble">
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
                <span class="typing-dot"></span>
              </div>

              <div v-else class="bubble">
                <!-- 图片 -->
                <img
                  v-if="msg.imageUrl"
                  class="message-image"
                  :src="msg.imageUrl"
                  :alt="msg.imageName || '上传图片'"
                  @click="previewImage(msg)"
                />
                <!-- 所有消息统一用 markstream-vue 渲染 Markdown（代码块由 PrismJS 高亮） -->
                <MarkdownRender v-if="msg.content" :content="msg.content" custom-id="ai" class="msg-md" />
              </div>
            </div>
          </div>
        </div>

        <!-- 重连状态栏 -->
        <div
          v-if="isReconnecting || (retryCount >= MAX_RETRIES && lastRequest)"
          class="reconnect-bar"
          :class="{ 'reconnect-failed': retryCount >= MAX_RETRIES }"
        >
          <template v-if="isReconnecting">
            <span class="reconnect-dot"></span>
            <span>连接中断，正在重连 ({{ retryCount }}/{{ MAX_RETRIES }})...</span>
          </template>
          <template v-else>
            <span>连接失败</span>
            <button class="retry-button" type="button" @click="manualRetry">重试</button>
          </template>
        </div>

        <footer class="chat-footer">
          <div class="input-panel">
            <div v-if="selectedImage" class="image-preview">
              <img :src="selectedImage.url" :alt="selectedImage.name" />
              <button class="remove-image" type="button" @click="removeImage">×</button>
            </div>
            <textarea v-model="inputText" rows="2" placeholder="输入你的问题..." @keydown.enter.prevent="send" />
          </div>
          <input ref="fileInput" class="file-input" type="file" accept="image/*" @change="handleImageChange" />
          <button class="secondary-button" type="button" @click="openImagePicker">图片</button>
          <button class="send-button" type="button" :disabled="loading" @click="send">
            {{ loading ? '发送中' : '发送' }}
          </button>
        </footer>
      </section>
    </transition>

    <!-- ============ 悬浮球（可拖拽吸附） ============ -->
    <button
      :class="['chat-fab', { 'fab-hidden': open }]"
      ref="fabRef"
      :style="fabStyle"
      type="button"
      aria-label="打开 AI 助手"
      @click="openChat"
      @mousedown="onDragStart"
      @touchstart="onTouchStart"
    >
      AI
      <span>助手</span>
    </button>

    <!-- ============ 图片全屏查看器 ============ -->
    <div v-if="previewImageUrl" class="image-viewer" @click="closeImageViewer">
      <button class="image-viewer-close" type="button" @click.stop="closeImageViewer">×</button>
      <img :src="previewImageUrl" :alt="previewImageName || '图片预览'" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { computed, defineComponent, h, nextTick, onBeforeUnmount, ref, watch } from 'vue'
  import Prism from 'prismjs'
  import { setCustomComponents, removeCustomComponents } from 'markstream-vue'

  // ============================================================
  // PrismJS 自定义代码块组件（覆盖 markstream-vue 内置代码块渲染）
  // ============================================================

  /** 用 PrismJS 高亮代码块的自定义渲染组件 */
  const PrismCodeBlock = defineComponent({
    name: 'PrismCodeBlock',
    props: {
      node: { type: Object, required: true }
    },
    setup(props) {
      return () => {
        const lang = props.node?.language || ''
        const code = props.node?.code || ''

        let highlighted = ''
        try {
          const grammar = lang ? Prism.languages[lang] : null
          if (grammar) {
            highlighted = Prism.highlight(code, grammar, lang)
          } else {
            highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
          }
        } catch {
          highlighted = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        }

        return h('pre', { class: 'hljs-code-block' }, [
          h('code', {
            class: lang ? `language-${lang}` : '',
            innerHTML: highlighted
          })
        ])
      }
    }
  })

  // 注册自定义代码块组件到 custom-id="ai" 的作用域
  setCustomComponents('ai', { code_block: PrismCodeBlock })

  // ============================================================
  // 类型定义
  // ============================================================

  type Message = {
    role: 'user' | 'ai'
    content: string
    imageUrl?: string
    imageName?: string
  }

  type SelectedImage = {
    file: File
    name: string
    url: string
  }

  // ============================================================
  // 聊天状态
  // ============================================================

  const open = ref(false)
  const messages = ref<Message[]>([{ role: 'ai', content: '你好，我是 AI 助手，有什么可以帮你？' }])
  const inputText = ref('')
  const loading = ref(false)
  const chatBody = ref<HTMLElement | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)
  const selectedImage = ref<SelectedImage | null>(null)
  const previewImageUrl = ref('')
  const previewImageName = ref('')

  // ============================================================
  // 断线重连状态
  // ============================================================

  /** 当前流式会话的 sessionId（服务端分配，用于断点重连） */
  const sessionId = ref('')

  /** 当前流式会话最后收到的事件序号（用于断点重连） */
  const lastEventId = ref(0)

  /** 当前流式请求的 AbortController（新消息发送时用于中断旧的流） */
  const streamController = ref<AbortController | null>(null)

  /** 是否正在重连中 */
  const isReconnecting = ref(false)

  /** 重连计数 */
  const retryCount = ref(0)

  /** 最大自动重试次数 */
  const MAX_RETRIES = 3

  /** 重连基础延迟（ms），每次重试递增 */
  const RETRY_BASE_DELAY = 1000

  /** 保存最后一次请求上下文，用于手动重试 */
  const lastRequest = ref<{ text: string; aiMsgIndex: number } | null>(null)

  /** 关闭前保存的滚动位置，重新打开时恢复 */
  const savedScrollTop = ref(0)

  /** 正在恢复滚动位置中，过渡期内屏蔽 scroll 事件避免覆盖 */
  const isRestoring = ref(false)

  // /** 流式输出中，最后一条 AI 消息是否已有内容（控制 loading 指示器显隐） */
  // const latestAiContent = computed(() => {
  //   const msgs = messages.value
  //   if (!msgs.length) return ''
  //   const last = msgs[msgs.length - 1]
  //   return last.role === 'ai' ? last.content : ''
  // })

  // ============================================================
  // 悬浮球拖拽状态
  // ============================================================

  /** 水平偏移（相对于左侧，单位 px），初始靠右 */
  const dockLeft = ref(window.innerWidth - 80)

  /** 垂直偏移（相对于底部，单位 px） */
  const dockBottom = ref(28)

  /** 当前是否正在拖拽中 */
  const isDragging = ref(false)

  /** 拖拽起始坐标（用于计算偏移差值） */
  const dragStart = { x: 0, y: 0 }

  /** 是否真正发生过拖拽（区分拖拽与点击） */
  const didDrag = ref(false)

  /** 按钮引用 */
  const fabRef = ref<HTMLElement | null>(null)

  /** 悬浮球样式（动态定位），拖拽中禁用过渡避免卡顿 */
  const fabStyle = computed(() => ({
    left: `${dockLeft.value}px`,
    bottom: `${dockBottom.value}px`,
    transition: isDragging.value ? 'none' : 'left 0.25s ease'
  }))

  // ============================================================
  // 悬浮球拖拽逻辑
  // ============================================================

  /**
   * 鼠标拖拽开始
   */
  const onDragStart = (e: MouseEvent) => {
    if (open.value) return
    e.preventDefault()
    isDragging.value = true
    didDrag.value = false
    dragStart.x = e.clientX
    dragStart.y = e.clientY

    document.addEventListener('mousemove', onDragMove)
    document.addEventListener('mouseup', onDragEnd)
  }

  /**
   * 鼠标拖拽移动
   */
  const onDragMove = (e: MouseEvent) => {
    if (!isDragging.value || !fabRef.value) return
    const dx = e.clientX - dragStart.x
    const dy = e.clientY - dragStart.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.value = true
    const vw = window.innerWidth
    const vh = window.innerHeight
    const fabW = 64
    const fabH = 64
    dockLeft.value = Math.max(12, Math.min(vw - fabW - 12, dockLeft.value + dx))
    dockBottom.value = Math.max(12, Math.min(vh - fabH - 12, dockBottom.value - dy))
    dragStart.x = e.clientX
    dragStart.y = e.clientY
  }

  /**
   * 鼠标拖拽结束 → 水平吸附到最近的左右边缘
   */
  const onDragEnd = () => {
    isDragging.value = false
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)

    if (fabRef.value) {
      const rect = fabRef.value.getBoundingClientRect()
      const center = rect.left + rect.width / 2
      const vw = window.innerWidth
      const fabW = 64
      dockLeft.value = center < vw / 2 ? 16 : vw - 16 - fabW
    }
  }

  /**
   * 触摸拖拽开始（移动端）
   */
  const onTouchStart = (e: TouchEvent) => {
    if (open.value) return
    e.preventDefault()
    isDragging.value = true
    didDrag.value = false
    const touch = e.touches[0]
    dragStart.x = touch.clientX
    dragStart.y = touch.clientY

    document.addEventListener('touchmove', onTouchMove, { passive: false })
    document.addEventListener('touchend', onTouchEnd)
  }

  /**
   * 触摸拖拽移动
   */
  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging.value) return
    e.preventDefault()
    const touch = e.touches[0]
    const dx = touch.clientX - dragStart.x
    const dy = touch.clientY - dragStart.y
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) didDrag.value = true
    const vw = window.innerWidth
    const vh = window.innerHeight
    const fabW = 64
    const fabH = 64
    dockLeft.value = Math.max(12, Math.min(vw - fabW - 12, dockLeft.value + dx))
    dockBottom.value = Math.max(12, Math.min(vh - fabH - 12, dockBottom.value - dy))
    dragStart.x = touch.clientX
    dragStart.y = touch.clientY
  }

  /**
   * 触摸拖拽结束 → 水平吸附
   */
  const onTouchEnd = () => {
    isDragging.value = false
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)

    if (fabRef.value) {
      const rect = fabRef.value.getBoundingClientRect()
      const center = rect.left + rect.width / 2
      const vw = window.innerWidth
      const fabW = 64
      dockLeft.value = center < vw / 2 ? 16 : vw - 16 - fabW
    }
  }

  // ============================================================
  // 聊天逻辑
  // ============================================================

  const openChat = async () => {
    if (didDrag.value) {
      didDrag.value = false
      return
    }
    isRestoring.value = true // 进入过渡期，屏蔽 scroll 事件
    open.value = true
  }

  /**
   * SSE 流式读取核心函数，支持自动断点重连
   * @param url        请求地址
   * @param body       请求体
   * @param onChunk    收到内容片段的回调
   * @param attempt   当前重试次数（内部递归使用）
   */
  async function readSSEStream(
    url: string,
    body: object,
    onChunk: (content: string) => void,
    attempt = 0
  ): Promise<boolean> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined
    try {
      const controller = new AbortController()
      streamController.value = controller

      // 请求超时（15s），防止后端无响应导致 fetch 永久挂起
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('请求超时')), 15000)
      })

      const res = await Promise.race([
        fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          signal: controller.signal
        }),
        timeoutPromise
      ])
      clearTimeout(timeoutId)

      if (!res.ok) {
        if (res.status === 404) return false
        throw new Error(`HTTP ${res.status}`)
      }

      if (!res.body) return false

      // 重连成功，立即清除重连状态，避免 reader 挂起时 UI 卡在"正在重连"
      isReconnecting.value = false
      retryCount.value = 0

      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let recvChunks = 0
      let lastLogTime = Date.now()

      while (true) {
        const { done, value } = await reader.read()
        if (done) {
          console.log(`[重连] reader 返回 done=true，已接收 ${recvChunks} 个 chunk`)
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        let pendingId = 0
        let hasNewData = false
        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed) continue
          hasNewData = true

          if (trimmed.startsWith('id: ')) {
            const idVal = parseInt(trimmed.slice(4), 10)
            if (!isNaN(idVal)) pendingId = idVal
          } else if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6)
            if (jsonStr === '[DONE]') continue

            try {
              const json = JSON.parse(jsonStr)
              // 首条消息包含 sessionId，记录后跳过
              if (json.sessionId) {
                sessionId.value = json.sessionId
                continue
              }
              const content = json.choices?.[0]?.delta?.content || ''
              if (content) {
                recvChunks++
                onChunk(content)
                // 只在 data 成功处理后更新 lastEventId，避免断线时丢失未处理的事件
                if (pendingId > 0) {
                  lastEventId.value = pendingId
                }
              }
            } catch {
              // 忽略非 JSON 片段
            }
          }
        }

        // 每 30 秒打印一次诊断日志，方便观察 reader 是否仍在工作
        if (hasNewData) {
          const now = Date.now()
          if (now - lastLogTime > 30000) {
            console.log(`[重连] 运行中，已接收 ${recvChunks} 个 chunk，lastEventId=${lastEventId.value}`)
            lastLogTime = now
          }
        }
      }

      console.log(`[重连] 流式读取完成，sessionId=${sessionId.value}`)
      return true
    } catch (err: any) {
      clearTimeout(timeoutId)
      if (err.name === 'AbortError') return false

      const tag = sessionId.value ? '重连' : '重试'
      console.error(`[${tag}] 第${attempt + 1}次尝试失败：`, err.message, {
        attempt,
        sessionId: sessionId.value,
        lastEventId: lastEventId.value,
        open: open.value
      })

      if (attempt < MAX_RETRIES && open.value) {
        // 有 sessionId 则走重连端点，否则重试首次请求
        const hasSession = !!sessionId.value
        isReconnecting.value = true
        retryCount.value = attempt + 1
        const delay = RETRY_BASE_DELAY * (attempt + 1)
        await new Promise(r => setTimeout(r, delay))
        // 延迟后二次校验，防止期间被新请求重置或对话框关闭
        if (!open.value) {
          isReconnecting.value = false
          return false
        }
        const success = await readSSEStream(
          hasSession ? 'http://127.0.0.1:3001/api/chat/reconnect' : url,
          hasSession ? { sessionId: sessionId.value, lastEventId: lastEventId.value } : body,
          onChunk,
          attempt + 1
        )
        // 如果递归重连也失败了，这里要确保 isReconnecting 被置为 false
        if (!success) {
          isReconnecting.value = false
        }
        return success
      }

      isReconnecting.value = false
      return false
    }
  }

  /**
   * 发送消息入口
   */
  const send = async () => {
    const text = inputText.value.trim()
    const image = selectedImage.value
    if ((!text && !image) || loading.value) return

    // 取消上一次未完成的请求
    streamController.value?.abort()

    // 重置 session 和重连状态
    sessionId.value = ''
    lastEventId.value = 0
    retryCount.value = 0
    isReconnecting.value = false

    messages.value.push({
      role: 'user',
      content: text,
      imageUrl: image?.url,
      imageName: image?.name
    })
    inputText.value = ''
    selectedImage.value = null
    if (fileInput.value) fileInput.value.value = ''
    loading.value = true

    // 先推入空消息，后续逐块追加（markstream-vue 会流式渲染不断增长的内容）
    const idx = messages.value.length
    messages.value.push({ role: 'ai', content: '' })
    const aiMsg = messages.value[idx]
    await nextTick()
    scrollToBottom()

    // 保存请求上下文供手动重试使用
    lastRequest.value = { text, aiMsgIndex: idx }

    const success = await readSSEStream('http://127.0.0.1:3001/api/chat', { text }, content => {
      aiMsg.content += content
      scrollToBottom()
    })

    if (!aiMsg.content) {
      aiMsg.content = success ? '暂时没有收到回复。' : '请求失败，请确认后端服务是否已启动。'
    } else if (!success) {
      aiMsg.content += '\n\n[连接中断，请点击重试按钮]'
    }

    loading.value = false
    await nextTick()
    scrollToBottom()
  }

  /**
   * 手动重试（重试耗尽后用户点击重试按钮）
   */
  const manualRetry = async () => {
    if (!lastRequest.value || !sessionId.value || loading.value) return
    retryCount.value = 0
    isReconnecting.value = true
    loading.value = true
    const aiMsg = messages.value[lastRequest.value.aiMsgIndex]
    if (!aiMsg) {
      isReconnecting.value = false
      loading.value = false
      return
    }

    const success = await readSSEStream(
      'http://127.0.0.1:3001/api/chat/reconnect',
      { sessionId: sessionId.value, lastEventId: lastEventId.value },
      content => {
        aiMsg.content += content
        scrollToBottom()
      }
    )

    if (!success) {
      aiMsg.content += '\n\n[连接中断，请点击重试按钮]'
    }
    loading.value = false
    await nextTick()
    scrollToBottom()
  }

  const openImagePicker = () => {
    fileInput.value?.click()
  }

  const handleImageChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file || !file.type.startsWith('image/')) return

    if (selectedImage.value?.url) {
      URL.revokeObjectURL(selectedImage.value.url)
    }

    selectedImage.value = {
      file,
      name: file.name,
      url: URL.createObjectURL(file)
    }
  }

  const removeImage = () => {
    if (selectedImage.value?.url) {
      URL.revokeObjectURL(selectedImage.value.url)
    }
    selectedImage.value = null
    if (fileInput.value) fileInput.value.value = ''
  }

  const previewImage = (msg: Message) => {
    if (!msg.imageUrl) return
    previewImageUrl.value = msg.imageUrl
    previewImageName.value = msg.imageName || ''
  }

  const closeImageViewer = () => {
    previewImageUrl.value = ''
    previewImageName.value = ''
  }

  const scrollToBottom = () => {
    nextTick(() => {
      requestAnimationFrame(() => {
        const el = chatBody.value
        if (el) el.scrollTop = el.scrollHeight
      })
    })
  }

  /**
   * 实时记录聊天区域的滚动位置
   * 绑定在 chatBody 的 @scroll 事件上，持续追踪 scrollTop
   */
  const onChatScroll = () => {
    if (chatBody.value && !isRestoring.value) {
      savedScrollTop.value = chatBody.value.scrollTop
    }
  }

  /**
   * transition 进入动画完成后恢复滚动位置
   * @after-enter 钩子保证元素完全可见且布局稳定后执行
   */
  const onAfterEnter = () => {
    if (savedScrollTop.value > 0) {
      requestAnimationFrame(() => {
        const el = chatBody.value
        if (el) {
          el.scrollTop = savedScrollTop.value
        }
        isRestoring.value = false
      })
    } else {
      isRestoring.value = false
    }
  }

  // ============================================================
  // 生命周期
  // ============================================================

  /** 对话框关闭时中止正在进行的请求 */
  watch(open, val => {
    if (!val) {
      streamController.value?.abort()
    }
  })

  /** 新消息加入后自动滚动到底部 */
  watch(
    () => messages.value.length,
    () => {
      scrollToBottom()
    }
  )

  /** 组件卸载时清理拖拽事件监听和自定义组件注册 */
  onBeforeUnmount(() => {
    streamController.value?.abort()
    document.removeEventListener('mousemove', onDragMove)
    document.removeEventListener('mouseup', onDragEnd)
    document.removeEventListener('touchmove', onTouchMove)
    document.removeEventListener('touchend', onTouchEnd)
    removeCustomComponents('ai')
  })
</script>

<style scoped>
  /* ============================================================
     悬浮球（可拖拽，吸附左右边缘）
     ============================================================ */
  .chat-fab {
    position: fixed;
    z-index: 900;
    width: 64px;
    height: 64px;
    border: 0;
    border-radius: 50%;
    background: linear-gradient(135deg, #6366f1 0%, #2563eb 50%, #06b6d4 100%);
    background-size: 200% 200%;
    color: #fff;
    cursor: grab;
    font-size: 18px;
    font-weight: 800;
    transition:
      left 0.25s ease,
      transform 0.2s ease,
      box-shadow 0.2s ease;
    user-select: none;
    touch-action: none;
    /* 外发光 + 内层描边光晕 */
    box-shadow:
      0 8px 28px rgba(37, 99, 235, 0.45),
      0 0 0 2px rgba(99, 102, 241, 0.25),
      inset 0 1px 0 rgba(255, 255, 255, 0.25);
    animation: fabBreath 4s ease-in-out infinite;
  }

  .chat-fab::before {
    content: '';
    position: absolute;
    inset: -4px;
    border-radius: 50%;
    background: linear-gradient(135deg, rgba(99, 102, 241, 0.35), rgba(6, 182, 212, 0.25));
    filter: blur(10px);
    z-index: -1;
    animation: fabPulse 3s ease-in-out infinite;
  }

  .chat-fab:hover {
    transform: scale(1.08);
    box-shadow:
      0 12px 40px rgba(37, 99, 235, 0.55),
      0 0 0 4px rgba(99, 102, 241, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  .chat-fab:active {
    cursor: grabbing;
    transform: scale(0.95);
  }

  /* 聊天窗口打开时隐藏悬浮球 */
  .chat-fab.fab-hidden {
    display: none;
  }

  .chat-fab span {
    display: block;
    margin-top: 2px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 0.5px;
    opacity: 0.9;
  }

  /* ——— 渐变背景动画 ——— */
  @keyframes fabBreath {
    0%,
    100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }

  /* ——— 外圈呼吸光晕 ——— */
  @keyframes fabPulse {
    0%,
    100% {
      opacity: 0.6;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.12);
    }
  }

  /* ============================================================
     聊天窗口
     ============================================================ */
  .ai-chat-window {
    position: fixed;
    right: 28px;
    bottom: 28px;
    z-index: 901;
    width: min(420px, calc(100vw - 32px));
    height: min(660px, calc(100vh - 56px));
    min-height: 480px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid rgba(148, 163, 184, 0.24);
    border-radius: 12px;
    background: #fff;
    box-shadow: 0 24px 70px rgba(15, 23, 42, 0.24);
  }

  .chat-header {
    min-height: 68px;
    padding: 14px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    background: #1f2937;
    color: #fff;
  }

  .chat-header h2 {
    margin: 0;
    font-size: 17px;
    font-weight: 700;
  }

  .chat-header p {
    margin: 4px 0 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 12px;
  }

  .icon-button {
    width: 32px;
    height: 32px;
    padding: 0;
    border: 0;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.12);
    color: #fff;
    cursor: pointer;
    font-size: 24px;
    line-height: 1;
  }

  .chat-body {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 14px;
    padding: 16px;
    overflow-y: auto;
    background: #f7f9fc;
  }
  .chat-body::-webkit-scrollbar {
    width: 5px;
  }
  .chat-body::-webkit-scrollbar-thumb {
    background: rgba(154, 150, 150, 0.1);
    border-radius: 3px;
  }

  .chat-message {
    display: flex;
    align-items: flex-start;
    gap: 9px;
    max-width: 88%;
  }

  .chat-message.user {
    align-self: flex-end;
    flex-direction: row-reverse;
  }

  .chat-message.ai {
    align-self: flex-start;
  }

  .avatar {
    flex: 0 0 auto;
    width: 32px;
    height: 32px;
    display: grid;
    place-items: center;
    border-radius: 50%;
    font-size: 12px;
    font-weight: 700;
  }

  .ai-avatar {
    background: #eef2ff;
    color: #3730a3;
  }

  .user-avatar {
    background: #dbeafe;
    color: #1d4ed8;
  }

  .message-content {
    min-width: 0;
  }

  .chat-message.user .message-content {
    text-align: right;
  }

  .message-name {
    display: block;
    margin-bottom: 4px;
    color: #7c8798;
    font-size: 12px;
  }

  .bubble {
    max-width: 100%;
    padding: 10px 12px;
    border-radius: 10px;
    background: #fff;
    color: #1f2937;
    border: 1px solid #e5e7eb;
    text-align: left;
    white-space: pre-wrap;
    word-break: break-word;
    overflow-wrap: break-word;
    box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
    font-size: 14px;
    line-height: 1.55;
  }

  .chat-message.user .bubble {
    background: #2563eb;
    color: #fff;
    border-color: #2563eb;
  }

  /* MarkdownRender 容器 */
  .msg-md {
    display: block;
    width: 100%;
  }

  /* AI 正在输入指示器（三个跳动的点） */
  .typing-bubble {
    display: flex;
    align-items: center;
    gap: 5px;
    padding: 12px 16px;
    min-width: 60px;
  }

  .typing-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #94a3b8;
    animation: dotBounce 1.2s ease-in-out infinite;
  }

  .typing-dot:nth-child(2) {
    animation-delay: 0.2s;
  }
  .typing-dot:nth-child(3) {
    animation-delay: 0.4s;
  }

  @keyframes dotBounce {
    0%,
    60%,
    100% {
      transform: translateY(0);
      opacity: 0.4;
    }
    30% {
      transform: translateY(-6px);
      opacity: 1;
    }
  }

  /* markstream-vue Markdown 渲染容器适配气泡 */
  .bubble :deep(.markstream-vue) {
    /* 确保代码块等元素在气泡内正确显示 */
    font-size: inherit;
    line-height: inherit;
  }

  /* 气泡内的代码块样式加强 */
  .bubble :deep(.markstream-vue pre) {
    margin: 8px 0 4px;
    border-radius: 8px;
  }
  /* 去除气泡的外边距 */
  .bubble :deep(.paragraph-node) {
    margin: 0;
    font-size: 14px;
    line-height: 1.55;
  }

  /* ——— PrismJS 代码块暗色样式 ——— */
  .bubble :deep(.hljs-code-block) {
    margin: 8px 0 4px;
    padding: 12px 14px;
    border-radius: 8px;
    background: #1e293b;
    color: #e2e8f0;
    overflow-x: auto;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre;
  }

  .bubble :deep(.hljs-code-block code) {
    font-family: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
    background: transparent !important;
  }

  .chat-message.user .bubble :deep(.hljs-code-block) {
    background: #1e3a5f;
  }

  /* ——— PrismJS 语法着色（适配深色背景） ——— */
  .bubble :deep(.token.comment),
  .bubble :deep(.token.prolog),
  .bubble :deep(.token.doctype),
  .bubble :deep(.token.cdata) {
    color: #6a9955;
    font-style: italic;
  }

  .bubble :deep(.token.keyword),
  .bubble :deep(.token.selector),
  .bubble :deep(.token.operator) {
    color: #c586c0;
  }

  .bubble :deep(.token.string),
  .bubble :deep(.token.attr-value) {
    color: #ce9178;
  }

  .bubble :deep(.token.number),
  .bubble :deep(.token.boolean) {
    color: #b5cea8;
  }

  .bubble :deep(.token.function),
  .bubble :deep(.token.class-name) {
    color: #dcdcaa;
  }

  .bubble :deep(.token.tag),
  .bubble :deep(.token.namespace) {
    color: #569cd6;
  }

  .bubble :deep(.token.attr-name),
  .bubble :deep(.token.builtin) {
    color: #9cdcfe;
  }

  .bubble :deep(.token.punctuation) {
    color: #d4d4d4;
  }

  .message-image {
    display: block;
    width: min(220px, 100%);
    max-height: 180px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 8px;
    cursor: zoom-in;
  }

  .message-image:last-child {
    margin-bottom: 0;
  }

  .chat-footer {
    display: flex;
    align-items: stretch;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid #eef0f4;
    background: #fff;
  }

  .input-panel {
    position: relative;
    flex: 1;
    min-width: 0;
  }

  textarea {
    width: 100%;
    height: 58px;
    box-sizing: border-box;
    padding: 10px 12px;
    border: 1px solid #d8dee9;
    border-radius: 8px;
    outline: none;
    resize: none;
    color: #1f2937;
    background: #fff;
    font: inherit;
    font-size: 14px;
    line-height: 1.4;
  }

  textarea:focus {
    border-color: #409eff;
  }

  .input-panel:has(.image-preview) textarea {
    padding-left: 60px;
  }

  .image-preview {
    position: absolute;
    left: 8px;
    top: 8px;
    z-index: 2;
    width: 42px;
    height: 42px;
    border-radius: 8px;
    background: #f1f5f9;
  }

  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    border-radius: 8px;
  }

  .remove-image {
    position: absolute;
    top: -7px;
    right: -7px;
    width: 20px;
    height: 20px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: #111827;
    color: #fff;
    cursor: pointer;
    line-height: 1;
  }

  .file-input {
    display: none;
  }

  .secondary-button,
  .send-button {
    width: 58px;
    border: 0;
    border-radius: 8px;
    cursor: pointer;
    font-weight: 600;
  }

  .secondary-button {
    background: #eef2f7;
    color: #334155;
  }

  .send-button {
    background: #2563eb;
    color: #fff;
  }

  .send-button:disabled {
    background: #bfdbfe;
    cursor: not-allowed;
  }

  /* ============================================================
     重连状态栏
     ============================================================ */
  .reconnect-bar {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    background: #fef3c7;
    border-bottom: 1px solid #f59e0b;
    font-size: 13px;
    color: #92400e;
  }

  .reconnect-bar.reconnect-failed {
    background: #fee2e2;
    border-bottom-color: #ef4444;
    color: #991b1b;
  }

  .reconnect-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #f59e0b;
    animation: reconnectPulse 1s ease-in-out infinite;
  }

  @keyframes reconnectPulse {
    0%,
    100% {
      opacity: 0.4;
      transform: scale(0.8);
    }
    50% {
      opacity: 1;
      transform: scale(1);
    }
  }

  .retry-button {
    margin-left: auto;
    padding: 4px 12px;
    border: 1px solid #ef4444;
    border-radius: 6px;
    background: #fff;
    color: #dc2626;
    cursor: pointer;
    font-size: 12px;
    font-weight: 600;
    transition: background 0.15s;
  }

  .retry-button:hover {
    background: #fef2f2;
  }

  .image-viewer {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    background: rgba(15, 23, 42, 0.78);
  }

  .image-viewer img {
    max-width: min(96vw, 1100px);
    max-height: 88vh;
    object-fit: contain;
    border-radius: 10px;
  }

  .image-viewer-close {
    position: fixed;
    top: 18px;
    right: 18px;
    width: 40px;
    height: 40px;
    padding: 0;
    border: 0;
    border-radius: 50%;
    background: #fff;
    color: #111827;
    cursor: pointer;
    font-size: 26px;
    line-height: 1;
  }

  .chat-window-enter-active,
  .chat-window-leave-active {
    transition:
      opacity 0.18s ease,
      transform 0.18s ease;
  }

  .chat-window-enter-from,
  .chat-window-leave-to {
    opacity: 0;
    transform: translateY(12px) scale(0.98);
  }

  @media (max-width: 640px) {
    .chat-fab {
      width: 56px;
      height: 56px;
      font-size: 16px;
    }

    .chat-fab span {
      font-size: 11px;
    }

    .ai-chat-window {
      right: 12px;
      bottom: 12px;
      width: calc(100vw - 24px);
      height: calc(100vh - 24px);
      min-height: 0;
    }
  }
</style>
