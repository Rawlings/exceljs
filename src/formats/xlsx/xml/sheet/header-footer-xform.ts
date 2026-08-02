import utils from '#src/utils/helpers/utils';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface HeaderFooterModel {
  differentFirst?: boolean;
  differentOddEven?: boolean;
  oddHeader?: string;
  oddFooter?: string;
  evenHeader?: string;
  evenFooter?: string;
  firstHeader?: string;
  firstFooter?: string;
}

type NodeName =
  | 'oddHeader'
  | 'oddFooter'
  | 'evenHeader'
  | 'evenFooter'
  | 'firstHeader'
  | 'firstFooter';

class HeaderFooterXform extends BaseXform {
  currentNode: NodeName | undefined;

  override get tag() {
    return 'headerFooter';
  }

  override render(xmlStream: XmlStream, model: HeaderFooterModel | undefined) {
    if (model) {
      xmlStream.addRollback();

      let createTag = false;

      xmlStream.openNode('headerFooter');
      if (model.differentFirst) {
        xmlStream.addAttribute('differentFirst', '1');
        createTag = true;
      }
      if (model.differentOddEven) {
        xmlStream.addAttribute('differentOddEven', '1');
        createTag = true;
      }
      if (model.oddHeader && typeof model.oddHeader === 'string') {
        xmlStream.leafNode('oddHeader', undefined, model.oddHeader);
        createTag = true;
      }
      if (model.oddFooter && typeof model.oddFooter === 'string') {
        xmlStream.leafNode('oddFooter', undefined, model.oddFooter);
        createTag = true;
      }
      if (model.evenHeader && typeof model.evenHeader === 'string') {
        xmlStream.leafNode('evenHeader', undefined, model.evenHeader);
        createTag = true;
      }
      if (model.evenFooter && typeof model.evenFooter === 'string') {
        xmlStream.leafNode('evenFooter', undefined, model.evenFooter);
        createTag = true;
      }
      if (model.firstHeader && typeof model.firstHeader === 'string') {
        xmlStream.leafNode('firstHeader', undefined, model.firstHeader);
        createTag = true;
      }
      if (model.firstFooter && typeof model.firstFooter === 'string') {
        xmlStream.leafNode('firstFooter', undefined, model.firstFooter);
        createTag = true;
      }

      if (createTag) {
        xmlStream.closeNode();
        xmlStream.commit();
      } else {
        xmlStream.rollback();
      }
    }
  }

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case 'headerFooter': {
        const attrs = node.attributes as Record<string, string>;
        const model: HeaderFooterModel = {};
        if (attrs.differentFirst) {
          model.differentFirst = parseInt(attrs.differentFirst, 0) === 1;
        }
        if (attrs.differentOddEven) {
          model.differentOddEven = parseInt(attrs.differentOddEven, 0) === 1;
        }
        this.model = model;
        return true;
      }

      case 'oddHeader':
        this.currentNode = 'oddHeader';
        return true;

      case 'oddFooter':
        this.currentNode = 'oddFooter';
        return true;

      case 'evenHeader':
        this.currentNode = 'evenHeader';
        return true;

      case 'evenFooter':
        this.currentNode = 'evenFooter';
        return true;

      case 'firstHeader':
        this.currentNode = 'firstHeader';
        return true;

      case 'firstFooter':
        this.currentNode = 'firstFooter';
        return true;

      default:
        return false;
    }
  }

  override parseText(text: string) {
    const decoded = utils.xmlDecode(text);
    const model = this.model as HeaderFooterModel;
    switch (this.currentNode) {
      case 'oddHeader':
        model.oddHeader = decoded;
        break;

      case 'oddFooter':
        model.oddFooter = decoded;
        break;

      case 'evenHeader':
        model.evenHeader = decoded;
        break;

      case 'evenFooter':
        model.evenFooter = decoded;
        break;

      case 'firstHeader':
        model.firstHeader = decoded;
        break;

      case 'firstFooter':
        model.firstFooter = decoded;
        break;

      default:
        break;
    }
  }

  override parseClose(): boolean {
    switch (this.currentNode) {
      case 'oddHeader':
      case 'oddFooter':
      case 'evenHeader':
      case 'evenFooter':
      case 'firstHeader':
      case 'firstFooter':
        this.currentNode = undefined;
        return true;

      default:
        return false;
    }
  }
}

export default HeaderFooterXform;
