/**
 * Brickr — image loading utilities
 *
 * Handles fetching images from URLs with CORS proxy fallback.
 */

/**
 * Fetch an image from a URL and return it as a File object.
 * Uses a public CORS proxy as a fallback if the direct fetch fails.
 */
export async function fetchImageAsFile(url: string): Promise<File> {
  let response: Response

  try {
    // 1 — Try direct fetch first (best for data URLs and CORS-friendly hosts)
    response = await fetch(url)
    if (!response.ok) throw new Error('Direct fetch failed')
  } catch (err) {
    // 2 — Fallback to image proxy if it's an external HTTP(S) URL
    if (url.startsWith('http')) {
      console.log(
        'Direct fetch blocked by CORS, trying image proxy fallback...'
      )
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(url)}`
      response = await fetch(proxyUrl)
      if (!response.ok) throw new Error('Image proxy fetch failed')
    } else {
      throw err
    }
  }

  const blob = await response.blob()
  if (!blob.type.startsWith('image/')) {
    throw new Error('URL did not return a valid image.')
  }

  const fileName = url.split('/').pop()?.split('?')[0] || 'image'
  const extension = blob.type.split('/')[1] || 'png'

  return new File([blob], `${fileName}.${extension}`, { type: blob.type })
}
