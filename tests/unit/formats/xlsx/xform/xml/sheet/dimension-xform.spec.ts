import testXformHelper from '../test-xform-helper';

import DimensionXform from '../../../../../../../src/formats/xlsx/xml/sheet/dimension-xform';

const expectations = [
  {
    title: 'Dimension',
    create() {
      return new DimensionXform();
    },
    preparedModel: 'A1:F5',
    get parsedModel() {
      return this.preparedModel;
    },
    xml: '<dimension ref="A1:F5"/>',
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('DimensionXform', () => {
  testXformHelper(expectations);
});
