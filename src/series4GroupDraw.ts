function shuffled<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const random = new Uint32Array(1);
    crypto.getRandomValues(random);
    const j = Math.floor((random[0] / 0x100000000) * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

export function buildSeries4GroupDraw<T>(ranked: readonly T[], capacity: 32 | 48) {
  if (ranked.length !== capacity) throw new Error('The main roster must match capacity.');
  const groupCount = capacity / 4;
  const pots = Array.from({length: 4}, (_, index) => ranked.slice(index * groupCount, (index + 1) * groupCount));
  const shuffledPots = pots.map(shuffled);
  const groups = Array.from({length: groupCount}, (_, index) => ({
    name: String.fromCharCode(65 + index),
    players: shuffledPots.map(pot => pot[index]),
  }));
  return {pots, groups};
}
