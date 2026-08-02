import testXformHelper from '../test-xform-helper';

import WorkbookCalcPropertiesXform from '../../../../../../../src/formats/xlsx/xml/book/workbook-calc-properties-xform';

const expectations = [
  {
    title: 'default',
    create() {
      return new WorkbookCalcPropertiesXform();
    },
    preparedModel: {},
    xml: '<calcPr calcId="171027"/>',
    parsedModel: {},
    tests: ['render', 'renderIn'],
  },
  {
    title: 'fullCalcOnLoad',
    create() {
      return new WorkbookCalcPropertiesXform();
    },
    preparedModel: { fullCalcOnLoad: true },
    xml: '<calcPr calcId="171027" fullCalcOnLoad="1"/>',
    parsedModel: { fullCalcOnLoad: true },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('WorkbookCalcPropertiesXform', () => {
  testXformHelper(expectations);
});
