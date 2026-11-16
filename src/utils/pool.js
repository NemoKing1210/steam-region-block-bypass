export async function mapPool(items, concurrency, worker) {
  const list = Array.isArray(items) ? items : [];
  const limit = Math.max(1, Math.min(list.length || 1, Math.round(concurrency) || 1));
  let nextIndex = 0;

  async function run() {
    while (true) {
      const index = nextIndex;
      nextIndex += 1;
      if (index >= list.length) return;
      await worker(list[index], index);
    }
  }

  await Promise.all(Array.from({ length: limit }, run));
}
