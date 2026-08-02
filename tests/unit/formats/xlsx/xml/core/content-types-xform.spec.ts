import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import ContentTypesXform from '#src/formats/xlsx/xml/core/content-types-xform';

function readXml(name: string): string {
  return readFileSync(new URL(`../../../../../fixtures/xml/${name}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
}

const expectations = [
  {
    title: 'Three Sheets with shared strings',
    create() {
      return new ContentTypesXform();
    },
    preparedModel: {
      worksheets: [{ id: 1 }, { id: 2 }, { id: 3 }],
      media: [],
      drawings: [],
      sharedStrings: { count: 1 },
    },
    xml: readXml('content-types.01.xml'),
    tests: ['render'],
  },
  {
    title: 'Images with shared strings',
    create() {
      return new ContentTypesXform();
    },
    preparedModel: {
      worksheets: [{ id: 1 }, { id: 2 }],
      media: [
        { type: 'image', extension: 'png' },
        { type: 'image', extension: 'jpg' },
      ],
      drawings: [],
      sharedStrings: { count: 1 },
    },
    xml: readXml('content-types.02.xml'),
    tests: ['render'],
  },
  {
    title: 'Three Sheets without shared strings',
    create() {
      return new ContentTypesXform();
    },
    preparedModel: {
      worksheets: [{ id: 1 }, { id: 2 }, { id: 3 }],
      media: [],
      drawings: [],
    },
    xml: readXml('content-types.03.xml'),
    tests: ['render'],
  },
  {
    title: 'Images without shared strings',
    create() {
      return new ContentTypesXform();
    },
    preparedModel: {
      worksheets: [{ id: 1 }, { id: 2, useSharedStrings: false }],
      media: [
        { type: 'image', extension: 'png' },
        { type: 'image', extension: 'jpg' },
      ],
      drawings: [],
    },
    xml: readXml('content-types.04.xml'),
    tests: ['render'],
  },
];

describe('ContentTypesXform', () => {
  testXformHelper(expectations);
});
