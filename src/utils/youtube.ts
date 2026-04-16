/**
 * Extract YouTube video ID from any common URL format.
 * Returns null if the URL is not a recognisable YouTube URL.
 */
export function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url.trim())
    // youtu.be/<id>
    if (u.hostname === 'youtu.be') {
      const id = u.pathname.slice(1).split('/')[0]
      return id.length === 11 ? id : null
    }
    // youtube.com/watch?v=<id>
    if (u.hostname.endsWith('youtube.com')) {
      const v = u.searchParams.get('v')
      if (v && v.length === 11) return v
      // youtube.com/embed/<id> or /v/<id>
      const match = u.pathname.match(/\/(embed|v|shorts)\/([A-Za-z0-9_-]{11})/)
      if (match) return match[2]
    }
    return null
  } catch {
    return null
  }
}
