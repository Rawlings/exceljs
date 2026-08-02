import { readFileSync } from 'node:fs';

import testXformHelper from '../test-xform-helper';

import StylesXform from '../../../../../../../src/formats/xlsx/xml/style/styles-xform';
import XmlStream from '../../../../../../../src/utils/stream/xml-stream';
import styles11 from '#fixtures/json/styles.1.1.json' with { type: 'json' };

function normalizeXml(xml: string): string {
  if (typeof xml !== 'string') return xml;
  let result = xml.replace(/<([^>]+)>/g, (_m, content) => {
    const trimmed = content.trimEnd();
    const selfClosing = trimmed.endsWith('/');
    const inner = selfClosing ? trimmed.slice(0, -1).trim() : trimmed.trim();
    const tagMatch = inner.match(/^([^\s]+)([\s\S]*)$/);
    if (!tagMatch) return _m;
    const tagName = tagMatch[1];
    const attrStr = tagMatch[2].trim();
    if (!attrStr) return `<${tagName}${selfClosing ? '/' : ''}>`;
    const attrRe = /([^\s=]+)=(?:"([^"]*)"|'([^']*)')/g;
    const attrs: string[] = [];
    let am;
    while ((am = attrRe.exec(attrStr)) !== null) attrs.push(am[0]);
    attrs.sort();
    return `<${tagName} ${attrs.join(' ')}${selfClosing ? '/' : ''}>`;
  });
  result = result.replace(/<([^\s/>]+)><\/\1>/g, '<$1/>');
  return result.replace(/>\s+</g, '><').trim();
}

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

      expect(normalizeXml(xmlStream.xml)).to.equal(normalizeXml(expectedXml));
    });
  });
});
