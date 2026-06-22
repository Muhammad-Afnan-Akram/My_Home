// Client-side image handling for the optional car photo. We resize + compress
// the picked image to a small JPEG data URL so it can live directly in the
// database (text column) without any storage-bucket infrastructure.

/** Longest edge of the stored image, in pixels. */
const MAX_EDGE = 1000
/** JPEG quality (0–1). 0.72 keeps photos ~60–120KB. */
const QUALITY = 0.72

/**
 * Read an image File, downscale it to fit within MAX_EDGE on its longest side,
 * and return a compressed JPEG data URL. Rejects on non-images or decode
 * failures so the caller can surface a friendly message.
 */
export function fileToResizedDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Please choose an image file.'))
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject(new Error('Could not load the image.'))
      img.onload = () => {
        const { width, height } = img
        const scale = Math.min(1, MAX_EDGE / Math.max(width, height))
        const w = Math.round(width * scale)
        const h = Math.round(height * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not process the image.'))
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL('image/jpeg', QUALITY))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
