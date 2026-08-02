const fs = require('fs');

import testXformHelper from '../test-xform-helper';

import AppXform from '#src/xlsx/xform/core/app-xform';

const expectations = [
  {
    title: 'app.01',
    create() {
      return new AppXform();
    },
    preparedModel: { worksheets: [{ name: 'Sheet1' }] },
    xml: fs.readFileSync(`${__dirname}/data/app.01.xml`).toString().replace(/\r\n/g, '\n'),
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
    xml: fs.readFileSync(`${__dirname}/data/app.02.xml`).toString().replace(/\r\n/g, '\n'),
    tests: ['render', 'renderIn'],
  },
];

describe('AppXform', () => {
  testXformHelper(expectations);
});
