export function levenshteinDistance(a, b) {
  if (!a || !b) return (a || b || '').length;
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

export function fuzzyMatch(query, target) {
  if (!query || !target) return false;
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase().trim();
  if (t.includes(q)) return true;

  const qWords = q.split(/\s+/);
  const tWords = t.split(/\s+/);

  return qWords.every(qWord => {
    return tWords.some(tWord => {
      if (tWord.includes(qWord) || qWord.includes(tWord)) return true;
      const maxDist = qWord.length > 5 ? 2 : 1;
      return levenshteinDistance(qWord, tWord) <= maxDist;
    });
  });
}
