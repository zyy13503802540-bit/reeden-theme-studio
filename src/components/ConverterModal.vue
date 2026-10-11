<script setup>
// 阅读主题格式转换器（Readingo / Reeden / 阅读 MD3 / Archive 互转）
// 核心逻辑在 lib/converter.js（提取自无异的"阅读主题转换器"）
import { reactive, ref, computed } from 'vue'
import { detect, convert, zipBytes, KIND_LABEL } from '../lib/converter.js'

const props = defineProps({ open: Boolean })
const emit = defineEmits(['close'])

/* ---------------- 文件选择与识别 ---------------- */
const picked = reactive([]) // { name, bytesU8, d: {kind, detail} }
const dragOver = ref(false)
const fileInput = ref(null)

const BAD_KINDS = ['unknown', 'red-encrypted']

async function readFiles(fileList) {
  for (const f of fileList) {
    if (picked.some(p => p.name === f.name && p.bytesU8.length === f.size)) continue
    const bytesU8 = new Uint8Array(await f.arrayBuffer())
    picked.push({ name: f.name, bytesU8, d: detect(f.name, bytesU8) })
  }
  picked.sort((a, b) => (a.name < b.name ? -1 : 1))
}

async function onPick(e) {
  if (e.target.files?.length) await readFiles([...e.target.files])
  e.target.value = ''
}
async function onDrop(e) {
  dragOver.value = false
  if (e.dataTransfer?.files?.length) await readFiles([...e.dataTransfer.files])
}
function clearPicked() {
  picked.splice(0)
  results.splice(0)
  errorMsg.value = ''
}
function removePicked(i) {
  picked.splice(i, 1)
}

/* ---------------- 输出格式 ---------------- */
const targets = reactive({ red: true, md3: false, arc: false })
const targetList = computed(() => Object.keys(targets).filter(k => targets[k]))
const TARGET_LABEL = { red: 'Red（未加密）', md3: 'MD3', arc: 'Arc' }
const canConvert = computed(() => picked.length > 0 && targetList.value.length > 0 && !converting.value)

/* ---------------- 自定义名称 / 高级排版 ---------------- */
const LAYOUT_KEY = 'themeConverter.layout.v1'
const NAME_KEY = 'themeConverter.outName.v1'
const outName = ref('')
const layout = reactive({ lineSpacing: 10, paragraphSpacing: 7, fontSize: 16, letterSpacing: 0.1 })
try {
  Object.assign(layout, JSON.parse(localStorage.getItem(LAYOUT_KEY) || '{}'))
  outName.value = localStorage.getItem(NAME_KEY) || ''
} catch { /* 隐私模式降级 */ }

function sanitizeName(v) {
  return String(v || '').trim().replace(/[\\/:*?"<>|\x00-\x1f]/g, '').replace(/\.(red|zip)$/i, '').trim().slice(0, 60)
}
function savePrefs() {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(layout))
    localStorage.setItem(NAME_KEY, sanitizeName(outName.value))
  } catch { /* 忽略 */ }
}

/* ---------------- 转换与结果 ---------------- */
const converting = ref(false)
const results = reactive([]) // { name, source, bytesU8, notes, target }
const stageText = ref('')
const errorMsg = ref('')
const bundle = reactive({ busy: false, name: '', size: 0, url: '' })

function sizeText(n) {
  if (n == null) return ''
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / 1048576).toFixed(2)} MB`
}

function download(url, name) {
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
}

const resultGroups = computed(() => {
  const groups = []
  for (const p of results) {
    let g = groups.find(x => x.source === p.source)
    if (!g) { g = { source: p.source, items: [] }; groups.push(g) }
    g.items.push({ ...p, notes: [...new Set(p.notes || [])] })
  }
  return groups
})

function onStage(e) {
  if (e.phase === 'start') stageText.value = `${e.source} → ${TARGET_LABEL[e.target] || e.target} …`
}

async function startConvert() {
  if (!canConvert.value) return
  savePrefs()
  converting.value = true
  errorMsg.value = ''
  results.splice(0)
  bundle.url = ''
  bundle.busy = false
  try {
    const out = await convert(
      picked.map(p => ({ name: p.name, bytesU8: p.bytesU8 })),
      targetList.value,
      { layout: { ...layout }, name: sanitizeName(outName.value), onStage }
    )
    for (const r of out) {
      const url = r.bytesU8
        ? URL.createObjectURL(new Blob([r.bytesU8], { type: 'application/octet-stream' }))
        : ''
      results.push({ ...r, url })
    }
    stageText.value = ''
    // 多于一个可下载产物时，额外合成"全部产物.zip"
    const downloadable = out.filter(r => r.bytesU8)
    if (downloadable.length > 1) await buildBundle(downloadable, out)
  } catch (err) {
    errorMsg.value = err?.message || '转换失败，请换一份文件再试'
    stageText.value = ''
  } finally {
    converting.value = false
  }
}

async function buildBundle(downloadable, out) {
  bundle.busy = true
  try {
    const map = new Map(downloadable.map(p => [p.name, p.bytesU8]))
    const zb = await zipBytes(map)
    const sources = [...new Set(downloadable.map(p => p.source))]
    const firstName = downloadable[0].name.replace(/\.[^.]+$/, '')
    bundle.name = sources.length === 1 ? `${firstName} 全部产物.zip` : '全部产物.zip'
    bundle.size = zb.length
    bundle.url = URL.createObjectURL(new Blob([zb], { type: 'application/zip' }))
  } catch {
    bundle.busy = false
  } finally {
    bundle.busy = false
  }
}

function kindLabel(kind) {
  return KIND_LABEL[kind] || '识别不出这个格式'
}
</script>

<template>
  <div v-if="open" class="overlay converter-overlay" @click.self="emit('close')">
    <div class="converter-sheet">
      <header class="cv-head">
        <div>
          <h2>阅读主题转换器</h2>
          <p class="cv-sub">Readingo · 阅读 MD3 · 阅读 Archive · Reeden 格式互转</p>
        </div>
        <button class="cv-close" @click="emit('close')" title="关闭">×</button>
      </header>

      <div class="cv-body">
        <!-- 上传区 -->
        <div
          class="cv-drop"
          :class="{ over: dragOver }"
          @click="fileInput?.click()"
          @dragenter.prevent="dragOver = true"
          @dragover.prevent="dragOver = true"
          @dragleave.prevent="dragOver = false"
          @drop.prevent="onDrop"
        >
          <div class="cv-drop-title">拖拽文件到这里，或点击选择</div>
          <div class="cv-drop-sub">.rgshare / .rgshare2 / .red / 主题包 zip / 排版包 zip（可多选）</div>
          <input ref="fileInput" type="file" multiple accept=".rgshare,.rgshare2,.red,.zip" @change="onPick" />
        </div>
        <p class="cv-hint">Reeden 或 Readingo 的主题请使用未加密格式；高亮规则无法跨软件转换，排版需自行微调。</p>

        <!-- 识别结果 -->
        <section v-if="picked.length" class="cv-card">
          <div class="cv-card-head">
            <h3>识别结果（{{ picked.length }}）</h3>
            <button class="btn btn-sm" @click="clearPicked">清空重选</button>
          </div>
          <ul class="cv-list">
            <li v-for="(p, i) in picked" :key="p.name + p.bytesU8.length" :class="{ bad: BAD_KINDS.includes(p.d.kind) }">
              <div class="cv-fn">
                <span class="cv-fn-name">{{ p.name }}</span>
                <button class="cv-fn-del" @click="removePicked(i)" title="移除">×</button>
              </div>
              <div class="cv-kind">{{ kindLabel(p.d.kind) }} · {{ sizeText(p.bytesU8.length) }}</div>
            </li>
          </ul>
        </section>

        <!-- 输出格式 -->
        <section class="cv-card">
          <h3>输出格式</h3>
          <div class="cv-formats">
            <label class="cv-opt" :class="{ on: targets.red }">
              <input type="checkbox" v-model="targets.red" />
              <span>Red（未加密）</span>
            </label>
            <label class="cv-opt" :class="{ on: targets.md3 }">
              <input type="checkbox" v-model="targets.md3" />
              <span>阅读 MD3</span>
            </label>
            <label class="cv-opt" :class="{ on: targets.arc }">
              <input type="checkbox" v-model="targets.arc" />
              <span>阅读 Archive</span>
            </label>
          </div>
          <p class="cv-hint">需要导入 Readingo 时直接选 Red（未加密）即可；MD3 / Arc 会同时产出主题包和阅读页排版包两个文件。</p>

          <div class="cv-named">
            <label>自定义导出名称（留空用源主题名）</label>
            <input v-model="outName" type="text" maxlength="60" autocomplete="off" placeholder="留空就用源主题名" />
          </div>

          <details class="cv-adv">
            <summary>高级排版覆盖（行距 / 段距 / 字号 / 字间距）</summary>
            <div class="cv-adv-grid">
              <label>行距<input v-model.number="layout.lineSpacing" type="number" step="0.1" min="0" max="500" inputmode="decimal" @change="savePrefs" /></label>
              <label>段落间距<input v-model.number="layout.paragraphSpacing" type="number" step="0.1" min="0" max="500" inputmode="decimal" @change="savePrefs" /></label>
              <label>字体大小<input v-model.number="layout.fontSize" type="number" step="0.1" min="4" max="500" inputmode="decimal" @change="savePrefs" /></label>
              <label>字间距<input v-model.number="layout.letterSpacing" type="number" step="0.1" min="-10" max="50" inputmode="decimal" @change="savePrefs" /></label>
            </div>
            <p class="cv-hint">导出时用这四项覆盖源文件数值，仅保存在你自己的设备上。</p>
          </details>

          <button class="btn btn-primary cv-go" :disabled="!canConvert" @click="startConvert">
            {{ converting ? '转换中…' : '开始转换' }}
          </button>
          <div v-if="stageText" class="cv-stage"><span class="dot spin" /> {{ stageText }}</div>
          <div v-if="errorMsg" class="cv-error">{{ errorMsg }}</div>
        </section>

        <!-- 结果 -->
        <section v-if="results.length" class="cv-card">
          <h3>转换结果</h3>
          <div v-for="g in resultGroups" :key="g.source" class="cv-grp">
            <div class="cv-grp-head">{{ g.source }}</div>
            <div v-for="(p, i) in g.items" :key="i" class="cv-prod" :class="{ none: !p.bytesU8 }">
              <div class="cv-meta">
                <div class="cv-prod-name">{{ p.name }}</div>
                <div class="cv-prod-size">{{ p.bytesU8 ? sizeText(p.bytesU8.length) : '源就是该格式，未重新打包' }}</div>
                <ul v-if="p.notes.length" class="cv-notes">
                  <li v-for="(n, j) in p.notes" :key="j">{{ n }}</li>
                </ul>
              </div>
              <a v-if="p.url" class="btn btn-sm btn-primary" @click="download(p.url, p.name)">下载</a>
            </div>
          </div>

          <div v-if="bundle.busy" class="cv-bundle"><span class="dot spin" /> 正在打包全部产物…</div>
          <div v-else-if="bundle.url" class="cv-prod cv-bundle">
            <div class="cv-meta">
              <div class="cv-prod-name">{{ bundle.name }}</div>
              <div class="cv-prod-size">{{ sizeText(bundle.size) }}</div>
            </div>
            <a class="btn btn-sm btn-primary" @click="download(bundle.url, bundle.name)">下载</a>
          </div>
        </section>

        <footer class="cv-foot">
          red 与 rg 互转基于 Chi 老师的 Skill，转换核心作者：无异。转换在本机浏览器完成，文件不会上传。<br />
          若非作者本人，请在征询作者同意后再进行格式转换。
        </footer>
      </div>
    </div>
  </div>
</template>
