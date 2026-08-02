import fs from 'node:fs';

import testXformHelper from '../test-xform-helper';

import DrawingXform from '#src/xlsx/xform/drawing/drawing-xform';

import drawing10 from './data/drawing.1.0';
import drawing11 from './data/drawing.1.1';
import drawing13 from './data/drawing.1.3';
import drawing14 from './data/drawing.1.4';

const options = {
  rels: {
    rId1: { Target: '../media/image1.jpg' },
    rId2: { Target: '../media/image2.jpg' },
  },
  mediaIndex: { image1: 0, image2: 1 },
  media: [{}, {}],
};

const expectations = [
  {
    title: 'Drawing 1',
    create() {
      return new DrawingXform({ tag: 'xdr:from' });
    },
    initialModel: drawing10,
    preparedModel: drawing11,
    xml: fs.readFileSync(new URL('./data/drawing.1.2.xml', import.meta.url), 'utf8'),
    parsedModel: drawing13,
    reconciledModel: drawing14,
    tests: ['prepare', 'render', 'renderIn', 'parse', 'reconcile'],
    options,
  },
];

describe('DrawingXform', () => {
  testXformHelper(expectations);
});
