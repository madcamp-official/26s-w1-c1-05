import './StatTile.css';

type StatTileProps = {
  label: string;
  value: string | number;
  caption?: string;
  valueColor?: string;
};

export function StatTile({ label, value, caption, valueColor }: StatTileProps) {
  return (
    <div className="ds-stat-tile">
      <span className="ds-stat-label">{label}</span>
      <span className="ds-stat-value" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </span>
      {caption && <span className="ds-stat-caption">{caption}</span>}
    </div>
  );
}
