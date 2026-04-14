<template>
  <div class="page-placeholder">
    <n-empty :description="t('nav.settings')">
      <template #icon>
        <n-icon :component="SettingsOutline" />
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NEmpty, NIcon } from 'naive-ui'
import { SettingsOutline } from '@vicons/ionicons5'

const { t } = useI18n()
</script>
