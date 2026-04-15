<template>
  <div class="todo-page">
    <div class="page-header">
      <h2>{{ t('nav.todo') }}</h2>
      <n-button type="primary" @click="handleCreate">
        <template #icon><n-icon :component="AddOutline" /></template>
        {{ t('common.create') }}
      </n-button>
    </div>

    <n-spin :show="todosStore.loading">
      <div v-if="todosStore.todos.length === 0 && !todosStore.loading" class="empty-state">
        <n-empty description="还没有待办事项，开始添加吧" />
      </div>

      <div v-else class="todo-list">
        <div v-for="todo in todosStore.todos" :key="todo.id" class="todo-item-wrapper">
          <!-- 父任务 -->
          <div class="todo-item" :class="{ completed: todo.completed }">
            <n-checkbox
              :checked="!!todo.completed"
              @update:checked="todosStore.toggleComplete(todo.id)"
            />
            <div class="todo-content" @click="handleEdit(todo)">
              <span class="todo-title">{{ todo.title }}</span>
              <div class="todo-meta">
                <n-tag v-if="todo.priority === 3" type="error" size="small" :bordered="false">紧急</n-tag>
                <n-tag v-else-if="todo.priority === 2" type="warning" size="small" :bordered="false">重要</n-tag>
                <n-tag v-else-if="todo.priority === 1" type="info" size="small" :bordered="false">一般</n-tag>
                <span v-if="todo.due_date" class="todo-due" :class="{ overdue: isOverdue(todo.due_date) }">
                  {{ formatDue(todo.due_date) }}
                </span>
                <n-icon v-if="todo.repeat_type" :component="RepeatOutline" :size="14" style="opacity: 0.5" />
              </div>
            </div>
            <div class="todo-actions">
              <n-button quaternary circle size="tiny" @click="handleAddChild(todo.id)">
                <template #icon><n-icon :component="AddOutline" /></template>
              </n-button>
              <n-button quaternary circle size="tiny" @click="confirmDelete(todo)">
                <template #icon><n-icon :component="TrashOutline" /></template>
              </n-button>
            </div>
          </div>

          <!-- 子任务 -->
          <div v-if="todo.children && todo.children.length > 0" class="todo-children">
            <div
              v-for="child in todo.children"
              :key="child.id"
              class="todo-item sub"
              :class="{ completed: child.completed }"
            >
              <n-checkbox
                :checked="!!child.completed"
                @update:checked="todosStore.toggleComplete(child.id)"
              />
              <div class="todo-content" @click="handleEdit(child)">
                <span class="todo-title">{{ child.title }}</span>
              </div>
              <div class="todo-actions">
                <n-button quaternary circle size="tiny" @click="confirmDelete(child)">
                  <template #icon><n-icon :component="TrashOutline" /></template>
                </n-button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </n-spin>

    <!-- 编辑弹窗 -->
    <n-modal v-model:show="showEditor" preset="card" :title="editingTodo ? '编辑待办' : '新建待办'" style="width: 480px;">
      <n-form>
        <n-form-item label="标题">
          <n-input v-model:value="form.title" placeholder="要做什么？" />
        </n-form-item>
        <n-form-item label="描述">
          <n-input v-model:value="form.description" type="textarea" placeholder="详细描述（可选）" :rows="3" />
        </n-form-item>
        <n-form-item label="优先级">
          <n-radio-group v-model:value="form.priority">
            <n-radio :value="0">无</n-radio>
            <n-radio :value="1">一般</n-radio>
            <n-radio :value="2">重要</n-radio>
            <n-radio :value="3">紧急</n-radio>
          </n-radio-group>
        </n-form-item>
        <n-form-item label="截止时间">
          <n-date-picker v-model:value="dueDateTs" type="datetime" clearable style="width: 100%" />
        </n-form-item>
        <n-form-item label="重复">
          <n-select
            v-model:value="form.repeat_type"
            :options="repeatOptions"
            clearable
            placeholder="不重复"
          />
        </n-form-item>
      </n-form>
      <template #footer>
        <n-space justify="end">
          <n-button @click="showEditor = false">{{ t('common.cancel') }}</n-button>
          <n-button type="primary" @click="handleSave" :disabled="!form.title.trim()">{{ t('common.save') }}</n-button>
        </n-space>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  NButton, NIcon, NCheckbox, NTag, NModal, NForm, NFormItem,
  NInput, NRadioGroup, NRadio, NDatePicker, NSelect, NSpace,
  NSpin, NEmpty, useMessage, useDialog,
} from 'naive-ui'
import { AddOutline, TrashOutline, RepeatOutline } from '@vicons/ionicons5'
import { useTodosStore, type Todo } from '../../stores/todos'

const { t } = useI18n()
const todosStore = useTodosStore()
const message = useMessage()
const dialog = useDialog()

const showEditor = ref(false)
const editingTodo = ref<Todo | null>(null)
const parentIdForChild = ref<number | null>(null)
const form = ref({
  title: '',
  description: '',
  priority: 0,
  due_date: null as string | null,
  repeat_type: null as string | null,
})

const dueDateTs = computed({
  get: () => form.value.due_date ? new Date(form.value.due_date).getTime() : null,
  set: (val) => { form.value.due_date = val ? new Date(val).toISOString() : null },
})

const repeatOptions = [
  { label: '每天', value: 'daily' },
  { label: '每周', value: 'weekly' },
  { label: '每月', value: 'monthly' },
]

function isOverdue(due: string) {
  return new Date(due) < new Date()
}

function formatDue(due: string) {
  const d = new Date(due)
  const now = new Date()
  const diff = d.getTime() - now.getTime()
  const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
  if (days < 0) return `已过期 ${-days} 天`
  if (days === 0) return '今天到期'
  if (days === 1) return '明天到期'
  return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}

function handleCreate() {
  editingTodo.value = null
  parentIdForChild.value = null
  form.value = { title: '', description: '', priority: 0, due_date: null, repeat_type: null }
  showEditor.value = true
}

function handleAddChild(parentId: number) {
  editingTodo.value = null
  parentIdForChild.value = parentId
  form.value = { title: '', description: '', priority: 0, due_date: null, repeat_type: null }
  showEditor.value = true
}

function handleEdit(todo: Todo) {
  editingTodo.value = todo
  parentIdForChild.value = null
  form.value = {
    title: todo.title,
    description: todo.description,
    priority: todo.priority,
    due_date: todo.due_date,
    repeat_type: todo.repeat_type,
  }
  showEditor.value = true
}

async function handleSave() {
  if (!form.value.title.trim()) return
  if (editingTodo.value) {
    await todosStore.updateTodo(editingTodo.value.id, form.value)
    message.success('待办已更新')
  } else {
    await todosStore.createTodo({
      ...form.value,
      parent_id: parentIdForChild.value,
    })
    message.success(parentIdForChild.value ? '子任务已添加' : '待办已创建')
  }
  showEditor.value = false
}

function confirmDelete(todo: Todo) {
  dialog.warning({
    title: '确认删除',
    content: todo.children?.length ? '将同时删除所有子任务，移入回收站。' : '待办将移入回收站。',
    positiveText: '删除',
    negativeText: '取消',
    onPositiveClick: async () => {
      await todosStore.deleteTodo(todo.id)
      message.success('已移入回收站')
    },
  })
}

onMounted(() => {
  todosStore.loadTodos()
})
</script>

<style scoped>
.todo-page {
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

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background 0.15s;
}

.todo-item:hover {
  background: rgba(128, 128, 128, 0.06);
}

.todo-item.completed .todo-title {
  text-decoration: line-through;
  opacity: 0.45;
}

.todo-content {
  flex: 1;
  cursor: pointer;
  min-width: 0;
}

.todo-title {
  font-size: 14px;
  display: block;
}

.todo-meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
}

.todo-due {
  font-size: 12px;
  color: rgba(0, 0, 0, 0.45);
}

.todo-due.overdue {
  color: #e03050;
}

.todo-actions {
  display: flex;
  gap: 2px;
  opacity: 0;
  transition: opacity 0.15s;
}

.todo-item:hover .todo-actions {
  opacity: 1;
}

.todo-children {
  padding-left: 36px;
}

.todo-item.sub {
  padding: 6px 12px;
}

.todo-item.sub .todo-title {
  font-size: 13px;
}
</style>
