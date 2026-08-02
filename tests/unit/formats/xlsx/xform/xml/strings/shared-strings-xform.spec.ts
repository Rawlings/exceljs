import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import SharedStringsXform from '../../../../../../../src/formats/xlsx/xml/strings/shared-strings-xform';
import sharedStringsData from '#fixtures/json/sharedStrings.json' with { type: 'json' };

const expectations = [
  {
    title: 'Shared Strings',
    create() {
      return new SharedStringsXform();
    },
    preparedModel: sharedStringsData,
    xml: readFileSync(new URL('../../../../../../../fixtures/xml/sharedStrings.xml', import.meta.url), 'utf8'),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('SharedStringsXform', () => {
  testXformHelper(expectations);
});
