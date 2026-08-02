/* eslint-disable max-classes-per-file */
import utils from '../utils/helpers/utils';
import RelType from '../formats/xlsx/rel-type';

interface HyperlinkEntry {
  target: string;
  address: string;
}

interface StoredHyperlink {
  rId: string;
  address: string;
}

interface WriterStream {
  write(text: string): void;
  end(): void;
}

export interface RelsWorkbook {
  _openStream(path: string): WriterStream;
}

class HyperlinksProxy {
  writer: SheetRelsWriter;

  constructor(sheetRelsWriter: SheetRelsWriter) {
    this.writer = sheetRelsWriter;
  }

  push(hyperlink: HyperlinkEntry): void {
    this.writer.addHyperlink(hyperlink);
  }
}

class SheetRelsWriter {
  id: number;
  count: number;
  _hyperlinks: StoredHyperlink[];
  _workbook: RelsWorkbook;
  _stream: WriterStream | undefined;
  _hyperlinksProxy?: HyperlinksProxy;

  constructor(options: { id: number; workbook: RelsWorkbook }) {
    this.id = options.id;
    this.count = 0;
    this._hyperlinks = [];
    this._workbook = options.workbook;
  }

  get stream(): WriterStream {
    if (!this._stream) {
      this._stream = this._workbook._openStream(`xl/worksheets/_rels/sheet${this.id}.xml.rels`);
    }
    return this._stream;
  }

  get length(): number {
    return this._hyperlinks.length;
  }

  each(fn: (item: StoredHyperlink) => void): void {
    return this._hyperlinks.forEach(fn);
  }

  get hyperlinksProxy(): HyperlinksProxy {
    return this._hyperlinksProxy || (this._hyperlinksProxy = new HyperlinksProxy(this));
  }

  addHyperlink(hyperlink: { target: string; address: string }): void {
    const relationship = {
      Target: hyperlink.target,
      Type: RelType.Hyperlink,
      TargetMode: 'External',
    };
    const rId = this._writeRelationship(relationship);

    this._hyperlinks.push({
      rId,
      address: hyperlink.address,
    });
  }

  addMedia(media: { Type: string; Target: string; TargetMode?: string }): string {
    return this._writeRelationship(media);
  }

  addRelationship(rel: { Type: string; Target: string; TargetMode?: string }): string {
    return this._writeRelationship(rel);
  }

  commit(): void {
    if (this.count) {
      this._writeClose();
      this.stream.end();
    }
  }

  private _writeOpen(): void {
    this.stream.write(
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">`
    );
  }

  private _writeRelationship(relationship: {
    Type: string;
    Target: string;
    TargetMode?: string;
  }): string {
    if (!this.count) {
      this._writeOpen();
    }

    const rId = `rId${++this.count}`;

    if (relationship.TargetMode) {
      this.stream.write(
        `<Relationship Id="${rId}"` +
          ` Type="${relationship.Type}"` +
          ` Target="${utils.xmlEncode(relationship.Target)}"` +
          ` TargetMode="${relationship.TargetMode}"` +
          '/>'
      );
    } else {
      this.stream.write(
        `<Relationship Id="${rId}" Type="${relationship.Type}" Target="${relationship.Target}"/>`
      );
    }

    return rId;
  }

  private _writeClose(): void {
    this.stream.write('</Relationships>');
  }
}

export default SheetRelsWriter;
