/**
 * Run async work over items in parallel batches to avoid sequential N+1 waterfalls
 * without flooding the network with unbounded concurrency.
 */
export async function mapInBatches<T, R>(
  items: T[],
  batchSize: number,
  mapper: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const size = Math.max(1, batchSize);
  const results: R[] = new Array(items.length);

  for (let i = 0; i < items.length; i += size) {
    const slice = items.slice(i, i + size);
    const batch = await Promise.all(
      slice.map((item, offset) => mapper(item, i + offset)),
    );
    for (let j = 0; j < batch.length; j++) {
      results[i + j] = batch[j];
    }
  }

  return results;
}
