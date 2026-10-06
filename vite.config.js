import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { viteSingleFile } from 'vite-plugin-singlefile'

export default defineConfig({
  // 相对路径，使产物可脱离服务器、以 file:// 双击方式打开
  base: './',
  plugins: [vue(), viteSingleFile()],
  build: {
    // 全部资源内联进单个 HTML
    assetsInlineLimit: 100_000_000,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 100_000_000
  },
  server: {
    host: '127.0.0.1',
    port: 5173,
    strictPort: true
  }
})
