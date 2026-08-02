export default async function* iterateStream<T = any>(stream: any): AsyncGenerator<T> {
  if (Symbol.asyncIterator in stream) {
    for await (const chunk of stream) {
      yield chunk;
    }
    return;
  }

  const contents: T[] = [];
  let resolveEnded: (() => void) | undefined;
  const endedPromise = new Promise<void>((resolve) => (resolveEnded = resolve));
  let ended = false;
  let error: any = null;

  stream.on('data', (data: T) => contents.push(data));
  stream.on('end', () => {
    ended = true;
    resolveEnded!();
  });
  stream.on('error', (err: any) => {
    error = err;
    resolveEnded!();
  });

  while (!ended || contents.length > 0) {
    if (contents.length === 0) {
      stream.resume();
      await endedPromise;
    } else {
      stream.pause();
      const data = contents.shift();
      yield data!;
    }
    if (error) throw error;
  }
}
