const SECTION_HEADING = /^[A-Z][A-Z -]*$/;
const RELEVANT_SECTIONS = new Set(['GOALS', 'SCOPE']);

export function parseSpecRecommendations(body: string): string[] {
  const recommendations: string[] = [];
  let inRelevantSection = false;

  for (const rawLine of body.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (SECTION_HEADING.test(line) && line === line.toUpperCase() && line.length > 2) {
      inRelevantSection = RELEVANT_SECTIONS.has(line);
      continue;
    }

    if (inRelevantSection && line.startsWith('- ')) {
      recommendations.push(line.slice(2).trim());
    }
  }

  return recommendations;
}
