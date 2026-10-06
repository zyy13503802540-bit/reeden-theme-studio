// IndexedDB 持久化：保存 .red 原始字节，刷新后可重新解析还原
const DB_NAME = 'ReedenThemeStudio'
const DB_VERSION = 1
const STORE = 'files'

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function request(req) {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function saveFile(record) {
  const db = await openDb()
  await request(db.transaction(STORE, 'readwrite').objectStore(STORE).put(record))
}

export async function getAllFiles() {
  const db = await openDb()
  return request(db.transaction(STORE, 'readonly').objectStore(STORE).getAll())
}

export async function clearFiles() {
  const db = await openDb()
  await request(db.transaction(STORE, 'readwrite').objectStore(STORE).clear())
}

export async function deleteFile(id) {
  const db = await openDb()
  await request(db.transaction(STORE, 'readwrite').objectStore(STORE).delete(id))
}

export async function getFile(id) {
  const db = await openDb()
  return request(db.transaction(STORE, 'readonly').objectStore(STORE).get(id))
}
