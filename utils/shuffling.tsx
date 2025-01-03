function seededRandom(seed: number): number {
  const x = Math.sin(seed++) * 10000;
  return x - Math.floor(x);
}

type ShuffleResult<T> = {
  shuffledArray: T[];
  shuffleIndexes: number[];
};

function shuffleArrayWithSeed<T>(array: T[], seed: number): ShuffleResult<T> {
  const indexes = array.map((_, index) => index);
  const shuffledArray = [...array];

  for (let i = shuffledArray.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed) * (i + 1));
    seed++; // Increment seed for reproducibility
    [shuffledArray[i], shuffledArray[j]] = [shuffledArray[j], shuffledArray[i]];
    [indexes[i], indexes[j]] = [indexes[j], indexes[i]];
  }

  return { shuffledArray, shuffleIndexes: indexes };
}
function unshuffleArray<T>(array: T[], shuffleIndexes: number[]): T[] {
    const originalArray: T[] = new Array(array.length);
    for (let i = 0; i < shuffleIndexes.length; i++) {
      originalArray[shuffleIndexes[i]] = array[i];
    }
    return originalArray;
  }

export { shuffleArrayWithSeed, unshuffleArray };