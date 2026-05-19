<template>
  <div class="chat-page">
    <div class="chat-header">
      <h2>{{ greeting }}</h2>
      <div class="quick-actions">
        <n-button text @click="quickAction('morning')">🌅 早安总结</n-button>
        <n-button text @click="quickAction('evening')">🌙 睡前回顾</n-button>
        <n-button text @click="quickAction('organize')">📋 整理一下</n-button>
      </div>
    </div>

    <div class="chat-messages" ref="messagesRef">
      <div v-for="(msg, idx) in messages" :key="idx" class="message" :class="msg.role">
        <div v-if="msg.role === 'user'" class="message-content user-message">
          {{ msg.content }}
        </div>
        <div v-else-if="msg.role === 'assistant'" class="message-content assistant-message">
          <!-- 思考链：可折叠 -->
          <div v-if="msg.thinking" class="thinking-block">
            <div class="thinking-header" @click="toggleThinking(idx)">
              <n-icon :component="thinkingExpanded[idx] ? ChevronDownOutline : ChevronForwardOutline" :size="14" />
              <span>思考过程</span>
              <span class="thinking-meta">{{ msg.thinking.length }} 字</span>
            </div>
            <div v-if="thinkingExpanded[idx]" class="thinking-content">{{ msg.thinking }}</div>
          </div>
          <div v-if="msg.content" class="text-content">{{ msg.content }}</div>
          <div v-if="msg.tool_calls" class="tool-calls">
            <div v-for="call in msg.tool_calls" :key="call.id" class="tool-call-card">
              <n-icon :component="getToolIcon(call.function.name)" />
              <span>{{ getToolLabel(call.function.name) }}</span>
            </div>
          </div>
        </div>
        <div v-else-if="msg.role === 'tool'" class="message-content tool-result">
          <ToolResultCard :result="JSON.parse(msg.content)" :tool-name="msg.name" />
        </div>
      </div>

      <div v-if="isLoading" class="message assistant">
        <div class="message-content assistant-message loading">
          <n-spin size="small" />
          <span>{{ loadingText }}</span>
        </div>
      </div>
    </div>

    <div class="chat-input-area">
      <div class="input-hints">
        💡 试试："今天怎么安排" "明天 8 点提醒我吃药" "记一下..."
      </div>
      <div class="input-wrapper">
        <n-input
          v-model:value="inputText"
          type="textarea"
          placeholder="跟浮墨说点什么..."
          :autosize="{ minRows: 1, maxRows: 4 }"
          @keydown.enter.exact.prevent="handleSend"
        />
        <n-button type="primary" circle :disabled="!inputText.trim() || isLoading" @click="handleSend">
          <template #icon>
            <n-icon :component="ArrowUpOutline" />
          </template>
        </n-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted } from 'vue'
import { NButton, NInput, NSpin, NIcon, useMessage } from 'naive-ui'
import { ArrowUpOutline, CheckmarkCircleOutline, DocumentTextOutline, TimeOutline, CheckboxOutline, BookOutline, ChevronDownOutline, ChevronForwardOutline } from '@vicons/ionicons5'
import { sendMessageStream, executeToolCalls, formatAIError, useAIStore, collectUserContext, getSystemPrompt } from '../../services/ai'
import type { AIMessage } from '../../services/ai'
import ToolResultCard from '../../components/chat/ToolResultCard.vue'

const message = useMessage()
const aiStore = useAIStore()

const inputText = ref('')
const messages = ref<AIMessage[]>([])
const isLoading = ref(false)
const loadingText = ref('思考中...')
const messagesRef = ref<HTMLElement>()
const contextCache = ref('')
const thinkingExpanded = ref<Record<number, boolean>>({})

function toggleThinking(idx: number) {
  thinkingExpanded.value[idx] = !thinkingExpanded.value[idx]
}

const greeting = computed(() => {
  const hour = new Date().getHours()
  if (hour < 12) return '早上好！'
  if (hour < 18) return '下午好！'
  return '晚上好！'
})

function getToolIcon(toolName: string) {
  const icons: Record<string, any> = {
    create_todo: CheckboxOutline,
    create_countdown: TimeOutline,
    create_sticky: DocumentTextOutline,
    create_note: BookOutline,
    search: DocumentTextOutline,
    update_item: CheckmarkCircleOutline,
    delete_item: CheckmarkCircleOutline,
  }
  return icons[toolName] || CheckmarkCircleOutline
}

function getToolLabel(toolName: string) {
  const labels: Record<string, string> = {
    create_todo: '创建待办',
    create_countdown: '创建提醒',
    create_sticky: '创建便签',
    create_note: '创建笔记',
    search: '搜索',
    update_item: '更新',
    delete_item: '删除',
  }
  return labels[toolName] || toolName
}

async function handleSend() {
  if (!inputText.value.trim() || isLoading.value) return

  if (!aiStore.isConfigured()) {
    message.warning('请先在设置中配置 AI 服务')
    return
  }

  const userMessage: AIMessage = {
    role: 'user',
    content: inputText.value.trim(),
  }

  messages.value.push(userMessage)
  inputText.value = ''
  isLoading.value = true
  loadingText.value = '思考中...'

  await nextTick()
  scrollToBottom()

  try {
    // 收集用户上下文（只在第一次或上下文过期时收集）
    if (!contextCache.value || messages.value.length <= 1) {
      contextCache.value = await collectUserContext()
    }

    // 构建完整的消息列表（包含系统提示词和上下文）
    const fullMessages: AIMessage[] = [
      {
        role: 'system',
        content: getSystemPrompt() + '\n\n## 用户当前状态\n\n' + contextCache.value,
      },
      ...messages.value,
    ]

    let assistantMessage: AIMessage = { role: 'assistant', content: '', thinking: '' }
    let hasToolCalls = false

    // 流式接收 AI 回复
    for await (const chunk of sendMessageStream(fullMessages)) {
      if (chunk.content) {
        assistantMessage.content += chunk.content
      }
      if (chunk.thinking) {
        assistantMessage.thinking = (assistantMessage.thinking || '') + chunk.thinking
      }
      if (chunk.tool_calls) {
        assistantMessage.tool_calls = chunk.tool_calls
        hasToolCalls = true
      }
      if (chunk.done) break
    }

    // 清理空字段
    if (!assistantMessage.thinking) delete assistantMessage.thinking

    messages.value.push(assistantMessage)
    await nextTick()
    scrollToBottom()

    // 如果有工具调用，执行并继续对话
    if (hasToolCalls && assistantMessage.tool_calls) {
      loadingText.value = '执行中...'
      const toolResults = await executeToolCalls(assistantMessage.tool_calls)
      messages.value.push(...toolResults)

      // 工具执行后刷新上下文
      contextCache.value = await collectUserContext()

      await nextTick()
      scrollToBottom()

      // 让 AI 总结工具执行结果
      loadingText.value = '整理结果...'

      const summaryMessages: AIMessage[] = [
        {
          role: 'system',
          content: getSystemPrompt() + '\n\n## 用户当前状态\n\n' + contextCache.value,
        },
        ...messages.value,
      ]

      let summaryMessage: AIMessage = { role: 'assistant', content: '', thinking: '' }

      for await (const chunk of sendMessageStream(summaryMessages, false)) {
        if (chunk.content) {
          summaryMessage.content += chunk.content
        }
        if (chunk.thinking) {
          summaryMessage.thinking = (summaryMessage.thinking || '') + chunk.thinking
        }
        if (chunk.done) break
      }

      if (!summaryMessage.thinking) delete summaryMessage.thinking
      messages.value.push(summaryMessage)
      await nextTick()
      scrollToBottom()
    }
  } catch (error: any) {
    console.error('[Chat] Error:', error)
    message.error(formatAIError(error))
  } finally {
    isLoading.value = false
  }
}

function quickAction(action: string) {
  const prompts: Record<string, string> = {
    morning: '今天我有什么安排？',
    evening: '今天完成了什么？还有什么待办？',
    organize: '帮我整理一下最近的便签和待办',
  }
  inputText.value = prompts[action] || ''
  handleSend()
}

function scrollToBottom() {
  if (messagesRef.value) {
    messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  }
}

onMounted(async () => {
  // 首次打开显示欢迎消息
  if (messages.value.length === 0) {
    try {
      contextCache.value = await collectUserContext()

      const hour = new Date().getHours()
      let greetingMsg = '你好！我是浮墨，你的生活管家。'

      if (hour < 12) {
        greetingMsg = '早上好！'
      } else if (hour < 18) {
        greetingMsg = '下午好！'
      } else {
        greetingMsg = '晚上好！'
      }

      // 如果有待办或提醒，主动提示
      const hasTodos = contextCache.value.includes('今日待办')
      const hasCountdowns = contextCache.value.includes('即将到期的提醒')

      if (hasTodos || hasCountdowns) {
        greetingMsg += ' 有什么可以帮你的吗？'
      } else {
        greetingMsg += ' 今天看起来很轻松，有什么想做的吗？'
      }

      messages.value.push({
        role: 'assistant',
        content: greetingMsg,
      })
    } catch (error) {
      console.error('[Chat] Failed to load context:', error)
      messages.value.push({
        role: 'assistant',
        content: '你好！我是浮墨，你的生活管家。有什么可以帮你的吗？',
      })
    }
  }
})
</script>

<style scoped>
.chat-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  max-width: 800px;
  margin: 0 auto;
}

.chat-header {
  padding: 20px 24px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.1);
}

.chat-header h2 {
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
}

.quick-actions {
  display: flex;
  gap: 8px;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 20px 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.chat-messages::-webkit-scrollbar {
  width: 6px;
}

.chat-messages::-webkit-scrollbar-track {
  background: transparent;
}

.chat-messages::-webkit-scrollbar-thumb {
  background: rgba(128, 128, 128, 0.3);
  border-radius: 3px;
}

.chat-messages::-webkit-scrollbar-thumb:hover {
  background: rgba(128, 128, 128, 0.5);
}

.message {
  display: flex;
  flex-direction: column;
}

.message.user {
  align-items: flex-end;
}

.message.assistant {
  align-items: flex-start;
}

.message-content {
  max-width: 70%;
  padding: 12px 16px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
}

.user-message {
  background: #4098fc;
  color: white;
}

.assistant-message {
  background: rgba(128, 128, 128, 0.08);
}

.assistant-message.loading {
  display: flex;
  align-items: center;
  gap: 8px;
  opacity: 0.7;
}

.tool-calls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.thinking-block {
  margin-bottom: 8px;
  border-radius: 8px;
  background: rgba(128, 128, 128, 0.06);
  overflow: hidden;
}

.thinking-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  cursor: pointer;
  font-size: 12px;
  color: rgba(120, 120, 120, 1);
  user-select: none;
  transition: background 0.15s;
}

.thinking-header:hover {
  background: rgba(128, 128, 128, 0.08);
}

.thinking-meta {
  margin-left: auto;
  opacity: 0.5;
  font-size: 11px;
}

.thinking-content {
  padding: 8px 12px 10px;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(120, 120, 120, 0.85);
  white-space: pre-wrap;
  border-top: 1px dashed rgba(128, 128, 128, 0.15);
}

.tool-call-card {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  background: rgba(64, 152, 252, 0.1);
  border-radius: 8px;
  font-size: 13px;
  color: #4098fc;
}

.tool-result {
  max-width: 80%;
  padding: 0;
  background: transparent;
}

.chat-input-area {
  padding: 16px 24px 20px;
  border-top: 1px solid rgba(128, 128, 128, 0.1);
}

.input-hints {
  font-size: 12px;
  opacity: 0.5;
  margin-bottom: 8px;
}

.input-wrapper {
  display: flex;
  gap: 8px;
  align-items: flex-end;
}

.input-wrapper :deep(.n-input) {
  flex: 1;
}
</style>
