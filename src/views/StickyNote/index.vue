<template>
  <div class="page-placeholder">
    <n-empty :description="t('nav.stickyNote')">
      <template #icon>
        <n-icon :component="DocumentTextOutline" />
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NEmpty, NIcon } from 'naive-ui'
import { DocumentTextOutline } from '@vicons/ionicons5'

const { t } = useI18n()
</script>
