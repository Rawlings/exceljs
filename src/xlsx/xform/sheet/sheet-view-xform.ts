import colCache from '../../../utils/col-cache';
import BaseXform from '../base-xform';

const VIEW_STATES: any = {
  frozen: 'frozen',
  frozenSplit: 'frozen',
  split: 'split',
};

class SheetViewXform extends BaseXform {
  sheetView: any;
  selections: any;
  pane: any;

  get tag() {
    return 'sheetView';
  }

  prepare(model: any) {
    switch (model.state) {
      case 'frozen':
      case 'split':
        break;
      default:
        model.state = 'normal';
        break;
    }
  }

  render(xmlStream: any, model: any) {
    xmlStream.openNode('sheetView', {
      workbookViewId: model.workbookViewId || 0,
    });
    const add = function (name: any, value: any, included: any) {
      if (included) {
        xmlStream.addAttribute(name, value);
      }
    };
    add('rightToLeft', '1', model.rightToLeft === true);
    add('tabSelected', '1', model.tabSelected);
    add('showRuler', '0', model.showRuler === false);
    add('showRowColHeaders', '0', model.showRowColHeaders === false);
    add('showGridLines', '0', model.showGridLines === false);
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

  parseOpen(node: any) {
    switch (node.name) {
      case 'sheetView':
        this.sheetView = {
          workbookViewId: parseInt(node.attributes.workbookViewId, 10),
          rightToLeft: node.attributes.rightToLeft === '1',
          tabSelected: node.attributes.tabSelected === '1',
          showRuler: !(node.attributes.showRuler === '0'),
          showRowColHeaders: !(node.attributes.showRowColHeaders === '0'),
          showGridLines: !(node.attributes.showGridLines === '0'),
          zoomScale: parseInt(node.attributes.zoomScale || '100', 10),
          zoomScaleNormal: parseInt(node.attributes.zoomScaleNormal || '100', 10),
          style: node.attributes.view,
        };
        this.pane = undefined;
        this.selections = {};
        return true;

      case 'pane':
        this.pane = {
          xSplit: parseInt(node.attributes.xSplit || '0', 10),
          ySplit: parseInt(node.attributes.ySplit || '0', 10),
          topLeftCell: node.attributes.topLeftCell,
          activePane: node.attributes.activePane || 'topLeft',
          state: node.attributes.state,
        };
        return true;

      case 'selection': {
        const name = node.attributes.pane || 'topLeft';
        this.selections[name] = {
          pane: name,
          activeCell: node.attributes.activeCell,
        };
        return true;
      }

      default:
        return false;
    }
  }

  parseText() {}

  parseClose(name: any) {
    let model: any;
    let selection: any;
    switch (name) {
      case 'sheetView':
        if (this.sheetView && this.pane) {
          const m: any = {
            workbookViewId: this.sheetView.workbookViewId,
            rightToLeft: this.sheetView.rightToLeft,
            state: VIEW_STATES[this.pane.state] || 'split', // split is default
            xSplit: this.pane.xSplit,
            ySplit: this.pane.ySplit,
            topLeftCell: this.pane.topLeftCell,
            showRuler: this.sheetView.showRuler,
            showRowColHeaders: this.sheetView.showRowColHeaders,
            showGridLines: this.sheetView.showGridLines,
            zoomScale: this.sheetView.zoomScale,
            zoomScaleNormal: this.sheetView.zoomScaleNormal,
          };
          model = this.model = m;
          if (this.model.state === 'split') {
            model.activePane = this.pane.activePane;
          }
          selection = this.selections[this.pane.activePane];
          if (selection && selection.activeCell) {
            model.activeCell = selection.activeCell;
          }
          if (this.sheetView.style) {
            model.style = this.sheetView.style;
          }
        } else {
          const m: any = {
            workbookViewId: this.sheetView.workbookViewId,
            rightToLeft: this.sheetView.rightToLeft,
            state: 'normal',
            showRuler: this.sheetView.showRuler,
            showRowColHeaders: this.sheetView.showRowColHeaders,
            showGridLines: this.sheetView.showGridLines,
            zoomScale: this.sheetView.zoomScale,
            zoomScaleNormal: this.sheetView.zoomScaleNormal,
          };
          model = this.model = m;
          selection = this.selections.topLeft;
          if (selection && selection.activeCell) {
            model.activeCell = selection.activeCell;
          }
          if (this.sheetView.style) {
            model.style = this.sheetView.style;
          }
        }
        return false;
      default:
        return true;
    }
  }

  reconcile() {}
}

export default SheetViewXform;
