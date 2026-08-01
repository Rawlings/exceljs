const fs = require('fs');

import testXformHelper from '../test-xform-helper';

import TableXform from '../../../../../src/xlsx/xform/table/table-xform';

const expectations = [
  {
    title: 'showing filter',
    create() {
      return new TableXform();
    },
    initialModel: null,
    preparedModel: require('./data/table.1.1'),
    xml: fs.readFileSync(`${__dirname}/data/table.1.2.xml`).toString(),
    parsedModel: require('./data/table.1.3'),
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('TableXform', () => {
  testXformHelper(expectations);
});
