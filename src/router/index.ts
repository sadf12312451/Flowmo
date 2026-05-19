import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      redirect: '/chat',
    },
    {
      path: '/chat',
      name: 'Chat',
      component: () => import('../views/Chat/index.vue'),
    },
    {
      path: '/sticky-note',
      name: 'StickyNote',
      component: () => import('../views/StickyNote/index.vue'),
    },
    {
      path: '/notepad',
      name: 'Notepad',
      component: () => import('../views/Notepad/index.vue'),
    },
    {
      path: '/todo',
      name: 'Todo',
      component: () => import('../views/Todo/index.vue'),
    },
    {
      path: '/countdown',
      name: 'Countdown',
      component: () => import('../views/Countdown/index.vue'),
    },
    {
      path: '/pomodoro',
      name: 'Pomodoro',
      component: () => import('../views/Pomodoro/index.vue'),
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Calendar/index.vue'),
    },
    {
      path: '/habit-tracker',
      name: 'HabitTracker',
      component: () => import('../views/HabitTracker/index.vue'),
    },
    {
      path: '/stats',
      name: 'Stats',
      component: () => import('../views/Stats/index.vue'),
    },
    {
      path: '/trash',
      name: 'Trash',
      component: () => import('../views/Trash/index.vue'),
    },
    {
      path: '/settings',
      name: 'Settings',
      component: () => import('../views/Settings/index.vue'),
    },
    {
      path: '/sticky-float',
      name: 'StickyFloat',
      component: () => import('../views/StickyNote/FloatWindow.vue'),
    },
  ],
})

export default router
