import { EventEmitter } from 'node:events';
import parseSax from '#src/utils/helpers/parse-sax';
import Enums from '#src/doc/enums';
import RelType from '#src/xlsx/rel-type';

class HyperlinkReader extends EventEmitter {
  workbook: any;
  id: number;
  iterator: any;
  options: any;
  hyperlinks: Record<string, any> | null;

  constructor({ workbook, id, iterator, options }: { workbook?: any; id?: number; iterator?: any; options?: any } = {}) {
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
        break;
    }

    if (!emitHyperlinks && !hyperlinks) {
      this.emit('finished');
      return;
    }

    try {
      for await (const events of parseSax(iterator)) {
        for (const { eventType, value } of events) {
          if (eventType === 'opentag') {
            const node = value;
            if ((node as any).name === 'Relationship') {
              const rId = (node as any).attributes.Id;
              switch ((node as any).attributes.Type) {
                case RelType.Hyperlink:
                  {
                    const relationship = {
                      type: Enums.RelationshipType.Styles,
                      rId,
                      target: (node as any).attributes.Target,
                      targetMode: (node as any).attributes.TargetMode,
                    };
                    if (emitHyperlinks) {
                      this.emit('hyperlink', relationship);
                    } else if (hyperlinks) {
                      hyperlinks[relationship.rId] = relationship;
                    }
                  }
                  break;

                default:
                  break;
              }
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
