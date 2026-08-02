import BaseXform from '../base-xform';
import colCache from '../../../../utils/data/col-cache';
import type XmlStream from '../../../../utils/stream/xml-stream';
import type { SaxNode } from '../base-xform';

export interface DefinedNameModel {
  name: string;
  ranges: string[];
  localSheetId?: number;
}

class DefinedNamesXform extends BaseXform {
  _parsedName: string | undefined;
  _parsedLocalSheetId: string | undefined;
  _parsedText: string[] | undefined;

  override render(xmlStream: XmlStream, model: DefinedNameModel) {
    // <definedNames>
    //   <definedName name="name">name.ranges.join(',')</definedName>
    //   <definedName name="_xlnm.Print_Area" localSheetId="0">name.ranges.join(',')</definedName>
    // </definedNames>
    xmlStream.openNode('definedName', {
      name: model.name,
      localSheetId: model.localSheetId,
    });
    xmlStream.writeText(model.ranges.join(','));
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode) {
    switch (node.name) {
      case 'definedName': {
        const attrs = node.attributes as Record<string, string>;
        this._parsedName = attrs.name;
        this._parsedLocalSheetId = attrs.localSheetId;
        this._parsedText = [];
        return true;
      }
      default:
        return false;
    }
  }

  override parseText(text: string) {
    (this._parsedText as string[]).push(text);
  }

  override parseClose() {
    const model: DefinedNameModel = {
      name: this._parsedName as string,
      ranges: extractRanges((this._parsedText as string[]).join('')),
    };
    if (this._parsedLocalSheetId !== undefined) {
      model.localSheetId = parseInt(this._parsedLocalSheetId, 10);
    }
    this.model = model;
    return false;
  }
}

function isValidRange(range: string): boolean {
  if (/\$?\d+:\$?\d+/.test(range) || /\$?[A-Z]+:\$?[A-Z]+/.test(range)) {
    return true;
  }
  try {
    colCache.decodeEx(range);
    return true;
  } catch {
    return false;
  }
}

function extractRanges(parsedText: string): string[] {
  const ranges: string[] = [];
  let quotesOpened = false;
  let last = '';
  parsedText.split(',').forEach((item) => {
    if (!item) {
      return;
    }
    const quotes = (item.match(/'/g) || []).length;

    if (!quotes) {
      if (quotesOpened) {
        last += `${item},`;
      } else if (isValidRange(item)) {
        ranges.push(item);
      }
      return;
    }
    const quotesEven = quotes % 2 === 0;

    if (!quotesOpened && quotesEven && isValidRange(item)) {
      ranges.push(item);
    } else if (quotesOpened && !quotesEven) {
      quotesOpened = false;
      if (isValidRange(last + item)) {
        ranges.push(last + item);
      }
      last = '';
    } else {
      quotesOpened = true;
      last += `${item},`;
    }
  });
  return ranges;
}

export default DefinedNamesXform;
