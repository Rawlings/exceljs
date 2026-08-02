import { XMLParser } from 'fast-xml-parser';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OpenTagEvent {
  eventType: 'opentag';
  value: { name: string; attributes: Record<string, string> };
}

interface TextEvent {
  eventType: 'text';
  value: string;
}

interface CloseTagEvent {
  eventType: 'closetag';
  value: { name: string };
}

type SaxEvent = OpenTagEvent | TextEvent | CloseTagEvent;

// ---------------------------------------------------------------------------
// Chunk collection
// ---------------------------------------------------------------------------

const textDecoder = new TextDecoder('utf-8');

function decodeChunk(chunk: unknown): string {
  if (typeof chunk === 'string') return chunk;
  if (chunk instanceof Uint8Array) return textDecoder.decode(chunk);
  return String(chunk);
}

interface SaxStreamLike {
  on(event: string, cb: (...args: unknown[]) => void): void;
  removeListener(event: string, cb: (...args: unknown[]) => void): void;
  read?(): unknown;
  resume?(): void;
  readableEnded?: boolean;
  _readableState?: { ended?: boolean };
}

async function readAllChunks(
  iterableInput: SaxStreamLike | AsyncIterable<unknown>
): Promise<string> {
  if (typeof (iterableInput as SaxStreamLike).on !== 'function') {
    // Async iterable (not a Node.js EventEmitter stream)
    const parts: string[] = [];
    for await (const chunk of iterableInput as AsyncIterable<unknown>) {
      parts.push(decodeChunk(chunk));
    }
    return parts.join('');
  }

  const iterable = iterableInput as SaxStreamLike;
  const chunks: string[] = [];

  if (typeof iterable.read === 'function') {
    let chunk: unknown;
    while ((chunk = iterable.read()) !== null) {
      chunks.push(decodeChunk(chunk));
    }
  }

  const state = iterable._readableState;
  if (state?.ended || iterable.readableEnded) {
    return chunks.join('');
  }

  // Live stream — collect via event listeners.
  return new Promise<string>((resolve, reject) => {
    const onData = (chunk: unknown) => chunks.push(decodeChunk(chunk));
    const onEnd = () => {
      cleanup();
      resolve(chunks.join(''));
    };
    const onError = (err: unknown) => {
      cleanup();
      reject(err);
    };
    const cleanup = () => {
      iterable.removeListener('data', onData);
      iterable.removeListener('end', onEnd);
      iterable.removeListener('error', onError);
    };

    iterable.on('data', onData);
    iterable.on('end', onEnd);
    iterable.on('error', onError);
    if (typeof iterable.resume === 'function') iterable.resume();
  });
}

// ---------------------------------------------------------------------------
// XML parser (shared instance — XMLParser is stateless after construction)
// ---------------------------------------------------------------------------

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false, // keep all attribute values as raw strings
  htmlEntities: true,
  trimValues: false,
  parseTagValue: false,
  preserveOrder: true, // returns an ordered array of nodes, perfect for SAX-style walk
  processEntities: true,
});

// ---------------------------------------------------------------------------
// Tree → SAX event walk
// ---------------------------------------------------------------------------

// Nodes to skip entirely (XML declaration, processing instructions, comments, CDATA wrappers)
const SKIP_PREFIXES = ['?', '!'];

type XmlNode = Record<string, unknown>;

function* walkNodes(nodes: XmlNode[]): Generator<SaxEvent> {
  for (const node of nodes) {
    const nodeKeys = Object.keys(node);

    // Text node: { '#text': '...' }
    if (nodeKeys.length === 1 && nodeKeys[0] === '#text') {
      const text = String(node['#text']);
      if (text) {
        yield { eventType: 'text', value: text };
      }
      continue;
    }

    // Find the element tag name (everything except the attributes key ':@')
    const tagName = nodeKeys.find((k) => k !== ':@');
    if (!tagName) continue;

    // Skip XML declarations, processing instructions, comments
    if (SKIP_PREFIXES.some((p) => tagName.startsWith(p))) continue;

    const attributes: Record<string, string> = (node[':@'] as Record<string, string>) ?? {};
    const children: XmlNode[] = (node[tagName] as XmlNode[]) ?? [];

    yield { eventType: 'opentag', value: { name: tagName, attributes } };
    yield* walkNodes(children);
    yield { eventType: 'closetag', value: { name: tagName } };
  }
}

// ---------------------------------------------------------------------------
// Public API — drop-in replacement for the old hand-rolled parseSax
// ---------------------------------------------------------------------------

export default async function* parseSax(
  iterable: string | SaxStreamLike | AsyncIterable<unknown>
): AsyncGenerator<SaxEvent[]> {
  const xml = typeof iterable === 'string' ? iterable : await readAllChunks(iterable);
  if (!xml) return;

  const tree = xmlParser.parse(xml);
  const events = Array.from(walkNodes(tree));
  if (events.length > 0) {
    yield events;
  }
}
