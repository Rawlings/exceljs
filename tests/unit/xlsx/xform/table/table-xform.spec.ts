import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import TableXform from '#src/xlsx/xform/table/table-xform';
import table11 from '#fixtures/json/table.1.1.json' with { type: 'json' };
import table13 from '#fixtures/json/table.1.3.json' with { type: 'json' };

function readXml(name: string): string {
  return readFileSync(new URL(`../../../../../fixtures/xml/${name}`, import.meta.url), 'utf8');
}

const expectations = [
  {
    title: 'showing filter',
    create() {
      return new TableXform();
    },
    initialModel: null,
    preparedModel: table11,
    xml: readXml('table.1.2.xml'),
    parsedModel: table13,
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('TableXform', () => {
  testXformHelper(expectations);
});
