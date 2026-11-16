export default function PlaybackIcon({ playing, ended }) {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24">
    {playing ? <path fill="currentColor" d="M7 5h3v14H7zm7 0h3v14h-3z" />
      : ended ? <path d="M5 10a7 7 0 1 1 1 7M5 4v6h6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      : <path fill="currentColor" d="M8 4.5 20 12 8 19.5z" />}
  </svg>;
}
