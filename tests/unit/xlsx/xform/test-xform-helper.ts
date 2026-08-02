import { PassThrough } from 'node:stream';
import XmlStream from '#src/utils/stream/xml-stream';

function normalizeXml(xml: string): string {
  if (typeof xml !== 'string') return xml;
  return xml
    .replace(/\s+\/>/g, '/>')
    .replace(/<([^>]+)>/g, (_m, content) => '<' + content.replace(/\s+/g, ' ').trim() + '>')
    .replace(/(?<=>)\s+(?=<)/g, '')
    .trim();
}

function expectXform(xform: any) {
  return {
    to: {
      renderTo(
        model: any,
        result: string,
        xmlStream?: XmlStream,
        options?: any
      ): Promise<void> {
        return new Promise((resolve) => {
          xmlStream = xmlStream || new XmlStream();
          xform.render(xmlStream, model, 0, options);
          expect(normalizeXml(xmlStream.xml)).toBe(result);
          resolve();
        });
      },
      parseTo(xml: string, result: any): Promise<void> {
        return new Promise((resolve) => {
          const stream = new PassThrough();
          const parsePromise = xform.parseStream(stream);

          stream.write(xml);
          stream.end();

          parsePromise
            .then((model: any) => {
              expect(model).toEqual(result);
              resolve();
            })
            .catch((error: any) => {
              expect(error).toBeNull();
              resolve();
            });
        });
      },
      cloneTo(model: any, result: any, match?: boolean): Promise<void> {
        return new Promise((resolve) => {
          const xmlStream = new XmlStream();
          xform.render(xmlStream, model, 0);

          const stream = new PassThrough();
          const parsePromise = xform.parseStream(stream);

          stream.write(xmlStream.xml);
          stream.end();

          parsePromise
            .then((parsedModel: any) => {
              xform.reconcile(parsedModel, {});
              if (match) {
                expect(parsedModel).toMatchObject(result);
              } else {
                expect(parsedModel).toEqual(result);
              }
              resolve();
            })
            .catch((error: any) => {
              expect(error).toBeNull();
              resolve();
            });
        });
      },
    },
  };
}

(expectXform as any).normalizeXml = normalizeXml;
(expectXform as any).expect = (expectXform as any);

export default expectXform;
