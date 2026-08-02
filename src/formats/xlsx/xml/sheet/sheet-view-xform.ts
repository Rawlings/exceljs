import colCache from '#src/utils/data/col-cache';
import BaseXform from '#src/formats/xlsx/xml/base-xform';
import type XmlStream from '#src/utils/stream/xml-stream';
import type { SaxNode } from '#src/formats/xlsx/xml/base-xform';

const VIEW_STATES: Record<string, string> = {
  frozen: 'frozen',
  frozenSplit: 'frozen',
  split: 'split',
};

export interface SheetViewModel {
  workbookViewId?: number;
  rightToLeft?: boolean;
  tabSelected?: boolean;
  showRuler?: boolean;
  showGridLines?: boolean;
  showRowColHeaders?: boolean;
  zoomScale?: number;
  zoomScaleNormal?: number;
  style?: string;
  state?: string;
  xSplit?: number;
  ySplit?: number;
  topLeftCell?: string;
  activePane?: string;
  activeCell?: string;
}

interface PaneState {
  xSplit: number;
  ySplit: number;
  topLeftCell?: string;
  activePane: string;
  state?: string;
}

interface SelectionState {
  pane: string;
  activeCell?: string;
}

class SheetViewXform extends BaseXform {
  sheetView: SheetViewModel | undefined;
  selections: Record<string, SelectionState> | undefined;
  pane: PaneState | undefined;

  override get tag() {
    return 'sheetView';
  }

  override prepare(model: SheetViewModel) {
    switch (model.state) {
      case 'frozen':
      case 'split':
        break;
      default:
        model.state = 'normal';
        break;
    }
  }

  override render(xmlStream: XmlStream, model: SheetViewModel) {
    xmlStream.openNode('sheetView', {
      workbookViewId: model.workbookViewId || 0,
    });
    const add = function (name: string, value: unknown, included: unknown) {
      if (included) {
        xmlStream.addAttribute(name, value);
      }
    };
    add('rightToLeft', '1', model.rightToLeft === true);
    add('tabSelected', '1', model.tabSelected);
    add('showRuler', '0', model.showRuler === false);
    add('showGridLines', '0', model.showGridLines === false);
    add('showRowColHeaders', '0', model.showRowColHeaders === false);
    add('zoomScale', model.zoomScale, model.zoomScale);
    add('zoomScaleNormal', model.zoomScaleNormal, model.zoomScaleNormal);
    add('view', model.style, model.style);

    let topLeftCell;
    let xSplit;
    let ySplit;
    let activePane;
    switch (model.state) {
      case 'frozen':
        xSplit = model.xSplit || 0;
        ySplit = model.ySplit || 0;
        topLeftCell = model.topLeftCell || colCache.getAddress(ySplit + 1, xSplit + 1).address;
        activePane =
          (model.xSplit && model.ySplit && 'bottomRight') ||
          (model.xSplit && 'topRight') ||
          'bottomLeft';

        xmlStream.leafNode('pane', {
          xSplit: model.xSplit || undefined,
          ySplit: model.ySplit || undefined,
          topLeftCell,
          activePane,
          state: 'frozen',
        });
        xmlStream.leafNode('selection', {
          pane: activePane,
          activeCell: model.activeCell,
          sqref: model.activeCell,
        });
        break;
      case 'split':
        if (model.activePane === 'topLeft') {
          model.activePane = undefined;
        }
        xmlStream.leafNode('pane', {
          xSplit: model.xSplit || undefined,
          ySplit: model.ySplit || undefined,
          topLeftCell: model.topLeftCell,
          activePane: model.activePane,
        });
        xmlStream.leafNode('selection', {
          pane: model.activePane,
          activeCell: model.activeCell,
          sqref: model.activeCell,
        });
        break;
      case 'normal':
        if (model.activeCell) {
          xmlStream.leafNode('selection', {
            activeCell: model.activeCell,
            sqref: model.activeCell,
          });
        }
        break;
      default:
        break;
    }
    xmlStream.closeNode();
  }

  override parseOpen(node: SaxNode): boolean {
    switch (node.name) {
      case 'sheetView': {
        const attrs = node.attributes as Record<string, string>;
        this.sheetView = {
          workbookViewId: parseInt(attrs.workbookViewId, 10),
          rightToLeft: attrs.rightToLeft === '1',
          tabSelected: attrs.tabSelected === '1',
          showRuler: !(attrs.showRuler === '0'),
          showRowColHeaders: !(attrs.showRowColHeaders === '0'),
          showGridLines: !(attrs.showGridLines === '0'),
          zoomScale: parseInt(attrs.zoomScale || '100', 10),
          zoomScaleNormal: parseInt(attrs.zoomScaleNormal || '100', 10),
          style: attrs.view,
        };
        this.pane = undefined;
        this.selections = {};
        return true;
      }

      case 'pane': {
        const attrs = node.attributes as Record<string, string>;
        this.pane = {
          xSplit: parseInt(attrs.xSplit || '0', 10),
          ySplit: parseInt(attrs.ySplit || '0', 10),
          topLeftCell: attrs.topLeftCell,
          activePane: attrs.activePane || 'topLeft',
          state: attrs.state,
        };
        return true;
      }

      case 'selection': {
        const attrs = node.attributes as Record<string, string>;
        const name = attrs.pane || 'topLeft';
        (this.selections as Record<string, SelectionState>)[name] = {
          pane: name,
          activeCell: attrs.activeCell,
        };
        return true;
      }

      default:
        return false;
    }
  }

  override parseText() {}

  override parseClose(name: string): boolean {
    switch (name) {
      case 'sheetView': {
        const sheetView = this.sheetView as SheetViewModel;
        let model: SheetViewModel;
        let selection: SelectionState | undefined;
        if (sheetView && this.pane) {
          model = this.model = {
            workbookViewId: sheetView.workbookViewId,
            rightToLeft: sheetView.rightToLeft,
            state: VIEW_STATES[this.pane.state as string] || 'split', // split is default
            xSplit: this.pane.xSplit,
            ySplit: this.pane.ySplit,
            topLeftCell: this.pane.topLeftCell,
            showRuler: sheetView.showRuler,
            showRowColHeaders: sheetView.showRowColHeaders,
            showGridLines: sheetView.showGridLines,
            zoomScale: sheetView.zoomScale,
            zoomScaleNormal: sheetView.zoomScaleNormal,
          };
          if (model.state === 'split') {
            model.activePane = this.pane.activePane;
          }
          selection = (this.selections as Record<string, SelectionState>)[this.pane.activePane];
          if (selection && selection.activeCell) {
            model.activeCell = selection.activeCell;
          }
          if (sheetView.style) {
            model.style = sheetView.style;
          }
        } else {
          model = this.model = {
            workbookViewId: sheetView.workbookViewId,
            rightToLeft: sheetView.rightToLeft,
            state: 'normal',
            showRuler: sheetView.showRuler,
            showRowColHeaders: sheetView.showRowColHeaders,
            showGridLines: sheetView.showGridLines,
            zoomScale: sheetView.zoomScale,
            zoomScaleNormal: sheetView.zoomScaleNormal,
          };
          selection = (this.selections as Record<string, SelectionState>).topLeft;
          if (selection && selection.activeCell) {
            model.activeCell = selection.activeCell;
          }
          if (sheetView.style) {
            model.style = sheetView.style;
          }
        }
        return false;
      }
      default:
        return true;
    }
  }

  reconcile() {}
}

export default SheetViewXform;
