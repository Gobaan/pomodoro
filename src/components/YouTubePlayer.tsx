/**
 * Renders the hidden YouTube IFrame container.
 * The actual player instance is managed by useYouTubePlayer hook.
 * This component just provides the DOM anchor.
 */
export function YouTubePlayer({ containerId }: { containerId: string }) {
  return (
    <div
      aria-hidden="true"
      style={{ position: 'fixed', bottom: 0, right: 0, width: 1, height: 1, overflow: 'hidden', opacity: 0 }}
    >
      <div id={containerId} />
    </div>
  )
}
