<template>
  <Teleport to="body">
    <transition name="chat-window">
      <section v-if="open" class="ai-chat-window" aria-label="AI 智能助手">
        <header class="chat-header">
          <div>
            <h2>AI 智能助手</h2>
            <p>实时对话 · 流式回复</p>
          </div>
          <button class="icon-button" type="button" aria-label="关闭聊天" @click="open = false">×</button>
        </header>

        <div ref="chatBody" class="chat-body">
          <div v-for="(msg, idx) in messages" :key="idx" class="chat-message" :class="msg.role">
            <div class="avatar" :class="`${msg.role}-avatar`">
              {{ msg.role === 'user' ? '我' : 'AI' }}
            </div>
            <div class="message-content">
              <span class="message-name">{{ msg.role === 'user' ? '我' : 'AI 助手' }}</span>
              <div class="bubble">
                <img
                  v-if="msg.imageUrl"
                  class="message-image"
                  :src="msg.imageUrl"
                  :alt="msg.imageName || '上传图片'"
                  @click="previewImage(msg)"
                />
                <span v-if="msg.content">{{ msg.content }}</span>
              </div>
            </div>
          </div>
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

    <button v-if="!open" class="chat-fab" type="button" aria-label="打开 AI 助手" @click="openChat">
      AI
      <span>助手</span>
    </button>

    <div v-if="previewImageUrl" class="image-viewer" @click="closeImageViewer">
      <button class="image-viewer-close" type="button" @click.stop="closeImageViewer">×</button>
      <img :src="previewImageUrl" :alt="previewImageName || '图片预览'" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
  import { nextTick, ref } from 'vue'

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

  const open = ref(false)
  const messages = ref<Message[]>([{ role: 'ai', content: '你好，我是 AI 助手，有什么可以帮你？' }])
  const inputText = ref('')
  const loading = ref(false)
  const chatBody = ref<HTMLElement | null>(null)
  const fileInput = ref<HTMLInputElement | null>(null)
  const selectedImage = ref<SelectedImage | null>(null)
  const previewImageUrl = ref('')
  const previewImageName = ref('')

  const openChat = async () => {
    open.value = true
    await nextTick()
    scrollToBottom()
  }

  const send = async () => {
    const text = inputText.value.trim()
    const image = selectedImage.value
    if ((!text && !image) || loading.value) return

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

    const aiMsg: Message = { role: 'ai', content: '' }
    messages.value.push(aiMsg)
    await nextTick()
    scrollToBottom()

    try {
      const res = await fetch('http://127.0.0.1:3001/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      })

      if (!res.body) {
        aiMsg.content = '服务没有返回可读取的数据流。'
        return
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(line => line.trim())

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const data = line.replace('data: ', '').trim()
          if (data === '[DONE]') continue

          try {
            const json = JSON.parse(data)
            const content = json.choices?.[0]?.delta?.content || ''
            if (content) {
              aiMsg.content += content
              scrollToBottom()
            }
          } catch {
            // 忽略非 JSON 片段，兼容流式接口偶发的空行或心跳数据。
          }
        }
      }

      if (!aiMsg.content) {
        aiMsg.content = '暂时没有收到回复。'
      }
    } catch (err) {
      console.error(err)
      aiMsg.content = '请求失败，请确认后端服务 http://127.0.0.1:3001/api/chat 是否已启动。'
    } finally {
      loading.value = false
    }
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
      const el = chatBody.value
      if (el) el.scrollTop = el.scrollHeight
    })
  }
</script>

<style scoped>
  .chat-fab {
    position: fixed;
    right: 28px;
    bottom: 28px;
    z-index: 900;
    width: 64px;
    height: 64px;
    border: 0;
    border-radius: 50%;
    background: #2563eb;
    color: #fff;
    box-shadow: 0 18px 38px rgba(37, 99, 235, 0.35);
    cursor: pointer;
    font-size: 18px;
    font-weight: 800;
  }

  .chat-fab span {
    display: block;
    margin-top: 1px;
    font-size: 12px;
    font-weight: 600;
  }

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
      right: 18px;
      bottom: 18px;
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
