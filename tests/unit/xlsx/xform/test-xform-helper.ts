import { PassThrough } from 'node:stream';
import { cloneDeep, each } from '../../../utils/under-dash';
import CompyXform from './compy-xform';

import parseSax from '../../../../src/utils/parse-sax';
import XmlStream from '../../../../src/utils/xml-stream';
import BooleanXform from '../../../../src/xlsx/xform/simple/boolean-xform';

function getExpectation(expectation, name: string) {
  if (!expectation.hasOwnProperty(name)) {
    throw new Error(`Expectation missing required field: ${name}`);
  }
  return cloneDeep(expectation[name]);
}

// ===============================================================================================================
// provides boilerplate examples for the four transform steps: prepare, render,  parse and reconcile
//  prepare: model => preparedModel
//  render:  preparedModel => xml
//  parse:  xml => parsedModel
//  reconcile: parsedModel => reconciledModel

const its: Record<string, (expectation) => void> = {
  prepare(expectation: any) {
    it('Prepare Model', () =>
      new Promise<void>((resolve) => {
        const model = getExpectation(expectation, 'initialModel');
        const result = getExpectation(expectation, 'preparedModel');

        const xform = expectation.create();
        xform.prepare(model, expectation.options);
        expect(cloneDeep(model, false)).to.deep.equal(result);
        resolve(undefined as any);
      }));
  },

  render(expectation: any) {
    it('Render to XML', () =>
      new Promise<void>((resolve) => {
        const model = getExpectation(expectation, 'preparedModel');
        const result = getExpectation(expectation, 'xml');

        const xform = expectation.create();
        const xmlStream = new XmlStream();
        xform.render(xmlStream, model, 0);

        expect(xmlStream.xml).xml.to.equal(result);
        resolve(undefined as any);
      }));
  },

  'prepare-render': function (expectation: any) {
    it('Prepare and Render to XML', () =>
      new Promise<void>((resolve) => {
        const model = getExpectation(expectation, 'initialModel');
        const result = getExpectation(expectation, 'xml');

        const xform = expectation.create();
        const xmlStream = new XmlStream();

        xform.prepare(model, expectation.options);
        xform.render(xmlStream, model);

        expect(xmlStream.xml).xml.to.equal(result);
        resolve(undefined as any);
      }));
  },

  renderIn(expectation: any) {
    it('Render in Composite to XML ', () =>
      new Promise<void>((resolve) => {
        const model = {
          pre: true,
          child: getExpectation(expectation, 'preparedModel'),
          post: true,
        };
        const result = `<compy><pre/>${getExpectation(expectation, 'xml')}<post/></compy>`;

        const xform = new CompyXform({
          tag: 'compy',
          children: [
            {
              name: 'pre',
              xform: new BooleanXform({ tag: 'pre', attr: 'val' }),
            },
            { name: 'child', xform: expectation.create() },
            {
              name: 'post',
              xform: new BooleanXform({ tag: 'post', attr: 'val' }),
            },
          ],
        });

        const xmlStream = new XmlStream();
        xform.render(xmlStream, model);

        expect(xmlStream.xml).xml.to.equal(result);
        resolve(undefined as any);
      }));
  },

  parseIn(expectation: any) {
    it('Parse within composite', () =>
      new Promise<void>((resolve, reject) => {
        const xml = `<compy><pre/>${getExpectation(expectation, 'xml')}<post/></compy>`;
        const childXform = expectation.create();
        const result: any = { pre: true };
        result[childXform.tag] = getExpectation(expectation, 'parsedModel');
        result.post = true;
        const xform = new CompyXform({
          tag: 'compy',
          children: [
            {
              name: 'pre',
              xform: new BooleanXform({ tag: 'pre', attr: 'val' }),
            },
            { name: childXform.tag, xform: childXform },
            {
              name: 'post',
              xform: new BooleanXform({ tag: 'post', attr: 'val' }),
            },
          ],
        });
        const stream = new PassThrough();
        stream.write(xml);
        stream.end();
        xform
          .parse(parseSax(stream))
          .then((model) => {
            const clone = cloneDeep(model, false);
            expect(clone).to.deep.equal(result);
            resolve(undefined as any);
          })
          .catch(reject);
      }));
  },

  parse(expectation: any) {
    it('Parse to Model', () =>
      new Promise<void>((resolve, reject) => {
        const xml = getExpectation(expectation, 'xml');
        const result = getExpectation(expectation, 'parsedModel');

        const xform = expectation.create();

        const stream = new PassThrough();
        stream.write(xml);
        stream.end();
        xform
          .parse(parseSax(stream))
          .then((model) => {
            const clone = cloneDeep(model, false);
            expect(clone).to.deep.equal(result);
            resolve(undefined as any);
          })
          .catch(reject);
      }));
  },

  reconcile(expectation: any) {
    it('Reconcile Model', () =>
      new Promise<void>((resolve) => {
        const model = getExpectation(expectation, 'parsedModel');
        const result = getExpectation(expectation, 'reconciledModel');

        const xform = expectation.create();
        xform.reconcile(model, expectation.options);

        const clone = cloneDeep(model, false);

        expect(clone).to.deep.equal(result);
        resolve(undefined as any);
      }));
  },
};

function testXform(expectations: any[]) {
  each(expectations, (expectation) => {
    const tests = getExpectation(expectation, 'tests');
    describe(expectation.title, () => {
      each(tests, (test: string) => {
        (its as any)[test](expectation);
      });
    });
  });
}

export default testXform;
