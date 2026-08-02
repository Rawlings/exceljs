import _ from '#src/utils/helpers/under-dash';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

export interface PageSetupModel {
  paperSize?: number;
  orientation?: string;
  horizontalDpi?: number;
  verticalDpi?: number;
  pageOrder?: string;
  blackAndWhite?: boolean;
  draft?: boolean;
  cellComments?: string;
  errors?: string;
  scale?: number;
  fitToWidth?: number;
  fitToHeight?: number;
  firstPageNumber?: number;
  useFirstPageNumber?: boolean;
  usePrinterDefaults?: boolean;
  copies?: number;
}

function booleanToXml(model: any) {
  return model ? '1' : undefined;
}
function pageOrderToXml(model: any) {
  switch (model) {
    case 'overThenDown':
      return model;
    default:
      return undefined;
  }
}
function cellCommentsToXml(model: any) {
  switch (model) {
    case 'atEnd':
    case 'asDisplyed':
      return model;
    default:
      return undefined;
  }
}
function errorsToXml(model: any) {
  switch (model) {
    case 'dash':
    case 'blank':
    case 'NA':
      return model;
    default:
      return undefined;
  }
}
function pageSizeToModel(value: any) {
  return value !== undefined ? parseInt(value, 10) : undefined;
}

class PageSetupXform extends BaseXform {
  override get tag() {
    return 'pageSetup';
  }

  override render(xmlStream: XmlStream, model: PageSetupModel | undefined) {
    if (model) {
      const attributes = {
        paperSize: model.paperSize,
        pageOrder: pageOrderToXml(model.pageOrder),
        scale: model.scale,
        fitToWidth: model.fitToWidth,
        fitToHeight: model.fitToHeight,
        orientation: model.orientation,
        horizontalDpi: model.horizontalDpi,
        verticalDpi: model.verticalDpi,
        blackAndWhite: booleanToXml(model.blackAndWhite),
        draft: booleanToXml(model.draft),
        cellComments: cellCommentsToXml(model.cellComments),
        errors: errorsToXml(model.errors),
        firstPageNumber: model.firstPageNumber,
        useFirstPageNumber: booleanToXml(model.firstPageNumber),
        usePrinterDefaults: booleanToXml(model.usePrinterDefaults),
        copies: model.copies,
      };
      if (_.some(attributes, (value: any) => value !== undefined)) {
        xmlStream.leafNode(this.tag as string, attributes);
      }
    }
  }

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case this.tag: {
        const attrs = node.attributes as Record<string, string>;
        this.model = {
          paperSize: pageSizeToModel(attrs.paperSize),
          orientation: attrs.orientation || 'portrait',
          horizontalDpi: parseInt(attrs.horizontalDpi || '4294967295', 10),
          verticalDpi: parseInt(attrs.verticalDpi || '4294967295', 10),
          pageOrder: attrs.pageOrder || 'downThenOver',
          blackAndWhite: attrs.blackAndWhite === '1',
          draft: attrs.draft === '1',
          cellComments: attrs.cellComments || 'None',
          errors: attrs.errors || 'displayed',
          scale: parseInt(attrs.scale || '100', 10),
          fitToWidth: parseInt(attrs.fitToWidth || '1', 10),
          fitToHeight: parseInt(attrs.fitToHeight || '1', 10),
          firstPageNumber: parseInt(attrs.firstPageNumber || '1', 10),
          useFirstPageNumber: attrs.useFirstPageNumber === '1',
          usePrinterDefaults: attrs.usePrinterDefaults === '1',
          copies: parseInt(attrs.copies || '1', 10),
        };
        return true;
      }
      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose() {
    return false;
  }
}

export default PageSetupXform;
