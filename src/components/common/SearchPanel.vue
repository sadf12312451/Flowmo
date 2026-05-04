<template>
  <transition name="fade">
    <div
      v-if="searchStore.showSearchPanel"
      class="search-overlay"
      @click.self="searchStore.clear"
    >
      <div class="search-panel">
        <div class="search-input-wrap">
          <n-icon :component="SearchOutline" :size="18" class="search-icon" />
          <input
            ref="inputRef"
            v-model="kw"
            class="search-input"
            placeholder="搜索便签、笔记、待办、倒计时、习惯..."
            @input="onInput"
            @keydown.esc="searchStore.clear"
          />
          <kbd class="search-kbd">ESC</kbd>
        </div>

        <div class="search-results">
          <div v-if="searchStore.isSearching" class="search-status">搜索中...</div>
          <div v-else-if="!kw.trim()" class="search-status">输入关键词开始搜索</div>
          <div v-else-if="searchStore.results.length === 0" class="search-status">没有找到匹配的内容</div>
          <div v-else>
            <div
              v-for="(r, i) in searchStore.results"
              :key="`${r.type}-${r.id}-${i}`"
              class="result-item"
              @click="handleClick(r)"
            >
              <n-tag size="tiny" :bordered="false" :type="typeTag(r.type)">{{ typeName(r.type) }}</n-tag>
              <div class="result-content">
                <div class="result-title" v-html="highlight(r.title, kw)" />
                <div v-if="r.preview" class="result-preview" v-html="highlight(r.preview, kw)" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import { NIcon, NTag } from 'naive-ui'
import { SearchOutline } from '@vicons/ionicons5'
import { useSearchStore, type SearchResult } from '../../stores/search'

const router = useRouter()
const searchStore = useSearchStore()
const kw = ref('')
const inputRef = ref<HTMLInputElement | null>(null)

let searchTimer: ReturnType<typeof setTimeout> | null = null

function onInput() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    searchStore.search(kw.value)
  }, 200)
}

watch(() => searchStore.showSearchPanel, async (val) => {
  if (val) {
    kw.value = ''
    await nextTick()
    inputRef.value?.focus()
  }
})

function typeName(type: SearchResult['type']) {
  return { sticky: '便签', note: '笔记', todo: '待办', countdown: '倒计时', habit: '习惯' }[type]
}

function typeTag(type: SearchResult['type']): 'default' | 'info' | 'success' | 'warning' | 'error' {
  return { sticky: 'warning', note: 'info', todo: 'success', countdown: 'default', habit: 'error' }[type] as 'default' | 'info' | 'success' | 'warning' | 'error'
}

function highlight(text: string, keyword: string): string {
  if (!keyword) return escapeHtml(text)
  const escaped = escapeHtml(text)
  const re = new RegExp(`(${escapeRegex(keyword)})`, 'gi')
  return escaped.replace(re, '<mark>$1</mark>')
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] || c))
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function handleClick(r: SearchResult) {
  searchStore.clear()
  const routeMap: Record<SearchResult['type'], string> = {
    sticky: '/sticky-note',
    note: '/notepad',
    todo: '/todo',
    countdown: '/countdown',
    habit: '/habit-tracker',
  }
  router.push(routeMap[r.type])
}
</script>

<style scoped>
.search-overlay {
  position: fixed;
  inset: 0;
  z-index: 9999;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
  display: flex;
  justify-content: center;
  padding-top: 12vh;
}

.search-panel {
  width: 600px;
  max-width: 90vw;
  max-height: 70vh;
  background: var(--n-color-modal, #fff);
  border-radius: 12px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.3);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.search-input-wrap {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(128, 128, 128, 0.12);
}

.search-icon {
  opacity: 0.5;
}

.search-input {
  flex: 1;
  border: none;
  outline: none;
  font-size: 15px;
  background: transparent;
  color: inherit;
}

.search-kbd {
  font-size: 11px;
  font-family: monospace;
  padding: 2px 6px;
  border-radius: 4px;
  background: rgba(128, 128, 128, 0.15);
  opacity: 0.6;
}

.search-results {
  flex: 1;
  overflow-y: auto;
  padding: 4px;
}

.search-status {
  padding: 32px;
  text-align: center;
  font-size: 13px;
  opacity: 0.5;
}

.result-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.12s;
}

.result-item:hover {
  background: rgba(128, 128, 128, 0.08);
}

.result-content {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 2px;
}

.result-preview {
  font-size: 12px;
  opacity: 0.6;
  line-height: 1.5;
}

.result-content :deep(mark) {
  background: rgba(240, 160, 32, 0.3);
  color: inherit;
  padding: 0 2px;
  border-radius: 2px;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}
</style>
