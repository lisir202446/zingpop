const storageShim = `<script data-zingpop-preview-storage>
(() => {
  const createStorage = () => {
    const items = new Map()
    return {
      get length() {
        return items.size
      },
      clear() {
        items.clear()
      },
      getItem(key) {
        return items.has(String(key)) ? items.get(String(key)) : null
      },
      key(index) {
        return Array.from(items.keys())[Number(index)] ?? null
      },
      removeItem(key) {
        items.delete(String(key))
      },
      setItem(key, value) {
        items.set(String(key), String(value))
      },
    }
  }

  for (const name of ["localStorage", "sessionStorage"]) {
    try {
      void window[name]
    } catch {
      Object.defineProperty(window, name, {
        configurable: true,
        value: createStorage(),
      })
    }
  }
})()
</script>`

export function withPreviewStorageShim(html: string) {
  if (html.includes("data-zingpop-preview-storage")) return html
  if (/<head[\s>]/i.test(html)) return html.replace(/<head([^>]*)>/i, `<head$1>${storageShim}`)
  if (/<html[\s>]/i.test(html)) return html.replace(/<html([^>]*)>/i, `<html$1><head>${storageShim}</head>`)
  return `${storageShim}${html}`
}
