<template>
  <div class="habits-page">
    <div class="page-header">
      <h2>{{ t('nav.habitTracker') }}</h2>
      <n-button type="primary" @click="handleCreate">
        <template #icon><n-icon :component="AddOutline" /></template>
        新建习惯
      </n-button>
    </div>

    <n-spin :show="habitsStore.loading">
      <div v-if="habitsStore.habits.length === 0 && !habitsStore.loading" class="empty-state">
        <n-empty description="还没有习惯，建立一个新习惯吧" />
      </div>

      <div v-else class="habits-list">
        <div
          v-for="habit in habitsStore.habits"
          :key="habit.id"
          class="habit-card"
        >
          <div class="habit-header">
            <div class="habit-icon" :style="{ backgroundColor: habit.color }">
              {{ habit.icon }}
            </div>
            <div class="habit-info">
              <div class="habit-name">{{ habit.name }}</div>
              <div class="habit-stats">
                连续 <strong>{{ habit.streak }}</strong> 天
                · 累计 <strong>{{ habit.totalDays }}</strong> 天
              </div>
            </div>
            <div class="habit-actions">
              <n-button
                v-if="!habit.todayChecked"
                type="primary"
                size="small"
                round
                @click="habitsStore.toggleToday(habit.id)"
              >
                <template #icon><n-icon :component="CheckmarkOutline" /></template>
                打卡
              </n-button>
              <n-button
                v-else
                size="small"
                round
                @click="habitsStore.toggleToday(habit.id)"
              >
                <template #icon><n-icon :component="CheckmarkDoneOutline" /></template>
                已打卡
              </n-button>
              <n-dropdown :options="moreOptions" @select="(key: string) => handleMore(key, habit)">
                <n-button quaternary circle size="small">
                  <template #icon><n-icon :component="EllipsisVerticalOutline" /></template>
                </n-button>
              </n-dropdown>
            </div>
          </div>
          <!-- 热力图 -->
          <div class="heatmap">
            <div
              v-for="cell in habitsStore.getHeatmap(habit.id, 90)"
              :key="cell.date"
              class="heatmap-cell"
              :class="{ checked: cell.checked }"
              :style="{ backgroundColor: cell.checked ? habit.color : 'rgba(128,128,128,0.08)' }"
              :title="`${cell.date} ${cell.checked ? '已打卡' : '未打卡'}`"
              @click="toggleDate(habit.id, cell.date, cell.checked)"
            />
          </div>
        </div>
      </div>
    </n-spin>

    <!-- 新建/编辑习惯 -->
    <n-modal v-model:show="showEditor" preset="card" :title="editingHabit ? '编辑习惯' : '新建习惯'" style="width: 420px;">
      <n-form>
        <n-form-item label="名称">
          <n-input v-model:value="form.name" placeholder="例如：每天读书 30 分钟" />
        </n-form-item>
        <n-form-item label="图标">
          <div class="icon-picker">
            <span
              v-for="ic in iconOptions"
              :key="ic"
              class="icon-option"
              :class="{ active: form.icon === ic }"
              @click="form.icon = ic"
            >{{ ic }}</span>
          </div>
        </n-form-item>
        <n-form-item label="颜色">
          <div class="color-picker">
            <div
              v-for="c in colorOptions"
              :key="c"
              class="color-dot"
              :class="{ active: form.color === c }"
              :style="{ backgroundColor: c }"
              @click="form.color = c"
            />
          </div>
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditor = false">取消</n-button>
          <n-button type="primary" @click="handleSave" :disabled="!form.name.trim()">保存</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton, NIcon, NSpin, NEmpty, NModal, NForm, NFormItem, NInput,
  NSpace, NDropdown, useMessage, useDialog,
} from 'naive-ui'
import type { DropdownOption } from 'naive-ui'
import {
  AddOutline, CheckmarkOutline, CheckmarkDoneOutline,
  EllipsisVerticalOutline, CreateOutline, TrashOutline,
} from '@vicons/ionicons5'
import { useHabitsStore, type Habit } from '../../stores/habits'

const { t } = useI18n()
const habitsStore = useHabitsStore()
const message = useMessage()
const dialog = useDialog()

const showEditor = ref(false)
const editingHabit = ref<Habit | null>(null)
const form = ref({
  name: '',
  icon: '✓',
  color: '#18a058',
})

const iconOptions = ['✓', '📚', '🏃', '💧', '🧘', '✏️', '🎵', '💪', '🌱', '☕', '🎨', '🍎']
const colorOptions = ['#18a058', '#4098fc', '#f0a020', '#e03050', '#8b5cf6', '#06b6d4', '#ec4899', '#6b7280']

const moreOptions: DropdownOption[] = [
  { label: '编辑', key: 'edit', icon: () => h(NIcon, null, { default: () => h(CreateOutline) }) },
  { label: '删除', key: 'delete', icon: () => h(NIcon, null, { default: () => h(TrashOutline) }) },
]

function handleCreate() {
  editingHabit.value = null
  form.value = { name: '', icon: '✓', color: '#18a058' }
  showEditor.value = true
}

function handleEdit(habit: Habit) {
  editingHabit.value = habit
  form.value = { name: habit.name, icon: habit.icon, color: habit.color }
  showEditor.value = true
}

async function handleSave() {
  if (!form.value.name.trim()) return
  if (editingHabit.value) {
    await habitsStore.updateHabit(editingHabit.value.id, form.value)
    message.success('已更新')
  } else {
    await habitsStore.createHabit(form.value)
    message.success('习惯已创建')
  }
  showEditor.value = false
}

function handleMore(key: string, habit: Habit) {
  if (key === 'edit') {
    handleEdit(habit)
  } else if (key === 'delete') {
    dialog.warning({
      title: '确认删除',
      content: `将删除习惯"${habit.name}"及其所有打卡记录。`,
      positiveText: '删除',
      negativeText: '取消',
      onPositiveClick: async () => {
        await habitsStore.deleteHabit(habit.id)
        message.success('已删除')
      },
    })
  }
}

async function toggleDate(habitId: number, date: string, checked: boolean) {
  if (checked) {
    await habitsStore.uncheck(habitId, date)
  } else {
    await habitsStore.checkIn(habitId, date)
  }
}

onMounted(() => {
  habitsStore.loadHabits()
})
</script>

<style scoped>
.habits-page {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
}

.habits-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.habit-card {
  background: rgba(128, 128, 128, 0.04);
  border-radius: 12px;
  padding: 16px;
}

.habit-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.habit-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  flex-shrink: 0;
}

.habit-info {
  flex: 1;
  min-width: 0;
}

.habit-name {
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 4px;
}

.habit-stats {
  font-size: 12px;
  opacity: 0.6;
}

.habit-stats strong {
  color: #f0a020;
  font-size: 13px;
  margin: 0 1px;
}

.habit-actions {
  display: flex;
  gap: 4px;
  align-items: center;
}

.heatmap {
  display: grid;
  grid-template-columns: repeat(30, 1fr);
  gap: 3px;
}

.heatmap-cell {
  aspect-ratio: 1;
  border-radius: 3px;
  cursor: pointer;
  transition: transform 0.1s;
}

.heatmap-cell:hover {
  transform: scale(1.2);
}

.icon-picker {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 6px;
}

.icon-option {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 36px;
  font-size: 18px;
  cursor: pointer;
  border-radius: 6px;
  border: 1.5px solid transparent;
  background: rgba(128, 128, 128, 0.05);
  transition: all 0.15s;
}

.icon-option:hover {
  background: rgba(128, 128, 128, 0.1);
}

.icon-option.active {
  border-color: #18a058;
  background: rgba(24, 160, 88, 0.08);
}

.color-picker {
  display: flex;
  gap: 8px;
}

.color-dot {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid transparent;
  transition: all 0.15s;
}

.color-dot:hover { transform: scale(1.15); }
.color-dot.active { border-color: #333; }
</style>
