import { PassThrough } from 'node:stream';
import CompyXform from './compy-xform';
import BooleanXform from '#src/xlsx/xform/simple/boolean-xform';
import XmlStream from '#src/utils/stream/xml-stream';

function normalizeXml(xml: string): string {
  if (typeof xml !== 'string') return xml;
  return xml
    .replace(/\s+\/>/g, '/>')
    .replace(/<([^>]+)>/g, (_m, content) => '<' + content.replace(/\s+/g, ' ').trim() + '>')
    .replace(/(?<=>)\s+(?=<)/g, '')
    .trim();
}

function cloneValue(val: any): any {
  if (val === undefined || val === null) return val;
  if (val instanceof Date) return new Date(val);
  if (Array.isArray(val)) return val.map(cloneValue);
  if (typeof val === 'object') {
    const res: Record<string, any> = {};
    for (const key of Object.keys(val)) {
      res[key] = cloneValue(val[key]);
    }
    return res;
  }
  return val;
}

function getExpectation(expectation: any, name: string) {
  if (!Object.prototype.hasOwnProperty.call(expectation, name)) {
    throw new Error(`Expectation missing required field: ${name}`);
  }
  return cloneValue(expectation[name]);
}

const its: Record<string, (expectation: any) => void> = {
  prepare(expectation: any) {
    it('Prepare Model', () => {
      const model = getExpectation(expectation, 'initialModel');
      const result = getExpectation(expectation, 'preparedModel');
      const xform = expectation.create();
      xform.prepare(model, expectation.options);
      expect(model).toEqual(result);
    });
  },

  render(expectation: any) {
    it('Render to XML', () => {
      const model = getExpectation(expectation, 'preparedModel');
      const result = getExpectation(expectation, 'xml');
      const xform = expectation.create();
      const xmlStream = new XmlStream();
      xform.render(xmlStream, model, 0);
      expect(normalizeXml(xmlStream.xml)).toBe(normalizeXml(result));
    });
  },

  'prepare-render': function (expectation: any) {
    it('Prepare and Render to XML', () => {
      const model = getExpectation(expectation, 'initialModel');
      const result = getExpectation(expectation, 'xml');
      const xform = expectation.create();
      const xmlStream = new XmlStream();
      xform.prepare(model, expectation.options);
      xform.render(xmlStream, model);
      expect(normalizeXml(xmlStream.xml)).toBe(normalizeXml(result));
    });
  },

  renderIn(expectation: any) {
    it('Render in Composite to XML', () => {
      const model = {
        pre: true,
        child: getExpectation(expectation, 'preparedModel'),
        post: true,
      };
      const result = `<compy><pre/>${getExpectation(expectation, 'xml')}<post/></compy>`;
      const xform = new CompyXform({
        tag: 'compy',
        children: [
          { name: 'pre', xform: new BooleanXform({ tag: 'pre', attr: 'val' }) },
          { name: 'child', xform: expectation.create() },
          { name: 'post', xform: new BooleanXform({ tag: 'post', attr: 'val' }) },
        ],
      });
      const xmlStream = new XmlStream();
      xform.render(xmlStream, model);
      expect(normalizeXml(xmlStream.xml)).toBe(normalizeXml(result));
    });
  },

  parse(expectation: any) {
    it('Parse to Model', async () => {
      const xml = getExpectation(expectation, 'xml');
      const result = getExpectation(expectation, 'parsedModel');
      const xform = expectation.create();
      const stream = new PassThrough();
      const parsePromise = xform.parseStream(stream);
      stream.write(xml);
      stream.end();
      const model = await parsePromise;
      expect(model).toEqual(result);
    });
  },

  parseIn(expectation: any) {
    it('Parse within composite', async () => {
      const xml = `<compy><pre/>${getExpectation(expectation, 'xml')}<post/></compy>`;
      const childXform = expectation.create();
      const result: any = { pre: true };
      result[childXform.tag] = getExpectation(expectation, 'parsedModel');
      result.post = true;
      const xform = new CompyXform({
        tag: 'compy',
        children: [
          { name: 'pre', xform: new BooleanXform({ tag: 'pre', attr: 'val' }) },
          { name: childXform.tag, xform: childXform },
          { name: 'post', xform: new BooleanXform({ tag: 'post', attr: 'val' }) },
        ],
      });
      const stream = new PassThrough();
      const parsePromise = xform.parseStream(stream);
      stream.write(xml);
      stream.end();
      const model = await parsePromise;
      expect(model).toEqual(result);
    });
  },

  reconcile(expectation: any) {
    it('Reconcile Model', () => {
      const model = getExpectation(expectation, 'parsedModel');
      const result = getExpectation(expectation, 'reconciledModel');
      const xform = expectation.create();
      xform.reconcile(model, expectation.options);
      expect(model).toEqual(result);
    });
  },
};

function testXformHelper(expectations: any[]) {
  expectations.forEach((expectation) => {
    const tests = expectation.tests as string[];
    describe(expectation.title, () => {
      tests.forEach((test) => {
        if (its[test]) {
          its[test](expectation);
        }
      });
    });
  });
}

export default testXformHelper;
