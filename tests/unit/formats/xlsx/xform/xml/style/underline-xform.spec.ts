import testXformHelper from '../test-xform-helper';

import UnderlineXform from '../../../../../../../src/formats/xlsx/xml/style/underline-xform';

const expectations = [
  {
    title: 'single',
    create() {
      return new UnderlineXform();
    },
    preparedModel: true,
    get parsedModel() {
      return this.preparedModel;
    },
    xml: '<u/>',
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'double',
    create() {
      return new UnderlineXform();
    },
    preparedModel: 'double',
    get parsedModel() {
      return this.preparedModel;
    },
    xml: '<u val="double"/>',
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'false',
    create() {
      return new UnderlineXform();
    },
    preparedModel: false,
    get parsedModel() {
      return this.preparedModel;
    },
    xml: '',
    tests: ['render', 'renderIn'],
  },
];

describe('UnderlineXform', () => {
  testXformHelper(expectations);
});
