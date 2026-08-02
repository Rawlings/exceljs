import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import StylesXform from '#src/xlsx/xform/style/styles-xform';
import XmlStream from '#src/utils/stream/xml-stream';
import styles11 from '#fixtures/json/styles.1.1.json' with { type: 'json' };

function readXml(name: string): string {
  return readFileSync(new URL(`../../../../../fixtures/xml/${name}`, import.meta.url), 'utf8');
}

const expectations = [
  {
    title: 'Styles with fonts',
    create() {
      return new StylesXform();
    },
    preparedModel: styles11,
    xml: readXml('styles.1.2.xml'),
    get parsedModel() {
      return this.preparedModel;
    },
    tests: ['render', 'renderIn', 'parse'],
  },
];

describe('StylesXform', () => {
  testXformHelper(expectations);

  describe('As StyleManager', () => {
    it('Renders empty model', () => {
      const stylesXform = new StylesXform(true);
      const expectedXml = readXml('styles.2.2.xml');

      const xmlStream = new XmlStream();
      stylesXform.render(xmlStream);

      expect(xmlStream.xml).to.equal(expectedXml);
    });
  });
});
