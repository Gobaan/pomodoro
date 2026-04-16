import { useEffect, useRef, useCallback } from 'react'

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
  }
}

let scriptLoaded = false
let apiReady = false
const readyCallbacks: Array<() => void> = []

function loadYTScript() {
  if (scriptLoaded) return
  scriptLoaded = true

  const tag = document.createElement('script')
  tag.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(tag)

  window.onYouTubeIframeAPIReady = () => {
    apiReady = true
    readyCallbacks.forEach(cb => cb())
    readyCallbacks.length = 0
  }
}

function onAPIReady(cb: () => void) {
  if (apiReady) {
    cb()
  } else {
    readyCallbacks.push(cb)
  }
}

interface UseYouTubePlayerOptions {
  containerId: string
  onReady?: () => void
}

export function useYouTubePlayer({ containerId, onReady }: UseYouTubePlayerOptions) {
  const playerRef = useRef<YT.Player | null>(null)
  const readyRef = useRef(false)

  useEffect(() => {
    loadYTScript()
    onAPIReady(() => {
      if (playerRef.current) return
      playerRef.current = new window.YT.Player(containerId, {
        width: 1,
        height: 1,
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          iv_load_policy: 3,
          modestbranding: 1,
          rel: 0,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            readyRef.current = true
            onReady?.()
          },
        },
      })
    })

    return () => {
      playerRef.current?.destroy()
      playerRef.current = null
      readyRef.current = false
    }
  }, [containerId]) // eslint-disable-line react-hooks/exhaustive-deps

  const loadAndPlay = useCallback((videoId: string, startSeconds: number) => {
    if (!playerRef.current || !readyRef.current) return
    playerRef.current.loadVideoById({ videoId, startSeconds })
  }, [])

  const pause = useCallback(() => {
    playerRef.current?.pauseVideo()
  }, [])

  const resume = useCallback(() => {
    playerRef.current?.playVideo()
  }, [])

  return { loadAndPlay, pause, resume }
}
