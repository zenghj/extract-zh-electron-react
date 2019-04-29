/**
 * 完全并发可能会导致内存占用过大 batchAsyncTask 可配置并发量
 */
async function batchAsyncTask(asyncFn, argsList, batchCount) {
  const list = [];
  let i = 0;
  while (i < argsList.length) {
    list.push(argsList.slice(i, i + batchCount));
    i += batchCount;
  }
  const results = [];
  /*eslint-disable */
  for (const pieceArgs of list) {
    const pieceResults = await Promise.all(pieceArgs.map(args => asyncFn(...(Array.isArray(args) ? args : [args]))));
    results.push(...pieceResults);
  }
  return results
  /*eslint-enable */
}

module.exports = {
  batchAsyncTask,
};
