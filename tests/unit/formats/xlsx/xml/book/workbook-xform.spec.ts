import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import WorkbookXform from '#src/formats/xlsx/xml/book/workbook-xform';
import book11 from '#fixtures/json/book.1.1.json' with { type: 'json' };
import book13 from '#fixtures/json/book.1.3.json' with { type: 'json' };
import book23 from '#fixtures/json/book.2.3.json' with { type: 'json' };

function readXml(name: string): string {
  return readFileSync(new URL(`../../../../../fixtures/xml/${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
}

const expectations = [
  {
    title: 'book.1',
    create() {
      return new WorkbookXform();
    },
    preparedModel: book11,
    xml: readXml('book.1.2.xml'),
    parsedModel: book13,
    tests: ['render', 'renderIn', 'parse'],
  },
  {
    title: 'book.2 - no properties',
    create() {
      return new WorkbookXform();
    },
    xml: readXml('book.2.2.xml'),
    parsedModel: book23,
    tests: ['parse'],
  },
];

describe('WorkbookXform', () => {
  testXformHelper(expectations);
});
