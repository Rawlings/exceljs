import { EventEmitter } from 'node:events';
import { XMLParser } from 'fast-xml-parser';
import Enums from '#src/models/enums';
import RelType from '#src/xlsx/rel-type';

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

class HyperlinkReader extends EventEmitter {
  workbook: any;
  id: number;
  iterator: any;
  options: any;
  hyperlinks: Record<string, any> | null;

  constructor({
    workbook,
    id,
    iterator,
    options,
  }: { workbook?: any; id?: number; iterator?: any; options?: any } = {}) {
    super();
    this.workbook = workbook;
    this.id = id || 0;
    this.iterator = iterator;
    this.options = options || {};
    this.hyperlinks = null;
  }

  get count(): number {
    return (this.hyperlinks && Object.keys(this.hyperlinks).length) || 0;
  }

  each(fn: (hyperlink: any, rId: string) => void): void {
    if (this.hyperlinks) {
      Object.entries(this.hyperlinks).forEach(([rId, hl]) => fn(hl, rId));
    }
  }

  async read(): Promise<void> {
    const { iterator, options } = this;
    let emitHyperlinks = false;
    let hyperlinks: Record<string, any> | null = null;

    switch (options.hyperlinks) {
      case 'emit':
        emitHyperlinks = true;
        break;
      case 'cache':
        this.hyperlinks = hyperlinks = {};
        break;
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
      const doc = relsParser.parse(xml);
      const relationships = doc.Relationships;

      if (relationships?.Relationship) {
        for (const rel of relationships.Relationship as any[]) {
          if (rel.Type === RelType.Hyperlink) {
            const relationship = {
              type: Enums.RelationshipType.Styles,
              rId: rel.Id,
              target: rel.Target,
              targetMode: rel.TargetMode,
            };
            if (emitHyperlinks) {
              this.emit('hyperlink', relationship);
            } else if (hyperlinks) {
              hyperlinks[relationship.rId] = relationship;
            }
          }
        }
      }

      this.emit('finished');
    } catch (error: any) {
      this.emit('error', error);
    }
  }
}

export default HyperlinkReader;
