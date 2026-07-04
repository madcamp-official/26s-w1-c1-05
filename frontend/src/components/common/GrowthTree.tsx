type GrowthTreeProps = {
  taskCount: number;
  fruitCount: number;
};

export function GrowthTree({ taskCount, fruitCount }: GrowthTreeProps) {
  const branches = Array.from({ length: Math.max(taskCount, 1) }, (_, index) => index);

  return (
    <svg className="growth-tree" viewBox="0 0 240 210" role="img" aria-label="task growth tree">
      <line x1="44" y1="198" x2="196" y2="198" />
      <path className="tree-path-main" d="M120 196 C119 158 120 118 120 58" />
      {branches.map((branch) => {
        const side = branch % 2 === 0 ? 1 : -1;
        const attachY = 172 - branch * 20;
        const spread = 30 + (branches.length - branch) * 4;
        const endX = 120 + side * spread;
        const endY = attachY - 30 - branch * 2;
        const ctrlX = 120 + side * (spread * 0.42);
        const ctrlY = attachY - 6;
        const hasFruit = branch < fruitCount;
        return (
          <g key={branch}>
            <path d={`M120 ${attachY} Q${ctrlX} ${ctrlY} ${endX} ${endY}`} />
            <circle cx={endX - 7 * side} cy={endY - 1} r="3.2" />
            <circle cx={endX + 7 * side} cy={endY - 3} r="3.2" />
            <circle cx={endX} cy={endY - 11} r="3.2" />
            {hasFruit && <circle className="tree-fruit" cx={endX + side * 2} cy={endY + 3} r="4.2" />}
          </g>
        );
      })}
    </svg>
  );
}
