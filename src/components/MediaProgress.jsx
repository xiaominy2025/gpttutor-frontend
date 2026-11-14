export default function MediaProgress({ elapsed, total, buffered = 0, label, ...props }) {
  const percent = value => `${total ? Math.min(100, Math.max(0, value / total * 100)) : 0}%`;
  return <input {...props} className="engent-media-progress" type="range" min="0" max={total || 1} step=".1"
    value={elapsed} aria-label={label} style={{ '--played': percent(elapsed), '--buffered': percent(buffered) }} />;
}
