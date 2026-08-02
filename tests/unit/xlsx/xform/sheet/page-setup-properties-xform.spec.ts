import testXformHelper from '../test-xform-helper';

import PageSetupPropertiesXform from '#src/xlsx/xform/sheet/page-setup-properties-xform';

const expectations = [
  {
    title: 'fitToPage',
    create() {
      return new PageSetupPropertiesXform();
    },
    preparedModel: { fitToPage: true },
    xml: '<pageSetUpPr fitToPage="1"/>',
    parsedModel: { fitToPage: true },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('PageSetupPropertiesXform', () => {
  testXformHelper(expectations);
});
