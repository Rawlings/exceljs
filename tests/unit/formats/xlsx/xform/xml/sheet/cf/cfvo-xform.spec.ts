import testXformHelper from '../../test-xform-helper';

import CfvoXform from '../../../../../../../../src/formats/xlsx/xml/sheet/cf/cfvo-xform';

const expectations = [
  {
    title: 'min',
    create() {
      return new CfvoXform();
    },
    preparedModel: { type: 'min' },
    xml: '<cfvo type="min" />',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'parse'],
  },
  {
    title: 'percent',
    create() {
      return new CfvoXform();
    },
    preparedModel: { type: 'percent', value: 12.5 },
    xml: '<cfvo type="percent" val="12.5" />',
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'parse'],
  },
];

describe('CfvoXform', () => {
  testXformHelper(expectations);
});
