import { EventEmitter } from 'node:events';
import { XMLParser } from 'fast-xml-parser';
import * as Enums from '../core/enums';
import { RelType } from '../formats/xlsx/rel-type';

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

const textDecoder = new TextDecoder('utf-8');

function decodeChunk(chunk: unknown): string {
  if (typeof chunk === 'string') return chunk;
  if (chunk instanceof Uint8Array) return textDecoder.decode(chunk);
  if (Buffer.isBuffer(chunk)) return textDecoder.decode(chunk);
  return String(chunk);
}

// Shared parser for relationships XML (xl/worksheets/_rels/sheetN.xml.rels)
const relsParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  htmlEntities: true,
  trimValues: false,
  parseTagValue: false,
  isArray: (name: string) => name === 'Relationship',
});

// ---------------------------------------------------------------------------
// HyperlinkReader
// ---------------------------------------------------------------------------

interface HyperlinkRelationship {
  type: number;
  rId: string;
  target: string;
  targetMode: string;
}

export interface HyperlinkReaderOptions {
  workbook?: unknown;
  id?: number | string;
  iterator?: AsyncIterable<unknown>;
  options?: { hyperlinks?: string; [key: string]: unknown };
}

interface RawRel {
  Id?: string;
  Type?: string;
  Target?: string;
  TargetMode?: string;
}

interface RawDoc {
  Relationships?: {
    Relationship?: RawRel[];
  };
}

function isRawDoc(obj: unknown): obj is RawDoc {
  return typeof obj === 'object' && obj !== null && 'Relationships' in obj;
}

class HyperlinkReader extends EventEmitter {
  workbook: unknown;
  id: number | string;
  iterator: AsyncIterable<unknown>;
  options: { hyperlinks?: string; [key: string]: unknown };
  hyperlinks: Record<string, HyperlinkRelationship> | null;

  constructor({ workbook, id, iterator, options }: HyperlinkReaderOptions = {}) {
    super();
    this.workbook = workbook;
    this.id = id ?? 0;
    this.iterator = iterator ?? (async function* () {})();
    this.options = options ?? {};
    this.hyperlinks = null;
  }

  get count() {
    return (this.hyperlinks && Object.keys(this.hyperlinks).length) ?? 0;
  }

  each(fn: (hyperlink: HyperlinkRelationship, rId: string) => void): void {
    if (this.hyperlinks) {
      Object.entries(this.hyperlinks).forEach(([rId, hl]) => fn(hl, rId));
    }
  }

  async read(): Promise<void> {
    const { iterator, options } = this;
    let emitHyperlinks = false;
    let hyperlinks: Record<string, HyperlinkRelationship> | null = null;

    switch (options.hyperlinks) {
      case 'emit':
        emitHyperlinks = true;
        break;
      case 'cache':
        this.hyperlinks = hyperlinks = {};
        break;
      case undefined:
      default:
        this.emit('finished');
        return;
    }

    // Collect raw XML from the .rels stream
    const parts: string[] = [];
    for await (const chunk of iterator) {
      parts.push(decodeChunk(chunk));
    }
    const xml = parts.join('');

    if (!xml) {
      this.emit('finished');
      return;
    }

    try {
      const parsed: unknown = relsParser.parse(xml);
      if (isRawDoc(parsed)) {
        const relationships = parsed.Relationships;

        if (relationships && Array.isArray(relationships.Relationship)) {
          for (const rel of relationships.Relationship) {
            if (rel.Type === RelType.Hyperlink) {
              const relationship: HyperlinkRelationship = {
                type: Enums.RelationshipType.Styles,
                rId: typeof rel.Id === 'string' ? rel.Id : '',
                target: typeof rel.Target === 'string' ? rel.Target : '',
                targetMode: typeof rel.TargetMode === 'string' ? rel.TargetMode : '',
              };
              if (emitHyperlinks) {
                this.emit('hyperlink', relationship);
              } else if (hyperlinks) {
                hyperlinks[relationship.rId] = relationship;
              }
            }
          }
        }
      }

      this.emit('finished');
    } catch (error) {
      this.emit('error', error);
    }
  }
}

export default HyperlinkReader;
