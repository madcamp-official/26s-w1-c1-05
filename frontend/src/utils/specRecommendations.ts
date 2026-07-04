const SECTION_HEADING = /^[A-Z][A-Z -]*$/;
const MARKDOWN_HEADING = /^#{1,6}\s+(.+)$/;
const RELEVANT_SECTIONS = ['GOALS', 'SCOPE', 'FEATURES', 'REQUIREMENTS', 'TASKS', '기능', '요구사항', '목표', '범위'];

export function parseSpecRecommendations(body: string): string[] {
  const recommendations: string[] = [];
  const allBullets: string[] = [];
  let inRelevantSection = false;

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    const markdownHeading = line.match(MARKDOWN_HEADING)?.[1]?.trim();
    if (markdownHeading || (SECTION_HEADING.test(line) && line === line.toUpperCase() && line.length > 2)) {
      const heading = (markdownHeading ?? line).toUpperCase();
      inRelevantSection = RELEVANT_SECTIONS.some((section) => heading.includes(section));
      continue;
    }

    if (line.startsWith('- ')) {
      const item = line.slice(2).trim();
      allBullets.push(item);
      if (inRelevantSection) recommendations.push(item);
    }
  }

  return (recommendations.length > 0 ? recommendations : allBullets).slice(0, 8);
}
