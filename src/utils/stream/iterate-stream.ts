interface NodeStreamLike {
  on(event: 'data' | 'end' | 'error', cb: (...args: unknown[]) => void): void;
  resume(): void;
  pause(): void;
  [Symbol.asyncIterator]?: unknown;
}

export default async function* iterateStream<T = unknown>(
  stream: NodeStreamLike | AsyncIterable<T>
): AsyncGenerator<T> {
  if (Symbol.asyncIterator in stream) {
    for await (const chunk of stream as AsyncIterable<T>) {
      yield chunk;
    }
    return;
  }

  const contents: T[] = [];
  let resolveEnded: (() => void) | undefined;
  const endedPromise = new Promise<void>((resolve) => (resolveEnded = resolve));
  let ended = false;
  let error: unknown = null;

  stream.on('data', (data: unknown) => contents.push(data as T));
  stream.on('end', () => {
    ended = true;
    resolveEnded!();
  });
  stream.on('error', (err: unknown) => {
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
