import { PassThrough } from 'stream';

const textDecoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8') : null;

function decodeChunk(chunk: any): string {
  if (typeof chunk === 'string') {
    return chunk;
  }
  if (textDecoder && chunk instanceof Uint8Array) {
    return textDecoder.decode(chunk);
  }
  return chunk.toString();
}

function parseAttributes(attrStr: any) {
  const attributes: Record<string, any> = {};
  const regex = /([a-zA-Z0-9_:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g;
  let match;
  while ((match = regex.exec(attrStr)) !== null) {
    attributes[match[1]] = match[2] !== undefined ? match[2] : match[3];
  }
  return attributes;
}

export default async function* parseSax(iterable: any) {
  if (iterable.pipe && !iterable[Symbol.asyncIterator]) {
    iterable = iterable.pipe(new PassThrough());
  }

  let xml = '';
  for await (const chunk of iterable) {
    xml += decodeChunk(chunk);
    const events = [];
    let pos = 0;

    while (pos < xml.length) {
      const openIdx = xml.indexOf('<', pos);
      if (openIdx === -1) {
        break;
      }

      if (openIdx > pos) {
        const text = xml.slice(pos, openIdx);
        if (text) {
          events.push({ eventType: 'text', value: text });
        }
      }

      const closeIdx = xml.indexOf('>', openIdx);
      if (closeIdx === -1) {
        pos = openIdx;
        break;
      }

      const tagContent = xml.slice(openIdx + 1, closeIdx).trim();
      pos = closeIdx + 1;

      if (!tagContent || tagContent.startsWith('?') || tagContent.startsWith('!')) {
        continue;
      }

      if (tagContent.startsWith('/')) {
        const name = tagContent.slice(1).trim();
        events.push({ eventType: 'closetag', value: { name } });
      } else {
        const isSelfClosing = tagContent.endsWith('/');
        const cleanContent = isSelfClosing ? tagContent.slice(0, -1).trim() : tagContent;
        const spaceIdx = cleanContent.search(/\s/);
        let name;
        let attrStr;
        if (spaceIdx === -1) {
          name = cleanContent;
          attrStr = '';
        } else {
          name = cleanContent.slice(0, spaceIdx);
          attrStr = cleanContent.slice(spaceIdx + 1);
        }
        const attributes = parseAttributes(attrStr);
        events.push({ eventType: 'opentag', value: { name, attributes, isSelfClosing } });
        if (isSelfClosing) {
          events.push({ eventType: 'closetag', value: { name } });
        }
      }
    }

    xml = xml.slice(pos);
    if (events.length > 0) {
      yield events;
    }
  }
}
