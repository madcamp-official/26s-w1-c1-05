import type { CSSProperties } from 'react';
import './GrowthTree.css';

type GrowthTreeProps = {
  backlogCount: number;
  inProgressCount: number;
  completedCount: number;
  totalCount: number;
  /** 'mono' while the project runs; 'green' once it has been wrapped up. */
  palette?: 'mono' | 'green';
};

type TaskStage = 'backlog' | 'progress' | 'done';

const MAX_BRANCHES = 12;
const branches = [
  { side: -1, y: 169, x: 66, endY: 137 },
  { side: 1, y: 160, x: 178, endY: 126 },
  { side: -1, y: 148, x: 50, endY: 107 },
  { side: 1, y: 137, x: 194, endY: 95 },
  { side: -1, y: 126, x: 73, endY: 84 },
  { side: 1, y: 114, x: 169, endY: 72 },
  { side: -1, y: 103, x: 54, endY: 62 },
  { side: 1, y: 92, x: 187, endY: 51 },
  { side: -1, y: 82, x: 82, endY: 43 },
  { side: 1, y: 72, x: 158, endY: 34 },
  { side: -1, y: 62, x: 94, endY: 28 },
  { side: 1, y: 54, x: 145, endY: 22 },
];

export function GrowthTree({ backlogCount, inProgressCount, completedCount, totalCount, palette = 'green' }: GrowthTreeProps) {
  const visibleCount = Math.min(totalCount, MAX_BRANCHES);
  const stages = Array.from({ length: visibleCount }, (_, index): TaskStage => {
    const taskIndex = Math.floor((index * totalCount) / visibleCount);
    if (taskIndex < backlogCount) return 'backlog';
    if (taskIndex < backlogCount + inProgressCount) return 'progress';
    return 'done';
  });
  const maturity = totalCount === 0 ? 0 : completedCount / totalCount;

  return (
    <svg viewBox="0 0 240 220" className={`growth-tree-svg${palette === 'green' ? ' tree-green' : ''}`} role="img" aria-label={`${backlogCount} backlog, ${inProgressCount} in progress, and ${completedCount} done tasks`}>
      <ellipse className="tree-shadow" cx="120" cy="205" rx="61" ry="7" />
      <path className="tree-ground" d="M43 202 C75 198 92 204 120 201 C148 198 169 204 198 201" />

      <g className="tree-body">
        <path className="tree-trunk" d="M108 201 C112 177 108 153 115 129 C119 108 114 87 120 66 C123 52 125 39 124 24 C132 47 128 65 131 82 C135 105 128 125 133 148 C137 170 132 188 137 201 Z" />
        <path className="tree-trunk-highlight" d="M119 194 C121 165 118 142 124 118 C128 96 124 72 128 48" />
        {stages.map((stage, index) => {
          const branch = branches[index];
          const controlX = 120 + branch.side * (Math.abs(branch.x - 120) * 0.44);
          const twigX = branch.x - branch.side * 13;
          const twigY = branch.endY - 12;
          return (
            <g className={`tree-branch tree-branch-${stage}`} style={{ animationDelay: `${index * 55}ms`, '--tree-stagger': `${index * 90}ms` } as CSSProperties} key={index}>
              <path className="tree-limb" d={`M124 ${branch.y} C${controlX} ${branch.y - 5}, ${twigX} ${branch.endY + 8}, ${branch.x} ${branch.endY}`} />
              <path className="tree-twig" d={`M${twigX} ${branch.endY + 7} Q${twigX - branch.side * 2} ${twigY + 4} ${twigX - branch.side * 8} ${twigY}`} />
              {stage === 'backlog' && (
                <g className="tree-sprout" transform={`translate(${branch.x} ${branch.endY}) rotate(${branch.side * 18})`}>
                  <path d="M0 5 Q0 -2 0 -8" />
                  <ellipse cx={-4} cy={-7} rx="4.5" ry="2.5" transform="rotate(28 -4 -7)" />
                  <ellipse cx={4} cy={-10} rx="4.5" ry="2.5" transform="rotate(-28 4 -10)" />
                </g>
              )}
              {stage === 'progress' && (
                <g className="tree-leaves">
                  <ellipse cx={branch.x} cy={branch.endY - 4} rx="9" ry="5" transform={`rotate(${branch.side * -24} ${branch.x} ${branch.endY - 4})`} />
                  <ellipse cx={twigX - branch.side * 8} cy={twigY - 1} rx="7" ry="4" transform={`rotate(${branch.side * 34} ${twigX} ${twigY})`} />
                </g>
              )}
              {stage === 'done' && (
                <g className="tree-done-crown">
                  <ellipse className="tree-done-leaf" cx={branch.x - branch.side * 3} cy={branch.endY - 6} rx="9" ry="5" transform={`rotate(${branch.side * -28} ${branch.x} ${branch.endY})`} />
                  <circle className="tree-fruit" cx={branch.x + branch.side * 5} cy={branch.endY + 3} r="5" />
                </g>
              )}
            </g>
          );
        })}
        <g className={`tree-crown-bud${maturity > 0.65 ? ' is-grown' : ''}`}>
          <path d="M124 28 Q119 18 113 13" />
          <ellipse cx="110" cy="11" rx="7" ry="4" transform="rotate(32 110 11)" />
          <path d="M125 26 Q132 17 138 14" />
          <ellipse cx="141" cy="12" rx="7" ry="4" transform="rotate(-28 141 12)" />
        </g>
      </g>
    </svg>
  );
}
