<template>
  <div class="page-placeholder">
    <n-empty :description="t('nav.trash')">
      <template #icon>
        <n-icon :component="TrashOutline" />
      </template>
    </n-empty>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { NEmpty, NIcon } from 'naive-ui'
import { TrashOutline } from '@vicons/ionicons5'

const { t } = useI18n()
</script>
