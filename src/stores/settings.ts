import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useSettingsStore = defineStore('settings', () => {
  const isDark = ref(false)
  const locale = ref<'zh-CN' | 'en-US'>('zh-CN')
  const sidebarCollapsed = ref(false)

  function toggleDark() {
    isDark.value = !isDark.value
    localStorage.setItem('flowmo-dark', String(isDark.value))
  }

  function setLocale(lang: 'zh-CN' | 'en-US') {
    locale.value = lang
    localStorage.setItem('flowmo-locale', lang)
  }

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value
  }

  function init() {
    const savedDark = localStorage.getItem('flowmo-dark')
    if (savedDark !== null) {
      isDark.value = savedDark === 'true'
    }
    const savedLocale = localStorage.getItem('flowmo-locale')
    if (savedLocale === 'zh-CN' || savedLocale === 'en-US') {
      locale.value = savedLocale
    }
  }

  return { isDark, locale, sidebarCollapsed, toggleDark, setLocale, toggleSidebar, init }
})
