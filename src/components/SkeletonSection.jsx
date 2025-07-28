export default function SkeletonSection({ title = "Loading..." }) {
  return (
    <div className="skeleton-section">
      <h2 className="skeleton-title">{title}</h2>
      <div className="skeleton-line" />
      <div className="skeleton-line short" />
    </div>
  );
} 