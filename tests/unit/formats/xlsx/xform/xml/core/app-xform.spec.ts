import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import AppXform from '../../../../../../../src/formats/xlsx/xml/core/app-xform';

const expectations = [
  {
    title: 'app.01',
    create() {
      return new AppXform();
    },
    preparedModel: { worksheets: [{ name: 'Sheet1' }] },
    xml: readFileSync(new URL('../../../../../../../fixtures/xml/app.01.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n'),
    tests: ['render', 'renderIn'],
  },
  {
    title: 'app.02',
    create() {
      return new AppXform();
    },
    preparedModel: {
      worksheets: [{ name: 'Sheet1' }, { name: 'Sheet2' }],
      company: 'Cyber Sapiens, Ltd.',
      manager: 'Guyon Roche',
    },
    xml: readFileSync(new URL('../../../../../../../fixtures/xml/app.02.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n'),
    tests: ['render', 'renderIn'],
  },
];

describe('AppXform', () => {
  testXformHelper(expectations);
});
