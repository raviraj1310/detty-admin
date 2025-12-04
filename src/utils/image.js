export const getExt = name => {
  const n = String(name || '')
  const parts = n.split('.')
  return parts.length > 1 ? parts.pop().toLowerCase() : ''
}

export const ensureWebpFileName = name => {
  const base = String(name || '').replace(/\.[^.]+$/, '')
  return `${base || 'image'}.webp`
}

export const fileToImageBitmap = async file => {
  const blob = file instanceof Blob ? file : new Blob([file])
  const bitmap = await createImageBitmap(blob)
  return { bitmap, type: file.type }
}

export const drawToCanvas = bitmap => {
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0)
  return canvas
}

export const canvasToWebpBlob = (canvas, quality = 0.82) =>
  new Promise((resolve, reject) => {
    canvas.toBlob(
      b => {
        if (!b) return reject(new Error('Failed to create WebP blob'))
        resolve(b)
      },
      'image/webp',
      quality
    )
  })

export const convertToWebp = async (file, quality = 0.82) => {
  const originalSize = file?.size || 0
  const ext = getExt(file?.name)
  const supported = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'heic']
  if (!supported.includes(ext)) throw new Error('Unsupported image format')
  let bitmap
  try {
    const r = await fileToImageBitmap(file)
    bitmap = r.bitmap
  } catch (e) {
    if (ext === 'heic') throw new Error('HEIC conversion is not supported in this browser')
    throw e
  }
  const canvas = drawToCanvas(bitmap)
  const webpBlob = await canvasToWebpBlob(canvas, quality)
  const webpFile = new File([webpBlob], ensureWebpFileName(file.name), { type: 'image/webp' })
  return {
    file: webpFile,
    width: bitmap.width,
    height: bitmap.height,
    originalSizeBytes: originalSize,
    sizeBytes: webpBlob.size,
    format: 'webp'
  }
}

export const convertFilesToWebp = async (files, quality = 0.82) => {
  const list = Array.from(files || [])
  const out = []
  for (const f of list) {
    // eslint-disable-next-line no-await-in-loop
    const r = await convertToWebp(f, quality)
    out.push(r)
  }
  return out
}