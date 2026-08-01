import { once } from 'node:events';

export default async function* iterateStream(stream: any) {
  const contents: any[] = [];
  stream.on('data', (data: any) => contents.push(data));

  let resolveStreamEndedPromise: (() => void) | undefined;
  const streamEndedPromise = new Promise<void>((resolve) => (resolveStreamEndedPromise = resolve));

  let ended = false;
  stream.on('end', () => {
    ended = true;
    resolveStreamEndedPromise!();
  });

  let error: any = false;
  stream.on('error', (err: any) => {
    error = err;
    resolveStreamEndedPromise!();
  });

  while (!ended || contents.length > 0) {
    if (contents.length === 0) {
      stream.resume();
      // eslint-disable-next-line no-await-in-loop
      await Promise.race([once(stream, 'data'), streamEndedPromise]);
    } else {
      stream.pause();
      const data = contents.shift();
      yield data;
    }
    if (error) throw error;
  }
  resolveStreamEndedPromise!();
}
