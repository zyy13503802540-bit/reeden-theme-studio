import { createApp } from 'vue'
import App from './App.vue'
import './styles/base.css'

createApp(App).mount('#app')

// PWA：仅在 http(s) 下注册 Service Worker；file:// 双击打开时静默跳过
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => { /* 忽略注册失败 */ })
  })
}
