/**
 * Client-Side WebP Image Compressor
 * Resizes high-res camera photos (JPEG, PNG, HEIC) down to max 1920px width/height
 * and encodes as WebP at ~80% quality.
 * Reduces an 8MB-10MB photo down to ~250KB - 400KB before uploading to storage.
 */
export async function compressImageToWebP(file: File, maxDimension = 1920, quality = 0.82): Promise<File> {
  // If already a small WebP under 300KB, no need to re-encode
  if (file.type === 'image/webp' && file.size <= 300 * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(url)

      let { width, height } = img

      // Calculate constrained dimensions preserving aspect ratio
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        } else {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        reject(new Error('Failed to get 2D canvas context'))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas compression failed to generate blob'))
            return
          }

          const compressedFileName = file.name.replace(/\.[^/.]+$/, '') + '.webp'
          const compressedFile = new File([blob], compressedFileName, {
            type: 'image/webp',
            lastModified: Date.now(),
          })

          resolve(compressedFile)
        },
        'image/webp',
        quality
      )
    }

    img.onerror = (err) => {
      URL.revokeObjectURL(url)
      reject(err)
    }

    img.src = url
  })
}
