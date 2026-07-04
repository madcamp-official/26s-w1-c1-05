import './GrowthTree.css';

type GrowthTreeProps = {
  completedCount: number;
  totalCount: number;
};

const MAX_BRANCHES = 10;
const CENTER_X = 120;
const BASE_Y = 196;
const TOP_Y = 58;

export function GrowthTree({ completedCount, totalCount }: GrowthTreeProps) {
  const branchCount = Math.min(totalCount, MAX_BRANCHES);
  const completedBranches = Math.min(completedCount, branchCount);

  const groundTicks = Array.from({ length: 5 }, (_, index) => 60 + index * 22);
  const branches = Array.from({ length: branchCount }, (_, index) => index);

  return (
    <svg width={240} height={210} viewBox="0 0 240 210" className="growth-tree-svg" role="img" aria-label={`${completedCount} of ${totalCount} tasks completed`}>
      <line x1={44} y1={198} x2={196} y2={198} stroke="var(--gray-300)" strokeWidth={1.5} strokeLinecap="round" />
      {groundTicks.map((gx) => (
        <line key={gx} x1={gx} y1={198} x2={gx - 4} y2={191} stroke="var(--gray-200)" strokeWidth={1.5} strokeLinecap="round" />
      ))}
      <path d={`M${CENTER_X} ${BASE_Y} C119 158 120 118 120 ${TOP_Y}`} stroke="var(--ink)" strokeWidth={3} fill="none" strokeLinecap="round" />
      {branches.map((index) => {
        const side = index % 2 === 0 ? 1 : -1;
        const attachY = 172 - index * (branchCount > 6 ? 12 : 20);
        const spread = 30 + (branchCount - index) * 4;
        const endX = CENTER_X + side * spread;
        const endY = attachY - 30 - index * 2;
        const ctrlX = CENTER_X + side * (spread * 0.42);
        const ctrlY = attachY - 6;
        const isCompleted = index < completedBranches;
        const budOffsets: Array<[number, number]> = [
          [-7, -1],
          [7, -3],
          [0, -11],
        ];

        return (
          <g key={index}>
            <path
              d={`M${CENTER_X} ${attachY} Q${ctrlX} ${ctrlY} ${endX} ${endY}`}
              stroke="var(--ink)"
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
            {budOffsets.map(([ox, oy], budIndex) => (
              <circle
                key={budIndex}
                cx={endX + ox * (side > 0 ? 1 : -1)}
                cy={endY + oy}
                r={3.2}
                fill="var(--bg)"
                stroke="var(--gray-500)"
                strokeWidth={1.2}
              />
            ))}
            {isCompleted && <circle cx={endX + side * 2} cy={endY + 3} r={4.2} fill="var(--ink)" />}
          </g>
        );
      })}
    </svg>
  );
}
