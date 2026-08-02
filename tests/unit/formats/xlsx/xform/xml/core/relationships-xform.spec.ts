import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import RelationshipsXform from '../../../../../../../src/formats/xlsx/xml/core/relationships-xform';
import worksheetRels1 from '#fixtures/json/worksheet.rels.1.json' with { type: 'json' };

const expectations = [
  {
    title: 'worksheet.rels',
    create() {
      return new RelationshipsXform();
    },
    preparedModel: worksheetRels1,
    xml: readFileSync(new URL('../../../../../fixtures/xml/worksheet.rels.xml', import.meta.url), 'utf8').replace(/\r\n/g, '\n'),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('RelationshipsXform', () => {
  testXformHelper(expectations);
});
