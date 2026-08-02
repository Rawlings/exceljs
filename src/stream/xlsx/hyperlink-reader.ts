import { EventEmitter } from 'events';
import parseSax from '#src/utils/parse-sax';

import Enums from '#src/doc/enums';
import RelType from '#src/xlsx/rel-type';

class HyperlinkReader extends EventEmitter {
  workbook: any;
  id: any;
  iterator: any;
  options: any;
  hyperlinks: any;

  constructor({ workbook, id, iterator, options }: any = {}) {
    super();

    this.workbook = workbook;
    this.id = id;
    this.iterator = iterator;
    this.options = options;
  }

  get count() {
    return (this.hyperlinks && this.hyperlinks.length) || 0;
  }

  each(fn: any) {
    return this.hyperlinks.forEach(fn);
  }

  async read() {
    const { iterator, options } = this;
    let emitHyperlinks = false;
    let hyperlinks = null;
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
                    } else {
                      (hyperlinks as Record<string, any>)[relationship.rId] = relationship;
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
